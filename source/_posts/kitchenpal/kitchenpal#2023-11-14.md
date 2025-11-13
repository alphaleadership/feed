---
title: "KitchenPal - Fuite de données"
date: 2023-11-24T20:42:36Z
category: "breaches"
tags: ["dates of birth", "email addresses", "genders", "geographic locations", "names", "passwords", "physical attributes", "social media profiles"]
---

# KitchenPal - Fuite de données

**Date de la fuite** : 2023-11-14  
**Nombre de comptes affectés** : 98 726

## Description
In November 2023, the kitchen management application KitchenPal suffered a data breach that exposed 146k lines of data. When contacted about the incident, KitchenPal advised the corpus of data came from a staging environment, although acknowledged it contained a small number of users for debugging purposes and included passwords that could not be used. Impacted data included almost 100k email addresses, names, geolocations and incomplete data on dates of birth, genders, height and weight, social media profile identifiers and bcrypt password hashes.

## Données exposées
- Dates of birth
- Email addresses
- Genders
- Geographic locations
- Names
- Passwords
- Physical attributes
- Social media profiles

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/KitchenPal)
- [kitchenpalapp.com](https://kitchenpalapp.com)