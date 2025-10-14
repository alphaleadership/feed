# Journal des modifications - Thème Matrix

Ce fichier documente les modifications apportées pour moderniser le thème et le transformer en un style inspiré de Matrix.


*   **Diagnostic final et correctif de la barre latérale :**
    *   Identification de la cause racine du problème de mise en page : une fonction JavaScript dans `main.js` qui déplaçait le contenu de la barre latérale sur les écrans de moins de 980px.
    *   Désactivation de la fonction JavaScript problématique.
*   **Restauration et application finale du thème :**
    *   Restauration du fichier `cerulean.css` original pour garantir une base de mise en page stable.
    *   Réapplication complète et propre du thème Matrix en utilisant des surcharges de style dans `style.css`.

*   **Tri des catégories :** Changement du tri des catégories pour un ordre décroissant (du plus grand au plus petit) basé sur le nombre de posts.
