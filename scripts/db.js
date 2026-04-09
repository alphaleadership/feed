const path = require('path');
const fs = require('fs');

/**
 * Charge les slugs à supprimer depuis le fichier
 */
function loadBlacklistedSlugs() {
    const baseDir = process.cwd();
    const slugsFile = path.join(baseDir, 'slugs-a-supprimer.txt');
    
    const slugsToRemove = new Set();
    if (fs.existsSync(slugsFile)) {
        try {
            const content = fs.readFileSync(slugsFile, 'utf-8');
            content.split('\n').forEach(slug => {
                const trimmed = slug.trim().replace(/\r/g, '');
                if (trimmed) {
                    slugsToRemove.add(trimmed);
                }
            });
        } catch (err) {
            console.warn('Avertissement: Impossible de charger les slugs à supprimer', err.message);
        }
    }
    return slugsToRemove;
}

/**
 * Bridge pour utiliser FastDB (ESM) dans des scripts CommonJS
 */
async function getDB(filePath, defaultData = { breaches: [] }, options = {}) {
    const { FastDB } = await import('../fastdb/database.js');
    const db = new FastDB(filePath, defaultData, options);
    await db.init();
    return db;
}

let breachesDBInstance = null;

/**
 * Instance spécifique pour breaches.json
 */
async function getBreachesDB() {
    if (breachesDBInstance) return breachesDBInstance;

    const baseDir = process.cwd();
    const breachesPath = path.join(baseDir, 'source', '_data', 'breaches.json');
    breachesDBInstance = await getDB(breachesPath, { breaches: [], totalBreaches: 0, lastUpdated: new Date().toISOString() }, {
        primaryKeys: { breaches: 'Name' }
    });
    
    // Charger les slugs à supprimer
    const blacklistedSlugs = loadBlacklistedSlugs();
    
    // Filtrer les brèches avec des slugs à supprimer
    if (blacklistedSlugs.size > 0 && breachesDBInstance.data.breaches) {
        const beforeFilter = breachesDBInstance.data.breaches.length;
        breachesDBInstance.data.breaches = breachesDBInstance.data.breaches.filter(breach => {
            if (blacklistedSlugs.has(breach.slug)) {
                console.log(`[DB] Filtre automatique : ${breach.Name} (slug: ${breach.slug})`);
                return false;
            }
            return true;
        });
        
        const removedCount = beforeFilter - breachesDBInstance.data.breaches.length;
        if (removedCount > 0) {
            console.log(`[DB] ${removedCount} brèche(s) filtrée(s) automatiquement`);
            breachesDBInstance.data.totalBreaches = breachesDBInstance.data.breaches.length;
        }
    }
    
    return breachesDBInstance;
}

module.exports = {
    getDB,
    getBreachesDB,
    loadBlacklistedSlugs
};
