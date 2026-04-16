const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { getBreachesDB } = require('./scripts/db');

async function main() {
  const nameToRemove = process.argv[2];
  const ck = new chalk.Chalk();

  if (!nameToRemove) {
    console.error(ck.red('Erreur: Veuillez fournir le nom de la brèche à supprimer.'));
    process.exit(1);
  }

  const dbInstance = await getBreachesDB();
  const db = dbInstance.data;

  const initialCount = db.breaches.length;
  db.breaches = db.breaches.filter(b => b.Name !== nameToRemove);

  if (db.breaches.length === initialCount) {
    console.log(ck.yellow(`Aucune brèche trouvée avec le nom: ${nameToRemove}`));
    return;
  }

  // Recalculer les index (optionnel mais recommandé)
  db.breaches.forEach((b, i) => { b.index = i; });
  db.totalBreaches = db.breaches.length;
  db.lastUpdated = new Date().toISOString();

  await dbInstance.save();

  // Sync avec le fichier secondaire
  const dataFileSecondary = path.join(__dirname, 'source', 'data', 'breaches.json');
  try {
    fs.writeFileSync(dataFileSecondary, JSON.stringify(db, null, 2));
  } catch (err) {}

  console.log(ck.green(`Brèche '${nameToRemove}' supprimée avec succès.`));
}

main().catch(console.error);
