const fs = require('fs');

class ConfigurationManager {
    constructor(logger) {
        this.logger = logger;
        this.config = this.getDefaultConfig();
    }

    getDefaultConfig() {
        return {
            threshold: 0.7,
            lazyContextAnalysis: false,
            contextWindowSize: 5,
            proximityDistance: 100,
            proximityMultiplier: 1.2,
            negationPenalty: 0.4,
            nonNSFWContextPenalty: 0.3,
            nsfwContextBonus: 0.2,
            enabledCategories: ['all'],
            debug: false
        };
    }

    loadConfiguration(configPath) {
        try {
            if (fs.existsSync(configPath)) {
                const data = fs.readFileSync(configPath, 'utf8');
                const loadedConfig = JSON.parse(data);
                this.updateConfiguration(loadedConfig);
                if (this.logger) this.logger.info(`Loaded configuration from ${configPath}`);
                return true;
            } else {
                if (this.logger) this.logger.warn(`Configuration file not found at ${configPath}, using defaults.`);
                return false;
            }
        } catch (error) {
            if (this.logger) this.logger.error(`Failed to load configuration from ${configPath}: ${error.message}`);
            return false;
        }
    }

    updateConfiguration(newConfig) {
        if (!newConfig || typeof newConfig !== 'object') return;
        this.config = { ...this.config, ...newConfig };
    }

    get(key) {
        return this.config[key];
    }

    getAll() {
        return { ...this.config };
    }
}

module.exports = ConfigurationManager;
