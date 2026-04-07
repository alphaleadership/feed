const fs = require('fs');

/**
 * @typedef {Object} TermDefinition
 * @property {string} term
 * @property {string} category
 * @property {number} baseConfidence
 * @property {string[]} [variations]
 * @property {string[]} [synonyms]
 * @property {Object} [contextModifiers]
 */

class TermDictionary {
    constructor(logger) {
        this.logger = logger;
        this.terms = new Map();
        this.categories = new Map();
    }

    /**
     * Load terms from a JSON file.
     * @param {string} filePath 
     * @returns {boolean}
     */
    loadFromFile(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(data);
            this.loadTerms(parsed);
            if (this.logger) this.logger.info(`Loaded terms from ${filePath}`);
            return true;
        } catch (error) {
            if (this.logger) this.logger.error(`Failed to load terms from ${filePath}: ${error.message}`);
            return false;
        }
    }

    /**
     * Load terms from an object.
     * @param {Object} termsData 
     */
    loadTerms(termsData) {
        this.terms.clear();
        this.categories.clear();

        for (const [categoryName, categoryTerms] of Object.entries(termsData)) {
            if (!this.categories.has(categoryName)) {
                this.categories.set(categoryName, []);
            }

            for (const termObj of categoryTerms) {
                termObj.category = categoryName;
                const termKey = termObj.term.toLowerCase();
                
                // Keep the original object as the primary definition
                this.terms.set(termKey, termObj);
                this.categories.get(categoryName).push(termObj);

                // Add variations and synonyms linking to the main term
                if (termObj.variations) {
                    for (const variation of termObj.variations) {
                        this.terms.set(variation.toLowerCase(), termObj);
                    }
                }
                
                if (termObj.synonyms) {
                    for (const synonym of termObj.synonyms) {
                        this.terms.set(synonym.toLowerCase(), termObj);
                    }
                }
            }
        }
    }

    /**
     * Retrieve a term definition.
     * @param {string} word 
     * @returns {TermDefinition|undefined}
     */
    getTerm(word) {
        return this.terms.get(word.toLowerCase());
    }

    /**
     * Retrieve all terms in a category.
     * @param {string} categoryName 
     * @returns {TermDefinition[]}
     */
    getCategory(categoryName) {
        return this.categories.get(categoryName) || [];
    }

    /**
     * Return all terms across categories.
     * @returns {TermDefinition[]}
     */
    getAllTerms() {
        const all = new Set();
        for (const term of this.terms.values()) {
            all.add(term);
        }
        return Array.from(all);
    }
}

module.exports = TermDictionary;
