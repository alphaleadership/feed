# Journal des modifications - Thème Matrix

Ce fichier documente les modifications apportées pour moderniser le thème et le transformer en un style inspiré de Matrix.


*   **Correctif de la mise en page :** Modification de la structure HTML dans `layout.ejs` en supprimant une `div` superflue qui encapsulait le contenu principal et interférait probablement avec la grille Bootstrap.

*   **Réparation et finalisation du thème Matrix :**
    *   Restauration du fichier `cerulean.css` original pour corriger la mise en page cassée.
    *   Transformation complète du fichier `cerulean.css` restauré en appliquant la palette de couleurs et les styles plats de Matrix (verts, noirs, sans dégradés/ombres).
    *   Nettoyage du fichier `style.css` pour supprimer toutes les règles de surcharge devenues redondantes.

*   **Tri des catégories :** Changement du tri des catégories pour un ordre décroissant (du plus grand au plus petit) basé sur le nombre de posts.

*   **Ajustements des templates EJS et finalisation :**
    *   Remplacement de l'ombre des images par une lueur verte dans `article.ejs`.
    *   Changement du thème des commentaires Giscus pour `transparent_dark`.
