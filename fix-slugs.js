const fs = require('fs');

// 1. Charger et filtrer le fichier actuel pour retirer les erreurs (France Travail, etc.)
let currentSlugs = fs.readFileSync('slugs-a-supprimer.txt', 'utf8')
    .split('\n')
    .map(s => s.trim())
    .filter(s => s !== '' && !s.includes('france-travail'));

// 2. Ré-analyser data.txt avec une logique plus prudente
const data = fs.readFileSync('data.txt', 'utf8');
const lines = data.split('\n').filter(line => line.trim() !== '');

const entries = lines.map(line => {
    const parts = line.split(':');
    if (parts.length < 2) return null;
    const name = parts[0].trim();
    const slug = parts.slice(1).join(':').trim();
    return { name, slug };
}).filter(e => e && e.slug !== 'undefined');

const slugsToRemove = new Set(currentSlugs);

// Doublons de slugs exacts (Cas critique : le même fichier pour deux noms différents)
const seenSlugs = new Map();
entries.forEach(e => {
    if (seenSlugs.has(e.slug)) {
        slugsToRemove.add(e.slug);
    } else {
        seenSlugs.set(e.slug, e.name);
    }
});

// Acronymes : Uniquement si l'acronyme et le nom complet pointent vers le même slug ou un slug quasi identique
entries.forEach(e => {
    const match = e.name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        const acronym = match[2].toLowerCase();
        entries.forEach(other => {
            if (other.slug === e.slug) return;
            if (other.name.toLowerCase() === acronym) {
                // Si l'entrée courte n'a pas plus d'info que l'entrée longue, on la supprime
                slugsToRemove.add(other.slug);
            }
        });
    }
});

// Sauvegarde du fichier propre
fs.writeFileSync('slugs-a-supprimer.txt', Array.from(slugsToRemove).join('\n') + '\n');
console.log(`Fichier slugs-a-supprimer.txt mis à jour. Nombre total de slugs à supprimer : ${slugsToRemove.size}`);
console.log('Slugs conservés dans la liste :', Array.from(slugsToRemove));
