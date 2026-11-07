# ADR 0004 — Synchronisation en ligne et conflits entre appareils

**Statut : accepté — décidé par Nicolas le 23/10/2026. Points 3 et 4 remplacés le 06/11/2026 (voir « Décision du 06/11/2026 » en bas).** Ne décide ni du service ni du code de la phase 4 : fixe seulement les règles, pour que les sauvegardes (ADR 0001) les prévoient dès maintenant.

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
3. *(Remplacé le 06/11/2026.)* **Qui a la main** : **un seul appareil actif par partie**. À l'ouverture, l'appareil prend la partie ; l'autre voit « Cette partie est ouverte sur un autre appareil » et peut la reprendre en connaissance de cause. Un battement toutes les 60 secondes montre que l'appareil est vivant.
4. *(Remplacé le 06/11/2026 : plus de choix entre deux versions.)* **Conflit** : le serveur refuse une écriture dont la `revision` de départ n'est pas la dernière connue. L'appareil affiche alors un choix en français, sans rien fusionner : **garder cet appareil** ou **récupérer l'autre version**, avec un résumé de chacune (région, zone, date, temps de jeu). Avant d'écraser quoi que ce soit, l'ancienne version est exportée en JSON.
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

## Amendement (04/11/2026, ADR 0005)
- Point 4 : sans export JSON, le serveur garde les 5 dernières versions remplacées de chaque partie. (Le choix « garder cet appareil » ou « récupérer l'autre version » est supprimé le 06/11/2026 ; les versions archivées restent.)
- Le service est une API maison sur Postgres (Coolify), pas Supabase : voir l'ADR 0005.

## Amendement (05/11/2026, ticket J : jouer sans réseau)
- **Démarrage à froid** : l'application et le jeu sont en cache dès la première visite (le service worker s'enregistre au premier écran, connexion comprise, et non plus à l'ouverture du jeu). Avec une session déjà connectée et sans réseau, la validation de session, la synchro et l'appareil actif échouent en silence et la dernière partie locale s'ouvre sans message d'erreur. Seul un 401 du serveur ferme la session.
- **Appareil jamais connecté** : sans réseau, l'écran de connexion affiche « Pas de réseau. Connecte-toi une première fois avec une connexion internet ». Il n'y a pas de mode sans compte (hors périmètre).
- **Durée de validité hors ligne** : aucune limite côté appareil. Hors ligne, la session ne donne accès qu'à la partie déjà stockée dans le navigateur, que le jeton soit valable ou non ; la plafonner n'ajouterait aucune protection. La limite reste celle de Better Auth sur le serveur (réglages par défaut, inchangés : 7 jours, prolongés d'un jour d'activité à chaque validation). Au retour du réseau, une session de plus de 7 jours est refusée (401) : écran de connexion avec « Ta session a expiré. Reconnecte-toi : ta partie sur cet appareil est conservée ». La partie locale n'est jamais effacée par l'expiration ; après reconnexion, la comparaison habituelle avec le serveur s'applique.
- **Plusieurs jours hors ligne, retour du réseau** : l'appareil garde sa partie locale et ne garde que le dernier état (point 5). Au premier envoi, si le serveur a avancé entre-temps, il refuse la révision de départ (409) et le choix du point 4 s'affiche, avec archivage de la version écrasée. Si l'autre appareil a repris la partie pendant la coupure (le serveur libère la main après 120 s sans battement), l'écran « Partie ouverte ailleurs » s'affiche au premier battement : le jeu s'arrête, rien n'est envoyé tant que le joueur n'a pas repris la main, et la reprise repassait par le choix si les deux versions avaient changé *(remplacé le 06/11/2026 : la reprise prend la sauvegarde du serveur)*. Jouer hors ligne ne fait donc perdre la main qu'avec un écran explicite, et n'écrase jamais une autre partie sans choix.
- **Limite connue** : sur un réseau qui ne répond pas (connecté au Wi-Fi sans accès internet), l'ouverture attend les trois appels de démarrage (session, synchro, appareil), 8 s chacun au plus, avant d'ouvrir la partie locale. Un mode avion ou un réseau coupé échoue tout de suite.

## Décision du 06/11/2026 (lot 8 de la phase 5) — une sauvegarde par partie
**Décidé par Nicolas, qui remplace les points 3 et 4.** Ses amis ont trouvé l'écran « deux versions » incompréhensible : il n'y a toujours qu'une sauvegarde par partie, même en changeant d'appareil.
1. **Le serveur fait foi, un seul appareil écrit.** « Reprendre ici » prend la sauvegarde la plus récente de l'autre appareil (celle du serveur) et remet le joueur exactement où il en était : région, zone, étape, équipe, argent, inventaire, événement en cours, partie de blackjack, chronos (en dates absolues), pension, jetons, statistiques, Pokédex, temps de jeu. Aucune copie n'est créée, rien n'est à choisir.
2. **Partie reprise ailleurs.** L'appareil qui perd la main s'arrête, affiche « Partie reprise ailleurs » (ADR 0004, maquette a5) et n'écrit plus : le serveur refuse un PUT d'un appareil dépossédé (409 `{code:'ailleurs'}`, sans écriture), et l'appareil n'envoie plus rien ni ne reprend la main tout seul. Le serveur libère la main après 120 s sans battement, comme avant.
3. **Divergence (cas limite).** Si le joueur a joué hors ligne sur un appareil alors que l'autre a avancé sur le serveur, les deux côtés ont changé. Décision par défaut : **la sauvegarde du serveur gagne**, la progression locale est **archivée automatiquement** sur le serveur (table `versions`, 5 dernières par objet) puis remplacée, avec un avis d'une phrase. Aucun écran de choix. Si l'archivage échoue, rien n'est remplacé et l'appareil réessaie au retour du réseau. Le compte (diamants, succès, skins) et la partie (avec toutes ses régions) sont résolus séparément, pour ne jamais mélanger une partie locale et une région du serveur.
4. **Pas de restauration de l'archive dans l'interface** : elle se récupère en base. Un écran de restauration reste à décider.
5. **Partie supprimée sur un autre appareil** : écran dédié « Partie supprimée ailleurs » (la garder, ce qui la recrée sur le serveur, ou l'abandonner).
6. **Déconnexion.** Avec une synchro en attente : « Sauvegarder et se déconnecter » → page « Sauvegarde en cours… Ne ferme pas la page » → envoi → déconnexion. Sans synchro en attente : confirmation simple. Si l'envoi échoue : message « La sauvegarde n'a pas abouti », on reste connecté (« Réessayer » ou « Rester connecté »), la sauvegarde locale reste intacte. Il n'y a pas de « se déconnecter quand même » qui perdrait la progression.
7. **Compatibilité.** Format de sauvegarde inchangé (pas de migration). Le PUT gagne un champ facultatif `appareilId` (UUID) ; sans lui, comportement inchangé. **Déploiement : serveur avant client** (un ancien serveur répond 400 à un nouveau client). Aucune migration SQL.
8. **Limites connues.** Ne reviennent pas au changement d'appareil : l'ennemi en cours et ses PV, le combat de boss en cours avec son minuteur, et le jeu fait sur l'appareil quitté depuis son dernier envoi (45 s au plus, 0 s en arrière-plan). Restent aussi : une partie locale non envoyée d'un compte peut partir sur un autre compte après un changement de compte sur le même appareil (déjà le cas avant ce lot).
