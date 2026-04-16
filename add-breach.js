const fs = require('fs');
const path = require('path');
const { Input, Confirm, Select } = require('enquirer');
const chalk = require('chalk');
const { getBreachesDB } = require('./scripts/db');

/**
 * Parseur d'arguments simple pour éviter d'ajouter une dépendance
 */
function getArgs() {
  const args = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const key = argv[i].slice(2);
      const value = argv[i + 1];
      if (value && !value.startsWith('--')) {
        args[key] = value;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

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

async function main() {
  const args = getArgs();
  const dbInstance = await getBreachesDB();
  const db = dbInstance.data;
  const ck = new chalk.Chalk();

  // 1. Type de source
  let sourceType = args.source;
  if (!sourceType) {
    sourceType = await new Select({
      message: 'Type de source',
      choices: [
        { name: 'Have I Been Pwned', value: 'hibp' },
        { name: 'Manuel / autre source', value: 'custom' }
      ]
    }).run();
  }

  // Helper pour demander ou utiliser l'argument
  async function getVal(key, message, initial = '', validate = (v) => true) {
    if (args[key]) return args[key];
    const prompt = new Input({ message, initial, validate });
    return prompt.run();
  }

  // 2. Informations de base
  const title = await getVal('title', 'Titre', '', (v) => (v && v.trim().length ? true : 'Le titre est requis'));
  const name = await getVal('name', 'Nom', title, (v) => (v && v.trim().length ? true : 'Le nom est requis'));
  const breachDate = await getVal('date', 'Date (YYYY-MM-DD)', new Date().toISOString().slice(0, 10), (v) => (isValidIsoDate(v) ? true : 'Format attendu: YYYY-MM-DD'));
  const domain = await getVal('domain', 'Domaine (optionnel)', '');
  const pwnCountRaw = await getVal('count', 'Comptes affectés (nombre)', '0', (v) => (!Number.isNaN(Number(v)) && Number(v) >= 0 ? true : 'Entrez un nombre >= 0'));
  const category = await getVal('category', 'Catégorie (obligatoire)', '', (v) => (v && v.trim().length ? true : 'La catégorie est requise'));
  const description = await getVal('description', 'Description', '');
  
  const isNSFW = args.nsfw !== undefined ? (args.nsfw === 'true' || args.nsfw === true) : await new Confirm({ message: 'Marquer comme NSFW ?', initial: false }).run();
  const validated = args.validated !== undefined ? (args.validated === 'true' || args.validated === true) : await new Confirm({ message: 'Marquer comme validée ?', initial: true }).run();

  let lien = args.link || null;
  let pathValue = args.path || null;

  if (sourceType === 'hibp') {
    const hibpSlug = await getVal('hibp-slug', 'Slug HIBP (ex: gpotato)', slugify(name), (v) => (v && v.trim().length ? true : 'Le slug est requis'));
    pathValue = `breaches/${hibpSlug}`;
    if (!lien) lien = `https://haveibeenpwned.com/Breach/${hibpSlug}`;
  } else {
    if (!lien) lien = await getVal('link', 'Lien externe (optionnel)', '');
    if (!pathValue) pathValue = `custom/${slugify(name)}`;
    if (!lien || !String(lien).trim().length) lien = null;
  }

  const now = new Date().toISOString();
  const finalBreachDate = isValidIsoDate(breachDate) ? breachDate : '1970-01-01';
  const slug = slugify(name);
  
  const newBreach = {
    Name: name,
    Title: title,
    source: sourceType === 'hibp' ? 'Have I Been Pwned' : 'Manuel',
    Domain: domain && domain.trim().length ? domain.trim() : null,
    BreachDate: finalBreachDate,
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
    categories: [category],
    isNSFW,
    lien,
    validated
  };

  const existingIndex = db.breaches.findIndex((b) => b && b.Name === name);
  if (existingIndex !== -1) {
    const overwrite = args.force || await new Confirm({ message: `Une entrée '${name}' existe déjà. Remplacer ?`, initial: false }).run();
    if (!overwrite) {
      console.log(ck.yellow('Aucune modification.'));
      return;
    }
    db.breaches[existingIndex] = newBreach;
  } else {
    db.breaches.push(newBreach);
  }

  resortAndReindex(db);

  await dbInstance.save();
  
  // Synchronisation avec le fichier secondaire si nécessaire
  const dataFileSecondary = path.join(__dirname, 'source', 'data', 'breaches.json');
  try {
    fs.mkdirSync(path.dirname(dataFileSecondary), { recursive: true });
    fs.writeFileSync(dataFileSecondary, JSON.stringify(db, null, 2));
  } catch (err) {}

  console.log(ck.green(`OK: entrée enregistrée (${name})`));
}

main().catch((e) => {
  const ck = new chalk.Chalk();
  console.error(ck.red('Erreur inattendue'));
  console.error(e);
  process.exit(1);
});
