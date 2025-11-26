const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'source/data/breaches.json');

try {
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  JSON.parse(fileContent);
  console.log('Le fichier JSON est valide.');
} catch (e) {
  console.error('Erreur de syntaxe JSON:', e.message);
  
  // Essayer de localiser l'erreur
  const positionMatch = e.message.match(/position (\d+)/);
  if (positionMatch) {
    const position = parseInt(positionMatch[1], 10);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const context = 100;
    const start = Math.max(0, position - context);
    const end = Math.min(fileContent.length, position + context);
    
    console.error(`\n--- Contexte de l'erreur (autour de la position ${position}) ---`);
    console.error(fileContent.substring(start, end));
    console.error('----------------------------------------------------');
  }
}
