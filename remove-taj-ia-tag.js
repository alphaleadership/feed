'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '.');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

console.log('Chargement des données...');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

let removedCount = 0;

console.log(`Traitement de ${db.breaches.length} fuites...`);

db.breaches.forEach((breach) => {
  if (!breach || breach.IsRetired) {
    return;
  }

  // Chercher TAJ
  if (breach.Name && breach.Name.toLowerCase().includes('taj')) {
    // Supprimer le tag IA s'il existe
    if (breach.tags && Array.isArray(breach.tags)) {
      const iaIndex = breach.tags.indexOf('IA');
      if (iaIndex !== -1) {
        breach.tags.splice(iaIndex, 1);
        removedCount++;
        console.log(`  ✓ Tag IA supprimé : ${breach.Name}`);
      }
    }
  }
});

// Mettre à jour la date
db.lastUpdated = new Date().toISOString();

// Sauvegarder
console.log('\nSauvegarde des modifications...');
fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));

console.log('\n✅ Nettoyage terminé !');
console.log(`   - ${removedCount} tag(s) IA supprimé(s) (faux positifs)`);
