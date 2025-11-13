---
title: "Gravatar - Fuite de données"
date: 2021-12-05T22:45:58Z
category: "breaches"
tags: ["email addresses", "names", "usernames"]
---

# Gravatar - Fuite de données

**Date de la fuite** : 2020-10-03  
**Nombre de comptes affectés** : 113 990 759

## Description
In October 2020, a security researcher published a technique for scraping large volumes of data from Gravatar, the service for providing globally unique avatars . 167 million names, usernames and MD5 hashes of email addresses used to reference users' avatars were subsequently scraped and distributed within the hacking community. 114 million of the MD5 hashes were cracked and distributed alongside the source hash, thus disclosing the original email address and accompanying data. Following the impacted email addresses being searchable in HIBP, Gravatar release an FAQ detailing the incident.

## Données exposées
- Email addresses
- Names
- Usernames

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/Gravatar)
- [gravatar.com](https://gravatar.com)