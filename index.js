const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const parser = new Parser();

const rssUrl = 'https://thomas-iniguez-visioli.github.io/nodejs-news-feeder/feed.xml'; // Remplacez par l'URL de votre flux RSS
const PostDir = './source/_posts'; // Répertoire où seront créés les posts Hexo
const parsecontent=(txt)=>{
  return txt.split(',').map(line => line.trim()).join('\n');
}
parser.parseURL(rssUrl)
  .then(feed => {
    feed.items.forEach(item => {
      const postTitle = item.link.split('/').pop();
      postTitle.split("-")[0].replace("#",'').split(",").map((Dir)=>{
        const yaml = require('js-yaml');
        const configFilePath = './_config.yml';
        const configContent = fs.readFileSync(configFilePath, 'utf8');
        const config = yaml.load(configContent);
        if (!config.tag_map) {
          config.tag_map = [];
        }
        config.tag_map.push(Dir);
        const updatedConfigContent = yaml.dump(config);
        fs.writeFileSync(configFilePath, updatedConfigContent);
        const hexoPostDir= path.join(PostDir,Dir)
        if(!fs.existsSync(hexoPostDir)){
          fs.mkdirSync(hexoPostDir)
        }
      const postFileName = `${postTitle.replace(/ /g, '').replace('\n','').toLowerCase()}.md`;
      const postFilePath = path.join(hexoPostDir, postFileName);
        console.log(item)
      if (!fs.existsSync(postFilePath)) {
        const postContentHexo = `---
title: ${postTitle.replace("#",'')}
date: ${postTitle.split('-').slice(-3).join("-")}





---
${parsecontent(item.contentSnippet)}
`;

        fs.writeFileSync(postFilePath, postContentHexo);
        console.log(`Post créé : ${postFileName}`);
      } else {
        console.log(`Post déjà existant : ${postFileName}`);
      }
    });
  })
  

      })
      

