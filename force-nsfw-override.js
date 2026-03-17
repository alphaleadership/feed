'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '.');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

function parseArgs() {
    const args = {};
    process.argv.slice(2).forEach(arg => {
        if (arg.startsWith('--')) {
            const parts = arg.split('=');
            const key = parts[0].substring(2);
            const value = parts.length > 1 ? parts.slice(1).join('=') : true; // Support --flag and --key=value
            args[key] = value;
        }
    });
    return args;
}

async function forceNsfwOverride() {
    const args = parseArgs();

    const identifier = args.slug || args.name;
    const isNSFW = args.isNSFW;
    const confidence = parseFloat(args.confidence);

    if (!identifier || (isNSFW === undefined || isNSFW === null)) {
        console.error('Usage: node force-nsfw-override.js --slug=<breach-slug> --isNSFW=<true|false> [--confidence=<0-1>]');
        console.error('Or: node force-nsfw-override.js --name=<breach-name> --isNSFW=<true|false> [--confidence=<0-1>]');
        process.exit(1);
    }

    if (typeof isNSFW === 'string') {
        if (isNSFW.toLowerCase() === 'true') args.isNSFW = true;
        else if (isNSFW.toLowerCase() === 'false') args.isNSFW = false;
        else {
            console.error('Error: --isNSFW must be "true" or "false".');
            process.exit(1);
        }
    }

    if (isNaN(confidence) && (isNSFW === true || isNSFW === false)) {
        args.confidence = args.isNSFW ? 0.99 : 0.01; // Default high/low confidence if not specified
    } else if (isNaN(confidence) && !isNSFW) { // if isNSFW is not specified, no confidence will be set
        args.confidence = 0;
    } else if (confidence < 0 || confidence > 1) {
        console.error('Error: --confidence must be a number between 0 and 1.');
        process.exit(1);
    }

    console.log('Chargement des données...');
    const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

    let found = false;
    db.breaches.forEach(breach => {
        if (breach.slug === identifier || breach.Name === identifier) {
            breach.isNSFW = args.isNSFW;
            breach.nsfwConfidence = parseInt(args.confidence);
            breach.manualNSFWOverride = true;
            found = true;
            console.log(`Override applied to breach: ${breach.Name || breach.slug}`);
            console.log(`  isNSFW: ${breach.isNSFW}, nsfwConfidence: ${breach.nsfwConfidence}`);
        }
    });

    if (!found) {
        console.error(`Error: Breach with slug or name "${identifier}" not found.`);
        process.exit(1);
    }

    fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
    // Also update the other breaches.json files as resort-breaches.js does
    fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));
    fs.writeFileSync(path.join(baseDir, 'source', '_data', 'breaches.json'), JSON.stringify(db, null, 2));


    console.log('Override complete. Breaches data updated.');
}

forceNsfwOverride().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
