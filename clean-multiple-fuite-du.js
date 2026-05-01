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

console.log('--- Recherche de doublons "fuite du" multiples ---');

nameGroups.forEach((group, name) => {
    if (group.length > 1) {
        const fuiteDuEntries = group.filter(b => b.slug && b.slug.includes('fuite-du'));
        
        if (fuiteDuEntries.length > 1) {
            console.log(`\nDoublon multiple trouvé pour: ${name}`);
            // Trier par date décroissante pour garder la plus récente
            fuiteDuEntries.sort((a, b) => {
                const dateA = a.BreachDate ? new Date(a.BreachDate) : new Date(0);
                const dateB = b.BreachDate ? new Date(b.BreachDate) : new Date(0);
                return dateB - dateA;
            });

            console.log(`  [GARDER] Slug: ${fuiteDuEntries[0].slug} (Date: ${fuiteDuEntries[0].BreachDate})`);
            
            for (let i = 1; i < fuiteDuEntries.length; i++) {
                console.log(`  [A VIRER] Slug: ${fuiteDuEntries[i].slug} (Date: ${fuiteDuEntries[i].BreachDate})`);
                slugsToDelete.push(fuiteDuEntries[i].slug);
            }
        }
    }
});

if (slugsToDelete.length > 0) {
    const deleteFilePath = 'slugs-a-supprimer.txt';
    let currentContent = fs.readFileSync(deleteFilePath, 'utf8');
    const newContent = currentContent + (currentContent.endsWith('\n') ? '' : '\n') + slugsToDelete.join('\n') + '\n';
    fs.writeFileSync(deleteFilePath, newContent);
    console.log(`\nSuccès: ${slugsToDelete.length} slugs supplémentaires ajoutés.`);
} else {
    console.log('\nAucun autre doublon avec plusieurs "fuite du" trouvé.');
}
