# Backlog, phase 4 « Compte et sauvegarde en ligne »

Jalon : une partie jouable sur deux appareils. **Validé par Nicolas le 04/11 (10 tickets ; rattachement de la partie locale retiré).** Aucun code avant son feu vert (règle du dépôt).

## Lecture du lot

Décisions de Nicolas du 04/11 : serveur à lui sur Coolify ; connexion par e-mail et mot de passe ; compte obligatoire ; pas d'export ni d'import JSON (la sauvegarde vit en base, comme dans n'importe quel jeu) ; un mode hors connexion à prévoir plus tard (ticket J). Règles de synchronisation : ADR 0004 (envoi toutes les 45 s si changé, un seul appareil actif par partie, refus d'écriture sur révision périmée, jeu qui continue sans réseau). Format de sauvegarde : ADR 0001 (compte, partie, région ; enveloppe avec `revision`).

Chemin critique : A → B → C → D → E → I. Les tickets A, B et C touchent l'authentification, les données personnelles (e-mail) et la configuration serveur : **pas d'`agent-ok`**, faits ou relus par un humain avec revue de sécurité. Les autres sont déléguables à Codex une fois leurs dépendances finies.

Hors phase 4 : reprise des parties locales de test (supprimées, décision du 04/11 : chacun recommence), PC global et Pokédex national (phase 6), design des écrans de compte (phase 5 ; ici écrans fonctionnels aux jetons existants), boutique de skins, suppression de compte et RGPD (préprod).

| n | Ticket | Effort |
|---|---|---|
| 1 | A. ADR 0005 : pile serveur et modèle de données | 1 à 2 j |
| 2 | B. Déployer le serveur sur Coolify | 1 à 2 j |
| 3 | C. Inscription, connexion, mot de passe oublié | 2 à 3 j |
| 4 | D. Envoyer la partie au serveur (45 s, fermeture, hors connexion) | 2 à 3 j |
| 5 | E. Conflit de révision et historique des versions | 2 à 3 j |
| 6 | F. Un seul appareil actif par partie | 1.5 à 2.5 j |
| 7 | G. Plusieurs parties par compte | 2 à 3 j |
| 8 | H. Socle diamants, succès, skins | 2 à 3 j |
| 9 | I. Scénario deux appareils de bout en bout | 1 à 2 j |
| 10 | J. Mode hors connexion complet (idée, après le jalon) | 2 à 3 j |

## A. `docs(sync): choisir la pile serveur et le modèle de données (ADR 0005)`

`type:docs`, `etat:fait`, `est:1-2`, `prio:1` · branche : `v2` · pas d'`agent-ok` (choix d'architecture, authentification)

### Histoire
En tant que développeur, je veux une pile serveur choisie et justifiée afin de ne pas réécrire l'authentification ni la synchronisation en cours de route.

### Contexte
Service sur Coolify (décidé). Choix du 04/11 : petite API TypeScript + Postgres géré par Coolify. PocketBase écarté (dépôt officiel archivé le 26/10/2026), Supabase auto-hébergé écarté (15 conteneurs, 4 Go de RAM minimum). Fichiers : `docs/adr/0005-serveur.md` (nouveau), `docs/adr/0001-sauvegarde.md` et `0004-synchronisation.md` (amendements).

### Critères d'acceptation
- [x] Étant donné les trois options, quand l'ADR est lu, alors il compare charge de maintenance, sauvegarde de la base, refus d'écriture sur révision et réinitialisation du mot de passe, et nomme le choix avec sa raison.
- [x] Étant donné le modèle de données, quand l'ADR est lu, alors il décrit les collections (compte, partie, région, appareil actif, versions précédentes) avec les champs de l'enveloppe (`version`, `niveau`, `id`, `revision`, `ecritLe`) et les règles d'accès : un compte ne lit que ses données.
- [x] Étant donné la décision du 04/11, quand les ADR 0001 (point 6) et 0004 (point 4) sont relus, alors l'export/import JSON y est remplacé par l'historique des versions côté serveur.
- [x] Étant donné une écriture dont la `revision` de départ n'est pas la dernière, quand l'ADR est lu, alors la méthode de refus est décrite (condition SQL sur la révision, réponse 409) ; son test est au ticket E.

### Hors périmètre
Code du jeu, déploiement (ticket B), choix du fournisseur d'e-mail (ticket C).

