'use strict';

const fs = require('fs');
const path = require('path');
const { getBreachesDB } = require('./db');

const TAGS_CONFIG = {
  'IA': {
    keywords: ['chatgpt', 'chat gpt', 'gpt-4', 'gpt4', 'claude', 'gemini', 'copilot', 'openai', 'anthropic', 'hugging face', 'stable diffusion', 'midjourney', 'dall-e', 'ai girlfriend', 'ai companion', 'ai chatbot', 'mylovely', 'cutiesai', 'machine learning', 'deep learning', 'neural network', 'transformer', 'llm', 'large language model', 'nsfw ai', 'ai-powered'],
    falsePositives: ['taj', 'traitement d\'antécédents judiciaires']
  },
  'Santé': {
    keywords: ['hopital', 'hôpital', 'clinique', 'ars', 'medical', 'médical', 'weda', 'patient', 'santé', 'sante', 'mutuelle', 'pharmac', 'ordoclic', 'biomérieux', 'biomerieux', 'synlab', 'santeo', 'médic', 'medic'],
    falsePositives: []
  },
  'Gouvernement': {
    keywords: ['ministère', 'ministere', 'gendarmerie', 'police', 'caf', 'ants', 'dgfip', 'gouvernement', 'cnas', 'unss', 'service public', 'mairie', 'commune', 'départemental', 'departemental', 'département', 'departement', 'région', 'region', 'préfecture', 'prefecture', 'urssaf', 'pajemploi'],
    falsePositives: []
  },
  'Éducation': {
    keywords: ['lycee', 'lycée', 'ecole', 'école', 'universite', 'université', 'ensam', 'sciences po', 'cnfpt', 'sorbonne', 'academie', 'académie', 'college', 'collège', 'iut', 'campus', 'iae', 'esae', 'alumni', 'scolaire', 'étudiant', 'etudiant'],
    falsePositives: []
  },
  'Finance': {
    keywords: ['banque', 'bank', 'crypto', 'ledger', 'assurance', 'finance', 'bitcoin', 'eth', 'credit', 'crédit', 'meilleurtaux', 'sofinco', 'boursier', 'épargne', 'epargne'],
    falsePositives: []
  },
  'Télécom': {
    keywords: ['mobile', 'telecom', 'télécom', 'sfr', 'bouygues', 'orange', 'free', 'ovh', 'kimsufi', 'red by sfr', 'sim card', 'carte sim'],
    falsePositives: []
  }
};

async function tagIABreaches() {
  console.log('Démarrage du tagging automatique multi-catégories...');
  
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
      
      const textToSearch = [
        breach.Name || '',
        breach.Title || '',
        breach.Description || '',
        breach.content || '',
        (breach.DataClasses || []).join(' ')
      ].join(' ').toLowerCase();

      if (!breach.tags) {
        breach.tags = [];
      }
      if (!Array.isArray(breach.tags)) {
        breach.tags = [breach.tags];
      }

      // Nettoyer les tags automatiques existants
      const autoTags = Object.keys(TAGS_CONFIG);
      const originalLength = breach.tags.length;
      breach.tags = breach.tags.filter(t => !autoTags.includes(t));
      removedCount += (originalLength - breach.tags.length);

      // Détecter et appliquer les nouveaux tags
      autoTags.forEach(tagName => {
        const config = TAGS_CONFIG[tagName];
        const isFalsePositive = config.falsePositives.some(fp => textToSearch.includes(fp.toLowerCase()));
        
        const hasKeyword = !isFalsePositive && config.keywords.some(keyword => {
          const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          return regex.test(textToSearch);
        });

        if (hasKeyword) {
          if (!breach.tags.includes(tagName)) {
            breach.tags.push(tagName);
            addedCount++;
            console.log(`  ✓ Tag ${tagName} ajouté : ${breach.Name}`);
          }
        }
      });
    });
    
    db.data.lastUpdated = new Date().toISOString();
    await db.save();
    
    console.log('\n✅ Tagging automatique terminé !');
    console.log(`   - ${removedCount} tag(s) supprimé(s)`);
    console.log(`   - ${addedCount} tag(s) ajouté(s)`);
    
  } catch (err) {
    console.error('Erreur lors du tagging:', err);
  }
}

module.exports = { tagIABreaches };

if (require.main === module) {
  tagIABreaches().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  });
}
