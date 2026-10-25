# Backlog — phase 2 « Kanto jouable »

Jalon : **Kanto terminable** (`docs/plan.md`). Brouillon du 24/10/2026, validé dans son découpage par Nicolas le 24/10 ; rien n'est créé sur un dépôt distant.

## Lecture du lot

- **Même règle qu'en phase 1** : on porte la V1 (règles, formules, données, textes, sprites), on ne repart pas de zéro. Un écart avec la V1 est un bug, **sauf** ceux listés dans « Corrections de la V1 » ci-dessous. Les valeurs attendues viennent du **vrai code de la V1** exécuté par un script (`scripts/extraire-*.mjs`, fixtures dans `tests/fixtures/`), jamais d'un calcul à la main.
- **Déjà livré en phase 1** (ne pas refaire) : boucle de jeu, DPS, clic, plafond de 12 clics/s, PV et boss ×4 des ennemis, zones en graphe (Route 1 et Forêt de Jade provisoire), sauvegarde locale à trois niveaux, coquille d'interface, pipeline d'images, écran de combat, PWA. La V1 est dans `legacy/` (lecture seule) ; le code V2 dans `src/core` (pur, sans DOM) et `src/ui`.
- **Les lettres A à Y deviendront des numéros réels à la création**, dans l'ordre. Tous les tickets restent `etat:idee` jusqu'à ce que Nicolas en passe un en « prêt » (« Lance le ticket X : passe-le en prêt et délègue-le »). Les dépendances dans le lot rendent un ticket « prêt sous condition » : aucun agent ne le prend tant que la dépendance n'est pas finie.
- **Toute page nouvelle passe par trois variantes** (règle de `CLAUDE.md`). Le ticket B les produit d'un coup pour les pages communes (Équipe, PC, fiche Pokémon, Sac, Shop, Carte, Plus avec Pokédex, Badges, Profil, boîte d'événement). Les pages annexes (Panthéon, Pension, Centre commercial, Casino) proposent leurs trois variantes **en première étape de leur propre ticket**, Nicolas choisit avant tout code.
- **Rien n'est poussé** sans accord de Nicolas. `agent-ok` recommandé sur tous les tickets ; **A demande une relecture humaine renforcée** (première vraie migration de sauvegarde).
- **Sources V1** (lecture seule) : `legacy/js/regions/kanto.js` (zones, badges), `legacy/js/data/constants.js` (objets, évolutions, dialogues, table de types, PV de base), `legacy/js/game/{combat,stats,capture,team,items,evolution,shop,daycare,casino,save}.js`, `legacy/js/ui/{render,update,summary,pantheon,victory,controls,mobile}.js`, `legacy/js/app/main.js`, `legacy/index.html`.

## Décisions de Nicolas (24/10), appliquées par défaut

1. **Décors** : les décors de la V1 (2784 × 1536, ratio 1,8125) sont refusés par le script d'images, qui ne recadre jamais. Pour la phase 2, ils sont recadrés **au centre à 16:9 (≈ 2 % de bord perdu) par un script de préparation séparé, marqué provisoire** jusqu'à la régénération des décors (phase 5). Ticket D.
2. **Sprites des 151** : téléchargés depuis PokeAPI/sprites (PNG 96 × 96, usage privé entre amis), **avec un nouvel accord de Nicolas au moment de l'exécution** (téléchargement de fichiers). Ticket D.
3. **Corrections de la V1** (listées ici, annoncées dans chaque ticket concerné) :
   - la pénalité d'échec de la Ligue teste la zone 20 (Route Victoire) au lieu de la zone 21 (Ligue) ;
   - descriptions incohérentes : Chaussures (÷1,5) et Bicyclette (×3) ne disent pas les délais réels (1 000 ms et 500 ms) ; l'écran Stats affiche « ×2 » pour Attaque + et Attaque Spé + alors que le code applique ×1,5 ; les descriptions des pierres disent « à venir » alors qu'elles sont implémentées ;
   - la Superball apparaît dans le Sac dès la zone 4 mais en boutique dès la zone 6 : alignée sur la zone 6 ;
   - le Jeton Shiny dit « force la prochaine rencontre » mais transforme un Pokémon de l'équipe en shiny : le texte est corrigé, la règle (transformer un Pokémon de l'équipe) est conservée ;
   - l'évolution ne recalcule pas l'XP maximale du Pokémon : recalculée ;
   - l'easter egg Évoli → Voltali/Aquali/Pyroli est inatteignable (Évoli absent de `EVOLUTIONS`) : rendu atteignable par l'évolution par pierre ;
   - le bonus « Johnny » (+50 % contre le type Ténèbres) ne sert à rien en génération 1 : non porté, noté.
4. **Rival, Ronflex, Pokéflûte** (ADR 0002, points ouverts) : **non tranchés**. Le ticket S reste « prêt sous condition » : Nicolas répond à « Ronflex : combat avant le passage ou réveil seul ? » et « rival : combat obligatoire ou facultatif ? ». La V1 n'a ni Ronflex bloquant ni rival scénarisé (le rival n'est qu'un boss de zone).
5. **Triche de la V1** (mot de passe en clair dans `cheats.js`) : **non portée**. Le ticket Y n'utilise aucune triche : il charge des sauvegardes de test à des étapes précises.
6. **Pages nouvelles** : trois variantes par page, en une fois pour les pages communes (ticket B), puis dans chaque ticket annexe.
7. **PC par région** (décision de conception, à confirmer) : le PC de la V1 devient le **PC de la région** (`pc` ajouté à la sauvegarde de région par A) ; les Pokémon y restent. Le **PC global** et le Pokédex national (phase 6) recevront des Pokémon par un mécanisme décidé alors.

## Vagues et chemin critique

| Vague | Tickets |
|---|---|
| 1. Données et socle | A, B, C, D |
| 2. Boucle de jeu | E, F, G |
| 3. Équipe et économie | H, I, J, K, L, M, N |
| 4. Histoire | O, P, Q, R, S |
| 5. Annexes | T, U, V, W, X |
| Transversal | Z |
| Jalon | Y |

Chemin critique : A → E → F → C → Q → R → Y. Hors phase 2 : quêtes, succès, diamants, skins (phase 4) ; expéditions, PC global, Pokédex national (phase 6) ; audio réel (phase 5) ; Johto (phase 6, la V1 n'a qu'un stub).

---

## A. `feat(sauvegarde): étendre la sauvegarde de région à tout Kanto et migrer de la version 1 à la version 2`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui, **relecture humaine renforcée** (migration)

### Histoire
En tant que joueur, je veux que ma partie garde tout ce qu'elle doit (inventaire, objets achetés, PC, Pokédex, pension, jetons, chronos) afin de retrouver exactement ma progression après fermeture, y compris après une mise à jour du jeu.

### Contexte
Le schéma de phase 1 (`src/core/sauvegarde-types.ts`, version 1) ne couvre que l'équipe, l'argent, l'inventaire, les badges et la zone. La phase 2 ajoute le nécessaire pour Kanto, d'après la liste des champs de la V1 (`legacy/js/game/save.js`, `loadData` et la fusion des valeurs par défaut). ADR 0001 : trois niveaux, enveloppe versionnée, migrations pures, pas d'état d'interface, pas d'import de la V1. Fichiers : `src/core/sauvegarde-types.ts`, `sauvegarde-validation.ts`, `sauvegarde.ts`, `migrations/index.ts`, fixtures `migrations/__fixtures__/`.

### Critères d'acceptation
- [x] Étant donné `DonneesRegion`, quand je le lis, alors il contient en plus : `pc` (liste de Pokémon, sans limite), `ameliorations` (liste d'objets à achat unique possédés), `jalonsRecus` (paliers du Pokédex déjà récompensés), `starterId`, `statistiques` (éliminations, argent total gagné), `chronos` (fins de repousse, de boosts, recharge du fauchage, en horodatages), `pension` (parents, œufs, emplacements), `jetons` (casino) et `arretAuto` (réglages d'arrêt) ; chaque champ a une valeur de départ lue dans `data/reglages.json` ou vide.
- [x] Étant donné `PokemonPossede`, quand je le lis, alors il porte aussi `sexe`, `favori` et un état d'œuf facultatif (`pasRestants`, `pasMax`) ; les validateurs rejettent un sexe ou un nombre de pas invalide avec un message français.
- [x] Étant donné une sauvegarde en version 1 (fixture figée), quand je la charge, alors `migrer` la fait passer en version 2 sans perdre aucun champ existant et sans écrire pendant la lecture ; la table de migrations contient la marche `1 → 2`.
- [x] Étant donné une sauvegarde en version 3 (inconnue), quand je la charge, alors le message exact « Cette sauvegarde vient d'une version plus récente du jeu. » s'affiche et rien n'est modifié.
- [x] Étant donné une partie en version 2, quand j'exporte puis j'importe, alors la partie importée est identique, régions comprises (`toEqual`).
- [x] Étant donné `VERSION_ACTUELLE`, quand je la lis, alors elle vaut 2, et le test de non-régression de phase 1 (aller-retour compte, partie, région) passe toujours.

### Hors périmètre
Chiffrement, synchronisation en ligne (phase 4), PC global et Pokédex national (phase 6), import de la sauvegarde V1.

### Vérification
`npm test -- sauvegarde migrations` ; fixtures `partie-v1.json` (existante) et `partie-v2.json` (nouvelle) comparées octet pour octet après migration ; relecture du diff par Nicolas.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : perte de données si la migration est mal écrite (relecture humaine du diff et des fixtures). Dépend de : phase 1 (faite).

---

## B. `design(ui): proposer trois variantes pour chaque page commune de Kanto`

Labels : `type:design`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui (maquettes jetables, Nicolas choisit)

### Histoire
En tant que Nicolas, je veux voir trois variantes de chaque nouvelle page avant qu'on code afin de choisir une seule fois, sans aller-retour ticket par ticket.

