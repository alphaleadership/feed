'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Définir les chemins manuellement car nous sommes hors du contexte de Hexo
const baseDir = path.join(__dirname, '..');
const getfile=(f)=>{
    let content= fs.readFileSync(f).toString()
    if(content.startsWith("---")){
      return content
    }else
    {return "---\n"+content}
}
const defaultBreachSchema = {
  "Name": "",
  "Title": "",
  "Domain": null,
  "BreachDate": null,
  "AddedDate": null, // Sera défini dynamiquement
  "ModifiedDate": null, // Sera défini dynamiquement
  "PwnCount": 0,
  "Description": "",
  "LogoPath": null,
  "Attribution": null,
  "DisclosureUrl": null,
  "DataClasses": [],
  "IsVerified": false,
  "IsFabricated": false,
  "IsSensitive": false,
  "IsRetired": false,
  "IsSpamList": false,
  "IsMalware": false,
  "IsSubscriptionFree": false,
  "IsStealerLog": false,
  "slug": "",
  "path": "",
  "formattedDate": ""
};
if(fs.readdirSync(path.join(baseDir, 'source', '_posts')).filter((file)=>{ return fs.statSync(path.join(baseDir, 'source', '_posts',file)).isDirectory()}).length!=0){

function runImport() {
    fs.readdirSync(path.join(baseDir, 'source', '_posts')).filter((file)=>{return fs.statSync(path.join(baseDir, 'source', '_posts',file)).isDirectory()}).forEach((dir)=>{
  const importDir = path.join(baseDir, 'source', '_posts',dir);
console.log(importDir)
const dataFile = path.join(baseDir, 'source', 'data', 'breaches.json');
  console.log("Démarrage du script d'importation autonome...");

  if (!fs.existsSync(importDir)) {
    console.log("Le dossier d'import 'source/_import' n'existe pas. Création du dossier.");
    fs.mkdirSync(importDir, { recursive: true });
    console.log("Veuillez placer les fichiers .md à importer dans 'source/_import' et relancer la commande.");
    return;
  }

  const filesToImport = fs.readdirSync(importDir).filter(file => file.endsWith('.md'));

  if (filesToImport.length === 0) {
    console.log("Aucun fichier .md à importer dans 'source/_import'."+importDir);
    fs.rmdirSync(importDir)
    return;
  }

  console.log(`Trouvé ${filesToImport.length} fichier(s) à importer...`);

  let db = { breaches: [] };
  if (fs.existsSync(dataFile)) {
    try {
      db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
      db.breaches.map((
        item
      )=>{
        if(!item.Title){
          item.Title=item.Name
        }
        if(item.Titlee){
          delete item.Titlee
        }
        return item
      })
      if (!Array.isArray(db.breaches)) {
        throw new Error("Le fichier 'breaches.json' n'a pas le format attendu (pas de tableau 'breaches').");
      }
      // Trier les données existantes par ancienneté (plus vieille en premier)
      db.breaches.sort((a, b) => {
        const dateA = a.BreachDate ? new Date(a.BreachDate) : new Date(0);
        const dateB = b.BreachDate ? new Date(b.BreachDate) : new Date(0);
        return dateA - dateB;
      });
    } catch (e) {
      console.error("Erreur lors de la lecture ou de l'analyse de 'data/breaches.json':", e.message);
      return;
    }
  }

  const existingNames = new Set(db.breaches.map(b => b.Name));
  const newBreaches = [];
  let skippedCount = 0;

  filesToImport.forEach(filename => {
    const filePath = path.join(importDir, filename);
    const fileContent = getfile(filePath, 'utf-8');
    
    try {
      let parsed, breachDataFromMatter;
      try {
        parsed = matter(fileContent);
       breachDataFromMatter = parsed.data;
      } catch (error) {
        console.error(`Erreur lors de l'analyse du front-matter dans le fichier '${filename}':`, error.message);
        skippedCount++;
        fs.unlinkSync(filePath);
      }
       

      // Appliquer le schéma par défaut et fusionner les données du front-matter
      const newBreach = Object.assign({}, defaultBreachSchema, breachDataFromMatter);

      if (!newBreach.title) {
        console.warn(`Fichier '${filename}' ignoré: le champ 'Name' est manquant.`);
        skippedCount++;
        fs.unlinkSync(filePath);
        return;
      }

      if (existingNames.has(newBreach.title)) {
        console.warn(`Fuite '${newBreach.Name}' (depuis ${filename}) existe déjà. Ignorée.`);
        skippedCount++;
        fs.unlinkSync(filePath);
        return;
      }

      // Enrichir les données dynamiquement si non fournies
      const now = new Date().toISOString();
      newBreach.AddedDate = newBreach.AddedDate || now;
      newBreach.ModifiedDate = newBreach.ModifiedDate || now;
      newBreach.Name=breachDataFromMatter.title
      newBreach.Title=breachDataFromMatter.title
      newBreach.BreachDate=breachDataFromMatter.date
      newBreach.Description=fileContent.split("--")[2]
      const slug = newBreach.Name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
      newBreach.slug = slug;
      newBreach.path = breachDataFromMatter.lien;
      newBreach.formattedDate = newBreach.BreachDate ? new Date(newBreach.BreachDate).toISOString().split('T')[0] : '1970-01-01';
      // Assurer que LogoPath a une valeur par défaut si non fourni
      newBreach.LogoPath = newBreach.LogoPath || "https://logos.haveibeenpwned.com/List.png";


      newBreaches.push(newBreach); // Pousser l'objet enrichi
      existingNames.add(newBreach.Name);
      console.log(`Importation de '${newBreach.Name}'...`);
      
      fs.unlinkSync(filePath);

    } catch (e) {
      console.error(`Erreur lors du traitement du fichier '${filename}':`, e.message);
      skippedCount++;
    }
  });

  if (newBreaches.length > 0) {
    const allBreaches = [...db.breaches, ...newBreaches];
    // Tri par ancienneté: la plus vieille fuite aura l'index 0
    allBreaches.sort((a, b) => {
      const dateA = a.BreachDate ? new Date(a.BreachDate) : new Date(0);
      const dateB = b.BreachDate ? new Date(b.BreachDate) : new Date(0);
      return dateA - dateB;
    });

    // Ajouter l'index à chaque fuite
    allBreaches.forEach((breach, idx) => {
      breach.index = idx;
    });

    db.breaches = allBreaches;
    db.totalBreaches = allBreaches.length;
    db.lastUpdated = new Date().toISOString();

    try {
      fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
      fs.writeFileSync(path.join(baseDir, 'source', '_data', 'breaches.json'), JSON.stringify(db, null, 2));
      console.log('Base de données mise à jour avec succès.');
    } catch (e) {
      console.error("Erreur lors de l'écriture dans 'data/breaches.json':", e.message);
      return;
    }
  }

  console.log('--- Rapport d\'importation ---');
  console.log(` ${newBreaches.length} nouvelle(s) fuite(s) importée(s).`);
  console.log(` ${skippedCount} fichier(s) ignoré(s) (doublon ou erreur).`);
  console.log('-----------------------------');
  fs.rmdirSync(importDir)})
}

// Lancer la fonction
runImport();
}






