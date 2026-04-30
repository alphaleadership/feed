const fs = require('fs');
const data = JSON.parse(fs.readFileSync('source/_data/breaches.json', 'utf8'));
const names = ['ldlc', 'plex', 'adecco', 'ledger', 'substack'];
names.forEach(name => {
    const matches = data.breaches.filter(b => b.Name.toLowerCase() === name);
    matches.forEach(m => console.log(`${m.Name}: slug='${m.slug}', date='${m.BreachDate}'`));
});
