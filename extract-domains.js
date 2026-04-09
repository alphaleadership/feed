'use strict';

const { getBreachesDB } = require('./scripts/db');

function extractDomainFromUrl(url) {
  if (!url) return null;
  try {
    let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0].split(':')[0].split('?')[0];
    return cleanUrl.toLowerCase();
  } catch (err) {
    return null;
  }
}

function extractDomainFromName(name) {
  if (!name) return null;
  const domainPattern = /([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}/g;
  const matches = name.match(domainPattern);
  return matches && matches.length > 0 ? matches[0].toLowerCase() : null;
}

async function extractDomains() {
  console.log('Extraction des domaines manquants...\n');
  
  try {
    const db = await getBreachesDB();
    const breaches = db.data.breaches || [];
    
    let updatedCount = 0;
    let missingCount = 0;
    
    breaches.forEach((breach) => {
      if (!breach || breach.IsRetired || breach.Domain) return;
      
      missingCount++;
      let extractedDomain = null;
      
      if (breach.lien && !breach.lien.includes('haveibeenpwned') && !breach.lien.includes('bonjourlafuite')) {
        extractedDomain = extractDomainFromUrl(breach.lien);
      }
      
      if (!extractedDomain && breach.source && !breach.source.includes('Manuel')) {
        extractedDomain = extractDomainFromUrl(breach.source);
      }
      
      if (!extractedDomain) {
        extractedDomain = extractDomainFromName(breach.Name || breach.Title);
      }
      
      if (extractedDomain) {
        breach.Domain = extractedDomain;
        updatedCount++;
        console.log(`✓ ${breach.Name || breach.Title} → ${extractedDomain}`);
      }
    });
    
    if (updatedCount > 0) {
      db.data.lastUpdated = new Date().toISOString();
      await db.save();
      console.log(`\n✅ ${updatedCount}/${missingCount} domaines mis à jour`);
    } else {
      console.log('\n✅ Aucun domaine à mettre à jour');
    }
    
  } catch (err) {
    console.error('Erreur:', err);
  }
}

if (require.main === module) {
  extractDomains().catch(err => {
    console.error('Erreur fatale:', err);
    process.exit(1);
  });
}

module.exports = { extractDomains };
