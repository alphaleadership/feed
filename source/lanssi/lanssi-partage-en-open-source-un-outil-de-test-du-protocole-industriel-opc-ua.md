---
title: lanssi-partage-en-open-source-un-outil-de-test-du-protocole-industriel-opc-ua
date: 2025-3-20
lien: "https://cyber.gouv.fr/actualites/lanssi-partage-en-open-source-un-outil-de-test-du-protocole-industriel-opc-ua"
categories:
  - lanssi
---

L’ANSSI partage en open source un outil de test du protocole industriel OPC UA

            


      anssiadm
jeu 20/03/2025 - 12:11

            
L’outil « fuzzysully » est un fuzzer qui permet d’évaluer la sécurité de l’implémentation du protocole OPC UA utilisé dans le secteur industriel. Son code est désormais disponible pour tous.

      
      

              
  

    

      
            
Dans sa mobilisation pour accroître le niveau de sécurité des systèmes d’information (SI) industriels
l’ANSSI souhaite favoriser et encourager l’adoption du protocole Open Platform Communications Unified Architecture (« OPC UA »). Le protocole OPC UA est un standard international
open source
définissant la communication entre les différents constituants d’un système d’information industriel. Ce standard
nativement sécurisé
ouvert et interopérable
est largement adopté par les organisations du secteur de l’industrie.

L’Agence soutient activement l’utilisation de ce protocole au sein de l’écosystème numérique
notamment pour les SI industriels répondant à de forts enjeux de sécurité comme certains systèmes d’information d’importance vitale (SIIV) et certains systèmes d’information essentiels (SIE).

Courant 2024
l’ANSSI a sous-traité à la société Quarkslab le développement de « fuzzysully »
un fuzzer pour le protocole OPC UA. L’ANSSI publie ce jour cet outil sur le dépôt Github de l’Agence.

Cette publication s’inscrit dans la démarche générale de l’ANSSI visant à partager avec la communauté cyber les codes qu’elle produit et à accroître le niveau de sécurité des logiciels open source. L’Agence assurera le maintien en conditions de sécurité (MCS) de fuzzysully mais ne prévoit pas de le faire évoluer.

L’ANSSI invite l’écosystème cyber à s’approprier cet outil de manière à évaluer la robustesse de différentes implémentations du protocole OPC UA et ainsi à participer à l’amélioration de la sécurité des SI industriels. Pour toutes remarques ou questions : industries [at] ssi.gouv.fr.


      
    

  


              
  

        
Qu’est-ce qu’un fuzzer ? Qu’est-ce que le fuzzing ?

        

      

        
      

      

        
            
  

    

      
            
Un fuzzer est un outil qui injecte automatiquement dans un programme
des entrées aléatoires
invalides
inattendues ou malformées pour éprouver sa capacité à résister à des cas non envisagés lors d’une utilisation normale.

L'objectif du fuzzing est d'identifier
au moyen d’un fuzzer
des bugs
des vulnérabilités ou des comportements inattendus
tels que des plantages (crashs)
des fuites de mémoire ou d’autres défauts pouvant mettre en péril la sécurité du programme.
