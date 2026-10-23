# Backlog — phase 1 « Fondations »

Jalon : **Route 1 jouable sur téléphone et PC** (`docs/plan.md`). Brouillon du 23/10/2026, rien n'est créé sur un dépôt distant.

## Lecture du lot

- **Même dépôt que la V1** (`NicolasZubizarreta/pokiclicker`), sur la branche **`v2`** (créée en local le 23/10, rien de poussé). La V1 reste intacte sur `main`.
- **On porte la V1, on ne repart pas de zéro** (décision de Nicolas, 23/10) : règles, formules, données de Kanto, textes, sprites et idées viennent de la V1. Chaque ticket nomme les fichiers V1 à porter ; l'agent les lit, les convertit en TypeScript propre et en données JSON, et **ne change pas une règle sans ticket**. Un écart de comportement avec la V1 est un bug, sauf s'il est listé dans le ticket.
- Les chemins ci-dessous sont des chemins **prévus** (« À CONFIRMER »). Dans la branche, la V1 est rangée dans `legacy/` (lecture seule) et la V2 est à la racine. Tous les tickets restent `etat:idee` jusqu'à ce que le ticket A soit fini et que les chemins soient confirmés.
- Les lettres A à L deviendront des numéros réels à la création, dans l'ordre.
- **Équipe de départ provisoire** : le choix du starter animé et les dialogues du Prof. Chen sont des événements (phase 2). En phase 1, la partie démarre avec une équipe fixe provisoire.
- Sources de règles dans la V1 (lecture seule, `legacy/` une fois la branche rangée) : `js/game/{loop,combat,stats,team,save}.js`, `js/data/constants.js`, `js/regions/kanto.js`.
- Plafond d'agents : **3 tickets `agent-ok` ouverts** en même temps. Flux continu, 1 à 2 tickets en cours, 1 PR en revue.

## Ordre et chemin critique

| Ordre | Ticket | Fourchette | Dépend de | `agent-ok` recommandé |
|---|---|---|---|---|
| 1 | A. Socle du dépôt (Vite, TS, Vitest, CI) | 1 à 2 j | nom du dépôt | non (configuration, fait par un humain) |
| 2 | L. Les quatre ADR | 1 j | rien | non (décisions de Nicolas) |
| 3 | B. Boucle de jeu au temps écoulé | 1 à 2 j | A | oui |
| 4 | C. Modèle Pokémon et stats par formule | 2 à 3 j | A, L (ADR 3) | oui |
| 5 | E. Graphe de zones et Route 1 en données | 2 à 3 j | A, L (ADR 2) | oui |
| 6 | F. Sauvegarde locale versionnée à trois niveaux | 2 à 3 j | A, L (ADR 1) | oui |
| 7 | I. Pipeline d'images | 2 j | A | oui |
| 8 | D. Combat, clic, DPS et plafond de 12 cps | 2 à 3 j | B, C | oui |
| 9 | G. Coquille d'interface mobile | 2 à 3 j | A | oui (renvoi `design/DESIGN.md`) |
| 10 | H. Écran de combat de la Route 1 | 2 à 3 j | D, E, F, G, I | oui |
| 11 | J. PWA installable | 1 à 2 j | G | oui |
| 12 | M. Essai de jalon sur téléphone réel | 0,5 à 1 j | H, J | non (Nicolas) |

**Chemin critique** : A → C → D → H → M. B, E, F, I, G se font en parallèle de C et D si l'on tient la limite de 2 tickets en cours : en pratique ils s'enchaînent.

**Fourchette du lot** : environ 18 à 28 jours de travail effectif (somme des bornes), pas des dates. Hypothèses : une personne qui relit, des agents qui produisent, une PR en revue à la fois. Elle se resserre après A et C (premiers vrais temps de cycle).

---

## A. `chore(socle): initialiser le dépôt Vite, React, TypeScript, Vitest et la CI`

Labels : `type:chore`, `etat:idee`, `est:1-2`, `prio:1` · branche : `chore/<n>-socle` · `agent-ok` : **non**

### Histoire
En tant que développeur du jeu, je veux un dépôt qui compile, se teste et se vérifie à chaque PR afin que tout ticket suivant parte d'un socle vert.

