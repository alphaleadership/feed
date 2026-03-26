const path = require('path');

/**
 * Bridge pour utiliser FastDB (ESM) dans des scripts CommonJS
 */
async function getDB(filePath, defaultData = { breaches: [] }, options = {}) {
    const { FastDB } = await import('../fastdb/database.js');
    const db = new FastDB(filePath, defaultData, options);
    await db.init();
    return db;
}

/**
 * Instance spécifique pour breaches.json
 */
async function getBreachesDB() {
    const baseDir = path.join(__dirname, '..');
    const breachesPath = path.join(baseDir, 'source', '_data', 'breaches.json');
    return getDB(breachesPath, { breaches: [], totalBreaches: 0, lastUpdated: new Date().toISOString() }, {
        primaryKeys: { breaches: 'Name' }
    });
}

module.exports = {
    getDB,
    getBreachesDB
};
