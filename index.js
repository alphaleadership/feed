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
  if (!title.includes("https://www.intelligenceonline.fr")) {
    return "_posts";
  } else {
    return "../temp";
  }
};

parser.parseURL(rssUrl).then(feed => {
  try {
    // Filtrage des doublons avant toute opération
    const uniqueItems = filterDisplayItems(feed.items.filter(item => item.pubDate && !isNaN(new Date(item.pubDate))));
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
      const hexoPostDir = path.join(PostDir, l(items[0].guid), Dir);
      if (!fs.existsSync(hexoPostDir)) {
        fs.mkdirSync(hexoPostDir, { recursive: true });
      }
      // --- Détection des autres fuites pour le même dossier
      // Recherche tous les fichiers existants pour ce dossier
      const allFiles = fs.readdirSync(hexoPostDir).filter(f => f.endsWith('.md'));
      allFiles.forEach((file) => {
        const filePath = path.join(hexoPostDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf8');
      
              let data
              const section =content.split('---')[0]
                console.log(yaml.load( section));
                data = yaml.load( section)
                if(data) {
                   data.pubDate = new Date(data.date);
                console.log(data.lien)
                data.guid = data.lien;
                };
               
              
              console.log(data);
              
              if(data &&data.guid && data.pubDate ){
                data.contentSnippet=content.split('---')[1].trim().split("Autres fuites pour ce dossier :")[0].trim();
                 if(items.findIndex(it => it.guid === data.guid) === -1) {
                items.push(data);
              }
              }
             
          
        
        } catch (readErr) {
          console.log('Erreur lecture fichier existant:', readErr.message);
        }})
      items.forEach((item, idx) => {
        try {
          // --- Chargement des fichiers de config
          const configFilePath = './_config.yml';
          const buildFilePath = './build.yml';
          const config = yaml.load(fs.readFileSync(configFilePath, 'utf8'));
          const build = yaml.load(fs.readFileSync(buildFilePath, 'utf8'));
          //console.log(config.category_map)
          if (!config.category_map) config.category_map = [];
          if (!config.category_map.map((ite)=>{return ite.toLowerCase()}).includes(Dir.toLowerCase())) {
            config.category_map.push(Dir.toLowerCase());
          }
          let tags = config.tags ? config.tags.split(",") : [];
          config.tags = [...new Set(tags)].join(",");
          build.tags = config.tags;
          build.category_map=config.category_map.map((item)=>{return item.toLowerCase()})
          fs.writeFileSync(configFilePath, yaml.dump(config));
          fs.writeFileSync(buildFilePath, yaml.dump(build));
           const pubDat = new Date(item.pubDate);
              const dateS = `${pubDat.getFullYear()}-${pubDat.getMonth() + 1}-${pubDat.getDate()}`;
          // --- Nom fichier : sans index si une seule fuite, avec index sinon
          const postFileName = items.length === 1 ? `${Dir}#${dateS}.md` : `${Dir}#${dateS}#${idx+1}.md`;
          const postFilePath = path.join(hexoPostDir, postFileName);
          // --- Contenu du post
          const rawContent = parsecontent(item.contentSnippet, ',', "\n") || "pas d'information actuellement";
          const cleanContent = removeNunjucks(rawContent);
          // --- Détection des autres fuites (autres entrées de postsMap pour le même DIR, même convention de nommage)
          let autresFuites = '';
          const autresKeys = Object.keys(postsMap).filter(k => k.startsWith(Dir + '#'));
          let autresRss = [];
          autresKeys.forEach(k => {
            if (k !== key) {
              autresRss = autresRss.concat(postsMap[k]);
            } else {
              // Ajoute les autres items du même key sauf celui en cours
              autresRss = autresRss.concat(postsMap[k].filter((it, i) => i !== idx));
            }
          });
          if (autresRss.length > 0) {
            autresFuites = '\n\nAutres fuites pour ce dossier :\n' + autresRss.map((it,i) => {
              // Génère un lien interne au format "dir-fuite-du-date"
              const pubDate = new Date(it.pubDate);
              const dateSt = `${pubDate.getFullYear()}-${pubDate.getMonth() + 1}-${pubDate.getDate()}`;
              const dirSlug = Dir.replace(/[^a-z0-9]/gi, '-');
              const internalLink = `${dirSlug}-fuite-du-${dateSt}`;
              return `- [${i}](https://feed-blush.vercel.app/${internalLink})`;
            }).join('\n');
          }
          const postContentHexo = ` 
title: ${Dir} fuite du ${dateS}
date: ${dateS}
lien: "${item.guid.replace('eu.orgimg','eu.org/img')}"
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
  return `<article class="post card border-0 shadow-lg mb-4 bg-gradient">
    <header class="card-header bg-dark text-white d-flex flex-column flex-md-row align-items-center border-0">
      <h2 class="mb-0 flex-grow-1 text-uppercase letter-spacing-1"><a href="${link}" target="_blank" rel="noopener" class="text-info text-decoration-none">${escapeHTML(title)}</a></h2>
      <time datetime="${pubDate}" class="badge bg-info text-dark rounded-pill shadow-sm px-3 py-2 fs-6 ms-md-3">${pubDate}</time>
    </header>
    <section class="card-body p-3">${escapeHTML(description)}</section>
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
