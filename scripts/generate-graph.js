const fs = require('fs');
const path = require('path');

/**
 * Générateur de données pour le graphe 3D.
 * Optimisé pour traiter TOUTES les fuites sans faire exploser la mémoire.
 */
hexo.extend.generator.register('graph-data', function(locals) {
    const dataPath = path.join(this.source_dir, 'data', 'breaches.json');
    if (!fs.existsSync(dataPath)) return null;

    // Lecture synchrone directe pour éviter de passer par Hexo locals (qui sont lourds)
    const raw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(raw);
    const breaches = data.breaches || [];

    const nodes = [];
    const links = [];
    
    // Map pour éviter les doublons de nœuds (entités partagées)
    // On utilise des préfixes pour éviter les collisions entre types (ex: cat_ vs dc_)
    const entityMap = new Map(); 

    function addNode(id, name, group, url = null, cats = []) {
        if (!entityMap.has(id)) {
            entityMap.set(id, true);
            nodes.push({ id, name, group, url, cats });
        }
    }

    breaches.forEach(b => {
        // L'utilisateur demande d'utiliser le champ 'id' (ou 'index' si absent)
        const bId = String(b.id || b.index);
        const bCats = b.categories || [];
        
        // Nœud principal (Fuite)
        addNode(bId, b.Title || b.Name, 1, `/fuites?id=${b.id || b.index}/`, bCats);

        // Liens avec les Catégories
        if (b.categories) {
            b.categories.forEach(c => {
                const cId = 'cat_' + c.toLowerCase().replace(/\s+/g, '-');
                addNode(cId, c, 3, `/category/${c.toLowerCase().replace(/\s+/g, '-')}/`, [c]);
                links.push({ source: bId, target: cId });
            });
        }

        // Liens avec les DataClasses (limités pour la lisibilité mais inclus pour tous si demandé)
        if (b.DataClasses) {
            b.DataClasses.forEach(dc => {
                const dcId = 'dc_' + dc.toLowerCase().replace(/\s+/g, '-');
                addNode(dcId, dc, 2, null, bCats);
                links.push({ source: bId, target: dcId });
            });
        }
        
        // Liens avec les Groupes Pirates (Attribution)
        if (b.Attribution) {
            const aId = 'attr_' + b.Attribution.toLowerCase().replace(/\s+/g, '-');
            addNode(aId, b.Attribution, 4, `/threat-actor#${b.Attribution.toLowerCase().replace(/\s+/g, '-')}/`, bCats);
            links.push({ source: bId, target: aId });
        }
    });

    return {
        path: 'graph/data.json',
        data: JSON.stringify({ nodes, links })
    };
});