'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '.');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');
const slugsFile = path.join(baseDir, 'slugs-a-supprimer.txt');

console.log('Chargement des données...');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

// Charger les slugs à supprimer
const slugsToRemove = new Set();
const slugsContent = fs.readFileSync(slugsFile, 'utf-8');
slugsContent.split('\n').forEach(slug => {
  const trimmed = slug.trim().replace(/\r/g, '');
  if (trimmed) {
    slugsToRemove.add(trimmed);
  }
});

console.log(`${slugsToRemove.size} slugs à supprimer chargés.`);
console.log(`Traitement de ${db.breaches.length} fuites...`);

// Filtrer les brèches
const originalCount = db.breaches.length;
db.breaches = db.breaches.filter(breach => {
  if (slugsToRemove.has(breach.slug)) {
    console.log(`  ⊘ Supprimée : ${breach.Name} (slug: ${breach.slug})`);
    return false;
  }
  return true;
});

const removedCount = originalCount - db.breaches.length;

// Mettre à jour la date et le total
db.lastUpdated = new Date().toISOString();
db.totalBreaches = db.breaches.length;

// Sauvegarder
console.log('\nSauvegarde des modifications...');
fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));

console.log('\n✅ Nettoyage terminé !');
console.log(`   - ${removedCount} brèche(s) supprimée(s)`);
console.log(`   - ${db.breaches.length} brèche(s) restante(s)`);
