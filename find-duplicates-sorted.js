const fs = require('fs');
const lines = fs.readFileSync('sorted_data.txt', 'utf8').split('\n').filter(l => l.trim());

console.log('--- Doublons dans data.txt (triés) ---');
const seen = new Map();
const duplicates = [];

lines.forEach(line => {
    const parts = line.split(':');
    const name = parts[0].toLowerCase().trim();
    const slug = parts[1] ? parts[1].toLowerCase().trim() : '';
    
    const key = name + '|' + slug;
    
    if (seen.has(key)) {
        duplicates.push(line);
    } else {
        seen.set(key, line);
    }
});

if (duplicates.length > 0) {
    console.log(`Trouvé ${duplicates.length} doublons exacts (Nom:Slug):`);
    duplicates.forEach(d => console.log(`  - ${d}`));
} else {
    console.log('Aucun doublon exact (Nom:Slug) trouvé.');
}

console.log('\n--- Doublons par Nom uniquement (Casse insensible) ---');
const seenNames = new Map();
const nameDuplicates = [];

lines.forEach(line => {
    const parts = line.split(':');
    const name = parts[0].toLowerCase().trim();
    
    if (seenNames.has(name)) {
        nameDuplicates.push({ current: line, original: seenNames.get(name) });
    } else {
        seenNames.set(name, line);
    }
});

if (nameDuplicates.length > 0) {
    console.log(`Trouvé ${nameDuplicates.length} doublons par Nom:`);
    nameDuplicates.forEach(d => {
        console.log(`  - ${d.current}  <--  ${d.original}`);
    });
}
