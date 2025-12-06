const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');

const DATA_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');

async function main() {
    let data;
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error(chalk.red(`Erreur: Impossible de lire ou de parser le fichier ${DATA_FILE}`));
        console.error(error);
        process.exit(1);
    }

    const breaches = data.breaches || [];
    const entriesToValidate = breaches.filter(entry => entry.validated === undefined);

    if (entriesToValidate.length === 0) {
        console.log(chalk.green('Toutes les entrées ont déjà été validées.'));
        return;
    }

    console.log(chalk.blue(`Il y a ${entriesToValidate.length} entrées à valider.`));

    let validatedCount = 0;
    let rejectedCount = 0;
    let skippedCount = 0;
    let interrupted = false;

    const saveAndExit = () => {
        data.breaches = breaches; // Assurez-vous que la liste complète est réassignée
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        console.log(chalk.yellow('\n\nProgression sauvegardée.'));
        console.log(chalk.green(`Validées: ${validatedCount}`), chalk.red(`Rejetées: ${rejectedCount}`), chalk.gray(`Sautées: ${skippedCount}`));
        process.exit(0);
    };

    process.on('SIGINT', saveAndExit); // Gérer Ctrl+C 

    for (const entry of entriesToValidate) {
        if (interrupted) break;

        console.log(chalk.cyan('\n----------------------------------------'));
        console.log(chalk.bold.white(`Nom: ${entry.Name}`));
        console.log(chalk.white(`Titre: ${entry.Title}`));
        console.log(chalk.white(`Date de la brèche: ${entry.BreachDate}`));
        console.log(chalk.white(`Nombre de comptes affectés: ${entry.PwnCount.toLocaleString()}`));
        console.log(chalk.white(`Description: ${entry.Description.substring(0, 250)}...`));


        const { action } = await inquirer.prompt([
            {
                type: 'list',
                name: 'action',
                message: 'Valider cette entrée ?',
                choices: [
                    { name: 'Valider', value: 'validate' },
                    { name: 'Rejeter', value: 'reject' },
                    { name: 'Sauter (pour plus tard)', value: 'skip' },
                    new inquirer.Separator(),
                    { name: 'Sauvegarder et quitter', value: 'exit' },
                ],
            },
        ]);

        if (action === 'validate') {
            entry.validated = true;
            validatedCount++;
            console.log(chalk.green('--> Entrée validée.'));
        } else if (action === 'reject') {
            entry.validated = false;
            rejectedCount++;
            console.log(chalk.red('--> Entrée rejetée.'));
        } else if (action === 'skip') {
            entry.validated = null; // Marqueur pour sauter
            skippedCount++;
            console.log(chalk.gray('--> Entrée sautée.'));
        } else if (action === 'exit') {
            interrupted = true;
        }
    }
    
    // Nettoyer les entrées sautées pour la prochaine session
    breaches.forEach(entry => {
        if (entry.validated === null) {
            delete entry.validated;
        }
    });

    data.breaches = breaches;
    data.lastUpdated = new Date().toISOString();

    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

    console.log(chalk.cyan('\n----------------------------------------'));
    console.log(chalk.bold.green('Validation terminée !'));
    console.log(`- ${validatedCount} entrées validées`);
    console.log(`- ${rejectedCount} entrées rejetées`);
    console.log(`- ${skippedCount} entrées sautées cette session`);
    console.log(chalk.blue(`Le fichier ${DATA_FILE} a été mis à jour.`));
}

main().catch(error => {
    console.error(chalk.red('Une erreur inattendue est survenue:'));
    console.error(error);
});