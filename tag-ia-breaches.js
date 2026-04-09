'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '.');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

console.log('Chargement des données...');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

// Mots-clés pour détecter les brèches liées à l'IA
const iaKeywords = [
  'ia',
  'ai',
  'intelligence artificielle',
  'artificial intelligence',
  'chatgpt',
  'chat gpt',
  'gpt',
  'claude',
  'gemini',
  'copilot',
  'llm',
  'large language model',
  'machine learning',
  'deep learning',
  'neural',
  'transformer',
  'model',
  'algorithme',
  'algorithm',
  'apprentissage',
  'learning',
  'données d\'entraînement',
  'training data',
  'dataset',
  'données d\'apprentissage'
];

let taggedCount = 0;

console.log(`Traitement de ${db.breaches.length} fuites...`);

db.breaches.forEach((breach, index) => {
  if (!breach || breach.IsRetired) {
    return;
  }

  // Vérifier si le tag IA est déjà présent
  if (breach.tags && breach.tags.includes('IA')) {
    return;
  }

  // Chercher les mots-clés dans le nom, la description et le contenu
  const textToSearch = [
    breach.Name || '',
    breach.Title || '',
    breach.Description || '',
    breach.content || '',
    (breach.DataClasses || []).join(' ')
  ].join(' ').toLowerCase();

  const hasIAKeyword = iaKeywords.some(keyword => textToSearch.includes(keyword));

  if (hasIAKeyword) {
    if (!breach.tags) {
      breach.tags = [];
    }
    if (!Array.isArray(breach.tags)) {
      breach.tags = [breach.tags];
    }
    breach.tags.push('IA');
    taggedCount++;
    console.log(`  ✓ Tag IA ajouté : ${breach.Name}`);
  }
});

// Mettre à jour la date
db.lastUpdated = new Date().toISOString();

// Sauvegarder
console.log('\nSauvegarde des modifications...');
fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));

console.log('\n✅ Tagging IA terminé !');
console.log(`   - ${taggedCount} brèche(s) taguée(s) avec "IA"`);
