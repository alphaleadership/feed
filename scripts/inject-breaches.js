'use strict';

const fs = require('fs');
const path = require('path');

hexo.extend.filter.register('before_generate', function() {
  const dataFile = path.join(this.source_dir, '_data', 'breaches.json');
  
  if (!fs.existsSync(dataFile)) {
    this.log.warn('Inject-Breaches: breaches.json non trouvé');
    return;
  }

  try {
    const data = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    const breaches = data.breaches || [];

    breaches.forEach(breach => {
      // On crée un objet "post" virtuel pour Hexo
      // On évite d'ajouter si un post avec le même titre existe déjà (doublons potentiels)
      const virtualPost = {
        title: breach.Title || breach.Name,
        slug: breach.slug || (breach.Name ? breach.Name.replace(/\s+/g, '-').toLowerCase() : breach.index),
        date: new Date(breach.BreachDate || breach.AddedDate),
        updated: new Date(breach.ModifiedDate || breach.AddedDate),
        content: breach.Description || '',
        excerpt: breach.Description ? breach.Description.substring(0, 200) + '...' : '',
        path: breach.slug ? `breaches/${breach.slug}/` : `breaches/${breach.index}/`,
        permalink: this.config.url + (breach.slug ? `/breaches/${breach.slug}/` : `/breaches/${breach.index}/`),
        source: `_virtual/breaches/${breach.index}.md`,
        raw: breach.Description || '',
        layout: 'post',
        published: true,
        categories: breach.categories || ['Breaches'],
        tags: breach.DataClasses || [],
        lien: breach.lien || breach.path,
        pwnCount: breach.PwnCount
      };

      // Injection dans la base de données interne de Hexo (Warehouse)
      this.model('Post').insert(virtualPost);
    });

    this.log.info(`Inject-Breaches: ${breaches.length} fuites injectées dans le flux de génération.`);
  } catch (err) {
    this.log.error('Inject-Breaches: Erreur lors de l\'injection', err);
  }
});
