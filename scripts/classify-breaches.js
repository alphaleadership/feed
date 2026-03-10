'use strict';

const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const dataFile = path.join(baseDir, 'source', '_data', 'breaches.json');

// Données considérées comme graves/critiques
const criticalDataTypes = [
  'mots de passe',
  'passwords',
  'mot de passe',
  'password',
  'carte bancaire',
  'credit card',
  'numéro de carte',
  'card number',
  'cvv',
  'sécurité sociale',
  'social security',
  'numéro de sécurité sociale',
  'nir',
  'données médicales',
  'medical records',
  'dossier médical',
  'health records',
  'données de santé',
  'health data',
  'document d\'identité',
  'identity document',
  'passeport',
  'passport',
  'carte d\'identité',
  'id card',
  'permis de conduire',
  'driver license',
  'iban',
  'bic',
  'compte bancaire',
  'bank account',
  'données biométriques',
  'biometric data',
  'empreinte',
  'fingerprint',
  'reconnaissance faciale',
  'facial recognition','Certificats d\'autorité'
];

// Mapping pour normaliser les noms de données
const dataClassMapping = {
  // Emails
  'email': 'Adresses email',
  'e-mail': 'Adresses email',
  'courriel': 'Adresses email',
  'mail': 'Adresses email',
  'adresse email': 'Adresses email',
  'email address': 'Adresses email',
  
  // Mots de passe
  'mot de passe': 'Mots de passe',
  'password': 'Mots de passe',
  'mdp': 'Mots de passe',
  'pwd': 'Mots de passe',
  
  // Noms
  'nom': 'Noms',
  'name': 'Noms',
  'surname': 'Noms',
  'nom de famille': 'Noms',
  'last name': 'Noms',
  'family name': 'Noms',
  
  // Prénoms
  'prénom': 'Prénoms',
  'prenom': 'Prénoms',
  'first name': 'Prénoms',
  'given name': 'Prénoms',
  'forename': 'Prénoms',
  
  // Téléphones
  'téléphone': 'Numéros de téléphone',
  'telephone': 'Numéros de téléphone',
  'phone': 'Numéros de téléphone',
  'mobile': 'Numéros de téléphone',
  'cell': 'Numéros de téléphone',
  'numéro de téléphone': 'Numéros de téléphone',
  'phone number': 'Numéros de téléphone',
  
  // Adresses
  'adresse': 'Adresses postales',
  'address': 'Adresses postales',
  'adresse postale': 'Adresses postales',
  'postal address': 'Adresses postales',
  'street address': 'Adresses postales',
  
  // Dates de naissance
  'date de naissance': 'Dates de naissance',
  'birth date': 'Dates de naissance',
  'date of birth': 'Dates de naissance',
  'dob': 'Dates de naissance',
  'birthday': 'Dates de naissance',
  'anniversaire': 'Dates de naissance',
  
  // IP
  'ip': 'Adresses IP',
  'adresse ip': 'Adresses IP',
  'ip address': 'Adresses IP',
  
  // Géolocalisation
  'géolocalisation': 'Données de géolocalisation',
  'geolocation': 'Données de géolocalisation',
  'location': 'Données de géolocalisation',
  'gps': 'Données de géolocalisation',
  'coordinates': 'Données de géolocalisation',
  'coordonnées': 'Données de géolocalisation',
  
  // Genre
  'genre': 'Genre',
  'gender': 'Genre',
  'sexe': 'Genre',
  'sex': 'Genre',
  
  // Âge
  'âge': 'Âges',
  'age': 'Âges',
  
  // Nationalité
  'nationalité': 'Nationalités',
  'nationality': 'Nationalités',
  'pays': 'Pays',
  'country': 'Pays',
  
  // Profession
  'profession': 'Professions',
  'occupation': 'Professions',
  'job': 'Professions',
  'métier': 'Professions',
  
  // Données bancaires
  'carte bancaire': 'Numéros de carte bancaire',
  'credit card': 'Numéros de carte bancaire',
  'card number': 'Numéros de carte bancaire',
  'iban': 'IBAN',
  'bic': 'BIC',
  'compte bancaire': 'Comptes bancaires',
  'bank account': 'Comptes bancaires',
  
  // Données sensibles
  'sécurité sociale': 'Numéros de sécurité sociale',
  'social security': 'Numéros de sécurité sociale',
  'nir': 'NIR',
  'données médicales': 'Données médicales',
  'medical': 'Données médicales',
  'health': 'Données de santé',
  'santé': 'Données de santé'
};

// Fonction pour vérifier si une fuite contient des données critiques
function isCriticalBreach(dataClasses) {
  if (!dataClasses || !Array.isArray(dataClasses)) {
    return false;
  }
  
  return dataClasses.some(dataClass => {
    const lowerDataClass = dataClass.toLowerCase();
    return criticalDataTypes.some(criticalType => 
      lowerDataClass.includes(criticalType.toLowerCase())
    );
  });
}

