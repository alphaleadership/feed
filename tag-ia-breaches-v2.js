'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '.');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

console.log('Chargement des données...');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

// Mots-clés spécifiques pour détecter les brèches liées à l'IA
const iaKeywords = [
  'chatgpt',
  'chat gpt',
  'gpt-',
  'gpt4',
  'gpt-4',
  'claude',
  'gemini',
  'copilot',
  'llm',
  'large language model',
  'machine learning',
  'deep learning',
  'neural network',
  'transformer',
  'openai',
  'anthropic',
  'hugging face',
  'stable diffusion',
  'midjourney',
  'dall-e',
  'image generation',
  'text generation',
  'ai model',
  'ai training',
  'training data',
  'dataset',
  'données d\'entraînement',
  'données d\'apprentissage',
  'apprentissage automatique',
  'intelligence artificielle',
  'artificial intelligence',
  'ai girlfriend',
  'ai companion',
  'ai chatbot',
  'ai assistant',
  'ai platform',
  'ai service',
  'ai startup',
  'ai company',
  'ai tool',
  'ai application',
  'ai model',
  'ai algorithm',
  'ai system',
  'ai technology',
  'ai solution',
  'ai framework',
  'ai library',
  'ai research',
  'ai development',
  'ai innovation',
  'ai future',
  'ai ethics',
  'ai safety',
  'ai security',
  'ai privacy',
  'ai data',
  'ai training',
  'ai learning',
  'ai inference',
  'ai prediction',
  'ai classification',
  'ai detection',
  'ai recognition',
  'ai analysis',
  'ai processing',
  'ai automation',
  'ai optimization',
  'ai personalization',
  'ai recommendation',
  'ai search',
  'ai ranking',
  'ai scoring',
  'ai matching',
  'ai clustering',
  'ai segmentation',
  'ai generation',
  'ai synthesis',
  'ai translation',
  'ai summarization',
  'ai extraction',
  'ai parsing',
  'ai tokenization',
  'ai embedding',
  'ai vector',
  'ai tensor',
  'ai matrix',
  'ai computation',
  'ai acceleration',
  'ai gpu',
  'ai tpu',
  'ai hardware',
  'ai chip',
  'ai processor',
  'ai server',
  'ai cloud',
  'ai edge',
  'ai mobile',
  'ai web',
  'ai api',
  'ai sdk',
  'ai plugin',
  'ai extension',
  'ai integration',
  'ai workflow',
  'ai pipeline',
  'ai model',
  'ai checkpoint',
  'ai weight',
  'ai parameter',
  'ai hyperparameter',
  'ai tuning',
  'ai fine-tuning',
  'ai transfer learning',
  'ai few-shot',
  'ai zero-shot',
  'ai prompt',
  'ai context',
  'ai token',
  'ai sequence',
  'ai attention',
  'ai layer',
  'ai activation',
  'ai loss',
  'ai gradient',
  'ai backpropagation',
  'ai optimization',
  'ai convergence',
  'ai regularization',
  'ai dropout',
  'ai batch',
  'ai epoch',
  'ai iteration',
  'ai validation',
  'ai testing',
  'ai evaluation',
  'ai metric',
  'ai accuracy',
  'ai precision',
  'ai recall',
  'ai f1',
  'ai auc',
  'ai roc',
  'ai confusion',
  'ai benchmark',
  'ai leaderboard',
  'ai competition',
  'ai challenge',
  'ai dataset',
  'ai corpus',
  'ai annotation',
  'ai labeling',
  'ai crowdsourcing',
  'ai synthetic',
  'ai augmentation',
  'ai preprocessing',
  'ai normalization',
  'ai scaling',
  'ai encoding',
  'ai decoding',
  'ai compression',
  'ai quantization',
  'ai pruning',
  'ai distillation',
  'ai ensemble',
  'ai voting',
  'ai stacking',
  'ai boosting',
  'ai bagging',
  'ai random forest',
  'ai decision tree',
  'ai svm',
  'ai knn',
  'ai kmeans',
  'ai dbscan',
  'ai pca',
  'ai tsne',
  'ai umap',
  'ai gan',
  'ai vae',
  'ai autoencoder',
  'ai rnn',
  'ai lstm',
  'ai gru',
  'ai cnn',
  'ai convolution',
  'ai pooling',
  'ai normalization',
  'ai batch norm',
  'ai layer norm',
  'ai attention mechanism',
  'ai self-attention',
  'ai cross-attention',
  'ai multi-head',
  'ai positional encoding',
  'ai embedding',
  'ai word2vec',
  'ai glove',
  'ai fasttext',
  'ai bert',
  'ai gpt',
  'ai t5',
  'ai xlnet',
  'ai roberta',
  'ai electra',
  'ai albert',
  'ai distilbert',
  'ai mobilebert',
  'ai tinybert',
  'ai squeezebert',
  'ai longformer',
  'ai reformer',
  'ai performer',
  'ai linformer',
  'ai synthesizer',
  'ai perceiver',
  'ai vision transformer',
  'ai vit',
  'ai deit',
  'ai swin',
  'ai efficientnet',
  'ai resnet',
  'ai vgg',
  'ia',
  'ai'
];

let taggedCount = 0;
let alreadyTagged = 0;

console.log(`Traitement de ${db.breaches.length} fuites...`);

db.breaches.forEach((breach, index) => {
  if (!breach || breach.IsRetired) {
    return;
  }

  // Vérifier si le tag IA est déjà présent
  if (breach.tags && breach.tags.includes('IA')) {
    alreadyTagged++;
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

  const hasIAKeyword = iaKeywords.some(keyword => {
    // Utiliser des limites de mots pour éviter les faux positifs
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    return regex.test(textToSearch);
  });

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
console.log(`   - ${alreadyTagged} brèche(s) déjà taguée(s)`);
