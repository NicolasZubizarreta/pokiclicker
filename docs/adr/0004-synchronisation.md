# ADR 0004 — Synchronisation en ligne et conflits entre appareils

**Statut : accepté — décidé par Nicolas le 23/10/2026.** Ne décide ni du service ni du code de la phase 4 : fixe seulement les règles, pour que les sauvegardes (ADR 0001) les prévoient dès maintenant.

## Contexte
- En V1, la sauvegarde est locale (stockage du navigateur) et écrite par un minuteur (`legacy/js/app/main.js`). Aucune synchronisation.
- La V2 aura des comptes d'amis et des parties jouables sur deux appareils (jalon de la phase 4). Risque R5 du registre : perte de données, conflit entre deux appareils, quotas du service gratuit.
- La triche par modification de sauvegarde est **acceptée** entre amis (risque R8) : on ne cherche pas à l'empêcher.

## Options écartées
- **La dernière écriture gagne** : un appareil resté ouvert écrase la progression de l'autre sans prévenir.
- **Fusion automatique** : impossible de fusionner deux équipes ou deux inventaires sans créer des objets de rien.
- **Synchronisation à chaque clic** : inutile et coûteuse, le jeu bouge dix fois par seconde.

## Décision
1. **Quand envoyer** : toutes les **45 secondes**, **seulement si la partie a changé** depuis le dernier envoi, et en plus : à la fermeture ou à la mise en arrière-plan de la page, et après un événement important (boss vaincu, capture rare ou shiny, achat important). Le stockage local est écrit en même temps, avant l'envoi.
2. **Ce qu'on envoie** : seulement les objets modifiés (compte, partie, région courante), avec leur numéro de `revision` (ADR 0001). Une partie pèse quelques kilo-octets : environ 160 envois pour deux heures de jeu, très loin des quotas d'un service gratuit.
3. **Qui a la main** : **un seul appareil actif par partie**. À l'ouverture, l'appareil prend la partie ; l'autre voit « Cette partie est ouverte sur un autre appareil » et peut la reprendre en connaissance de cause. Un battement toutes les 60 secondes montre que l'appareil est vivant.
4. **Conflit** : le serveur refuse une écriture dont la `revision` de départ n'est pas la dernière connue. L'appareil affiche alors un choix en français, sans rien fusionner : **garder cet appareil** ou **récupérer l'autre version**, avec un résumé de chacune (région, zone, date, temps de jeu). Avant d'écraser quoi que ce soit, l'ancienne version est exportée en JSON.
5. **Hors connexion** : le jeu continue, écrit en local, et ne garde que **le dernier état** à envoyer au retour du réseau (pas de file d'attente). Le jeu n'affiche jamais « en ligne » ou « hors ligne » comme une erreur bloquante.
6. **Triche** : aucun contrôle côté serveur au-delà de la forme du fichier. Les skins sont cosmétiques.
7. **Données personnelles** : le compte ne garde que l'adresse e-mail nécessaire à la connexion ; l'export JSON n'en contient aucune (ADR 0001).

## Décisions de Nicolas (23/10/2026)
- Envoi toutes les **45 secondes** (si la partie a changé), plus à la fermeture.
- Appareil qui reprend une partie ouverte ailleurs : **reprise en un clic**, sans blocage.

## Conséquences
- La `revision` et les dates de l'ADR 0001 sont obligatoires dès la phase 1, même sans serveur.
- Le choix du service (piste : Supabase) se fait en phase 4, avec ces règles comme cahier des charges.
- Tickets concernés : F (champs de révision), phase 4 (compte et synchronisation).
