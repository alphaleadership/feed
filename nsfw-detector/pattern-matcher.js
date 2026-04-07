class PatternMatcher {
    constructor() {
        this.regexCache = new Map();
    }

    /**
     * Normalizes text by lowercasing, accents, punctuation, and standardizing whitespace.
     * @param {string} text 
     * @returns {string}
     */
    normalizeText(text) {
        if (!text || typeof text !== 'string') return '';
        
        return text
            .toLowerCase()
            // Remove accents/diacritics
            .normalize("NFD").replace(/[̀-ͯ]/g, "")
            // Replace non-alphanumeric characters with spaces
            .replace(/[^a-z0-9\s]/gi, " ")
            // Standardize whitespace
            .replace(/\s+/g, " ")
            .trim();
    }

    /**
     * Finds matches for the given terms in the text.
     * @param {string} text The text to search in (should be normalized)
     * @param {string[]} terms List of terms to search for (should be normalized)
     * @param {Object} options Options for matching
     * @returns {Array<{term: string, index: number, length: number}>}
     */
    findMatches(text, terms, options = {}) {
        if (!text || !terms || terms.length === 0) return [];
        
        const matches = [];

        for (const term of terms) {
            const regex = this._getRegexForTerm(term);
            let match;
            
            while ((match = regex.exec(text)) !== null) {
                matches.push({
                    term: term,
                    index: match.index,
                    length: match[0].length
                });
            }
        }

        return matches;
    }

    /**
     * Gets a cached RegExp for a term, or creates and caches a new one.
     * @private
     * @param {string} term 
     * @returns {RegExp}
     */
    _getRegexForTerm(term) {
        if (this.regexCache.has(term)) {
            // Reset lastIndex because 'g' flag is stateful
            const regex = this.regexCache.get(term);
            regex.lastIndex = 0;
            return regex;
        }

        // Escape regex special characters in the term just in case,
        // though terms should be normalized.
        const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Use word boundaries for exact word/phrase matching
        const regex = new RegExp(`\\b${escapedTerm}\\b`, 'g');
        this.regexCache.set(term, regex);
        return regex;
    }
}

module.exports = PatternMatcher;
