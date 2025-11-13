---
title: "Tangerine - Fuite de données"
date: 2024-02-28T01:42:43Z
category: "breaches"
tags: ["dates of birth", "email addresses", "names", "passwords", "phone numbers", "physical addresses", "salutations"]
---

# Tangerine - Fuite de données

**Date de la fuite** : 2024-02-18  
**Nombre de comptes affectés** : 243 462

## Description
In February 2024, the Australian Telco Tangerine suffered a data breach that exposed over 200k customer records. Attributed to a legacy customer database, the data included physical and email addresses, names, phone numbers and dates of birth. Whilst the Tangerine login process involves sending a one-time password after entering an email address and phone number, it previously used a traditional password which was also exposed as a bcrypt hash.

## Données exposées
- Dates of birth
- Email addresses
- Names
- Passwords
- Phone numbers
- Physical addresses
- Salutations

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/Tangerine)
- [tangerinetelecom.com.au](https://tangerinetelecom.com.au)