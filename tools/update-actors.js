const fs = require('fs');
const path = require('path');

// Chemins vers les fichiers de données
const BREACHES_PATH = path.join(__dirname, '../source/data/breaches.json');
const THREAT_ACTORS_SRC_PATH = path.join(__dirname, '../source/_data/threat_actors.json');
const THREAT_ACTORS_PUBLIC_PATH = path.join(__dirname, '../source/data/threat_actors.json');

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
      if (breach.Attribution && 
          breach.Attribution !== 'null' && 
          breach.Attribution !== 'Unknown' && 
          breach.Attribution.trim() !== '') {
        actorsInBreaches.add(breach.Attribution.trim());
      }
    });

    console.log(`[+] ${actorsInBreaches.size} acteurs uniques trouvés dans breaches.json.`);

    // 2. Lire le fichier actuel des acteurs (s'il existe)
    let actorsList = [];
    if (fs.existsSync(THREAT_ACTORS_SRC_PATH)) {
      const currentData = JSON.parse(fs.readFileSync(THREAT_ACTORS_SRC_PATH, 'utf8'));
      actorsList = currentData.actors || [];
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

    fs.writeFileSync(THREAT_ACTORS_SRC_PATH, jsonString);
    fs.writeFileSync(THREAT_ACTORS_PUBLIC_PATH, jsonString);

    console.log(`[OK] Mise à jour terminée.`);
    console.log(`[+] ${addedCount} nouveaux acteurs ajoutés.`);
    console.log(`[*] Total : ${actorsList.size || actorsList.length} acteurs enregistrés.`);

  } catch (error) {
    console.error(`Erreur lors de la mise à jour : ${error.message}`);
  }
}

// Exécuter la fonction
updateThreatActors();
