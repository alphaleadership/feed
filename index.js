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
  feed.items.forEach((item) => {
    const postTitle = item.link.split('/').pop();
    const pubDate = new Date(item.pubDate);
    const dateStr = `${pubDate.getFullYear()}-${pubDate.getMonth() + 1}-${pubDate.getDate()}`;

    // entreprise(s) = partie avant le "#"
    postTitle.split("-")[0].replace("#", '').split(",").map((Dir) => {
      const configFilePath = './_config.yml';
      const buildFilePath = './build.yml';
      const configContent = fs.readFileSync(configFilePath, 'utf8');
      const config = yaml.load(configContent);
      const buildContent = fs.readFileSync(buildFilePath, 'utf8');
      const build = yaml.load(buildContent);

      // --- Gestion des catégories ---
      if (!config.category_map) {
        config.category_map = [];
      }
      if (!config.category_map.includes(Dir.toLowerCase())) {
        config.category_map.push(Dir.toLowerCase());
      }

      // --- Arborescence ---
      const hexoPostDir = path.join(PostDir, l(item.link), Dir);
      if (!fs.existsSync(hexoPostDir)) {
        fs.mkdirSync(hexoPostDir, { recursive: true });
      }

      // --- Nom du fichier avec entreprise#date ---
      const safeTitle = postTitle.replace(/ /g, '').replace('\n', '').toLowerCase();
      const postFileName = `${Dir.toLowerCase()}#${dateStr}.md`;
      const postFilePath = path.join(hexoPostDir, postFileName);

      // --- Génération du contenu ---
      const rawContent = parsecontent(item.contentSnippet, ',', "\n") || "pas d'information actuellement";
      const cleanContent = removeNunjucks(rawContent);

      const postContentHexo = ` 
title: ${Dir} fuite du ${dateStr}
date: ${dateStr}
lien: "${item.link}"
categories:
  - ${Dir.toLowerCase()}
---

${cleanContent}
`;

      // --- Mise à jour configs ---
      let tags = config.tags ? config.tags.split(",") : [];
      config.tags = [...new Set(tags)].join(",");
      build.tags = config.tags;

      fs.writeFileSync(configFilePath, yaml.dump(config));
      fs.writeFileSync(buildFilePath, yaml.dump(build));

      // --- Création ou mise à jour du fichier ---
      if (!fs.existsSync(postFilePath)) {
        fs.writeFileSync(postFilePath, postContentHexo);
      } else {
        const existingContent = fs.readFileSync(postFilePath, 'utf8');
        if (existingContent !== postContentHexo) {
          fs.writeFileSync(postFilePath, postContentHexo);
        }
      }
    });
  });
});
