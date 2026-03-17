const { Logger, LogLevel } = require('./logger');
const TermDictionary = require('./term-dictionary');
const PatternMatcher = require('./pattern-matcher');
const ContextAnalyzer = require('./context-analyzer');
const ConfidenceScorer = require('./confidence-scorer');
const ConfigurationManager = require('./configuration-manager');

/**
 * @typedef {Object} AnalysisResult
 * @property {boolean} isNSFW
 * @property {number} confidence
 * @property {string[]} detectedTerms
 * @property {string} reasoning
 * @property {Object[]} details
 */

class NSFWDetector {
    constructor(configPath = null, termsPath = null) {
        this.logger = new Logger();
        this.configManager = new ConfigurationManager(this.logger);
        
        if (configPath) {
            this.configManager.loadConfiguration(configPath);
        }
        
        if (this.configManager.get('debug')) {
            this.logger.setLevel(LogLevel.DEBUG);
        }

        this.termDictionary = new TermDictionary(this.logger);
        if (termsPath) {
            this.termDictionary.loadFromFile(termsPath);
        }

        this.patternMatcher = new PatternMatcher();
        this.contextAnalyzer = new ContextAnalyzer();
        this.confidenceScorer = new ConfidenceScorer(this.contextAnalyzer, this.termDictionary);
        
        this.customRules = new Map();
        this.stats = {
            totalAnalyzed: 0,
            nsfwDetected: 0,
            averageConfidence: 0
        };
    }

    /**
     * Analyzes the text to detect NSFW content.
     * @param {string} text 
     * @returns {AnalysisResult}
     */
    analyze(text) {
        this.stats.totalAnalyzed++;
        
        if (typeof text !== 'string' || !text.trim()) {
            return this._createResult(false, 0, [], "Empty or invalid input", []);
        }

        const config = this.configManager.getAll();
        const normalizedText = this.patternMatcher.normalizeText(text);
        
        // Get active terms based on config
        const enabledCategories = config.enabledCategories || ['all'];
        let termsToSearch = [];
        
        if (enabledCategories.includes('all')) {
            termsToSearch = this.termDictionary.getAllTerms().map(t => t.term);
        } else {
            const termsSet = new Set();
            for (const category of enabledCategories) {
                const categoryTerms = this.termDictionary.getCategory(category);
                for (const t of categoryTerms) {
                    termsSet.add(t.term);
                }
            }
            termsToSearch = Array.from(termsSet);
        }

        const matches = this.patternMatcher.findMatches(normalizedText, termsToSearch, config);
        
        if (matches.length === 0) {
            return this._createResult(false, 0, [], "No NSFW terms detected", []);
        }

        let confidence = this.confidenceScorer.calculateScore(matches, normalizedText, config);
        
        // Handle custom rules
        for (const [ruleName, ruleFn] of this.customRules.entries()) {
            try {
                const ruleResult = ruleFn(text, normalizedText, matches, confidence);
                if (typeof ruleResult === 'number') {
                    confidence = Math.max(0, Math.min(1, ruleResult));
                }
            } catch (err) {
                this.logger.error(`Error executing custom rule ${ruleName}: ${err.message}`);
            }
        }

        const isNSFW = confidence >= config.threshold;
        const detectedTerms = Array.from(new Set(matches.map(m => m.term)));
        
        let reasoning = isNSFW 
            ? `Confidence ${confidence.toFixed(2)} exceeds threshold ${config.threshold}. Detected terms: ${detectedTerms.join(', ')}.`
            : `Confidence ${confidence.toFixed(2)} is below threshold ${config.threshold}.`;

        if (isNSFW) this.stats.nsfwDetected++;
        
        // Update rolling average confidence
        this.stats.averageConfidence = 
            ((this.stats.averageConfidence * (this.stats.totalAnalyzed - 1)) + confidence) / this.stats.totalAnalyzed;

        if (config.debug) {
            this.logger.debug(`Analyzed text. NSFW: ${isNSFW}, Confidence: ${confidence}`);
        }

        return this._createResult(isNSFW, confidence, detectedTerms, reasoning, matches);
    }
    
    analyzeBatch(texts) {
        if (!Array.isArray(texts)) return [];
        return texts.map(text => this.analyze(text));
    }

    addCustomRule(ruleName, ruleFn) {
        if (typeof ruleFn === 'function') {
            this.customRules.set(ruleName, ruleFn);
            this.logger.info(`Added custom rule: ${ruleName}`);
        } else {
            this.logger.error(`Failed to add custom rule ${ruleName}: Not a function`);
        }
    }

    getStatistics() {
        return { ...this.stats };
    }

    _createResult(isNSFW, confidence, detectedTerms, reasoning, details) {
        return { isNSFW, confidence, detectedTerms, reasoning, details };
    }
}

module.exports = {
    NSFWDetector,
    TermDictionary,
    PatternMatcher,
    ContextAnalyzer,
    ConfidenceScorer,
    ConfigurationManager,
    Logger,
    LogLevel
};
