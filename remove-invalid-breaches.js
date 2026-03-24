const fs = require('fs');
const path = require('path');

// Chemin vers le fichier de données principal
const BREACHES_JSON_PATH = path.join(__dirname, 'source', '_data', 'breaches.json');
// Chemin vers le fichier contenant les slugs à supprimer
const SLUGS_TO_REMOVE_PATH = path.join(__dirname, 'slugs-a-supprimer.txt');

/**
 * Fonction principale pour supprimer les fuites invalides.
 */
async function removeInvalidBreaches() {
    console.log("--- Lancement du script de suppression des fuites invalides ---");

    // 1. Lire les slugs à partir du fichier texte
    let slugsToRemove;
    try {
        if (!fs.existsSync(SLUGS_TO_REMOVE_PATH)) {
            console.error(`Erreur : Le fichier '${SLUGS_TO_REMOVE_PATH}' n'a pas été trouvé.`);
            console.log("Veuillez créer un fichier 'slugs-a-supprimer.txt' à la racine du projet et y mettre un slug par ligne.");
            return;
        }
        const slugsFileContent = fs.readFileSync(SLUGS_TO_REMOVE_PATH, 'utf8');
        slugsToRemove = new Set(slugsFileContent.split("\n").filter(slug => slug.trim() !== '').map(slug => slug.trim().replace(/\r/g, ''))); // Nettoyer les slugs
        
        if (slugsToRemove.size === 0) {
            console.log("Le fichier 'slugs-a-supprimer.txt' est vide. Aucune action n'est requise.");
            return;
        }
        console.log(`${slugsToRemove.size} slug(s) à supprimer ont été chargés.`);
        console.log(slugsToRemove)
    } catch (error) {
        console.error(`Erreur lors de la lecture du fichier des slugs : ${error.message}`);
        return;
    }

    // 2. Lire et parser le fichier breaches.json
    let data;
    try {
        const breachesFileContent = fs.readFileSync(BREACHES_JSON_PATH, 'utf8');
        data = JSON.parse(breachesFileContent);
    } catch (error) {
        console.error(`Erreur lors de la lecture ou du parsing de '${BREACHES_JSON_PATH}': ${error.message}`);
        return;
    }

    const originalCount = data.breaches.length;
    console.log(`Nombre de fuites avant la suppression : ${originalCount}`);

    // 3. Filtrer les fuites pour exclure les slugs spécifiés
    const initialBreachesCount = data.breaches.length;
    data.breaches = data.breaches.map(breach => {
        if (slugsToRemove.has(breach.slug)) {
            breach.IsRetired = true; // Marquer pour suppression
            console.log(`  - Suppression : ${breach.Name} (slug: ${breach.slug})`);
            
        }
        return breach;
    });

    const finalBreachesCount = data.breaches.length;
    const removedCount = initialBreachesCount - finalBreachesCount;

    if (removedCount > 0) {
        // 4. Mettre à jour le compteur et la date de mise à jour
        data.totalBreaches = finalBreachesCount;
        data.lastUpdated = new Date().toISOString();

        // 5. Sauvegarder les modifications
        try {
            const updatedJsonContent = JSON.stringify(data, null, 2);
            fs.writeFileSync(BREACHES_JSON_PATH, updatedJsonContent, 'utf8');
            console.log(`
Opération terminée avec succès. ${removedCount} fuite(s) ont été supprimée(s).`);
            console.log(`Nombre total de fuites restantes : ${finalBreachesCount}`);
        } catch (error) {
            console.error(`Erreur lors de l'écriture des modifications dans '${BREACHES_JSON_PATH}': ${error.message}`);
        }
    } else {
        console.log("Aucune fuite correspondante aux slugs fournis n'a été trouvée. Aucune modification n'a été apportée.");
    }
    
    console.log("--- Fin du script ---");
}

// Exécuter la fonction
removeInvalidBreaches();
