const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const yaml = require('js-yaml');
const parser = new Parser();
const axios = require('axios');
const { getBreachesDB } = require('./scripts/db');
const rssUrl = 'https://thomas-iniguez-visioli.github.io/nodejs-news-feeder/feed.xml';
const PostDir = './source/';

async function updateHIBPBreaches() {
  try {
    const db = await getBreachesDB();
    const data = db.data;
    const res = await axios.default.get("https://haveibeenpwned.com/api/v3/breaches");
    let updated = false;
    
    // S'assurer que data.breaches est un tableau d'objets
    if (!Array.isArray(data.breaches)) data.breaches = [];

    res.data.forEach((breach) => {
      if (breach && !breach.BreachDate) {
        breach.BreachDate = '1970-01-01';
      }
      // On ne cherche que par Name (objet)
      const index = data.breaches.findIndex((b) => b && typeof b === 'object' && b.Name === breach.Name);
      
      if (index === -1) {
        data.breaches.push(breach);
        updated = true;
        // console.log(`✨ Nouvelle fuite HIBP ajoutée: ${breach.Name}`);
      } else if (typeof data.breaches[index] !== 'object') {
        // Au cas où il y aurait une chaîne de caractères au lieu d'un objet
        data.breaches[index] = breach;
        updated = true;
      }
    });

    if (updated) {
      data.breaches.sort((a, b) => {
        const dateA = a && a.BreachDate ? new Date(a.BreachDate) : new Date(0);
        const dateB = b && b.BreachDate ? new Date(b.BreachDate) : new Date(0);
        return dateA - dateB;
      });
      let indexCounter = -1;
      data.breaches.forEach((breach) => {
        if (breach && !breach.IsRetired) indexCounter++;
        if (breach) breach.index = indexCounter;
      });
      
      data.totalBreaches = data.breaches.length;
      data.lastUpdated = new Date().toISOString();
      await db.save();
      console.log("✅ Base de données breaches.json mise à jour avec les données HIBP, triée et réindexée.");
    }
  } catch (err) {
    console.log("❌ Erreur lors de la récupération des données HIBP:", err.message);
  }
}

const parsecontent = (txt, sep, joi) => {
  if (!txt) return "";
  return txt.split(sep).map(line => line.trim()).join(joi);
};

const removeNunjucks = (content) => {
  if (!content) return '';
  return content.replace(/{%.*?%}/g, '').replace(/{{\s*.*?}}/g, '').replace(/<%.*?%>/g, '').replace("[[",'').replace("]]",'');
};

const l = (title, cat = []) => {
  if(title.startsWith("CVE")){
    return "_posts"
  }
  const validCategories = [].map((item)=>{return item.toLowerCase()});
  
  const hasValidCategory = cat.some(c => validCategories.includes(c.toLowerCase()));
  
  if (hasValidCategory) {
    console.log('✅ Catégorie valide trouvée:', cat.find(c => validCategories.includes(c.toLowerCase())));
    return "_posts";
  }
  
  const ignoredUrls = [
    "https://www.zataz.com/",
    "https://www.intelligenceonline.fr",
    "https://www.cloudflarestatus.com/","https://www.numerama.com/",
    "https://www.frandroid.com/",'https://opensourceprojects.dev/','github.io'
  ];
  
  for (const url of ignoredUrls) {
    if (title.includes(url)) {
      return "../temp";
    }
  }
  
  return "_posts";
};

