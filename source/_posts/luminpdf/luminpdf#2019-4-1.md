---
title: "Lumin PDF - Fuite de données"
date: 2019-09-18T05:00:15Z
category: "breaches"
tags: ["auth tokens", "email addresses", "genders", "names", "passwords", "spoken languages", "usernames"]
---

# Lumin PDF - Fuite de données

**Date de la fuite** : 2019-04-01  
**Nombre de comptes affectés** : 15 453 048

## Description
In April 2019, the PDF management service Lumin PDF suffered a data breach. The breach wasn't publicly disclosed until September when 15.5M records of user data appeared for download on a popular hacking forum. The data had been left publicly exposed in a MongoDB instance after which Lumin PDF was allegedly been "contacted multiple times, but ignored all the queries". The exposed data included names, email addresses, genders, spoken language and either a bcrypt password hash or Google auth token.

## Données exposées
- Auth tokens
- Email addresses
- Genders
- Names
- Passwords
- Spoken languages
- Usernames

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/LuminPDF)
- [luminpdf.com](https://luminpdf.com)