// Fonction pour normaliser les DataClasses
function normalizeDataClasses(dataClasses) {
  if (!dataClasses || !Array.isArray(dataClasses)) {
    return [];
  }
  
  const normalized = new Set();
  
  dataClasses.forEach(dataClass => {
    const trimmed = dataClass.trim();
    
    // Séparer par virgules, points-virgules, et autres séparateurs
    const parts = trimmed.split(/[,;\/\|]+/).map(p => p.trim()).filter(p => p.length > 0);
    
    parts.forEach(part => {
      const lower = part.toLowerCase();
      let foundMatch = false;
      
      // Chercher toutes les correspondances possibles avec includes
      Object.entries(dataClassMapping).forEach(([key, value]) => {
        if (lower.includes(key.toLowerCase())) {
          normalized.add(value);
          foundMatch = true;
        }
      });
      
      // Si aucune correspondance trouvée, essayer d'extraire du contenu entre parenthèses
      if (!foundMatch) {
        const matches = part.match(/\(([^)]+)\)/g);
        if (matches) {
          matches.forEach(match => {
            const extracted = match.replace(/[()]/g, '').trim();
            
            // Séparer aussi le contenu extrait
            const extractedParts = extracted.split(/[,;\/\|]+/).map(p => p.trim()).filter(p => p.length > 0);
            
            extractedParts.forEach(extractedPart => {
              const extractedLower = extractedPart.toLowerCase();
              let extractedMatch = false;
              
              // Vérifier si l'extrait correspond à un mapping
              Object.entries(dataClassMapping).forEach(([key, value]) => {
                if (extractedLower.includes(key.toLowerCase())) {
                  normalized.add(value);
                  extractedMatch = true;
                }
              });
              
              if (!extractedMatch && extractedPart.length > 0) {
                // Capitaliser la première lettre
                normalized.add(extractedPart.charAt(0).toUpperCase() + extractedPart.slice(1));
              }
            });
          });
        } else if (part.length > 0) {
          // Garder tel quel mais capitaliser
          normalized.add(part.charAt(0).toUpperCase() + part.slice(1));
        }
      }
    });
  });
  
  return Array.from(normalized).sort();
}

// Fonction principale
async function classifyBreaches() {
  console.log('Chargement des données...');
  const db = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
  
  let criticalCount = 0;
  let normalizedCount = 0;
  
  console.log(`Traitement de ${db.breaches.length} fuites...`);
  
  db.breaches.forEach((breach, index) => {
    if (!breach || breach.IsRetired) {
      return;
    }
    
    // Normaliser les DataClasses
    if (breach.DataClasses && Array.isArray(breach.DataClasses)) {
      const originalLength = breach.DataClasses.length;
      breach.DataClasses = normalizeDataClasses(breach.DataClasses);
      
      if (breach.DataClasses.length !== originalLength) {
        normalizedCount++;
      }
    }
    
    // Vérifier si la fuite est critique
    const wasCritical = breach.IsCritical || false;
    breach.IsCritical = isCriticalBreach(breach.DataClasses);
    
    if (breach.IsCritical && !wasCritical) {
      criticalCount++;
      console.log(`  ⚠️  Fuite critique détectée: ${breach.Name || breach.Title}`);
    }
    
    // Ajouter un niveau de gravité
    if (breach.IsCritical) {
      breach.SeverityLevel = 'CRITIQUE';
    } else if (breach.IsSensitive) {
      breach.SeverityLevel = 'ÉLEVÉ';
    } else if (breach.PwnCount && breach.PwnCount > 1000000) {
      breach.SeverityLevel = 'MODÉRÉ';
    } else {
      breach.SeverityLevel = 'FAIBLE';
    }
  });
  
  // Mettre à jour la date
  db.lastUpdated = new Date().toISOString();
  
  // Sauvegarder
  console.log('\nSauvegarde des modifications...');
  fs.writeFileSync(dataFile, JSON.stringify(db, null, 2));
  fs.writeFileSync(path.join(baseDir, 'source', 'data', 'breaches.json'), JSON.stringify(db, null, 2));
  
  console.log('\n✅ Traitement terminé !');
  console.log(`   - ${criticalCount} nouvelles fuites critiques détectées`);
  console.log(`   - ${normalizedCount} fuites avec DataClasses normalisées`);
  console.log(`   - Total de fuites critiques: ${db.breaches.filter(b => b.IsCritical).length}`);
}

// Exécuter
classifyBreaches().catch(err => {
  console.error('❌ Erreur:', err);
  process.exit(1);
});
