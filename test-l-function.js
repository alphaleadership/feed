// Fichier de test pour la fonction l()
// Copie de la fonction pour tests isolés

const l = (title, cat = []) => {
  // Liste des catégories valides qui doivent aller dans _posts
  const validCategories = [
    "fuite de données",
    "Données personnelles",
    "Cybersécurité",
    "Sécurité"
  ];
  
  // Vérifier si au moins une catégorie valide est présente
  const hasValidCategory = cat.some(c => validCategories.includes(c));
  
  if (hasValidCategory) {
    console.log('✅ Catégorie valide trouvée:', cat.find(c => validCategories.includes(c)));
    return "_posts";
  }
  
  // Liste des URLs à ignorer (rediriger vers temp)
  const ignoredUrls = [
    "https://www.zataz.com/",
    "https://www.intelligenceonline.fr",
    "https://www.cloudflarestatus.com/"
  ];
  
  // Vérifier si le titre contient une URL à ignorer
  for (const url of ignoredUrls) {
    if (title.includes(url)) {
      console.log('⏭️ URL ignorée:', url);
      return "../temp";
    }
  }
  
  // Par défaut, retourner _posts
  console.log('📝 Aucune règle spécifique, utilisation par défaut');
  return "_posts";
};

// === TESTS ===
console.log('\n=== Tests de la fonction l() ===\n');

// Test 1: Avec catégorie "fuite de données"
console.log('Test 1: Catégorie "fuite de données"');
console.log('Résultat:', l('https://example.com/article', ['fuite de données']));
console.log('Attendu: _posts\n');

// Test 2: URL Zataz sans catégorie
console.log('Test 2: URL Zataz sans catégorie');
console.log('Résultat:', l('https://www.zataz.com/article', []));
console.log('Attendu: ../temp\n');

// Test 3: URL Intelligence Online
console.log('Test 3: URL Intelligence Online');
console.log('Résultat:', l('https://www.intelligenceonline.fr/article', []));
console.log('Attendu: ../temp\n');

// Test 4: URL Cloudflare Status
console.log('Test 4: URL Cloudflare Status');
console.log('Résultat:', l('https://www.cloudflarestatus.com/incident', []));
console.log('Attendu: ../temp\n');

// Test 5: URL normale sans catégorie spéciale
console.log('Test 5: URL normale sans catégorie');
console.log('Résultat:', l('https://example.com/article', []));
console.log('Attendu: _posts\n');

// Test 6: URL Zataz AVEC catégorie "fuite de données" (priorité à la catégorie)
console.log('Test 6: URL Zataz avec catégorie "fuite de données"');
console.log('Résultat:', l('https://www.zataz.com/article', ['fuite de données']));
console.log('Attendu: _posts\n');

// Test 7: Catégories multiples incluant "fuite de données"
console.log('Test 7: Catégories multiples avec "fuite de données"');
console.log('Résultat:', l('https://example.com/article', ['Données personnelles', 'fuite de données', 'Sécurité']));
console.log('Attendu: _posts\n');

// Test 8: Catégories multiples sans "fuite de données" mais avec "Données personnelles"
console.log('Test 8: Catégories multiples avec "Données personnelles"');
console.log('Résultat:', l('https://example.com/article', ['Données personnelles', 'Sécurité']));
console.log('Attendu: _posts\n');

// Test 9: Catégorie "Cybersécurité" seule
console.log('Test 9: Catégorie "Cybersécurité"');
console.log('Résultat:', l('https://example.com/article', ['Cybersécurité']));
console.log('Attendu: _posts\n');

// Test 10: Catégories invalides uniquement
console.log('Test 10: Catégories invalides uniquement');
console.log('Résultat:', l('https://example.com/article', ['Politique', 'Économie']));
console.log('Attendu: _posts\n');

// Test 11: URL Zataz avec catégorie invalide
console.log('Test 11: URL Zataz avec catégorie invalide');
console.log('Résultat:', l('https://www.zataz.com/article', ['Politique']));
console.log('Attendu: ../temp\n');

// Test 12: Mélange de catégories valides et invalides
console.log('Test 12: Mélange catégories valides et invalides');
console.log('Résultat:', l('https://example.com/article', ['Politique', 'Sécurité', 'Sport']));
console.log('Attendu: _posts\n');

console.log('=== Fin des tests ===\n');
