const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');

function normalize(text) {
    if (!text) return "";
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Enlever les accents
        .replace(/fuite du.*/g, "") // Enlever "fuite du..."
        .replace(/#\d+/g, "") // Enlever #1, #2...
        .replace(/\(.*\)/g, "") // Enlever (agents), (2025)...
        .replace(/[^a-z0-9]/g, " ") // Garder seulement alphanumérique
        .trim()
        .replace(/\s+/g, " ");
}

function main() {
    if (!fs.existsSync(DATA_FILE)) {
        console.error("Fichier non trouvé:", DATA_FILE);
        return;
    }

    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const breaches = data.breaches || [];
    
    console.log(`Nombre initial de brèches: ${breaches.length}`);

    const uniqueBreaches = [];
    const seen = new Set();

    // Priorité aux sources vérifiées ou avec plus de données
    breaches.sort((a, b) => {
        const aIsHIBP = a.source === "Have I Been Pwned" ? 1 : 0;
        const bIsHIBP = b.source === "Have I Been Pwned" ? 1 : 0;
        if (aIsHIBP !== bIsHIBP) return bIsHIBP - aIsHIBP;
        
        // Priorité à celui qui a une description plus longue (souvent plus complet)
        const aDescLen = (a.Description || "").length;
        const bDescLen = (b.Description || "").length;
        if (Math.abs(aDescLen - bDescLen) > 50) return bDescLen - aDescLen;

        return (b.PwnCount || 0) - (a.PwnCount || 0);
    });

    breaches.forEach(breach => {
        const normName = normalize(breach.Name);
        const normTitle = normalize(breach.Title);
        
        // Utiliser seulement le nom normalisé pour la détection de doublons s'ils sont dans la même année
        const year = breach.BreachDate ? breach.BreachDate.substring(0, 4) : "no-year";
        
        const key1 = `${normName}|${year}`;
        const key2 = `${normTitle}|${year}`;

        if (seen.has(key1) || seen.has(key2)) {
            console.log(`[Doublon] Ignoré: ${breach.Name} (${breach.BreachDate})`);
            return;
        }

        seen.add(key1);
        seen.add(key2);
        uniqueBreaches.push(breach);
    });

    // Tri final par date décroissante
    uniqueBreaches.sort((a, b) => {
        const dateA = new Date(a.BreachDate || a.AddedDate || "1970-01-01");
        const dateB = new Date(b.BreachDate || b.AddedDate || "1970-01-01");
        return dateB - dateA;
    });

    data.breaches = uniqueBreaches;
    data.totalBreaches = uniqueBreaches.length;
    data.lastUpdated = new Date().toISOString();

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(`\nNombre final de brèches: ${uniqueBreaches.length}`);
    console.log(`Doublons supprimés: ${breaches.length - uniqueBreaches.length}`);
}

main();
