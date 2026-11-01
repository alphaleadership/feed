// hexo-everyday-calendar injecte <script src="./func.js"> (chemin relatif) :
// sur les sous-pages (/archives/...), cela devient /archives/func.js -> 404 text/plain,
// bloqué par X-Content-Type-Options: nosniff. On réécrit en chemin absolu (config.root).
hexo.extend.filter.register('after_render:html', function (str) {
  return str.split('src="./func.js"').join('src="' + hexo.config.root + 'func.js"');
});
