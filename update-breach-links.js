'use strict';

const fs = require('fs');
const path = require('path');
const { getBreachesDB } = require('./scripts/db');

const baseDir = process.cwd();

async function run() {
console.log('Chargement des données...');
const db = await getBreachesDB();
const data = db.data;

let updatedCount = 0;

console.log(`Traitement de ${data.breaches.length} fuites...`);

data.breaches.forEach((breach, index) => {
  if (!breach || breach.IsRetired) {
    return;
  }
  
  // Pour les fuites bonjourlafuite, utiliser le champ path comme lien
  if (breach.path && breach.path.includes('bonjourlafuite.eu.org') && breach.path) {
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
    
    //if (!isImage && !isPdf) {
      // C'est une URL valide vers une page web
      if (!breach.lien || breach.lien === 'undefined' || breach.lien.includes('undefined') || breach.lien.includes('haveibeenpwned.com')) {
        breach.lien = breach.source||breach.path;
        updatedCount++;
        console.log(`  ✓ Lien mis à jour pour: ${breach.Name || breach.Title}`);
      }
    //}
  }
});

// Mettre à jour la date
data.lastUpdated = new Date().toISOString();

// Sauvegarder
console.log('\nSauvegarde des modifications...');
await db.save();

// Also update source/data/breaches.json if it exists and is used
const publicDataFile = path.join(baseDir, 'source', 'data', 'breaches.json');
if (fs.existsSync(path.dirname(publicDataFile))) {
    fs.writeFileSync(publicDataFile, JSON.stringify(data, null, 2));
}

console.log('\n✅ Traitement terminé !');
console.log(`   - ${updatedCount} liens mis à jour`);
}

run().catch(console.error);
