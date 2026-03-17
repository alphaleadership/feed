class ConfidenceScorer {
    /**
     * @param {import('./context-analyzer')} contextAnalyzer 
     * @param {import('./term-dictionary')} termDictionary 
     */
    constructor(contextAnalyzer, termDictionary) {
        this.contextAnalyzer = contextAnalyzer;
        this.termDictionary = termDictionary;
    }

    /**
     * Calculates the overall confidence score for the text based on matches and context.
     * @param {Array<{term: string, index: number, length: number}>} matches 
     * @param {string} normalizedText 
     * @param {Object} config 
     * @returns {number} The final confidence score between 0 and 1
     */
    calculateScore(matches, normalizedText, config = {}) {
        if (!matches || matches.length === 0) return 0;

        let matchScores = [];

        // 1. Calculate individual score for each match
        for (const match of matches) {
            const termDef = this.termDictionary.getTerm(match.term);
            if (!termDef) continue;

            let score = termDef.baseConfidence || 0;

            // Optional: Skip context analysis for high/low confidence terms if configured
            const skipContext = config.lazyContextAnalysis && (score > 0.8 || score < 0.2);
            let context = null;

            if (!skipContext) {
                context = this.contextAnalyzer.analyzeContext(
                    normalizedText, 
                    match.index, 
                    match.length, 
                    config.contextWindowSize || 5
                );

                // Apply generic context modifiers
                if (context.hasNegation) {
                    score -= (config.negationPenalty !== undefined ? config.negationPenalty : 0.4);
                }
                if (context.hasNonNSFWContext) {
                    score -= (config.nonNSFWContextPenalty !== undefined ? config.nonNSFWContextPenalty : 0.3);
                }
                if (context.hasNSFWContext) {
                    score += (config.nsfwContextBonus !== undefined ? config.nsfwContextBonus : 0.2);
                }
            }

            // Clamping score between 0 and 1 for each match before combination
            score = Math.max(0, Math.min(1, score));

            matchScores.push({ match, score, context });
        }

        // 2. Apply proximity multiplier for multiple terms
        const uniqueTerms = new Set(matches.map(m => m.term));
        if (uniqueTerms.size > 1) {
            let hasCloseTerms = false;
            // distance in characters in normalized text
            const proximityDistance = config.proximityDistance || 100; 
            
            for (let i = 0; i < matches.length; i++) {
                for (let j = i + 1; j < matches.length; j++) {
                    const dist = Math.abs(matches[i].index - matches[j].index);
                    if (dist < proximityDistance) {
                        hasCloseTerms = true;
                        break;
                    }
                }
                if (hasCloseTerms) break;
            }

            if (hasCloseTerms) {
                const multiplier = config.proximityMultiplier || 1.2;
                matchScores = matchScores.map(ms => ({
                    ...ms,
                    score: Math.min(1, ms.score * multiplier)
                }));
            }
        }

        // 3. Combine scores using probabilistic OR (1 - product(1 - score_i))
        let finalScore = 0;
        for (const ms of matchScores) {
            finalScore = finalScore + ms.score - (finalScore * ms.score);
        }

        return Math.max(0, Math.min(1, finalScore));
    }
}

module.exports = ConfidenceScorer;
