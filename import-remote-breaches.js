const fs = require('fs');
const path = require('path');
const Fuse = require('fuse.js');

const LOCAL_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');
const DATE_FILE = path.join(__dirname, 'source', '_data', 'last_import_date.json');

const SOURCES = [
    {
        name: "Christophe Boutry",
        url: 'https://christopheboutry.com/data/fuites-infos.json',
        selector: (data) => data,
        mapper: (remote) => ({
            Name: remote.name,
            Title: remote.name,
            Domain: remote.site_url ? remote.site_url.replace(/https?:\/\/(www\.)?/, '').split('/')[0] : "",
            BreachDate: remote.date || '1970-01-01',
            PwnCount: remote.records_count || 0,
            Description: `${remote.records_count_raw || ''}\n\nStatut: ${remote.status || 'Inconnu'}\nType de service: ${remote.service_type || 'N/A'}`,
            DataClasses: remote.data_types || [],
            IsSensitive: remote.status === "Sensible",
            IsVerified: true, IsFabricated: false, IsSpam: false, IsRetired: false, IsNative: true,
            LogoPath: remote.logo_url || "",
            source: remote.source_url || "christopheboutry.com",
        })
    },
    {
        name: "Have I Been Pwned",
        url: 'https://haveibeenpwned.com/api/v3/breaches',
        selector: (data) => data,
        mapper: (remote) => ({
            Name: remote.Name,
            Title: remote.Title,
            Domain: remote.Domain,
            BreachDate: remote.BreachDate,
            PwnCount: remote.PwnCount,
            Description: remote.Description,
            DataClasses: remote.DataClasses,
            IsSensitive: remote.IsSensitive,
            IsVerified: remote.IsVerified,
            IsFabricated: remote.IsFabricated,
            IsSpam: remote.IsSpam,
            IsRetired: remote.IsRetired,
            IsNative: remote.IsNative,
            LogoPath: remote.LogoPath,
            source: "haveibeenpwned.com"
        })
    },
    {
        name: "XposedOrNot",
        url: 'https://api.xposedornot.com/v1/breaches',
        selector: (data) => data.exposedBreaches || [],
        mapper: (remote) => ({
            Name: remote.breachID,
            Title: remote.breachID,
            Domain: remote.domain || "",
            BreachDate: remote.breachedDate ? remote.breachedDate.split('T')[0] : '1970-01-01',
            PwnCount: remote.exposedRecords || 0,
            Description: remote.exposureDescription || "",
            DataClasses: remote.exposedData || [],
            IsSensitive: remote.sensitive || false,
            IsVerified: remote.verified || true,
            IsFabricated: false, IsSpam: false, IsRetired: false, IsNative: true,
            LogoPath: remote.logo || "",
            source: "xposedornot.com"
        })
    }
];

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
    const data = {
        lastImport: new Date().toISOString()
    };
    fs.writeFileSync(DATE_FILE, JSON.stringify(data, null, 2));
}

function slugify(text) {
    if (!text) return 'unknown';
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-')
        .replace(/^-+/, '').replace(/-+$/, '');
}

function getBreachName(breach) {
    return (breach.Name || breach.name || breach.Title || breach.title || '').toLowerCase();
}

