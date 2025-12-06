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

            let nsfwCount = 0;

            let interrupted = false;

            const rejectedForDeletion = [];

        

            const saveAndExit = () => {

                // Filtrer les entrées rejetées avant de sauvegarder

                data.breaches = breaches.filter(entry => !rejectedForDeletion.includes(entry));

                

                // Nettoyer les entrées sautées pour la prochaine session

                data.breaches.forEach(entry => {

                    if (entry.validated === null) {

                        delete entry.validated;

                    }

                });

        

                fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

                console.log(chalk.yellow('\n\nProgression sauvegardée.'));

                console.log(chalk.green(`Validées: ${validatedCount} (dont ${nsfwCount} NSFW)`), chalk.red(`Supprimées: ${rejectedCount}`), chalk.gray(`Sautées: ${skippedCount}`));

                process.exit(0);

            };

        

            process.on('SIGINT', saveAndExit); // Gérer Ctrl+C

        

            for (const entry of entriesToValidate) {

                if (interrupted) break;

                console.clear();

                console.log(chalk.cyan('\n----------------------------------------\n'));
                console.log(chalk.cyan('|              Brèche de données            |\n'));
                console.log(chalk.cyan('----------------------------------------\n'));
                    console.log(chalk.blue(`sensible: ${entry.isNSFW}`));
                    console.log(chalk.blue(`restante: ${entriesToValidate.length-entriesToValidate.indexOf(entry)}`));
                console.log(chalk.bold.white(`Nom: ${entry.Name}`));

                console.log(chalk.white(`Titre: ${entry.Title}`));

                console.log(chalk.white(`Date de la brèche: ${entry.BreachDate}`));

                console.log(chalk.white(`Nombre de comptes affectés: ${entry.PwnCount.toLocaleString()}`));

                console.log(chalk.white(`Description: ${entry.Description}
                    `));

                let action
                if(entry.Name.includes("cve")){
                    action="reject"
                }else{
                      action= { action } = await inquirer.prompt([

                    {

                        type: 'list',

                        name: 'action',

                        message: 'Valider cette entrée ?',

                        choices: [

                            { name: 'Valider', value: 'validate' },

                            { name: 'Valider et marquer NSFW', value: 'validate_nsfw' },

                            { name: 'Rejeter (Supprimer)', value: 'reject' },

                            { name: 'Sauter (pour plus tard)', value: 'skip' },

                            new inquirer.Separator(),

                            { name: 'Sauvegarder et quitter', value: 'exit' },

                        ],

                    },

                ]);
                }
        

              

        

                if (action === 'validate') {

                    entry.validated = true;
                    if(entry.isNSFW){
                        nsfwCount++;
                    }
                    
                    validatedCount++;

                    console.log(chalk.green('--> Entrée validée.'));

                } else if (action === 'validate_nsfw') {

                    entry.validated = true;

                    entry.isNSFW = true;

                    validatedCount++;

                    nsfwCount++;

                    console.log(chalk.magenta('--> Entrée validée et marquée NSFW.'));

                } else if (action === 'reject') {

                    rejectedForDeletion.push(entry);

                    rejectedCount++;

                    console.log(chalk.red('--> Entrée marquée pour suppression.'));

                } else if (action === 'skip') {

                    entry.validated = null; // Marqueur pour sauter

                    skippedCount++;

                    console.log(chalk.gray('--> Entrée sautée.'));

                } else if (action === 'exit') {

                    interrupted = true;

                }

            }

            

            // Filtrer les entrées rejetées

            const finalBreaches = breaches.filter(entry => !rejectedForDeletion.includes(entry));

        

            // Nettoyer les entrées sautées pour la prochaine session

            finalBreaches.forEach(entry => {

                if (entry.validated === null) {

                    delete entry.validated;

                }

            });

        

            data.breaches = finalBreaches;

            data.lastUpdated = new Date().toISOString();

        

            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));

        

            console.log(chalk.cyan('\n----------------------------------------'));

            console.log(chalk.bold.green('Validation terminée !'));

            console.log(`- ${validatedCount} entrées validées (dont ${nsfwCount} marquées NSFW)`);

            console.log(`- ${rejectedCount} entrées supprimées`);

            console.log(`- ${skippedCount} entrées sautées cette session`);

            console.log(chalk.blue(`Le fichier ${DATA_FILE} a été mis à jour.`));

        }
main().catch(error => {
    console.error(chalk.red('Une erreur inattendue est survenue:'));
    console.error(error);
});