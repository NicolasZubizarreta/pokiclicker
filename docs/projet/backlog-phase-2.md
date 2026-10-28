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
   - le bonus « Johnny » (+50 % contre le type Ténèbres) ne sert à rien en génération 1 : non porté, noté ;
   - écarts décidés par Nicolas le 28/10 (ticket AA et AC) : le Calcium coûte 20 000 (50 000 en V1), les cinq pierres d'évolution (Pierre Feu, Eau, Plante, Foudre, Lune) n'ont plus d'inflation par badge, la recharge du Fauchage passe de 30 à 20 s, et le clic sur l'ennemi ne fait plus de son. Les fixtures de la V1 gardent les valeurs d'origine ; `tests/ecarts-v1.ts` liste ces écarts.
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

Labels : `type:feat`, `etat:fait`, `est:2`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux faire évoluer mes Pokémon afin d'augmenter leur puissance et de compléter mon Pokédex.

### Contexte
V1 : `legacy/js/game/evolution.js` (62 l.), `constants.js` (`EVOLUTIONS` : 56 entrées par niveau ; `STONE_EVOLUTIONS` : 14 entrées dont Évoli à 3 branches). **Règles V1** : l'évolution par niveau est un **bouton « EVO » manuel** dans l'équipe, proposé quand le niveau requis est atteint ; l'évolution par pierre consomme la pierre ; l'évolution lance une animation de 3 s qui suspend l'auto-DPS ; aucune évolution par bonheur ; l'évolution met le Pokédex à jour. **Corrections de la V1** : l'XP maximale est recalculée après l'évolution ; Évoli devient atteignable pour Voltali, Aquali et Pyroli par les pierres. Fichiers : `data/evolutions.json` (nouveau, converti par script), `src/core/evolution.ts` (nouveau), `src/ui/` (bouton et animation).

### Critères d'acceptation
- [x] Étant donné `EVOLUTIONS` et `STONE_EVOLUTIONS` de la V1, quand le script convertit, alors `data/evolutions.json` contient les 56 + 14 entrées (espèce, niveau ou pierre, cible) ; un test compare avec la V1 (hors Évoli, qui est ajouté avec ses trois pierres).
- [x] Étant donné un Pokémon au niveau requis, quand je regarde l'équipe, alors le bouton « Évoluer » apparaît ; en dessous du niveau il est absent ; le niveau requis est affiché dans la fiche.
- [x] Étant donné un clic sur « Évoluer », quand l'animation de 3 s se joue, alors l'auto-DPS de ce Pokémon est suspendu (temps de jeu simulé en test), puis l'espèce change, son sprite change, le Pokédex est mis à jour et son `maxXp` est recalculé.
- [x] Étant donné une pierre dans l'inventaire et un Pokémon compatible, quand je l'utilise, alors la pierre est consommée et l'évolution se produit ; sur un Pokémon incompatible, un message en français refuse sans consommer la pierre.
- [x] Étant donné un Pokémon avec une Pierre Stase, quand je tente d'évoluer, alors c'est bloqué avec la raison.
- [x] Étant donné un Évoli, quand j'utilise la pierre Foudre, Eau ou Feu, alors il évolue en Voltali, Aquali ou Pyroli.

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
- [x] Étant donné le Sac, quand je l'ouvre, alors chaque objet a son icône officielle (fichier local) dans une ligne compacte à deux colonnes (icône 32 px, un clic pour utiliser, comme la V1), avec un filtre par catégorie ; aucune icône n'est chargée depuis Internet.
- [x] Étant donné un Bonbon ou un Calcium, quand je l'utilise, alors le mode de sélection de la V1 s'enclenche (message, lignes d'équipe en surbrillance, annulation d'un clic ailleurs) puis le sélecteur − / n / + avec confirmation ; les valeurs et messages sont ceux de la V1.

### Hors périmètre
Objets actifs à durée ou à usage (M), Centre commercial (U), jetons de casino (V), Poké-Radar (effet : M).

### Vérification
`npm test -- boutique` ; `node scripts/extraire-objets-v1.mjs` (nouveau) ; Playwright 390 et 1440 px (achat, rechargement).

### Effort et risques
Fourchette : 3 à 4 jours (le Sac est à refaire). Risque : bonus d'objets dispersés dans plusieurs fichiers de la V1 (déjà cartographiés dans `data/reglages.json` en phase 1). Dépend de : A, B, E, F.

---

## M. `feat(objets): objets actifs, repousses, boosts, Calcium, Pierre Stase et Jeton Shiny`

Labels : `type:feat`, `etat:fait`, `est:3`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux utiliser des objets qui changent un combat ou un Pokémon afin de franchir les boss difficiles.

### Contexte
V1 : `legacy/js/game/items.js` (394 l.), `stats.js`, `combat.js`. **Règles V1** : Repousse (30 s, zone 4, 2 000), Superépousse (zone 13, 8 000) ; Attaque + et Attaque Spé + (30 s, ×1,5, 7 500 et 10 000, Centre commercial) ; CT Fauchage (zone 12, 100 000 : laisse l'ennemi à 1 PV, recharge de 30 s, **inutilisable sur un boss**) ; Poké-Radar (zone 8) ; Calcium (50 000, +2 % de DPS, **10 maximum par Pokémon**, choix via un mode de sélection du Sac) ; Pierre Stase (10 000, **réservée aux Pokémon de stade 1 qui évoluent**, bloque l'évolution, ×1,25 de DPS, retirable depuis le menu du Pokémon : l'objet revient) ; cinq pierres d'évolution (10 000 chacune) ; Poké Poupée (5 000, ré-invoque le boss de la zone s'il est déjà vaincu) ; Jeton Shiny (250 000 : rend un Pokémon de l'équipe shiny, texte corrigé) ; CT Jackpot (casino, or ×1,2). **Correction de la V1** : « ×1,5 » affiché partout (la V1 affiche « ×2 » dans Stats), descriptions des pierres à jour. Fichiers : `src/core/objets-actifs.ts` (nouveau), `data/objets.json` (suite du ticket L), `src/ui/Sac.tsx`.

### Critères d'acceptation
- [x] Étant donné une Repousse, quand je l'utilise, alors pendant 30 s de temps de jeu simulé les apparitions de la rareté basse sont écartées comme dans la V1 (comparaison de la table de spawn), et le chrono est sauvegardé en horodatage ; au rechargement le temps restant est correct.
- [x] Étant donné Attaque + ou Attaque Spé +, quand je l'utilise, alors le clic (resp. le DPS) est ×1,5 pendant 30 s, un second usage prolonge sans empiler ; le texte et l'écran Stats disent « ×1,5 ».
- [x] Étant donné la CT Fauchage, quand j'attaque un ennemi non boss, alors il passe à 1 PV et l'objet se recharge 30 s ; sur un boss le bouton est désactivé avec la raison.
- [x] Étant donné un Pokémon avec 10 Calcium, quand j'en utilise un onzième, alors c'est refusé avec un message français ; sinon +2 % de DPS par Calcium, comparaison stricte avec la V1.
- [x] Étant donné la Pierre Stase, quand je l'utilise sur un Pokémon de stade 1 qui évolue, alors son DPS est ×1,25 et l'évolution est bloquée ; sur un autre Pokémon c'est refusé ; le retrait redonne la pierre.
- [x] Étant donné la Poké Poupée, quand je l'utilise dans une zone dont le boss est vaincu, alors le boss est ré-invoqué ; sinon refus avec la raison.
- [x] Étant donné le Jeton Shiny, quand je choisis un Pokémon non shiny de l'équipe, alors il devient shiny et le jeton est consommé ; le texte de l'objet dit exactement cela.
- [x] Étant donné le Poké-Radar, quand je l'utilise, alors la fenêtre de la V1 affiche les Pokémon possibles de la zone avec leur rareté et ceux déjà capturés.

### Hors périmètre
Évolution par pierre (livrée au ticket K : usage des pierres dans le Sac ; M ne gère que la pose et le retrait de la Pierre Stase), Centre commercial écran (U), Johnny.

### Vérification
`npm test -- objets-actifs` (horloge simulée) ; `node scripts/extraire-objets-v1.mjs` ; captures du Sac.

### Effort et risques
Fourchette : 3 jours. Risque : nombreux petits effets : un test par objet obligatoire. Dépend de : A, E, H, L.

---

## N. `feat(progression): badges des arènes et paliers de récompenses du Pokédex`

Labels : `type:feat`, `etat:fait`, `est:2`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux gagner des badges en battant les chefs d'arène et des récompenses en complétant mon Pokédex afin de devenir plus fort.

### Contexte
V1 : `kanto.js` (`BADGES`), `save.js` (`checkBadges`, l. 561, animation `badge-slam`), `constants.js` (`MILESTONES`). V2 : bonus déjà décrits dans `data/reglages.json` (`badge:*`, `jalon:*`). **Règles V1** : 8 badges attribués quand le boss de l'arène est vaincu (zones 3, 5, 7, 11, 13, 15, 17, 18) : Roche (clic +50 %), Cascade (DPS ×1,3), Foudre (dégâts ×1,2 clic et DPS), Prisme (or ×1,2), Âme (XP ×1,5), Marais (capture ×1,3), Volcan (dégâts ×1,5), Terre (apparition ÷1,2) ; le champ `boss.badge` des zones n'est qu'informatif ; 10 paliers de Pokédex : 10 (clic ×2), 20 (+2 500 $), 30 (DPS ×1,5), 40 (Omni Exp), 50 (apparition ×0,9), 70 (Shop −15 %), 90 (dégâts ×1,5), 110 (Jeton Shiny), 130 (Master Ball + 10 Bonbons), 151 (Charme Chroma). Pages : choix de Nicolas (B, page Plus). Fichiers : `data/badges.json`, `data/jalons.json` (nouveaux), `src/core/progression.ts`, `src/ui/PageBadges.tsx`, `src/ui/PageJalons.tsx`.

### Retours de Nicolas (24/10)
**Choix de Nicolas (24/10).** Page Plus : variante **C** (tableau de bord). Reprendre de la V1 le **carnet de badges** (« Boîte à badges » : 8 cercles en grille de 4, obtenu = fond clair avec halo doré, non obtenu = silhouette grisée, effet au survol) et **l'animation d'obtention d'un badge** (message « Badge X obtenu ! », la boîte s'ouvre à 1,2 s, le badge « claque » à 2 s : échelle 5 → 1 → 1,4 → 1 en 1,2 s). Nicolas : « je veux garder toutes les animations que j'avais faites ; tu peux les retravailler, mais pas les supprimer ». Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).

