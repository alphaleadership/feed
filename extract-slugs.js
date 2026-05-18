const fs = require('fs');
const oldData = JSON.parse(fs.readFileSync('temp_old_breaches.json', 'utf8'));
const removedNames = [
    "BreachForums2025",
    "france travail fuite du 2025-12-1",
    "france travail fuite du 2025-10-6",
    "france travail fuite du 2025-9-25",
    "CanadaGoose",
    "EPal",
    "AbuseWithUs",
    "KMRU",
    "fédération française de basketball"
];

const slugs = oldData.breaches
    .filter(b => removedNames.includes(b.Name))
    .map(b => b.slug)
    .filter(s => s && s !== 'undefined');

console.log(slugs.join('\n'));
