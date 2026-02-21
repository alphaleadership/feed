const fs = require('fs');
const path = require('path');

const REMOTE_FILE = path.join(__dirname, 'temp_fuites.json');
const LOCAL_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');

function loadJSON(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function saveJSON(filePath, data) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
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
    const remoteData = loadJSON(REMOTE_FILE);
    const localData = loadJSON(LOCAL_FILE);
    const existingBreaches = localData.breaches || [];

    let addedCount = 0;
    let skippedCount = 0;

    remoteData.forEach(remote => {
        const exists = existingBreaches.find(b => 
            b.Name.toLowerCase() === remote.name.toLowerCase() ||
            (b.Title && b.Title.toLowerCase() === remote.name.toLowerCase())
        );

        if (exists) {
            skippedCount++;
            return;
        }

        const description = `${remote.records_count_raw || ''}

Statut: ${remote.status || 'Inconnu'}
Type de service: ${remote.service_type || 'N/A'}`;
        
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
    });

    localData.breaches = existingBreaches;
    localData.totalBreaches = existingBreaches.length;
    localData.lastUpdated = new Date().toISOString();

    saveJSON(LOCAL_FILE, localData);
    console.log(`Import: ${addedCount} ajoutés, ${skippedCount} ignorés.`);
}

main().catch(err => console.error(err));
