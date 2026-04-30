const fs = require('fs');

const dataPath = 'source/_data/breaches.json';
if (!fs.existsSync(dataPath)) {
    console.log("Fichier non trouvé:", dataPath);
    process.exit(1);
}

const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const breaches = data.breaches;

console.log('--- Recherche approfondie de doublons ---');

// 1. Recherche par nom (insensible à la casse)
const namesLower = breaches.map(b => b.Name.toLowerCase());
const duplicatesName = namesLower.filter((name, index) => namesLower.indexOf(name) !== index);
if (duplicatesName.length > 0) {
    console.log('\n[!] Doublons trouvés par Nom (insensible à la casse) :');
    const uniqueDupNames = [...new Set(duplicatesName)];
    uniqueDupNames.forEach(dup => {
        const matches = breaches.filter(b => b.Name.toLowerCase() === dup).map(b => b.Name);
        console.log(`  - ${matches.join(' <-> ')}`);
    });
} else {
    console.log('Aucun doublon trouvé par Nom (insensible à la casse).');
}

// 2. Recherche par Slug
const slugs = breaches.map(b => b.slug).filter(s => s);
const duplicatesSlug = slugs.filter((slug, index) => slugs.indexOf(slug) !== index);
if (duplicatesSlug.length > 0) {
    console.log('\n[!] Doublons trouvés par Slug :');
    const uniqueDupSlugs = [...new Set(duplicatesSlug)];
    uniqueDupSlugs.forEach(dup => {
        const matches = breaches.filter(b => b.slug === dup).map(b => b.Name);
        console.log(`  - Slug '${dup}': ${matches.join(' <-> ')}`);
    });
} else {
    console.log('Aucun doublon trouvé par Slug.');
}

// 3. Recherche par similitude (ex: "MySpace" vs "MySpace-com")
// (Algorithme très basique pour chercher des noms qui contiennent un autre nom)
console.log('\n[?] Recherche par similitude (noms qui se chevauchent)...');
let similarityCount = 0;
const sortedNames = [...new Set(breaches.map(b => b.Name))].sort((a, b) => a.length - b.length);

// Pour éviter trop de faux positifs, on limite la recherche.
// On cherche si un nom plus long contient un nom plus court (ex: "Facebook" et "Facebook 2019")
const similarities = [];
for (let i = 0; i < sortedNames.length; i++) {
    const shortName = sortedNames[i];
    if (shortName.length < 5) continue; // Ignorer les mots très courts
    
    for (let j = i + 1; j < sortedNames.length; j++) {
        const longName = sortedNames[j];
        if (longName.toLowerCase().includes(shortName.toLowerCase())) {
            similarities.push(`'${shortName}' est dans '${longName}'`);
        }
    }
}

similarities.sort();
console.log(`\n[?] ${similarities.length} similitudes trouvées (triées) :`);
similarities.forEach(s => console.log(`  - Similitude possible: ${s}`));
