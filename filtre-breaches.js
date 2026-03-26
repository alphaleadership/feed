const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
const { getBreachesDB } = require('./scripts/db');

// --- Validation Logic ---
async function validateEntries(dbInstance) {
    const breaches = dbInstance.data.breaches;
    const entriesToValidate = breaches.filter(entry => entry.validated === undefined);

    if (entriesToValidate.length === 0) {
        console.log(new chalk.Chalk().green('Toutes les entrées ont déjà été validées.'));
        return { modifiedBreaches: breaches, stats: {} };
    }

    console.log(new chalk.Chalk().blue(`Il y a ${entriesToValidate.length} entrées à valider.`));

    let validatedCount = 0, rejectedCount = 0, skippedCount = 0, nsfwCount = 0, interrupted = false;
    const rejectedForDeletion = [];

    const saveAndExit = async () => {
        const finalBreaches = dbInstance.data.breaches.filter(entry => !rejectedForDeletion.includes(entry.Name));
        finalBreaches.forEach(entry => {
            if (entry.validated === null) delete entry.validated;
        });
        console.log(new chalk.Chalk().yellow('\n\nProgression sauvegardée.'));
        console.log(new chalk.Chalk().green(`Validées: ${validatedCount} (dont ${nsfwCount} NSFW)`), new chalk.Chalk().red(`Supprimées: ${rejectedCount}`), new chalk.Chalk().gray(`Sautées: ${skippedCount}`));
        
        dbInstance.data.breaches = finalBreaches;
        dbInstance.data.lastUpdated = new Date().toISOString();
        await dbInstance.save();
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
        if (entry.Name.toLowerCase().includes("cve-")) {
            console.log(new chalk.Chalk().yellow('⚠️  Cette entrée CVE sera automatiquement rejetée.'));
            action = "reject";
        } else {
            const { action: promptAction } = await inquirer.default.prompt([
                {
                    type: 'list',
                    name: 'action',
                    message: 'Action pour cette entrée ?',
                    choices: [
                        { name: '✅ Valider', value: 'validate' },
                        { name: '🔞 Valider et marquer NSFW', value: 'validate_nsfw' },
                        { name: '❌ Rejeter (supprimer)', value: 'reject' },
                        { name: '⏭️  Sauter', value: 'skip' },
                        { name: '💾 Sauvegarder et quitter', value: 'exit' },
                    ],
                }
            ]);
            action = promptAction;
        }

        if (action === 'reject' && !entry.Name.toLowerCase().includes("cve-")) {
            const { confirm } = await inquirer.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirm',
                    message: 'Êtes-vous sûr de vouloir supprimer cette entrée ?',
                    default: false,
                }
            ]);
            if (!confirm) action = 'skip';
        }

        if (fs.existsSync('filtre-breaches.log')) {
            fs.appendFileSync('filtre-breaches.log', `[${new Date().toISOString()}] Action: ${action} | Entry: ${entry.Name}\n`);
        }
        
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
            default:
                rejectedForDeletion.push(entry.Name);
                rejectedCount++;
                break;
        }
    }

    const finalBreaches = dbInstance.data.breaches.filter(entry => !rejectedForDeletion.includes(entry.Name));
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

    // Step 1: Get search term
    const { searchTerm } = await inquirer.default.prompt([
        {
            type: 'input',
            name: 'searchTerm',
            message: 'Rechercher une entrée à éditer (tapez une partie du nom):',
        }
    ]);

    if (!searchTerm || searchTerm.trim() === '') {
        console.log(new chalk.Chalk().yellow('Recherche annulée.'));
        return breaches;
    }

    // Step 2: Filter breaches based on search term
    const matchedBreaches = breaches.filter(b => 
        b.Name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    let breachToEdit;
    if (matchedBreaches.length === 0) {
        console.log(new chalk.Chalk().red('Aucune entrée trouvée.'));
        return breaches;
    } else {
        const { selectedBreachName } = await inquirer.default.prompt([
            {
                type: 'list',
                name: 'selectedBreachName',
                message: 'Résultats de la recherche, veuillez en choisir un:',
                choices: matchedBreaches.map(b => ({name: `${b.Name} - ${b.PwnCount.toLocaleString()} comptes affectés`, value: b.Name})),
            }
        ]);
        breachToEdit = findBreach(selectedBreachName);
    }

    if (!breachToEdit) {
        console.log(new chalk.Chalk().red("Erreur lors de la sélection de l'entrée."));
        return breaches;
    }

    console.clear();
    console.log(new chalk.Chalk().cyan('----------------------------------------'));
    console.log(new chalk.Chalk().cyan('|         Édition de la brèche         |'));
    console.log(new chalk.Chalk().cyan('----------------------------------------'));
    console.log(new chalk.Chalk().yellow(JSON.stringify(breachToEdit, null, 2)));
    console.log('\n');
    
    const currentValue = breachToEdit["PwnCount"];
    let newValue;

    const { value } = await inquirer.default.prompt([
        {
            type: 'input',
            name: 'value',
            message: `Nouveau PwnCount pour '${breachToEdit.Name}':`,
            default: currentValue
        }
    ]);
    newValue = value;
    
    breachToEdit["PwnCount"] = Number(newValue);

    console.log(new chalk.Chalk().green('\nEntrée mise à jour. Voici le nouvel objet:'));
    console.log(new chalk.Chalk().yellow(JSON.stringify(breachToEdit, null, 2)));

    return breaches; // Return the full modified list
}


