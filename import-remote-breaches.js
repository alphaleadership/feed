const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

const LOCAL_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');
const DATE_FILE = path.join(__dirname, 'source', '_data', 'last_import_date.json');
const REMOTE_URL = 'https://christopheboutry.com/data/fuites-infos.json';

// --- Utility Functions ---
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
            console.warn("Avertissement: Impossible de lire le fichier de date.", error.message);
            return new Date(0);
        }
    }
    return new Date(0);
}

function writeNewImportDate() {
    const data = { lastImport: new Date().setFullYear(new Date().getFullYear()-1).toISOString() };
    fs.writeFileSync(DATE_FILE, JSON.stringify(data, null, 2));
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
}

// --- Deduplication Function ---
function deduplicate(breaches) {
    console.log("\nLancement du processus de déduplication post-importation...");
    const originalCount = breaches.length;

    const fuse = new Fuse(breaches, { keys: ['Name'], threshold: 0.15, includeScore: true });
    const fuzzyDuplicateGroups = [];
    const processedIndices = new Set();

    breaches.forEach((breach, index) => {
        if (processedIndices.has(index)) return;
        const searchResults = fuse.search(breach.Name);
        const similarItems = searchResults.filter(result => result.score < 0.15 && result.refIndex !== index);
        if (similarItems.length === 0) return;

        const mainDate = new Date(breach.BreachDate);
        const group = [{ index, item: breach }];
        processedIndices.add(index);

        similarItems.forEach(match => {
            if (processedIndices.has(match.refIndex)) return;
            const matchDate = new Date(match.item.BreachDate);
            const timeDiff = Math.abs(mainDate.getTime() - matchDate.getTime());
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            if (diffDays <= 90) {
                group.push({ index: match.refIndex, item: match.item });
                processedIndices.add(match.refIndex);
            }
        });

        if (group.length > 1) fuzzyDuplicateGroups.push(group);
    });

    if (fuzzyDuplicateGroups.length === 0) {
        console.log("Aucun doublon trouvé. Le nettoyage n'est pas nécessaire.");
        return breaches;
    }
    console.log(`${fuzzyDuplicateGroups.length} groupes de doublons potentiels à traiter.`);

    const indicesToRemove = new Set();
    fuzzyDuplicateGroups.forEach(group => {
        group.sort((a, b) => a.item.Name.length - b.item.Name.length);
        const goldenRecordIndex = group[0].index;
        const duplicates = group.slice(1);

        duplicates.forEach(dupInfo => {
            const goldenRecord = breaches[goldenRecordIndex];
            const duplicateRecord = dupInfo.item;
            if (duplicateRecord.PwnCount > goldenRecord.PwnCount) {
                goldenRecord.PwnCount = duplicateRecord.PwnCount;
            }
            const goldenClasses = Array.isArray(goldenRecord.DataClasses) ? goldenRecord.DataClasses : [];
            const duplicateClasses = Array.isArray(duplicateRecord.DataClasses) ? duplicateRecord.DataClasses : [];
            goldenRecord.DataClasses = Array.from(new Set([...goldenClasses, ...duplicateClasses]));
            indicesToRemove.add(dupInfo.index);
        });
    });

    const finalBreaches = breaches.filter((_, index) => !indicesToRemove.has(index));
    const removedCount = originalCount - finalBreaches.length;
    console.log(`Déduplication terminée: ${removedCount} doublon(s) supprimé(s).`);
    
    return finalBreaches;
}

// --- Main Function ---
async function main() {
    console.log("Démarrage de l'importation des nouvelles fuites...");
    const response = await fetch(REMOTE_URL);
    if (!response.ok) throw new Error(`Erreur HTTP ! statut: ${response.status}`);
    const remoteData = await response.json();
    console.log(`${remoteData.length} fuites trouvées dans la source distante.`);

    const localData = loadJSON(LOCAL_FILE);
    let existingBreaches = localData.breaches || [];
    console.log(`${existingBreaches.length} fuites existentes avant l'import.`);

    const lastLaunchDate = readLastImportDate();
    console.log(`Date de référence pour l'importation : ${lastLaunchDate.toISOString()}`);

    const importFuse = new Fuse(existingBreaches, { keys: ['Name', 'Title'], threshold: 0.3 });
    let addedCount = 0;
    let skippedCount = 0;

    for (const remote of remoteData) {
        const remoteBreachDate = new Date(remote.date);
        if (remoteBreachDate <= lastLaunchDate) {
            skippedCount++;
            continue;
        }
        if (existingBreaches.some(b => b.Name.toLowerCase() === remote.name.toLowerCase())) {
            skippedCount++;
            continue;
        }
        const results = importFuse.search(remote.name);
        if (results.some(result => Math.abs(remoteBreachDate.getTime() - new Date(result.item.BreachDate).getTime()) / (1000 * 3600 * 24) <= 7)) {
            skippedCount++;
            continue;
        }

        const newBreach = {
            Name: remote.name,
            Title: remote.name,
            Domain: remote.site_url ? remote.site_url.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : "",
            BreachDate: remote.date,
            AddedDate: new Date().toISOString(),
            ModifiedDate: new Date().toISOString(),
            PwnCount: remote.records_count || 0,
            Description: `${remote.records_count_raw || ''}\n\nStatut: ${remote.status || 'Inconnu'}\nType de service: ${remote.service_type || 'N/A'}`,
            DataClasses: remote.data_types || [],
            IsSensitive: remote.status === "Sensible",
            IsVerified: true, IsFabricated: false, IsSpam: false, IsRetired: false, IsNative: true,
            LogoPath: remote.logo_url || "",
            slug: slugify(remote.name)
        };
        existingBreaches.push(newBreach);
        addedCount++;
    }
    console.log(`Importation terminée: ${addedCount} fuite(s) ajoutée(s), ${skippedCount} ignorée(s).`);

    // --- Post-Import Processing ---
    let finalBreaches = existingBreaches;
    if (addedCount > 0) {
        finalBreaches = deduplicate(existingBreaches);
    }
    
    finalBreaches.sort((a, b) => new Date(b.BreachDate) - new Date(a.BreachDate));
    localData.breaches = finalBreaches;
    localData.totalBreaches = finalBreaches.length;
    localData.lastUpdated = new Date().toISOString();
    
    saveJSON(LOCAL_FILE, localData);
    console.log(`\nBase de données finale sauvegardée avec ${finalBreaches.length} enregistrements.`);
    
    writeNewImportDate();
    console.log(`Date de l'importation actuelle enregistrée dans ${path.basename(DATE_FILE)}.`);
}

main().catch(err => console.error("Erreur lors du processus d'importation:", err));
