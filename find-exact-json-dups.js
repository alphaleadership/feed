const fs = require('fs');
const data = JSON.parse(fs.readFileSync('source/_data/breaches.json', 'utf8'));
const breaches = data.breaches;

const seen = new Map();
const duplicates = [];

breaches.forEach(b => {
    const key = `${b.Name.toLowerCase()}|${b.BreachDate}`;
    if (seen.has(key)) {
        duplicates.push({ current: b, original: seen.get(key) });
    } else {
        seen.set(key, b);
    }
});

console.log('--- Doublons (Même Nom + Même Date) dans breaches.json ---');
if (duplicates.length > 0) {
    duplicates.forEach(d => {
        console.log(`- ${d.current.Name} (${d.current.BreachDate})`);
        console.log(`  Slug 1: ${d.original.slug}`);
        console.log(`  Slug 2: ${d.current.slug}`);
    });
} else {
    console.log('Aucun doublon exact (Nom + Date) trouvé.');
}
