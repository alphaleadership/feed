const fs = require('fs');

const data = fs.readFileSync('data.txt', 'utf8');
const lines = data.split('\n').filter(line => line.trim() !== '');

const seenSlugs = new Set();
const duplicateSlugs = [];

for (const line of lines) {
    const parts = line.split(':');
    if (parts.length < 2) continue;
    
    const slug = parts.slice(1).join(':').trim(); // Gère les cas où il y a plusieurs ":"
    
    if (slug === 'undefined' || slug === '') continue;

    if (seenSlugs.has(slug)) {
        duplicateSlugs.push(slug);
    } else {
        seenSlugs.add(slug);
    }
}

if (duplicateSlugs.length > 0) {
    fs.appendFileSync('slugs-a-supprimer.txt', '\n' + duplicateSlugs.join('\n') + '\n');
    console.log(`Ajouté ${duplicateSlugs.length} slugs en double à slugs-a-supprimer.txt`);
    console.log('Doublons trouvés:', duplicateSlugs);
} else {
    console.log('Aucun doublon trouvé.');
}
