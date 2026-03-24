const fs = require('fs');

const DATA_FILE = 'data.txt';
const OUTPUT_FILE = 'slugs-a-supprimer.txt';

if (!fs.existsSync(DATA_FILE)) {
    console.error(`Erreur: ${DATA_FILE} n'existe pas.`);
    process.exit(1);
}

const data = fs.readFileSync(DATA_FILE, 'utf8');
const lines = data.split('\n').filter(line => line.trim() !== '');

const entries = lines.map(line => {
    const parts = line.split(':');
    if (parts.length < 2) return null;
    const name = parts[0].trim();
    const slug = parts.slice(1).join(':').trim();
    return { name, slug };
}).filter(e => e && e.slug !== 'undefined' && e.slug !== '');

const slugsToRemove = new Set();

// 1. Détection des doublons de slugs exacts
const seenSlugs = new Map();
entries.forEach(e => {
    // Exception France Travail : On garde toutes les fuites datées car elles sont distinctes
    if (e.slug.includes('france-travail')) return;

    if (seenSlugs.has(e.slug)) {
        slugsToRemove.add(e.slug);
    } else {
        seenSlugs.set(e.slug, e.name);
    }
});

// 2. Détection par acronymes explicites : "Nom Complet (ACRO)"
entries.forEach(e => {
    const match = e.name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        const acronym = match[2].toLowerCase();
        entries.forEach(other => {
            if (other.slug === e.slug) return;
            if (other.name.toLowerCase() === acronym) {
                // Supprime l'entrée courte (acronyme seul) car l'entrée complète existe
                slugsToRemove.add(other.slug);
            }
        });
    }
});

// 3. Cas spécifiques de doublons avec/sans date pour la même organisation
// On ne traite que si le nom est EXACTEMENT le même (pour ne pas casser France Travail)
const nameMap = new Map();
entries.forEach(e => {
    const nameLower = e.name.toLowerCase();
    if (nameMap.has(nameLower)) {
        const prev = nameMap.get(nameLower);
        // Si l'un a une date et l'autre non, on pourrait vouloir nettoyer, 
        // mais pour l'instant on se contente des doublons de SLUGS (point 1)
    } else {
        nameMap.set(nameLower, e);
    }
});

if (slugsToRemove.size > 0) {
    const result = Array.from(slugsToRemove).sort().join('\n');
    fs.writeFileSync(OUTPUT_FILE, result + '\n');
    console.log(`Mis à jour ${OUTPUT_FILE} : ${slugsToRemove.size} slugs identifiés.`);
} else {
    console.log('Aucun doublon à supprimer.');
    if (fs.existsSync(OUTPUT_FILE)) fs.writeFileSync(OUTPUT_FILE, '');
}
