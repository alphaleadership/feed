const fs = require('fs');
const path = require('path');
const Parser = require('rss-parser');
const parser = new Parser();

const rssUrl = 'https://thomas-iniguez-visioli.github.io/nodejs-news-feeder/feed.xml'; // Remplacez par l URL de votre flux RSS
const PostDir = './source/'; // R&eacute;pertoire o&ugrave; seront cr&eacute;s les posts Hexo

const parsecontent = (txt, sep, joi) => {
  if (!txt) return "";
  return txt.split(sep).map(line => line.trim()).join(joi);
}

const removeNunjucks = (content) => {
  if (!content) return '';
  // Removes {{...}} and {%...%} tags
  return content.replace(/{%.*?%}/g, '').replace(/{{\s*.*?}}/g, '');
};

const l = (title) => {
  if (title.includes("bonjourlafuite")) {
    return "_posts"
  } else {
    return "../_posts"
  }
}

parser.parseURL(rssUrl)
  .then(feed => {
    feed.items.forEach((item, i) => {
      const postTitle = item.link.split('/').pop();
      postTitle.split("-")[0].replace("#", '').split(",").map((Dir) => {
        const yaml = require('js-yaml');
        const configFilePath = './_config.yml';
        const buildFilePath = './build.yml';
        const configContent = fs.readFileSync(configFilePath, 'utf8');
        const config = yaml.load(configContent);
        const buildContent = fs.readFileSync(buildFilePath, 'utf8');
        const build = yaml.load(buildContent);
        config.category_map = config.category_map.filter((item) => {
          return item === item.toLowerCase()
        })
        if (!config.category_map) {
          config.category_map = [];
        } if (!config.category_map.includes(Dir.toLowerCase())) {
          config.category_map.push(Dir.toLowerCase());
        }
        if (!fs.existsSync(path.join(PostDir,l(item.link)))) {
          fs.mkdirSync(path.join(PostDir,l(item.link)))
        }
        const hexoPostDir = path.join(PostDir,l(item.link),Dir)
        if(!fs.existsSync(hexoPostDir)){
          fs.mkdirSync(hexoPostDir)
        }
      const postFileName = `${postTitle.replace(/ /g, '').replace('\n', '').toLowerCase()}.md`;
      const postFilePath = path.join(hexoPostDir, postFileName);
        if (!fs.existsSync(postFilePath)) {
          const rawContent = parsecontent(item.contentSnippet, ',', "\n") || "pas d'information actuellement";
          const cleanContent = removeNunjucks(rawContent);
          const postContentHexo = ` 
title: ${postTitle.replace("#", "")}
date: ${new Date(item.pubDate).getFullYear()}-${new Date(item.pubDate).getMonth()+1}-${new Date(item.pubDate).getDate()}
lien: "${item.link}"
categories:
  - ${Dir.toLowerCase()}
---

${cleanContent}
`;
          let tags = config.tags.split(",")
          config.tags = [...new Set(tags)].join(",")
          build.tags=config.tags
          const updatedConfigContent = yaml.dump(config);
          fs.writeFileSync(configFilePath, updatedConfigContent);
          fs.writeFileSync(buildFilePath, yaml.dump(build));
          fs.writeFileSync(postFilePath, postContentHexo);
        } else {
        }
      });
    })
  })

var sudoku = require('sudoku');
const t = sudoku.makepuzzle().map((item) => {
  var puzzle = sudoku.makepuzzle();
  var solution = sudoku.solvepuzzle(puzzle);
  var difficulty = sudoku.ratepuzzle(puzzle, 9);
  return difficulty
})
