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

let realIACount = 0;
const realIABreaches = [];

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

  if (hasRealIAKeyword) {
    realIACount++;
    realIABreaches.push({
      name: breach.Name,
      title: breach.Title,
      slug: breach.slug,
      description: breach.Description ? breach.Description.substring(0, 100) : ''
    });
    console.log(`  ✓ Brèche IA trouvée : ${breach.Name}`);
  }
});

console.log('\n✅ Recherche terminée !');
console.log(`   - ${realIACount} brèche(s) vraiment liée(s) à l'IA`);
console.log('\nListe des brèches IA:');
realIABreaches.forEach(b => {
  console.log(`   - ${b.name} (${b.slug})`);
});
