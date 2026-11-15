/**
 * Nettoie le champ `source` de toutes les fuites :
 * - une URL complète (article/image) est déplacée dans `lien` si vide,
 *   et `source` reçoit le domaine normalisé (via scripts/sources.js)
 * - les valeurs simples sont normalisées vers l'id canonique de la source
 * - les sources blacklistées sont préfixées "blacklisted:"
 * Met à jour source/_data/breleases.json ET source/data/breaches.json (copie servie).
 */
const fs = require('fs');
const path = require('path');
const { normalizeSource } = require('../scripts/sources');

const baseDir = process.cwd();
const FILES = [
  path.join(baseDir, 'source', '_data', 'breaches.json'),
  path.join(baseDir, 'source', 'data', 'breaches.json')
];

for (const file of FILES) {
  if (!fs.existsSync(file)) { console.warn('ignoré (absent):', file); continue; }
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const breaches = data.breaches || [];
  let movedToLien = 0, normalized = 0;
  const before = new Set(breaches.map(b => b.source || '')).size;
  for (const b of breaches) {
    const raw = b.source;
    if (!raw) { b.source = 'Manuel'; normalized++; continue; }
    if (String(raw).includes('://') || String(raw).includes('/')) {
      if (!b.lien) { b.lien = String(raw); movedToLien++; }
    }
    const n = normalizeSource(raw);
    if (n !== raw) { b.source = n; normalized++; }
  }
  const after = new Set(breaches.map(b => b.source || '')).size;
  data.breaches = breaches;
  data.totalBreaches = breaches.length;
  fs.writeFileSync(file, JSON.stringify(data));
  console.log(path.basename(path.dirname(file)) + '/breaches.json:', breaches.length, 'fuites | source distinctes:', before, '->', after, '| normalisées:', normalized, '| déplacées vers lien:', movedToLien);
  const counts = {};
  breaches.forEach(b => { counts[b.source] = (counts[b.source] || 0) + 1; });
  console.log('  top sources:', Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, v]) => k + '=' + v).join(', '));
}