// --- Deduplication Function ---
function deduplicate(breaches) {
    console.log("\nLancement du processus de déduplication...");
    const originalCount = breaches.length;

    const fuse = new Fuse(breaches, { keys: ['Name'], threshold: 0.15, includeScore: true });
    const fuzzyDuplicateGroups = [];
    const processedIndices = new Set();

    breaches.forEach((breach, index) => {
        if (processedIndices.has(index)) return;
        const searchResults = fuse.search(getBreachName(breach));
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
        return breaches;
    }

    const indicesToRemove = new Set();
    fuzzyDuplicateGroups.forEach(group => {
        group.sort((a, b) => (b.item.PwnCount || 0) - (a.item.PwnCount || 0));
        const goldenRecordIndex = group[0].index;
        const duplicates = group.slice(1);

        duplicates.forEach(dupInfo => {
            const goldenRecord = breaches[goldenRecordIndex];
            const duplicateRecord = dupInfo.item;
            
            const goldenClasses = Array.isArray(goldenRecord.DataClasses) ? goldenRecord.DataClasses : [];
            const duplicateClasses = Array.isArray(duplicateRecord.DataClasses) ? duplicateRecord.DataClasses : [];
            goldenRecord.DataClasses = Array.from(new Set([...goldenClasses, ...duplicateClasses]));
            
            indicesToRemove.add(dupInfo.index);
        });
    });

    const finalBreaches = breaches.filter((_, index) => !indicesToRemove.has(index));
    console.log(`Déduplication terminée: ${originalCount - finalBreaches.length} doublon(s) supprimé(s).`);
    
    return finalBreaches;
}

// --- Main Function ---
async function runImport() {
    console.log("Démarrage du cycle d'importation multi-sources...");
    
    const localData = loadJSON(LOCAL_FILE);
    let existingBreaches = localData.breaches || [];
    const lastLaunchDate = readLastImportDate();
    
    console.log(`${existingBreaches.length} fuites existentes. Date de réf : ${lastLaunchDate.toISOString()}`);

    let totalAdded = 0;

    for (const source of SOURCES) {
        console.log(`\n--- Importation depuis : ${source.name} ---`);
        try {
            const response = await fetch(source.url, {
                headers: { 'User-Agent': 'DataBreachFeed-Bot/1.0' }
            });
            
            if (!response.ok) {
                console.error(`Erreur HTTP ${response.status} pour ${source.name}`);
                continue;
            }

            const rawData = await response.json();
            const remoteData = source.selector(rawData);
            console.log(`${remoteData.length} fuites trouvées.`);

            let addedFromSource = 0;
            const importFuse = new Fuse(existingBreaches, { keys: ['Name', 'Title'], threshold: 0.2 });

            for (const rawRemote of remoteData) {
                const remote = source.mapper(rawRemote);
                const rName = getBreachName(remote);

                if (!rName) continue;

                // Vérification existence exacte
                if (existingBreaches.some(b => getBreachName(b) === rName)) continue;

                const remoteDate = new Date(remote.BreachDate);
                const validDate = isNaN(remoteDate.getTime()) ? new Date(0) : remoteDate;

                // Filtre par date
                if (validDate <= lastLaunchDate) continue;

                // Vérification floue (doublons proches dans le temps)
                const fuzzyMatches = importFuse.search(rName);
                if (fuzzyMatches.some(m => {
                    const mDate = new Date(m.item.BreachDate);
                    return !isNaN(mDate.getTime()) && Math.abs(validDate - mDate) / (1000 * 3600 * 24) <= 7;
                })) continue;

                // Création de l'entrée finale
                const newBreach = {
                    ...remote,
                    AddedDate: new Date().toISOString(),
                    ModifiedDate: new Date().toISOString(),
                    slug: slugify(remote.Name || remote.Title),
                };

                existingBreaches.push(newBreach);
                addedFromSource++;
            }
            console.log(`${addedFromSource} nouvelles fuites ajoutées depuis cette source.`);
            totalAdded += addedFromSource;

        } catch (err) {
            console.error(`Erreur lors de l'import ${source.name}:`, err.message);
        }
    }

    if (totalAdded > 0) {
        existingBreaches = deduplicate(existingBreaches);
        existingBreaches.sort((a, b) => new Date(b.BreachDate) - new Date(a.BreachDate));
        
        localData.breaches = existingBreaches;
        localData.totalBreaches = existingBreaches.length;
        localData.lastUpdated = new Date().toISOString();
        
        saveJSON(LOCAL_FILE, localData);
        console.log(`\nSauvegarde terminée : ${existingBreaches.length} enregistrements au total.`);
        writeNewImportDate();
    } else {
        console.log("\nAucune nouvelle fuite trouvée sur l'ensemble des sources.");
    }
}

runImport().catch(console.error);

