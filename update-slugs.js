const fs = require('fs');

function readJsonFile(filePath) {
    const buffer = fs.readFileSync(filePath);
    let content;
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
        content = buffer.toString('utf16le');
    } else {
        content = buffer.toString('utf8');
    }
    return JSON.parse(content.replace(/^\uFEFF/, ''));
}

const oldData = readJsonFile('temp_old_breaches.json');
const removedNames = [
    "BreachForums2025",
    "france travail fuite du 2025-12-1",
    "france travail fuite du 2025-10-6",
    "france travail fuite du 2025-9-25",
    "CanadaGoose",
    "EPal",
    "AbuseWithUs",
    "KMRU",
    "basketball"
];

const slugs = oldData.breaches
    .filter(b => {
        const name = b.Name.toLowerCase();
        return removedNames.some(rn => name.includes(rn.toLowerCase()));
    })
    .map(b => b.slug)
    .filter(s => s && s !== 'undefined');

const currentContent = fs.readFileSync('slugs-a-supprimer.txt', 'utf8');
const currentSlugs = currentContent.split('\n').map(s => s.trim()).filter(s => s);
const newSlugs = [...new Set([...currentSlugs, ...slugs])].sort();

fs.writeFileSync('slugs-a-supprimer.txt', newSlugs.join('\n') + '\n');
console.log(`Ajouté ${slugs.length} slugs extraits. Total unique dans le fichier: ${newSlugs.length}`);
console.log('Slugs extraits:', slugs);