### Effort et risques
1 à 2 jours. Risque : service d'envoi d'e-mails à choisir pour la réinitialisation (SMTP). Dépend de : rien.

## B. `feat(serveur): déployer le service sur Coolify avec sauvegardes de la base`

`type:feat`, `etat:fait`, `est:1-2`, `prio:1` · branche : `v2` · pas d'`agent-ok` (configuration système, données personnelles)

### Histoire
En tant que joueur, je veux un serveur toujours disponible et sauvegardé afin que mes parties ne se perdent pas si le serveur plante.

### Contexte
Coolify tourne déjà chez Nicolas. Nicolas fait le déploiement et fournit les accès ; l'assistant prépare le dépôt (fichier de déploiement, script de sauvegarde, documentation). Dépôt : `server/` (nouveau, à confirmer dans l'ADR 0005).

### Critères d'acceptation
- [x] Étant donné le service déployé, quand j'ouvre son adresse en HTTPS, alors il répond (état de santé) et le certificat est valide.
- [x] Étant donné la base, quand la sauvegarde planifiée s'exécute, alors un fichier daté est créé hors du conteneur (sauvegarde Coolify quotidienne, sur le disque du serveur). La copie hors serveur et la restauration d'essai sont reportées : décision de Nicolas du 04/11, pas de second hébergeur payant pour l'instant (ticket K, idée).
- [x] Étant donné les secrets (clés, mot de passe SMTP), quand le dépôt est parcouru, alors aucun n'y figure ; ils sont dans les variables de Coolify.
- [x] Étant donné une origine autre que le jeu, quand elle appelle l'API, alors la requête est refusée (CORS limité à l'adresse du jeu et à `localhost`).

### Hors périmètre
Haute disponibilité, supervision avancée.

### Effort et risques
1 à 2 jours. Risque : e-mails de réinitialisation classés en courrier indésirable. Dépend de : A.

## C. `feat(compte): s'inscrire, se connecter et récupérer son mot de passe`

`type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · pas d'`agent-ok` (authentification, données personnelles)

### Histoire
En tant que joueur, je veux créer un compte avec mon e-mail et un mot de passe afin de retrouver mes parties sur n'importe quel appareil.

### Contexte
Compte obligatoire (décision du 04/11) : le jeu s'ouvre sur l'écran de connexion tant qu'aucune session n'existe. Le compte ne garde que l'e-mail (ADR 0004, point 7 ; risque R6). Écrans fonctionnels, à `design/DESIGN.md` ; mise en forme finale en phase 5. Fichiers : `src/ui/` (écrans de compte, nouveau), client serveur dans `src/ui/` (hors `src/core`).

### Critères d'acceptation
- [x] Étant donné un e-mail neuf et un mot de passe d'au moins 10 caractères, quand je m'inscris, alors je suis connecté et la session survit au rechargement de la page.
- [x] Étant donné un e-mail déjà inscrit ou un mot de passe trop court, quand je m'inscris, alors un message en français l'explique, sans révéler si l'e-mail existe lors d'une connexion échouée.
- [x] Étant donné un mot de passe oublié, quand je demande la réinitialisation, alors je reçois un lien à usage unique qui expire, et l'ancien mot de passe ne marche plus après le changement.
- [x] Étant donné trop d'essais ratés, quand je réessaie, alors le serveur ralentit ou bloque temporairement la tentative.
- [x] Étant donné « se déconnecter », quand je clique, alors la session est supprimée de l'appareil et l'écran de connexion revient.

### Hors périmètre
Connexion Google, suppression de compte et RGPD (préprod), design final.

### Effort et risques
2 à 3 jours. Risque : réception des e-mails. Dépend de : A, B.

## D. `feat(sauvegarde): envoyer la partie au serveur toutes les 45 secondes`

`type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : à poser par Nicolas

### Histoire
En tant que joueur, je veux que ma partie soit enregistrée en ligne en continu afin de ne rien perdre si mon téléphone s'éteint.

### Contexte
ADR 0004 points 1, 2 et 5. Le stockage local reste écrit en premier (`src/ui/stockage-local.ts`) ; l'envoi ajoute le serveur sans toucher à `src/core/sauvegarde.ts`, qui ne connaît que des objets. Nouveau module `src/ui/synchro.ts` avec son test.

