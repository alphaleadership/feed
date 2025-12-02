'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

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
db.breaches.filter((
  item
)=>{
  if(Object.keys(item).includes("path")){
      if(item?.path.includes("breaches/")){
    if(item.pwnCount>1){
    return false
    }
    return true
  }
  }

  return true
}).forEach((breach, idx) => {
  console.log(breach)
  if(breach==null){
    return
  }
 if(!(breach.categories && Array.isArray(breach.categories))){
    breach.categories=[breach.Name.split("fuite")[0]]
  }
  if(!Object.keys(breach).includes("isNSFW")){
    breach.isNSFW=false
  }
  if(!Object.keys(breach).includes("lien")){
    console.log("lien", breach.path)
    breach.lien="https://haveibeenpwned.com/Breach/"+(breach.path||"").split("breaches/")[1]
  }
  if(!breach.IsRetired){
    i++
  }
  breach.index = i;
})

console.log('Tri effectué. Première fuite:', db.breaches[0].Name, '- Date:', db.breaches[0].BreachDate);
console.log('Dernière fuite:', db.breaches[db.breaches.length - 1].Name, '- Date:', db.breaches[db.breaches.length - 1].BreachDate);

db.lastUpdated = new Date().toISOString();

fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));
fs.writeFileSync(path.join(baseDir, 'source', '_data', 'breaches.json'), JSON.stringify(db, null, 2));

console.log('Fichiers mis à jour avec succès!');
