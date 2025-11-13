---
title: "Digimon - Fuite de données"
date: 2018-09-28T01:34:56Z
category: "breaches"
tags: ["email addresses", "email messages", "ip addresses", "names"]
---

# Digimon - Fuite de données

**Date de la fuite** : 2016-09-05  
**Nombre de comptes affectés** : 7 687 679

## Description
In September 2016, over 16GB of logs from a service indicated to be digimon.co.in were obtained, most likely from an unprotected Mongo DB instance. The service ceased running shortly afterwards and no information remains about the precise nature of it. Based on enquiries made via Twitter, it appears to have been a mail service possibly based on PowerMTA and used for delivering spam. The logs contained information including 7.7M unique email recipients names and addresses, mail server IP addresses, email subjects and tracking information including mail opens and clicks.

## Données exposées
- Email addresses
- Email messages
- IP addresses
- Names

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/Digimon)
- [digimon.co.in](https://digimon.co.in)