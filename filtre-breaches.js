const fs = require('fs');
const path = require('path');
const JSONStream = require('jsonstream');

// Le terme de recherche est le premier argument de la ligne de commande
const searchTerm = process.argv[2];

if (!searchTerm) {
  console.log('Usage: node filtre-breaches.js <terme_de_recherche>');
  process.exit(1);
}

const filePath = path.join(__dirname, 'source', '_data', 'breaches.json');

console.log(`Recherche de "${searchTerm}" dans ${filePath}...
`);

const stream = fs.createReadStream(filePath, { encoding: 'utf8' });
const parser = JSONStream.parse('breaches.*');

let count = 0;

stream.pipe(parser);

parser.on('data', (data) => {
  // Recherche insensible à la casse dans le nom de la brèche
  if (data.Name && data.Name.toLowerCase().includes(searchTerm.toLowerCase())) {
    console.log(JSON.stringify(data, null, 2));
    console.log('---');
    count++;
  }
});

parser.on('end', () => {
  console.log(`
Recherche terminée. ${count} résultat(s) trouvé(s).`);
});

stream.on('error', (err) => {
  console.error("Erreur de lecture du fichier:", err);
});

parser.on('error', (err) => {
  console.error("Erreur de parsing JSON:", err);
});
