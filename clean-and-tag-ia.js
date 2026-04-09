'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '.');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

console.log('Chargement des données...');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

// Mots-clés très spécifiques pour l'IA
const realIAKeywords = [
  'chatgpt',
  'chat gpt',
  'gpt-4',
  'gpt4',
  'claude',
  'gemini',
  'copilot',
  'openai',
  'anthropic',
  'hugging face',
  'stable diffusion',
  'midjourney',
  'dall-e',
  'ai girlfriend',
  'ai companion',
  'ai chatbot',
  'mylovely',
  'cutiesai',
  'machine learning',
  'deep learning',
  'neural network',
  'transformer',
  'llm',
  'large language model'
];

let removedCount = 0;
let addedCount = 0;

console.log(`Traitement de ${db.breaches.length} fuites...`);

db.breaches.forEach((breach, index) => {
  if (!breach || breach.IsRetired) {
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

  const hasRealIAKeyword = realIAKeywords.some(keyword => {
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(textToSearch);
  });

  // Supprimer le tag IA s'il existe
  if (breach.tags && Array.isArray(breach.tags)) {
    const iaIndex = breach.tags.indexOf('IA');
    if (iaIndex !== -1) {
      breach.tags.splice(iaIndex, 1);
      removedCount++;
    }
  }

  // Ajouter le tag IA seulement si c'est vraiment une brèche IA
  if (hasRealIAKeyword) {
    if (!breach.tags) {
      breach.tags = [];
    }
    if (!Array.isArray(breach.tags)) {
      breach.tags = [breach.tags];
    }
    breach.tags.push('IA');
    addedCount++;
    console.log(`  ✓ Tag IA ajouté : ${breach.Name}`);
  }
});

// Mettre à jour la date
db.lastUpdated = new Date().toISOString();

// Sauvegarder
console.log('\nSauvegarde des modifications...');
fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));

console.log('\n✅ Nettoyage et tagging IA terminé !');
console.log(`   - ${removedCount} tag(s) IA supprimé(s)`);
console.log(`   - ${addedCount} tag(s) IA ajouté(s) (brèches vraiment liées à l'IA)`);
