---
title: "Regpack - Fuite de données"
date: 2016-09-13T04:35:05Z
category: "breaches"
tags: ["browser user agent details", "credit card cvv", "email addresses", "ip addresses", "names", "partial credit card data", "phone numbers", "physical addresses", "purchases"]
---

# Regpack - Fuite de données

**Date de la fuite** : 2016-05-20  
**Nombre de comptes affectés** : 104 977

## Description
In July 2016, a tweet was posted with a link to an alleged data breach of BlueSnap, a global payment gateway and merchant account provider. The data contained 324k payment records across 105k unique email addresses and included personal attributes such as name, home address and phone number. The data was verified with multiple Have I Been Pwned subscribers who confirmed it also contained valid transactions, partial credit card numbers, expiry dates and CVVs. A downstream consumer of BlueSnap services known as Regpack was subsequently identified as the source of the data after they identified human error had left the transactions exposed on a publicly facing server. A full investigation of the data and statement by Regpack is detailed in the post titled Someone just lost 324k payment records, complete with CVVs.

## Données exposées
- Browser user agent details
- Credit card CVV
- Email addresses
- IP addresses
- Names
- Partial credit card data
- Phone numbers
- Physical addresses
- Purchases

## Plus d'informations
- [Vérifier si vous êtes concerné](https://haveibeenpwned.com/breach/BlueSnapRegpack)
- [bluesnap.com](https://bluesnap.com)