### Contexte
Règle de `CLAUDE.md` : trois variantes avant de polir. Pages communes : **Équipe** (liste, cartes, case vide), **fiche Pokémon** (résumé, renommer, favori, relâcher, envoyer au PC, bouton d'évolution), **PC** (liste triable), **Sac**, **Shop**, **Carte de Kanto**, **Plus** (menu avec Pokédex, Badges, Profil, Stats, Aide), **boîte d'événement** (dialogue de Chen et choix du starter). Base : `design/DESIGN.md`, `design/variantes/combat/` (modèle de la livraison de phase 1), `legacy/index.html` et `legacy/js/ui/{render,summary,controls,mobile}.js` pour la liste des écrans de la V1. Fichiers : `design/variantes/<page>/{a,b,c}-*.html`, `commun.css`, `commun.js` par page.

### Critères d'acceptation
- [x] Étant donné chaque page citée, quand j'ouvre `design/variantes/<page>/`, alors trois maquettes autonomes (A, B, C) se chargent sans ressource externe, avec les jetons de `design/tokens.css` et les mêmes données d'exemple.
- [x] Étant donné les écrans 390 et 1440 px, quand je capture chaque maquette, alors aucune bande, aucun débordement horizontal, aucun texte en anglais, cibles ≥ 44 px, texte ≥ 16 px sur mobile.
- [x] Étant donné chaque maquette, quand je la lis, alors un bandeau repliable donne en 3 lignes l'idée de la variante et son point faible.
- [x] Étant donné les captures à 390 et 1440 px de chaque variante, quand Claude les vérifie contre `design/DESIGN.md`, alors tout écart relevé est corrigé avant de te les présenter (l'agent ne voit pas le rendu).
- [x] Étant donné les pages « Shop » et « Boutique », quand je lis les maquettes, alors l'entrée de navigation s'appelle « Shop » (mot de Nicolas et de la V1).

### Hors périmètre
Code React des pages (dans les tickets H, I, L, G, N, P), pages annexes (Panthéon, Pension, Centre commercial, Casino : variantes dans leurs tickets), design définitif (phase 5).

### Vérification
Capture de chaque maquette à 390 et 1440 px par Claude ; parcours dans le navigateur ; Nicolas choisit une variante par page.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : Codex ne voit pas le rendu (en phase 1, trois défauts rattrapés par capture) ; prévoir un tour de correction après capture. Dépend de : rien.

---

## C. `feat(monde): saisir les 22 zones de Kanto en données, extraites du code de la V1`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux retrouver toutes les zones de Kanto de la V1 (Pokémon sauvages, boss, niveaux, difficulté) afin de jouer la même aventure.

### Contexte
V1 : `legacy/js/regions/kanto.js` (22 zones jouables, ids 0 à 21, plus 7 lieux spéciaux à ids négatifs : Pension −1, Labo −2, Chez Blue −3, Chez Maman −4, Panthéon −5, Centre commercial −6, Casino −7) et la table `ZONE_MULT` (1, 1, 1,5, 2,2, 3,5, 6, 11, puis +2,5 par zone jusqu'à 48,5 en zone 21 ; 100 pour le Labo). V2 : `data/regions/kanto/zones.json` ne contient que Route 1 et la Forêt de Jade provisoire ; format et validations dans `src/core/monde.ts` (ADR 0002). Les passages de la V1 sont linéaires (un seul entier `unlockedZone`, boss de la zone courante vaincu) : ils deviennent des liens `{ si: { type: "boss", zone } }`. Environ 115 entrées de Pokémon sauvages, raretés Commun à Légendaire. Fichiers : `data/regions/kanto/zones.json`, `scripts/extraire-zones-v1.mjs` (nouveau, sur le modèle de `scripts/extraire-references-v1.mjs`), `tests/fixtures/v1-zones.json`, `src/core/monde.test.ts`.

### Critères d'acceptation
- [x] Étant donné le code V1 exécuté par le script, quand je compare, alors chacune des 22 zones a, dans `zones.json`, les mêmes Pokémon (numéro, rareté, `apparition`, `capture`), niveaux min et max, boss (numéro, nom, niveau, capture) et `multiplicateurPv` (comparaison stricte, `toEqual`).
- [x] Étant donné les zones de passage, quand je lis `liens`, alors chaque zone `n` mène à `n+1` si le boss de `n` est vaincu, et l'ordre de la V1 est conservé ; Bourg Palette (zone 0, sans ennemi) est la zone de départ du monde, la Route 1 est la zone 1.
- [x] Étant donné les 7 lieux spéciaux, quand je lis le fichier, alors ils ne sont **pas** des zones : ils sont repérés par un champ `lieu` (pension, labo, chez-blue, chez-maman, pantheon, centre-commercial, casino) lu par les tickets qui en ont besoin, avec leur condition d'accès de la V1 (par exemple Pension, Centre commercial et Casino à la zone 11).
- [x] Étant donné les 8 arènes (zones 3, 5, 7, 11, 13, 15, 17, 18) et la Ligue (zone 21), quand je lis `zones.json`, alors chacune est marquée (`type: "arene" | "ligue"`) ; la Ligue porte ses 10 étapes de boss en données (détail dans Q).
- [x] Étant donné `chargerMonde`, quand je charge le fichier complet, alors la validation passe (identifiants uniques, liens valides, chemin du départ vers chaque zone, conditions connues) et un test vérifie qu'on peut aller du départ à la Ligue.
- [x] Étant donné un fichier volontairement cassé (zone inconnue), quand je le charge, alors le message français « Zone inconnue : kanto.route-99 » est levé.
- [x] Étant donné les décors, quand je lis `decor`, alors chaque zone pointe vers un fichier `kanto/<slug>.webp` produit par le ticket D (ce ticket ne génère aucune image).

### Hors périmètre
Images (D), carte cliquable (G), minuteur de boss et changement de zone (F), détail de la Ligue (Q), événements (O), Zones de Johto.

### Vérification
`npm test -- monde` ; `node scripts/extraire-zones-v1.mjs` deux fois : fixtures identiques (empreinte) ; revue Claude de trois zones prises au hasard contre le code V1.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : données volumineuses saisies par script (pas à la main) ; id textuels à choisir (`kanto.pont-pepite`). Dépend de : rien (phase 1 faite).

---

## D. `feat(images): préparer les décors de Kanto en 16:9 et les sprites des 151 Pokémon`

Labels : `type:feat`, `etat:fait`, `est:1-2`, `prio:1` · branche : `v2` · `agent-ok` : oui, **téléchargement soumis à l'accord de Nicolas**

### Histoire
En tant que joueur, je veux que chaque zone ait son décor et que chaque Pokémon ait son sprite, sans bande noire ni image qui saute, afin que le jeu soit complet à l'écran.

### Contexte
Le pipeline de phase 1 (`scripts/traiter-images.mjs`, `data/images.json`) **refuse** tout décor qui n'est pas en 16:9 et ne recadre jamais. Les décors V1 sont en 2784 × 1536 (ratio 1,8125) ; Zone 1 en 2816 × 1536 ; Zone 0 en 2048 × 2048 ; les lieux (Chez Blue 1053 × 692, Chez Maman 1201 × 656, Labo 2048 × 2048) ont d'autres ratios encore. Décision de Nicolas : recadrage central provisoire par un script de préparation **séparé**, signalé provisoire jusqu'à la phase 5. Sprites : 8 sont déjà dans `public/img/sprites/pokemon/` ; il manque 143 PNG de 96 × 96, à télécharger depuis `raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/<id>.png`. Fichiers : `scripts/preparer-decors-v1.mjs` (nouveau), `scripts/telecharger-sprites.mjs` (nouveau), `assets-src/` (ignoré par git), `public/img/`.

### Retours de Nicolas (24/10)
Ajout (24/10) : les **icônes officielles d'objets** que Nicolas veut retrouver (20 PNG de PokeAPI/sprites/items, voir `v1-visuel-a-porter.md` § 5), les **artworks des trois starters** (normal et shiny), l'image d'une Poké Ball et le **sprite animé de Roucarnage** du vol sont des ressources externes dans la V1 : on les rapatrie en local, avec le même accord à demander au moment du téléchargement. Rien ne se charge depuis Internet en V2.

### Critères d'acceptation
- [x] Étant donné les décors V1 de `legacy/img/kanto/background/`, quand `preparer-decors-v1.mjs` tourne, alors il écrit dans `assets-src/decors/` un PNG 16:9 par zone (recadrage central ; fichiers déjà en 16:9 inchangés), nommés d'après les identifiants de zone, et affiche pour chaque fichier la part de bord perdue ; un fichier de 2048 × 2048 ou plus étroit que 16:9 est refusé avec un message qui le nomme (pas de recadrage destructeur > 10 %) et sa liste est donnée à Nicolas.
- [x] Étant donné `assets-src/decors/`, quand `traiter-images.mjs` tourne, alors les décors sortent en WebP 1920 × 1080 dans `public/img/decors/` et `tailles.json` les liste.
- [x] Étant donné le script de préparation, quand je lis son en-tête, alors il est marqué « PROVISOIRE : à remplacer par les décors régénérés de la phase 5 » et les décors recadrés sont listés dans `docs/projet/decors-provisoires.md`.
- [x] Étant donné la liste des Pokémon de `data/pokemon.json` (151), quand `telecharger-sprites.mjs` tourne **après accord de Nicolas**, alors il télécharge uniquement les sprites manquants (face, 96 × 96), vérifie chaque taille avec `sharp`, refuse un fichier d'une autre taille, n'écrase rien, et ne contacte que `raw.githubusercontent.com`.
- [x] Étant donné `public/img/sprites/pokemon/`, quand je compte, alors il y a 151 PNG de 96 × 96 et `tailles.json` les liste ; un test vérifie que chaque `pokemon` d'une zone ou d'un boss a son sprite.
- [x] Étant donné les lieux spéciaux (Labo, Chez Maman, Chez Blue, Panthéon, Centre commercial, Casino), quand je liste les décors, alors ceux qui ne sont pas utilisables en 16:9 sont signalés pour être traités par leurs tickets (P, R, U, V).

- [x] Étant donné les icônes d'objets, les artworks des starters, la Poké Ball et l'oiseau du vol listés dans `v1-visuel-a-porter.md`, quand le pipeline d'images s'exécute, alors ils sont dans `public/img/` aux bons formats, avec leurs tailles dans `data/images.json`, et aucune URL externe ne subsiste dans le code.

### Hors périmètre
Régénération des décors (phase 5), sprites de dos, sprites de Chen, cartes, icônes d'objets (L), vidéo Daran (W).

### Vérification
`node scripts/preparer-decors-v1.mjs` puis `node scripts/traiter-images.mjs` ; `npm test -- images` ; Claude contrôle 5 décors recadrés à l'écran (390 et 1440 px) pour s'assurer que le recadrage ne coupe pas le panneau ou le sol.

### Effort et risques
Fourchette : 1 à 2 jours. Risque : téléchargement de fichiers (accord de Nicolas obligatoire) ; recadrage qui coupe un élément important. Dépend de : C (liste des décors), mais peut démarrer avant.

---

## E. `feat(combat): donner l'argent, l'XP, les niveaux et le bonheur à chaque ennemi vaincu`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux gagner de l'argent et de l'expérience en battant des Pokémon afin que mon équipe progresse et que je puisse acheter des objets.

### Contexte
V1 : `legacy/js/game/combat.js` (`killEnemy`, l. 227-369), `stats.js` (`calculateGoldReward`, `calcMaxXp`). V2 : `src/core/combat.ts` (événement `ennemi-vaincu`), `src/ui/store.ts`, `src/core/reglages.ts` et `data/reglages.json` (clés `bonus`, déjà présentes). **Règles V1 à reproduire** : or = `floor((niveau×4 + niveau^1,4) × m)` avec m = 10 pour un boss, 3 pour Rare et Très Rare, 20 pour Légendaire, sinon 1 ; puis multiplicateurs (Pièce Rune ×1,3, CT Jackpot ×1,2, badge Prisme ×1,2, shiny ×5) ; XP = `floor(PV de base × niveau × 2,2)`, ×5 pour un boss, puis Multi Exp ×1,5, Œuf Chance ×1,5, Omni Exp ×2, badge Âme ×1,5 ; un shiny vaincu rapporte +5 Bonbons ; chaque Pokémon de l'équipe (hors œuf, niveau < 100) reçoit l'XP **complète**, sans partage ; **un seul niveau gagné par ennemi vaincu** ; `maxXp = floor(50 × niveau^2,2 × tier)` avec tier 0,8 si puissance < 100, 1,2 si > 180, sinon 1 ; niveau maximum 100 ; bonheur +1 par ennemi vaincu pour chaque membre (plafond 255) si niveau du Pokémon − niveau de l'ennemi ≤ 25 ; délai avant l'ennemi suivant 2 000 ms (1 000 avec Chaussures, 500 avec Bicyclette, /1,2 avec le badge Terre, ×0,9 au palier 50). Les **multiplicateurs d'objets, de badges et de paliers sont des sources branchées plus tard** (L, M, N) : ce ticket fournit le calcul et la table de multiplicateurs en données.

### Critères d'acceptation
- [x] Étant donné les 22 scénarios de la V1 (niveau, rareté, boss ou non, shiny, avec et sans multiplicateurs), quand je compare l'or et l'XP de `src/core`, alors les valeurs sont strictement égales à celles du code V1 exécuté (fixture `tests/fixtures/v1-recompenses.json`).
- [x] Étant donné un ennemi vaincu, quand l'événement est traité, alors l'argent de la région augmente, `statistiques` est mise à jour, chaque Pokémon éligible reçoit l'XP et gagne au plus un niveau, et son `maxXp` suit la courbe V1 jusqu'au niveau 100.
- [x] Étant donné un Pokémon de niveau 100, quand l'XP arrive, alors il n'en reçoit pas ; un œuf n'en reçoit pas.
- [x] Étant donné un écart de niveau supérieur à 25, quand l'ennemi est vaincu, alors le bonheur n'augmente pas ; sinon il augmente de 1 jusqu'à 255.
- [x] Étant donné un shiny vaincu, quand l'événement est traité, alors 5 Bonbons sont ajoutés à l'inventaire.
- [x] Étant donné les délais de la V1, quand un ennemi est vaincu, alors le suivant apparaît après 2 000 ms de temps de jeu (valeur lue dans `data/reglages.json`), avec la table de réducteurs prête pour les objets.
- [x] Étant donné l'écran de combat, quand je joue, alors l'argent affiché est celui de la région (plus de « 1 250 pièces » provisoire), chaque carte d'équipe montre son niveau et une barre d'XP, et un message bref signale une montée de niveau (sans défilement de page, dialogue toujours visible).

### Hors périmètre
Sources des multiplicateurs (objets L et M, badges et paliers N), capture (J), évolutions (K), dépense d'argent.

### Vérification
`npm test -- recompenses` ; `node scripts/extraire-recompenses-v1.mjs` (nouveau) deux fois : fixture identique ; captures 390 et 1440 px.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : bonus d'objets de la V1 mélangés dans plusieurs fichiers (revue de la table). Dépend de : A.

---

## F. `feat(zones): minuteur de boss de 30 s, progression d'étape et changement de zone`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux affronter chaque boss avec un temps limité et passer à la zone suivante quand je le bats afin de progresser dans Kanto.

### Contexte
V1 : `combat.js` (`killEnemy` l. 310-369, `startBossTimer`), `update.js` (`updateZone`). V2 : `src/core/combat.ts` (`creerCombat`, `reprendreCombat`, événement `boss-vaincu`), `src/core/monde.ts` (`peutPasser`, `zonesOuvertes`), `src/ui/store.ts`, `src/ui/EcranCombat.tsx`, `src/ui/DialogueChen.tsx`. **Règles V1** : étapes 1 à 9 sauvages, 10 boss ; minuteur de **30 s** sur chaque boss (barre de temps), échec = retour à l'étape 9 de la zone ; vaincre le boss de la zone courante ouvre la zone suivante ; on peut revenir dans une zone déjà ouverte ; la zone 0 (Bourg Palette) n'a pas d'ennemi ; pénalité d'échec de la Ligue (retour à l'étape 1) : **correction de la V1** : la V1 teste la zone 20, la bonne zone est la Ligue (zone 21).

### Critères d'acceptation
- [x] Étant donné l'étape 10, quand le boss apparaît, alors un minuteur de 30 s (valeur dans `data/reglages.json`) démarre, visible en barre ; en temps de jeu simulé, il tombe à 0 après 30 000 ms.
- [x] Étant donné un boss non vaincu à 0 s, quand le minuteur expire, alors le combat revient à l'étape 9 de la même zone avec un nouvel ennemi sauvage et un message en français ; en Ligue, le retour se fait à l'étape 1 de la Ligue (zone 21, non 20).
- [x] Étant donné un boss vaincu avant la fin, quand l'événement `boss-vaincu` est traité, alors la zone est marquée vaincue, la zone suivante est ouverte, et l'écran propose « Zone suivante » (bouton actif) au lieu du texte « La suite arrive bientôt. ».
- [x] Étant donné une zone ouverte, quand je choisis une autre zone ouverte (par le sélecteur provisoire de la page Combat, remplacé par la carte en G), alors le combat bascule, les sprites et le décor de la zone sont préchargés, l'étape repart à 1 et la sauvegarde est écrite.
- [x] Étant donné une zone fermée, quand j'essaie d'y aller, alors le bouton est désactivé avec la raison en français donnée par `peutPasser`.
- [x] Étant donné un rechargement, quand je rouvre, alors je reprends dans la même zone et la même étape (l'ennemi en cours n'est pas sauvegardé).
- [x] Étant donné la Bourg Palette (zone 0), quand j'y entre, alors aucun ennemi n'apparaît et le message de la zone s'affiche.

### Hors périmètre
Carte cliquable (G), Ligue complète (Q), badges (N), événements de zone (O), animation de voyage de 3,3 s.

### Vérification
`npm test -- zones boss` (horloge simulée) ; e2e Playwright : battre la Route 1 puis aller dans la zone 2, recharger.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : état du minuteur à ne pas sauvegarder ni rattraper hors ligne ; interaction avec le rattrapage de la boucle. Dépend de : A, C, E.

---

## G. `feat(ui): carte de Kanto avec zones cliquables positionnées en pourcentages`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux voir la carte de Kanto et toucher une zone pour y aller afin de me repérer et de revenir farmer une zone précédente.

### Contexte
V1 : `MAP_DATA` (24 zones cliquables en rect, cercle ou polygone, en **pixels** sur `kanto.png`), `flyToZone` (`save.js` l. 717, animation de 3,3 s), `showZoneInfo` (boutons Centre commercial et Casino pour la zone 11). Lavanville et « Daran Ass » sont grisées. ADR 0002 : `carte` en **fractions de l'image** (0 à 1). V2 : onglet « Carte » de `src/ui/Navigation.tsx` encore en `PageBientot`. La variante de page est choisie par Nicolas sur les maquettes du ticket B. Fichiers : `src/ui/CarteKanto.tsx` (nouveau), `data/regions/kanto/zones.json` (champ `carte`), `scripts/convertir-carte-v1.mjs` (nouveau, pixels vers fractions).

### Retours de Nicolas (24/10)
**Choix de Nicolas (24/10).** Variante **A** (carte plein cadre) + la **barre « Ton voyage »** de la variante C. La fiche de la zone est **dans la carte** mais ne doit pas cacher le bas : fiche plus petite, ou carte plus grande avec un emplacement réservé. Au clic, afficher le **numéro de zone** (pour savoir quand on y accède). **Pas de tracé de chemin.** La carte actuelle est « pourrie » : on reprend **la carte de la V1** (`legacy/img/kanto/kanto.png`, 24 zones en image mapping SVG, coordonnées en pixels natifs d'une image 1920 × 1080 à convertir en pourcentages) avec ses **animations** : téléportation « vol Gen 1 » (3,8 s : dresseur animé, overlay en télé CRT, oiseau, changement de zone derrière l'overlay), clignotement vert du tutoriel, pulsation de la zone actuelle, et une **vraie animation de déblocage d'une zone** (la V1 n'en avait pas sur la carte). Détail : `v1-visuel-a-porter.md` § 1. Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).

### Critères d'acceptation
- [x] Étant donné `MAP_DATA` de la V1, quand le script convertit, alors chaque forme est écrite en fractions de l'image (rect, cercle, polygone) dans `zones.json`, avec les ratios de l'image V1 ; un test compare un échantillon de 5 zones avec le calcul indépendant.
- [x] Étant donné la page Carte, quand je l'ouvre, alors l'image de Kanto s'affiche à son ratio sans bande, les zones ouvertes sont cliquables (cible ≥ 44 px au toucher), les zones fermées sont grisées avec la raison en français au toucher, la zone actuelle est mise en évidence par la forme et la couleur.
- [x] Étant donné une zone ouverte, quand je la touche, alors un petit panneau donne son nom et le bouton « Y aller » ; la zone 11 ajoute les accès Centre commercial et Casino (actifs quand les tickets U et V sont livrés).
- [x] Étant donné un téléphone, quand j'utilise la carte, alors elle se déplace au doigt et se zoome au pincement sans faire défiler la page (mode debug « afficher les zones » activable par l'adresse `?debug=carte`).
- [x] Étant donné les écrans 390 et 1440 px, quand je les capture, alors aucune bande ni défilement horizontal, aucun texte en anglais.
- [x] Étant donné la carte de la V1, quand je la compare à la V2, alors les 24 zones sont aux mêmes endroits (coordonnées de `MAP_DATA` converties en pourcentages, test sur chaque zone) avec leur forme (rectangle, cercle, polygone), et les zones qui se chevauchent gardent l'ordre de la V1.
- [x] Étant donné un clic sur une zone, quand la fiche s'ouvre, alors elle affiche le nom, « Zone N », la miniature du décor et le bouton « Y aller » (ou « Bloquée » avec la raison), dans la carte, sans cacher le bas de la carte ; Céladopole propose Arène, Centre commercial et Casino.
- [x] Étant donné « Y aller », quand je valide, alors l'animation de vol de la V1 se joue (≈ 3,8 s, dresseur animé, overlay en télé CRT, oiseau), le changement de zone a lieu derrière l'overlay et un second clic pendant l'animation est ignoré ; avec `prefers-reduced-motion`, la zone change avec un simple fondu.
- [x] Étant donné une zone qui vient d'être débloquée, quand je rouvre la carte, alors une animation de déblocage (propre à la V2) la fait passer du gris à sa couleur, après le message « Zone débloquée ! » de la V1.
- [x] Étant donné la barre « Ton voyage », quand je regarde la carte, alors elle montre la progression (badges sur 8, zone actuelle) ; la Route 1 clignote en vert tant qu'elle n'a pas été visitée (tutoriel de la V1).

### Hors périmètre
Carte du monde et Johto (phase 6), régénération de l'image (phase 5).

### Vérification
Tests unitaires de conversion ; Playwright : toucher une zone ouverte, y aller ; capture à 390 et 1440 px.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : l'image `kanto.png` de la V1 a un ratio propre (à vérifier) ; gestes tactiles de la carte. Dépend de : B (variante), C, F.

---

## H. `feat(equipe): afficher l'équipe et la fiche d'un Pokémon, le renommer, le mettre en favori et le relâcher`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux gérer mon équipe de 6 Pokémon et consulter chaque fiche afin de choisir qui combat.

### Contexte
V1 : `legacy/js/game/team.js` (122 l.), `legacy/js/ui/summary.js` (254 l.). V2 : `src/ui/CarteEquipe.tsx`, `src/ui/EcranCombat.tsx`, onglet « Équipe » encore en `PageBientot`. **Règles V1** : équipe de 6 au plus ; champs d'un Pokémon (id, niveau, shiny, sexe, bonheur, XP, favori, calcium, pierre Stase, surnom, œuf) ; fiche Résumé avec « Envoyer au PC » et « Placer dans l'équipe » ; mode échange quand l'équipe est pleine ; **au moins 1 Pokémon et 1 non-œuf** dans l'équipe ; renommer (≤ 12 caractères) ; favori ; relâcher avec confirmation. Le sexe suit les listes `GENDERLESS_IDS`, `ALWAYS_MALE_IDS`, `ALWAYS_FEMALE_IDS` de `constants.js`. Variante de page : choix de Nicolas (ticket B).

### Retours de Nicolas (24/10)
**Choix de Nicolas (24/10).** Page Équipe : variante **A** (liste + détail). Fiche Pokémon : variante **B** (fenêtre superposée, pas une page) ; à corriger par rapport à la maquette : le défilement doit marcher quand le curseur est sur la fiche, l'étoile « Retire des favoris » doit être alignée avec son texte, la fiche affiche le **nom de l'espèce** en plus du surnom. Reprendre de la V1 : anneau de bonheur (`conic-gradient`), détail des bonus de dégâts, menu contextuel au clic droit (Résumé, Retirer l'objet). Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).

### Critères d'acceptation
- [x] Étant donné l'onglet Équipe, quand je l'ouvre, alors je vois 6 cases (Pokémon ou case vide) avec sprite, nom, niveau, barre d'XP et DPS, le DPS total, sans chevauchement ni défilement horizontal à 390 px.
- [x] Étant donné un Pokémon, quand je touche sa carte, alors sa fiche s'ouvre (sprite, niveau, XP, bonheur, sexe, shiny, calcium, objets tenus, types, DPS) ; elle se ferme au toucher extérieur et à la touche Échap.
- [x] Étant donné une fiche, quand je renomme avec 13 caractères, alors la saisie est refusée avec un message français ; avec 12 caractères, le surnom est enregistré.
- [x] Étant donné une fiche, quand je mets en favori, alors l'étoile s'affiche et la valeur survit au rechargement.
- [x] Étant donné un Pokémon, quand je le relâche, alors une confirmation en français est demandée ; confirmée, il disparaît ; il est impossible de relâcher le dernier Pokémon non-œuf de l'équipe.
- [x] Étant donné une équipe de 1 Pokémon, quand je tente de l'envoyer au PC, alors c'est refusé avec la raison ; avec 2 Pokémon et au moins un non-œuf restant, c'est accepté. (règle codée et testée dans le cœur ; le bouton de la fiche s’active avec le ticket I)
- [x] Étant donné une équipe pleine, quand je place un Pokémon du PC, alors le mode échange propose le Pokémon à remplacer. (mode échange codé et affiché ; déclenché depuis le PC au ticket I)
- [x] Étant donné le sexe d'une espèce, quand un Pokémon est créé, alors il respecte les listes de la V1 (sans sexe, toujours mâle, toujours femelle, sinon tirage au hasard) ; un test le prouve sur toutes les espèces.
- [x] Étant donné la fiche d'un Pokémon surnommé, quand je l'ouvre, alors elle montre le surnom ET le nom de l'espèce ; l'étoile « favori » est alignée avec son texte ; je peux faire défiler la fiche à la molette ou au doigt, curseur posé dessus.
- [x] Étant donné la fiche ouverte, quand je la ferme (bouton, touche Échap ou toucher à côté), alors je reviens à la liste de l'équipe sans perdre ma place ; le fond ne défile pas derrière.

### Hors périmètre
PC (I), évolution (K), objets (M), œuf (T), renommage à effet d'easter egg (W, qui s'accroche à ce renommage).

### Vérification
`npm test -- equipe` ; Playwright 390 et 1440 px ; captures vérifiées contre `design/DESIGN.md`.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : fiche en feuille basse sur mobile (jamais plus d'une demi-hauteur). Dépend de : A, B, E.

---

## I. `feat(pc): ranger les Pokémon dans le PC de la région et suivre le Pokédex de Kanto`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux un PC pour ranger mes Pokémon en trop et un Pokédex qui montre ce que j'ai capturé afin de collectionner les 151 Pokémon.

### Contexte
V1 : `team.js`, `summary.js`, `render.js` (`renderPC`, `renderPokedex`), `state.pc`, `state.pokedex` (tableau d'identifiants capturés, **pas de « vu »**). **Règles V1** : le PC est débloqué à la zone 3 ; liste illimitée sans boîtes ; tri par numéro, nom, niveau ou favori ; la pagination de la V1 (`PC_PAGE_SIZE`) est du code mort, **non portée** ; le Pokédex a 151 cases ; il est alimenté par capture, évolution, éclosion, achat au casino et starter. Décision de conception n° 7 : ce PC est le **PC de la région** (`pc` dans `DonneesRegion`, ticket A) ; le Pokédex de Kanto est dans `pokedexNational` (niveau partie, déjà dans le schéma). Pages : choix de Nicolas (B). Fichiers : `src/ui/PagePC.tsx`, `src/ui/Pokedex.tsx` (nouveaux), `src/core/pc.ts` (nouveau, fonctions pures : ajouter, retirer, trier, échanger).

### Retours de Nicolas (24/10)
**Choix de Nicolas (24/10).** PC : variante **B** (grille + détail). Ajouts demandés : une **barre de recherche** (par nom ou numéro), un **tri par shiny**, et sur PC la **liste de l'équipe à droite, au-dessus de la fiche du Pokémon** (équipe d'abord, fiche en dessous, défilement si c'est trop grand). Pokédex : celui de la V1 (grille de 151, silhouettes, paliers) dans Plus. Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).

### Critères d'acceptation
- [x] Étant donné la zone 2 ouverte seulement, quand j'ouvre le menu, alors le PC est verrouillé avec la raison en français ; à la zone 3 il est accessible.
- [x] Étant donné 30 Pokémon dans le PC, quand je change le tri (numéro, nom, niveau, favori), alors l'ordre change comme dans la V1 (comparaison avec le code V1 sur un jeu d'essai) ; la liste défile sans bloquer la page.
- [x] Étant donné un Pokémon du PC, quand je le place dans l'équipe, alors il quitte le PC ; si l'équipe est pleine, le mode échange d'H s'applique ; le PC n'a pas de limite de taille.
- [x] Étant donné le Pokédex, quand je l'ouvre, alors 151 cases s'affichent dans l'ordre national (capturé : sprite et nom ; non capturé : silhouette et « ??? »), avec le compteur « n / 151 » ; une espèce n'apparaît capturée qu'après capture, évolution, éclosion, achat de casino ou choix du starter.
- [x] Étant donné une capture d'une espèce déjà possédée, quand elle arrive, alors le doublon est autorisé (comme en V1) et le Pokédex ne change pas. (capture elle-même au ticket J : `noterEspece` est prêt)
- [x] Étant donné un rechargement, quand je rouvre, alors le PC et le Pokédex sont identiques (`toEqual` sur la région et la partie).
- [x] Étant donné 30 Pokémon dans le PC, quand je tape une partie d'un nom ou un numéro dans la recherche, alors la grille ne garde que les correspondances (sans tenir compte des accents ni de la casse) ; effacer la recherche rétablit tout.
- [x] Étant donné le tri, quand je choisis « Shiny », alors les shiny passent en premier, puis l'ordre par numéro ; la liste de l'équipe est affichée à droite au-dessus de la fiche (sur mobile, au-dessus de la grille ou dans un onglet).

### Hors périmètre
PC global et Pokédex national complet (phase 6), expéditions, Pokédex « vu » (absent de la V1), paliers de récompenses (N).

### Vérification
`npm test -- pc pokedex` ; Playwright 390 et 1440 px ; captures.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : la décision « PC de région » est à confirmer par Nicolas avant la phase 6. Dépend de : A, B, H.

---

## J. `feat(capture): capturer un Pokémon sauvage avec une balle et régler l'arrêt automatique`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux capturer des Pokémon sauvages avec des balles afin de compléter mon Pokédex et de renforcer mon équipe.

### Contexte
V1 : `legacy/js/game/capture.js` (137 l.), `combat.js` (`autoStopSettings`). V2 : `src/core/ennemis.ts` (champ `capture` déjà présent), `src/core/combat.ts`, `src/ui/EcranCombat.tsx`. **Règles V1** : balles Poké ×1, Super ×2, Hyper ×4, Master = 100 % ; `chance = (taux/255 × (3·PVmax − 2·PV)/(3·PVmax) × mult) / (1 + niveau/25)`, ×1,3 avec le badge Marais ; s'applique à l'ennemi vivant ; animation d'1 s ; **la balle est consommée même en cas d'échec** ; les boss ont un taux de 0 (capture impossible) ; succès : ajout au Pokédex, dans l'équipe si elle a moins de 6 Pokémon sinon au PC ; le nom perd ses parenthèses, le niveau de l'ennemi est conservé ; shiny 1/256 (déjà porté), ×3 avec le Charme Chroma, ×2 au palier 151, jamais sur un boss ; **auto-attaque** activable et **arrêt automatique** sur rareté, shiny ou nouvelle espèce (`autoStopSettings`, 7 réglages). Les balles s'achètent en L ; en attendant, le test les place dans l'inventaire. Toucher la scène attaque (décidé) : la capture est un geste séparé.

### Critères d'acceptation
- [x] Étant donné les 30 situations de la V1 (taux, PV, niveau, balle, badge Marais), quand je compare la probabilité de capture, alors les valeurs sont strictement égales à celles du code V1 (fixture `tests/fixtures/v1-capture.json`).
- [x] Étant donné une balle et un ennemi sauvage vivant, quand je lance, alors une animation d'1 s se joue, la balle est consommée, et le résultat (capturé ou échappé) est décidé par un tirage injecté (tests déterministes).
- [x] Étant donné un boss, quand j'ouvre le Sac, alors les balles sont désactivées avec la raison « Ce Pokémon ne peut pas être capturé. ».
- [x] Étant donné une capture réussie, quand l'équipe a moins de 6 Pokémon, alors il la rejoint ; sinon il va au PC ; le Pokédex est mis à jour ; l'ennemi est remplacé sans récompense d'XP (la V1 donne `or×2` et ni XP ni kill : conservé).
- [x] Étant donné une Master Ball, quand je lance, alors la capture réussit toujours sauf sur un boss.
- [x] Étant donné l'auto-attaque, quand je la désactive, alors l'ennemi n'est plus blessé par le DPS (seuls les clics comptent) ; quand l'arrêt automatique est réglé sur « shiny », « rare » ou « nouveau », alors l'auto-attaque s'arrête à l'apparition d'un ennemi correspondant et un message le dit.
- [x] Étant donné les réglages d'arrêt, quand je recharge, alors ils sont conservés (préférences du compte, pas de l'interface).

### Hors périmètre
Achat des balles (L), Radar (M), Charme Chroma et palier 151 (N), Jeton Shiny (M).

### Vérification
`npm test -- capture` ; `node scripts/extraire-capture-v1.mjs` (nouveau) deux fois : fixture identique ; Playwright : capturer à 390 px.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : l'auto-attaque désactivable change la boucle de phase 1 (DPS toujours actif) : traiter dans `avancerCombat` par une option, pas par un second moteur. Dépend de : A, H, I.

---

## K. `feat(evolution): faire évoluer un Pokémon par niveau ou par pierre`

Labels : `type:feat`, `etat:pret`, `est:2`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux faire évoluer mes Pokémon afin d'augmenter leur puissance et de compléter mon Pokédex.

### Contexte
V1 : `legacy/js/game/evolution.js` (62 l.), `constants.js` (`EVOLUTIONS` : 56 entrées par niveau ; `STONE_EVOLUTIONS` : 14 entrées dont Évoli à 3 branches). **Règles V1** : l'évolution par niveau est un **bouton « EVO » manuel** dans l'équipe, proposé quand le niveau requis est atteint ; l'évolution par pierre consomme la pierre ; l'évolution lance une animation de 3 s qui suspend l'auto-DPS ; aucune évolution par bonheur ; l'évolution met le Pokédex à jour. **Corrections de la V1** : l'XP maximale est recalculée après l'évolution ; Évoli devient atteignable pour Voltali, Aquali et Pyroli par les pierres. Fichiers : `data/evolutions.json` (nouveau, converti par script), `src/core/evolution.ts` (nouveau), `src/ui/` (bouton et animation).

### Critères d'acceptation
- [ ] Étant donné `EVOLUTIONS` et `STONE_EVOLUTIONS` de la V1, quand le script convertit, alors `data/evolutions.json` contient les 56 + 14 entrées (espèce, niveau ou pierre, cible) ; un test compare avec la V1 (hors Évoli, qui est ajouté avec ses trois pierres).
- [ ] Étant donné un Pokémon au niveau requis, quand je regarde l'équipe, alors le bouton « Évoluer » apparaît ; en dessous du niveau il est absent ; le niveau requis est affiché dans la fiche.
- [ ] Étant donné un clic sur « Évoluer », quand l'animation de 3 s se joue, alors l'auto-DPS de ce Pokémon est suspendu (temps de jeu simulé en test), puis l'espèce change, son sprite change, le Pokédex est mis à jour et son `maxXp` est recalculé.
- [ ] Étant donné une pierre dans l'inventaire et un Pokémon compatible, quand je l'utilise, alors la pierre est consommée et l'évolution se produit ; sur un Pokémon incompatible, un message en français refuse sans consommer la pierre.
- [ ] Étant donné un Pokémon avec une Pierre Stase, quand je tente d'évoluer, alors c'est bloqué avec la raison.
- [ ] Étant donné un Évoli, quand j'utilise la pierre Foudre, Eau ou Feu, alors il évolue en Voltali, Aquali ou Pyroli.

### Hors périmètre
Évolution par bonheur ou par échange, évolutions de Johto et au-delà, œufs (T).

### Vérification
`npm test -- evolution` ; Playwright : faire évoluer un Pokémon de test.

### Effort et risques
Fourchette : 2 jours. Risque : cohérence des DPS après évolution (stats de base différentes). Dépend de : H (équipe et fiche), M (pierres, pour le cas pierre ; le cas niveau peut être livré avant).

---

## L. `feat(shop): Sac, Shop, balles, Bonbons et objets à effet permanent`

Labels : `type:feat`, `etat:fait`, `est:3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux acheter des objets avec mon argent afin d'aller plus vite et de vaincre des boss plus difficiles.

### Contexte
V1 : `legacy/js/game/shop.js` (42 l.), `items.js`, `constants.js` (`ITEMS`, 31 entrées), `render.js` (`renderShop`). V2 : onglet « Shop » encore en `PageBientot` ; bonus déjà décrits dans `data/reglages.json` (clés `objet:protein`, `objet:hardStone`…). Pages : choix de Nicolas (B). **Règles V1** : le Shop se débloque à la zone 2 ; un objet apparaît quand `zone ouverte ≥ zone de l'objet` ou quand on est dans cette zone ; prix des consommables = `base × (1 + 0,05 × nombre de badges)` (sauf `noBadgeInflation`), puis ×0,85 avec le palier 70 ; **consommables** : Pokéball 200 (zone 0), Superball 500 (6), Hyperball 1 200 (9), Bonbon 5 000 (8), Master Ball 150 000 (16) ; **à achat unique** (`ameliorations`) : Chaussures 2 000 (1 : délai d'ennemi 1 000 ms), Pièce Rune 4 000 (2 : or ×1,3), Protéine 7 500 (3 : clic ×1,5), Multi Exp 12 000 (4 : XP ×1,5), Pierre Dure 15 000 (6 : clic ×1,3), Bicyclette 30 000 (7 : délai 500 ms), Poké-Radar 45 000 (8), Œuf Chance 75 000 (10 : XP ×1,5), Restes 150 000 (14 : auto-clic de 9 par seconde). **Corrections de la V1** : textes des Chaussures et de la Bicyclette corrigés (1 000 ms et 500 ms), Superball au Shop dès la zone 6. Fichiers : `data/objets.json` (nouveau, converti par script), `src/core/boutique.ts` (nouveau), `src/ui/Sac.tsx`, `src/ui/Shop.tsx`.

