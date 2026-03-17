'use strict';

const fs = require('fs');
const https = require('https');
const path = require('path');
const { NSFWDetector } = require('./nsfw-detector');

const baseDir = path.join(__dirname, '..');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

// Initialize the NSFWDetector
const nsfwDetector = new NSFWDetector(
  path.join(baseDir, '.kiro', 'specs', 'nsfw-detection-system', 'config.json'),
  path.join(baseDir, '.kiro', 'specs', 'nsfw-detection-system', 'terms.json')
);



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

// Charger les domaines bloqués
  const blockedFile = path.join(baseDir, 'blocked_domains.json');
  let blockedDomains = new Map();
  if (fs.existsSync(blockedFile)) {
    try {
      const blockedDataRaw = JSON.parse(fs.readFileSync(blockedFile, 'utf-8'));
      const blockedData = Array.isArray(blockedDataRaw) ? blockedDataRaw : (blockedDataRaw.domains || []);
      blockedData.forEach(d => {
        if (d.domain) {
          blockedDomains.set(d.domain.toLowerCase(), d.notes || '');
        }
      });
      console.log(`${blockedDomains.size} domaines bloqués chargés.`);
    } catch (err) {
      console.error('Erreur lors de la lecture des domaines bloqués:', err);
    }
  }

  function getBlockedNote(domain) {
    if (!domain) return null;
    domain = domain.toLowerCase().trim();
    domain = domain.replace(/^https?:\/\//, '').split('/')[0];
    
    let parts = domain.split('.');
    while (parts.length >= 2) {
      let current = parts.join('.');
      if (blockedDomains.has(current)) {
        return blockedDomains.get(current);
      }
      parts.shift();
    }
    return null;
  }

  let i = -1;
  const invalidcategory = ["hygiène numérique", "sécurité", "cybersécurité", "cybercriminalité", "cyberguerre"];
  
  // Préparer les vérifications de liens
  const linkVerifications = [];

  // Première passe: traiter les données de base
  db.breaches.forEach((breach) => {
    if (breach == null) {
      return;
    }
    
    // Vérification domaine bloqué
    const blockedNote = getBlockedNote(breach.Domain);
    breach.isBlocked = !!blockedNote;
    breach.blockedNote = blockedNote || null;

    // Normalisation des dates et noms
    if (!breach.BreachDate) {
      if (breach.Title && breach.Title.toLowerCase().includes("fuite du ")) {
        const parts = breach.Title.split("fuite du ");
        if (parts[1]) {
          const d = new Date(parts[1]);
          breach.BreachDate = isNaN(d.getTime()) ? '1970-01-01' : parts[1];
        }
      }
      // Repli sur la date 0 si toujours pas de date
      if (!breach.BreachDate) {
        breach.BreachDate = '1970-01-01';
      }
    }

    if (breach.Name) {
      // Décodage et nettoyage du nom
      try {
        let cleanName = decodeURI(breach.Name);
        if (cleanName.toLowerCase().includes("france")) {
          breach.Name = cleanName;
        } else {
          breach.Name = cleanName.split("fuite")[0].trim();
        }
      } catch (e) {
        // Garder le nom tel quel si erreur de décodage
      }
    }
  
    
    
    if (!breach.Name || breach.Name.trim() === '') {
      breach.Name = breach.slug || 'Unknown';
    }

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
    if (!breach.manualNSFWOverride) { // Only run detector if not manually overridden
      breach.isNSFW = false; // Default to false
      breach.nsfwConfidence = 0; // Default confidence

      if (breach.Description || breach.Title) {
        let textToAnalyze = "";
        if (breach.Title) {
          textToAnalyze += breach.Title.replaceAll("[", "").replaceAll("]", "") + ". ";
        }
        if (breach.Description) {
          textToAnalyze += breach.Description.replaceAll("[", "").replaceAll("]", "");
        }
        
        try {
          const analysisResult = nsfwDetector.analyze(textToAnalyze);
          breach.isNSFW = analysisResult.isNSFW;
          breach.nsfwConfidence = analysisResult.confidence;
        } catch (error) {
          console.error(`Error analyzing NSFW for breach ${breach.Name || breach.slug}: ${error.message}`);
          // Continue with default isNSFW = false and confidence = 0 on error
        }
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
