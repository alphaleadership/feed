'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '.');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

console.log('Chargement des données...');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

let updatedCount = 0;

console.log(`Traitement de ${db.breaches.length} fuites...`);

db.breaches.forEach((breach, index) => {
  if (!breach || breach.IsRetired) {
    return;
  }
  
  // Pour les fuites bonjourlafuite, utiliser le champ path comme lien
  if (breach.lien && breach.lien.includes('bonjourlafuite.eu.org') && breach.path) {
    // Construire l'URL bonjourlafuite
    breach.lien = `${breach.path}`;
    updatedCount++;
    console.log(`  ✓ Lien bonjourlafuite mis à jour pour: ${breach.Name || breach.Title} ${breach.lien}`);
  }
  // Vérifier si la source commence par https et n'est pas une image
  else if (breach.source && typeof breach.source === 'string' && breach.source.startsWith('https')) {
    // Vérifier que ce n'est pas une image ou un PDF
    const isImage = /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(breach.source);
    const isPdf = /\.pdf$/i.test(breach.source);
    
    if (!isImage && !isPdf) {
      // C'est une URL valide vers une page web
      if (!breach.lien || breach.lien === 'undefined' || breach.lien.includes('undefined') || breach.lien.includes('haveibeenpwned.com')) {
        breach.lien = breach.source;
        updatedCount++;
        console.log(`  ✓ Lien mis à jour pour: ${breach.Name || breach.Title}`);
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

console.log('\n✅ Traitement terminé !');
console.log(`   - ${updatedCount} liens mis à jour`);
