const path = require('path');
const { getBreachesDB } = require('./db');

// Enregistrer le helper Hexo
hexo.extend.helper.register('getCategoryStats', async function() {
  try {
    const db = await getBreachesDB();
    const data = db.data;
    
    const categoryCount = {};
    const breaches = data.breaches || [];
    
    // Compter les occurrences de chaque DataClass
    breaches.forEach(breach => {
      if (breach.DataClasses && Array.isArray(breach.DataClasses)) {
        breach.DataClasses.forEach(category => {
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        });
      }
    });
    
    const totalBreaches = data.totalBreaches || breaches.length;
    
    // Trier par nombre d'occurrences (décroissant)
    const sortedCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, count]) => ({ 
        name, 
        count, 
        percentage: ((count / totalBreaches) * 100).toFixed(1) 
      }));
    
    return {
      totalBreaches: totalBreaches,
      lastUpdated: data.lastUpdated,
      categories: sortedCategories
    };
  } catch(e) {
    console.error('Erreur chargement stats:', e);
    return { categories: [], totalBreaches: 0 };
  }
});
