---
title: "Soundwave - Fuite de données"
date: 2017-03-17T22:36:34Z
category: "breaches"
tags: ["dates of birth", "email addresses", "genders", "geographic locations", "names", "passwords", "social connections"]
---

# Soundwave - Fuite de données

**Date de la fuite** : 2015-07-16  
**Nombre de comptes affectés** : 130 705

## Description
In approximately mid 2015, the music tracking app Soundwave suffered a data breach. The breach stemmed from an incident whereby "production data had been used to populate the test database" and was then inadvertently  exposed in a MongoDB. The data contained 130k records and included email addresses, dates of birth, genders and MD5 hashes of passwords without a salt.

## Données exposées
- Dates of birth
- Email addresses
- Genders
- Geographic locations
- Names
- Passwords
- Social connections

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/Soundwave)
- [soundwave.com](https://soundwave.com)