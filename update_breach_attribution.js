const fs = require('fs');
const path = require('path');

const dataFiles = [
    path.join(__dirname, 'source', '_data', 'breaches.json'),
    path.join(__dirname, 'source', 'data', 'breaches.json')
];

function updateAttributions(filePath) {
    console.log(`Traitement de ${filePath}...`);
    if (!fs.existsSync(filePath)) {
        console.error(`Fichier ${filePath} introuvable.`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updatedCount = 0;

    data.breaches.forEach(breach => {
        if (!breach.Attribution || breach.Attribution === 'null') {
            const description = breach.Description || breach.content || '';
            
            const patterns = [
                /par l'acteur de la menace\s+([^\s,.;!]+)/i,
                /par l'acteur\s+([^\s,.;!]+)/i,
                /L'acteur\s+([^\s,.;!]+)/i
            ];

            for (const pattern of patterns) {
                const match = description.match(pattern);
                if (match && match[1]) {
                    // Nettoyage : trim et retrait des guillemets
                    let actorName = match[1].trim().replace(/["']/g, '');
                    
                    const commonWords = ['de', 'la', 'un', 'une', 'le', 'les', 'des'];
                    if (!commonWords.includes(actorName.toLowerCase()) && actorName.length > 2) {
                        breach.Attribution = actorName;
                        updatedCount++;
                        break;
                    }
                }
            }
        }
    });

    if (updatedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Mis à jour de ${updatedCount} fuites dans ${filePath}.`);
    } else {
        console.log(`Aucune mise à jour nécessaire pour ${filePath}.`);
    }
}

dataFiles.forEach(updateAttributions);
