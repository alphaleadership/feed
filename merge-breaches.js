const fs = require('fs');
const path = require('path');

const dataPath = 'source/_data/breaches.json';
const secondaryPath = 'source/data/breaches.json';

if (!fs.existsSync(dataPath)) {
    console.log("Fichier non trouvé:", dataPath);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
let breaches = data.breaches;

// Paires de fusion (Garder le nom, supprimer l'autre)
// Note: Les indices peuvent changer, donc on utilise le nom exact
const pairs = [
    { keep: "BreachForums (2025)", remove: "BreachForums2025" },
    { keep: "France Travail (Missions Locales / Jeunes)", remove: "france travail fuite du 2025-12-1" },
    { keep: "France Travail (Dump #3)", remove: "france travail fuite du 2025-10-6" },
    { keep: "France Travail (Dump #2)", remove: "france travail fuite du 2025-9-25" },
    { keep: "Canada Goose", remove: "CanadaGoose" },
    { keep: "E-Pal", remove: "EPal" },
    { keep: "AbuseWith.us", remove: "AbuseWithUs" },
    { keep: "KM.RU", remove: "KMRU" },
    { keep: "Fédération Française de Basket-Ball", remove: "fédération française de basketball" }
];

console.log('--- Début de la fusion des doublons ---');

const toRemove = new Set();

pairs.forEach(pair => {
    const target = breaches.find(b => b && b.Name === pair.keep);
    const source = breaches.find(b => b && b.Name === pair.remove);

    if (target && source) {
        console.log(`Fusion de '${pair.remove}' vers '${pair.keep}'...`);

        // Fusion intelligente
        target.PwnCount = Math.max(target.PwnCount || 0, source.PwnCount || 0);
        target.Description = target.Description || source.Description;
        target.Attribution = target.Attribution || source.Attribution;
        target.LogoPath = target.LogoPath || source.LogoPath;
        target.Domain = target.Domain || source.Domain;
        
        // Fusion des DataClasses
        const mergedDataClasses = new Set([...(target.DataClasses || []), ...(source.DataClasses || [])]);
        target.DataClasses = Array.from(mergedDataClasses);

        // Fusion des catégories
        const mergedCategories = new Set([...(target.categories || []), ...(source.categories || [])]);
        target.categories = Array.from(mergedCategories);

        if (source.lien && !target.lien) target.lien = source.lien;
        if (source.source && !target.source) target.source = source.source;

        // Marquer pour suppression
        toRemove.add(source.Name);
    } else {
        console.log(`[!] Paire non trouvée: '${pair.keep}' (${!!target}) ou '${pair.remove}' (${!!source})`);
    }
});

// Nettoyage et recalcul des index
const initialLength = breaches.length;
data.breaches = breaches.filter(b => !toRemove.has(b.Name));
data.breaches.forEach((b, i) => { b.index = i; });
data.totalBreaches = data.breaches.length;
data.lastUpdated = new Date().toISOString();

console.log(`\nFusion terminée. ${initialLength - data.breaches.length} entrées supprimées.`);

// Sauvegarde
fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
if (fs.existsSync(secondaryPath)) {
    fs.writeFileSync(secondaryPath, JSON.stringify(data, null, 2));
}

console.log('Fichiers mis à jour avec succès.');
