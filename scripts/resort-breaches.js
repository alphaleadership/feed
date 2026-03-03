'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

// Termes NSFW à détecter dans les descriptions
const nsfwTerms = [
  'adult', 'porn', 'xxx', 'sex', 'nude', 'naked', 'erotic', 'fetish',
  'escort', 'dating', 'hookup', 'affair', 'cheating', 'adultery',
  'hentai', 'camgirl', 'webcam', 'onlyfans', 'patreon adult'
];

// Fonction pour vérifier un lien HIBP de manière asynchrone
function verifyHibpLink(slug) {
  return new Promise((resolve) => {
    const url = `https://haveibeenpwned.com/api/v3/breach/${encodeURIComponent(slug)}`;
    
    const req = https.get(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0' },
      timeout: 5000 
    }, (res) => {
      if (res.statusCode === 200) {
        resolve(`https://haveibeenpwned.com/Breach/${slug}`);
      } else {
        resolve(`https://haveibeenpwned.com/Breach/${slug}`); // Utiliser le lien par défaut même si non vérifié
      }
    });
    
    req.on('error', (e) => {
      console.error(`Erreur lors de la vérification du lien HIBP pour ${slug}: ${e.message}`);
      resolve(`https://haveibeenpwned.com/Breach/${slug}`); // Utiliser le lien par défaut en cas d'erreur
    });
    
    req.on('timeout', () => {
      req.destroy();
      console.warn(`Timeout lors de la vérification du lien HIBP pour ${slug}`);
      resolve(`https://haveibeenpwned.com/Breach/${slug}`); // Utiliser le lien par défaut en cas de timeout
    });
  });
}

// Fonction principale asynchrone
async function processBreaches() {
  console.log('Chargement des données...');
  const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));

  console.log(`Nombre de fuites avant tri: ${db.breaches.length}`);

  // Trier par ancienneté: la plus vieille fuite aura l'index 0
  db.breaches.sort((a, b) => {
    const dateA = a.BreachDate ? new Date(a.BreachDate) : new Date(0);
    const dateB = b.BreachDate ? new Date(b.BreachDate) : new Date(0);
    return dateA - dateB;
  });

  let i = -1;
  const invalidcategory = ["hygiène numérique", "sécurité", "cybersécurité", "cybercriminalité", "cyberguerre"];
  
  // Préparer les vérifications de liens
  const linkVerifications = [];

  // Première passe: traiter les données de base
  db.breaches.forEach((breach) => {
    if (breach == null) {
      return;
    }
    
    if (!breach.BreachDate) {
      breach.IsRetired = true;
    }

    breach.Name = decodeURI(breach.Name);
    
    if (!breach.Title || breach.Title.trim() === '') {
      breach.Title = breach.Name;
    }

    // Détermination de la source
    if (!breach.source) {
      if (breach.path && breach.path.includes('breaches/')) breach.source = 'Have I Been Pwned';
      else if (breach.lien && breach.lien.includes('zataz.com')) breach.source = 'Zataz';
      else breach.source = 'Manuel';
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
        if (slug.includes("fuite du")) {
          breach.lien = `https://bonjourlafuite.eu.org/{${slug.replaceAll("fuite du", "-")}}`;
        } else {
          // Définir le lien par défaut
          breach.lien = `https://haveibeenpwned.com/Breach/${slug}`;
          // Ajouter à la liste de vérification (optionnel, peut être désactivé pour plus de rapidité)
           linkVerifications.push({ breach, slug });
        }
      } else {
        breach.lien = `https://haveibeenpwned.com/`;
      }
    }

    if (!(breach.categories && Array.isArray(breach.categories))) {
      breach.categories = [];
    } else {
      const category = breach.categories[0] || "";
      if (!isNaN(parseInt(category))) {
        invalidcategory.push(category);
      }
      if (invalidcategory.includes(category.toLowerCase())) {
        breach.IsRetired = true;
      }
    }

    if (!breach.Description || breach.Description.trim() === '') {
      breach.Description = "Aucune description disponible pour cette fuite de données.";
    }
    breach.content = breach.Description;

    // Détection automatique NSFW basée sur la description
    if (!Object.keys(breach).includes("isNSFW")) {
      breach.isNSFW = false;

      if (breach.Description) {
        const descLower = breach.Description.toLowerCase();
        breach.Description = breach.Description.replaceAll("[", "").replaceAll("]", "");
        breach.isNSFW = nsfwTerms.some(term => descLower.includes(term.toLowerCase()));
      }
    }

    if (!Object.keys(breach).includes("lien") || breach.lien === null || String(breach.lien).includes('undefined')) {
      let fixSlug = breach.Name;
      if (breach.path && breach.path.includes("breaches/")) {
        fixSlug = breach.path.split("breaches/")[1];
      }
      breach.lien = fixSlug && fixSlug !== 'undefined' ? "https://haveibeenpwned.com/Breach/" + fixSlug : "https://haveibeenpwned.com/";
    }

    if (breach?.validated) {
      breach.IsRetired = false;
    }
  });

  // Vérifier les liens si nécessaire (désactivé par défaut pour éviter les ralentissements)
  if (linkVerifications.length > 0) {
    console.log(`Vérification de ${linkVerifications.length} liens...`);
    const verificationPromises = linkVerifications.map(({ breach, slug }) =>
      verifyHibpLink(slug).then(link => {
        breach.lien = link;
      }).catch(err => {
        console.error(`Erreur lors de la vérification de ${slug}:`, err.message);
      })
    );

    try {
      await Promise.all(verificationPromises);
      console.log('Vérification des liens terminée.');
    } catch (err) {
      console.error('Erreur lors de la vérification des liens:', err.message);
    }
  }

  // Filtrer et indexer
  db.breaches = db.breaches.filter(breach => !breach.IsRetired);
  
  db.breaches.forEach((breach) => {
    if (!breach.IsRetired) {
      i++;
    }
    breach.oldindex = breach.index;
    breach.index = i;
    breach.title = breach.Title;
  });

  db.lastUpdated = new Date().toISOString();

  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
  fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));
  fs.writeFileSync(path.join(baseDir, 'source', '_data', 'breaches.json'), JSON.stringify(db, null, 2));

  console.log('Fichiers mis à jour avec succès!');
}

// Exécuter la fonction principale
processBreaches().catch(err => {
  console.error('Erreur fatale:', err);
  process.exit(0);
});
