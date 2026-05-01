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
            // Priorité à la couleur passée (souvent celle de la catégorie)
            if (color && !node.color) {
                node.color = color;
            }
            return;
        }
        
        // Couleurs par défaut si non spécifié
        let finalColor = color;
        if (!finalColor) {
            if (group === 1) finalColor = '#ef4444'; // Fuite (Rouge)
            if (group === 2) finalColor = '#3b82f6'; // Type de donnée (Bleu)
            if (group === 3) finalColor = '#10b981'; // Catégorie (Vert)
            if (group === 4) finalColor = '#f59e0b'; // Acteur (Orange)
        }
        
        nodeMap.set(id, { id, name, group, type, val, url, cats: [...cats], color: finalColor });
    }

    breaches.forEach(b => {
        if (!b.DataClasses || b.DataClasses.length === 0) return;

        const bId = String(b.index);
        const bCats = b.categories || [];
        const bColor = bCats.length > 0 ? getCatColor(bCats[0]) : '#ef4444';
        
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

        if (b.DataClasses) {
            b.DataClasses.forEach(dc => {
                if (!dc) return;
                const dcId = 'dc_' + dc.toLowerCase().replace(/\s+/g, '-');
                // Pour les types de données, on peut utiliser une couleur neutre ou celle de la fuite
                addOrUpdateNode(dcId, dc, 2, 'Type de donnée', 5, null, bCats, '#3b82f6');
                links.push({ source: bId, target: dcId });
            });
        }
        
        if (b.Attribution) {
            const actors = typeof b.Attribution === 'string' ? b.Attribution.split(',').map(s => s.trim()) : [b.Attribution];
            actors.forEach(actor => {
                if (!actor) return;
                const aId = 'attr_' + actor.toLowerCase().replace(/\s+/g, '-');
                addOrUpdateNode(aId, actor, 4, 'Groupe Pirate', 8, `/threat-actor#${actor.toLowerCase().replace(/\s+/g, '-')}/`, bCats, '#f59e0b');
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