const LogLevel = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

class Logger {
    constructor(level = LogLevel.INFO) {
        this.level = level;
    }

    setLevel(level) {
        this.level = level;
    }

    error(...args) {
        if (this.level >= LogLevel.ERROR) console.error('[NSFW-Detector] [ERROR]', ...args);
    }

    warn(...args) {
        if (this.level >= LogLevel.WARN) console.warn('[NSFW-Detector] [WARN]', ...args);
    }

    info(...args) {
        if (this.level >= LogLevel.INFO) console.info('[NSFW-Detector] [INFO]', ...args);
    }

    debug(...args) {
        if (this.level >= LogLevel.DEBUG) console.debug('[NSFW-Detector] [DEBUG]', ...args);
    }
}

module.exports = { Logger, LogLevel };
