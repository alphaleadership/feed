const SITE_CONFIG = JSON.parse(document.getElementById('site-config').textContent);
const SITE_URL = SITE_CONFIG.url;
var search_path = SITE_CONFIG.searchPath;
if (search_path.length == 0) { search_path = "search.xml"; }
var path = SITE_CONFIG.root + search_path;
searchFunc(path, 'local-search-input', 'local-search-result');
