const fs = require('fs');
const path = require('path');
const { Input, Confirm, Select } = require('enquirer');
const chalk = require('chalk');

const baseDir = path.join(__dirname);
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');
const dataFileSecondary = path.join(baseDir, 'source', 'data', 'breaches.json');

function slugify(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

function isValidIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(value);
  return !Number.isNaN(d.getTime());
}

function normalizeBreachesDb(db) {
  if (!db || typeof db !== 'object') return { breaches: [] };
  if (!Array.isArray(db.breaches)) db.breaches = [];
  return db;
}

function resortAndReindex(db) {
  db.breaches.sort((a, b) => {
    const dateA = a && a.BreachDate ? new Date(a.BreachDate) : new Date(0);
    const dateB = b && b.BreachDate ? new Date(b.BreachDate) : new Date(0);
    return dateA - dateB;
  });

  let i = -1;
  db.breaches.forEach((breach) => {
    if (!breach) return;
    if (!(breach.categories && Array.isArray(breach.categories))) breach.categories = [];
    const invalidcategory = ["hygiène numérique", "sécurité", "cybersécurité", "cybercriminalité", "cyberguerre"];
    const category = breach.categories[0];
    if (category === '') breach.IsRetired = true;
    if (!Number.isNaN(parseInt(category))) invalidcategory.push(category);
    if (typeof category === 'string' && invalidcategory.includes(category.toLowerCase())) breach.IsRetired = true;
    if (typeof breach.Name === 'string' && breach.Name.split('fuite')[0] === '') breach.IsRetired = true;

    if (!Object.prototype.hasOwnProperty.call(breach, 'isNSFW')) breach.isNSFW = false;
    if (!Object.prototype.hasOwnProperty.call(breach, 'lien')) {
      const pathValue = String(breach.path || '');
      const hibpSlug = pathValue.includes('breaches/') ? pathValue.split('breaches/')[1] : '';
      breach.lien = hibpSlug ? `https://haveibeenpwned.com/Breach/${hibpSlug}` : null;
    }

    if (!breach.IsRetired) i++;
    breach.index = i;
  });

  db.totalBreaches = db.breaches.length;
  db.lastUpdated = new Date().toISOString();
}

async function promptInput(message, initial, validate) {
  const prompt = new Input({ message, initial, validate });
  return prompt.run();
}

async function main() {
  let db;
  try {
    db = normalizeBreachesDb(JSON.parse(fs.readFileSync(dataFile, 'utf-8')));
  } catch (e) {
    console.error(new chalk.Chalk().red(`Erreur: impossible de lire ${dataFile}`));
    process.exit(1);
  }

  const sourceType = await new Select({
    message: 'Type de source',
    choices: [
      { name: 'Have I Been Pwned', value: 'hibp' },
      { name: 'Manuel / autre source', value: 'custom' }
    ]
  }).run();

  const title = await promptInput('Titre', '', (v) => (v && v.trim().length ? true : 'Le titre est requis'));
  const name = await promptInput('Nom', title, (v) => (v && v.trim().length ? true : 'Le nom est requis'));
  const breachDate = await promptInput('Date (YYYY-MM-DD)', new Date().toISOString().slice(0, 10), (v) => (isValidIsoDate(v) ? true : 'Format attendu: YYYY-MM-DD'));
  const domain = await promptInput('Domaine (optionnel)', '', () => true);
  const pwnCountRaw = await promptInput('Comptes affectés (nombre)', '0', (v) => (!Number.isNaN(Number(v)) && Number(v) >= 0 ? true : 'Entrez un nombre >= 0'));
  const category = await promptInput('Catégorie (obligatoire)', '', (v) => (v && v.trim().length ? true : 'La catégorie est requise'));
  const description = await promptInput('Description', '', () => true);
  const isNSFW = await new Confirm({ message: 'Marquer comme NSFW ?', initial: false }).run();
  const validated = await new Confirm({ message: 'Marquer comme validée ?', initial: true }).run();

  let lien = null;
  let pathValue = null;

  if (sourceType === 'hibp') {
    const hibpSlug = await promptInput('Slug HIBP (ex: gpotato)', slugify(name), (v) => (v && v.trim().length ? true : 'Le slug est requis'));
    pathValue = `breaches/${hibpSlug}`;
    lien = `https://haveibeenpwned.com/Breach/${hibpSlug}`;
  } else {
    lien = await promptInput('Lien externe (optionnel)', '', () => true);
    pathValue = `custom/${slugify(name)}`;
    if (!lien || !String(lien).trim().length) lien = null;
  }

  const now = new Date().toISOString();
  const formattedDate = isValidIsoDate(breachDate) ? breachDate : '1970-01-01';
  const slug = slugify(name);
  const newBreach = {
    Name: name,
    Title: title,
    Domain: domain && domain.trim().length ? domain.trim() : null,
    BreachDate: breachDate,
    AddedDate: now,
    ModifiedDate: now,
    PwnCount: Number(pwnCountRaw),
    Description: description || '',
    LogoPath: 'https://logos.haveibeenpwned.com/List.png',
    Attribution: null,
    DisclosureUrl: null,
    DataClasses: [],
    IsVerified: false,
    IsFabricated: false,
    IsSensitive: false,
    IsRetired: false,
    IsSpamList: false,
    IsMalware: false,
    IsSubscriptionFree: false,
    IsStealerLog: false,
    slug,
    path: pathValue,
    formattedDate,
    categories: [category],
    isNSFW,
    lien,
    validated
  };

  const existingIndex = db.breaches.findIndex((b) => b && b.Name === name);
  if (existingIndex !== -1) {
    const overwrite = await new Confirm({ message: `Une entrée '${name}' existe déjà. Remplacer ?`, initial: false }).run();
    if (!overwrite) {
      console.log(new chalk.Chalk().yellow('Aucune modification.'));
      return;
    }
    db.breaches[existingIndex] = newBreach;
  } else {
    db.breaches.push(newBreach);
  }

  resortAndReindex(db);

  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
  try {
    fs.mkdirSync(path.dirname(dataFileSecondary), { recursive: true });
    fs.writeFileSync(dataFileSecondary, JSON.stringify(db, null, 2));
  } catch {
  }

  console.log(new chalk.Chalk().green(`OK: entrée enregistrée (${name})`));
}

main().catch((e) => {
  console.error(new chalk.Chalk().red('Erreur inattendue'));
  console.error(e);
  process.exit(1);
});
