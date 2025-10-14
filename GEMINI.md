# Journal des modifications - Thème Matrix

Ce fichier documente les modifications apportées pour moderniser le thème et le transformer en un style inspiré de Matrix.


*   **Correction finale des couleurs :** Ajout de surcharges CSS pour les styles de base (liens, alertes, boutons) provenant du sous-thème `cerulean.css` afin d'éliminer toutes les couleurs bleues restantes.

*   **Tri des catégories :** Changement du tri des catégories pour un ordre décroissant (du plus grand au plus petit) basé sur le nombre de posts.

*   **Ajustements des templates EJS et finalisation :**
    *   Remplacement de l'ombre des images par une lueur verte dans `article.ejs`.
    *   Changement du thème des commentaires Giscus pour `transparent_dark`.
    *   Ajout de surcharges CSS dans `style.css` pour forcer les classes de style restantes (`.text-primary`, `.bg-dark`, etc.) à utiliser les couleurs du thème Matrix.
