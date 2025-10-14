# Journal des modifications - Thème Matrix

Ce fichier documente les modifications apportées pour moderniser le thème et le transformer en un style inspiré de Matrix.


*   **Transformation complète du thème :** Le fichier de thème `cerulean.css` a été directement et entièrement modifié pour remplacer toutes les couleurs (bleus, gris, blancs, etc.) par une palette Matrix complète. Les styles superflus comme les dégradés et les ombres ont été supprimés pour un design plat.
*   **Nettoyage de `style.css` :** Les règles de surcharge devenues redondantes ont été supprimées de `style.css`.
*   **Correctif de la barre latérale :** Un problème de mise en page avec la barre latérale a été corrigé.

*   **Correction finale des couleurs :** Ajout de surcharges CSS pour les styles de base (liens, alertes, boutons) provenant du sous-thème `cerulean.css` afin d'éliminer toutes les couleurs bleues restantes.

*   **Tri des catégories :** Changement du tri des catégories pour un ordre décroissant (du plus grand au plus petit) basé sur le nombre de posts.

*   **Ajustements des templates EJS et finalisation :**
    *   Remplacement de l'ombre des images par une lueur verte dans `article.ejs`.
    *   Changement du thème des commentaires Giscus pour `transparent_dark`.
    *   Ajout de surcharges CSS dans `style.css` pour forcer les classes de style restantes (`.text-primary`, `.bg-dark`, etc.) à utiliser les couleurs du thème Matrix.
