'use strict';

const fs = require('fs');
const path = require('path');
const sanitizeHtml = require('sanitize-html');

const baseDir = path.join(__dirname, '.');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

console.log('Chargement des données...');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

let cleanedCount = 0;

console.log(`Traitement de ${db.breaches.length} fuites...`);

// Fonction pour enlever les balises HTML
function removeHtmlTags(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }

  // Enlever les balises HTML en utilisant une bibliothèque de sanitisation
  return sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {}
  });
}

db.breaches.forEach((breach, index) => {
  if (!breach || breach.IsRetired) {
    return;
  }
  
  // Nettoyer le champ Description
  if (breach.Description && typeof breach.Description === 'string') {
    const cleaned = removeHtmlTags(breach.Description);
    if (cleaned !== breach.Description) {
      breach.Description = cleaned;
      cleanedCount++;
    }
  }
  
  // Nettoyer le champ content
  if (breach.content && typeof breach.content === 'string') {
    const cleaned = removeHtmlTags(breach.content);
    if (cleaned !== breach.content) {
      breach.content = cleaned;
      cleanedCount++;
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
console.log(`   - ${cleanedCount} champs nettoyés`);
