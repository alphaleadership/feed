---
title: "Glossaire des Risques - Types de Données"
layout: "page"
comments: false
---

# Glossaire des Niveaux de Risque par Type de Données

Ce glossaire classe les différents types de données selon leur niveau de risque en cas de fuite. Comprendre ces risques vous aide à mieux protéger vos informations personnelles.

---

## 🔴 RISQUE CRITIQUE

### Mots de passe (en clair)
**Niveau de risque : 10/10**
- **Impact** : Accès direct à vos comptes
- **Conséquences** : Vol d'identité, accès à d'autres services si réutilisation
- **Action** : Changez immédiatement tous vos mots de passe

### Numéros de carte bancaire complets (avec CVV)
**Niveau de risque : 10/10**
- **Impact** : Fraude financière immédiate
- **Conséquences** : Achats frauduleux, vol d'argent
- **Action** : Bloquez votre carte et contactez votre banque

### Numéros de sécurité sociale / NIR
**Niveau de risque : 10/10**
- **Impact** : Usurpation d'identité complète
- **Conséquences** : Fraude fiscale, ouverture de comptes à votre nom
- **Action** : Signalez aux autorités, surveillez votre crédit

### Données médicales / Dossiers de santé
**Niveau de risque : 10/10**
- **Impact** : Violation de la vie privée, chantage
- **Conséquences** : Discrimination, extorsion, préjudice moral
- **Action** : Contactez l'établissement de santé et la CNIL

### Documents d'identité (scans, photos)
**Niveau de risque : 9/10**
- **Impact** : Usurpation d'identité
- **Conséquences** : Fraude, ouverture de comptes, contrats frauduleux
- **Action** : Déposez plainte, surveillez vos comptes

---

## 🟠 RISQUE ÉLEVÉ

### Mots de passe hachés (bcrypt, SHA-256)
**Niveau de risque : 7/10**
- **Impact** : Risque si mot de passe faible
- **Conséquences** : Possible déchiffrement par force brute
- **Action** : Changez vos mots de passe par précaution

### Adresses postales complètes
**Niveau de risque : 7/10**
- **Impact** : Ciblage physique, harcèlement
- **Conséquences** : Cambriolage, spam postal, usurpation
- **Action** : Renforcez la sécurité de votre domicile

### Numéros de téléphone
**Niveau de risque : 7/10**
- **Impact** : Harcèlement, phishing par SMS
- **Conséquences** : Arnaque, SIM swapping, spam
- **Action** : Méfiez-vous des appels/SMS suspects

### IBAN / RIB
**Niveau de risque : 7/10**
- **Impact** : Prélèvements frauduleux possibles
- **Conséquences** : Tentatives de fraude, usurpation
- **Action** : Surveillez vos relevés bancaires

### Données biométriques
**Niveau de risque : 8/10**
- **Impact** : Impossible à changer (empreintes, iris)
- **Conséquences** : Usurpation permanente, accès non autorisé
- **Action** : Signalez immédiatement, changez vos méthodes d'authentification

### Informations sur les enfants
**Niveau de risque : 9/10**
- **Impact** : Exploitation, danger pour mineurs
- **Conséquences** : Prédation, usurpation d'identité future
- **Action** : Signalez aux autorités (police, CNIL)

---

## 🟡 RISQUE MODÉRÉ

### Adresses email
**Niveau de risque : 6/10**
- **Impact** : Spam, phishing ciblé
- **Conséquences** : Tentatives d'arnaque, usurpation
- **Action** : Activez l'authentification à deux facteurs

### Noms et prénoms
**Niveau de risque : 5/10**
- **Impact** : Ingénierie sociale
- **Conséquences** : Phishing personnalisé, spam
- **Action** : Soyez vigilant face aux sollicitations

### Dates de naissance
**Niveau de risque : 6/10**
- **Impact** : Aide à l'usurpation d'identité
- **Conséquences** : Réponses aux questions de sécurité
- **Action** : Ne l'utilisez pas comme question de sécurité