### Critères d'acceptation
- [x] Étant donné chaque arène, quand son boss est vaincu, alors le badge correspondant est ajouté une seule fois à `badges`, la séquence d'obtention de la V1 se joue (≈ 3,2 s, voir le critère ci-dessous ; sans mouvement si `prefers-reduced-motion`), et la sauvegarde est écrite.
- [x] Étant donné les 8 badges, quand je lis les bonus du jeu, alors chaque effet applique la valeur de la V1 (clic, DPS, or, XP, capture, apparition) via les clés de `data/reglages.json` ; comparaison stricte avec le code V1 pour 8 jeux de badges.
- [x] Étant donné le Pokédex à 10, 20, …, 151 espèces, quand je franchis un palier, alors la récompense est donnée une seule fois (`jalonsRecus`), annoncée en français, et reçue à nouveau jamais, même après rechargement.
- [x] Étant donné la page Badges, quand je l'ouvre, alors les 8 badges sont visibles (obtenus : image et effet ; non obtenus : silhouette et arène à battre).
- [x] Étant donné la page Pokédex, quand je consulte les paliers, alors je vois la récompense du prochain palier et le nombre d'espèces restantes.
- [x] Étant donné le palier 70 ou le badge Prisme, quand je consulte les prix et les gains, alors ils changent comme dans la V1 (branchement vers L et E vérifié par un test de bout en bout du cœur).
- [x] Étant donné un boss d'arène vaincu, quand le badge est obtenu, alors se joue la séquence de la V1 (message, ouverture de la boîte à badges à 1,2 s, badge qui « claque » à 2 s, ≈ 3,2 s au total), comparée à `badge-slam` de la V1 (mêmes étapes et durées) ; avec `prefers-reduced-motion`, le badge apparaît sans mouvement.
- [x] Étant donné la page Plus, quand je l'ouvre, alors je vois le tableau de bord de la variante C (progression, Pokédex n / 151, badges n / 8) et la boîte à badges de la V1 avec l'effet au survol.

### Hors périmètre
Scène de fin du palier 151 (X), Charme Chroma comme objet de capture (J) : le palier le donne seulement.

### Vérification
`npm test -- progression` ; fixture V1 `tests/fixtures/v1-badges.json` ; captures de la page.

### Effort et risques
Fourchette : 2 jours. Risque : les bonus dispersés dans `stats.js` et `combat.js` de la V1 doivent tous passer par la table de données (aucun cas oublié). Dépend de : F, H, I.


---

## O. `feat(evenements): moteur d'événements en données (déclencheurs, étapes, drapeaux)`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que développeur, je veux un moteur qui joue des événements décrits en JSON afin d'ajouter l'intro, le rival ou les scènes de fin sans écrire de code pour chacun.

