const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

async function main() {
    const c = new chalk.Chalk();
    const breachesPath = path.join(process.cwd(), 'source', '_data', 'breaches.json');
    if (!fs.existsSync(breachesPath)) {
        console.error(c.red('Fichier breaches.json non trouvé.'));
        return;
    }

    const data = JSON.parse(fs.readFileSync(breachesPath, 'utf8'));
    const breaches = data.breaches;

    const now = new Date('2026-05-11T12:12:44.569Z');
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // Filter by AddedDate
    const recentBreaches = breaches.filter(b => {
        if (!b.AddedDate) return false;
        const addedDate = new Date(b.AddedDate);
        return addedDate >= thirtyDaysAgo;
    });

    console.log(c.cyan('----------------------------------------------------------'));
    console.log(c.cyan(`|   Analyse poussée des doublons (30 derniers jours)     |`));
    console.log(c.cyan('----------------------------------------------------------'));
    console.log(c.yellow(`Entrées récentes analysées: ${recentBreaches.length}\n`));

    const duplicates = [];
    
    // Helper to normalize strings
    const normalize = (str) => str ? str.toLowerCase().replace(/[^a-z0-9]/g, '').trim() : '';

    // Create maps for efficient lookup
    const nameMap = new Map();
    const domainMap = new Map();
    const normalizedNameMap = new Map();

    breaches.forEach(b => {
        const name = b.Name.toLowerCase().trim();
        const normName = normalize(b.Name);
        const domain = b.Domain ? b.Domain.toLowerCase().trim() : null;

        if (!nameMap.has(name)) nameMap.set(name, []);
        nameMap.get(name).push(b);

        if (normName && !normalizedNameMap.has(normName)) normalizedNameMap.set(normName, []);
        if (normName) normalizedNameMap.get(normName).push(b);

        if (domain) {
            if (!domainMap.has(domain)) domainMap.set(domain, []);
            domainMap.get(domain).push(b);
        }
    });

    const processedKeys = new Set();

    recentBreaches.forEach(recent => {
        const name = recent.Name.toLowerCase().trim();
        const normName = normalize(recent.Name);
        const domain = recent.Domain ? recent.Domain.toLowerCase().trim() : null;
        const recentId = `${recent.Name}-${recent.AddedDate}`;

        if (processedKeys.has(recentId)) return;

        let matches = [];

        // 1. Exact Name Match
        const exactMatches = nameMap.get(name) || [];
        matches.push(...exactMatches);

        // 2. Normalized Name Match (Fuzzy-ish)
        const normMatches = normalizedNameMap.get(normName) || [];
        matches.push(...normMatches);

        // 3. Domain Match
        if (domain && domain !== 'null' && domain !== '') {
            const domMatches = domainMap.get(domain) || [];
            matches.push(...domMatches);
        }

        // Deduplicate matches and remove the current 'recent' entry itself
        const uniqueMatches = Array.from(new Set(matches)).filter(m => 
            m.AddedDate !== recent.AddedDate || m.index !== recent.index
        );

        if (uniqueMatches.length > 0) {
            uniqueMatches.forEach(match => {
                // To avoid reporting A-B and B-A
                const pairId = [recentId, `${match.Name}-${match.AddedDate}`].sort().join('||');
                if (!processedKeys.has(pairId)) {
                    duplicates.push({
                        original: match,
                        duplicate: recent,
                        reason: match.Domain === recent.Domain && domain ? 'Même Domaine' : 
                                normalize(match.Name) === normalize(recent.Name) ? 'Nom Similaire' : 'Nom Exact'
                    });
                    processedKeys.add(pairId);
                }
            });
        }
        processedKeys.add(recentId);
    });

    if (duplicates.length === 0) {
        console.log(c.green('Aucun doublon trouvé par nom dans les entrées récentes.'));
    } else {
        console.log(c.red(`Nombre de doublons potentiels trouvés: ${duplicates.length}\n`));
        duplicates.forEach((dup, index) => {
            console.log(c.bold.white(`Doublon #${index + 1}:`));
            console.log(c.gray(`  Original  : `) + c.white(dup.original.Name) + c.gray(` (Added: ${dup.original.AddedDate})`));
            console.log(c.gray(`  Doublon   : `) + c.white(dup.duplicate.Name) + c.gray(` (Added: ${dup.duplicate.AddedDate})`));
            console.log(c.blue(`  Lien Dup  : ${dup.duplicate.lien || dup.duplicate.path || 'N/A'}`));
            console.log('');
        });
    }
}

main();
