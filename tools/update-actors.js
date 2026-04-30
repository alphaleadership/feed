const fs = require('fs');
const path = require('path');

// Chemins vers les fichiers de données
const BREACHES_PATH = path.join(__dirname, '../source/data/breaches.json');
const THREAT_ACTORS_SRC_PATH = path.join(__dirname, '../source/_data/threat_actors.json');
const THREAT_ACTORS_PUBLIC_PATH = path.join(__dirname, '../source/data/threat_actors.json');

/**
 * Liste noire de termes qui ne sont pas des acteurs de menaces
 */
const BLACKLIST = new Set([
  'dehashed', 'breaches.net', 'unknown', 'null', 'tbd', 'none', 'n/a', 
  'under investigation', 'hacker', 'admin', 'anonymous', 'various',
  'leak', 'leaked', 'database', 'private', 'verified', 'unverified',
  'threat actor', 'hacker group', 'hibp', 'pwned', 'security','International Cyber Digest','malveillant '
]);

/**
 * Nettoie et valide un nom d'acteur
 * @param {string} name 
 * @returns {string|null}
 */
function normalizeActorName(name) {
  if (!name) return null;
  
  let clean = name.trim();
  
  // Ignorer si c'est une URL
  if (/^https?:\/\//i.test(clean) || /^www\./i.test(clean) || /\.(com|net|org|ru|me|rip|im|jp|pw|org|gg)$/i.test(clean)) {
    // Si c'est juste un domaine, on ignore. Si c'est un nom complexe avec un domaine, on verra.
    if (!clean.includes(' ')) return null;
  }
  
  // Ignorer si c'est un email
  if (/@/.test(clean) && !clean.includes(' ')) return null;
  
  // Nettoyer les suffixes courants comme " @ BF"
  clean = clean.replace(/\s+@\s+BF$/i, '');
  clean = clean.replace(/\s+@\s+BreachForums$/i, '');
  
  // Trop court ou trop long
  if (clean.length < 2 || clean.length > 50) return null;
  
  // Vérifier la blacklist
  if (BLACKLIST.has(clean.toLowerCase())) return null;
  
  // Si ça contient des termes génériques sans autre contexte
  const lower = clean.toLowerCase();
  if (lower === 'threat actor' || lower.startsWith('threat actor ')) {
    // Garder "Threat Actor 888" mais peut-être pas "Threat Actor" tout seul
    if (lower === 'threat actor') return null;
  }

  return clean;
}

/**
 * Fonction principale pour synchroniser les acteurs de menaces
 */
function updateThreatActors() {
  try {
    // 1. Lire les fuites de données pour trouver tous les acteurs (Attribution)
    if (!fs.existsSync(BREACHES_PATH)) {
      console.error(`Erreur: ${BREACHES_PATH} n'existe pas.`);
      return;
    }
    const breachesData = JSON.parse(fs.readFileSync(BREACHES_PATH, 'utf8'));
    const actorsInBreaches = new Set();
    
    breachesData.breaches.forEach(breach => {
      if (breach.Attribution && typeof breach.Attribution === 'string') {
        // Gérer les attributions multiples (virgules, &, and)
        const parts = breach.Attribution.split(/, | & | and /i);
        
        parts.forEach(part => {
          const normalized = normalizeActorName(part);
          if (normalized) {
            actorsInBreaches.add(normalized);
          }
        });
      }
    });

    console.log(`[+] ${actorsInBreaches.size} acteurs uniques identifiés dans breaches.json.`);

    // 2. Lire le fichier actuel des acteurs (s'il existe)
    let actorsList = [];
    if (fs.existsSync(THREAT_ACTORS_SRC_PATH)) {
      try {
        const currentData = JSON.parse(fs.readFileSync(THREAT_ACTORS_SRC_PATH, 'utf8'));
        actorsList = currentData.actors || [];
      } catch (e) {
        console.warn(`Attention: Impossible de lire ${THREAT_ACTORS_SRC_PATH}, on commence une nouvelle liste.`);
      }
    }

    // Créer un dictionnaire pour accès rapide par nom (minuscule)
    const actorsDict = {};
    actorsList.forEach(actor => {
      actorsDict[actor.name.toLowerCase()] = actor;
    });

    // 3. Ajouter les nouveaux acteurs trouvés
    let addedCount = 0;
    actorsInBreaches.forEach(actorName => {
      const lowerName = actorName.toLowerCase();
      if (!actorsDict[lowerName]) {
        const newActor = {
          name: actorName,
          status: "Actif",
          note: "Identifié comme auteur de fuites de données dans la base."
        };
        actorsList.push(newActor);
        actorsDict[lowerName] = newActor;
        addedCount++;
      }
    });

    // 4. Trier par nom pour la lisibilité
    actorsList.sort((a, b) => a.name.localeCompare(b.name));

    // 5. Sauvegarder dans les deux emplacements
    const finalData = { actors: actorsList };
    const jsonString = JSON.stringify(finalData, null, 2);

    // S'assurer que les répertoires existent
    [THREAT_ACTORS_SRC_PATH, THREAT_ACTORS_PUBLIC_PATH].forEach(p => {
      const dir = path.dirname(p);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    fs.writeFileSync(THREAT_ACTORS_SRC_PATH, jsonString);
    fs.writeFileSync(THREAT_ACTORS_PUBLIC_PATH, jsonString);

    console.log(`[OK] Mise à jour terminée.`);
    console.log(`[+] ${addedCount} nouveaux acteurs ajoutés.`);
    console.log(`[*] Total : ${actorsList.length} acteurs enregistrés.`);

  } catch (error) {
    console.error(`Erreur lors de la mise à jour : ${error.message}`);
    console.error(error.stack);
  }
}

// Exécuter la fonction
updateThreatActors();