### Contexte
ADR 0002 (`docs/adr/0002-*.md`, à relire : points ouverts listés en fin de ticket). V1 : les scènes sont codées en dur dans `legacy/js/` (`intro`, `rival`, `snorlax`, `league`). V2 : `DonneesRegion.drapeaux` et `evenementsJoues` existent déjà dans le schéma ; `src/core/evenements.ts` (nouveau, pur : aucun accès au DOM). **Déclencheurs** : `entree-zone`, `boss-vaincu`, `objet-utilise`, `debut-partie`. **Étapes** : `dialogue`, `combat`, `donner`, `poser-drapeau`, `deplacer`, `bloquer`. Chaque événement a un identifiant, des conditions (drapeaux requis ou interdits, badge, zone) et une liste d'étapes ; il ne se joue qu'une fois sauf mention `repetable`. Le moteur produit des **commandes d'affichage** (dialogue à montrer, combat à lancer) que l'interface exécute et reconnaît par un accusé (`etapeTerminee`) ; il est déterministe et sérialisable (reprise après rechargement au milieu d'un événement).

### Critères d'acceptation
- [x] Étant donné un fichier `data/evenements/*.json` valide, quand le chargeur le lit, alors un schéma (validation à la main comme le reste (Valibot n’est pas installé)) le valide ; une étape inconnue, un déclencheur inconnu ou une cible introuvable donne une erreur claire en français citant le fichier et l'identifiant.
- [x] Étant donné un événement `entree-zone` avec condition `drapeau:x` absent, quand j'entre dans la zone, alors il se déclenche ; une fois terminé, il est ajouté à `evenementsJoues` et ne se rejoue pas.
- [x] Étant donné les six étapes, quand j'exécute un événement d'essai, alors chaque étape produit sa commande (ou son effet : `donner` ajoute des objets, `poser-drapeau` écrit un drapeau, `deplacer` change de zone, `bloquer` interdit l'accès à une zone tant qu'un drapeau manque).
- [x] Étant donné un rechargement au milieu d'un événement, quand je rouvre, alors il reprend à l'étape en cours (index d'étape sauvegardé) sans double récompense.
- [x] Étant donné deux événements éligibles en même temps, quand ils se déclenchent, alors l'ordre est celui d'un champ `priorite` puis de l'identifiant (déterministe, testé).
- [x] Étant donné la sauvegarde, quand elle est exportée puis importée, alors `drapeaux` et `evenementsJoues` sont conservés (test de bout en bout du cœur).

### Hors périmètre
Contenu des scènes (P, Q, R, S), éditeur d'événements, scripts arbitraires dans les données (pas de code exécutable en JSON).

### Vérification
`npm test -- evenements` ; un événement d'essai complet joué en test ; `npm run ci`.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : surdimensionner le moteur ; ne rien ajouter qui ne serve à P, Q, R ou S. Points ouverts de l'ADR 0002 à trancher par Nicolas avant S (conditions sur plusieurs drapeaux, reprise en combat). Dépend de : A.

---

## P. `feat(intro): intro du professeur Chen, choix du starter et lieux de départ`

Labels : `type:feat`, `etat:fait`, `est:3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux commencer par la rencontre du professeur Chen et choisir mon premier Pokémon afin de démarrer l'aventure comme dans la V1.

### Contexte
V1 : `legacy/js/game/intro.js`, `render.js` (`renderIntro`, `renderStarterSelect`), `kanto.js` (lieux). Pages : choix de Nicolas (B). V2 : `DialogueChen.tsx`, `equipe-de-depart.ts` (équipe provisoire de 3 starters à remplacer). **Règles V1** : intro de 7 lignes affichées en machine à écrire (30 ms par caractère), **+5 Pokéballs à la ligne 3**, **la carte est débloquée à la ligne 5** ; choix du starter entre trois Poké Balls animées, artwork ×1,5, bouton « CHOISIR <nom> », niveau 5 ; le **shiny du starter est pré-tiré** à 1/256 à la création ; sexe aléatoire ; le starter est ajouté au Pokédex ; ensuite lieux : **Chez Maman** (soin gratuit des Pokémon, texte d'accueil), **Labo de Chen** (dialogue, accès Pokédex), **Chez Blue** (dialogue). **Correction de la V1** : la phase de départ n'est plus codée en dur dans le store ; elle est l'événement `debut-partie` de O. Fichiers : `data/evenements/intro.json`, `src/ui/PageIntro.tsx`, `src/ui/ChoixStarter.tsx`.

### Retours de Nicolas (24/10)
**Choix de Nicolas (24/10).** Les trois maquettes d'intro sont **refusées** (« vides et moches »). On reprend l'**intro jouable de la V1** (`v1-visuel-a-porter.md` § 3) : écran titre, on se réveille **Chez Maman** (« Il n'y a rien à faire ici, sortons. »), on sort, on se **balade dans Bourg Palette sur l'image avec zones cliquables** (Chez Maman, Chez Blue et son gag, Labo de Chen qui clignote en vert, Pension plus tard, Bateau), on entre au **Labo** : Chen glisse de la droite, dialogue en machine à écrire (30 ms par caractère, ▼ qui rebondit, trois sprites de Chen), **le cadenas du sac se brise** et +5 Pokéballs, **la carte se débloque** (bouton qui rebondit), puis le **choix du starter** (trois Poké Balls, l'artwork apparaît au survol, ×1,5 au choix, bouton « Choisir X »), sortie du labo qui clignote, carte, vol, Route 1. La télé de Chez Maman (easter egg Daran) est reprise dans le ticket W. Ce ticket devient gros : à découper en P1 (scènes de Bourg Palette navigables) et P2 (dialogue de Chen et choix du starter) au moment du lancement. Sources : `docs/projet/choix-variantes-b.md` (choix), `docs/projet/v1-visuel-a-porter.md` (ce que fait la V1).

### Critères d'acceptation
- [x] Étant donné une partie neuve, quand je démarre, alors l'événement `debut-partie` joue l'intro de 7 lignes à 30 ms par caractère ; toucher saute l'animation de la ligne puis passe à la suivante ; les 5 Pokéballs sont données à la ligne 3 et la carte est débloquée à la ligne 5 (test de l'état après chaque ligne).
- [x] Étant donné le choix du starter, quand j'ouvre l'écran, alors trois Poké Balls s'ouvrent sur Bulbizarre, Salamèche et Carapuce (artwork ×1,5) avec « CHOISIR <nom> » ; le choix crée un Pokémon de niveau 5, sexe tiré, shiny avec la probabilité 1/256 (tirage injecté en test), ajouté au Pokédex.
- [x] Étant donné le starter choisi, quand je vais au combat, alors l'équipe contient ce seul Pokémon (fini l'équipe provisoire de 3) ; `starterId` est enregistré pour la Ligue (Q).
- [x] Étant donné Chez Maman, quand je clique sur « Se reposer », alors la V1 répond « Il n'y a rien à faire ici, sortons. » (décision de Nicolas le 25/10 : pas de bouton, la V1 n'a ni PV ni soin) ; le Labo et Chez Blue affichent leurs dialogues et sont rejouables.
- [x] Étant donné un rechargement pendant l'intro, quand je rouvre, alors l'intro reprend à la ligne en cours (O) sans redonner les Pokéballs.
- [x] Étant donné 390 et 1440 px, quand l'intro et le choix s'affichent, alors tout est visible sans défiler ; textes entièrement en français ; `prefers-reduced-motion` désactive la machine à écrire (texte complet immédiat).
- [x] Étant donné une partie neuve, quand je clique sur JOUER, alors je me réveille Chez Maman avec le message de la V1 ; la sortie est signalée en vert pulsant ; la transition entre scènes est un voile noir de 300 ms.
- [x] Étant donné Bourg Palette, quand je survole ou touche une zone, alors elle réagit comme dans la V1 (Chez Maman, Chez Blue avec son texte, Labo qui clignote en vert tant que non visité, Pension verrouillée avec la raison, Bateau gris) ; les zones sont en pourcentages de l'image et suivent le redimensionnement de la fenêtre.
- [x] Étant donné le dialogue de Chen, quand il se joue, alors Chen glisse en 1,5 s, la boîte apparaît à 1,6 s, le texte s'écrit à 30 ms par caractère, un toucher pendant l'écriture n'avance pas la ligne, les cadenas et la carte réagissent aux mêmes lignes qu'en V1.

### Hors périmètre
Nom du jeu (écran titre), choix du nom du dresseur (absent de la V1), Chen en sprite (voir point ouvert « sprite de Chen »).

### Vérification
`npm test -- intro` ; Playwright : parcours intro → choix → combat à 390 et 1440 px ; captures.

### Effort et risques
Fourchette : 5 jours (4 à 5 si découpé en P1 et P2). Risque : l'équipe de départ change : mettre à jour tous les tests de phase 1 qui supposent 3 starters. Dépend de : O, H, I, J.

---

## Q. `feat(ligue): Ligue Pokémon, dix combats à minuteur et victoire du Maître`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux affronter la Ligue Pokémon et le Maître afin de terminer l'aventure de Kanto.

### Contexte
V1 : `legacy/js/game/league.js`, `kanto.js` (`LEAGUE`), `combat.js`. V2 : zone 21 produite par C ; minuteur de boss produit par F. **Règles V1** : la Ligue est la zone 21 ; dix boss à minuteur dans l'ordre : Olga, Aldo, Agatha, Peter (deux Pokémon chacun), puis Blue (Roucarnage niveau 92), puis le **Maître Blue** (niveau 100, avec le Pokémon « counter » du starter choisi) ; la victoire sur le Maître incrémente `leagueWins` et lance le Panthéon (R). **Corrections de la V1** : la V1 saute de la zone 20 à 21 sans condition de badges complets (bug) ; ici les 8 badges sont requis pour entrer dans la zone 21 (raison affichée en français) ; la défaite sur un boss ramène à son début (étape 1 du boss), pas à la zone 1. Fichiers : `src/core/ligue.ts`, `data/ligue.json` (script `extraire-ligue-v1.mjs`), `src/ui/` (pas de nouvelle page : la Ligue est une zone).

### Critères d'acceptation
- [x] Étant donné la V1, quand le script extrait les dix boss, alors `data/ligue.json` contient pour chacun nom, Pokémon (espèce, niveau), minuteur ; un test compare avec le code V1.
- [x] Étant donné moins de 8 badges, quand j'essaie d'entrer dans la zone 21, alors c'est refusé avec la raison ; avec 8 badges c'est autorisé.
- [x] Étant donné la Ligue, quand j'enchaîne les boss, alors ils arrivent dans l'ordre de la V1, chacun avec son minuteur (F) et son nombre de Pokémon ; la victoire du boss n suit sur le boss n+1 avec un dialogue d'enchaînement.
- [x] Étant donné le Maître Blue, quand il entre, alors son « counter » est celui du starter choisi (table de la V1, test des trois starters) ; sa défaite incrémente `leagueWins` une seule fois et déclenche l'événement `boss-vaincu` consommé par R.
- [x] Étant donné une défaite sur un boss de la Ligue, quand le minuteur expire ou que l'équipe est vaincue, alors le jeu revient au début de ce boss avec un message ; aucun gain n'est perdu.
- [x] Étant donné un rechargement pendant la Ligue, quand je rouvre, alors je reprends au boss en cours.

### Hors périmètre
Panthéon (R), annonce de Johto, défi secret de Chen (X).

### Vérification
`npm test -- ligue` ; scénario e2e : sauvegarde de test avec les 8 badges et une équipe forte, la Ligue est parcourue.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : équilibrage des minuteurs (30 s) à confirmer par essai ; ne pas les modifier sans ticket. Dépend de : A, C, F, H.

---

## R. `feat(pantheon): Panthéon, fondu, socles, chute des Pokémon et confettis`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux voir mon équipe honorée au Panthéon après la Ligue afin de ressentir la fin du parcours.

### Contexte
V1 : `legacy/js/game/hall-of-fame.js`, `render.js` (`renderHallOfFame`), `confetti.js`. Décors : D. **Règles V1** : fondu depuis la Ligue, Chen parle (**3 lignes à la première victoire**, une ligne ensuite), l'équipe se place sur **6 socles** (positions à convertir en fractions de la scène), puis **un Pokémon chute toutes les 2 s** à sa place, confettis, puis le jeu propose de continuer ; l'annonce de Johto est un **stub** (message « bientôt »). **Première étape : trois variantes** de l'écran (convention de Nicolas pour toute nouvelle page) ; Nicolas choisit avant le code. Fichiers : `src/ui/Pantheon.tsx`, `src/ui/confettis.ts`, `data/pantheon.json` (socles).

### Critères d'acceptation
- [x] Étant donné trois variantes de l'écran (A, B, C) livrées sous `design/variantes/pantheon/`, quand Nicolas en choisit une, alors seule celle-là est implémentée (étape bloquante).
- [x] Étant donné la victoire du Maître (Q), quand le Panthéon s'ouvre, alors un fondu de 800 ms démarre, Chen dit 3 lignes à la première victoire (`leagueWins === 1`) et une seule ensuite.
- [x] Étant donné une équipe de 1 à 6 Pokémon, quand l'animation joue, alors les Pokémon tombent un par un toutes les 2 s sur leurs socles (fractions de la scène, aucune position en pixels) ; les socles inutilisés restent vides.
- [x] Étant donné la fin de l'animation, quand les confettis partent, alors ils durent moins de 4 s, ne bloquent pas les clics et se désactivent avec `prefers-reduced-motion`.
- [x] Étant donné « Continuer », quand je clique, alors je reviens au jeu (zone 1 en mode « après la Ligue » : le contenu de Johto est un message « bientôt » ; rien d'autre n'est inventé).
- [x] Étant donné 390 et 1440 px, quand le Panthéon s'affiche, alors tout est visible sans défiler ; textes en français ; l'équipe affichée est celle de la sauvegarde.

### Hors périmètre
Contenu de Johto, défi secret et crédits (X), enregistrement de l'équipe dans un « livre d'or » (phase 6).

### Vérification
`npm test -- pantheon` ; Playwright : parcours depuis une sauvegarde de test sur le Maître vaincu ; captures à 390, 1440 et 1915 px.

### Effort et risques
Fourchette : 2 à 3 jours (hors choix des variantes). Risque : animation séquencée longue : tests à horloge simulée. Dépend de : Q, O, D.

---

## S. `feat(scenes): rival, Ronflex et Pokéflûte`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:3` · branche : `v2` · `agent-ok` : oui (décisions de Nicolas du 25/10 appliquées ; fait le 26/10, CI verte, e2e `scenes.spec.ts`)

### Histoire
En tant que joueur, je veux des rencontres avec le rival et un obstacle (Ronflex) levé par la Pokéflûte afin que Kanto ne soit pas qu'une suite de zones.

### Contexte
V1 : `legacy/js/game/rival.js`, `snorlax.js` (le rival et Ronflex ne sont pas dans les 22 zones). **Nouveau en V2** : la Pokéflûte comme objet clé et Ronflex comme obstacle (tel que décidé en phase 2 ; la V1 gère Ronflex autrement). **Règles V1 à vérifier** : rival aux Blue de Route 22, Azuria, Lavanville, Safrania (équipes selon le starter choisi) ; Ronflex bloque la route entre deux zones tant que la flûte manque. **Ce ticket n'est pas prêt** : l'ADR 0002 a trois points ouverts (conditions multi-drapeaux, reprise en combat, objets clés) ; Nicolas doit les trancher et dire où, dans Kanto, tombent les rencontres exactes. Pas de `agent-ok` tant que ce n'est pas fait.

### Critères d'acceptation
- [x] Étant donné chaque rencontre du rival (5 : Forêt de Jade, Arène de Carmin, Tour Pokémon, Sylphe SARL, Route Victoire ; contenu V2 inspiré des jeux, la V1 n'a pas de rival), quand je l'atteins, alors l'équipe dépend du starter (test des trois starters) ; le rival est obligatoire pour passer (décision de Nicolas du 25/10), une défaite renvoie au premier Pokémon du rival ; ces combats n'écrivent ni badge, ni `bossVaincus`, ni `ligueGagnee`, et n'ouvrent pas le Panthéon.
- [x] Étant donné Ronflex, quand j'essaie de passer sans Pokéflûte, alors l'accès est bloqué avec la raison en français ; la Pokéflûte (objet clé, non achetable) se donne à la Tour Pokémon, se joue depuis le Sac « Objets clés », réveille Ronflex puis combat ; une fois battu, la route s'ouvre.
- [x] Étant donné un rechargement après la rencontre, quand je rouvre, alors le drapeau est conservé et la scène ne se rejoue pas (e2e `scenes.spec.ts` à 390 et 1440 px).

### Hors périmètre
Autres objets clés (Vélo, Canne : absents de la V1), quêtes annexes.

### Vérification
`npm test -- scenes` ; scénario e2e après décision.

### Effort et risques
Fourchette : 2 à 3 jours **après** décision. Risque : spécification incomplète si lancé trop tôt. Dépend de : O, F, C ; décisions ADR 0002.

---

## T. `feat(pension): pension, œufs et éclosions`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux déposer deux Pokémon à la pension et faire éclore des œufs afin d'obtenir de nouveaux Pokémon et d'améliorer mon Pokédex.

### Contexte
V1 : `legacy/js/game/daycare.js`, `render.js` (`renderDaycare`). Pages : choix de Nicolas (B). **Règles V1** : débloquée à la zone 11 ; **2 emplacements de parents** ; **emplacements d'œuf** achetés `slots × 5000` jusqu'à 5 ; la ponte a une chance de **4 %** si l'un des parents est Métamorph ou si mâle + femelle de la même espèce de base, de **2 %** si les types sont partagés, sinon 0 ; l'œuf est **shiny avec 1/8** (avec un parent shiny) et sinon 1/256 ; l'éclosion exige **25 éliminations** d'ennemis ; la naissance donne un Pokémon de **niveau 1, bonheur 125** ; l'éclosion ajoute au Pokédex. Un parent est un Pokémon de l'équipe ou du PC ; il y revient quand on le retire. Fichiers : `src/core/pension.ts`, `src/ui/PagePension.tsx`.

### Critères d'acceptation
- [x] Étant donné la zone 10 ouverte, quand j'ouvre le menu, alors la pension est verrouillée avec la raison ; à la zone 11 elle s'ouvre.
- [x] Étant donné 2 parents compatibles, quand ils sont déposés, alors le test de ponte utilise exactement les probabilités de la V1 (4 %, 2 %, 0) sur 1 000 tirages injectés, comparés à la V1 (fixture) ; avec des parents incompatibles aucun œuf n'apparaît.
- [x] Étant donné les emplacements d'œuf, quand j'en achète un, alors le prix est `slots × 5000` et jamais plus de 5 ; sans argent le bouton est désactivé avec la raison.
- [x] Étant donné un œuf, quand 25 ennemis sont éliminés (compteur partagé avec le combat), alors il éclot : un Pokémon de niveau 1, bonheur 125, ajouté au Pokédex et à l'équipe (ou au PC si l'équipe est pleine) ; la progression est sauvegardée (`pension` dans la région).
- [x] Étant donné un rechargement, quand je rouvre, alors parents, œufs et compteurs sont identiques.
- [x] Étant donné 390 et 1440 px, quand la pension s'ouvre, alors tout est lisible sans défiler en largeur ; textes en français.

### Hors périmètre
Attaques héritées (absentes de la V1), natures, IV ; bonheur et évolutions par bonheur.

### Vérification
`npm test -- pension` ; `node scripts/extraire-pension-v1.mjs` ; Playwright 390 et 1440 px.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : le compteur d'éliminations n'existe pas dans le cœur actuel (à ajouter dans `statistiques`, ticket A). Dépend de : H, I, E.

---

## U. `feat(centre-commercial): Centre commercial de la zone 11`

Labels : `type:feat`, `etat:fait`, `est:1-2`, `prio:3` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux un Centre commercial où acheter des objets temporaires afin de varier mes stratégies.

### Contexte
V1 : `legacy/js/game/mall.js` (21 l.), `constants.js` (`ITEMS` du Centre). **Règles V1** : débloqué à la zone 11 ; il vend Attaque + (7 500) et Attaque Spé + (10 000), leurs effets étant ceux du ticket M ; la page utilise la même mise en page que le Shop. Le Centre n'a pas de stock limité. Fichiers : `src/ui/PageCentre.tsx`, `data/objets.json` (entrées `lieu: "centre-commercial"`).

### Critères d'acceptation
- [x] Étant donné la zone 10, quand j'ouvre le menu, alors le Centre est verrouillé avec la raison ; à la zone 11 il s'ouvre.
- [x] Étant donné le Centre, quand je regarde les objets, alors Attaque + et Attaque Spé + sont proposés à 7 500 et 10 000 avec leurs effets décrits (« ×1,5 pendant 30 s »).
- [x] Étant donné un achat, quand je confirme, alors l'objet arrive dans le Sac et l'argent baisse comme au Shop (L) ; sans argent, bouton désactivé avec la raison.
- [x] Étant donné 390 et 1440 px, quand la page s'ouvre, alors elle reste cohérente avec la variante de Shop choisie en B.

### Hors périmètre
Nouveaux objets absents de la V1, vente d'objets.

### Vérification
`npm test -- centre` ; Playwright 390 et 1440 px.

### Effort et risques
Fourchette : 1 à 2 jours. Risque : minimal (réutilise L). Dépend de : L, M, G.

---

## V. `feat(casino): casino, machine à sous, blackjack, pile ou face et boutique de jetons`

Labels : `type:feat`, `etat:fait`, `est:3`, `prio:3` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux jouer au casino avec l'argent du jeu afin de tenter ma chance et d'obtenir des objets rares.

### Contexte
V1 : `legacy/js/game/casino.js` (nombreux modules), `render.js` (`renderCasino`). **Argent virtuel seulement : aucune monnaie réelle, aucun paiement, aucune donnée personnelle.** Pages : choix de Nicolas (B). **Règles V1** : le casino se débloque dans la zone du Casino de Céladopole (voir le champ `lieu` de C) ; **jetons : 1 000 $ → 50 jetons ; rachat : 50 jetons → 1 000 $** ; **machine à sous** : poids des symboles 1 / 6 / 10 / 18 / 65, gains ×500 / ×50 / ×20 / ×10 / ×5, **deux baies = ×2** ; **blackjack** : mise ×2 si victoire, blackjack naturel ×2,5, égalité remboursée, le croupier tire jusqu'à 17 ; **pile ou face** : ×2 ; **boutique de jetons** : Abra 250, Bonbon 500, Insécateur 1 000, Minidraco 4 000, Porygon 5 000, CT Jackpot 10 000, Master Ball 40 000 ; les Pokémon achetés s'ajoutent au Pokédex. Fichiers : `src/core/casino.ts` (fonctions pures avec tirage injecté), `src/ui/Casino*.tsx`, `data/casino.json`.

### Critères d'acceptation
- [x] Étant donné la V1, quand le script extrait les poids et gains, alors `data/casino.json` contient ces valeurs ; un test tire 100 000 mains avec un générateur graine et compare l'espérance au code V1 (fixture).
- [x] Étant donné la machine à sous, quand je tire avec un générateur injecté, alors trois symboles identiques paient le gain de la V1, deux baies paient ×2, sinon rien ; la mise est débitée avant le tirage.
- [x] Étant donné le blackjack, quand je joue des mains scénarisées (blackjack naturel, égalité, dépassement, croupier à 17), alors les gains sont ceux de la V1.
- [x] Étant donné pile ou face, quand je gagne, alors la mise est doublée ; sinon perdue.
- [x] Étant donné la boutique, quand j'achète un Pokémon avec des jetons, alors il rejoint l'équipe (ou le PC) et le Pokédex ; les objets (Bonbon, CT Jackpot, Master Ball) arrivent dans le Sac ; jetons insuffisants → bouton désactivé avec la raison.
- [x] Étant donné un rechargement, quand je rouvre, alors jetons et état sont conservés ; une partie de blackjack en cours est abandonnée proprement (mise remboursée) ou reprise, selon le choix du ticket (à trancher à la livraison et à écrire).
- [x] Étant donné la page, quand elle s'ouvre, alors un rappel « Argent virtuel uniquement » est affiché ; aucune réclame de jeu d'argent réel.

### Hors périmètre
Salles de jeu supplémentaires, tournois, classement.

### Vérification
`npm test -- casino` ; `node scripts/extraire-casino-v1.mjs` ; Playwright 390 et 1440 px.

### Effort et risques
Fourchette : 3 jours. Risque : état de jeu intermédiaire (main de blackjack) à sauvegarder. Dépend de : L, E, G.

---

## W. `feat(easter-eggs): easter eggs de renommage en données`

Labels : `type:feat`, `etat:fait`, `est:1`, `prio:3` · branche : `v2` · `agent-ok` : oui (sous réserve des assets)

### Histoire
En tant que joueur, je veux retrouver les surprises cachées de la V1 quand je renomme un Pokémon afin de garder l'esprit du jeu.

### Contexte
V1 : `legacy/js/game/easter-eggs.js`, `render.js`. **Règles V1** : renommer un Pokémon avec **dinnerbone** ou **grumm** retourne son sprite ; **jeb_** change ses couleurs en arc-en-ciel animé ; **caca** applique le texte et l'effet de la V1 ; **Daran** (affichage d'images de stade et lecture de `Daran.mp4`). Les noms sont comparés sans casse. Le renommage est limité à 12 caractères (H). **Bjorn et Gabriel** : inactifs tant que Nicolas n'a pas défini leur apparence (point ouvert dans `design/DESIGN.md`). Fichiers : `data/easter-eggs.json` (registre : nom, effet, assets), `src/ui/easter-eggs.ts`.

### Critères d'acceptation
- [x] Étant donné chaque easter egg de la V1, quand je renomme un Pokémon avec le nom déclencheur (insensible à la casse), alors l'effet visuel de la V1 s'applique à son sprite et il disparaît au renommage suivant.
- [x] Étant donné « Daran », quand je renomme, alors les images de stade s'affichent et la vidéo se lance sur action de l'utilisateur seulement (pas d'autoplay avec son).
- [x] Étant donné Bjorn et Gabriel, quand je les saisis, alors rien de spécial ne se passe (entrées du registre marquées `inactif` avec la raison dans le fichier).
- [x] Étant donné `prefers-reduced-motion`, quand j'active jeb_, alors la couleur est fixe (pas d'animation).
- [x] Étant donné un rechargement, quand je rouvre, alors le surnom est conservé et l'effet toujours appliqué.

### Hors périmètre
Nouveaux easter eggs, apparence de Bjorn et Gabriel.

### Vérification
`npm test -- easter-eggs` ; Playwright : renommer et capturer.

### Effort et risques
Fourchette : 1 jour. Risque : assets (images de stade, vidéo) à reprendre de la V1 avec l'accord de Nicolas pour le poids. Dépend de : H.

---

## X. `feat(fin): fin de partie, diplôme, défi secret de Chen et crédits`

Labels : `type:feat`, `etat:fait`, `est:3`, `prio:3` · branche : `v2` · `agent-ok` : oui (hors jalon 2)

### Histoire
En tant que joueur, je veux une vraie fin quand j'ai complété le Pokédex afin de ressentir l'accomplissement.

### Contexte
V1 : `legacy/js/game/endgame.js`, `credits.js`, `render.js`. **Règles V1** : Pokédex à 151 → diplôme (page avec nom et date, impression possible), Charme Chroma (palier 151 de N), **défi secret de Chen** : combat contre une équipe de 6 Pokémon de niveau 100 ; les **crédits** défilent pendant 110 s (texte, image, musique si présente). Priorité 3 : hors jalon 2, à faire si le temps le permet. Fichiers : `src/ui/Diplome.tsx`, `src/ui/Credits.tsx`, `data/credits.json`.

### Critères d'acceptation
- [x] Étant donné 151 espèces au Pokédex (I), quand le palier est atteint, alors le diplôme s'affiche avec le nom du dresseur et la date, et peut être fermé ; il est rejouable depuis la page Plus.
- [x] Étant donné la victoire du Panthéon (R) et le diplôme obtenu, quand Chen propose le défi secret, alors le combat contre ses 6 Pokémon de niveau 100 s'enchaîne (données extraites de la V1) ; la victoire est enregistrée une seule fois.
- [x] Étant donné les crédits, quand ils démarrent, alors ils durent 110 s, défilent sans saccade, peuvent être sautés d'un geste ; le texte vient de `data/credits.json`.
- [x] Étant donné `prefers-reduced-motion`, quand les crédits défilent, alors le défilement est remplacé par un affichage par pages.

### Hors périmètre
Contenu de Johto, succès supplémentaires.

### Vérification
`npm test -- fin` ; captures.

### Effort et risques
Fourchette : 3 jours. Risque : musique et droits (aucun fichier audio n'est ajouté sans accord de Nicolas). Dépend de : R, I.

---

## Z. `feat(v1): reprendre les animations, les sons et les finitions visuelles de la V1`

Labels : `type:feat`, `etat:fait`, `est:3-4`, `prio:2` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que joueur de la V1, je veux retrouver les animations, les sons et les petits effets que j'aimais afin que la V2 ait la même âme que mon jeu.

### Contexte
Demande de Nicolas (24/10) : « la V1 c'est l'idéal de mon jeu : le visuel, les animations, les easter eggs, c'est pile ce que j'aimais ». Inventaire complet dans `docs/projet/v1-visuel-a-porter.md` § 4 et § 7. Ce ticket couvre le **transversal** qui n'appartient à aucune page : animations du combat, de la capture, de l'évolution, du shiny, de la victoire ; sons ; finitions. Les animations propres à une page (vol de la carte, badge, intro, Panthéon, casino) sont dans le ticket de leur page. Chaque animation est reprise avec ses durées de la V1, retravaillée seulement pour respecter `design/DESIGN.md` (propriétés `transform` et `opacity`, pas de `steps()` sur un sprite, `prefers-reduced-motion`). Fichiers : `src/ui/animations/` (nouveau), `src/ui/sons.ts` (nouveau), `data/animations.json` (durées).

### Critères d'acceptation
- [x] Étant donné l'inventaire de la V1, quand j'ouvre `docs/projet/v1-visuel-a-porter.md`, alors chaque animation du § 4 a un état : reprise (avec le ticket qui la porte), retravaillée (avec la raison) ou écartée par Nicolas ; aucune n'est supprimée sans son accord.
- [x] Étant donné un Pokémon sauvage, quand il est à l'écran, alors il flotte doucement (3 s en boucle) ; à chaque toucher, il tremble 0,3 s avec un éclat blanc ; les nombres de dégâts sont verts si le premier Pokémon de l'équipe est efficace et rouges sinon.
- [x] Étant donné une capture, quand la balle est lancée, alors le sprite devient une silhouette noire qui tremble pendant 1 s avant le résultat ; l'évolution fait clignoter en blanc 3 s en alternant les deux formes toutes les 150 ms ; un shiny a son halo doré et la bannière « Shiny apparu ! Auto stoppé ! » qui rebondit 3 s.
- [x] Étant donné les sons, quand je clique, tue un ennemi, capture, monte de niveau ou range un Pokémon au PC, alors le son de la V1 correspondant se joue (cinq tons courts synthétisés par la Web Audio, sans fichier ni bibliothèque), un interrupteur « Son » dans Plus les coupe, et rien ne se joue avant le premier geste du joueur (règle des navigateurs).
- [x] Étant donné `prefers-reduced-motion`, quand une animation devrait se jouer, alors elle est remplacée par un changement d'état instantané ou un fondu, sans perdre l'information.
- [x] Étant donné la musique, quand Nicolas a choisi des morceaux, alors chaque fichier est local, sous licence libre ou généré (source et licence notées dans `docs/projet/musiques.md`), jouable seulement après un geste du joueur, coupable dans Plus, et le thème de victoire de la Ligue se joue au Panthéon.
- [x] Étant donné les finitions de la V1 (contour noir des textes, verre dépoli des panneaux, étoiles ✦, message « Recherche en cours… » entre deux ennemis), quand je les compare, alors chacune est reprise ou écartée par Nicolas, notée dans l'inventaire.

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

Labels : `type:test`, `etat:fait`, `est:1-2`, `prio:1` · branche : `v2` · `agent-ok` : oui

### Histoire
En tant que Nicolas, je veux un test automatique qui parcourt Kanto de l'intro à la Ligue afin d'être certain que le jeu est jouable avant d'y jouer moi-même.

### Contexte
Le jalon 2 = « Kanto jouable de bout en bout ». Aucune triche : le test n'ajoute ni argent ni niveaux hors des sauvegardes de test, chacune construite par le cœur à une étape précise. `tests-e2e/jalon-2.spec.ts` (nouveau). Sauvegardes de test dans `tests-e2e/fixtures/jalon-2/` (générées par `scripts/creer-sauvegarde-test.mjs`, versionnées, avec le numéro de schéma). Le test de fluidité reste séparé et se relance au repos.

### Critères d'acceptation
- [x] Étant donné une sauvegarde neuve, quand le test joue l'intro et choisit chacun des trois starters (trois projets), alors l'équipe contient un seul Pokémon de niveau 5.
- [x] Étant donné des sauvegardes aux étapes clés (zone 3 avec badge Roche, zone 11 avec pension, zone 18 avec badge Volcan, zone 21 avec 8 badges), quand le test les charge, alors elles se migrent sans erreur et le jeu affiche la zone attendue.
- [x] Étant donné une capture, une évolution, un achat au Shop, une éclosion et un tour de casino scénarisés, quand le test les joue, alors l'état final de chacun est vérifié par l'interface (pas par le cœur).
- [x] Étant donné la Ligue, quand le test bat les dix boss avec l'équipe de la sauvegarde, alors le Panthéon s'ouvre et `leagueWins === 1`.
- [x] Étant donné les trois tailles (390, 1440, 1915 px), quand le test parcourt les pages principales, alors aucune ne défile horizontalement, aucune erreur console, aucun texte en anglais (liste de contrôle).
- [x] Étant donné la CI, quand le test tourne, alors il dure moins de 10 minutes et la CI complète reste verte.

### Hors périmètre
Essai de Nicolas (jalon humain, hors CI), équilibrage fin.

### Vérification
`npm run test:e2e -- jalon-2` ; rapport Playwright joint à `docs/projet/jalon-2.md`.

### Effort et risques
Fourchette : 1 à 2 jours. Risque : fragile si les temps de combat varient ; utiliser l'horloge simulée de l'interface de test. Dépend de : A à W et Z.

---

# Retours d'essai du 28/10/2026 (rapport 2)

Source : `docs/projet/essai-nicolas-28-10-rapport-2.md` (34 points de Nicolas, recopiés mot pour mot, plus les vérifications faites dans le code). Nicolas a joué de la Route 1 à la Sylphe SARL. Tickets AA à AL, tous `etat:idee` tant que Nicolas ne les a pas passés en « prêt ». Rien n'est codé, rien n'est créé sur un dépôt distant. Le numéro entre crochets renvoie au point du rapport.

Règles communes à ces tickets :
- Toute valeur de jeu vient de `data/*.json`, jamais du code. Une règle qui s'écarte de la V1 est annoncée dans le ticket et approuvée par Nicolas (c'est le cas de AA et AB).
- Tout ticket d'interface renvoie à `design/DESIGN.md`. Captures à 390 et 1440 px (et 1915 px pour l'écran de combat) regardées avant de montrer.
- AE, AF, AG et AJ touchent à des écrans : trois variantes navigables à choisir par Nicolas avant le code (règle de `CLAUDE.md`), dans la vraie appli et pas sur des captures.