### Retours de Nicolas (24/10)
**Choix de Nicolas (24/10).** Shop : variante **B** (cartes produit) avec le **tri par catégorie** de C ; mieux aligner les éléments ; **supprimer** la case « Prépare ta route » et le message « Il te manque X pièces » (un bouton grisé suffit) ; **pas de panier**. Sac : **aucune variante ne convient** : il faut des **icônes officielles comme en V1** (20 PNG PokeAPI à rapatrier, voir ticket D), des **cases bien plus petites** sans vide inutile, le **filtre par catégorie** de C, et un **système d'utilisation des objets refait**. Pour l'utilisation, reprendre le mode de la V1 (`v1-visuel-a-porter.md` § 8) : clic sur l'objet → « Sélectionne un Pokémon », lignes d'équipe qui pulsent (cibles valides vertes, invalides grisées, clic ailleurs = annulation), sélecteur − / n / + pour Bonbon et Calcium, confirmation pour pierres et Jeton Shiny, pastilles de compte à rebours sous les PV pour les objets à durée, bouton CT Fauchage dans l'en-tête de l'équipe. Trois variantes du **nouveau** Sac sont à proposer à Nicolas avant le code. Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).

### Critères d'acceptation
- [x] Étant donné `ITEMS` de la V1, quand le script convertit, alors `data/objets.json` contient les objets du Shop avec prix, zone, type (consommable, achat unique), effet et texte français corrigé ; un test compare prix et zones avec la V1.
- [x] Étant donné 0 à 8 badges et le palier 70, quand je calcule un prix, alors il égale celui de la V1 (`base × (1 + 0,05 × badges)`, ×0,85) pour chaque objet, comparaison stricte avec le code V1 (fixture).
- [x] Étant donné la zone 1, quand j'ouvre le Shop, alors il est verrouillé avec la raison ; à la zone 2 il s'ouvre ; seuls les objets de zone ≤ zone atteinte sont visibles.
- [x] Étant donné un achat avec assez d'argent, quand je confirme, alors l'argent baisse, l'objet arrive dans le Sac (consommable : quantité ; unique : possédé) et une sauvegarde est écrite ; sans assez d'argent, le bouton est désactivé et dit combien il manque.
- [x] Étant donné un objet à achat unique déjà possédé, quand j'ouvre le Shop, alors il est marqué « Possédé » et ne peut plus être acheté.
- [x] Étant donné les objets à effet permanent, quand je les possède, alors leurs bonus apparaissent dans les calculs de clic, d'or, d'XP et de délai (les clés de `bonus` de `data/reglages.json` sont branchées ; le calcul est comparé à la V1) ; les Restes déclenchent 9 clics automatiques par seconde, sous le plafond de 12.
- [x] Étant donné le Sac, quand je l'ouvre, alors je vois balles, Bonbons et objets avec leurs quantités et leurs textes ; un Bonbon utilisé sur un Pokémon lui donne +n niveaux (jusqu'à 100).
- [x] Étant donné le Shop, quand je regarde un objet trop cher, alors son bouton est grisé sans autre message ; il n'y a ni panier ni case « Prépare ta route » ; le tri par catégorie (Balles, Soins, Équipement) fonctionne.
- [x] Étant donné le Sac, quand je l'ouvre, alors chaque objet a son icône officielle (fichier local) dans une case compacte, groupée par catégorie avec un filtre ; aucune icône n'est chargée depuis Internet.
- [x] Étant donné un Bonbon ou un Calcium, quand je l'utilise, alors le mode de sélection de la V1 s'enclenche (message, lignes d'équipe en surbrillance, annulation d'un clic ailleurs) puis le sélecteur − / n / + avec confirmation ; les valeurs et messages sont ceux de la V1.

