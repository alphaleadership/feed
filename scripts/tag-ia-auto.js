'use strict';

const fs = require('fs');
const path = require('path');
const { getBreachesDB } = require('./db');

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
  'large language model','nsfw ai','ai-powered'
];

// Faux positifs à exclure
const falsePositives = [
  'taj',
  'traitement d\'antécédents judiciaires'
];

async function tagIABreaches() {
  console.log('Démarrage du tagging automatique IA...');
  
  try {
    const db = await getBreachesDB();
    const breaches = db.data.breaches || [];
    
    let removedCount = 0;
    let addedCount = 0;
    
    console.log(`Traitement de ${breaches.length} fuites...`);
    
    breaches.forEach((breach) => {
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
      
      // Vérifier si c'est un faux positif
      const isFalsePositive = falsePositives.some(fp => textToSearch.includes(fp.toLowerCase()));
      
      const hasRealIAKeyword = !isFalsePositive && realIAKeywords.some(keyword => {
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
        if (!breach.tags.includes('IA')) {
          breach.tags.push('IA');
          addedCount++;
          console.log(`  ✓ Tag IA ajouté : ${breach.Name}`);
        }
      }
    });
    
    // Sauvegarder
    db.data.lastUpdated = new Date().toISOString();
    await db.save();
    
    console.log('\n✅ Tagging IA automatique terminé !');
    console.log(`   - ${removedCount} tag(s) IA supprimé(s)`);
    console.log(`   - ${addedCount} tag(s) IA ajouté(s)`);
    
  } catch (err) {
    console.error('Erreur lors du tagging IA:', err);
  }
}

// Exporter pour utilisation en tant que module
module.exports = { tagIABreaches };

// Exécuter si appelé directement
if (require.main === module) {
  tagIABreaches().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  });
}
