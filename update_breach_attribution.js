const fs = require('fs');
const path = require('path');

const dataFiles = [
    path.join(__dirname, 'source', '_data', 'breaches.json'),
    path.join(__dirname, 'source', 'data', 'breaches.json')
];

function updateAttributions(filePath) {
    console.log(`Processing ${filePath}...`);
    if (!fs.existsSync(filePath)) {
        console.error(`File ${filePath} not found.`);
        return;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    let updatedCount = 0;

    data.breaches.forEach(breach => {
        // Only update if Attribution is missing or null
        if (!breach.Attribution || breach.Attribution === 'null') {
            const description = breach.Description || breach.content || '';
            
            // Patterns:
            // "par l'acteur [Nom]"
            // "L'acteur [Nom]"
            // "par l'acteur de la menace [Nom]"
            const patterns = [
                /par l'acteur de la menace\s+([^\s,.;!]+)/i,
                /par l'acteur\s+([^\s,.;!]+)/i,
                /L'acteur\s+([^\s,.;!]+)/i
            ];

            for (const pattern of patterns) {
                const match = description.match(pattern);
                if (match && match[1]) {
                    const actorName = match[1].trim();
                    // Basic validation to avoid common words
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
        console.log(`Updated ${updatedCount} breaches in ${filePath}.`);
    } else {
        console.log(`No updates needed for ${filePath}.`);
    }
}

dataFiles.forEach(updateAttributions);
