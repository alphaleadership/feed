const fs = require('fs');
const path = require('path');

/**
 * Générateur de données pour le graphe 3D.
 * Optimisé pour traiter TOUTES les fuites sans faire exploser la mémoire.
 */
hexo.extend.generator.register('graph-data', function(locals) {
    const dataPath = path.join(this.source_dir, 'data', 'breaches.json');
    if (!fs.existsSync(dataPath)) return null;

    const raw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(raw);
    const breaches = data.breaches || [];

    const nodeMap = new Map();
    const links = [];
    
    function addOrUpdateNode(id, name, group, type, val, url = null, cats = []) {
        if (nodeMap.has(id)) {
            const node = nodeMap.get(id);
            // Fusion des catégories pour que le filtrage fonctionne globalement
            if (cats && cats.length > 0) {
                const newCats = new Set([...(node.cats || []), ...cats]);
                node.cats = Array.from(newCats);
            }
            return;
        }
        nodeMap.set(id, { id, name, group, type, val, url, cats: [...cats] });
    }

    breaches.forEach(b => {
        // Filtrer les fuites sans DataClasses (types de données)
        if (!b.DataClasses || b.DataClasses.length === 0) {
            return;
        }

        // Utilisation de 'index' comme identifiant unique (plus robuste dans ce projet)
        const bId = String(b.index);
        const bCats = b.categories || [];
        
        // Nœud principal (Fuite) - Plus gros (val: 10)
        addOrUpdateNode(bId, b.Title || b.Name, 1, 'Fuite de données', 10, `/fuites?id=${bId}/`, bCats);

        // Liens avec les Catégories (val: 7)
        if (b.categories) {
            b.categories.forEach(c => {
                if (!c) return;
                const cId = 'cat_' + c.toLowerCase().replace(/\s+/g, '-');
                addOrUpdateNode(cId, c, 3, 'Secteur / Catégorie', 7, `/category/${c.toLowerCase().replace(/\s+/g, '-')}/`, [c]);
                links.push({ source: bId, target: cId });
            });
        }

        // Liens avec les DataClasses (val: 5)
        if (b.DataClasses) {
            b.DataClasses.forEach(dc => {
                if (!dc) return;
                const dcId = 'dc_' + dc.toLowerCase().replace(/\s+/g, '-');
                addOrUpdateNode(dcId, dc, 2, 'Type de donnée', 5, null, bCats);
                links.push({ source: bId, target: dcId });
            });
        }
        
        // Liens avec les Groupes Pirates (Attribution) (val: 8)
        if (b.Attribution) {
            // Gérer les cas où Attribution est une liste séparée par des virgules
            const actors = typeof b.Attribution === 'string' ? b.Attribution.split(',').map(s => s.trim()) : [b.Attribution];
            actors.forEach(actor => {
                if (!actor) return;
                const aId = 'attr_' + actor.toLowerCase().replace(/\s+/g, '-');
                addOrUpdateNode(aId, actor, 4, 'Groupe Pirate', 8, `/threat-actor#${actor.toLowerCase().replace(/\s+/g, '-')}/`, bCats);
                links.push({ source: bId, target: aId });
            });
        }
    });

    return {
        path: 'graph/data.json',
        data: JSON.stringify({ 
            nodes: Array.from(nodeMap.values()), 
            links 
        })
    };
});