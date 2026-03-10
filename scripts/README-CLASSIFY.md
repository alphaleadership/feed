# Système de Classification des Fuites

Ce système permet de :
1. **Marquer les fuites graves** : Identifie automatiquement les fuites contenant des données sensibles
2. **Normaliser les données** : Extrait et standardise les noms de types de données

## Utilisation

```bash
npm run classify
```

## Fonctionnalités

### 1. Détection des Fuites Critiques

Le système marque automatiquement une fuite comme `IsCritical: true` si elle contient l'un des types de données suivants :

**Données d'authentification :**
- Mots de passe
- Passwords

**Données financières :**
- Carte bancaire / Credit card
- Numéro de carte / Card number
- CVV
- IBAN / BIC
- Compte bancaire / Bank account

**Données d'identité :**
- Sécurité sociale / Social security
- NIR
- Document d'identité / Identity document
- Passeport / Passport
- Carte d'identité / ID card
- Permis de conduire / Driver license

**Données de santé :**
- Données médicales / Medical records
- Dossier médical / Health records
- Données de santé / Health data

**Données biométriques :**
- Données biométriques / Biometric data
- Empreinte / Fingerprint
- Reconnaissance faciale / Facial recognition

### 2. Normalisation des DataClasses

Le système normalise automatiquement les noms de types de données :

**Exemples de normalisation :**
- `(email)` → `Adresses email`
- `email` → `Adresses email`
- `emails` → `Adresses email`
- `e-mail` → `Adresses email`

- `(mot de passe)` → `Mots de passe`
- `password` → `Mots de passe`
- `mdp` → `Mots de passe`

- `(téléphone)` → `Numéros de téléphone`
- `phone` → `Numéros de téléphone`
- `mobile` → `Numéros de téléphone`

- `(nom)` → `Noms`
- `name` → `Noms`
- `surname` → `Noms`

### 3. Niveaux de Gravité

Chaque fuite se voit attribuer un niveau de gravité :

- **CRITIQUE** : Contient des données sensibles (mots de passe, données bancaires, etc.)
- **ÉLEVÉ** : Marquée comme sensible (`IsSensitive: true`)
- **MODÉRÉ** : Plus d'1 million de comptes compromis
- **FAIBLE** : Autres fuites

## Propriétés Ajoutées

Le script ajoute/modifie les propriétés suivantes dans chaque fuite :

```json
{
  "IsCritical": true,           // true si contient des données critiques
  "SeverityLevel": "CRITIQUE",  // CRITIQUE, ÉLEVÉ, MODÉRÉ, FAIBLE
  "DataClasses": [              // Normalisées et dédupliquées
    "Adresses email",
    "Mots de passe",
    "Numéros de téléphone"
  ]
}
```

## Affichage dans l'Interface

Les fuites critiques peuvent être affichées avec un badge spécial :

```ejs
<% if (breach.IsCritical) { %>
  <span class="badge bg-danger">
    <i class="fa fa-exclamation-triangle"></i> CRITIQUE
  </span>
<% } %>
```

Ou par niveau de gravité :

```ejs
<% 
var severityColors = {
  'CRITIQUE': 'danger',
  'ÉLEVÉ': 'warning',
  'MODÉRÉ': 'info',
  'FAIBLE': 'secondary'
};
%>
<span class="badge bg-<%= severityColors[breach.SeverityLevel] %>">
  <%= breach.SeverityLevel %>
</span>
```

## Intégration dans le Build

Pour exécuter automatiquement lors du build, ajoutez dans `package.json` :

```json
{
  "scripts": {
    "build": "npm run classify && hexo generate"
  }
}
```

## Logs

Le script affiche :
- Le nombre de nouvelles fuites critiques détectées
- Le nombre de fuites avec DataClasses normalisées
- Le total de fuites critiques

Exemple de sortie :
```
Chargement des données...
Traitement de 1402 fuites...
  ⚠️  Fuite critique détectée: Adobe
  ⚠️  Fuite critique détectée: LinkedIn

Sauvegarde des modifications...

✅ Traitement terminé !
   - 2 nouvelles fuites critiques détectées
   - 156 fuites avec DataClasses normalisées
   - Total de fuites critiques: 234
```

## Personnalisation

### Ajouter des Types de Données Critiques

Modifiez le tableau `criticalDataTypes` dans `classify-breaches.js` :

```javascript
const criticalDataTypes = [
  'mots de passe',
  'passwords',
  // Ajoutez vos types ici
  'numéro de compte',
  'account number'
];
```

### Ajouter des Mappings de Normalisation

Modifiez l'objet `dataClassMapping` :

```javascript
const dataClassMapping = {
  '(email)': 'Adresses email',
  'email': 'Adresses email',
  // Ajoutez vos mappings ici
  'courriel': 'Adresses email',
  'e-mail address': 'Adresses email'
};
```
