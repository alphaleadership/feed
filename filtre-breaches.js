const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const chalk = require('chalk');
console.log(inquirer);
const DATA_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');

async function main() {
    let data;
    try {
        const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
        data = JSON.parse(fileContent);
    } catch (error) {
        console.error(new chalk.Chalk().red(`Erreur: Impossible de lire ou de parser le fichier ${DATA_FILE}`));
        console.error(error);
        process.exit(1);
    }

    const breaches = data.breaches || [];
    const entriesToValidate = breaches.filter(entry => entry.validated === undefined);

    if (entriesToValidate.length === 0) {
        console.log(new chalk.Chalk().green('Toutes les entrées ont déjà été validées.'));
        return;
    }

    console.log(new chalk.Chalk().blue(`Il y a ${entriesToValidate.length} entrées à valider.`));

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

                console.log(new chalk.Chalk().yellow('\n\nProgression sauvegardée.'));

                console.log(new chalk.Chalk().green(`Validées: ${validatedCount} (dont ${nsfwCount} NSFW)`), chalk.red(`Supprimées: ${rejectedCount}`), chalk.gray(`Sautées: ${skippedCount}`));

                process.exit(0);

            };

        

            process.on('SIGINT', saveAndExit); // Gérer Ctrl+C

        

            for (const entry of entriesToValidate) {

                if (interrupted) break;

                console.clear();

                console.log(new chalk.Chalk().cyan('\n----------------------------------------\n'));
                console.log(new chalk.Chalk().cyan('|              Brèche de données            |\n'));
                console.log(new chalk.Chalk().cyan('----------------------------------------\n'));
                    console.log(new chalk.Chalk().blue(`sensible: ${entry.isNSFW}`));
                    console.log(new chalk.Chalk().blue(`restante: ${entriesToValidate.length-entriesToValidate.indexOf(entry)}`));
                console.log(new chalk.Chalk().bold.white(`Nom: ${entry.Name}`));

                console.log(new chalk.Chalk().white(`Titre: ${entry.Title}`));

                console.log(new chalk.Chalk().white(`Date de la brèche: ${entry.BreachDate}`));

                console.log(new chalk.Chalk().white(`Nombre de comptes affectés: ${entry.PwnCount.toLocaleString()}`));

                console.log(new chalk.Chalk().white(`Description: ${entry.Description}
                    `));

                let action
                if(entry.Name.includes("cve-")){
                    action="reject"
                }else{
                      const value = await inquirer.default.prompt([

                    {

                        type: 'list',

                        name: 'action',

                        message: 'Valider cette entrée ?',

                        choices: [

                            { name: 'Valider', value: 'validate' },

                            { name: 'Valider et marquer NSFW', value: 'validate_nsfw' },

                            { name: 'Rejeter (Supprimer)', value: 'reject' },

                            { name: 'Sauter (pour plus tard)', value: 'skip' },

                         

                            { name: 'Sauvegarder et quitter', value: 'exit' },

                        ],

                    },

                ]);
                action = value.action;
                console.log(action)
                }
        

              

        

                if (action === 'validate') {

                    entry.validated = true;
                    if(entry.isNSFW){
                        nsfwCount++;
                    }
                    
                    validatedCount++;

                    console.log(new chalk.Chalk().green('--> Entrée validée.'));

                } else if (action === 'validate_nsfw') {

                    entry.validated = true;

                    entry.isNSFW = true;

                    validatedCount++;

                    nsfwCount++;

                    console.log(new chalk.Chalk().magenta('--> Entrée validée et marquée NSFW.'));

                } else if (action === 'reject') {

                    rejectedForDeletion.push(entry);

                    rejectedCount++;

                    console.log(new chalk.Chalk().red('--> Entrée marquée pour suppression.'));

                } else if (action === 'skip') {

                    entry.validated = null; // Marqueur pour sauter

                    skippedCount++;

                    console.log(new chalk.Chalk().gray('--> Entrée sautée.'));

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

        

            console.log(new chalk.Chalk().cyan('\n----------------------------------------'));

            console.log(new chalk.Chalk().bold.green('Validation terminée !'));

            console.log(`- ${validatedCount} entrées validées (dont ${nsfwCount} marquées NSFW)`);

            console.log(`- ${rejectedCount} entrées supprimées`);

            console.log(`- ${skippedCount} entrées sautées cette session`);

            console.log(new chalk.Chalk().blue(`Le fichier ${DATA_FILE} a été mis à jour.`));

        }
        
main().catch(error => {
    console.error(new chalk.Chalk().red('Une erreur inattendue est survenue:'));
    console.error(error);
});