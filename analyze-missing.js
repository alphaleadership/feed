const { execSync } = require('child_process');
const fs = require('fs');
const { getBreachesDB } = require('./scripts/db');

async function run() {
    try {
        // Read directly from git show to avoid Windows redirection encoding issues
        const oldJsonStr = execSync('git show HEAD~1:source/_data/breaches.json', { maxBuffer: 1024 * 1024 * 10 });
        const oldDb = JSON.parse(oldJsonStr.toString('utf8'));
        
        const db = await getBreachesDB();
        const newDb = db.data;

        console.log('Old breaches:', oldDb.breaches.length);
        console.log('New breaches:', newDb.breaches.length);

        const newBreachNames = new Set(newDb.breaches.map(b => b.Name));
        const missingBreaches = (oldDb.breaches || []).filter(b => b && !newBreachNames.has(b.Name));

        console.log('Missing breaches count:', missingBreaches.length);
        const missingManual = missingBreaches.filter(b => b.source === 'Manuel' || b.source === 'Zataz');

        console.log('Missing Manual/Zataz breaches:', missingManual.length);
        missingManual.forEach(b => {
            console.log(`- ${b.Name} | src: ${b.source} | categories: ${JSON.stringify(b.categories)}`);
        });

        // Check what "new" names we gained that weren't in oldDb
        const oldBreachNames = new Set((oldDb.breaches || []).map(b => b && b.Name).filter(Boolean));
        const extraBreaches = (newDb.breaches || []).filter(b => b && !oldBreachNames.has(b.Name));
        console.log('\nExtra breaches count in new DB:', extraBreaches.length);

    } catch (err) {
        console.error(err);
    }
}

run().catch(console.error);