### Contexte
Rien n'existe. Pile validée : Vite, React, TypeScript, Zustand, Tailwind compilé, Vitest, PWA. Le cœur du jeu vit dans `src/core` (TypeScript pur, sans React ni DOM). Chemins prévus (À CONFIRMER) : `package.json`, `tsconfig.json`, `vite.config.ts`, `src/core/`, `src/ui/`, `data/`, `.github/workflows/ci.yml`, `.gitignore`. Dépend du **nom du dépôt** (question ouverte n° 1 du plan).

### Critères d'acceptation
- [ ] Étant donné un clone neuf, quand je lance `npm ci` puis `npm run build`, alors le build réussit sans avertissement TypeScript.
- [ ] Étant donné un test trivial dans `src/core`, quand je lance `npm test`, alors Vitest l'exécute et passe.
- [ ] Étant donné une PR vers `main`, quand la CI s'exécute, alors elle lance type-check, lint, tests et build, et échoue si l'un des quatre échoue.
- [ ] Étant donné une importation de `react` ou de `document` dans `src/core`, quand je lance le lint, alors il échoue (règle qui protège le cœur pur).
- [ ] Étant donné `data/`, quand le build tourne, alors aucun fichier de données n'est requis en dur dans le code (chargé par import JSON typé).

### Hors périmètre
Déploiement, compte en ligne, PWA (ticket J), contenu du jeu.

### Vérification
`npm ci && npm run build && npm test` en local ; première PR de test avec la CI verte puis une PR volontairement cassée pour voir la CI rouge.

### Effort et risques
Fourchette : 1 à 2 jours. Risque : choix des versions et des règles de lint (faible). Dépend de : le nom du dépôt.

**Pourquoi pas `agent-ok`** : configuration système et CI ; fait ou relu par un humain.

---

## L. `docs(adr): trancher les quatre décisions techniques de la phase 1`

Labels : `type:docs`, `etat:idee`, `est:1-1`, `prio:1` · branche : `docs/<n>-adr` · `agent-ok` : **non**

### Histoire
En tant que développeur du jeu, je veux les quatre décisions techniques écrites avant le code afin que les agents ne les réinventent pas chacun de leur côté.

### Contexte
`docs/plan.md` § « Décisions techniques à figer en phase 1 » : (1) modèle de sauvegarde à trois niveaux et migrations, (2) zones en graphe et événements en données, (3) stats des Pokémon par formule depuis PokeAPI, (4) fréquence d'enregistrement en ligne et conflits entre deux appareils. Fichiers à créer (À CONFIRMER) : `docs/adr/0001-sauvegarde.md` à `0004-synchro.md`.

### Critères d'acceptation
- [ ] Étant donné les quatre sujets, quand j'ouvre `docs/adr/`, alors il y a un fichier par décision avec : contexte, options écartées, décision, conséquences.
- [ ] Étant donné l'ADR 1, quand je le lis, alors il fixe : les trois niveaux (compte, partie, région), le champ de version, la règle « une migration par version », ce que contient chaque niveau.
- [ ] Étant donné l'ADR 2, quand je le lis, alors il fixe le format d'une zone (identifiant, liens, conditions de passage, boss) et d'un événement, avec un exemple Route 1 et un exemple Ronflex/Pokéflûte.
- [ ] Étant donné l'ADR 3, quand je le lis, alors il fixe la formule des stats, les champs conservés de PokeAPI et la façon de régénérer les données.
- [ ] Étant donné l'ADR 4, quand je le lis, alors il fixe la fréquence (proposition : 30 à 60 s et à la fermeture), la règle de conflit et la limite connue (triche acceptée).
- [ ] Chaque ADR porte la mention « décidé par Nicolas le <date> » avant de passer en `accepté`.

