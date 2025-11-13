---
title: "Spoutible - Fuite de données"
date: 2024-02-05T07:33:00Z
category: "breaches"
tags: ["email addresses", "genders", "ip addresses", "names", "passwords", "phone numbers", "usernames"]
---

# Spoutible - Fuite de données

**Date de la fuite** : 2024-01-31  
**Nombre de comptes affectés** : 207 114

## Description
In January 2024, Spoutible had 207k records scraped from a misconfigured API that inadvertently returned excessive personal information. The data included names, usernames, email and IP addresses, phone numbers where provided to the platform, genders and bcrypt password hashes. The incident also exposed 2FA secrets and backup codes along with password reset tokens.

## Données exposées
- Email addresses
- Genders
- IP addresses
- Names
- Passwords
- Phone numbers
- Usernames

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/Spoutible)
- [spoutible.com](https://spoutible.com)