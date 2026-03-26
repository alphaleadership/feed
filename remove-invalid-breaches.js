const fs = require('fs');
const path = require('path');
const { getBreachesDB } = require('./scripts/db');

// Chemin vers le fichier contenant les slugs à supprimer
const SLUGS_TO_REMOVE_PATH = path.join(process.cwd(), 'slugs-a-supprimer.txt');

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

    // 2. Charger la base de données
    const db = await getBreachesDB();
    const data = db.data;

    const originalCount = data.breaches.length;
    console.log(`Nombre de fuites avant le traitement : ${originalCount}`);

    // 3. Marquer les fuites à retirer
    let markedCount = 0;
    data.breaches = data.breaches.map(breach => {
        if (slugsToRemove.has(breach.slug) && !breach.IsRetired) {
            breach.IsRetired = true; // Marquer pour suppression
            console.log(`  - Marqué comme retiré : ${breach.Name} (slug: ${breach.slug})`);
            markedCount++;
        }
        return breach;
    });

    if (markedCount > 0) {
        // 4. Mettre à jour la date de mise à jour
        data.lastUpdated = new Date().toISOString();

        // 5. Sauvegarder les modifications
        await db.save();
        console.log(`\nOpération terminée avec succès. ${markedCount} fuite(s) ont été marquées comme retirées.`);
    } else {
        console.log("Aucune nouvelle fuite correspondante aux slugs fournis n'a été trouvée. Aucune modification n'a été apportée.");
    }
    
    console.log("--- Fin du script ---");
}

// Exécuter la fonction
removeInvalidBreaches().catch(console.error);