### Hors périmètre
Objets actifs à durée ou à usage (M), Centre commercial (U), jetons de casino (V), Poké-Radar (effet : M).

### Vérification
`npm test -- boutique` ; `node scripts/extraire-objets-v1.mjs` (nouveau) ; Playwright 390 et 1440 px (achat, rechargement).

### Effort et risques
Fourchette : 3 à 4 jours (le Sac est à refaire). Risque : bonus d'objets dispersés dans plusieurs fichiers de la V1 (déjà cartographiés dans `data/reglages.json` en phase 1). Dépend de : A, B, E, F.

---

## M. `feat(objets): objets actifs, repousses, boosts, Calcium, Pierre Stase et Jeton Shiny`

Labels : `type:feat`, `etat:idee`, `est:3`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux utiliser des objets qui changent un combat ou un Pokémon afin de franchir les boss difficiles.

### Contexte
V1 : `legacy/js/game/items.js` (394 l.), `stats.js`, `combat.js`. **Règles V1** : Repousse (30 s, zone 4, 2 000), Superépousse (zone 13, 8 000) ; Attaque + et Attaque Spé + (30 s, ×1,5, 7 500 et 10 000, Centre commercial) ; CT Fauchage (zone 12, 100 000 : laisse l'ennemi à 1 PV, recharge de 30 s, **inutilisable sur un boss**) ; Poké-Radar (zone 8) ; Calcium (50 000, +2 % de DPS, **10 maximum par Pokémon**, choix via un mode de sélection du Sac) ; Pierre Stase (10 000, **réservée aux Pokémon de stade 1 qui évoluent**, bloque l'évolution, ×1,25 de DPS, retirable depuis le menu du Pokémon : l'objet revient) ; cinq pierres d'évolution (10 000 chacune) ; Poké Poupée (5 000, ré-invoque le boss de la zone s'il est déjà vaincu) ; Jeton Shiny (250 000 : rend un Pokémon de l'équipe shiny, texte corrigé) ; CT Jackpot (casino, or ×1,2). **Correction de la V1** : « ×1,5 » affiché partout (la V1 affiche « ×2 » dans Stats), descriptions des pierres à jour. Fichiers : `src/core/objets-actifs.ts` (nouveau), `data/objets.json` (suite du ticket L), `src/ui/Sac.tsx`.

### Critères d'acceptation
- [ ] Étant donné une Repousse, quand je l'utilise, alors pendant 30 s de temps de jeu simulé les apparitions de la rareté basse sont écartées comme dans la V1 (comparaison de la table de spawn), et le chrono est sauvegardé en horodatage ; au rechargement le temps restant est correct.
- [ ] Étant donné Attaque + ou Attaque Spé +, quand je l'utilise, alors le clic (resp. le DPS) est ×1,5 pendant 30 s, un second usage prolonge sans empiler ; le texte et l'écran Stats disent « ×1,5 ».
- [ ] Étant donné la CT Fauchage, quand j'attaque un ennemi non boss, alors il passe à 1 PV et l'objet se recharge 30 s ; sur un boss le bouton est désactivé avec la raison.
- [ ] Étant donné un Pokémon avec 10 Calcium, quand j'en utilise un onzième, alors c'est refusé avec un message français ; sinon +2 % de DPS par Calcium, comparaison stricte avec la V1.
- [ ] Étant donné la Pierre Stase, quand je l'utilise sur un Pokémon de stade 1 qui évolue, alors son DPS est ×1,25 et l'évolution est bloquée ; sur un autre Pokémon c'est refusé ; le retrait redonne la pierre.
- [ ] Étant donné la Poké Poupée, quand je l'utilise dans une zone dont le boss est vaincu, alors le boss est ré-invoqué ; sinon refus avec la raison.
- [ ] Étant donné le Jeton Shiny, quand je choisis un Pokémon non shiny de l'équipe, alors il devient shiny et le jeton est consommé ; le texte de l'objet dit exactement cela.
- [ ] Étant donné le Poké-Radar, quand je l'utilise, alors la fenêtre de la V1 affiche les Pokémon possibles de la zone avec leur rareté et ceux déjà capturés.

### Hors périmètre
Évolution par pierre (K utilise les pierres de ce ticket), Centre commercial écran (U), Johnny.

### Vérification
`npm test -- objets-actifs` (horloge simulée) ; `node scripts/extraire-objets-v1.mjs` ; captures du Sac.

### Effort et risques
Fourchette : 3 jours. Risque : nombreux petits effets : un test par objet obligatoire. Dépend de : A, E, H, L.

---

## N. `feat(progression): badges des arènes et paliers de récompenses du Pokédex`

Labels : `type:feat`, `etat:idee`, `est:2`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux gagner des badges en battant les chefs d'arène et des récompenses en complétant mon Pokédex afin de devenir plus fort.

### Contexte
V1 : `kanto.js` (`BADGES`), `save.js` (`checkBadges`, l. 561, animation `badge-slam`), `constants.js` (`MILESTONES`). V2 : bonus déjà décrits dans `data/reglages.json` (`badge:*`, `jalon:*`). **Règles V1** : 8 badges attribués quand le boss de l'arène est vaincu (zones 3, 5, 7, 11, 13, 15, 17, 18) : Roche (clic +50 %), Cascade (DPS ×1,3), Foudre (dégâts ×1,2 clic et DPS), Prisme (or ×1,2), Âme (XP ×1,5), Marais (capture ×1,3), Volcan (dégâts ×1,5), Terre (apparition ÷1,2) ; le champ `boss.badge` des zones n'est qu'informatif ; 10 paliers de Pokédex : 10 (clic ×2), 20 (+2 500 $), 30 (DPS ×1,5), 40 (Omni Exp), 50 (apparition ×0,9), 70 (Shop −15 %), 90 (dégâts ×1,5), 110 (Jeton Shiny), 130 (Master Ball + 10 Bonbons), 151 (Charme Chroma). Pages : choix de Nicolas (B, page Plus). Fichiers : `data/badges.json`, `data/jalons.json` (nouveaux), `src/core/progression.ts`, `src/ui/PageBadges.tsx`, `src/ui/PageJalons.tsx`.

### Retours de Nicolas (24/10)
**Choix de Nicolas (24/10).** Page Plus : variante **C** (tableau de bord). Reprendre de la V1 le **carnet de badges** (« Boîte à badges » : 8 cercles en grille de 4, obtenu = fond clair avec halo doré, non obtenu = silhouette grisée, effet au survol) et **l'animation d'obtention d'un badge** (message « Badge X obtenu ! », la boîte s'ouvre à 1,2 s, le badge « claque » à 2 s : échelle 5 → 1 → 1,4 → 1 en 1,2 s). Nicolas : « je veux garder toutes les animations que j'avais faites ; tu peux les retravailler, mais pas les supprimer ». Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).