### Hors périmètre
Tout code ; choix du service en ligne (phase 4, l'ADR 4 pose seulement la règle).

### Vérification
Relecture de Nicolas ; les tickets C, E, F renvoient à l'ADR par son numéro.

### Effort et risques
Fourchette : 1 jour (rédaction par Claude, décisions par Nicolas). Risque : décisions repoussées, qui bloquent C, E, F. Dépend de : rien.

---

## B. `feat(core): faire tourner le jeu au temps écoulé`

Labels : `type:feat`, `etat:idee`, `est:1-2`, `prio:1` · branche : `feat/<n>-boucle` · `agent-ok` : oui (après A)

### Histoire
En tant que joueur, je veux que le jeu avance de la même façon que la page soit active, ralentie ou rouverte afin de ne jamais perdre ni gagner de progression à cause du navigateur.

### Contexte
La V1 utilise des `setInterval` (`legacy/js/game/loop.js`) et un auto-clic par minuteur (`js/ui/controls.js`). En V2 l'état vit hors React ; la boucle calcule à partir du **temps écoulé** (horloge injectable), et l'interface se rafraîchit à 10 Hz au maximum. Fichiers prévus (À CONFIRMER) : `src/core/loop.ts`, `src/core/clock.ts`, `src/core/loop.test.ts`.

### Critères d'acceptation
- [ ] Étant donné une horloge simulée, quand 5 000 ms s'écoulent en un seul pas, alors l'état avance exactement comme 50 pas de 100 ms.
- [ ] Étant donné un onglet suspendu 10 minutes puis rouvert, quand la boucle reprend, alors elle rattrape le temps écoulé en un nombre borné de pas (pas de gel de l'écran), avec un plafond documenté.
- [ ] Étant donné la boucle en marche, quand l'interface s'abonne à l'état, alors elle n'est notifiée que 10 fois par seconde au plus.
- [ ] Étant donné `src/core/loop.ts`, quand je le lis, alors il n'importe ni React ni `window` ni `document`.

### Hors périmètre
Expéditions hors ligne (phase 6) ; combat (ticket D) ; sauvegarde.

### Vérification
`npm test -- loop` (4 tests, un par critère, horloge simulée de Vitest).

### Effort et risques
Fourchette : 1 à 2 jours. Risque : plafond de rattrapage mal choisi (à fixer avec Nicolas). Dépend de : A.

---

## C. `feat(core): décrire un Pokémon et calculer ses stats par formule`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/<n>-pokemon` · `agent-ok` : oui (après A et ADR 3)

### Histoire
En tant que développeur du jeu, je veux générer les stats de tous les Pokémon par une formule et un script plutôt que les écrire à la main afin de tenir 1 025 Pokémon sans y perdre le projet.

### Contexte
Formules de la V1 : `legacy/js/game/stats.js` et `legacy/js/data/constants.js` (DPS = somme de stat × niveau / 5, puis bonus). Données de base issues de PokeAPI, sprites en local. Fichiers prévus (À CONFIRMER) : `src/core/pokemon.ts`, `src/core/stats.ts`, `data/pokemon.json` (généré), `scripts/generer-pokemon.mjs`, `src/core/stats.test.ts`.

### Critères d'acceptation
- [ ] Étant donné un Pokémon de `data/pokemon.json` et un niveau, quand j'appelle `calculerDps`, alors le résultat est identique à la V1 pour au moins 10 cas figés (tableau de valeurs relevées dans la V1).
- [ ] Étant donné un Pokémon shiny, quand j'appelle `calculerDps`, alors le bonus de dégâts shiny du réglage s'applique (valeur lue dans le JSON de réglage, pas en dur).
- [ ] Étant donné le script de génération, quand je le lance, alors `data/pokemon.json` est régénéré à l'identique (même contenu octet pour octet) et contient les 151 premiers Pokémon avec numéro, nom français, types, stats de base.
- [ ] Étant donné un Pokémon sans nom français dans la source, quand le script tourne, alors il échoue avec un message qui nomme le numéro, au lieu d'écrire un nom anglais.
- [ ] Étant donné `src/core`, quand je lance le lint, alors aucun appel réseau n'y figure (le réseau reste dans `scripts/`).

### Hors périmètre
Évolutions, bonheur, objets tenus, générations 2 et suivantes (le script les prendra par un paramètre, sans les générer ici).

### Vérification
`npm test -- stats` ; `node scripts/generer-pokemon.mjs` puis `git diff --stat` vide au second lancement.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : écarts de noms français et de formes entre PokeAPI et la V1 (à lister dans le ticket, pas à corriger à la main). Dépend de : A ; ADR 3 (L).

---

## E. `feat(monde): décrire les zones en graphe, avec la Route 1 en données`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/<n>-zones` · `agent-ok` : oui (après A et ADR 2)

### Histoire
En tant que développeur du jeu, je veux des zones décrites en JSON, reliées en graphe avec des conditions de passage, afin d'ajouter une région sans toucher au code.

### Contexte
Toute la V1 vit dans `legacy/js/regions/kanto.js` (liste linéaire). Cible : un graphe validé au chargement. Fichiers prévus (À CONFIRMER) : `src/core/monde.ts`, `src/core/conditions.ts`, `data/regions/kanto/zones.json`, `data/schemas/zone.schema.json`, `src/core/monde.test.ts`. Seule la Route 1 est saisie ; la saisie du reste de Kanto est la phase 2.

### Critères d'acceptation
- [ ] Étant donné `zones.json`, quand le jeu le charge, alors chaque zone a un identifiant unique, au moins un lien sortant (sauf la dernière) et des liens qui pointent vers des zones existantes.
- [ ] Étant donné un fichier avec un lien vers une zone inconnue, quand le chargement s'exécute, alors il échoue avec le message « Zone inconnue : <id> » (en français).
- [ ] Étant donné une zone dont la condition est « badge X », quand le joueur n'a pas ce badge, alors `peutPasser` renvoie faux avec la raison lisible ; avec le badge, il renvoie vrai.
- [ ] Étant donné les conditions `badge`, `boss vaincu`, `objet-clé`, `quête`, quand je lis `conditions.ts`, alors les quatre existent et sont testées une fois chacune.
- [ ] Étant donné la Route 1, quand je la lis, alors elle donne : 10 étapes, boss à l'étape 10, liste des Pokémon sauvages avec niveau et chance d'apparition.

### Hors périmètre
Les autres zones de Kanto, les événements (Ronflex, rival), la carte du monde.

### Vérification
`npm test -- monde` (cinq tests) ; ajouter volontairement un lien cassé et vérifier l'échec.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : format de condition trop rigide pour Ronflex et le rival (couvert par l'exemple de l'ADR 2). Dépend de : A ; ADR 2 (L).

---

## F. `feat(sauvegarde): enregistrer et restaurer la partie localement, en trois niveaux versionnés`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/<n>-sauvegarde` · `agent-ok` : oui (sauvegarde locale sans identité ; revue humaine obligatoire)

### Histoire
En tant que joueur, je veux retrouver ma partie telle que je l'ai laissée, et pouvoir l'exporter en JSON, afin de ne jamais perdre ma progression.

### Contexte
La V1 sauvegarde tout dans une clé `pokiClickerSave` (`legacy/js/game/save.js`). En V2 : trois niveaux (compte, partie, région) avec un numéro de version et des migrations, stockés en local pour l'instant. Fichiers prévus (À CONFIRMER) : `src/core/sauvegarde.ts`, `src/core/migrations/`, `src/core/sauvegarde.test.ts`, `src/ui/stockage-local.ts`.

### Critères d'acceptation
- [ ] Étant donné une partie en cours, quand j'enregistre puis je recharge, alors l'état restauré est égal à l'état enregistré (test aller-retour).
- [ ] Étant donné une sauvegarde de version N-1, quand je la charge, alors la migration vers N s'applique et aucune donnée n'est perdue (jeu d'essai figé dans `src/core/migrations/__fixtures__/`).
- [ ] Étant donné une sauvegarde d'une version plus récente que le jeu, quand je la charge, alors le jeu refuse avec « Cette sauvegarde vient d'une version plus récente du jeu » et ne l'écrase pas.
- [ ] Étant donné un JSON corrompu, quand je l'importe, alors un message en français explique le problème et la partie en cours reste intacte.
- [ ] Étant donné l'export, quand je réimporte le fichier produit, alors la partie est identique ; le fichier ne contient ni e-mail ni identifiant de compte.
- [ ] Étant donné deux régions, quand j'enregistre la région Kanto, alors le niveau région Johto n'est pas modifié.

### Hors périmètre
Compte en ligne, synchronisation, conflits entre appareils (phase 4), sauvegarde automatique à intervalle (ticket H).

### Vérification
`npm test -- sauvegarde` (6 tests) ; parcours manuel : export, vider le stockage, import.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : perte de données si la migration est mal écrite ; revue humaine du diff et des fixtures. Dépend de : A ; ADR 1 (L).

---

## I. `feat(images): traiter les images au bon format par script`

Labels : `type:feat`, `etat:idee`, `est:2-2`, `prio:2` · branche : `feat/<n>-images` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux des images qui ne sautent pas, ne laissent pas de bandes noires et se chargent vite afin de ne jamais voir un décor mal découpé.

### Contexte
Interdit de la marque n° 5 (`design/DESIGN.md`) : un seul ratio par type, `width` et `height` posés, sprite suivant préchargé. Décors 16:9 en 1920 × 1080 WebP, sprites 96 × 96 en facteur entier. Fichiers prévus (À CONFIRMER) : `scripts/traiter-images.mjs`, `public/img/`, `src/ui/Image.tsx`, `src/ui/precharger.ts`.

### Critères d'acceptation
- [ ] Étant donné un décor qui n'est pas en 16:9, quand le script tourne, alors il échoue en nommant le fichier et son ratio, sans le recadrer.
- [ ] Étant donné un dossier de décors valides, quand le script tourne, alors il écrit des WebP de 1920 × 1080 et un fichier de tailles (largeur, hauteur) lu par le composant.
- [ ] Étant donné le composant `Image`, quand il s'affiche, alors `width` et `height` sont posés (aucun décalage de mise en page) et le rendu des sprites est en `image-rendering: pixelated`.
- [ ] Étant donné un sprite à afficher à l'échelle, quand la largeur disponible n'est pas un multiple entier, alors le facteur d'échelle est arrondi à l'entier inférieur (jamais fractionnaire).
- [ ] Étant donné l'ennemi en cours, quand il reste 1 PV, alors le sprite du suivant est déjà chargé.
- [ ] Étant donné le build, quand je liste les requêtes réseau au chargement, alors aucune ne sort du domaine du jeu.

### Hors périmètre
Génération par IA des décors ; régénération des décors de la V1 (phase 5) ; cartes du monde.

### Vérification
`npm test -- images` ; `npm run build` puis liste des requêtes dans le navigateur (390 et 1440 px).

### Effort et risques
Fourchette : 2 jours. Risque : bibliothèque d'image native (sharp) sous Windows. Dépend de : A.

---

## D. `feat(core): résoudre le combat, le clic, le DPS et le plafond de 12 clics par seconde`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/<n>-combat` · `agent-ok` : oui (après B et C)

### Histoire
En tant que joueur, je veux que mes clics et mon équipe fassent avancer le combat, avec le clic qui compte toute la partie, afin de gagner en choisissant bien et non en laissant tourner un automate.

### Contexte
Règles V1 : `legacy/js/game/combat.js`, `legacy/js/game/stats.js`, `legacy/js/data/constants.js` (PV ennemi = base × niveau × 2 × multiplicateur de zone ; clic = 5 + 0,2 % du DPS, avec multiplicateurs). Plafond de **12 clics/s** décidé le 23/10. Fichiers prévus (À CONFIRMER) : `src/core/combat.ts`, `src/core/clic.ts`, `data/reglages.json`, `src/core/combat.test.ts`.

### Critères d'acceptation
- [ ] Étant donné un ennemi de PV connus et un DPS connu, quand 10 s s'écoulent sans clic, alors ses PV baissent de 10 × DPS (au plafond de 0).
- [ ] Étant donné un clic, quand il est enregistré, alors les dégâts valent 5 + 0,2 % du DPS, multiplicateurs inclus (6 cas figés issus de la V1).
- [ ] Étant donné 30 clics envoyés dans la même seconde, quand le combat résout, alors seuls 12 sont comptés ; avec 7 clics espacés, les 7 sont comptés.
- [ ] Étant donné un ennemi à 0 PV, quand le tick suivant arrive, alors le suivant apparaît et la fin d'étape est signalée une seule fois.
- [ ] Étant donné l'étape 10 d'une zone, quand l'ennemi est un boss, alors son PV utilise le multiplicateur boss du fichier de réglage (valeur lue dans `data/reglages.json`).
- [ ] Étant donné `combat.ts`, quand je le lis, alors aucune constante d'équilibrage n'est en dur.

### Hors périmètre
Capture, objets, bonheur, évolutions, minuteur de boss, expéditions.

### Vérification
`npm test -- combat` (6 tests, horloge simulée) ; comparer 6 valeurs avec la V1.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : formule V1 à lire avec précision (la V1 mélange bonus dans plusieurs fichiers) ; si l'écart dépasse 1 %, on s'arrête et on en parle. Dépend de : B, C.

---

## G. `feat(ui): poser la coquille d'interface mobile et ses jetons`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/<n>-coquille` · `agent-ok` : oui (renvoi `design/DESIGN.md`)

### Histoire
En tant que joueur sur téléphone, je veux une navigation basse et des écrans pensés pour le pouce afin de jouer en portrait sans zoomer.

### Contexte
Tout le style vient de `design/DESIGN.md`, `design/tokens.css` et `design/regions.css` ; ne pas redire la charte. Squelette : navigation basse à 5 entrées (Combat, Équipe, Shop, Carte, Plus), 56 px ; sur PC, navigation à gauche. Fichiers prévus (À CONFIRMER) : `src/ui/Coquille.tsx`, `src/ui/Navigation.tsx`, `src/styles/` (import des jetons), `src/ui/Coquille.test.tsx`.

### Critères d'acceptation
- [ ] Étant donné un écran de 390 px, quand la coquille s'affiche, alors la navigation est en bas, ses cibles font au moins 44 px, et il n'y a aucun défilement horizontal.
- [ ] Étant donné un écran de 1440 px, quand la coquille s'affiche, alors la navigation est à gauche.
- [ ] Étant donné `data-region="johto"` sur la racine, quand la page s'affiche, alors les couleurs de Johto s'appliquent sans changer le code des composants.
- [ ] Étant donné la navigation, quand j'appuie sur Tab, alors le focus est visible (anneau 3:1) ; l'entrée active se distingue par la forme et la couleur.
- [ ] Étant donné le code de `src/ui`, quand je le parcours, alors aucune couleur, taille ou rayon n'est en dur (tout vient des jetons).
- [ ] Captures à 390 et 1440 px jointes à la PR et vérifiées contre `design/DESIGN.md`.

### Hors périmètre
Contenu des écrans Équipe, Shop, Carte, Plus (page vide « Bientôt »), animations d'entrée, mode clair détaillé.

### Vérification
`npm test -- Coquille` ; captures Playwright à 390 et 1440 px.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : Tailwind et jetons CSS à brancher proprement. Dépend de : A.

---

## H. `feat(ui): jouer un combat de la Route 1 de bout en bout`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/<n>-combat-route-1` · `agent-ok` : oui (après D, E, F, G, I)

### Histoire
En tant que joueur, je veux cliquer sur un Pokémon sauvage de la Route 1, le battre avec mon équipe, voir les étapes avancer et retrouver ma partie en revenant afin de vérifier que les fondations tiennent.

### Contexte
Écran de combat selon `design/examples/2026-10-23-kanto-combat.html` et `design/DESIGN.md` (bouton d'action, barre de PV, étapes, carte de Pokémon). Branche le cœur (D), les zones (E), la sauvegarde (F), les images (I) et la coquille (G). Équipe de départ **fixe et provisoire**. Fichiers prévus (À CONFIRMER) : `src/ui/EcranCombat.tsx`, `src/ui/store.ts` (Zustand, abonnement à 10 Hz), `src/ui/BarrePv.tsx`, `src/ui/Etapes.tsx`.

### Critères d'acceptation
- [ ] Étant donné la Route 1 à l'étape 1, quand je touche le bouton « Attaque », alors les PV de l'ennemi baissent et un chiffre de dégâts monte puis s'efface.
- [ ] Étant donné l'étape 10, quand le boss est battu, alors un message de fin de zone s'affiche et l'écran propose la suite (zone suivante verrouillée si la condition n'est pas remplie, avec la raison en français).
- [ ] Étant donné une partie en cours, quand je ferme puis rouvre l'application, alors je reprends à la même étape avec les mêmes PV d'équipe (sauvegarde automatique toutes les 30 s et à la fermeture).
- [ ] Étant donné 12 appuis par seconde sur un téléphone, quand le combat tourne 60 s, alors l'image reste fluide (pas de chute sous 50 images/s sur le profil de mesure du navigateur) et l'interface n'est mise à jour que 10 fois par seconde au plus.
- [ ] Étant donné les écrans 390 et 1440 px, quand je les capture, alors aucune bande noire, aucun saut d'image, aucun texte en anglais.
- [ ] Étant donné une erreur de chargement des données, quand elle survient, alors un message en français dit quoi faire (« Recharge la page ; ta partie est gardée »).

### Hors périmètre
Capture, choix du starter, dialogues, Shop, équipe modifiable, hors-ligne.

### Vérification
Test de bout en bout Playwright (390 et 1440 px) : 10 étapes jusqu'au boss, rechargement, reprise ; mesure d'images par seconde.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : rafraîchissement de l'interface sur un téléphone moyen (risque R4 du registre). Dépend de : D, E, F, G, I.

---

## J. `feat(pwa): rendre le jeu installable et lisible hors connexion`

Labels : `type:feat`, `etat:idee`, `est:1-2`, `prio:2` · branche : `feat/<n>-pwa` · `agent-ok` : oui

### Histoire
En tant que joueur sur téléphone, je veux installer le jeu sur l'écran d'accueil et l'ouvrir sans réseau afin de jouer dans le train.

### Contexte
Plugin PWA de Vite ; le jeu n'a aucune ressource externe au chargement, donc tout peut être mis en cache. Fichiers prévus (À CONFIRMER) : `vite.config.ts`, `public/manifest.webmanifest`, `public/icons/` (icônes provisoires), `src/ui/MiseAJour.tsx`.

### Critères d'acceptation
- [ ] Étant donné le build de production, quand je l'ouvre dans Chrome mobile, alors l'invite « Installer » est proposée et le manifeste est valide (nom, icônes 192 et 512, couleur de fond du jeton `--fond`).
- [ ] Étant donné une première visite faite en ligne, quand je coupe le réseau et recharge, alors le jeu s'ouvre et la partie se charge.
- [ ] Étant donné une nouvelle version publiée, quand j'ouvre le jeu, alors un message « Une mise à jour est prête. Recharge pour l'utiliser. » apparaît et la partie en cours n'est pas perdue.
- [ ] Étant donné l'audit Lighthouse sur le build, quand je lance la catégorie PWA, alors il n'y a aucune erreur bloquante.

### Hors périmètre
Notifications, synchronisation en arrière-plan, vraies icônes (phase 5).

### Vérification
Audit Lighthouse ; essai réel sur un téléphone Android et iOS (iOS : ajout à l'écran d'accueil).

### Effort et risques
Fourchette : 1 à 2 jours. Risque : comportement du cache sur iOS. Dépend de : G.

---

## M. `test(jalon): jouer la Route 1 sur un téléphone réel et sur PC`

Labels : `type:test`, `etat:idee`, `est:1-1`, `prio:1` · branche : aucune · `agent-ok` : **non**

### Histoire
En tant que Nicolas, je veux valider le jalon de la phase 1 sur mes propres appareils afin de décider si on passe à Kanto.

### Contexte
Jalon : « Route 1 jouable sur téléphone et PC ». Définition de « fini » dans `docs/projet/charte.md`.

### Critères d'acceptation
- [ ] Étant donné un téléphone en portrait, quand je joue la Route 1 du début au boss, alors tout reste lisible et utilisable au pouce, sans zoom.
- [ ] Étant donné un PC (1440 px), quand je joue la même zone, alors la disposition suit `design/DESIGN.md`.
- [ ] Étant donné une partie fermée en cours de zone, quand je la rouvre sur le même appareil, alors je reprends où j'étais.
- [ ] Les écarts relevés deviennent des tickets `type:bug`, classés par priorité.

### Hors périmètre
Équilibrage (phase 3).

### Vérification
Parcours manuel, notes dans la PR ou dans un fichier `docs/projet/jalon-1.md`.

### Effort et risques
Fourchette : 0,5 à 1 jour. Dépend de : H, J.

---

## Décisions de Nicolas (23/10)

1. **Dépôt** : le dépôt existant `pokiclicker`, branche `v2` ; le nom du dépôt n'est plus une question. La V1 est rangée dans `legacy/`.
2. **Plafond de rattrapage de la boucle** (B) : 1 heure de temps de jeu rattrapé en jeu actif ; le reste relève des expéditions (phase 6).
3. **Équipe de départ provisoire** (H) : Bulbizarre niveau 5, remplacé par le choix animé en phase 2.
4. **On réutilise la V1** : règles, données, textes et sprites sont portés, pas réinventés.

## Reste à faire avant `etat:pret`

- Ranger la branche `v2` (V1 dans `legacy/`, docs, design, CLAUDE.md à la racine) : en attente de l'accord de Nicolas sur la disposition.
- Exécuter le ticket A, puis confirmer les chemins des autres.
