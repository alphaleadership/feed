const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const yaml = require('js-yaml');
const parser = new Parser();

const rssUrl = 'https://thomas-iniguez-visioli.github.io/nodejs-news-feeder/feed.xml';
const PostDir = './source/';

const parsecontent = (txt, sep, joi) => {
  if (!txt) return "";
  return txt.split(sep).map(line => line.trim()).join(joi);
};

const removeNunjucks = (content) => {
  if (!content) return '';
  return content.replace(/{%.*?%}/g, '').replace(/{{\s*.*?}}/g, '');
};

const l = (title) => {
  if (title.includes("bonjourlafuite")) {
    return "_posts";
  } else {
    return "../_posts";
  }
};

parser.parseURL(rssUrl).then(feed => {
  try {
    // Filtrage des doublons avant toute opération
    const uniqueItems = filterDisplayItems(feed.items);
    // Regroupement par entreprise et date
    const postsMap = {};
    uniqueItems.forEach((item) => {
      try {
        const postTitle = item.link.split('/').pop();
        const pubDate = new Date(item.pubDate);
        const dateStr = `${pubDate.getFullYear()}-${pubDate.getMonth() + 1}-${pubDate.getDate()}`;
        const entreprises = postTitle.split("-")[0].replace("#", '').split(",");
        entreprises.forEach((DirRaw) => {
          const Dir = DirRaw.trim().toLowerCase();
          const key = `${Dir}#${dateStr}`;
          if (!postsMap[key]) postsMap[key] = [];
          postsMap[key].push(item);
        });
      } catch (itemErr) {
        console.log('Erreur parsing item:', itemErr.message);
      }
    });
    // Création des posts Hexo
    Object.entries(postsMap).forEach(([key, items]) => {
      const [Dir, dateStr] = key.split('#');
      const hexoPostDir = path.join(PostDir, l(items[0].link), Dir);
      if (!fs.existsSync(hexoPostDir)) {
        fs.mkdirSync(hexoPostDir, { recursive: true });
      }
      items.forEach((item, idx) => {
        try {
          // --- Chargement des fichiers de config
          const configFilePath = './_config.yml';
          const buildFilePath = './build.yml';
          const config = yaml.load(fs.readFileSync(configFilePath, 'utf8'));
          const build = yaml.load(fs.readFileSync(buildFilePath, 'utf8'));
          if (!config.category_map) config.category_map = [];
          if (!config.category_map.includes(Dir)) {
            config.category_map.push(Dir);
          }
          let tags = config.tags ? config.tags.split(",") : [];
          config.tags = [...new Set(tags)].join(",");
          build.tags = config.tags;
          fs.writeFileSync(configFilePath, yaml.dump(config));
          fs.writeFileSync(buildFilePath, yaml.dump(build));
          // --- Nom fichier : sans index si une seule fuite, avec index sinon
          const postFileName = items.length === 1 ? `${Dir}#${dateStr}.md` : `${Dir}#${dateStr}#${idx+1}.md`;
          const postFilePath = path.join(hexoPostDir, postFileName);
          // --- Contenu du post
          const rawContent = parsecontent(item.contentSnippet, ',', "\n") || "pas d'information actuellement";
          const cleanContent = removeNunjucks(rawContent);
          let autresFuites = items.length > 1 ? '\n\nAutres fuites ce jour :\n' + items.map((it, i) => i !== idx ? `- [${it.link}](${it.link})` : '').filter(Boolean).join('\n') : '';
          const postContentHexo = ` 
title: ${Dir} fuite du ${dateStr}
date: ${dateStr}
lien: "${item.guid}"
categories:
  - ${Dir}
---

${cleanContent}
${autresFuites}
`;
          // --- Création ou mise à jour du fichier
          if (!fs.existsSync(postFilePath)) {
            fs.writeFileSync(postFilePath, postContentHexo);
            console.log(`✅ Nouveau fichier créé : ${postFileName}`);
          } else {
            const existingContent = fs.readFileSync(postFilePath, 'utf8');
            if (existingContent !== postContentHexo) {
              fs.writeFileSync(postFilePath, postContentHexo);
              console.log(`✏️ Fichier mis à jour : ${postFileName}`);
            } else {
              console.log(`⏩ Fichier inchangé : ${postFileName}`);
            }
          }
        } catch (fileErr) {
          console.log('Erreur création post:', fileErr.message);
        }
      });
    });
  } catch (feedErr) {
    console.log('Erreur parsing feed:', feedErr.message);
  }
}).catch((err) => {
  console.log('Erreur récupération RSS:', err.message);
});

// --- Amélioration affichage moderne ---
// Ajout d'une fonction pour générer un HTML responsive et sécurisé
function generatePostHTML({ title, description, pubDate, link }) {
  return `<article class="post">
    <header>
      <h2><a href="${link}" target="_blank" rel="noopener">${escapeHTML(title)}</a></h2>
      <time datetime="${pubDate}">${pubDate}</time>
    </header>
    <section>${escapeHTML(description)}</section>
  </article>`;
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, function(tag) {
    const charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
}

// --- Filtrage des doublons pour l'affichage ---
function filterDisplayItems(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = (item.guid || item.link || item.title).trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ... Utiliser filterDisplayItems avant toute boucle d'affichage ...
// Par exemple :
// const uniqueItems = filterDisplayItems(feed.items)
// uniqueItems.forEach(...)
