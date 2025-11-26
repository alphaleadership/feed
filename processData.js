const fs = require('fs');
const path = require('path');

// Configuration
const dataFilePath = './temp/data.json';
const allBreachesFile = './source/data/breaches.json';
const basePostDir = './source/_posts';

// Créer les répertoires nécessaires
[path.dirname(allBreachesFile), basePostDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Fonction pour lire les données des fichiers Markdown existants
const readExistingMarkdownFiles = async () => {
  if (!fs.existsSync(basePostDir)) {
    return [];
  }

  const files = fs.readdirSync(basePostDir);
  const markdownFiles = files.filter(file => file.endsWith('.md'));
  const existingBreaches = [];

  for (const file of markdownFiles) {
    try {
      const filePath = path.join(basePostDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Extraire le front matter
      const frontMatterMatch = content.match(/^---\s*([\s\S]*?)\s*---/);
      if (frontMatterMatch) {
        const frontMatter = frontMatterMatch[1];
        // Extraire les données de la fuite
        const breachDataMatch = frontMatter.match(/breach_data:\s*({[\s\S]*?})(?=\s*[\r\n]|$)/);
        
        if (breachDataMatch) {
          try {
            const breachData = JSON.parse(breachDataMatch[1].replace(/\\"/g, '"'));
            existingBreaches.push(breachData);
          } catch (e) {
            console.error(`❌ Erreur lors de l'analyse des données de ${file}:`, e.message);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Erreur lors de la lecture du fichier ${file}:`, error.message);
    }
  }

  console.log(`✅ ${existingBreaches.length} fuites chargées depuis les fichiers Markdown existants`);
  return existingBreaches;
};

// Fonction pour créer un slug à partir d'un nom
const createSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/--+/g, '-') // Remplacer les tirets multiples par un seul
    .trim();
};

// Fonction pour échapper les caractères spéciaux
const escapeMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\\/g, '\\\\')
    .replace(/\|/g, '\\|')
    .replace(/\[|\]/g, '\\$&')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/<[^>]*>?/gm, '');
};

// Lire et traiter les données
const processData = async () => {
  try {
    // Lire les données existantes des fichiers Markdown
    const existingBreaches = await readExistingMarkdownFiles();
    
    // Si aucun fichier data.json n'existe, on utilise uniquement les données existantes
    if (!fs.existsSync(dataFilePath)) {
      console.log('Aucun nouveau fichier data.json trouvé. Utilisation des données existantes uniquement.');
      
      // Trier les fuites par date (les plus récentes en premier)
      const sortedBreaches = [...existingBreaches].sort((a, b) => {
        const dateA = a.BreachDate ? new Date(a.BreachDate) : new Date(0);
        const dateB = b.BreachDate ? new Date(b.BreachDate) : new Date(0);
        return dateB - dateA;
      });
      
      // Mettre à jour le fichier breaches.json
      fs.writeFileSync(allBreachesFile, JSON.stringify({
        lastUpdated: new Date().toISOString(),
        totalBreaches: sortedBreaches.length,
        breaches: sortedBreaches
      }, null, 2));
      
      console.log(`✅ Fichier JSON des fuites mis à jour avec ${sortedBreaches.length} entrées`);
      return;
    }
    
    // Lire les nouvelles données
    const data = fs.readFileSync(dataFilePath, 'utf8');
    const newBreaches = JSON.parse(data);
    
    // Fusionner avec les données existantes (en évitant les doublons par nom)
    const existingNames = new Set(existingBreaches.map(b => b.Name));
    const uniqueNewBreaches = newBreaches.filter(b => !existingNames.has(b.Name));
    
    console.log(`✅ ${uniqueNewBreaches.length} nouvelles fuites à traiter sur ${newBreaches.length} au total`);
    
    // Combiner les données existantes avec les nouvelles
    const allBreaches = [...existingBreaches, ...uniqueNewBreaches];
    
    // Trier les fuites par date (les plus récentes en premier)
    const sortedBreaches = allBreaches.sort((a, b) => {
      const dateA = a.BreachDate ? new Date(a.BreachDate) : new Date(0);
      const dateB = b.BreachDate ? new Date(b.BreachDate) : new Date(0);
      return dateB - dateA;
    });
    // Formater les données pour le JSON
    const formattedBreaches = sortedBreaches.map(breach => ({
      ...breach,
      slug: createSlug(breach.Name || 'sans-nom'),
      path: `breaches/${createSlug(breach.Name || 'sans-nom')}`,
      formattedDate: breach.BreachDate ? new Date(breach.BreachDate).toISOString().split('T')[0] : '1970-01-01'
    }));
    
    // Prendre les 10 fuites les plus récentes pour les fichiers Markdown
    const recentBreaches = formattedBreaches.slice(0, 10);
    
    console.log(`\n=== Traitement de ${recentBreaches.length} fuites récentes pour les fichiers Markdown ===`);
    console.log(`=== ${formattedBreaches.length - 10} fuites seront stockées uniquement dans le fichier JSON ===`);
    
    // Créer le répertoire de destination s'il n'existe pas
    if (!fs.existsSync(basePostDir)) {
      fs.mkdirSync(basePostDir, { recursive: true });
    }
    
    // Sauvegarder toutes les fuites dans un fichier JSON
    fs.writeFileSync(allBreachesFile, JSON.stringify({
      lastUpdated: new Date().toISOString(),
      totalBreaches: formattedBreaches.length,
      breaches: formattedBreaches
    }, null, 2));
    
    console.log(`✅ Fichier JSON des fuites sauvegardé : ${allBreachesFile}`);
    
    // Traiter les 10 fuites les plus récentes pour les fichiers Markdown
    const processPromises = recentBreaches.map(breach => {
      return new Promise((resolve, reject) => {
        // Préparer les données pour le fichier Markdown
        const safeName = createSlug(breach.Name || 'sans-nom');
        const breachDate = breach.BreachDate ? new Date(breach.BreachDate) : new Date();
        const dateStr = breach.formattedDate || breachDate.toISOString().split('T')[0];
        
        // Créer le nom du fichier avec la date et le slug
        const postFileName = `${safeName}/${safeName}#${dateStr}.md`;
        const outputFile = path.join(basePostDir, postFileName);
        
        // Préparer les données pour le front matter
        const frontMatter = {
          title: `${breach.Title || breach.Name || 'Fuite de données inconnue'}`,
          date: breach.AddedDate || breachDate.toISOString(),
          layout: 'post',
          category: 'breaches',
          tags: (breach.DataClasses || []).map(c => c.toLowerCase())
        };
        
        // Convertir le front matter en YAML
        let postContent = '---\n';
        postContent += `title: "${escapeMarkdown(frontMatter.title)}"\n`;
        postContent += `date: ${frontMatter.date}\n`;
      
        postContent += `category: "${frontMatter.category}"\n`;
        postContent += `tags: [${frontMatter.tags.map(t => `"${t}"`).join(', ')}]\n`;
        postContent += '---\n\n';
        
        // Ajouter le contenu du post
        postContent += `# ${escapeMarkdown(frontMatter.title)}\n\n`;
        
        // Section métadonnées
        postContent += '<div class="breach-meta">\n';
        
        // Date de la fuite
        postContent += '  <div class="meta-item">\n';
        postContent += '    <span class="meta-label">Date de la fuite :</span>\n';
        postContent += `    <span class="meta-value">${breachDate.toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) || 'Date inconnue'}</span>\n`;
        postContent += '  </div>\n';
        
        // Nombre de comptes affectés
        if (breach.PwnCount) {
          postContent += '  <div class="meta-item">\n';
          postContent += '    <span class="meta-label">Comptes affectés :</span>\n';
          postContent += `    <span class="meta-value">${breach.PwnCount.toLocaleString()}</span>\n`;
          postContent += '  </div>\n';
        }
        
        // Site web
        if (breach.Domain) {
          const domain = breach.Domain.startsWith('http') ? breach.Domain : `https://${breach.Domain}`;
          postContent += '  <div class="meta-item">\n';
          postContent += '    <span class="meta-label">Site web :</span>\n';
          postContent += `    <a href="${domain}" target="_blank" rel="noopener">${breach.Domain}</a>\n`;
          postContent += '  </div>\n';
        }
        
        postContent += '</div>\n\n';
        
        // Description
        postContent += '## Description\n';
        postContent += `${escapeMarkdown(breach.Description || 'Aucune description disponible.')}\n\n`;
        
        // Données exposées
        postContent += '## Données exposées\n';
        if (breach.DataClasses && breach.DataClasses.length > 0) {
          postContent += '\n<div class="data-classes">\n';
          postContent += breach.DataClasses.map(item => `  <span class="data-class">${item}</span>`).join('\n');
          postContent += '\n</div>\n';
        } else {
          postContent += '\n- Non spécifié\n';
        }
        
        // Actions recommandées
        postContent += '\n## Actions recommandées\n';
        postContent += '1. Changez votre mot de passe sur ce site et sur tout autre site où vous utilisez le même mot de passe\n';
        postContent += '2. Activez l\'authentification à deux facteurs si disponible\n';
        postContent += '3. Surveillez vos comptes pour toute activité suspecte\n\n';
        
        // Plus d'informations
        postContent += '## Plus d\'informations\n';
        if (breach.Name) {
          postContent += `- [Vérifier si vous êtes concerné sur Have I Been Pwned](https://haveibeenpwned.com/breach/${breach.Name})\n`;
        }
        if(!fs.existsSync(path.dirname(outputFile))) {
          fs.mkdirSync(path.dirname(outputFile), { recursive: true });
        }
        // Écrire le fichier
        fs.writeFile(outputFile, postContent, (err) => {
          if (err) {
            console.error(`❌ Erreur lors de l'écriture du fichier ${postFileName}:`, err);
            reject(err);
          } else {
            console.log(`✅ Fichier créé : ${postFileName}`);
            resolve();
          }
        });
      });
    });
    
    // Attendre que tous les fichiers soient écrits
    await Promise.all(processPromises);
    
    // Supprimer le fichier temporaire s'il existe
    if (fs.existsSync(dataFilePath)) {
      try {
        fs.unlinkSync(dataFilePath);
        console.log('✅ Fichier data.json temporaire supprimé.');
      } catch (err) {
        console.error('❌ Erreur lors de la suppression du fichier data.json:', err);
      }
    }
    
    console.log('✅ Traitement terminé avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors du traitement des données:', error);
    
    // En cas d'erreur, on ne modifie pas le fichier pour éviter de perdre des données
    console.error('⚠️  Le fichier data.json n\'a pas été modifié en raison d\'une erreur.');
  }
};

// Démarrer le traitement
processData().catch(error => {
  console.error('❌ Erreur fatale lors du traitement:', error);
  process.exit(1);
});
