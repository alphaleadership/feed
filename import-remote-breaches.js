const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

const LOCAL_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');
const DATE_FILE = path.join(__dirname, 'source', '_data', 'last_import_date.json');
const REMOTE_URL = 'https://christopheboutry.com/data/fuites-infos.json';

function loadJSON(filePath) {
    if (!fs.existsSync(filePath)) {
        return { breaches: [], totalBreaches: 0, lastUpdated: new Date(0).toISOString() };
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

function readLastImportDate() {
    if (fs.existsSync(DATE_FILE)) {
        try {
            const data = fs.readFileSync(DATE_FILE, 'utf-8');
            return new Date(JSON.parse(data).lastImport);
        } catch (error) {
            console.warn("Avertissement: Impossible de lire le fichier de date. Utilisation d'une date par défaut.", error.message);
            return new Date(0);
        }
    }
    return new Date(0); // Si le fichier n'existe pas, importe tout
}

function writeNewImportDate() {
    const data = {
        lastImport: new Date().toISOString()
    };
    fs.writeFileSync(DATE_FILE, JSON.stringify(data, null, 2));
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

async function main() {
    console.log("Démarrage de l'importation des nouvelles fuites de données...");

    const response = await fetch(REMOTE_URL);
    if (!response.ok) {
        throw new Error(`Erreur HTTP ! statut: ${response.status}`);
    }
    const remoteData = await response.json();
    console.log(`${remoteData.length} fuites trouvées dans la source distante.`);

    const localData = loadJSON(LOCAL_FILE);
    const existingBreaches = localData.breaches || [];
    console.log(`${existingBreaches.length} fuites existentes dans la base de données locale.`);

    // Utiliser la date stockée dans le fichier JSON
    const lastLaunchDate = readLastImportDate();
    console.log(`Date de référence pour l'importation : ${lastLaunchDate.toISOString()}`);

    const fuse = new Fuse(existingBreaches, {
        keys: ['Name', 'Title'],
        threshold: 0.3,
    });

    let addedCount = 0;
    let skippedCount = 0;

    for (const remote of remoteData) {
        // La date de la fuite dans le fichier distant est `remote.date`
        const remoteBreachDate = new Date(remote.date);

        // Filtrer par date : ne traiter que les fuites dont la date est strictement supérieure à celle du dernier lancement
        if (remoteBreachDate <= lastLaunchDate) {
            skippedCount++;
            continue;
        }

        const exactMatch = existingBreaches.find(b =>
            b.Name.toLowerCase() === remote.name.toLowerCase()
        );
        if (exactMatch) {
            skippedCount++;
            continue;
        }

        const results = fuse.search(remote.name);
        let isFuzzyDuplicate = false;
        if (results.length > 0) {
            for (const result of results) {
                const existingBreach = result.item;
                const existingBreachDate = new Date(existingBreach.BreachDate);
                const timeDiff = Math.abs(remoteBreachDate.getTime() - existingBreachDate.getTime());
                const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));

                if (diffDays <= 7) {
                    isFuzzyDuplicate = true;
                    break;
                }
            }
        }

        if (isFuzzyDuplicate) {
            skippedCount++;
            continue;
        }

        const description = `${remote.records_count_raw || ''}\n\nStatut: ${remote.status || 'Inconnu'}\nType de service: ${remote.service_type || 'N/A'}`;
        
        const newBreach = {
            "Name": remote.name,
            "Title": remote.name,
            "Domain": remote.site_url ? remote.site_url.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : "",
            "BreachDate": remote.date,
            "AddedDate": new Date().toISOString(),
            "ModifiedDate": new Date().toISOString(),
            "PwnCount": remote.records_count || 0,
            "Description": description,
            "DataClasses": remote.data_types || [],
            "IsSensitive": remote.status === "Sensible",
            "IsVerified": true,
            "IsFabricated": false,
            "IsSpam": false,
            "IsRetired": false,
            "IsNative": true,
            "LogoPath": remote.logo_url || "",
            "slug": slugify(remote.name)
        };

        existingBreaches.push(newBreach);
        addedCount++;
    }

    if (addedCount > 0) {
        localData.breaches = existingBreaches.sort((a, b) => new Date(b.BreachDate) - new Date(a.BreachDate));
        localData.totalBreaches = existingBreaches.length;
        localData.lastUpdated = new Date().toISOString();
    
        saveJSON(LOCAL_FILE, localData);
    }

    console.log(`Importation terminée: ${addedCount} fuite(s) ajoutée(s), ${skippedCount} ignorée(s) (anciennes ou doublons).`);

    // Enregistrer la date de cette importation pour la prochaine fois
    writeNewImportDate();
    console.log(`Date de l'importation actuelle enregistrée dans ${path.basename(DATE_FILE)}.`);
}

main().catch(err => console.error("Erreur lors de l'importation:", err));
