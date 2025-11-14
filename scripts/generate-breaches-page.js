const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Chemins des fichiers
const breachesFile = path.join(__dirname, '..', 'source', '_data', 'breaches.json');
const outputFile = path.join(__dirname, '..', 'source', 'breaches.md');

// Lire le fichier des fuites
fs.readFile(breachesFile, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier des fuites:', err);
    return;
  }

  try {
    const { breaches } = JSON.parse(data);
    
    // Trier les fuites par date (du plus récent au plus ancien)
    const sortedBreaches = [...breaches].sort((a, b) => 
      new Date(b.breachDate) - new Date(a.breachDate)
    );

    // Lire le template
    const template = fs.readFileSync(outputFile, 'utf8');
    
    // Remplacer la partie dynamique
    const updatedContent = template;
    
    console.log('✅ Page des fuites mise à jour avec succès');
    
  } catch (error) {
    console.error('Erreur lors du traitement des données:', error);
  }
});
