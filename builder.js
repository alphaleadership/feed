const axios = require('axios');
const fs = require('fs').promises;

async function fetchAndSaveBlockedDomains() {
  try {
    const url = 'https://fr.wikipedia.org/w/index.php?title=MediaWiki:BlockedExternalDomains.json&action=raw&ctype=application/json';
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const data = response.data;

    const outputFile = 'blocked_domains.json';
    await fs.writeFile(outputFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ Les domaines bloqués ont été enregistrés dans ${outputFile}`);

    // Affiche un résumé
    if (Array.isArray(data)) {
      console.log("\nRésumé des domaines bloqués :");
      data.forEach((entry, index) => {
        console.log(`${index + 1}. Domaine: ${entry.domain}`);
        if (entry.notes) console.log(`   Notes: ${entry.notes}`);
      });
    } else if (data.domains) {
      console.log("\nRésumé des domaines bloqués :");
      data.domains.forEach((entry, index) => {
        console.log(`${index + 1}. Domaine: ${entry.domain}`);
        if (entry.notes) console.log(`   Notes: ${entry.notes}`);
      });
    } else {
      console.log("\nStructure JSON non reconnue. Les données brutes ont été enregistrées.");
    }
  } catch (error) {
    if (error.response && error.response.status === 403) {
      console.error("⚠️ Accès refusé (403) : Wikipédia bloque les requêtes automatisées.");
      console.log("Essaye de :");
      console.log("1. Utiliser un navigateur pour télécharger manuellement le JSON depuis :");
      console.log("   https://fr.wikipedia.org/w/index.php?title=MediaWiki:BlockedExternalDomains.json&action=raw&ctype=application/json");
      console.log("2. Ou utiliser l'API officielle de Wikimedia avec un bot autorisé.");
    } else {
      console.error("Erreur inattendue :", error.message);
    }
  }
}

fetchAndSaveBlockedDomains();
