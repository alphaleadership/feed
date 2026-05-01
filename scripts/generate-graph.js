const fs = require('fs');
const path = require('path');

hexo.extend.generator.register('graph-data', function(locals) {
    const dataPath = path.join(this.source_dir, 'data', 'breaches.json');
    if (!fs.existsSync(dataPath)) return null;

    const raw = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(raw);
    const breaches = data.breaches || [];

    const nodes = [];
    const links = [];
    const entityMap = new Map(); // entityName -> index
    let nodeIndex = 0;

    // Helper
    function addNode(id, name, group, type, val, url = null) {
        if (!entityMap.has(id)) {
            entityMap.set(id, nodeIndex++);
            nodes.push({ id, name, group, type, val, url });
        }
    }

    // Add nodes for breaches
    breaches.forEach(b => {
        const id = b.slug || b.Name;
        addNode(id, b.Title || b.Name, 1, 'Fuite de données', 5, `/fuites/${b.slug}/`);

        if (b.DataClasses && Array.isArray(b.DataClasses)) {
            b.DataClasses.forEach(dc => {
                const dcId = 'dc_' + dc.replace(/\s+/g, '-').toLowerCase();
                addNode(dcId, dc, 2, 'Type de donnée', 3);
                links.push({ source: id, target: dcId, value: 1 });
            });
        }
        
        if (b.categories && Array.isArray(b.categories)) {
            b.categories.forEach(c => {
                const cId = 'cat_' + c.replace(/\s+/g, '-').toLowerCase();
                addNode(cId, c, 3, 'Catégorie', 4, `/category/${c.replace(/\s+/g, '-').toLowerCase()}/`);
                links.push({ source: id, target: cId, value: 1 });
            });
        }
        
        if (b.Attribution && typeof b.Attribution === 'string') {
            const attr = b.Attribution;
            const attrId = 'attr_' + attr.replace(/\s+/g, '-').toLowerCase();
            addNode(attrId, attr, 4, 'Groupe Pirate', 6, `/threat-actor/${attr.replace(/\s+/g, '-').toLowerCase()}/`);
            links.push({ source: id, target: attrId, value: 2 });
        }
    });

    return {
        path: 'graph/data.json',
        data: JSON.stringify({ nodes, links })
    };
});