### Critères d'acceptation
- [ ] Étant donné chaque arène, quand son boss est vaincu, alors le badge correspondant est ajouté une seule fois à `badges`, une animation d'obtention de moins d'une seconde se joue (réduite si `prefers-reduced-motion`), et la sauvegarde est écrite.
- [ ] Étant donné les 8 badges, quand je lis les bonus du jeu, alors chaque effet applique la valeur de la V1 (clic, DPS, or, XP, capture, apparition) via les clés de `data/reglages.json` ; comparaison stricte avec le code V1 pour 8 jeux de badges.
- [ ] Étant donné le Pokédex à 10, 20, …, 151 espèces, quand je franchis un palier, alors la récompense est donnée une seule fois (`jalonsRecus`), annoncée en français, et reçue à nouveau jamais, même après rechargement.
- [ ] Étant donné la page Badges, quand je l'ouvre, alors les 8 badges sont visibles (obtenus : image et effet ; non obtenus : silhouette et arène à battre).
- [ ] Étant donné la page Pokédex, quand je consulte les paliers, alors je vois la récompense du prochain palier et le nombre d'espèces restantes.
- [ ] Étant donné le palier 70 ou le badge Prisme, quand je consulte les prix et les gains, alors ils changent comme dans la V1 (branchement vers L et E vérifié par un test de bout en bout du cœur).
- [ ] Étant donné un boss d'arène vaincu, quand le badge est obtenu, alors se joue la séquence de la V1 (message, ouverture de la boîte à badges à 1,2 s, badge qui « claque » à 2 s, ≈ 3,2 s au total), comparée à `badge-slam` de la V1 (mêmes étapes et durées) ; avec `prefers-reduced-motion`, le badge apparaît sans mouvement.
- [ ] Étant donné la page Plus, quand je l'ouvre, alors je vois le tableau de bord de la variante C (progression, Pokédex n / 151, badges n / 8) et la boîte à badges de la V1 avec l'effet au survol.

