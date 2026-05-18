const fs = require('fs');

const dataPath = 'source/_data/breaches.json';
if (!fs.existsSync(dataPath)) {
    console.log("Fichier non trouvé:", dataPath);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const breaches = data.breaches;

console.log('--- Recherche de doublons par Lien et Nom ---');

const duplicatesByLien = {};
const duplicatesByName = {};

breaches.forEach((b, index) => {
    if (b.lien) {
        if (!duplicatesByLien[b.lien]) duplicatesByLien[b.lien] = [];
        duplicatesByLien[b.lien].push({ index, Name: b.Name, slug: b.slug });
    }
    
    const cleanName = b.Name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!duplicatesByName[cleanName]) duplicatesByName[cleanName] = [];
    duplicatesByName[cleanName].push({ index, Name: b.Name, slug: b.slug, lien: b.lien });
});

console.log('\n[!] Doublons par LIEN :');
Object.entries(duplicatesByLien).forEach(([lien, matches]) => {
    if (matches.length > 1) {
        console.log(`- ${lien}:`);
        matches.forEach(m => console.log(`  - [${m.index}] ${m.Name} (slug: ${m.slug})`));
    }
});

console.log('\n[!] Doublons par NOM (nettoyé) :');
Object.entries(duplicatesByName).forEach(([name, matches]) => {
    if (matches.length > 1) {
        // Filtrer pour ne garder que si les liens sont différents ou si l'un est absent
        const uniqueLiens = new Set(matches.map(m => m.lien));
        if (uniqueLiens.size > 1 || matches.some(m => !m.lien)) {
             console.log(`- ${name}:`);
             matches.forEach(m => console.log(`  - [${m.index}] ${m.Name} (slug: ${m.slug}, lien: ${m.lien})`));
        }
    }
});
