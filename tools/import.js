'use strict';

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const fetch = require("axios")
const { getBreachesDB } = require('../scripts/db');
const bad=new Set(fs.readFileSync(path.join(process.cwd(),'slugs-a-supprimer.txt'), 'utf8').split("\n").filter(slug => slug.trim() !== '').map(slug => slug.trim().replace(/\r/g, '')));

const fetchjson = async (url) => {
  const getter = await fetch.get(url)
  //console.log(getter)
  return getter
}

// Définir les chemins manuellement car nous sommes hors du contexte de Hexo
const PostDir = './';
const destinationDir = "_posts/fuites";
const baseDir = process.cwd();

const getfile = (f) => {
  let content = fs.readFileSync(f).toString()
  if (content.startsWith("---")) {
    return content
  } else { return "---\n" + content }
}
const defaultBreachSchema = {
  "Name": "",
  "Title": "",
  "Domain": null,
  "BreachDate": "1970-01-01",
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
class breach {
  constructor(data) {
    Object.assign(this, defaultBreachSchema, data);
  }
}
//const disdata = fetchjson("https://christopheboutry.com/data/fuites-infos.json")



  async function runImport() {
    // ... (commentaires inchangés)
    const storage=[]
    const importDir = path.join(PostDir, destinationDir);
    
    if(fs.existsSync(importDir)){
      const dbInstance = await getBreachesDB();
      const db = dbInstance.data;
      
      console.log("Démarrage du script d'importation autonome...");

      // Fonction pour récupérer récursivement les fichiers .md
      const getFilesRecursively = (dir) => {
        let results = [];
        const list = fs.readdirSync(dir);
        list.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(filePath));
          } else if (file.endsWith('.md')) {
            results.push(filePath);
          }
        });
        return results;
      };

      const filesToImport = getFilesRecursively(importDir);

      if (filesToImport.length === 0) {
        console.log(`Aucun fichier .md à importer dans '${importDir}'.`);
        return;
      }

      console.log(`Trouvé ${filesToImport.length} fichier(s) à importer...`);

      if (db.breaches) {
        try {
          db.breaches.map((
            item
          ) => {
            if (!item.Title) {
              item.Title = item.Name
            }
            if (item.Titlee) {
              delete item.Titlee
            }
 if (bad.has(item.slug)) {
            item.IsRetired = true; // Marquer pour suppression
            console.log(`  - Suppression : ${item.Name} (slug: ${item.slug})`);
            
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
          console.error("Erreur lors de l'analyse des données breaches:", e.message);
          return;
        }
      }

      const existingNames = new Set(db.breaches.map(b => b.Name));
      const newBreaches = [...storage];
      let skippedCount = 0;

      filesToImport.forEach(filePath => {
        const filename = path.basename(filePath);
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
            return;
          }


          // Appliquer le schéma par défaut et fusionner les données du front-matter
          const newBreach = Object.assign({}, defaultBreachSchema, breachDataFromMatter);

          if (!newBreach.title) {
            console.warn(`Fichier '${filename}' ignoré: le champ 'title' est manquant dans le front-matter.`);
            skippedCount++;
            fs.unlinkSync(filePath);
            return;
          }

          if (existingNames.has(newBreach.title)) {
            console.warn(`Fuite '${newBreach.title}' (depuis ${filename}) existe déjà. Ignorée.`);
            skippedCount++;
            fs.unlinkSync(filePath);
            return;
          }

          // Enrichir les données dynamiquement si non fournies
          const now = new Date().toISOString();
          newBreach.AddedDate = newBreach.AddedDate || now;
          newBreach.ModifiedDate = newBreach.ModifiedDate || now;
          newBreach.Name = breachDataFromMatter.title
          newBreach.Title = breachDataFromMatter.title
          newBreach.BreachDate = breachDataFromMatter.date
          newBreach.Description = fileContent.split("---")[2]?.trim() || "pas d'information actuellement";
          const slug = newBreach.Name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/--+/g, '-');
          newBreach.slug = slug;
          newBreach.path = breachDataFromMatter.lien;
          newBreach.formattedDate = newBreach.BreachDate ? new Date(newBreach.BreachDate).toISOString().split('T')[0] : '1970-01-01';
          // Assurer que LogoPath a une valeur par défaut si non fourni
          newBreach.LogoPath = newBreach.LogoPath || "https://logos.haveibeenpwned.com/List.png";
	 if (bad.has(newBreach.slug)) {
            newBreach.IsRetired = true; // Marquer pour suppression
            console.log(`  - Suppression : ${newBreach.Name} (slug: ${newBreach.slug})`);
            
        }

          newBreaches.push(newBreach); // Pousser l'objet enrichi
          existingNames.add(newBreach.Name);
          // console.log(`Importation de '${newBreach.Name}'...`);

          fs.unlinkSync(filePath);

        } catch (e) {
          if(fs.existsSync(filePath)){
            fs.unlinkSync(filePath);
          }
          console.error(`Erreur lors du traitement du fichier '${filename}':`, e.message);
          skippedCount++;
        }
      });

      if (newBreaches.length > 0) {
        const allBreaches = [...db.breaches, ...newBreaches.map((morph)=>{
            Object.keys(morph).forEach((key) => {
          if (!Object.keys(defaultBreachSchema).includes(key)) {
            delete morph[key]
          }
        })
        return morph
        }).filter((item) => !db.breaches.find(b => b.Name === item.Name))];
        // Tri par ancienneté: la plus vieille fuite aura l'index 0
        allBreaches.sort((a, b) => {
          const dateA = a.BreachDate ? new Date(a.BreachDate) : new Date(0);
          const dateB = b.BreachDate ? new Date(b.BreachDate) : new Date(0);
          return dateA - dateB;
        });

        // Ajouter l'index à chaque fuite en ignorant les fuites retirées
        let indexCounter = -1;
        allBreaches.forEach((breach) => {
          if (breach && !breach.IsRetired) indexCounter++;
          if (breach) breach.index = indexCounter;
        });

        db.breaches = allBreaches;
        db.totalBreaches = allBreaches.length;
        db.lastUpdated = new Date().toISOString();

        try {
          await dbInstance.save();
          console.log('Base de données mise à jour avec succès.');
        } catch (e) {
          console.error("Erreur lors de la sauvegarde des données:", e.message);
          return;
        }
      }

      console.log('--- Rapport d\'importation ---');
      console.log(` ${newBreaches.length} nouvelle(s) fuite(s) importée(s).`);
      console.log(` ${skippedCount} fichier(s) ignoré(s) (doublon ou erreur).`);
      console.log('-----------------------------');
      
      // Supprimer récursivement le dossier d'importation s'il est vide ou si on veut tout nettoyer
      try {
        if (fs.existsSync(importDir)) {
          fs.rmSync(importDir, { recursive: true, force: true });
        }
      } catch (rmErr) {
        console.warn(`Avertissement : impossible de supprimer le dossier '${importDir}':`, rmErr.message);
      }
    }
   
  }

// Lancer la fonction
const checkDir = path.join(PostDir, destinationDir);
if(fs.existsSync(checkDir)){
  const subDirs = fs.readdirSync(checkDir).filter((file) => { 
    return fs.statSync(path.join(checkDir, file)).isDirectory() 
  });
  
  if (subDirs.length !== 0) {
    runImport().catch(err => {
      console.error('Erreur fatale lors de l\'import script:', err);
      process.exit(1);
    });
  }
}






