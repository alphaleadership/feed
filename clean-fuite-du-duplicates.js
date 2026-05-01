const fs = require('fs');

const dataPath = 'source/_data/breaches.json';
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const breaches = data.breaches;

const nameGroups = new Map();

breaches.forEach(b => {
    const name = b.Name.toLowerCase().trim();
    if (!nameGroups.has(name)) {
        nameGroups.set(name, []);
    }
    nameGroups.get(name).push(b);
});

const slugsToDelete = [];

console.log('--- Analyse des doublons pour suppression "fuite du" ---');

nameGroups.forEach((group, name) => {
    if (group.length > 1) {
        const hasFuiteDu = group.filter(b => b.slug && b.slug.includes('fuite-du'));
        const hasNoFuiteDu = group.filter(b => !b.slug || !b.slug.includes('fuite-du'));

        if (hasFuiteDu.length > 0 && hasNoFuiteDu.length > 0) {
            console.log(`\nDoublon trouvé pour: ${name}`);
            hasFuiteDu.forEach(b => {
                console.log(`  [A VIRER] Slug: ${b.slug} (Date: ${b.BreachDate})`);
                slugsToDelete.push(b.slug);
            });
            hasNoFuiteDu.forEach(b => {
                console.log(`  [GARDER]  Slug: ${b.slug} (Date: ${b.BreachDate})`);
            });
        }
    }
});

if (slugsToDelete.length > 0) {
    const deleteFilePath = 'slugs-a-supprimer.txt';
    let currentContent = '';
    if (fs.existsSync(deleteFilePath)) {
        currentContent = fs.readFileSync(deleteFilePath, 'utf8');
    }
    
    const newContent = currentContent + (currentContent.endsWith('\n') ? '' : '\n') + slugsToDelete.join('\n') + '\n';
    fs.writeFileSync(deleteFilePath, newContent);
    console.log(`\nSuccès: ${slugsToDelete.length} slugs ajoutés à ${deleteFilePath}`);
} else {
    console.log('\nAucun doublon avec "fuite du" à supprimer trouvé.');
}