### Adresses IP
**Niveau de risque : 5/10**
- **Impact** : Géolocalisation approximative
- **Conséquences** : Ciblage publicitaire, attaques DDoS
- **Action** : Utilisez un VPN si nécessaire

### Historique d'achats
**Niveau de risque : 6/10**
- **Impact** : Profilage commercial
- **Conséquences** : Publicité ciblée, discrimination tarifaire
- **Action** : Limitez le partage de vos données d'achat

### Pseudonymes / Noms d'utilisateur
**Niveau de risque : 5/10**
- **Impact** : Traçabilité entre services
- **Conséquences** : Profilage, corrélation d'identités
- **Action** : Utilisez des pseudos différents par service

---

## 🟢 RISQUE FAIBLE

### Genre
**Niveau de risque : 2/10**
- **Impact** : Profilage démographique
- **Conséquences** : Publicité ciblée
- **Action** : Aucune action urgente

### Pays / Ville de résidence
**Niveau de risque : 3/10**
- **Impact** : Géolocalisation large
- **Conséquences** : Ciblage publicitaire régional
- **Action** : Aucune action urgente

### Préférences / Centres d'intérêt
**Niveau de risque : 3/10**
- **Impact** : Profilage comportemental
- **Conséquences** : Publicité personnalisée
- **Action** : Aucune action urgente

### Adresse email professionnelle publique
**Niveau de risque : 2/10**
- **Impact** : Spam professionnel
- **Conséquences** : Sollicitations commerciales
- **Action** : Utilisez des filtres anti-spam

---

## 🔵 DONNÉES SENSIBLES SPÉCIFIQUES

### Orientation sexuelle / Vie intime
**Niveau de risque : 9/10**
- **Impact** : Discrimination, chantage
- **Conséquences** : Préjudice moral grave, extorsion
- **Action** : Contactez les autorités et associations de soutien

### Opinions politiques / religieuses
**Niveau de risque : 8/10**
- **Impact** : Discrimination, ciblage
- **Conséquences** : Harcèlement, répercussions professionnelles
- **Action** : Signalez si utilisé à des fins malveillantes

### Données de géolocalisation en temps réel
**Niveau de risque : 8/10**
- **Impact** : Traçage physique, harcèlement
- **Conséquences** : Danger physique, cambriolage
- **Action** : Désactivez la géolocalisation, vérifiez vos paramètres

### Messages privés / Conversations
**Niveau de risque : 8/10**
- **Impact** : Violation de la vie privée
- **Conséquences** : Chantage, préjudice relationnel
- **Action** : Changez vos mots de passe, activez le chiffrement

### Photos / Vidéos personnelles
**Niveau de risque : 7/10**
- **Impact** : Atteinte à l'image, chantage
- **Conséquences** : Diffusion non consentie, extorsion
- **Action** : Demandez le retrait, signalez aux plateformes

---

## 📋 Actions Générales en Cas de Fuite

### Immédiatement
1. **Changez vos mots de passe** sur tous les services concernés
2. **Activez l'authentification à deux facteurs** (2FA)
3. **Surveillez vos comptes** bancaires et emails

### Dans les 48 heures
1. **Vérifiez votre présence** sur [Have I Been Pwned](https://haveibeenpwned.com/)
2. **Contactez les services concernés** pour signaler la fuite
3. **Déposez plainte** si nécessaire (commissariat, gendarmerie)

### Sur le long terme
1. **Surveillez votre identité numérique** régulièrement
2. **Utilisez un gestionnaire de mots de passe** unique et fort
3. **Limitez le partage** de vos données personnelles
4. **Activez les alertes** de sécurité sur vos comptes

---

## 🛡️ Ressources Utiles

- **CNIL** : [www.cnil.fr](https://www.cnil.fr) - Signalement et conseils
- **Cybermalveillance** : [www.cybermalveillance.gouv.fr](https://www.cybermalveillance.gouv.fr) - Assistance
- **Have I Been Pwned** : [haveibeenpwned.com](https://haveibeenpwned.com) - Vérification
- **Signal Spam** : [www.signal-spam.fr](https://www.signal-spam.fr) - Signalement spam

---

*Dernière mise à jour : Mars 2026*
