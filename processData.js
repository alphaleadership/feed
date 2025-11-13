const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// Configuration
const dataFilePath = './temp/data.json';
const basePostDir = './source/_posts';

// Fonction pour échapper les caractères spéciaux
const escapeMarkdown = (text) => {
  if (!text) return '';
  return text
    .replace(/\|/g, '\\|')
    .replace(/\[|\]/g, '\\$&')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/<[^>]*>?/gm, '');
};

// Créer le répertoire de base des posts si nécessaire
if (!fs.existsSync(basePostDir)) {
  fs.mkdirSync(basePostDir, { recursive: true });
}

// Lire et traiter les données
fs.readFile(dataFilePath, 'utf8', (err, data) => {
  if (err) {
    console.error('Erreur lors de la lecture du fichier:', err);
    return;
  }

  try {
    const breaches = JSON.parse(data);
    const postsByDate = {};
    
    // Première passe : compter les fuites par date
    const batchSize = 10;
    const batch = breaches.slice(0, batchSize); // Prendre uniquement les 10 premières entrées
    console.log(`\n=== Traitement d'un seul lot de ${batch.length} entrées ===`);
    
    batch.forEach(breach => {
      const breachDate = new Date(breach.BreachDate);
      const dateKey = `${breachDate.getFullYear()}-${breachDate.getMonth() + 1}-${breachDate.getDate()}`;
      
      if (!postsByDate[dateKey]) {
        postsByDate[dateKey] = [];
      }
      postsByDate[dateKey].push(breach);
    });
    
    // Deuxième passe : créer les fichiers avec le bon nom
    Object.entries(postsByDate).forEach(([dateKey, breachesForDate]) => {
      breachesForDate.forEach((breach, index) => {
        const safeName = breach.Name.toLowerCase()
          .replace(/[^a-z0-9]+/g, '').replace('\\',''); // Supprimer les caractères spéciaux
          
        // Formater la date (sans padding pour les mois/jours à un chiffre)
        const [year, month, day] = dateKey.split('-');
        const dateStr = `${year}-${parseInt(month)}-${parseInt(day)}`;
        
        // Créer le répertoire de l'entreprise si nécessaire
        const companyDir = path.join(basePostDir, safeName);
        if (!fs.existsSync(companyDir)) {
          fs.mkdirSync(companyDir, { recursive: true });
        }
        
        // Nom du fichier selon le format YYYY-M-D#N.md
        const postFileName = breachesForDate.length === 1 
          ? `${safeName}#${dateStr}.md` 
          : `${safeName}#${dateStr}#${index + 1}.md`;
          
        const outputFile = path.join(companyDir, postFileName);
        
        // Créer le contenu du post
        const postContent = `---
title: "${escapeMarkdown(breach.Title)} - Fuite de données"
date: ${breach.AddedDate || new Date(breach.BreachDate).toISOString()}
category: "breaches"
tags: [${breach.DataClasses ? breach.DataClasses.map(c => `"${c.toLowerCase()}"`).join(', ') : ''}]
---

# ${escapeMarkdown(breach.Title)} - Fuite de données

**Date de la fuite** : ${breach.BreachDate || 'Date inconnue'}  
**Nombre de comptes affectés** : ${breach.PwnCount ? breach.PwnCount.toLocaleString() : 'Inconnu'}

## Description
${escapeMarkdown(breach.Description || 'Aucune description disponible.')}

## Données exposées
${breach.DataClasses ? breach.DataClasses.map(item => `- ${item}`).join('\n') : '- Non spécifié'}

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/${breach.Name})
${breach.Domain ? `- [${breach.Domain}](${breach.Domain.startsWith('http') ? '' : 'https://'}${breach.Domain})` : ''}`;

        // Écrire le fichier
        fs.writeFile(outputFile, postContent, (err) => {
          if (err) {
            console.error(`❌ Erreur lors de l'écriture du fichier ${postFileName}:`, err);
          } else {
            console.log(`✅ Fichier créé : ${postFileName}`);
          }
        });
      });
    });
    
    // Enlever les entrées traitées (les 10 premières)
    const remainingBreaches = breaches.slice(10);
    
    if (remainingBreaches.length > 0) {
      // Sauvegarder les entrées restantes dans le fichier
      fs.writeFile(dataFilePath, JSON.stringify(remainingBreaches, null, 2), (err) => {
        if (err) {
          console.error('❌ Erreur lors de la sauvegarde du fichier data.json mis à jour:', err);
        } else {
          console.log(`✅ Fichier data.json mis à jour avec succès. ${remainingBreaches.length} entrées restantes.`);
        }
      });
    } else {
      // Si plus d'entrées à traiter, supprimer le fichier
      fs.unlink(dataFilePath, (err) => {
        if (err) {
          console.error('❌ Erreur lors de la suppression du fichier data.json:', err);
        } else {
          console.log('✅ Toutes les entrées ont été traitées. Fichier data.json supprimé.');
        }
      });
    }
    
  } catch (error) {
    console.error('Erreur lors du traitement des données:', error);
    
    // En cas d'erreur, on ne modifie pas le fichier pour éviter de perdre des données
    console.error('⚠️  Le fichier data.json n\'a pas été modifié en raison d\'une erreur.');
  }
});