### Critères d'acceptation
- [x] Étant donné une partie qui a changé, quand 45 s passent, alors seuls les objets modifiés (compte, partie, région courante) partent avec leur `revision`, et rien ne part si rien n'a changé.
- [x] Étant donné la fermeture ou la mise en arrière-plan de la page, quand elle survient, alors un envoi immédiat est tenté après l'écriture locale.
- [x] Étant donné un boss vaincu, une capture shiny ou un achat important, quand il survient, alors un envoi part sans attendre les 45 s.
- [x] Étant donné une coupure réseau, quand le jeu continue, alors il écrit en local sans message bloquant, ne garde que le dernier état et l'envoie au retour du réseau (pas de file d'attente).
- [x] Étant donné le même parcours avec et sans synchro, quand combats et récompenses sont comparés, alors les résultats sont identiques.

### Réalisé (04/11)
Serveur : `server/src/schema.ts` (migration), `server/src/sauvegarde.ts` (PUT atomique avec `revisionBase`, 409 avec résumé, GET compte et partie, plafonds 20 parties et 20 régions, 60 requêtes par minute et par compte, 5 versions gardées). Client : `src/ui/synchro.ts`, branché par `store.abonnerSauvegarde` et `App.tsx`. Tests : 25 serveur, 14 `synchro.test.ts`, 4 `store-synchro.test.ts`. Capture shiny : relue dans le code, non testée au niveau du store.
Limite connue, pour E et G : la synchro ne sait pas à quel compte appartient le jeu local. Deux comptes qui se suivent sur le même navigateur : le second reçoit un 409 silencieux (révisions du premier). Sans conséquence avec un seul compte par navigateur.

### Hors périmètre
Conflits (E), appareil actif (F), liste de parties (G).

### Effort et risques
2 à 3 jours. Risque : envoi pendant que le jeu tourne à 10 Hz ; copie de l'état avant envoi. Dépend de : C.

## E. `feat(sauvegarde): arbitrer un conflit et garder les versions précédentes`

`type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : à poser par Nicolas

### Histoire
En tant que joueur sur deux appareils, je veux être prévenu quand deux versions de ma partie diffèrent afin de ne jamais écraser ma progression sans le savoir.

### Contexte
ADR 0004 point 4, adapté (pas d'export JSON, décision du 04/11) : avant d'écraser une version, le serveur la garde dans un historique des 5 dernières versions par partie. Fichiers : `src/ui/synchro.ts`, écran de choix, serveur (ticket A).

### Critères d'acceptation
- [x] Étant donné une écriture dont la `revision` de départ est périmée, quand le serveur la reçoit, alors il la refuse sans rien modifier.
- [x] Étant donné ce refus, quand l'appareil l'apprend, alors un choix en français s'affiche : « garder cet appareil » ou « récupérer l'autre version », avec pour chacune la région, la zone, la date et le temps de jeu ; rien n'est fusionné.
- [x] Étant donné un choix, quand je le valide, alors l'autre version est copiée dans l'historique avant d'être remplacée.
- [x] Étant donné l'historique, quand une 6e version est enregistrée, alors la plus ancienne est supprimée et les 5 dernières restent récupérables par un administrateur.

### Hors périmètre
Écran joueur de restauration depuis l'historique (à demander plus tard si utile), fusion automatique (écartée dans l'ADR 0004).

### Effort et risques
2 à 3 jours. Risque : cas de coupure pendant le choix. Dépend de : D.

## F. `feat(sauvegarde): un seul appareil actif par partie`

`type:feat`, `etat:fait`, `est:1.5-2.5`, `prio:2` · branche : `v2` · `agent-ok` : à poser par Nicolas

### Histoire
En tant que joueur, je veux savoir quand ma partie est ouverte ailleurs afin d'éviter deux appareils qui jouent en même temps.

### Contexte
ADR 0004 point 3, décision de Nicolas du 23/10 : reprise en un clic, sans blocage. Battement toutes les 60 s. Fichiers : `src/ui/synchro.ts`, serveur (collection « appareil actif »).

### Critères d'acceptation
- [x] Étant donné une partie ouverte sur l'appareil 1, quand l'appareil 2 l'ouvre, alors il lit « Cette partie est ouverte sur un autre appareil » avec un bouton « Reprendre ici ».
- [x] Étant donné « Reprendre ici », quand je clique, alors l'appareil 2 devient l'appareil actif en un clic et l'appareil 1 le voit au battement suivant.
- [x] Étant donné un appareil sans battement depuis plus de 2 minutes, quand un autre ouvre la partie, alors elle s'ouvre sans avertissement.

### Hors périmètre
Blocage dur de l'appareil précédent.

### Effort et risques
1,5 à 2,5 jours. Risque : horloge des appareils ; le serveur date le battement. Dépend de : D.

## G. `feat(parties): plusieurs parties par compte`

`type:feat`, `etat:fait`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` : à poser par Nicolas

