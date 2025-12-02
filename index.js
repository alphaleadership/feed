const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const yaml = require('js-yaml');
const parser = new Parser();
const axios = require('axios');
const db=require("./source/_data/breaches.json")
const rssUrl = 'https://thomas-iniguez-visioli.github.io/nodejs-news-feeder/feed.xml';
const PostDir = './source/';
axios.default.get("https://haveibeenpwned.com/api/v3/breaches").then((res)=>{
res.data.forEach((breach)=>{
  if(!db.breaches.includes(breach.Name)){
    console.log(breach.Name)
    db.breaches.push(breach.Name)
  }
})
}).catch((err)=>{
  console.log(err)
})
const parsecontent = (txt, sep, joi) => {
  if (!txt) return "";
  return txt.split(sep).map(line => line.trim()).join(joi);
};

const removeNunjucks = (content) => {
  if (!content) return '';
  return content.replace(/{%.*?%}/g, '').replace(/{{\s*.*?}}/g, '');
};

const l = (title, cat = []) => {
  // Liste des catégories valides qui doivent aller dans _posts
  if(title.startsWith("CVE")){
    return "_posts"
  }
  const validCategories = [
    "fuite de données",
    "Données personnelles",
    "Cybersécurité",
    "Sécurité"
  ].map((item)=>{return item.toLowerCase()});
  
  // Vérifier si au moins une catégorie valide est présente
  const hasValidCategory = cat.some(c => validCategories.includes(c.toLowerCase()));
  
  if (hasValidCategory) {
    console.log('✅ Catégorie valide trouvée:', cat.find(c => validCategories.includes(c.toLowerCase())));
    return "_posts";
  }
  
  // Liste des URLs à ignorer (rediriger vers temp)
  const ignoredUrls = [
    "https://www.zataz.com/",
    "https://www.intelligenceonline.fr",
    "https://www.cloudflarestatus.com/","https://www.numerama.com/",
    "https://www.frandroid.com/",'https://opensourceprojects.dev/'
  ];
  
  // Vérifier si le titre contient une URL à ignorer
  //console.log(title)
  for (const url of ignoredUrls) {
    if (title.includes(url)) {
    //  console.log('⏭️ URL ignorée:', url);
      return "../temp";
    }
  }
  
  // Par défaut, retourner _posts
// console.log('📝 Aucune règle spécifique, utilisation par défaut');
  return "_posts";
};
const checklink=(table,lien)=>{
  return !table.includes(lien)
}
parser.parseURL(rssUrl).then(feed => {
  let alreadyseen=new Set()
 // console.log(feed)
  try {
    // Filtrage des doublons avant toute opération
    const uniqueItems = filterDisplayItems(feed.items.map((i)=>{
    //  console.log(i.pubDate)
      //console.log(new Date(i.pubDate.replace("BST","")))
      i.pubDate=i.pubDate.replace("BST","")
      return i
    }).filter(item => item.pubDate && !isNaN(new Date(item.pubDate))));
    // Regroupement par entreprise et date
    const postsMap = {};
    const fuite={}
    uniqueItems.forEach((item) => {
      try {
        const postTitle = item.link.split('/').pop();
        const pubDate = new Date(item.pubDate);
        const dateStr = `${pubDate.getFullYear()}-${pubDate.getMonth() + 1}-${pubDate.getDate()}`;
        let entreprises
        if(item.guid.startsWith("CVE")){
          entreprises=[item.guid]
        }else{
          entreprises = postTitle.split("-")[0].replace("#", '').replaceAll("[",'').replaceAll("]",'' ).split(",");
        
        }entreprises.forEach((DirRaw) => {
          const Dir = DirRaw.trim().toLowerCase();
          const key = `${Dir}#${dateStr}`;
          if (!postsMap[key]) postsMap[key] = [];
          if(!fuite[Dir||"zataz"]) fuite[Dir||"zataz"]=[]
          postsMap[key].push(item);
          fuite[Dir||"zataz"].push(item)
              const destinationDir = l(item.guid,item.categories);
   //   if(destinationDir){
        //const [Dir, dateStr] = key.split('#');
        const hexoPostDir = path.join(PostDir, destinationDir, Dir||"zataz");
        if (!fs.existsSync(hexoPostDir)) {
          fs.mkdirSync(hexoPostDir, { recursive: true });
        }//}
           const allFiles = fs.readdirSync(hexoPostDir).filter(f => f.endsWith('.md'));
        allFiles.forEach((file) => {
          const filePath = path.join(hexoPostDir, file);
          try {
            const content = fs.readFileSync(filePath, 'utf8');
        
                let data
                const section =content.split('---')[0]
                //  console.log(yaml.load( section));
                  data = yaml.load( section)
                  if(data) {
                     data.pubDate = new Date(data.date);
                 // console.log(data.lien)
                  data.guid = data.lien;
                  };
                 
                
               // console.log(data);
                
                if(data &&data.guid && data.pubDate ){
                  data.contentSnippet=content.split('---')[1].trim().split("Autres fuites pour ce dossier :")[0].trim();
                //  console.log(items)
                   if(postsMap[key].findIndex(it => it.guid.replace('eu.orgimg','eu.org/img') === data.guid) === -1) {
                      postsMap[key].push(data);
                   }
                   if(fuite[Dir||"zataz"].findIndex(it => it.guid.replace('eu.orgimg','eu.org/img') === data.guid) === -1) {
                      fuite[Dir||"zataz"].push(data);
                   }
                }
               
            
          
          } catch (readErr) {
            console.log('Erreur lecture fichier existant:', readErr.message);
          }})
        });
      } catch (itemErr) {
        console.log('Erreur parsing item:', itemErr.message);
      }
    });
    // Création des posts Hexo
    Object.entries(postsMap).forEach(([key, items]) => {
      const destinationDir = l(items[0].guid,items[0].categories);
      if(destinationDir){
        const [Dir, dateStr] = key.split('#');
        const hexoPostDir = path.join(PostDir, destinationDir, Dir||"zataz");
        if (!fs.existsSync(hexoPostDir)) {
          fs.mkdirSync(hexoPostDir, { recursive: true });
        }
        // --- Détection des autres fuites pour le même dossier
        // Recherche tous les fichiers existants pour ce dossier
       
        items.forEach((item, idx) => {
          if(alreadyseen.has(item.guid.replace('eu.orgimg','eu.org/img'))){
            return
          }
          alreadyseen.add(item.guid.replace('eu.orgimg','eu.org/img'))
          try {
            // --- Chargement des fichiers de config
          //  console.log(items.length)
            const configFilePath = './_config.yml';
            const buildFilePath = './build.yml';
            const config = yaml.load(fs.readFileSync(configFilePath, 'utf8'));
            const build = yaml.load(fs.readFileSync(buildFilePath, 'utf8'));
            //console.log(config.category_map)
            if (!config.category_map) config.category_map = [];
            if (!config.category_map.map((ite)=>{return ite.toLowerCase()}).includes(Dir.toLowerCase())) {
              config.category_map.push(Dir.toLowerCase());
            }
            config.category_map=[... new Set(config.category_map)]
            let tags = config.tags ? config.tags.split(",") : [];
            config.tags = [...new Set(tags)].join(",");
            build.tags = config.tags;
            build.category_map=config.category_map.map((item)=>{return item.toLowerCase()})
            fs.writeFileSync(configFilePath, yaml.dump(config));
            fs.writeFileSync(buildFilePath, yaml.dump(build));
             const pubDat = new Date(item.pubDate);
                const dateS = `${pubDat.getFullYear()}-${pubDat.getMonth() + 1}-${pubDat.getDate()}`;
            // --- Nom fichier : sans index si une seule fuite, avec index sinon
            const postFileName = items.length === 1 ? `${Dir}#${dateS}.md` : `${Dir}#${dateS}#${idx}.md`;
            const postFilePath = path.join(hexoPostDir, postFileName);
            // --- Contenu du post
            const rawContent = parsecontent(item.contentSnippet, ',', "\n") || "pas d'information actuellement";
            const cleanContent = removeNunjucks(rawContent);
            // --- Détection des autres fuites (autres entrées de postsMap pour le même DIR, même convention de nommage)
            let autresFuites = '';
            const autresKeys = fuite[Dir||"zataz"];
            let autresRss = fuite[Dir||"zataz"].filter((it, i) => i !== idx);
           /* autresKeys.forEach(k => {
              if (k !== key) {
                autresRss = autresRss.concat(postsMap[k]);
              } else {
                // Ajoute les autres items du même key sauf celui en cours
                autresRss = autresRss.concat(postsMap[k];
              }
            });*/
            if (autresRss.length > 0) {
              const dirSlug = Dir.replace(/[^a-z0-9]/gi, '-');
              let lien=[`${dirSlug}-fuite-du-${dateS}`]
              autresFuites = '\n\nAutres fuites pour ce dossier :\n' + autresRss.map((it,i) => {
                // Génère un lien interne au format "dir-fuite-du-date"
                const pubDate = new Date(it.pubDate);
                const dateSt = `${pubDate.getFullYear()}-${pubDate.getMonth() + 1}-${pubDate.getDate()}`;
                
                const internalLink = `${dirSlug}-fuite-du-${dateSt}`;
                if(checklink(lien,internalLink)){
                  lien.push(internalLink)
                  return `- [${lien.length }](https://feed-blush.vercel.app/${internalLink})`;
                }
                
              }).join('\n');
            }
            if(item.categories){
              item.categories.push(Dir)
            }else{
              item.categories=[Dir]
            }
            const postContentHexo = `title: ${Dir} fuite du ${dateS}
date: ${dateS}
lien: "${item.guid.replace('eu.orgimg','eu.org/img')}"
${yaml.dump({categories:[... new Set(item.categories)]})}
---

${cleanContent}

`;
            // --- Création ou mise à jour du fichier
            if (!fs.existsSync(postFilePath)) {
              fs.writeFileSync(postFilePath, postContentHexo);
            //  console.log(`✅ Nouveau fichier créé : ${postFileName}`);
            } else {
              const existingContent = fs.readFileSync(postFilePath, 'utf8');
              if (existingContent !== postContentHexo) {
                fs.writeFileSync(postFilePath, postContentHexo);
            //    console.log(`✏️ Fichier mis à jour : ${postFileName}`);
              } else {
            //    console.log(`⏩ Fichier inchangé : ${postFileName}`);
              }
            }
          } catch (fileErr) {
            console.log('Erreur création post:', fileErr.message);
          }
        });
      }
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