Ordre conseillé : AA, AC, AD, AK, AL (petits, sans variantes), puis AB (simulation), AE à AG (écran de combat, variantes), AH, AI, AJ.

| Lot | Tickets | Points du rapport |
|---|---|---|
| A. Valeurs et règles | AA, AB | 6, 10, 17, 18, 23, 24, 27, 31, 32, 33 |
| B. Écran de combat | AE, AF, AG, AD | 1, 4, 11, 12, 15, 16, 19, 20, 21, 26, 28 |
| C. Sons | AC | 2, 3 |
| D. Narration et notifications | AH, AI, AJ | 5, 7, 14, 22, 25, 30 |
| E. Divers | AK, AL | 9, 29 |

---

## AA. `fix(regles): calcium à 20 000, pierres à prix fixe et recharge du Fauchage à 20 s`

Labels : `type:fix`, `etat:fait`, `est:0.5-1`, `prio:1` · branche : `fix/aa-prix-calcium-pierres-fauchage` · `agent-ok` : oui (fait le 28/10, commit local, non poussé ; Pierre Stase laissée à 10 000 avec inflation, question posée à Nicolas)

### Histoire
En tant que joueur, je veux un Calcium à 20 000, des Pierres d'évolution qui restent à 10 000 et un Fauchage qui se recharge en 20 s afin que ces objets soient accessibles au rythme où le jeu donne l'argent. [23, 24, 32]

