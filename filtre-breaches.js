const fs = require('fs');
const path = require('path');
const { Select, Confirm } = require('enquirer');
const chalk = require('chalk');

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
        data.breaches = breaches.filter(entry => !rejectedForDeletion.includes(entry));
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

    process.on('SIGINT', saveAndExit);

    for (const entry of entriesToValidate) {
        if (interrupted) break;

        console.clear();
        console.log(new chalk.Chalk().cyan('\n----------------------------------------\n'));
        console.log(new chalk.Chalk().cyan('|              Brèche de données            |\n'));
        console.log(new chalk.Chalk().cyan('----------------------------------------\n'));
        console.log(new chalk.Chalk().blue(`Sensible: ${entry.isNSFW ? 'Oui' : 'Non'}`));
        console.log(new chalk.Chalk().blue(`Restantes: ${entriesToValidate.length - entriesToValidate.indexOf(entry)}`));
        console.log(new chalk.Chalk().bold.white(`Nom: ${entry.Name}`));
        console.log(new chalk.Chalk().white(`Titre: ${entry.Title}`));
        console.log(new chalk.Chalk().white(`Date de la brèche: ${entry.BreachDate}`));
        console.log(new chalk.Chalk().white(`Nombre de comptes affectés: ${entry.PwnCount.toLocaleString()}`));
        console.log(new chalk.Chalk().white(`Description: ${entry.Description}\n`));

        let action;
        if (entry.Name.includes("cve-")) {
            console.log(new chalk.Chalk().yellow('⚠️  Cette entrée contient un identifiant CVE et sera automatiquement rejetée.'));
            action = "reject";
        } else {
            const prompt = new Select({
                name: 'action',
                message: 'Que souhaitez-vous faire avec cette entrée ?',
                choices: [
                    { name: '✅ Valider cette entrée', value: 'validate' },
                    { name: '✅ Valider et marquer comme NSFW', value: 'validate_nsfw' },
                    { name: '❌ Rejeter (supprimer définitivement)', value: 'reject' },
                    { name: '⏭️  Sauter (pour plus tard)', value: 'skip' },
                    { name: '💾 Sauvegarder et quitter', value: 'exit' },
                ],
            });
            action = await prompt.run();
        }

        if (action === 'reject' && !entry.Name.includes("cve-")) {
            const confirmPrompt = new Confirm({
                name: 'confirm',
                message: 'Êtes-vous sûr de vouloir supprimer cette entrée ?',
                initial: false,
            });
            const confirm = await confirmPrompt.run();
            if (!confirm) {
                action = 'skip';
            }
        }

        switch (action) {
            case 'validate':
                entry.validated = true;
                if (entry.isNSFW) nsfwCount++;
                validatedCount++;
                console.log(new chalk.Chalk().green('--> Entrée validée.'));
                break;
            case 'validate_nsfw':
                entry.validated = true;
                entry.isNSFW = true;
                validatedCount++;
                nsfwCount++;
                console.log(new chalk.Chalk().magenta('--> Entrée validée et marquée NSFW.'));
                break;
            case 'reject':
                rejectedForDeletion.push(entry);
                rejectedCount++;
                console.log(new chalk.Chalk().red('--> Entrée marquée pour suppression.'));
                break;
            case 'skip':
                entry.validated = null;
                skippedCount++;
                console.log(new chalk.Chalk().gray('--> Entrée sautée.'));
                break;
            case 'exit':
                interrupted = true;
                break;
        }
    }

    const finalBreaches = breaches.filter(entry => !rejectedForDeletion.includes(entry));
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