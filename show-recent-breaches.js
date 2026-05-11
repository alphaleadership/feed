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

    const now = new Date('2026-05-11'); // Use the current date from session context
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const recentBreaches = breaches.filter(b => {
        if (!b.BreachDate) return false;
        const breachDate = new Date(b.BreachDate);
        return breachDate >= sevenDaysAgo;
    });

    // Sort by date descending
    recentBreaches.sort((a, b) => new Date(b.BreachDate) - new Date(a.BreachDate));

    console.log(c.cyan('----------------------------------------'));
    console.log(c.cyan(`|   Fuites récentes (7 derniers jours)  |`));
    console.log(c.cyan('----------------------------------------'));
    console.log(c.yellow(`Total trouvé: ${recentBreaches.length}\n`));

    recentBreaches.forEach(b => {
        console.log(`${c.bold.white(b.BreachDate)} - ${c.green(b.Name)}`);
        if (b.Description) {
            const shortDesc = b.Description.split('\n')[0].substring(0, 100);
            console.log(c.gray(`  ${shortDesc}...`));
        }
        console.log(c.blue(`  Lien: ${b.lien || b.path || 'N/A'}`));
        console.log('');
    });
}

main();
