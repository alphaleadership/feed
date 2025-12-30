const fs = require('fs');
const path = require('path');
const { Select, Confirm, Input, AutoComplete } = require('enquirer');
const chalk = require('chalk');

const DATA_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');

// Helper to read data
function loadData() {
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(fileContent);
    } catch (error) {
        console.error(new chalk.Chalk().red(`Erreur: Impossible de lire ou de parser le fichier ${DATA_FILE}`));
        console.error(error);
        process.exit(1);
    }
}

// Helper to save data
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log(new chalk.Chalk().blue(`\nLe fichier ${DATA_FILE} a été mis à jour.`));
}

// Main menu
async function promptMainMenu() {
    const { action } = await new Select({
        name: 'action',
        message: 'Que souhaitez-vous faire ?',
        choices: [
            { name: '🕵️  Valider les nouvelles entrées', value: 'validate' },
            { name: '✏️  Éditer une entrée existante', value: 'edit' },
            { name: '🚪 Quitter', value: 'exit' }
        ]
    }).run();
    return action;
}

// --- Validation Logic ---
async function validateEntries(breaches) {
    const entriesToValidate = breaches.filter(entry => entry.validated === undefined);

    if (entriesToValidate.length === 0) {
        console.log(new chalk.Chalk().green('Toutes les entrées ont déjà été validées.'));
        return { modifiedBreaches: breaches, stats: {} };
    }

    console.log(new chalk.Chalk().blue(`Il y a ${entriesToValidate.length} entrées à valider.`));

    let validatedCount = 0, rejectedCount = 0, skippedCount = 0, nsfwCount = 0, interrupted = false;
    const rejectedForDeletion = [];

    const saveAndExit = () => {
        const finalBreaches = breaches.filter(entry => !rejectedForDeletion.includes(entry.Name));
        finalBreaches.forEach(entry => {
            if (entry.validated === null) delete entry.validated;
        });
        console.log(new chalk.Chalk().yellow('\n\nProgression sauvegardée.'));
        console.log(new chalk.Chalk().green(`Validées: ${validatedCount} (dont ${nsfwCount} NSFW)`), new chalk.Chalk().red(`Supprimées: ${rejectedCount}`), new chalk.Chalk().gray(`Sautées: ${skippedCount}`));
        saveData({ breaches: finalBreaches, lastUpdated: new Date().toISOString() });
        process.exit(0);
    };

    process.on('SIGINT', saveAndExit);

    for (const entry of entriesToValidate) {
        if (interrupted) break;

        console.clear();
        console.log(new chalk.Chalk().cyan('----------------------------------------'));
        console.log(new chalk.Chalk().cyan('|       Validation de la brèche        |'));
        console.log(new chalk.Chalk().cyan('----------------------------------------'));
        console.log(new chalk.Chalk().blue(`Sensible: ${entry.isNSFW ? 'Oui' : 'Non'}`));
        console.log(new chalk.Chalk().blue(`Restantes: ${entriesToValidate.length - entriesToValidate.indexOf(entry)}`));
        console.log(new chalk.Chalk().bold.white(`Nom: ${entry.Name}`));
        console.log(new chalk.Chalk().white(`Titre: ${entry.Title}`));
        console.log(new chalk.Chalk().white(`Date: ${entry.BreachDate}`));
        console.log(new chalk.Chalk().white(`Comptes affectés: ${entry.PwnCount.toLocaleString()}`));
        console.log(new chalk.Chalk().white(`Description: ${entry.Description}\n`));

        let action;
        if (entry.Name.includes("cve-")) {
            console.log(new chalk.Chalk().yellow('⚠️  Cette entrée CVE sera automatiquement rejetée.'));
            action = "reject";
        } else {
            const prompt = new Select({
                name: 'action',
                message: 'Action pour cette entrée ?',
                choices: [
                    { name: '✅ Valider', value: 'validate' },
                    { name: '🔞 Valider et marquer NSFW', value: 'validate_nsfw' },
                    { name: '❌ Rejeter (supprimer)', value: 'reject' },
                    { name: '⏭️  Sauter', value: 'skip' },
                    { name: '💾 Sauvegarder et quitter', value: 'exit' },
                ],
            });
            action = await prompt.run();
        }

        if (action === 'reject' && !entry.Name.includes("cve-")) {
            const confirm = await new Confirm({ name: 'confirm', message: 'Êtes-vous sûr de vouloir supprimer cette entrée ?', initial: false }).run();
            if (!confirm) action = 'skip';
        }

        fs.appendFileSync('filtre-breaches.log', `[${new Date().toISOString()}] Action: ${action} | Entry: ${entry.Name}\n`);
        
        switch (action) {
            case 'validate':
                entry.validated = true;
                validatedCount++;
                break;
            case 'validate_nsfw':
                entry.validated = true;
                entry.isNSFW = true;
                validatedCount++;
                nsfwCount++;
                break;
            case 'reject':
                rejectedForDeletion.push(entry.Name);
                rejectedCount++;
                break;
            case 'skip':
                entry.validated = null;
                skippedCount++;
                break;
            case 'exit':
                interrupted = true;
                break;
        }
    }

    const finalBreaches = breaches.filter(entry => !rejectedForDeletion.includes(entry.Name));
    finalBreaches.forEach(entry => {
        if (entry.validated === null) delete entry.validated;
    });

    return { 
        modifiedBreaches: finalBreaches, 
        stats: { validatedCount, nsfwCount, rejectedCount, skippedCount }
    };
}


