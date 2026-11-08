# ADR 0001 — Sauvegarde à trois niveaux, versionnée

**Statut : accepté — décidé par Nicolas le 23/10/2026.**

## Contexte
- La V1 garde tout dans **un seul objet `state`** sérialisé sous la clé `pokiClickerSave` (`legacy/js/app/main.js`, `legacy/js/game/save.js`). Cet objet mélange la progression (argent, équipe, badges, PC, Pokédex), des réglages (arrêt sur rare) et des **états d'interface** qui ne devraient pas être sauvegardés (`candyMode`, `swapIdx`, `summaryPokemon`, `contextTarget`…). Il n'a pas de numéro de version : chaque ajout de champ est rattrapé à la main au chargement.
- La V2 a besoin de plusieurs parties par compte, d'une équipe et d'une zone **par région**, d'un compte qui garde les diamants, les succès et les skins, d'une synchronisation en ligne (phase 4) et d'un export/import JSON.

## Options écartées
- **Un seul objet comme en V1** : impossible de synchroniser le compte sans écraser la partie, ni de remettre à zéro une région.
- **Une sauvegarde par région complètement indépendante** : le Pokédex national et le PC global sont communs à toutes les régions.
- **Pas de numéro de version, migration « au besoin »** : source de pertes de données silencieuses (risque R5).

## Décision
1. **Trois niveaux**, chacun avec son identifiant, sa version et sa date :
   - **Compte** : diamants, succès obtenus, skins débloqués, préférences d'affichage et de son. Un succès ne se gagne qu'une fois par compte.
   - **Partie** (plusieurs par compte) : nom de la partie, région courante, régions débloquées, Pokédex national, PC global, argent, drapeaux d'événements globaux, statistiques de jeu.
   - **Région** (une par région d'une partie) : équipe, zone et étape courantes, badges, Ligue gagnée, inventaire d'objets de la région, drapeaux d'événements de la région.
2. **Enveloppe commune** à chaque niveau : `{ "version": 1, "niveau": "partie", "id": "…", "revision": 12, "ecritLe": "2026-10-23T18:04:05Z", "donnees": { … } }`. Le champ `revision` sert à la synchronisation (ADR 0004).
3. **Aucun état d'interface dans la sauvegarde** : modes, sélections, fenêtres ouvertes, ennemi en cours. La partie reprend sur un nouvel ennemi de la zone, à la même étape.
4. **Migrations** : une fonction pure `migrerDeVersionN(donnees) → donnees` par numéro de version, enchaînées dans l'ordre. Chaque migration a un jeu d'essai figé dans `src/core/migrations/__fixtures__/`. Une sauvegarde d'une version **plus récente** que le jeu est refusée sans être écrasée.
5. **Stockage local** (phase 1) : une clé par niveau et par identifiant dans le stockage du navigateur. Le jeu n'écrit que par `src/ui/stockage-local.ts` ; `src/core/sauvegarde.ts` ne connaît que des objets.
6. **Export/import JSON** conservé : un fichier contient une partie complète (sa partie et ses régions) ; il ne contient ni e-mail ni identifiant de compte. Un fichier corrompu est refusé avec un message en français, sans toucher à la partie en cours.
7. **Reprise après absence** : la sauvegarde garde la date de dernière écriture. Le rattrapage de temps (1 heure au plus, ticket B, `data/reglages.json`) s'applique à l'ouverture.

## Décisions de Nicolas (23/10/2026)
- **Argent et inventaire au niveau région** : chaque région repart de zéro, comme l'équipe. Seuls les diamants, les succès et les skins sont au compte ; le Pokédex national et le PC global sont à la partie. (Écarte la formule « argent au niveau partie » de `docs/vision.md`, à corriger.)
- **Import d'une sauvegarde de la V1** : non prévu.

## Conséquences
- Remettre à zéro une région ne touche ni le Pokédex ni le PC global.
- Le compte en ligne (phase 4) synchronise trois types d'objets au lieu d'un gros bloc, avec une taille de l'ordre de quelques kilo-octets par partie.
- Chaque évolution du format coûte une migration testée : c'est voulu.
- Tickets concernés : F (sauvegarde locale), H (reprise de la Route 1).

## Version 2 (24/10/2026, ticket A de la phase 2)
- `VERSION_ACTUELLE` = 2. La marche 1 → 2 reçoit le niveau de l'enveloppe (`migration(donnees, niveau)`) : le compte est inchangé, la partie et la région gagnent `sexe` et `favori` sur chaque Pokémon, la région gagne `pc`, `ameliorations`, `jalonsRecus`, `starterId`, `statistiques`, `chronos`, `pension`, `jetons` et `arretAuto` (valeurs de départ dans `data/reglages.json`, section `depart.region`).
- Le sexe d'un Pokémon déjà sauvegardé est déduit de son `uid` (parité de la somme des codes des caractères) : reproductible, sans hasard.
- Lire une sauvegarde ancienne ne l'écrit jamais ; elle est réécrite en version 2 à la première écriture.

## Amendement (04/11/2026, ADR 0005)
- Le point 6 (export/import JSON) est abandonné : la partie vit sur le serveur, comme dans n'importe quel jeu. Aucun fichier de sauvegarde à importer ou exporter.

## Précisions (06/11/2026, lot 8 de la phase 5)
- Point 3 : ce qui est perdu en changeant d'appareil est volontaire et accepté : l'ennemi en cours et ses PV, le combat de boss en cours avec son minuteur, le moment du défi de Chen. Tout le reste (équipe, zone, étape, argent, inventaire, événement en cours, blackjack, chronos en dates absolues, pension, jetons, statistiques, Pokédex, temps de jeu) est repris à l'identique.
- Point 7 : le rattrapage de temps plafonné (boucle de jeu) couvre une page en arrière-plan ; à l'ouverture, le jeu **ne rattrape pas** le temps écoulé depuis `ecritLe`. La phrase du point 7 décrivait une intention, non réalisée.
- Une seule sauvegarde par partie, même d'un appareil à l'autre : voir l'ADR 0004 (décision du 06/11/2026). Le format (version 3) est inchangé.

## Version 4 (08/11/2026, ticket V : Pokémon vus)
- `VERSION_ACTUELLE` = 4. La partie gagne `vus: number[]` : les numéros nationaux des Pokémon sauvages déjà apparus en combat, capturés ou non (jamais un boss ni un dresseur). Invariant : capturés (`pokedexNational`) ⊆ vus. Un « vu » seul n'entre dans aucun compteur (x/151), jalon, récompense ni succès.
- La marche 3 → 4 ne touche ni le compte ni les régions. Pour une partie : `vus` = `pokedexNational` + les numéros du PC global (œufs exclus). L'équipe et le PC de région sont dans les enveloppes de région, hors de portée de la migration : au chargement, le jeu les ajoute (même rattrapage que `completerPokedex`).
- Serveur : il ne valide que l'enveloppe (version entre 1 et 1000) et stocke les données telles quelles. Il accepte la version 4 et renvoie une partie en version 3 inchangée ; c'est le client qui la migre à la lecture, et qui refuse toujours une version plus récente que la sienne. Aucune migration SQL.
- Synchronisation (ADR 0004, décision du 06/11) : aucune fusion champ par champ n'existe, le serveur fait foi et la progression locale divergente est archivée entière. `vus` suit la même règle que `pokedexNational` ; il n'y a donc pas d'union à la synchro. Déploiement : serveur d'abord (inchangé en pratique), puis le jeu, sauvegarde de la base avant.