// --- Main Application ---
async function main() {
    const dbInstance = await getBreachesDB();
    const data = dbInstance.data;
    let breaches = data.breaches || [];

    const args = process.argv.slice(2);
    const command = args[0] ? args[0].toLowerCase().trim() : '';

    if (command === 'valider' || command === 'v') {
        const { modifiedBreaches, stats } = await validateEntries(dbInstance);
        data.breaches = modifiedBreaches;
        data.lastUpdated = new Date().toISOString();
        await dbInstance.save();
        console.log(new chalk.Chalk().cyan('\n----------------------------------------'));
        console.log(new chalk.Chalk().bold.green('Validation terminée !'));
        if (stats && stats.validatedCount !== undefined) {
            console.log(`- ${stats.validatedCount} entrées validées (dont ${stats.nsfwCount} NSFW)`);
            console.log(`- ${stats.rejectedCount} entrées supprimées`);
            console.log(`- ${stats.skippedCount} entrées sautées`);
        }
    } else if (command === 'éditer' || command === 'editer' || command === 'e') {
        if (args.length >= 3) {
            const name = args[1];
            const pwnCount = Number(args[2]);
            const breach = breaches.find(b => b.Name === name);
            if (!breach) {
                console.error(new chalk.Chalk().red(`Erreur: Brèche "${name}" non trouvée.`));
                process.exit(1);
            }
            breach.PwnCount = pwnCount;
            data.lastUpdated = new Date().toISOString();
            await dbInstance.save();
            console.log(new chalk.Chalk().green(`Brèche "${name}" mise à jour avec PwnCount: ${pwnCount}`));
        } else {
            const modifiedBreaches = await editEntry(breaches);
            data.breaches = modifiedBreaches;
            data.lastUpdated = new Date().toISOString();
            const { confirmSave } = await inquirer.default.prompt([
                {
                    type: 'confirm',
                    name: 'confirmSave',
                    message: 'Sauvegarder les modifications ?',
                    default: true,
                }
            ]);
            if (confirmSave) {
                await dbInstance.save();
                console.log(new chalk.Chalk().green("Modifications sauvegardées."));
            } else {
                console.log(new chalk.Chalk().yellow("Modifications annulées."));
            }
        }
    } else {
        if (command && command !== 'quitter' && command !== 'q') {
            console.log(new chalk.Chalk().red(`Commande non reconnue: ${command}`));
        }
        console.log(new chalk.Chalk().cyan('Usage:'));
        console.log('  node filtre-breaches.js valider           - Lance la validation interactive');
        console.log('  node filtre-breaches.js editer <nom> <pwn> - Édite le PwnCount d\'une brèche directement');
        console.log('  node filtre-breaches.js editer            - Lance l\'édition interactive');
    }
}
main().catch(error => {
    if (error) {
        console.error(new chalk.Chalk().red('Une erreur inattendue est survenue:'));
        console.error(error);
    } else {
        console.log(new chalk.Chalk().yellow('\nOpération annulée.'));
    }
});
