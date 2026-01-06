const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'source', '_data', 'breaches.json');
const OUTPUT_FILE = path.join(__dirname, 'fuites-sans-nombre.txt');

/**
 * Algorithme pour détecter les fuites de données sans nombre de personnes impactées
 * Recherche les entrées où PwnCount est 0, null, undefined ou manquant
 */

// Helper pour charger les données
function loadBreachesData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        return jsonData.breaches || [];
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error.message);
        return [];
    }
}

// Fonction pour vérifier si une fuite n'a pas de nombre de personnes impactées
function isPwnCountMissing(breach) {
    return breach.PwnCount === null || 
           breach.PwnCount === undefined || 
           breach.PwnCount === 0 || 
           !breach.hasOwnProperty('PwnCount');
}

// Fonction principale pour détecter les fuites sans nombre
function detectBreachesWithoutCount() {
    console.log('🔍 Chargement des données de fuites...');
    const breaches = loadBreachesData();
    
    if (breaches.length === 0) {
        console.log('❌ Aucune donnée trouvée ou erreur de chargement');
        return;
    }
    
    console.log(`📊 Total des fuites chargées: ${breaches.length}`);
    
    // Filtrer les fuites sans nombre de personnes impactées
    const breachesWithoutCount = breaches.filter(isPwnCountMissing);
    
    console.log(`🚨 Fuites sans nombre de personnes impactées: ${breachesWithoutCount.length}`);
    
    // Préparer le contenu du fichier de sortie
    let output = `RAPPORT - FUITES SANS NOMBRE DE PERSONNES IMPACTÉES\n`;
    output += `=================================================\n\n`;

    output += `Total des fuites analysées: ${breaches.length}\n`;
    output += `Fuites sans nombre d'impactés: ${breachesWithoutCount.length}\n`;
    output += `Pourcentage: ${((breachesWithoutCount.length / breaches.length) * 100).toFixed(2)}%\n\n`;
    
    if (breachesWithoutCount.length > 0) {
        output += `LISTE DES FUITES CONCERNÉES:\n`;
        output += `============================\n\n`;
        
        breachesWithoutCount.forEach((breach, index) => {
            output += `${index + 1}. ${breach.Name || 'Nom inconnu'}\n`;
            output += `   - Titre: ${breach.Title || 'Non spécifié'}\n`;
            output += `   - Domaine: ${breach.Domain || 'Non spécifié'}\n`;
            output += `   - Date de fuite: ${breach.BreachDate || 'Non spécifiée'}\n`;
            output += `   - Date d'ajout: ${breach.AddedDate || 'Non spécifiée'}\n`;
            output += `   - PwnCount: ${breach.PwnCount}\n`;
            output += `   - Lien: ${breach.lien || 'Non disponible'}\n`;
            output += `   - Vérifié: ${breach.IsVerified ? 'Oui' : 'Non'}\n`;
            output += `\n`;
        });
    } else {
        output += `✅ Toutes les fuites ont un nombre de personnes impactées renseigné.\n`;
    }
    
    // Écrire le résultat dans le fichier
    try {
        fs.writeFileSync(OUTPUT_FILE, output, 'utf8');
        console.log(`✅ Rapport généré avec succès: ${OUTPUT_FILE}`);
        console.log(`📄 ${breachesWithoutCount.length} fuites sans nombre d'impactés détectées`);
    } catch (error) {
        console.error('❌ Erreur lors de l\'écriture du fichier:', error.message);
    }
}

// Fonction pour afficher un résumé dans la console
function displaySummary() {
    const breaches = loadBreachesData();
    const breachesWithoutCount = breaches.filter(isPwnCountMissing);
    
    console.log('\n📋 RÉSUMÉ:');
    console.log('=========');
    console.log(`Total des fuites: ${breaches.length}`);
    console.log(`Sans nombre d'impactés: ${breachesWithoutCount.length}`);
    console.log(`Avec nombre d'impactés: ${breaches.length - breachesWithoutCount.length}`);
    console.log(`Pourcentage sans nombre: ${((breachesWithoutCount.length / breaches.length) * 100).toFixed(2)}%`);
}

// Exécution du programme
if (require.main === module) {
    console.log('🚀 Démarrage de la détection des fuites sans nombre de personnes impactées...\n');
    detectBreachesWithoutCount();
    displaySummary();
    console.log('\n✨ Analyse terminée!');
}

module.exports = {
    loadBreachesData,
    isPwnCountMissing,
    detectBreachesWithoutCount,
    displaySummary
};