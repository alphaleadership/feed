'use strict';

const fs = require('fs');
const path = require('path');
const { getBreachesDB } = require('./db');

hexo.extend.filter.register('before_generate', async function() {
  const blockedFile = path.join(this.base_dir, 'blocked_domains.json');
  const slugsToRemoveFile = path.join(this.base_dir, 'slugs-a-supprimer.txt');
  
  let dbInstance;
  try {
    dbInstance = await getBreachesDB();
  } catch (err) {
    this.log.error('Inject-Breaches: Erreur lors de l\'initialisation de FastDB', err);
    return;
  }

  // Charger les slugs à supprimer
  let slugsToRemove = new Set();
  if (fs.existsSync(slugsToRemoveFile)) {
    try {
      const slugsContent = fs.readFileSync(slugsToRemoveFile, 'utf-8');
      slugsContent.split('\n').forEach(slug => {
        const trimmed = slug.trim().replace(/\r/g, '');
        if (trimmed) {
          slugsToRemove.add(trimmed);
        }
      });
      this.log.info(`Inject-Breaches: ${slugsToRemove.size} slugs à supprimer chargés.`);
    } catch (err) {
      this.log.error('Inject-Breaches: Erreur lors de la lecture des slugs à supprimer', err);
    }
  }

  let blockedDomains = new Map();
  if (fs.existsSync(blockedFile)) {
    try {
      const blockedDataRaw = JSON.parse(fs.readFileSync(blockedFile, 'utf-8'));
      const blockedData = Array.isArray(blockedDataRaw) ? blockedDataRaw : (blockedDataRaw.domains || []);
      blockedData.forEach(d => {
        if (d.domain) {
          blockedDomains.set(d.domain.toLowerCase(), d.notes || '');
        }
      });
      this.log.info(`Inject-Breaches: ${blockedDomains.size} domaines bloqués chargés.`);
    } catch (err) {
      this.log.error('Inject-Breaches: Erreur lors de la lecture des domaines bloqués', err);
    }
  }

  function getBlockedNote(domain) {
    if (!domain) return null;
    domain = domain.toLowerCase().trim();
    // On enlève le protocole si présent
    domain = domain.replace(/^https?:\/\//, '').split('/')[0];
    
    let parts = domain.split('.');
    while (parts.length >= 2) {
      let current = parts.join('.');
      if (blockedDomains.has(current)) {
        return blockedDomains.get(current);
      }
      parts.shift();
    }
    return null;
  }

  try {
    const data = dbInstance.data;
    const breaches = data.breaches || [];

    breaches.forEach(breach => {
      // Vérifier si le slug est dans la liste de suppression
      if (slugsToRemove.has(breach.slug)) {
        this.log.debug(`Inject-Breaches: Fuite ignorée (dans slugs-a-supprimer) : ${breach.slug}`);
        return;
      }

      let content = breach.Description || '';
      const domain = breach.Domain || '';
      const blockedNote = getBlockedNote(domain);

      if (blockedNote) {
        const warning = `\n\n> ⚠️ **Attention** : Ce domaine (${domain}) est listé comme potentiellement malveillant ou indésirable.\n> **Notes** : ${blockedNote}\n\n`;
        content = warning + content;
      }

      // On crée un objet "post" virtuel pour Hexo
      const virtualPost = {
        title: breach.Title || breach.Name,
        slug: breach.slug || (breach.Name ? breach.Name.replace(/\s+/g, '-').toLowerCase() : breach.index),
        date: new Date(breach.BreachDate || breach.AddedDate),
        updated: new Date(breach.ModifiedDate || breach.AddedDate),
        content: content,
        excerpt: content ? content.substring(0, 200) + '...' : '',
        path: breach.slug ? `breaches/${breach.slug}/` : `breaches/${breach.index}/`,
        permalink: this.config.url + (breach.slug ? `/breaches/${breach.slug}/` : `/breaches/${breach.index}/`),
        source: `_virtual/breaches/${breach.index}.md`,
        raw: content,
        layout: 'post',
        published: true,
        categories: breach.categories || ['Breaches'],
        tags: breach.DataClasses || [],
        lien: breach.lien || breach.path,
        pwnCount: breach.PwnCount,
        isBlocked: !!blockedNote,
        blockedNote: blockedNote
      };

      // Injection dans la base de données interne de Hexo (Warehouse)
      this.model('Post').insert(virtualPost);
    });

    this.log.info(`Inject-Breaches: ${breaches.length} fuites injectées dans le flux de génération.`);
  } catch (err) {
    this.log.error('Inject-Breaches: Erreur lors de l\'injection', err);
  }
});
