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

    // Palette de couleurs pour les catégories (Secteurs)
    const categoryColors = [
        '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', 
        '#ec4899', '#06b6d4', '#f97316', '#a855f7', '#14b8a6',
        '#fbbf24', '#2dd4bf', '#60a5fa', '#f472b6', '#fb7185'
    ];
    const catColorMap = new Map();
    let catColorIdx = 0;

    function getCatColor(catName) {
        if (!catColorMap.has(catName)) {
            catColorMap.set(catName, categoryColors[catColorIdx % categoryColors.length]);
            catColorIdx++;
        }
        return catColorMap.get(catName);
    }
    
    function addOrUpdateNode(id, name, group, type, val, url = null, cats = [], color = null) {
        if (nodeMap.has(id)) {
            const node = nodeMap.get(id);
            if (cats && cats.length > 0) {
                const newCats = new Set([...(node.cats || []), ...cats]);
                node.cats = Array.from(newCats);
            }
            // Si c'est une fuite et qu'on lui trouve une couleur de catégorie, on l'applique si pas déjà présente
            if (group === 1 && color && !node.color) {
                node.color = color;
            }
            return;
        }
        nodeMap.set(id, { id, name, group, type, val, url, cats: [...cats], color });
    }

    breaches.forEach(b => {
        if (!b.DataClasses || b.DataClasses.length === 0) return;

        const bId = String(b.index);
        const bCats = b.categories || [];
        
        // Déterminer la couleur principale de la fuite basée sur sa première catégorie
        const bColor = bCats.length > 0 ? getCatColor(bCats[0]) : null;
        
        addOrUpdateNode(bId, b.Title || b.Name, 1, 'Fuite de données', 10, `/fuites?id=${bId}/`, bCats, bColor);

        if (b.categories) {
            b.categories.forEach(c => {
                if (!c) return;
                const cId = 'cat_' + c.toLowerCase().replace(/\s+/g, '-');
                const cColor = getCatColor(c);
                addOrUpdateNode(cId, c, 3, 'Secteur / Catégorie', 7, `/category/${c.toLowerCase().replace(/\s+/g, '-')}/`, [c], cColor);
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