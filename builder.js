const axios = require('axios');
const fs = require('fs').promises;

async function fetchAndSaveBlockedDomains() {
  try {
    const url = 'https://fr.wikipedia.org/w/index.php?title=MediaWiki:BlockedExternalDomains.json&action=raw&ctype=application/json';
    const response = await axios.get(url);
    const data = response.data;

    // Détermine le chemin du fichier de sortie
    const outputFile = 'blocked_domains.json';

    // Sauvegarde les données brutes dans un fichier
    await fs.writeFile(outputFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`Les domaines bloqués ont été enregistrés dans ${outputFile}`);

    // Affiche un résumé à l'utilisateur
    if (Array.isArray(data)) {
      console.log("\nRésumé des domaines bloqués :");
      data.forEach((entry, index) => {
        console.log(`${index + 1}. Domaine: ${entry.domain}`);
        if (entry.notes) {
          console.log(`   Notes: ${entry.notes}`);
        }
      });
    } else if (data.domains) {
      console.log("\nRésumé des domaines bloqués :");
      data.domains.forEach((entry, index) => {
        console.log(`${index + 1}. Domaine: ${entry.domain}`);
        if (entry.notes) {
          console.log(`   Notes: ${entry.notes}`);
        }
      });
    } else {
      console.log("\nStructure JSON non reconnue. Les données brutes ont été enregistrées.");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération ou de l'enregistrement des domaines bloqués :", error.message);
  }
}

fetchAndSaveBlockedDomains();