### Histoire
En tant que joueur, je veux créer, choisir et supprimer plusieurs parties dans mon compte afin de recommencer sans perdre l'autre.

### Contexte
`docs/vision.md` (« Comptes et sauvegardes ») ; `partieInitiale(nom)` existe déjà dans `src/core/sauvegarde.ts`. Décision du 28/10 : le Reset de la V1 est remplacé par la création et la suppression de parties depuis le compte.

### Critères d'acceptation
- [x] Étant donné un compte sans partie, quand je me connecte, alors je peux créer une partie nommée et elle devient la partie courante.
- [x] Étant donné plusieurs parties, quand j'ouvre la liste, alors chacune montre son nom, sa région, sa zone, son temps de jeu et la date de dernière écriture, et je charge celle que je veux.
- [x] Étant donné « supprimer », quand je confirme (deux étapes), alors la partie et ses régions disparaissent du serveur, et les autres parties du compte restent intactes.
- [x] Étant donné le compte, quand je change de partie, alors les diamants, succès et skins du compte restent les mêmes. (Vérifié au niveau des données : la suppression et le changement de partie ne touchent jamais `donnees_compte`, test serveur « compte inchangé » ; les diamants eux-mêmes arrivent avec H.)

### Réalisé (04/11)
`GET /parties` renvoie aussi région, zone et temps de jeu ; `DELETE /parties/:id` (transaction, versions de la partie et de ses régions supprimées, 404 pour une partie d'un autre compte). Côté client : partie courante explicite (`pokiclicker:courante`), écran « Tes parties » (créer, jouer, supprimer en deux étapes) ouvert par « Mes parties » dans la coquille, plafond de 20 parties, nom de 1 à 100 caractères. Changer de partie recharge la page ; une copie locale n'est jamais écrasée.

Limite connue : si la partie courante est supprimée depuis un autre appareil, le premier envoi de celui-ci reçoit un 409 « partie inconnue » ; la mémoire de synchro est remise à zéro et la copie locale recrée la partie au tour suivant. Une suppression faite ailleurs est donc annulée tant que l'appareil garde la partie ouverte. À traiter avec une confirmation avant recréation (ticket à ouvrir si Nicolas le veut). Deux cas rares s'y ajoutent : à 20 parties, la recréation reçoit un 413 et la synchro reste bloquée tant qu'une partie n'est pas supprimée ; un envoi de régions seules sur une partie supprimée reçoit un 404 traité comme un refus.

Revue sécurité (fable, high, 04/11) : isolement entre comptes, jokers du `LIKE`, transaction et course envoi/suppression vérifiés sans défaut. Trois défauts corrigés : changer de partie n'installe plus le compte du serveur (une copie locale non envoyée est gardée), la suppression d'une partie connue du serveur mais absente en local échoue si le serveur refuse, la partie quittée est envoyée avant d'en créer une nouvelle. Noté : `suppressionCourante` reste vrai après une suppression réussie parce que l'écran recharge la page.

### Hors périmètre
Renommer une partie existante (à décider), partage entre comptes.

### Effort et risques
2 à 3 jours. Risque : suppression sans retour ; confirmation en deux étapes. Dépend de : C, D.

## H. `feat(compte): socle des diamants, des succès et des skins`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:3` · branche : `v2` · `agent-ok` : à poser par Nicolas

### Histoire
En tant que joueur, je veux qu'un succès me rapporte des diamants gardés dans mon compte afin que ma progression de compte survive à mes parties.

### Contexte
ADR 0001 : niveau compte (`DonneesCompte`, `compteInitial()`). « Socle » = modèle et règles, pas le contenu : un registre de succès en `data/`, trois succès d'exemple, aucun catalogue de skins ni boutique. Un succès ne se gagne qu'une fois par compte.

### Critères d'acceptation
- [ ] Étant donné un succès rempli sur n'importe quelle partie, quand il est débloqué, alors les diamants sont ajoutés au compte une seule fois, même si la condition est remplie sur une autre partie.
- [ ] Étant donné le registre `data/` des succès, quand un identifiant est ajouté ou retiré, alors aucun code n'est modifié.
- [ ] Étant donné le compte, quand je l'ouvre, alors je vois mes diamants, mes succès obtenus et mes skins débloqués.
- [ ] Étant donné un skin débloqué par le compte, quand je me connecte depuis un autre appareil, alors il est présent.

### Hors périmètre
Boutique de skins, catalogue complet, tournoi du Maître (phase 7).

### Effort et risques
2 à 3 jours. Risque : définir les conditions de succès ; trois exemples seulement. Dépend de : D.

## I. `test(sync): jouer sur deux appareils de bout en bout`

`type:test`, `etat:a_faire`, `est:1-2`, `prio:1` · branche : `v2` · `agent-ok` : à poser par Nicolas

### Histoire
En tant que développeur, je veux un scénario automatisé à deux appareils afin de prouver le jalon de la phase 4 et de repérer les régressions de synchro.

### Contexte
Playwright (`tests-e2e/`), deux contextes de navigateur contre un serveur d'essai local ; réseau coupé par l'outil de test.

### Critères d'acceptation
- [ ] Étant donné un compte et deux appareils, quand je joue sur le premier puis ouvre la partie sur le second, alors la progression (zone, argent, équipe) est identique.
- [ ] Étant donné les deux appareils ouverts, quand les deux jouent, alors le conflit est signalé et le choix de la version fonctionne dans les deux sens.
- [ ] Étant donné une coupure réseau d'une minute, quand elle finit, alors le dernier état part sans perte et sans message d'erreur bloquant.
- [ ] Étant donné la CI, quand le scénario tourne, alors il dure moins de 2 minutes.

### Hors périmètre
Tests de charge.

### Effort et risques
1 à 2 jours. Risque : tests instables sur les temporisations ; horloge simulée. Dépend de : D, E, F.

## J. `feat(hors-connexion): jouer sans réseau, y compris à l'ouverture`

`type:feat`, `etat:idee`, `est:2-3`, `prio:4` · branche : `v2` · pas d'`agent-ok` avant cadrage · demande de Nicolas du 04/11, pas urgent, après le jalon

### Histoire
En tant que joueur sans réseau, je veux ouvrir et jouer ma partie quand même afin de jouer dans le train ou à l'étranger.

### Contexte
Le jeu continue déjà sans réseau une fois ouvert (ticket D). Reste le démarrage à froid : ouvrir l'application sans réseau avec une session déjà connectée, via la PWA et la sauvegarde locale. À cadrer : durée de validité de la session hors ligne, et règle si l'appareil reste hors ligne plusieurs jours (conflit au retour, ticket E).

### Critères d'acceptation
- [ ] Étant donné un appareil déjà connecté, quand j'ouvre le jeu sans réseau, alors la dernière partie locale s'ouvre sans message d'erreur bloquant.
- [ ] Étant donné plusieurs jours hors ligne, quand le réseau revient, alors le conflit éventuel passe par le choix du ticket E.
- [ ] Étant donné un appareil jamais connecté, quand j'ouvre le jeu sans réseau, alors un message clair demande de se connecter une première fois.

### Hors périmètre
Jouer sans jamais créer de compte.

### Effort et risques
2 à 3 jours, à resserrer au cadrage. Risque : sécurité d'une session longue hors ligne. Dépend de : D, E.

## K. `chore(serveur): copier les sauvegardes hors du serveur et tester une restauration`

`type:chore`, `etat:idee`, `est:0.5-1`, `prio:5` · branche : `v2` · pas d'`agent-ok` (configuration système) · reporté par Nicolas le 04/11 : pas de second hébergeur payant maintenant, à reprendre quand des amis jouent vraiment

### Contexte
Les sauvegardes Coolify restent sur le disque du serveur : elles ne protègent pas d'une perte du serveur. À reprendre avec un stockage S3 (ou une copie manuelle périodique du dump sur le PC de Nicolas, gratuite), puis restauration d'essai selon `server/README.md`.
