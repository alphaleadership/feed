/**
 * @typedef {Object} ContextAnalysisResult
 * @property {string[]} windowWords
 * @property {boolean} hasNegation
 * @property {boolean} hasNonNSFWContext
 * @property {boolean} hasNSFWContext
 */

class ContextAnalyzer {
    constructor() {
        this.negationWords = new Set([
            'not', 'no', 'without', 'never', 'avoid', 'prevent', 'non', 'anti', 'lack', 'zero', // English
            'pas', 'non', 'sans', 'jamais', 'éviter', 'prévenir', 'aucun', 'manque', 'zéro' // French
        ]);
        
        // Context words to reduce false positives in data breach contexts
        this.nonNSFWContextWords = new Set([
            'security', 'breach', 'hash', 'password', 'database', 'leak', 
            'education', 'medical', 'health', 'forum', 'game', 'gaming',// English
            'sécurité', 'fuite', 'hachage', 'mot de passe', 'base de données', 'fuite de données',
            'éducation', 'médical', 'santé', 'forum', 'jeu', 'plateforme' // French
        ]);
        
        // Context words to increase confidence
        this.nsfwContextWords = new Set([
            'xxx', 'porn', 'adult', 'escort', 'cam', 'nude', 'sex', 'hookup', 'dating', // English
            'xxx', 'porno', 'adulte', 'escorte', 'cam', 'nu', 'sexe', 'rencontre', 'libertinage' // French
        ]);
    }

    /**
     * Extracts a window of words around a given match index and analyzes it.
     * @param {string} normalizedText The full normalized text
     * @param {number} matchIndex The character index of the match
     * @param {number} matchLength The length of the match
     * @param {number} windowSize The number of words to extract before and after (default 5)
     * @returns {ContextAnalysisResult}
     */
    analyzeContext(normalizedText, matchIndex, matchLength, windowSize = 5) {
        const windowWords = this.extractWindow(normalizedText, matchIndex, matchLength, windowSize);
        
        let hasNegation = false;
        let hasNonNSFWContext = false;
        let hasNSFWContext = false;

        for (const word of windowWords) {
            if (this.negationWords.has(word)) hasNegation = true;
            if (this.nonNSFWContextWords.has(word)) hasNonNSFWContext = true;
            if (this.nsfwContextWords.has(word)) hasNSFWContext = true;
        }

        return {
            windowWords,
            hasNegation,
            hasNonNSFWContext,
            hasNSFWContext
        };
    }

    /**
     * Extracts words surrounding the matched term.
     * @param {string} text 
     * @param {number} index 
     * @param {number} length 
     * @param {number} windowSize 
     * @returns {string[]}
     */
    extractWindow(text, index, length, windowSize) {
        const beforeText = text.substring(0, index).trim();
        const afterText = text.substring(index + length).trim();

        const beforeWords = beforeText ? beforeText.split(/\s+/) : [];
        const afterWords = afterText ? afterText.split(/\s+/) : [];

        const windowBefore = beforeWords.slice(-windowSize);
        const windowAfter = afterWords.slice(0, windowSize);

        return [...windowBefore, ...windowAfter];
    }
}

module.exports = ContextAnalyzer;
