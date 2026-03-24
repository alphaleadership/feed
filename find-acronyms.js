const fs = require('fs');

const data = fs.readFileSync('data.txt', 'utf8');
const lines = data.split('\n').filter(line => line.trim() !== '');

const entries = lines.map(line => {
    const parts = line.split(':');
    if (parts.length < 2) return null;
    const name = parts[0].trim();
    const slug = parts.slice(1).join(':').trim();
    return { name, slug };
}).filter(e => e && e.slug !== 'undefined');

const normalize = (str) => {
    return str.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/fuite du \d{4}-\d{1,2}-\d{1,2}/g, "")
        .replace(/[^\w\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
};

const getAcronym = (str) => {
    const normalized = normalize(str);
    const words = normalized.split(' ').filter(w => w.length > 3 || (w.length > 0 && !['de', 'la', 'le', 'et', 'des', 'du', 'en'].includes(w)));
    if (words.length < 2) return null;
    return words.map(w => w[0]).join('');
};

const slugsToRemove = new Set();

// 1. Détection via parenthèses : "Nom Complet (ACRO)"
entries.forEach(e => {
    const match = e.name.match(/^(.*?)\s*\((.*?)\)$/);
    if (match) {
        const fullName = normalize(match[1]);
        const acronym = normalize(match[2]);
        
        entries.forEach(other => {
            if (other.slug === e.slug) return;
            const normalizedOther = normalize(other.name);
            if (normalizedOther === fullName || normalizedOther === acronym) {
                slugsToRemove.add(other.slug);
            }
        });
    }
});

// 2. Détection via génération d'acronymes
const nameToEntry = new Map();
entries.forEach(e => {
    const n = normalize(e.name);
    if (!nameToEntry.has(n)) nameToEntry.set(n, []);
    nameToEntry.get(n).push(e);
});

entries.forEach(e => {
    const acro = getAcronym(e.name);
    if (acro && acro.length >= 2) {
        entries.forEach(other => {
            if (other.slug === e.slug) return;
            const normalizedOther = normalize(other.name);
            if (normalizedOther === acro) {
                // On garde l'entrée avec le nom complet, on supprime celle avec juste l'acronyme
                slugsToRemove.add(other.slug);
            }
        });
    }
});

// 3. Détection de doublons par noms normalisés identiques
const seenNormalized = new Map();
entries.forEach(e => {
    const n = normalize(e.name);
    if (seenNormalized.has(n)) {
        const other = seenNormalized.get(n);
        // Si l'un a une date dans le slug et l'autre non, on supprime celui avec la date
        if (e.slug.includes('fuite-du') && !other.slug.includes('fuite-du')) {
            slugsToRemove.add(e.slug);
        } else if (!e.slug.includes('fuite-du') && other.slug.includes('fuite-du')) {
            slugsToRemove.add(other.slug);
            seenNormalized.set(n, e);
        } else {
            // Sinon on garde le plus court (souvent le slug permanent)
            if (e.slug.length > other.slug.length) {
                slugsToRemove.add(e.slug);
            } else {
                slugsToRemove.add(other.slug);
                seenNormalized.set(n, e);
            }
        }
    } else {
        seenNormalized.set(n, e);
    }
});

if (slugsToRemove.size > 0) {
    const result = Array.from(slugsToRemove).join('\n');
    fs.appendFileSync('slugs-a-supprimer.txt', '\n' + result + '\n');
    console.log(`Ajouté ${slugsToRemove.size} slugs (acronymes/doublons) à slugs-a-supprimer.txt`);
    console.log('Slugs identifiés:', Array.from(slugsToRemove));
} else {
    console.log('Aucun doublon ou acronyme trouvé.');
}