const checklink=(table,lien)=>{
  return !table.includes(lien)
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

function filterDisplayItems(items) {
  const seen = new Set();
  return items.filter(item => {
    const key = (item.guid || item.link || item.title).trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Fonction principale
async function main() {
  await updateHIBPBreaches();

  try {
    const feed = await parser.parseURL(rssUrl);
    let alreadyseen = new Set();
    
    const uniqueItems = filterDisplayItems(feed.items.map((i)=>{
      i.pubDate = i.pubDate.replace("BST","");
      return i;
    }).filter(item => item.pubDate && !isNaN(new Date(item.pubDate))));

    const postsMap = {};
    const fuite = {};
    
    uniqueItems.forEach((item) => {
      try {
        const postTitle = item.link.split('/').pop();
        const pubDate = new Date(item.pubDate);
        const dateStr = `${pubDate.getFullYear()}-${pubDate.getMonth() + 1}-${pubDate.getDate()}`;
        let entreprises;
        if(item.guid.startsWith("CVE")){
          entreprises = [item.guid];
        } else {
          entreprises = postTitle.split("-")[0].replace("#", '').replaceAll("[",'').replaceAll("]",'' ).split(",");
        }
        
        entreprises.forEach((DirRaw) => {
          const Dir = DirRaw.trim().toLowerCase();
          const key = `${Dir}#${dateStr}`;
          if (!postsMap[key]) postsMap[key] = [];
          if(!fuite[Dir||"zataz"]) fuite[Dir||"zataz"] = [];
          postsMap[key].push(item);
          fuite[Dir||"zataz"].push(item);
          
          const destinationDir = l(item.link, item.categories);
          const hexoPostDir = path.join(PostDir, destinationDir, Dir||"zataz");
          if (!fs.existsSync(hexoPostDir)) {
            fs.mkdirSync(hexoPostDir, { recursive: true });
          }
          
          const allFiles = fs.readdirSync(hexoPostDir).filter(f => f.endsWith('.md'));
          allFiles.forEach((file) => {
            const filePath = path.join(hexoPostDir, file);
            try {
              const content = fs.readFileSync(filePath, 'utf8');
              const section = content.split('---')[0];
              const data = yaml.load(section);
              if(data) {
                data.pubDate = new Date(data.date);
                data.guid = data.lien;
                
                if(data.guid && data.pubDate ){
                  data.contentSnippet = content.split('---')[1].trim().split("Autres fuites pour ce dossier :")[0].trim();
                  if(postsMap[key].findIndex(it => it.guid.replace('eu.orgimg','eu.org/img') === data.guid) === -1) {
                    postsMap[key].push(data);
                  }
                  if(fuite[Dir||"zataz"].findIndex(it => it.guid.replace('eu.orgimg','eu.org/img') === data.guid) === -1) {
                    fuite[Dir||"zataz"].push(data);
                  }
                }
              }
            } catch (readErr) {
              console.log('Erreur lecture fichier existant:', readErr.message);
            }
          });
        });
      } catch (itemErr) {
        console.log('Erreur parsing item:', itemErr.message);
      }
    });

    Object.entries(postsMap).forEach(([key, items]) => {
      const destinationDir = l(items[0].link, items[0].categories);
      if(destinationDir){
        const [Dir, dateStr] = key.split('#');
        const hexoPostDir = path.join(PostDir, destinationDir, Dir||"zataz");
        if (!fs.existsSync(hexoPostDir)) {
          fs.mkdirSync(hexoPostDir, { recursive: true });
        }
        
        items.forEach((item, idx) => {
          if(alreadyseen.has(item.guid.replace('eu.orgimg','eu.org/img'))){
            return;
          }
          alreadyseen.add(item.guid.replace('eu.orgimg','eu.org/img'));
          try {
            const configFilePath = './_config.yml';
            const buildFilePath = './build.yml';
            const config = yaml.load(fs.readFileSync(configFilePath, 'utf8'));
            const build = yaml.load(fs.readFileSync(buildFilePath, 'utf8'));
            
            if (!config.category_map) config.category_map = [];
            if (!config.category_map.map(ite => ite.toLowerCase()).includes(Dir.toLowerCase())) {
              config.category_map.push(Dir.toLowerCase());
            }
            config.category_map = [... new Set(config.category_map)];
            let tags = config.tags ? config.tags.split(",") : [];
            config.tags = [...new Set(tags)].join(",");
            build.tags = config.tags;
            build.category_map = config.category_map.map(item => item.toLowerCase());
            fs.writeFileSync(configFilePath, yaml.dump(config));
            fs.writeFileSync(buildFilePath, yaml.dump(build));
            
            const pubDat = new Date(item.pubDate);
            const dateS = `${pubDat.getFullYear()}-${pubDat.getMonth() + 1}-${pubDat.getDate()}`;
            const postFileName = items.length === 1 ? `${Dir}#${dateS}.md` : `${Dir}#${dateS}#${idx}.md`;
            const postFilePath = path.join(hexoPostDir, postFileName);
            
            const rawContent = parsecontent(item.contentSnippet, ',', "\n") || "pas d'information actuellement";
            const cleanContent = removeNunjucks(rawContent);
            
            let autresFuites = '';
            const autresRss = fuite[Dir||"zataz"].filter((it, i) => i !== idx);
            
            if (autresRss.length > 0) {
              const dirSlug = Dir.replace(/[^a-z0-9]/gi, '-');
              let lien = [`${dirSlug}-fuite-du-${dateS}`];
              autresFuites = '\n\nAutres fuites pour ce dossier :\n' + autresRss.map((it,i) => {
                const pubDate = new Date(it.pubDate);
                const dateSt = `${pubDate.getFullYear()}-${pubDate.getMonth() + 1}-${pubDate.getDate()}`;
                const internalLink = `${dirSlug}-fuite-du-${dateSt}`;
                if(checklink(lien,internalLink)){
                  lien.push(internalLink);
                  return `- [${lien.length }](https://feed-blush.vercel.app/${internalLink})`;
                }
              }).filter(Boolean).join('\n');
            }
            
            if(item.categories){
              if (!item.categories.includes(Dir)) item.categories.push(Dir);
            }else{
              item.categories = [Dir];
            }
            
            const postContentHexo = `title: ${Dir} fuite du ${dateS}
date: ${dateS}
lien: "${item.guid.replace('eu.orgimg','eu.org/img')}"
${yaml.dump({categories:[... new Set(item.categories)]})}
---

${cleanContent}
${autresFuites}
`.replaceAll("![CDATA[",'').replaceAll("]]>",'');

            if (!fs.existsSync(postFilePath)) {
              fs.writeFileSync(postFilePath, postContentHexo);
            } else {
              const existingContent = fs.readFileSync(postFilePath, 'utf8');
              if (existingContent !== postContentHexo) {
                fs.writeFileSync(postFilePath, postContentHexo);
              }
            }
          } catch (fileErr) {
            console.log('Erreur création post:', fileErr.message);
          }
        });
      }
    });
  } catch (err) {
    console.log('Erreur traitement RSS:', err.message);
  }
}

main();