// --- Editing Logic ---
async function editEntry(breaches) {
    const findBreach = (name) => breaches.find(b => b.Name === name);

    const { breachName } = await new AutoComplete({
        name: 'breachName',
        message: 'Quelle entrée éditer ? (commencez à taper pour chercher)',
        limit: 10,
        choices: breaches.map(b => b.Name),
    }).run();

    const breachToEdit = findBreach(breachName);
    if (!breachToEdit) {
        console.log(new chalk.Chalk().red("Entrée non trouvée."));
        return breaches;
    }

    console.clear();
    console.log(new chalk.Chalk().cyan('----------------------------------------'));
    console.log(new chalk.Chalk().cyan('|         Édition de la brèche         |'));
    console.log(new chalk.Chalk().cyan('----------------------------------------'));
    console.log(new chalk.Chalk().yellow(JSON.stringify(breachToEdit, null, 2)));
    console.log('\n');
    
    const { fieldToEdit } = await new Select({
        name: 'fieldToEdit',
        message: 'Quel champ éditer ?',
        choices: Object.keys(breachToEdit),
    }).run();

    const currentValue = breachToEdit[fieldToEdit];
    let newValue;

    if (typeof currentValue === 'boolean') {
        newValue = await new Confirm({
            name: 'value',
            message: `Nouvelle valeur pour '${fieldToEdit}'?`,
            initial: currentValue
        }).run();
    } else {
        newValue = await new Input({
            name: 'value',
            message: `Nouvelle valeur pour '${fieldToEdit}':`,
            initial: currentValue,
        }).run();
    }
    
    // Type casting
    if (typeof currentValue === 'number') {
        breachToEdit[fieldToEdit] = Number(newValue);
    } else if (typeof currentValue === 'boolean') {
         breachToEdit[fieldToEdit] = newValue;
    }
    else {
        breachToEdit[fieldToEdit] = newValue;
    }

    console.log(new chalk.Chalk().green('\nEntrée mise à jour. Voici le nouvel objet:'));
    console.log(new chalk.Chalk().yellow(JSON.stringify(breachToEdit, null, 2)));

    return breaches; // Return the full modified list
}


// --- Main Application ---
async function main() {
    const data = loadData();
    let breaches = data.breaches || [];

    const action = await promptMainMenu();

    if (action === 'validate') {
        const { modifiedBreaches, stats } = await validateEntries(breaches);
        data.breaches = modifiedBreaches;
        data.lastUpdated = new Date().toISOString();
        saveData(data);
        console.log(new chalk.Chalk().cyan('\n----------------------------------------'));
        console.log(chalk.bold.green('Validation terminée !'));
        console.log(`- ${stats.validatedCount} entrées validées (dont ${stats.nsfwCount} NSFW)`);
        console.log(`- ${stats.rejectedCount} entrées supprimées`);
        console.log(`- ${stats.skippedCount} entrées sautées`);
    } else if (action === 'edit') {
        const modifiedBreaches = await editEntry(breaches);
        data.breaches = modifiedBreaches;
        data.lastUpdated = new Date().toISOString();
        const confirmSave = await new Confirm({ name: 'confirm', message: 'Sauvegarder les modifications ?', initial: true }).run();
        if (confirmSave) {
            saveData(data);
        } else {
            console.log(new chalk.Chalk().yellow("Modifications annulées."));
        }
    } else {
        console.log('Au revoir !');
    }
}

main().catch(error => {
    console.error(new chalk.Chalk().red('Une erreur inattendue est survenue:'));
    console.error(error);
});