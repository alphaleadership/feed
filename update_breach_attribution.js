const fs = require('fs');
const path = require('path');

const dataFiles = [
    path.join(__dirname, 'source', '_data', 'breaches.json'),
    path.join(__dirname, 'source', 'data', 'breaches.json')
];

function cleanActorName(name) {
    if (!name || name === 'null') return null;
    // Nettoyage complet incluant le passage en minuscules pour éviter les doublons
    return name.trim().replace(/["'`]/g, '').toLowerCase();
}

function updateAttributions(filePath) {
    console.log(`Traitement de ${filePath}...`);
    if (!fs.existsSync(filePath)) {
        console.error(`Fichier ${filePath} introuvable.`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updatedCount = 0;

    data.breaches.forEach(breach => {
        let changed = false;

        // 1. Nettoyage et mise en minuscules de l'attribution existante
        if (breach.Attribution && breach.Attribution !== 'null') {
            const cleaned = cleanActorName(breach.Attribution);
            if (cleaned !== breach.Attribution) {
                breach.Attribution = cleaned;
                changed = true;
            }
        }

        // 2. Extraction si toujours vide ou null
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
                    const actorName = cleanActorName(match[1]);
                    const commonWords = ['de', 'la', 'un', 'une', 'le', 'les', 'des'];
                    if (actorName && !commonWords.includes(actorName.toLowerCase()) && actorName.length > 2) {
                        breach.Attribution = actorName;
                        changed = true;
                        break;
                    }
                }
            }
        }

        if (changed) updatedCount++;
    });

    if (updatedCount > 0) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
        console.log(`Mis à jour de ${updatedCount} fuites (minuscules et nettoyage) dans ${filePath}.`);
    } else {
        console.log(`Aucune modification nécessaire pour ${filePath}.`);
    }
}

dataFiles.forEach(updateAttributions);
