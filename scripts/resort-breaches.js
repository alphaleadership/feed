'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

// Termes NSFW à détecter dans les descriptions
const nsfwTerms = [
  'adult', 'porn', 'xxx', 'sex', 'nude', 'naked', 'erotic', 'fetish',
  'escort', 'dating', 'hookup', 'affair', 'cheating', 'adultery',
  'hentai', 'camgirl', 'webcam', 'onlyfans', 'patreon adult'
];

console.log('Chargement des données...');
const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

console.log(`Nombre de fuites avant tri: ${db.breaches.length}`);

// Trier par ancienneté: la plus vieille fuite aura l'index 0
db.breaches.sort((a, b) => {
  const dateA = a.BreachDate ? new Date(a.BreachDate) : new Date(0);
  const dateB = b.BreachDate ? new Date(b.BreachDate) : new Date(0);
  return dateA - dateB;
});
let i=-1;
// Ajouter l'index à chaque fuite
const alreadyseen=new Set()
db.breaches.forEach((breach, idx) => {
//  console.log(breach)
  if(alreadyseen.has(breach.Name)){
    breach.IsRetired=true
  }
  alreadyseen.add(breach.Name)
  if(breach==null){
    return
  }
   const invalidcategory=["hygiène numérique","sécurité","cybersécurité","cybercriminalité","cyberguerre"]
 
    breach.Name=decodeURI(breach.Name)
   if (!breach.Title || breach.Title.trim() === '') {
     breach.Title = breach.Name;
   }
   
   // Détermination de la source
   if (!breach.source) {
     if (breach.path && breach.path.includes('breaches/')) breach.source = 'Have I Been Pwned';
     else if (breach.lien && breach.lien.includes('zataz.com')) breach.source = 'Zataz';
     else breach.source = 'Manuel';
   }

   if(breach.Name.split("fuite")[0]==""){
      breach.IsRetired=true
    }
    
    // Correction des liens HIBP
    if (!breach.lien || String(breach.lien).includes('undefined')) {
      let slug = '';
      if (breach.path && String(breach.path).includes('breaches/')) {
        slug = breach.path.split('breaches/')[1];
      } else if (breach.Name) {
        slug = breach.Name;
      }
      
      if (slug && slug !== 'undefined') {
        breach.lien = `https://haveibeenpwned.com/Breach/${slug}`;
      } else {
        breach.lien = `https://haveibeenpwned.com/`;
      }
    }
 if(!(breach.categories && Array.isArray(breach.categories))){
   
    breach.categories=[]
  }else{
        const category=breach.categories[0]||""
          if(category==""){
								breach.IsRetired=true
							}
								if(!isNaN(parseInt(category))){
								invalidcategory.push(category)
							}
							if(invalidcategory.includes(category.toLowerCase())){
								breach.IsRetired=true
							}
  }

   if (!breach.Description || breach.Description.trim() === '') {
     breach.Description = "Aucune description disponible pour cette fuite de données.";
   }
   breach.content = breach.Description;

  // Détection automatique NSFW basée sur la description
  if(!Object.keys(breach).includes("isNSFW")){
    breach.isNSFW = false;
    
    // Vérifier si la description contient des termes NSFW
    if(breach.Description){
      const descLower = breach.Description.toLowerCase();
      breach.Description=breach.Description.replaceAll("[","").replaceAll("]","")
      breach.isNSFW = nsfwTerms.some(term => descLower.includes(term.toLowerCase()));
    }
  }
  if(!Object.keys(breach).includes("lien") || breach.lien === null || String(breach.lien).includes('undefined')){
    let fixSlug = breach.Name;
    if (breach.path && breach.path.includes("breaches/")) {
       fixSlug = breach.path.split("breaches/")[1];
    }
    breach.lien = fixSlug && fixSlug !== 'undefined' ? "https://haveibeenpwned.com/Breach/" + fixSlug : "https://haveibeenpwned.com/";
  }
  if(breach?.validated){
    breach.IsRetired=false
  }
  if(!breach.IsRetired){
    i++
  }
  breach.oldindex=breach.index
  breach.index = i;
  breach.title=breach.Title
});
db.breaches=db.breaches.filter(breach=>!breach.IsRetired)

console.log('Tri effectué. Première fuite:', db.breaches[0].Name, '- Date:', db.breaches[0].BreachDate);
console.log('Dernière fuite:', db.breaches[db.breaches.length - 1].Name, '- Date:', db.breaches[db.breaches.length - 1].BreachDate);

db.lastUpdated = new Date().toISOString();

fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));
fs.writeFileSync(path.join(baseDir, 'source', '_data', 'breaches.json'), JSON.stringify(db, null, 2));

console.log('Fichiers mis à jour avec succès!');
