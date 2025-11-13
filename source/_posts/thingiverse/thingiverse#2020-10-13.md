---
title: "Thingiverse - Fuite de données"
date: 2021-10-14T10:02:04Z
category: "breaches"
tags: ["dates of birth", "email addresses", "ip addresses", "names", "passwords", "physical addresses", "usernames"]
---

# Thingiverse - Fuite de données

**Date de la fuite** : 2020-10-13  
**Nombre de comptes affectés** : 228 102

## Description
In October 2021, a database backup taken from the 3D model sharing service Thingiverse began extensively circulating within the hacking community. Dating back to October 2020, the 36GB file contained 228 thousand unique email addresses, mostly alongside comments left on 3D models. The data also included usernames, IP addresses, full names and passwords stored as either unsalted SHA-1 or bcrypt hashes. In some cases, physical addresses was also exposed. Thingiverse's owner, MakerBot, is aware of the incident but at the time of writing, is yet to issue a disclosure statement. The data was provided to HIBP by dehashed.com.

## Données exposées
- Dates of birth
- Email addresses
- IP addresses
- Names
- Passwords
- Physical addresses
- Usernames

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/Thingiverse)
- [thingiverse.com](https://thingiverse.com)