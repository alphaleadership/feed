const fs = require('fs');
const path = require('path');

// Enregistrer le helper Hexo
hexo.extend.helper.register('getCategoryStats', function() {
  try {
    const breachesPath = path.join(hexo.source_dir, '_data/breaches.json');
    const data = JSON.parse(fs.readFileSync(breachesPath, 'utf8'));
    
    const categoryCount = {};
    
    // Compter les occurrences de chaque DataClass
    data.breaches.forEach(breach => {
      if (breach.DataClasses && Array.isArray(breach.DataClasses)) {
        breach.DataClasses.forEach(category => {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
      }
    });
    
    // Trier par nombre d'occurrences (décroissant)
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ 
        name, 
        count, 
        percentage: ((count / data.totalBreaches) * 100).toFixed(1) 
      }));
    
    return {
      totalBreaches: data.totalBreaches,
      lastUpdated: data.lastUpdated,
      categories: sortedCategories
    };
  } catch(e) {
    console.error('Erreur chargement stats:', e);
    return { categories: [], totalBreaches: 0 };
  }
});
