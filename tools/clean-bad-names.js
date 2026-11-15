/**
 * Supprime les entrées dont le nom n'est pas un identifiant de fuite :
 * URL dans le nom, ou titre d'article (long / nombreuses mots).
 * Réindexe ensuite les entrées restantes. Met à jour _data + data.
 */
const fs = require('fs');
const path = require('path');
const baseDir = process.cwd();
const FILES = [
  path.join(baseDir, 'source', '_data', 'breaches.json'),
  path.join(baseDir, 'source', 'data', 'breaches.json')
];
function isBadName(b) {
  const n = String(b.Name || b.Title || '');
  if (/https?:\/\//i.test(n)) return true;
  if (n.length > 80) return true;
  const words = n.trim().split(/\s+/).filter(Boolean).length;
  if (words > 10) return true;
  return false;
}
for (const file of FILES) {
  if (!fs.existsSync(file)) continue;
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const before = (data.breaches || []).length;
  const kept = (data.breaches || []).filter(b => !isBadName(b));
  const removed = before - kept.length;
  let c = -1;
  kept.forEach(x => { if (!x.IsRetired) c++; x.index = c; });
  data.breaches = kept;
  data.totalBreaches = kept.length;
  fs.writeFileSync(file, JSON.stringify(data));
  console.log(path.basename(path.dirname(file)) + '/breaches.json:', before, '->', kept.length, '(-' + removed + ')');
}
