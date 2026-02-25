const { execSync } = require('child_process');
const fs = require('fs');

try {
  // Read directly from git show to avoid Windows redirection encoding issues
  const oldJsonStr = execSync('git show HEAD~1:source/_data/breaches.json', { maxBuffer: 1024 * 1024 * 10 });
  const oldDb = JSON.parse(oldJsonStr.toString('utf8'));
  const newDb = JSON.parse(fs.readFileSync('source/_data/breaches.json', 'utf8'));

  console.log('Old breaches:', oldDb.breaches.length);
  console.log('New breaches:', newDb.breaches.length);

  const newBreachNames = new Set(newDb.breaches.map(b => b.Name));
  const missingBreaches = oldDb.breaches.filter(b => !newBreachNames.has(b.Name));

  console.log('Missing breaches count:', missingBreaches.length);
  const missingManual = missingBreaches.filter(b => b.source === 'Manuel' || b.source === 'Zataz');

  console.log('Missing Manual/Zataz breaches:', missingManual.length);
  missingManual.forEach(b => {
     console.log(`- ${b.Name} | src: ${b.source} | categories: ${JSON.stringify(b.categories)}`);
  });

  // Check what "new" names we gained that weren't in oldDb
  const oldBreachNames = new Set(oldDb.breaches.map(b => b.Name));
  const extraBreaches = newDb.breaches.filter(b => !oldBreachNames.has(b.Name));
  console.log('\nExtra breaches count in new DB:', extraBreaches.length);

} catch (err) {
  console.error(err);
}
