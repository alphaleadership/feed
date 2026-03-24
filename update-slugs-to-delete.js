const fs = require('fs');

const DATA_FILE = 'data.txt';
const OUTPUT_FILE = 'slugs-a-supprimer.txt';

if (!fs.existsSync(DATA_FILE)) {
    console.error(`Erreur: ${DATA_FILE} n'existe pas.`);
    process.exit(1);
}

// 1. Charger les slugs déjà présents pour ne pas les supprimer
let existingSlugs = new Set();
if (fs.existsSync(OUTPUT_FILE)) {
    const content = fs.readFileSync(OUTPUT_FILE, 'utf8');
    content.split('\n').forEach(s => {
        const trimmed = s.trim();
        if (trimmed) existingSlugs.add(trimmed);
    });
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

const newSlugsFound = new Set();

// 2. Détection des doublons de slugs exacts (Exclusion France Travail)
const seenSlugs = new Map();
entries.forEach(e => {
    if (e.slug.includes('france-travail')) return;

    if (seenSlugs.has(e.slug)) {
        if (!existingSlugs.has(e.slug)) {
            newSlugsFound.add(e.slug);
        }
    } else {
        seenSlugs.set(e.slug, e.name);
    }
});

// 3. Détection par acronymes explicites
entries.forEach(e => {
    const match = e.name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        const acronym = match[2].toLowerCase();
        entries.forEach(other => {
            if (other.slug === e.slug) return;
            if (other.name.toLowerCase() === acronym) {
                if (!existingSlugs.has(other.slug)) {
                    newSlugsFound.add(other.slug);
                }
            }
        });
    }
});

// 4. Fusion et sauvegarde (Ajout uniquement)
if (newSlugsFound.size > 0) {
    const allSlugs = new Set([...existingSlugs, ...newSlugsFound]);
    const result = Array.from(allSlugs).sort().join('\n');
    fs.writeFileSync(OUTPUT_FILE, result + '\n');
    console.log(`Ajouté ${newSlugsFound.size} nouveaux slugs à ${OUTPUT_FILE}.`);
} else {
    console.log('Aucun nouveau doublon à ajouter.');
}