### Contexte
Valeurs actuelles, identiques à la V1 : Calcium 50 000 sans inflation (`data/objets.json`, id `calcium`), les cinq pierres 10 000 mais **avec** l'inflation de 5 % par badge (`data/reglages.json`, `boutique.inflationParBadge`, `sansInflation: false`), Fauchage `objetsActifs.rechargeFauchageMs` 30 000. À la Sylphe SARL (au moins 6 badges) une pierre coûte donc déjà 13 000 ou plus : c'est probablement ce que Nicolas a vu. **Écarts avec la V1 voulus par Nicolas**, à noter dans « Corrections de la V1 » en tête du backlog. Fichiers : `data/objets.json`, `data/reglages.json`, tests `src/core/boutique.test.ts` et les tests de fidélité qui lisent les prix de la V1 (`tests/progression-fidelite.test.ts`, à adapter avec la raison de l'écart).

### Critères d'acceptation
- [ ] Étant donné le Centre commercial ouvert, quand je regarde le Calcium, alors son prix est 20 000, quel que soit le nombre de badges.
- [ ] Étant donné 0 puis 8 badges, quand je regarde chaque Pierre (Feu, Eau, Plante, Foudre, Lune), alors le prix est 10 000 dans les deux cas.
- [ ] Étant donné un Fauchage utilisé, quand 20 s se sont écoulées, alors il est de nouveau disponible ; à 19,9 s il ne l'est pas.
- [ ] Étant donné une sauvegarde où le Fauchage était en recharge avec l'ancienne durée, quand je la charge, alors le chrono restant ne dépasse pas 20 s.
- [ ] Étant donné les tests de fidélité à la V1, quand ils tournent, alors les trois écarts sont listés comme « écarts voulus » avec la décision de Nicolas du 28/10, et rien d'autre ne change.

### Hors périmètre
Inflation des autres objets, autres prix du Centre commercial, durée d'effet des objets actifs (30 s).

### Vérification
`npx.cmd vitest run --configLoader runner --no-file-parallelism src/core/boutique.test.ts tests/progression-fidelite.test.ts` puis `npm.cmd run ci`.

### Effort et risques
Fourchette : 0,5 à 1 jour. Risque : question à confirmer par Nicolas, « pierres à 10k » veut-il dire sans inflation ? Dépend de : rien.

---

## AB. `feat(equilibrage): argent ×2, début de partie plus exigeant, fin de Kanto 20 % plus douce`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/ab-equilibrage-28-10` · `agent-ok` : **non, relecture humaine** (change les règles de jeu)

### Histoire
En tant que joueur, je veux que les deux premières zones demandent de jouer, que la suite se paie avec l'argent gagné en jouant et que Kanto après la Centrale soit environ 20 % moins dur afin que les bonus du Pokédex et du Shop comptent sans bloquer. [6, 10, 18, 31, 33, 27]

### Contexte
Retours de Nicolas : début « beaucoup trop facile, on n'a même pas besoin de cliquer » (zones 1 et 2) ; à partir du Mont Sélénite « ça va » ; à partir de la Centrale « un peu trop dur, mes Pokémon sont over level, je ne peux pas battre les boss sans Attaque + et Attaque Spé + » alors que son Pokédex est presque rempli ; argent « un peu trop dur à avoir », il propose ×2 sur les gains globaux, sinon l'XP monte trop vite par rapport à ce qu'on peut acheter ; « 20 % moins dur ou quelque chose comme ça » ; les bonus du Pokédex et du Shop doivent être « quasiment indispensables ». Aujourd'hui : l'or d'un ennemi vaincu vient de `data/reglages.json` (`recompenses.or`, avec `coefNiveau` 4 et `exposant` 1,4), le ×2 de la V1 n'existe que sur la capture (`src/core/capture.ts:70`). PV des ennemis par `zone.multiplicateurPv` dans `data/regions/kanto/zones.json` et `combat.pvParNiveau`. **Ce ticket modifie des règles de jeu** : Nicolas valide les chiffres proposés avant de les appliquer. Il recoupe la phase 3 (« Kanto en 60-90 min à 7 clics/s ») : il prépare l'outil de simulation que la phase 3 réutilisera au lieu de le refaire.

### Critères d'acceptation
- [ ] Étant donné un joueur à 7 clics/s qui suit le parcours normal, quand le simulateur (`scripts/simuler-parcours.mjs`, nouveau, appelle `src/core` sans DOM) joue Kanto, alors il sort un tableau par zone : temps passé, niveau moyen de l'équipe, argent gagné, argent dépensé, victoire ou échec du boss.
- [ ] Étant donné les zones 1 et 2 (Route 1 et Forêt de Jade), quand le simulateur joue sans aucun clic, alors le boss n'est pas battu dans les 30 s avec l'équipe de départ ; avec 7 clics/s il l'est.
- [ ] Étant donné la Centrale et les zones suivantes, quand le simulateur joue avec le Pokédex tel qu'il est à ce moment du parcours et sans Attaque + ni Attaque Spé +, alors les boss sont battus avec une marge d'environ 20 % de moins qu'avant le changement (marge mesurée : PV du boss ÷ dégâts cumulés en 30 s).
- [ ] Étant donné un joueur sans les bonus du Pokédex ni les objets du Shop (Attaque +, Attaque Spé +, Restes, Protéine…), quand le simulateur joue à partir de la Centrale, alors il échoue sur au moins un boss ; avec eux il passe. Les bonus sont donc utiles sans être bloquants pour un joueur qui sait s'en servir.
- [ ] Étant donné un ennemi vaincu, quand l'or est calculé, alors tous les gains (ennemi, boss, capture, shiny) sont multipliés par 2, la capture ne l'est pas deux fois ; la valeur vient de `data/reglages.json`.
- [ ] Étant donné les zones 1 à 10, quand le simulateur joue, alors l'argent gagné dans une zone permet d'acheter les balles et les objets de cette zone sans refaire la zone précédente (critère mesuré : temps de farm hors progression inférieur à 20 % du temps total).
- [ ] Étant donné 10 000 rencontres simulées dans chaque zone qui a un légendaire, quand le simulateur les compte, alors la fréquence mesurée de chaque légendaire est celle des données (Mew 1 %, Artikodin 2 %, Électhor, Sulfura et Mewtwo 5 %) à un écart près de la statistique, et la table est jointe à `docs/projet/equilibrage-28-10.md`.
- [ ] Étant donné la sauvegarde d'un joueur existant, quand je la charge, alors rien n'est modifié dans son argent ni ses niveaux.

### Hors périmètre
Refonte complète de l'équilibrage (phase 3), nouveaux objets, difficulté des zones après la Ligue, mode de difficulté choisi par le joueur.

### Vérification
`node scripts/simuler-parcours.mjs --clics 7` (tableau joint à `docs/projet/equilibrage-28-10.md`) ; tests `src/core/recompenses.test.ts`, `src/core/ennemis.test.ts` ; essai de Nicolas de la Route 1 à la Sylphe.

### Effort et risques
Fourchette : 2 à 3 jours. Risques : les cibles (« 20 % ») sont à interpréter ; le simulateur doit reproduire la boucle de jeu sans copier sa logique (le brancher sur `src/core/loop.ts`). Je propose les chiffres, Nicolas tranche avant le code. Dépend de : AA (mêmes fichiers `data/reglages.json` et `data/objets.json`).

---

## AC. `fix(son): retirer le son de clic, régler le volume du son et de la musique`

Labels : `type:fix`, `etat:fait`, `est:1-1.5`, `prio:1` · branche : `fix/ac-sons-volumes` · `agent-ok` : oui (fait le 28/10 ; volumes de départ 40 / 30 et anti-rebond 80 ms dans `data/`, à ajuster à l'écoute)

### Histoire
En tant que joueur qui clique vite, je veux que le clic ne fasse plus de bruit continu et pouvoir régler le volume des effets et de la musique afin de jouer sans me fatiguer les oreilles. [2, 3]

### Contexte
Le son de clic de la V1 est repris dans `src/ui/sons.ts` ; à 12 clics/s il bourdonne. La musique est dans `src/ui/musique.ts` (pistes dans `data/musiques.json`). `PagePlus.tsx` a aujourd'hui un interrupteur « Son » et un pour la musique, pas de volume. Nicolas dit aussi que le volume par défaut est « trop fort ». Fichiers : `src/ui/sons.ts`, `src/ui/musique.ts`, `src/ui/PagePlus.tsx`, `src/core/sauvegarde-types.ts` (préférences), `data/reglages.json`. Les durées et le volume viennent des données.

### Critères d'acceptation
- [ ] Étant donné un clic sur l'ennemi, quand je clique, alors aucun son n'est joué ; la mort d'un ennemi, la capture, le niveau gagné et l'envoi au PC gardent leur son.
- [ ] Étant donné deux sons identiques déclenchés à moins de 80 ms l'un de l'autre, quand ils arrivent, alors un seul est joué (durée dans `data/reglages.json`).
- [ ] Étant donné la page Plus, quand je l'ouvre, alors deux curseurs « Effets » et « Musique » de 0 à 100 existent, chacun avec son libellé et sa valeur en pourcentage, utilisables au clavier et au toucher (cible de 44 px).
- [ ] Étant donné une partie neuve, quand je lance le jeu, alors les effets sont à 40 et la musique à 30 (valeurs de départ dans `data/reglages.json`, à ajuster par Nicolas à l'écoute).
- [ ] Étant donné un réglage modifié, quand je recharge la page, alors les deux valeurs sont conservées (préférence de l'appareil, pas de la région).
- [ ] Étant donné une ancienne sauvegarde sans volume, quand je la charge, alors les valeurs de départ s'appliquent sans erreur.

### Hors périmètre
Nouvelles pistes, égaliseur, son par type d'événement.

### Vérification
`npx.cmd vitest run --configLoader runner --no-file-parallelism src/ui/sons.test.ts src/ui/musique.test.ts` ; `tests/sons-fidelite.test.ts` adapté (le son de clic n'existe plus : écart voulu, noté) ; essai de Nicolas au casque.

### Effort et risques
Fourchette : 1 à 1,5 jour. Risque : un test de fidélité aux sons de la V1 devra accepter l'écart. Dépend de : rien.

---

## AD. `feat(navigation): le PC dans la barre de navigation, grisé jusqu'à Argenta`

Labels : `type:feat`, `etat:fait`, `est:1-1.5`, `prio:2` · branche : `feat/ad-pc-navigation` · `agent-ok` : oui (fait le 28/10 ; écart au ticket : l'entrée grisée ouvre la page PC qui donne la raison, au lieu d'une annonce sans changer de page ; pas d'`aria-disabled`, question posée à Nicolas)

### Histoire
En tant que joueur, je veux le PC dans la barre de navigation, grisé tant que je n'ai pas battu le boss d'Argenta afin de le trouver sans fouiller le menu Plus et de savoir qu'il viendra. [4]

### Contexte
`src/ui/Navigation.tsx` liste les entrées de la barre ; `PagePC.tsx` est aujourd'hui atteint par `PagePlus.tsx`. La règle d'ouverture est dans `data/reglages.json` (`pc.zone` = `kanto.arene-d-argenta`, `pc.raison`). Le Plus n'est pas encore décidé pour la barre à 5 entrées sur mobile : vérifier la place à 390 px (cible de 44 px, `design/DESIGN.md`).

### Critères d'acceptation
- [ ] Étant donné une partie avant Argenta, quand je regarde la barre, alors « PC » est visible, grisé, et un toucher affiche la raison « Le PC de Léo s'ouvre à l'Arène d'Argenta. » sans changer de page.
- [ ] Étant donné le boss d'Argenta battu, quand je regarde la barre, alors « PC » est actif et ouvre `PagePC`.
- [ ] Étant donné la page Plus, quand je l'ouvre, alors le PC n'y est plus listé (pas de doublon).
- [ ] Étant donné 390 px de large, quand je regarde la barre, alors toutes les entrées tiennent sans défilement horizontal, chacune avec une cible d'au moins 44 px.
- [ ] Étant donné le clavier, quand je navigue avec Tab, alors l'entrée grisée reste atteignable et annonce sa raison (`aria-disabled`, pas `disabled`).

### Hors périmètre
Refonte de la barre, ordre des autres entrées.

### Vérification
`src/ui/Navigation.test.tsx`, e2e `tests-e2e/navigation.spec.ts` (390 et 1440 px) ; capture jointe.

### Effort et risques
Fourchette : 1 à 1,5 jour. Risque : place sur mobile. Dépend de : rien.

---

## AE. `feat(combat): boutons d'action en icônes, entre « Ton équipe » et le DPS`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/ae-actions-icones` · `agent-ok` : oui après le choix des variantes

### Histoire
En tant que joueur, je veux les actions du combat (Auto-clic, Auto-attaque, Arrêt auto et ses réglages, Fauchage, Poké-Radar) sous forme d'icônes à côté de l'équipe, et seulement quand elles sont débloquées afin que l'écran ne ressemble plus à une zone de test. [1, 20, 21, 28]

### Contexte
Capture du rapport : `EcranCombat.tsx` empile des gros boutons « Pokéball ×5 », « Capturer », « Auto-attaque », « Auto-clic — Nécessite l'objet Restes », « Arrêt auto », « Réglages de l'arrêt », « Fauchage — Nécessite la CT Fauchage », « Poké-Radar — Nécessite le Poké-Radar ». Nicolas veut, comme dans sa V1, des icônes placées entre le titre « Ton équipe » et le nombre de DPS ; Auto-clic verrouillé de base (visible mais grisé), Fauchage et Poké-Radar invisibles tant que l'objet manque. Il dit aussi « je préférais l'interface de la V1 ou du moins son agencement ». Fichiers : `src/ui/EcranCombat.tsx`, `src/ui/OutilsCombat.tsx`, `src/ui/ReglagesCombat.tsx`, `src/ui/icones.tsx`, `src/ui/CarteEquipe.tsx`. V1 : `legacy/index.html` (barre d'équipe) et `legacy/js/ui/controls.js`.

### Première étape, avant tout code
Trois variantes navigables de l'écran de combat (390 et 1440 px) : (1) agencement de la V1 repris à l'identique, adapté à la charte ; (2) icônes dans l'en-tête de l'équipe, balles et Capturer regroupées sous l'ennemi ; (3) barre d'actions flottante. Nicolas choisit dans la vraie appli. Le choix est noté dans `docs/projet/choix-variantes-b.md`.

### Critères d'acceptation
- [ ] Étant donné la variante choisie, quand je joue la Route 1 sans Restes, alors Auto-attaque et Arrêt auto sont des icônes actives, Auto-clic est une icône grisée avec l'infobulle « Nécessite l'objet Restes », Fauchage et Poké-Radar n'apparaissent pas.
- [ ] Étant donné la CT Fauchage achetée, quand je reviens au combat, alors l'icône Fauchage apparaît ; de même pour le Poké-Radar.
- [ ] Étant donné chaque icône, quand je la survole, la touche ou la focalise, alors un libellé en français dit ce qu'elle fait et son état (activée, désactivée, en recharge avec les secondes restantes pour le Fauchage).
- [ ] Étant donné les actions de capture, quand je regarde l'écran, alors le choix de la balle et « Capturer » sont regroupés près de l'ennemi, sans bloc de texte long.
- [ ] Étant donné 390, 1440 et 1915 px, quand je capture l'écran, alors aucune icône ne fait moins de 44 px, rien ne défile horizontalement, aucun bouton ne dépasse de sa zone.
- [ ] Étant donné les actions existantes (auto-attaque, arrêt auto, fauchage, radar), quand je les utilise, alors leur comportement est celui d'avant (aucune règle de jeu changée).

### Hors périmètre
Nouveaux pouvoirs, autres pages, icônes de la page Plus.

### Vérification
`src/ui/EcranCombat.test.tsx`, `OutilsCombat.test.tsx`, e2e `combat.spec.ts` ; captures aux trois tailles regardées avant de les montrer ; `tests/ui-valeurs-en-dur.test.ts` vert.

### Effort et risques
Fourchette : 2 à 3 jours après le choix. Risque : lisibilité des icônes seules sur mobile (infobulles tactiles). Dépend de : AD ne bloque pas ; AF et AG réutilisent le choix de ce ticket, à lancer ensuite.

---

## AF. `feat(ui): icône du Poké-Radar, raretés en couleurs, pastille « capturé » et crayon de renommage`

Labels : `type:feat`, `etat:fait` (28/10 : codé en local, crayon sur les cartes de la page Équipe et de l'écran de combat grand écran ; le champ « Surnom » du bas de la fiche est remplacé), `est:2-3`, `prio:2` · branche : `feat/af-radar-raretes-captures-renommage` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux une vraie icône de Poké-Radar, des raretés qui se distinguent par la couleur, une pokéball à côté des Pokémon déjà capturés et un crayon pour renommer afin de lire les listes d'un coup d'œil et d'atteindre les easter eggs. [15, 16, 19]

### Contexte
`FenetreRadar.tsx` liste les Pokémon d'une zone avec une étiquette de rareté toute grise (capture du rapport : Commun, Peu Commun, Rare, Très Rare identiques). La V1 avait une icône de radar, une pokéball à côté des capturés et un crayon (`legacy/js/ui/summary.js`, `render.js`). Le renommage existe dans `FichePokemon.tsx` mais sans crayon visible, donc les easter eggs sont introuvables. Couleurs : jetons de `design/tokens.css` (une couleur par rareté, vérifier le contraste à 4,5 sur le fond des cartes) ; pas de couleur en dur. Les icônes sont des SVG locaux dans `src/ui/icones.tsx` ; aucune image externe.

### Critères d'acceptation
- [ ] Étant donné la liste du Poké-Radar, quand je l'ouvre, alors chaque rareté (Commun, Peu Commun, Rare, Très Rare, Légendaire) a sa couleur et son libellé texte (la couleur n'est jamais seule), contraste d'au moins 4,5.
- [ ] Étant donné un Pokémon déjà capturé, quand il apparaît dans la liste du Poké-Radar, le Pokédex ou le nom de l'ennemi à l'écran, alors une petite pokéball est affichée à côté de son nom avec le libellé accessible « Déjà capturé » ; absente sinon.
- [ ] Étant donné le Poké-Radar, quand je regarde le bouton d'ouverture, alors c'est l'icône de radar (pas un bouton texte au milieu de l'écran), avec un libellé accessible.
- [ ] Étant donné un Pokémon de l'équipe, quand je regarde son nom (carte d'équipe et fiche), alors un crayon est à côté ; au toucher, un champ de saisie s'ouvre avec le nom actuel, Entrée valide, Échap annule, 12 caractères au plus (valeur de la V1).
- [ ] Étant donné le nom « dinnerbone », « grumm », « jeb_ » ou « caca », quand je le valide, alors l'effet correspondant de la V1 s'applique (déjà codé dans `src/core/easter-eggs.ts` : le test existant reste vert).
- [ ] Étant donné 390 et 1440 px, quand je capture les trois écrans, alors rien ne dépasse et les cibles font au moins 44 px.

### Hors périmètre
Nouveaux easter eggs, changement des règles de rareté.

### Vérification
`src/ui/FenetreRadar.test.tsx`, `FichePokemon.test.tsx`, `CarteEquipe.test.tsx` ; e2e de renommage ; captures regardées.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : trouver des couleurs de rareté lisibles dans la charte sans en inventer ; à défaut, poser la question avant. Dépend de : rien (indépendant du choix de AE).

---

## AG. `feat(evolution): notifier l'évolution possible et l'offrir depuis le combat, avec un accès au Sac`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:1` · branche : `feat/ag-evolution-combat-sac` · `agent-ok` : oui après le choix des variantes de AE

### Histoire
En tant que joueur, je veux être prévenu qu'un Pokémon peut évoluer, le faire évoluer depuis l'écran de combat et ouvrir le Sac sans quitter le combat afin de ne pas passer 30 niveaux sans savoir qu'il fallait aller dans Équipe. [12, 26]

### Contexte
Nicolas a des Pokémon niveau 30 qui n'ont pas évolué : l'évolution se fait dans `PageEquipe.tsx` / `FichePokemon.tsx` (règles dans `src/core/evolution.ts`, store `store-evolution.ts`), sans aucun signal. Il note « animation évolution niquel » : `SpriteEvolution.tsx` ne change pas. Le Sac (`Sac.tsx`) n'est affiché que dans `PageEquipe.tsx` : il dit « on n'a pas de sac d'objet ?? » alors que la règle l'ouvre à la Route 1 (`data/reglages.json`, `sac.zone`). Fichiers : `src/ui/EcranCombat.tsx`, `src/ui/CarteEquipe.tsx`, `src/ui/Sac.tsx`, `src/ui/store-evolution.ts`, `src/ui/Coquille.tsx` (annonces).

### Critères d'acceptation
- [ ] Étant donné un Pokémon de l'équipe qui atteint le niveau d'évolution, quand il le franchit, alors une annonce « <nom> peut évoluer ! » apparaît une seule fois (rejeu non répété au rechargement) et sa carte d'équipe porte un repère visible.
- [ ] Étant donné ce repère, quand je le touche depuis l'écran de combat, alors l'évolution se lance avec l'animation existante, sans changer de page, et l'XP maximale est recalculée comme aujourd'hui.
- [ ] Étant donné un Pokémon évolutif par pierre, quand j'ai la pierre dans le Sac, alors le repère propose « Utiliser la <pierre> » sur sa carte ; sans pierre, rien ne s'affiche.
- [ ] Étant donné la Pierre Stase équipée, quand le niveau d'évolution est atteint, alors aucune annonce ni repère n'apparaît.
- [ ] Étant donné le Sac ouvert (zone Route 1), quand je regarde l'écran de combat, alors un accès au Sac est présent (icône avec le nombre d'objets), s'ouvre en panneau sur l'écran de combat, se ferme en revenant au combat sans perdre l'ennemi ; avant la Route 1, l'accès n'existe pas.
- [ ] Étant donné un clavier, quand j'ouvre le panneau, alors le focus y entre, Échap le ferme et le focus revient sur l'accès.

### Hors périmètre
Évolutions par échange, nouvelles pierres, Sac redessiné (page Équipe inchangée).

### Vérification
`src/ui/store-evolution.test.ts`, `Sac.test.tsx`, e2e `evolution.spec.ts` (390 et 1440 px) ; capture.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : où poser le repère sans surcharger l'écran de AE ; décidé avec la variante choisie. Dépend de : AE (agencement).

---

## AH. `feat(annonces): prévenir quand le PC, le Centre commercial, le Casino ou une fonction se débloque`

Labels : `type:feat`, `etat:fait` (28/10 : codé en local ; Poké-Radar, Fauchage et Auto-clic s'annoncent à l'achat de l'objet, pas à un boss ; PC dit « barre de navigation » car elle est à gauche sur PC ; tableau dans `docs/projet/deblocages-annonces.md`), `est:1.5-2`, `prio:2` · branche : `feat/ah-annonces-deblocage` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux une annonce quand une fonction ou une zone annexe s'ouvre afin de ne pas devoir ouvrir la carte et les menus pour le découvrir. [7, 22]

### Contexte
Aujourd'hui rien ne signale : l'ouverture du PC (Argenta), du Sac (Route 1), de la Pension, du Poké-Radar, de la Fauchage, du Centre commercial et du Casino (zones annexes de Céladopole). Les règles d'ouverture sont dans `data/reglages.json` (clés `sac`, `pc`, `centre`, `casino`…) et `src/core/progression.ts`. Le moteur d'événements existe (`src/core/evenements.ts`, `evenements-kanto.ts`) : un déblocage est un événement. L'annonce passe par la même mécanique que « CARTE DÉBLOQUÉE ! » (`DialogueIntro.tsx`, `data/reglages.json` : `interface.annonceMs`). Textes en français dans `data/`, jamais dans le code.

### Critères d'acceptation
- [ ] Étant donné un boss qui ouvre une fonction (PC, Pension, Centre commercial, Casino, Poké-Radar, Fauchage, Auto-clic), quand je le bats, alors une annonce nomme la fonction et dit où la trouver (« PC débloqué ! Il est dans la barre du bas. »).
- [ ] Étant donné une zone annexe qui s'ouvre (Centre commercial, Casino), quand elle devient accessible, alors l'annonce le dit sans que j'aie à ouvrir la carte.
- [ ] Étant donné une annonce déjà vue, quand je recharge la page, alors elle ne se rejoue pas (drapeau dans la sauvegarde de région).
- [ ] Étant donné deux déblocages au même boss, quand ils arrivent ensemble, alors les annonces s'enchaînent l'une après l'autre sans se superposer.
- [ ] Étant donné une ancienne sauvegarde qui a déjà tout débloqué, quand je la charge, alors aucune annonce ne se rejoue.
- [ ] Étant donné `prefers-reduced-motion`, quand une annonce apparaît, alors elle est affichée sans animation, avec le même texte.

### Hors périmètre
Journal des annonces, notifications système du navigateur.

### Vérification
`src/core/evenements-kanto.test.ts`, `src/ui/Coquille.test.tsx`, e2e `deblocages.spec.ts` ; liste des fonctions et de leur déclencheur jointe à `docs/projet/`.

### Effort et risques
Fourchette : 1,5 à 2 jours. Risque : migration de la sauvegarde pour les drapeaux (rester dans la version 2 de la sauvegarde, champ optionnel). Dépend de : AD (pour le texte du PC).

---

## AI. `feat(histoire): dialogue de Chen au premier boss et présentation de Blue`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:2` · branche : `feat/ai-chen-boss-blue` · `agent-ok` : oui

### Histoire
En tant que nouveau joueur, je veux que Chen m'explique le fonctionnement des zones au premier boss et que Blue soit présenté avant de me défier afin de comprendre ce qu'on attend de moi. [5, 14]

### Contexte
Chen : à la Route 1, rien n'explique « 10 Pokémon à vaincre, puis le boss en 30 s, pour ouvrir la zone suivante » (règle de la V1, `legacy/index.html:803`, guide). Blue : le rival est un boss de zone dont la première rencontre arrive sans présentation, et sans sprite pendant les dialogues. Moteur : `src/core/evenements.ts`, textes et déclencheurs en données (`data/regions/kanto/`), `DialogueChen.tsx`, `DialogueScene.tsx`, `BoiteDialogue.tsx`. Sprites de Blue : voir `data/ressources-externes.json` et `img/sprites/` (à vérifier avant ; s'il en manque, le téléchargement demande l'accord de Nicolas).

### Critères d'acceptation
- [ ] Étant donné la première arrivée sur un boss (étape 10 de la Route 1), quand la zone atteint l'étape du boss, alors un dialogue de Chen explique en 3 à 5 courtes répliques : 10 Pokémon à battre, le boss en 30 s, la zone suivante s'ouvre, l'échec ramène à l'étape 9. Il ne se rejoue pas au rechargement ni aux boss suivants.
- [ ] Étant donné le dialogue de Chen, quand il s'affiche, alors le sprite de Chen est visible et le combat est en pause, sans que le minuteur de 30 s ne démarre avant la fin.
- [ ] Étant donné la première rencontre avec Blue, quand elle approche, alors une scène de présentation le montre (sprite, son nom, une phrase qui dit qui il est : rival et petit-fils de Chen) avant son défi.
- [ ] Étant donné chacun de ses dialogues de défi, quand ils s'affichent, alors le sprite de Blue est à l'écran, à côté de la boîte de dialogue, sans chevaucher le texte à 390 px.
- [ ] Étant donné les rencontres suivantes avec Blue, quand elles arrivent, alors la présentation n'est pas rejouée.
- [ ] Étant donné `prefers-reduced-motion`, quand les dialogues s'affichent, alors les entrées de sprite sont sans animation.

### Hors périmètre
Équipes de Blue (déjà dans le ticket S), refonte de l'intro, doublage.

### Vérification
`src/core/evenements-kanto.test.ts`, `src/ui/DialogueScene.test.tsx`, e2e `scenes.spec.ts` (390 et 1440 px) ; capture.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : le sprite de Blue n'est peut-être pas dans le dépôt. Dépend de : rien (S et O sont faits).

---

## AJ. `feat(scenes): Ronflex après la Centrale et Flûte Pokémon jouée sur une interzone dédiée`

Labels : `type:feat`, `etat:idee`, `est:3`, `prio:3` · branche : `feat/aj-ronflex-interzone` · `agent-ok` : après le choix des variantes

### Histoire
En tant que joueur, je veux rencontrer Ronflex après le boss de la Centrale et le réveiller en jouant la Flûte Pokémon sur une scène à part afin que ce passage soit un moment du jeu et pas un clic dans l'équipe. [25, 30]

### Contexte
Livré dans le ticket S : le dialogue de Ronflex arrive trop tôt et la Flûte se joue d'un clic depuis le Sac « Objets clés », sans qu'on sache comment faire. Nicolas veut : le dialogue de Ronflex après le boss de la Centrale (pas au début), et une **interzone dédiée** avec Ronflex au milieu où l'on joue la Flûte pour le réveiller. Fichiers : `data/regions/kanto/scenes.json` (nouvelle scène), `src/ui/SceneLieu.tsx`, `DialogueScene.tsx`, `src/core/scenes.ts`, `src/core/evenements-kanto.ts`, `Sac.tsx`. **À confirmer avec Nicolas avant la première étape** : le lieu exact de la scène (entre quelles zones), et si la Flûte se joue en touchant Ronflex, en touchant un instrument ou par une courte suite de notes.

### Première étape, avant tout code
Trois variantes de la scène (390 et 1440 px) : (1) Ronflex au centre, la Flûte à cliquer pour jouer, quatre notes qui apparaissent ; (2) Ronflex au centre, un geste de glissement sur le tapis ; (3) petit jeu de rythme en trois notes. Nicolas choisit dans la vraie appli.

### Critères d'acceptation
- [ ] Étant donné la partie avant le boss de la Centrale, quand je joue, alors aucun dialogue de Ronflex ne se déclenche.
- [ ] Étant donné le boss de la Centrale battu, quand j'arrive à la zone de Ronflex, alors un dialogue explique : Ronflex dort, il bloque la route, une Flûte peut le réveiller.
- [ ] Étant donné la Flûte Pokémon dans le Sac, quand je suis sur la scène de Ronflex, alors un indicateur dit comment l'utiliser (texte court, en français) et la Flûte se joue sur la scène ; depuis le Sac ou l'équipe, elle ne fait plus rien (message « À utiliser devant Ronflex »).
- [ ] Étant donné la Flûte jouée, quand l'action se termine, alors Ronflex se réveille (animation courte), le combat de Ronflex commence, et la route s'ouvre une fois battu.
- [ ] Étant donné un rechargement après le réveil ou après la victoire, quand je rouvre, alors l'état est conservé et la scène ne se rejoue pas.
- [ ] Étant donné `prefers-reduced-motion`, quand la scène se joue, alors l'animation est un changement d'état sans mouvement.

### Hors périmètre
Autres objets clés, combat de Ronflex (déjà fait), nouvelle musique.

### Vérification
`src/core/scenes.test.ts`, e2e `scenes.spec.ts` (390 et 1440 px) ; captures.

### Effort et risques
Fourchette : 3 jours après le choix. Risque : place de la scène dans le graphe des zones. Dépend de : AI (dialogues), S (fait).

---

## AK. `fix(vol): faire passer le cercle vert sous le sprite du dresseur pendant le vol`

Labels : `type:fix`, `etat:fait`, `est:0.5`, `prio:3` · branche : `fix/ak-vol-cercle-sous-sprite` · `agent-ok` : oui (fait le 28/10, test dans `VolGen1.test.tsx`)

### Histoire
En tant que joueur, je veux que le cercle vert clignotant passe sous le sprite pendant l'animation de vol afin que le dresseur et son Pokémon restent lisibles. [29]

### Contexte
Animation de vol : `src/ui/vol.ts`, `VolGen1.tsx`, durées dans `data/reglages.json` (`interface.vol`). Le cercle vert (halo de la zone visée) est rendu après le sprite dans l'ordre d'empilement, donc il passe dessus. Nicolas : « le cercle vert qui clignote doit passer en dessous du sprite, là il passe pas dessus c'est moche ».

### Critères d'acceptation
- [ ] Étant donné un vol vers une zone, quand le cercle vert clignote, alors il est dessiné sous le sprite (couche inférieure, vérifiée par l'ordre dans le DOM ou le `z-index` testé).
- [ ] Étant donné les durées de l'animation, quand elle se joue, alors elles sont inchangées (2 500 ms de vol).
- [ ] Étant donné `prefers-reduced-motion`, quand je pars en vol, alors le comportement reste sans overlay.

### Hors périmètre
Refonte de l'animation de vol.

### Vérification
`src/ui/VolGen1.test.tsx`, e2e `carte.spec.ts` ; captures d'une image du vol avant et après, comparées par Claude.

### Effort et risques
Fourchette : 0,5 jour. Risque : aucun notable. Dépend de : rien.

---

## AL. `feat(aide): porter le guide complet de la V1 dans la V2`

Labels : `type:feat`, `etat:idee`, `est:1-2`, `prio:3` · branche : `feat/al-guide-du-jeu` · `agent-ok` : oui

### Histoire
En tant que joueur, je veux retrouver le « Guide du jeu » complet que Nicolas avait écrit dans la V1 afin de comprendre les règles sans demander. [9]

### Contexte
Le guide n'a pas été retiré : il n'a jamais été porté. Il est dans `legacy/index.html:800-890` (modale « GUIDE DU JEU » : parcours de A à Z, fonctionnalités clés, capture et repousses, Pokédex, PC, sauvegarde, reset, Centre commercial, CT Fauchage, Ligue, Casino, Défi du Professeur Chen, easter eggs) et figure dans `docs/projet/v1-visuel-a-porter.md` sans ticket. **Le texte est celui de Nicolas, à reprendre mot pour mot** là où la règle de la V2 est la même, et à corriger seulement là où la V2 diffère (zones d'ouverture qui ont changé, CT Fauchage, emplacements, ce rapport). Le texte vit en données (`data/guide.json`, nouveau), affiché par un composant `Guide.tsx` (nouveau) ouvert depuis la page Plus.

### Critères d'acceptation
- [ ] Étant donné la page Plus, quand j'ouvre « Guide du jeu », alors toutes les sections de la V1 sont là, dans le même ordre, chacune repliable.
- [ ] Étant donné chaque phrase du guide, quand elle décrit une règle, alors elle correspond au jeu actuel ; une liste des phrases changées par rapport à la V1 est notée dans `docs/projet/v1-visuel-a-porter.md` avec la raison.
- [ ] Étant donné les zones d'ouverture citées (Pension, PC, Poké-Radar, Auto-clic, Fauchage), quand le guide les nomme, alors les valeurs viennent de `data/reglages.json` et non d'un texte recopié, pour qu'elles ne se désynchronisent pas.
- [ ] Étant donné 390 et 1440 px, quand j'ouvre le guide, alors il défile verticalement seul, se ferme avec Échap ou la croix (44 px), et le focus revient sur le bouton d'ouverture.
- [ ] Étant donné la V1, quand je compare, alors aucune section de la V1 n'a été supprimée sans l'accord de Nicolas.

### Hors périmètre
Tutoriel interactif, traduction, nouveau contenu au-delà de ce rapport.

### Vérification
`src/ui/Guide.test.tsx` ; capture à 390 et 1440 px ; relecture par Nicolas du texte.

### Effort et risques
Fourchette : 1 à 2 jours. Risque : textes de la V1 devenus faux ; à lister avant l'écriture. Dépend de : AA, AB et AD (pour que les chiffres du guide soient les bons).

---

## Vérifications sans ticket (28/10)

- **Taux de capture de Leveinard [17]** : 30/255 de base (12 %), Très Rare, apparition 0,05, identique à la V1. Super Ball sur niveau 20 à PV pleins : environ 4 % ; à PV presque nuls : environ 13 %. Vingt échecs d'affilée n'est pas un bug. Piste proposée à Nicolas, non demandée : afficher la chance de capture actuelle sur le bouton (la V1 la cachait derrière le mode triche).
- **Taux des légendaires [27]** : probabilité par rencontre dans la zone concernée, Mew 1 %, Artikodin 2 %, Électhor 5 %, Sulfura 5 %, Mewtwo 5 % (`data/regions/kanto/zones.json`), identique à la V1. Chaque légendaire n'apparaît que dans sa zone. Un test de simulation (10 000 rencontres) est inclus dans AB pour confirmer.
- **Animations de badges et d'évolution [8, 13]** : jugées bonnes par Nicolas, à ne pas toucher.
