const { execSync } = require('child_process');
const fs = require('fs');
const Fuse = require('fuse.js');
const { getBreachesDB } = require('./scripts/db');

function slugify(text) {
    if (!text) return 'unknown';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
}

async function run() {
    try {
        const oldJsonStr = execSync('git show HEAD~1:source/_data/breaches.json', { maxBuffer: 1024 * 1024 * 10 });
        const oldDb = JSON.parse(oldJsonStr.toString('utf8'));
        
        const db = await getBreachesDB();
        const newDb = db.data;

        console.log('=== Système d\'analyse des brèches ===\n');
        console.log(`Ancienne base: ${oldDb.breaches.length} fuites`);
        console.log(`Nouvelle base: ${newDb.breaches.length} fuites\n`);

        const oldBreaches = oldDb.breaches || [];
        const newBreaches = newDb.breaches || [];

        // 1. Détection des ajouts et suppressions via Slugs
        const oldSlugs = new Map(oldBreaches.filter(b => b).map(b => [b.slug || slugify(b.Name), b]));
        const newSlugs = new Map(newBreaches.filter(b => b).map(b => [b.slug || slugify(b.Name), b]));

        const missingBySlug = [];
        const addedBySlug = [];

        oldSlugs.forEach((b, slug) => {
            if (!newSlugs.has(slug)) missingBySlug.push(b);
        });

        newSlugs.forEach((b, slug) => {
            if (!oldSlugs.has(slug)) addedBySlug.push(b);
        });

        // Utilisation de Fuse pour voir si les "missing" ont juste été renommés
        const newBreachesFuse = new Fuse(newBreaches, { keys: ['Name', 'Title'], threshold: 0.3 });
        
        console.log('--- 1. Analyse des ajouts et modifications ---');
        console.log(`Nouvelles fuites détectées (ajouts purs): ${addedBySlug.length}`);
        addedBySlug.forEach(b => {
            console.log(`  + ${b.Name} (Date: ${b.BreachDate})`);
        });

        console.log(`\nFuites manquantes (suppressions ou renommages): ${missingBySlug.length}`);
        missingBySlug.forEach(b => {
            const possibleRenames = newBreachesFuse.search(b.Name);
            let renameStr = '';
            if (possibleRenames.length > 0 && possibleRenames[0].score < 0.2) {
                renameStr = ` -> Renommé possiblement en: "${possibleRenames[0].item.Name}" (Score: ${possibleRenames[0].score.toFixed(2)})`;
            }
            console.log(`  - ${b.Name} [${b.source || 'Inconnu'}]${renameStr}`);
        });

        // 2. Détection interne de doublons dans la nouvelle base
        console.log('\n--- 2. Détection avancée de doublons dans la nouvelle base ---');
        
        // Par slug
        const slugCounts = {};
        newBreaches.forEach(b => {
            const s = b.slug || slugify(b.Name);
            if (!slugCounts[s]) slugCounts[s] = [];
            slugCounts[s].push(b);
        });

        let exactDups = 0;
        for (const [s, items] of Object.entries(slugCounts)) {
            if (items.length > 1) {
                exactDups++;
                console.log(`[!] Doublon exact de slug "${s}":`);
                items.forEach(i => console.log(`    - ${i.Name} (${i.BreachDate})`));
            }
        }
        if (exactDups === 0) console.log('✓ Aucun doublon exact de slug détecté.');

        // Par fuzzy matching (ressemblance de noms et dates proches)
        console.log('\nRecherche de doublons par similarité (fuzzy)...');
        const fuzzyFuse = new Fuse(newBreaches, { keys: ['Name'], threshold: 0.2, includeScore: true });
        const processed = new Set();
        let fuzzyDups = 0;

        newBreaches.forEach((b, index) => {
            if (processed.has(index)) return;
            const results = fuzzyFuse.search(b.Name).filter(r => r.refIndex !== index && r.score < 0.2);
            
            const bDate = new Date(b.BreachDate);
            const duplicates = results.filter(r => {
                const rDate = new Date(r.item.BreachDate);
                const diffDays = Math.abs(bDate - rDate) / (1000 * 3600 * 24);
                return diffDays <= 180 || isNaN(diffDays); // Proximité de date (6 mois) ou date invalide
            });

            if (duplicates.length > 0) {
                fuzzyDups++;
                processed.add(index);
                console.log(`[?] Doublon potentiel pour "${b.Name}" (${b.BreachDate}) :`);
                duplicates.forEach(d => {
                    processed.add(d.refIndex);
                    console.log(`    ~ ${d.item.Name} (${d.item.BreachDate}) - Score: ${d.score.toFixed(2)}`);
                });
            }
        });

        if (fuzzyDups === 0) console.log('✓ Aucun doublon par similarité détecté.');

        console.log('\nAnalyse terminée.');

    } catch (err) {
        console.error("Erreur lors de l'analyse:", err);
    }
}

run().catch(console.error);
