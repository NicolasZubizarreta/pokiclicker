# Registre des risques

Probabilité (P) et impact (I) de 1 à 3. Revue chaque semaine dès que le projet tourne.

| # | Risque | P | I | Déclencheur | Réponse | Responsable |
|---|---|---|---|---|---|---|
| R1 | Étendue : 9 régions, 1 025 Pokémon, comptes en ligne : abandon comme en V1 | 3 | 3 | une phase dépasse deux fois sa fourchette | jalons jouables courts ; Johto sert de gabarit ; données générées plutôt qu'écrites à la main | Nicolas |
| R2 | Équilibrage : courbe irrégulière, argent infini, parties trop longues | 3 | 2 | le simulateur sort un écart avec le budget de durée | simulateur dès la phase 3 ; tableau de réglage JSON ; test de régression | Claude |
| R3 | Images IA incohérentes (tailles, filigrane, style) | 3 | 2 | un décor ne respecte pas le gabarit | un ratio par type ; script de traitement ; régénération plutôt que correction à la main | Nicolas |
| R4 | Performance mobile : rafraîchissements fréquents de l'interface | 2 | 3 | image saccadée sur un téléphone moyen | état hors React, rafraîchissement 10 Hz au maximum, test sur vrai téléphone | Codex, relu par Claude |
| R5 | Sauvegarde en ligne : perte de données, conflit entre deux appareils, quotas du service gratuit | 2 | 3 | partie écrasée ou service plein | version de sauvegarde, export JSON conservé, une ligne active par partie, quotas vérifiés avant de choisir le service | Claude |
| R6 | Données des comptes d'amis (adresse e-mail) | 1 | 2 | ajout d'amis mineurs ou inconnus | collecte minimale, accès restreint par compte, pas de partage public | Nicolas |
| R7 | Propriété intellectuelle Pokémon | 1 | 2 | passage en accès public ou payant | rester en jeu privé entre amis ; sprites hébergés en local pour usage privé ; revoir la décision si la cible change | Nicolas |
| R8 | Triche par modification de sauvegarde | 3 | 1 | un ami triche | accepté ; skins cosmétiques uniquement ; plafond de cps côté jeu | Nicolas |
| R9 | Régression d'équilibrage à chaque ajout de contenu | 2 | 2 | un nouvel objet ou une nouvelle zone casse la courbe | simulateur exécuté en CI | Claude |