### Hors périmètre
Scène de fin du palier 151 (X), Charme Chroma comme objet de capture (J) : le palier le donne seulement.

### Vérification
`npm test -- progression` ; fixture V1 `tests/fixtures/v1-badges.json` ; captures de la page.

### Effort et risques
Fourchette : 2 jours. Risque : les bonus dispersés dans `stats.js` et `combat.js` de la V1 doivent tous passer par la table de données (aucun cas oublié). Dépend de : F, H, I.


---

## O. `feat(evenements): moteur d'événements en données (déclencheurs, étapes, drapeaux)`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que développeur, je veux un moteur qui joue des événements décrits en JSON afin d'ajouter l'intro, le rival ou les scènes de fin sans écrire de code pour chacun.

### Contexte
ADR 0002 (`docs/adr/0002-*.md`, à relire : points ouverts listés en fin de ticket). V1 : les scènes sont codées en dur dans `legacy/js/` (`intro`, `rival`, `snorlax`, `league`). V2 : `DonneesRegion.drapeaux` et `evenementsJoues` existent déjà dans le schéma ; `src/core/evenements.ts` (nouveau, pur : aucun accès au DOM). **Déclencheurs** : `entree-zone`, `boss-vaincu`, `objet-utilise`, `debut-partie`. **Étapes** : `dialogue`, `combat`, `donner`, `poser-drapeau`, `deplacer`, `bloquer`. Chaque événement a un identifiant, des conditions (drapeaux requis ou interdits, badge, zone) et une liste d'étapes ; il ne se joue qu'une fois sauf mention `repetable`. Le moteur produit des **commandes d'affichage** (dialogue à montrer, combat à lancer) que l'interface exécute et reconnaît par un accusé (`etapeTerminee`) ; il est déterministe et sérialisable (reprise après rechargement au milieu d'un événement).

### Critères d'acceptation
- [ ] Étant donné un fichier `data/evenements/*.json` valide, quand le chargeur le lit, alors un schéma (Valibot, comme le reste) le valide ; une étape inconnue, un déclencheur inconnu ou une cible introuvable donne une erreur claire en français citant le fichier et l'identifiant.
- [ ] Étant donné un événement `entree-zone` avec condition `drapeau:x` absent, quand j'entre dans la zone, alors il se déclenche ; une fois terminé, il est ajouté à `evenementsJoues` et ne se rejoue pas.
- [ ] Étant donné les six étapes, quand j'exécute un événement d'essai, alors chaque étape produit sa commande (ou son effet : `donner` ajoute des objets, `poser-drapeau` écrit un drapeau, `deplacer` change de zone, `bloquer` interdit l'accès à une zone tant qu'un drapeau manque).
- [ ] Étant donné un rechargement au milieu d'un événement, quand je rouvre, alors il reprend à l'étape en cours (index d'étape sauvegardé) sans double récompense.
- [ ] Étant donné deux événements éligibles en même temps, quand ils se déclenchent, alors l'ordre est celui d'un champ `priorite` puis de l'identifiant (déterministe, testé).
- [ ] Étant donné la sauvegarde, quand elle est exportée puis importée, alors `drapeaux` et `evenementsJoues` sont conservés (test de bout en bout du cœur).

### Hors périmètre
Contenu des scènes (P, Q, R, S), éditeur d'événements, scripts arbitraires dans les données (pas de code exécutable en JSON).

### Vérification
`npm test -- evenements` ; un événement d'essai complet joué en test ; `npm run ci`.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : surdimensionner le moteur ; ne rien ajouter qui ne serve à P, Q, R ou S. Points ouverts de l'ADR 0002 à trancher par Nicolas avant S (conditions sur plusieurs drapeaux, reprise en combat). Dépend de : A.

---

## P. `feat(intro): intro du professeur Chen, choix du starter et lieux de départ`

Labels : `type:feat`, `etat:idee`, `est:3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux commencer par la rencontre du professeur Chen et choisir mon premier Pokémon afin de démarrer l'aventure comme dans la V1.

### Contexte
V1 : `legacy/js/game/intro.js`, `render.js` (`renderIntro`, `renderStarterSelect`), `kanto.js` (lieux). Pages : choix de Nicolas (B). V2 : `DialogueChen.tsx`, `equipe-de-depart.ts` (équipe provisoire de 3 starters à remplacer). **Règles V1** : intro de 7 lignes affichées en machine à écrire (30 ms par caractère), **+5 Pokéballs à la ligne 3**, **la carte est débloquée à la ligne 5** ; choix du starter entre trois Poké Balls animées, artwork ×1,5, bouton « CHOISIR <nom> », niveau 5 ; le **shiny du starter est pré-tiré** à 1/256 à la création ; sexe aléatoire ; le starter est ajouté au Pokédex ; ensuite lieux : **Chez Maman** (soin gratuit des Pokémon, texte d'accueil), **Labo de Chen** (dialogue, accès Pokédex), **Chez Blue** (dialogue). **Correction de la V1** : la phase de départ n'est plus codée en dur dans le store ; elle est l'événement `debut-partie` de O. Fichiers : `data/evenements/intro.json`, `src/ui/PageIntro.tsx`, `src/ui/ChoixStarter.tsx`.

### Retours de Nicolas (24/10)
**Choix de Nicolas (24/10).** Les trois maquettes d'intro sont **refusées** (« vides et moches »). On reprend l'**intro jouable de la V1** (`v1-visuel-a-porter.md` § 3) : écran titre, on se réveille **Chez Maman** (« Il n'y a rien à faire ici, sortons. »), on sort, on se **balade dans Bourg Palette sur l'image avec zones cliquables** (Chez Maman, Chez Blue et son gag, Labo de Chen qui clignote en vert, Pension plus tard, Bateau), on entre au **Labo** : Chen glisse de la droite, dialogue en machine à écrire (30 ms par caractère, ▼ qui rebondit, trois sprites de Chen), **le cadenas du sac se brise** et +5 Pokéballs, **la carte se débloque** (bouton qui rebondit), puis le **choix du starter** (trois Poké Balls, l'artwork apparaît au survol, ×1,5 au choix, bouton « Choisir X »), sortie du labo qui clignote, carte, vol, Route 1. La télé de Chez Maman (easter egg Daran) est reprise dans le ticket W. Ce ticket devient gros : à découper en P1 (scènes de Bourg Palette navigables) et P2 (dialogue de Chen et choix du starter) au moment du lancement. Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).

### Critères d'acceptation
- [ ] Étant donné une partie neuve, quand je démarre, alors l'événement `debut-partie` joue l'intro de 7 lignes à 30 ms par caractère ; toucher saute l'animation de la ligne puis passe à la suivante ; les 5 Pokéballs sont données à la ligne 3 et la carte est débloquée à la ligne 5 (test de l'état après chaque ligne).
- [ ] Étant donné le choix du starter, quand j'ouvre l'écran, alors trois Poké Balls s'ouvrent sur Bulbizarre, Salamèche et Carapuce (artwork ×1,5) avec « CHOISIR <nom> » ; le choix crée un Pokémon de niveau 5, sexe tiré, shiny avec la probabilité 1/256 (tirage injecté en test), ajouté au Pokédex.
- [ ] Étant donné le starter choisi, quand je vais au combat, alors l'équipe contient ce seul Pokémon (fini l'équipe provisoire de 3) ; `starterId` est enregistré pour la Ligue (Q).
- [ ] Étant donné Chez Maman, quand je clique sur « Se reposer », alors mes Pokémon sont soignés ; le Labo et Chez Blue affichent leurs dialogues et sont rejouables.
- [ ] Étant donné un rechargement pendant l'intro, quand je rouvre, alors l'intro reprend à la ligne en cours (O) sans redonner les Pokéballs.
- [ ] Étant donné 390 et 1440 px, quand l'intro et le choix s'affichent, alors tout est visible sans défiler ; textes entièrement en français ; `prefers-reduced-motion` désactive la machine à écrire (texte complet immédiat).
- [ ] Étant donné une partie neuve, quand je clique sur JOUER, alors je me réveille Chez Maman avec le message de la V1 ; la sortie est signalée en vert pulsant ; la transition entre scènes est un voile noir de 300 ms.
- [ ] Étant donné Bourg Palette, quand je survole ou touche une zone, alors elle réagit comme dans la V1 (Chez Maman, Chez Blue avec son texte, Labo qui clignote en vert tant que non visité, Pension verrouillée avec la raison, Bateau gris) ; les zones sont en pourcentages de l'image et suivent le redimensionnement de la fenêtre.
- [ ] Étant donné le dialogue de Chen, quand il se joue, alors Chen glisse en 1,5 s, la boîte apparaît à 1,6 s, le texte s'écrit à 30 ms par caractère, un toucher pendant l'écriture n'avance pas la ligne, les cadenas et la carte réagissent aux mêmes lignes qu'en V1.

### Hors périmètre
Nom du jeu (écran titre), choix du nom du dresseur (absent de la V1), Chen en sprite (voir point ouvert « sprite de Chen »).

### Vérification
`npm test -- intro` ; Playwright : parcours intro → choix → combat à 390 et 1440 px ; captures.

### Effort et risques
Fourchette : 5 jours (4 à 5 si découpé en P1 et P2). Risque : l'équipe de départ change : mettre à jour tous les tests de phase 1 qui supposent 3 starters. Dépend de : O, H, I, J.

---

## Q. `feat(ligue): Ligue Pokémon, dix combats à minuteur et victoire du Maître`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux affronter la Ligue Pokémon et le Maître afin de terminer l'aventure de Kanto.

### Contexte
V1 : `legacy/js/game/league.js`, `kanto.js` (`LEAGUE`), `combat.js`. V2 : zone 21 produite par C ; minuteur de boss produit par F. **Règles V1** : la Ligue est la zone 21 ; dix boss à minuteur dans l'ordre : Olga, Aldo, Agatha, Peter (deux Pokémon chacun), puis Blue (Roucarnage niveau 92), puis le **Maître Blue** (niveau 100, avec le Pokémon « counter » du starter choisi) ; la victoire sur le Maître incrémente `leagueWins` et lance le Panthéon (R). **Corrections de la V1** : la V1 saute de la zone 20 à 21 sans condition de badges complets (bug) ; ici les 8 badges sont requis pour entrer dans la zone 21 (raison affichée en français) ; la défaite sur un boss ramène à son début (étape 1 du boss), pas à la zone 1. Fichiers : `src/core/ligue.ts`, `data/ligue.json` (script `extraire-ligue-v1.mjs`), `src/ui/` (pas de nouvelle page : la Ligue est une zone).

### Critères d'acceptation
- [ ] Étant donné la V1, quand le script extrait les dix boss, alors `data/ligue.json` contient pour chacun nom, Pokémon (espèce, niveau), minuteur ; un test compare avec le code V1.
- [ ] Étant donné moins de 8 badges, quand j'essaie d'entrer dans la zone 21, alors c'est refusé avec la raison ; avec 8 badges c'est autorisé.
- [ ] Étant donné la Ligue, quand j'enchaîne les boss, alors ils arrivent dans l'ordre de la V1, chacun avec son minuteur (F) et son nombre de Pokémon ; la victoire du boss n suit sur le boss n+1 avec un dialogue d'enchaînement.
- [ ] Étant donné le Maître Blue, quand il entre, alors son « counter » est celui du starter choisi (table de la V1, test des trois starters) ; sa défaite incrémente `leagueWins` une seule fois et déclenche l'événement `boss-vaincu` consommé par R.
- [ ] Étant donné une défaite sur un boss de la Ligue, quand le minuteur expire ou que l'équipe est vaincue, alors le jeu revient au début de ce boss avec un message ; aucun gain n'est perdu.
- [ ] Étant donné un rechargement pendant la Ligue, quand je rouvre, alors je reprends au boss en cours.

### Hors périmètre
Panthéon (R), annonce de Johto, défi secret de Chen (X).

### Vérification
`npm test -- ligue` ; scénario e2e : sauvegarde de test avec les 8 badges et une équipe forte, la Ligue est parcourue.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : équilibrage des minuteurs (30 s) à confirmer par essai ; ne pas les modifier sans ticket. Dépend de : A, C, F, H.

---

## R. `feat(pantheon): Panthéon, fondu, socles, chute des Pokémon et confettis`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux voir mon équipe honorée au Panthéon après la Ligue afin de ressentir la fin du parcours.

### Contexte
V1 : `legacy/js/game/hall-of-fame.js`, `render.js` (`renderHallOfFame`), `confetti.js`. Décors : D. **Règles V1** : fondu depuis la Ligue, Chen parle (**3 lignes à la première victoire**, une ligne ensuite), l'équipe se place sur **6 socles** (positions à convertir en fractions de la scène), puis **un Pokémon chute toutes les 2 s** à sa place, confettis, puis le jeu propose de continuer ; l'annonce de Johto est un **stub** (message « bientôt »). **Première étape : trois variantes** de l'écran (convention de Nicolas pour toute nouvelle page) ; Nicolas choisit avant le code. Fichiers : `src/ui/Pantheon.tsx`, `src/ui/confettis.ts`, `data/pantheon.json` (socles).

### Critères d'acceptation
- [ ] Étant donné trois variantes de l'écran (A, B, C) livrées sous `design/variantes/pantheon/`, quand Nicolas en choisit une, alors seule celle-là est implémentée (étape bloquante).
- [ ] Étant donné la victoire du Maître (Q), quand le Panthéon s'ouvre, alors un fondu de 800 ms démarre, Chen dit 3 lignes à la première victoire (`leagueWins === 1`) et une seule ensuite.
- [ ] Étant donné une équipe de 1 à 6 Pokémon, quand l'animation joue, alors les Pokémon tombent un par un toutes les 2 s sur leurs socles (fractions de la scène, aucune position en pixels) ; les socles inutilisés restent vides.
- [ ] Étant donné la fin de l'animation, quand les confettis partent, alors ils durent moins de 4 s, ne bloquent pas les clics et se désactivent avec `prefers-reduced-motion`.
- [ ] Étant donné « Continuer », quand je clique, alors je reviens au jeu (zone 1 en mode « après la Ligue » : le contenu de Johto est un message « bientôt » ; rien d'autre n'est inventé).
- [ ] Étant donné 390 et 1440 px, quand le Panthéon s'affiche, alors tout est visible sans défiler ; textes en français ; l'équipe affichée est celle de la sauvegarde.

### Hors périmètre
Contenu de Johto, défi secret et crédits (X), enregistrement de l'équipe dans un « livre d'or » (phase 6).

### Vérification
`npm test -- pantheon` ; Playwright : parcours depuis une sauvegarde de test sur le Maître vaincu ; captures à 390, 1440 et 1915 px.

### Effort et risques
Fourchette : 2 à 3 jours (hors choix des variantes). Risque : animation séquencée longue : tests à horloge simulée. Dépend de : Q, O, D.

---

## S. `feat(scenes): rival, Ronflex et Pokéflûte`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:3` · branche : `v2` · `agent-ok` : non (prêt sous condition : décisions de Nicolas sur l'ADR 0002)

### Histoire
En tant que joueur, je veux des rencontres avec le rival et un obstacle (Ronflex) levé par la Pokéflûte afin que Kanto ne soit pas qu'une suite de zones.

### Contexte
V1 : `legacy/js/game/rival.js`, `snorlax.js` (le rival et Ronflex ne sont pas dans les 22 zones). **Nouveau en V2** : la Pokéflûte comme objet clé et Ronflex comme obstacle (tel que décidé en phase 2 ; la V1 gère Ronflex autrement). **Règles V1 à vérifier** : rival aux Blue de Route 22, Azuria, Lavanville, Safrania (équipes selon le starter choisi) ; Ronflex bloque la route entre deux zones tant que la flûte manque. **Ce ticket n'est pas prêt** : l'ADR 0002 a trois points ouverts (conditions multi-drapeaux, reprise en combat, objets clés) ; Nicolas doit les trancher et dire où, dans Kanto, tombent les rencontres exactes. Pas de `agent-ok` tant que ce n'est pas fait.

### Critères d'acceptation
- [ ] Étant donné chaque rencontre du rival, quand je l'atteins, alors l'équipe du rival dépend du starter du joueur selon la table de la V1 (test des trois starters) ; la défaite du rival ne bloque pas la progression, la victoire donne la récompense de la V1.
- [ ] Étant donné Ronflex, quand j'essaie de passer sans Pokéflûte, alors l'accès est `bloquer`é avec la raison en français ; la Pokéflûte s'obtient à l'endroit décidé (objet clé, non achetable) et, une fois utilisée, Ronflex devient un combat de boss (capturable ou non selon la décision de Nicolas).
- [ ] Étant donné un rechargement après la rencontre, quand je rouvre, alors le drapeau est conservé et la scène ne se rejoue pas.

### Hors périmètre
Autres objets clés (Vélo, Canne : absents de la V1), quêtes annexes.

### Vérification
`npm test -- scenes` ; scénario e2e après décision.

### Effort et risques
Fourchette : 2 à 3 jours **après** décision. Risque : spécification incomplète si lancé trop tôt. Dépend de : O, F, C ; décisions ADR 0002.

---

## T. `feat(pension): pension, œufs et éclosions`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux déposer deux Pokémon à la pension et faire éclore des œufs afin d'obtenir de nouveaux Pokémon et d'améliorer mon Pokédex.

### Contexte
V1 : `legacy/js/game/daycare.js`, `render.js` (`renderDaycare`). Pages : choix de Nicolas (B). **Règles V1** : débloquée à la zone 11 ; **2 emplacements de parents** ; **emplacements d'œuf** achetés `slots × 5000` jusqu'à 5 ; la ponte a une chance de **4 %** si l'un des parents est Métamorph ou si mâle + femelle de la même espèce de base, de **2 %** si les types sont partagés, sinon 0 ; l'œuf est **shiny avec 1/8** (avec un parent shiny) et sinon 1/256 ; l'éclosion exige **25 éliminations** d'ennemis ; la naissance donne un Pokémon de **niveau 1, bonheur 125** ; l'éclosion ajoute au Pokédex. Un parent est un Pokémon de l'équipe ou du PC ; il y revient quand on le retire. Fichiers : `src/core/pension.ts`, `src/ui/PagePension.tsx`.

### Critères d'acceptation
- [ ] Étant donné la zone 10 ouverte, quand j'ouvre le menu, alors la pension est verrouillée avec la raison ; à la zone 11 elle s'ouvre.
- [ ] Étant donné 2 parents compatibles, quand ils sont déposés, alors le test de ponte utilise exactement les probabilités de la V1 (4 %, 2 %, 0) sur 1 000 tirages injectés, comparés à la V1 (fixture) ; avec des parents incompatibles aucun œuf n'apparaît.
- [ ] Étant donné les emplacements d'œuf, quand j'en achète un, alors le prix est `slots × 5000` et jamais plus de 5 ; sans argent le bouton est désactivé avec la raison.
- [ ] Étant donné un œuf, quand 25 ennemis sont éliminés (compteur partagé avec le combat), alors il éclot : un Pokémon de niveau 1, bonheur 125, ajouté au Pokédex et à l'équipe (ou au PC si l'équipe est pleine) ; la progression est sauvegardée (`pension` dans la région).
- [ ] Étant donné un rechargement, quand je rouvre, alors parents, œufs et compteurs sont identiques.
- [ ] Étant donné 390 et 1440 px, quand la pension s'ouvre, alors tout est lisible sans défiler en largeur ; textes en français.

### Hors périmètre
Attaques héritées (absentes de la V1), natures, IV ; bonheur et évolutions par bonheur.

### Vérification
`npm test -- pension` ; `node scripts/extraire-pension-v1.mjs` ; Playwright 390 et 1440 px.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : le compteur d'éliminations n'existe pas dans le cœur actuel (à ajouter dans `statistiques`, ticket A). Dépend de : H, I, E.

---

## U. `feat(centre-commercial): Centre commercial de la zone 11`

Labels : `type:feat`, `etat:idee`, `est:1-2`, `prio:3` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux un Centre commercial où acheter des objets temporaires afin de varier mes stratégies.

### Contexte
V1 : `legacy/js/game/mall.js` (21 l.), `constants.js` (`ITEMS` du Centre). **Règles V1** : débloqué à la zone 11 ; il vend Attaque + (7 500) et Attaque Spé + (10 000), leurs effets étant ceux du ticket M ; la page utilise la même mise en page que le Shop. Le Centre n'a pas de stock limité. Fichiers : `src/ui/PageCentre.tsx`, `data/objets.json` (entrées `lieu: "centre-commercial"`).

### Critères d'acceptation
- [ ] Étant donné la zone 10, quand j'ouvre le menu, alors le Centre est verrouillé avec la raison ; à la zone 11 il s'ouvre.
- [ ] Étant donné le Centre, quand je regarde les objets, alors Attaque + et Attaque Spé + sont proposés à 7 500 et 10 000 avec leurs effets décrits (« ×1,5 pendant 30 s »).
- [ ] Étant donné un achat, quand je confirme, alors l'objet arrive dans le Sac et l'argent baisse comme au Shop (L) ; sans argent, bouton désactivé avec la raison.
- [ ] Étant donné 390 et 1440 px, quand la page s'ouvre, alors elle reste cohérente avec la variante de Shop choisie en B.

### Hors périmètre
Nouveaux objets absents de la V1, vente d'objets.

### Vérification
`npm test -- centre` ; Playwright 390 et 1440 px.

### Effort et risques
Fourchette : 1 à 2 jours. Risque : minimal (réutilise L). Dépend de : L, M, G.

---

## V. `feat(casino): casino, machine à sous, blackjack, pile ou face et boutique de jetons`

Labels : `type:feat`, `etat:idee`, `est:3`, `prio:3` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux jouer au casino avec l'argent du jeu afin de tenter ma chance et d'obtenir des objets rares.

### Contexte
V1 : `legacy/js/game/casino.js` (nombreux modules), `render.js` (`renderCasino`). **Argent virtuel seulement : aucune monnaie réelle, aucun paiement, aucune donnée personnelle.** Pages : choix de Nicolas (B). **Règles V1** : le casino se débloque dans la zone du Casino de Céladopole (voir le champ `lieu` de C) ; **jetons : 1 000 $ → 50 jetons ; rachat : 50 jetons → 1 000 $** ; **machine à sous** : poids des symboles 1 / 6 / 10 / 18 / 65, gains ×500 / ×50 / ×20 / ×10 / ×5, **deux baies = ×2** ; **blackjack** : mise ×2 si victoire, blackjack naturel ×2,5, égalité remboursée, le croupier tire jusqu'à 17 ; **pile ou face** : ×2 ; **boutique de jetons** : Abra 250, Bonbon 500, Insécateur 1 000, Minidraco 4 000, Porygon 5 000, CT Jackpot 10 000, Master Ball 40 000 ; les Pokémon achetés s'ajoutent au Pokédex. Fichiers : `src/core/casino.ts` (fonctions pures avec tirage injecté), `src/ui/Casino*.tsx`, `data/casino.json`.

### Critères d'acceptation
- [ ] Étant donné la V1, quand le script extrait les poids et gains, alors `data/casino.json` contient ces valeurs ; un test tire 100 000 mains avec un générateur graine et compare l'espérance au code V1 (fixture).
- [ ] Étant donné la machine à sous, quand je tire avec un générateur injecté, alors trois symboles identiques paient le gain de la V1, deux baies paient ×2, sinon rien ; la mise est débitée avant le tirage.
- [ ] Étant donné le blackjack, quand je joue des mains scénarisées (blackjack naturel, égalité, dépassement, croupier à 17), alors les gains sont ceux de la V1.
- [ ] Étant donné pile ou face, quand je gagne, alors la mise est doublée ; sinon perdue.
- [ ] Étant donné la boutique, quand j'achète un Pokémon avec des jetons, alors il rejoint l'équipe (ou le PC) et le Pokédex ; les objets (Bonbon, CT Jackpot, Master Ball) arrivent dans le Sac ; jetons insuffisants → bouton désactivé avec la raison.
- [ ] Étant donné un rechargement, quand je rouvre, alors jetons et état sont conservés ; une partie de blackjack en cours est abandonnée proprement (mise remboursée) ou reprise, selon le choix du ticket (à trancher à la livraison et à écrire).
- [ ] Étant donné la page, quand elle s'ouvre, alors un rappel « Argent virtuel uniquement » est affiché ; aucune réclame de jeu d'argent réel.

### Hors périmètre
Salles de jeu supplémentaires, tournois, classement.

### Vérification
`npm test -- casino` ; `node scripts/extraire-casino-v1.mjs` ; Playwright 390 et 1440 px.

### Effort et risques
Fourchette : 3 jours. Risque : état de jeu intermédiaire (main de blackjack) à sauvegarder. Dépend de : L, E, G.

---

## W. `feat(easter-eggs): easter eggs de renommage en données`

Labels : `type:feat`, `etat:idee`, `est:1`, `prio:3` · branche : `v2` · `agent-ok` : oui (sous réserve des assets)

### Histoire
En tant que joueur, je veux retrouver les surprises cachées de la V1 quand je renomme un Pokémon afin de garder l'esprit du jeu.

### Contexte
V1 : `legacy/js/game/easter-eggs.js`, `render.js`. **Règles V1** : renommer un Pokémon avec **dinnerbone** ou **grumm** retourne son sprite ; **jeb_** change ses couleurs en arc-en-ciel animé ; **caca** applique le texte et l'effet de la V1 ; **Daran** (affichage d'images de stade et lecture de `Daran.mp4`). Les noms sont comparés sans casse. Le renommage est limité à 12 caractères (H). **Bjorn et Gabriel** : inactifs tant que Nicolas n'a pas défini leur apparence (point ouvert dans `design/DESIGN.md`). Fichiers : `data/easter-eggs.json` (registre : nom, effet, assets), `src/ui/easter-eggs.ts`.

### Critères d'acceptation
- [ ] Étant donné chaque easter egg de la V1, quand je renomme un Pokémon avec le nom déclencheur (insensible à la casse), alors l'effet visuel de la V1 s'applique à son sprite et il disparaît au renommage suivant.
- [ ] Étant donné « Daran », quand je renomme, alors les images de stade s'affichent et la vidéo se lance sur action de l'utilisateur seulement (pas d'autoplay avec son).
- [ ] Étant donné Bjorn et Gabriel, quand je les saisis, alors rien de spécial ne se passe (entrées du registre marquées `inactif` avec la raison dans le fichier).
- [ ] Étant donné `prefers-reduced-motion`, quand j'active jeb_, alors la couleur est fixe (pas d'animation).
- [ ] Étant donné un rechargement, quand je rouvre, alors le surnom est conservé et l'effet toujours appliqué.

### Hors périmètre
Nouveaux easter eggs, apparence de Bjorn et Gabriel.

### Vérification
`npm test -- easter-eggs` ; Playwright : renommer et capturer.

### Effort et risques
Fourchette : 1 jour. Risque : assets (images de stade, vidéo) à reprendre de la V1 avec l'accord de Nicolas pour le poids. Dépend de : H.

---

## X. `feat(fin): fin de partie, diplôme, défi secret de Chen et crédits`

Labels : `type:feat`, `etat:idee`, `est:3`, `prio:3` · branche : `v2` · `agent-ok` : oui (hors jalon 2)

### Histoire
En tant que joueur, je veux une vraie fin quand j'ai complété le Pokédex afin de ressentir l'accomplissement.

### Contexte
V1 : `legacy/js/game/endgame.js`, `credits.js`, `render.js`. **Règles V1** : Pokédex à 151 → diplôme (page avec nom et date, impression possible), Charme Chroma (palier 151 de N), **défi secret de Chen** : combat contre une équipe de 6 Pokémon de niveau 100 ; les **crédits** défilent pendant 110 s (texte, image, musique si présente). Priorité 3 : hors jalon 2, à faire si le temps le permet. Fichiers : `src/ui/Diplome.tsx`, `src/ui/Credits.tsx`, `data/credits.json`.

### Critères d'acceptation
- [ ] Étant donné 151 espèces au Pokédex (I), quand le palier est atteint, alors le diplôme s'affiche avec le nom du dresseur et la date, et peut être fermé ; il est rejouable depuis la page Plus.
- [ ] Étant donné la victoire du Panthéon (R) et le diplôme obtenu, quand Chen propose le défi secret, alors le combat contre ses 6 Pokémon de niveau 100 s'enchaîne (données extraites de la V1) ; la victoire est enregistrée une seule fois.
- [ ] Étant donné les crédits, quand ils démarrent, alors ils durent 110 s, défilent sans saccade, peuvent être sautés d'un geste ; le texte vient de `data/credits.json`.
- [ ] Étant donné `prefers-reduced-motion`, quand les crédits défilent, alors le défilement est remplacé par un affichage par pages.

### Hors périmètre
Contenu de Johto, succès supplémentaires.

### Vérification
`npm test -- fin` ; captures.

### Effort et risques
Fourchette : 3 jours. Risque : musique et droits (aucun fichier audio n'est ajouté sans accord de Nicolas). Dépend de : R, I.

---

## Z. `feat(v1): reprendre les animations, les sons et les finitions visuelles de la V1`

Labels : `type:feat`, `etat:idee`, `est:3-4`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur de la V1, je veux retrouver les animations, les sons et les petits effets que j'aimais afin que la V2 ait la même âme que mon jeu.

### Contexte
Demande de Nicolas (24/10) : « la V1 c'est l'idéal de mon jeu : le visuel, les animations, les easter eggs, c'est pile ce que j'aimais ». Inventaire complet dans `docs/projet/v1-visuel-a-porter.md` § 4 et § 7. Ce ticket couvre le **transversal** qui n'appartient à aucune page : animations du combat, de la capture, de l'évolution, du shiny, de la victoire ; sons ; finitions. Les animations propres à une page (vol de la carte, badge, intro, Panthéon, casino) sont dans le ticket de leur page. Chaque animation est reprise avec ses durées de la V1, retravaillée seulement pour respecter `design/DESIGN.md` (propriétés `transform` et `opacity`, pas de `steps()` sur un sprite, `prefers-reduced-motion`). Fichiers : `src/ui/animations/` (nouveau), `src/ui/sons.ts` (nouveau), `data/animations.json` (durées).

### Critères d'acceptation
- [ ] Étant donné l'inventaire de la V1, quand j'ouvre `docs/projet/v1-visuel-a-porter.md`, alors chaque animation du § 4 a un état : reprise (avec le ticket qui la porte), retravaillée (avec la raison) ou écartée par Nicolas ; aucune n'est supprimée sans son accord.
- [ ] Étant donné un Pokémon sauvage, quand il est à l'écran, alors il flotte doucement (3 s en boucle) ; à chaque toucher, il tremble 0,3 s avec un éclat blanc ; les nombres de dégâts sont verts si le premier Pokémon de l'équipe est efficace et rouges sinon.
- [ ] Étant donné une capture, quand la balle est lancée, alors le sprite devient une silhouette noire qui tremble pendant 1 s avant le résultat ; l'évolution fait clignoter en blanc 3 s en alternant les deux formes toutes les 150 ms ; un shiny a son halo doré et la bannière « Shiny apparu ! Auto stoppé ! » qui rebondit 3 s.
- [ ] Étant donné les sons, quand je clique, tue un ennemi, capture, monte de niveau ou range un Pokémon au PC, alors le son de la V1 correspondant se joue (cinq tons courts synthétisés par la Web Audio, sans fichier ni bibliothèque), un interrupteur « Son » dans Plus les coupe, et rien ne se joue avant le premier geste du joueur (règle des navigateurs).
- [ ] Étant donné `prefers-reduced-motion`, quand une animation devrait se jouer, alors elle est remplacée par un changement d'état instantané ou un fondu, sans perdre l'information.
- [ ] Étant donné la musique, quand Nicolas a choisi des morceaux, alors chaque fichier est local, sous licence libre ou généré (source et licence notées dans `docs/projet/musiques.md`), jouable seulement après un geste du joueur, coupable dans Plus, et le thème de victoire de la Ligue se joue au Panthéon.
- [ ] Étant donné les finitions de la V1 (contour noir des textes, verre dépoli des panneaux, étoiles ✦, message « Recherche en cours… » entre deux ennemis), quand je les compare, alors chacune est reprise ou écartée par Nicolas, notée dans l'inventaire.

### Musique (ajout du 24/10, demande de Nicolas)
La V1 n'a presque pas de son ; Nicolas veut y ajouter de la musique, notamment un thème à la victoire sur la Ligue (au Panthéon). **Les musiques Pokémon officielles sont protégées (Nintendo, Game Freak) et le dépôt est public : on ne les ajoute pas.** Pistes à écouter ensemble avant de garder quoi que ce soit : morceaux sous licence libre (CC0 ou équivalent, licence notée dans le dépôt) et morceaux générés par IA dans le même esprit. Un lecteur simple (volume, coupure, aucune lecture avant le premier geste du joueur), fichiers locaux compressés, préchargement discret.

### Hors périmètre
Animations propres à une page (carte, badges, intro, Panthéon, casino, générique : dans leurs tickets), easter eggs de renommage (ticket W).

### Vérification
`npm test -- animations sons` ; captures et vidéos courtes de chaque animation comparées à la V1 par Claude ; essai de Nicolas.

### Effort et risques
Fourchette : 3 à 4 jours. Risque : fluidité (règle de DESIGN.md, 59 images/s au repos) : mesurer avec le test de fluidité après chaque ajout. Dépend de : H (équipe et combat étoffé), J (capture), K (évolution).

---

## Y. `test(jalon): test de jalon 2 de bout en bout avec des sauvegardes de test`

Labels : `type:test`, `etat:idee`, `est:1-2`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que Nicolas, je veux un test automatique qui parcourt Kanto de l'intro à la Ligue afin d'être certain que le jeu est jouable avant d'y jouer moi-même.

### Contexte
Le jalon 2 = « Kanto jouable de bout en bout ». Aucune triche : le test n'ajoute ni argent ni niveaux hors des sauvegardes de test, chacune construite par le cœur à une étape précise. `tests-e2e/jalon-2.spec.ts` (nouveau). Sauvegardes de test dans `tests-e2e/fixtures/jalon-2/` (générées par `scripts/creer-sauvegarde-test.mjs`, versionnées, avec le numéro de schéma). Le test de fluidité reste séparé et se relance au repos.

### Critères d'acceptation
- [ ] Étant donné une sauvegarde neuve, quand le test joue l'intro et choisit chacun des trois starters (trois projets), alors l'équipe contient un seul Pokémon de niveau 5.
- [ ] Étant donné des sauvegardes aux étapes clés (zone 3 avec badge Roche, zone 11 avec pension, zone 18 avec badge Volcan, zone 21 avec 8 badges), quand le test les charge, alors elles se migrent sans erreur et le jeu affiche la zone attendue.
- [ ] Étant donné une capture, une évolution, un achat au Shop, une éclosion et un tour de casino scénarisés, quand le test les joue, alors l'état final de chacun est vérifié par l'interface (pas par le cœur).
- [ ] Étant donné la Ligue, quand le test bat les dix boss avec l'équipe de la sauvegarde, alors le Panthéon s'ouvre et `leagueWins === 1`.
- [ ] Étant donné les trois tailles (390, 1440, 1915 px), quand le test parcourt les pages principales, alors aucune ne défile horizontalement, aucune erreur console, aucun texte en anglais (liste de contrôle).
- [ ] Étant donné la CI, quand le test tourne, alors il dure moins de 10 minutes et la CI complète reste verte.

### Hors périmètre
Essai de Nicolas (jalon humain, hors CI), équilibrage fin.

### Vérification
`npm run test:e2e -- jalon-2` ; rapport Playwright joint à `docs/projet/jalon-2.md`.

### Effort et risques
Fourchette : 1 à 2 jours. Risque : fragile si les temps de combat varient ; utiliser l'horloge simulée de l'interface de test. Dépend de : A à W et Z.
