# Backlog, phase 5 « Design et UX »

Jalon : Kanto « propre » (mobile d'abord, puis PC). **Proposé le 05/11, à valider par Nicolas.** Aucun code d'écran avant la maquette validée par lui, écran par écran (règle du dépôt et décision du 05/11).

## Lecture du lot

Demande de Nicolas (05/11) : gros travail d'UX surtout sur téléphone, quelques détails sur le jeu PC ; **toute la partie compte et parties est à refaire** ; maquettes faites ensemble, une par une ; il n'a pas d'idée arrêtée, donc un audit d'interface de jeux qui fonctionnent lui sert de point de départ (`docs/projet/audit-interface-phase-5.md`, avec grille et inventaire de 35 écrans).

Méthode, pour chaque lot d'écrans : (1) captures de l'existant, (2) note sur la grille d'audit, (3) trois ou quatre variantes navigables sur de vraies bases (skill `/design`), (4) Nicolas choisit ou mélange, (5) implémentation dans la vraie application par Codex, (6) captures 390 et 1440 px regardées avant de lui montrer. Les maquettes sont des pages HTML navigables dans `design/examples/`, pas des captures. Lire `design/DESIGN.md`, `design/tokens.css` et `design/regions.css` avant tout écran ; aucune valeur inventée.

Chemin critique : A → B → C → D → (E, F, G, H en parallèle de choix, jamais deux écritures sur les mêmes fichiers) → K → L. Aucune règle de jeu ne change : un écart avec la V1 est un bug. Ce que Nicolas doit faire : choisir les variantes (une décision par écran) et lister ses « détails PC » (ticket I).

| n | Ticket | Effort |
|---|---|---|
| 1 | A. Captures de l'existant (35 écrans, 390 et 1440 px) | 1 à 2 j |
| 2 | B. Audit noté avec Nicolas et liste des défauts | 1 à 2 j |
| 3 | C. Navigation et écran principal sur téléphone (maquette puis code) | 2 à 3 j |
| 4 | D. Combat sur téléphone (maquette puis code) | 2 à 3 j |
| 5 | E. Compte : connexion, inscription, mot de passe | 2 à 3 j |
| 6 | F. Parties : liste, création, choix de version, autre appareil | 2 à 3 j |
| 7 | G. Mon compte : diamants, succès, skins | 1 à 2 j |
| 8 | H. Équipe, sac, PC et fiche Pokémon sur téléphone | 2 à 3 j |
| 9 | I. Détails du jeu sur PC (liste de Nicolas) | 1 à 2 j |
| 10 | J. Boutique, Pokédex, Plus et réglages | 2 à 3 j |
| 11 | K. Carte, centre commercial, casino, pension | 2 à 3 j |
| 12 | L. Retours visuels : gains, dégâts, synchro, animations | 2 à 3 j |
| 13 | M. Accessibilité (contrastes, cibles, lecteur d'écran, mouvement réduit) | 1 à 2 j |
| 14 | N. Audio réel (musiques, bruitages, réglages) | 2 à 3 j |
| 15 | O. Décors et cartes régénérés au bon format | 2 à 3 j |
| 16 | P. Passe finale : Kanto « propre » sur téléphone et PC | 1 à 2 j |

## Décision de Nicolas (05/11) : UX complète d'abord, téléphone puis PC

On valide toute l'interface téléphone en une fois : zone compte, choix de la partie, carte du monde (même avec Kanto seul pour l'instant) et toute l'interface de jeu. Ensuite, même travail pour le PC. Pas de bricolage écran par écran : l'UX est dessinée en entier et proprement maintenant, y compris pour les écrans dont le code n'existe pas encore (monde, menu principal, réglages). Les tickets C à K se lisent donc comme un seul lot de maquettes validées avant l'implémentation ; le PC (ticket I et reprise des écrans) vient après la validation du téléphone.

## Maquette téléphone validée (05/11) et découpage de l'implémentation

Nicolas a validé toute l'interface téléphone : `design/variantes/navigation-telephone/a5-index.html` (55 écrans, `a5-app.html#<écran>`). Les règles sont dans le journal de `design/DESIGN.md` (entrée du 05/11) ; ses retours mot pour mot dans `docs/projet/notes-nicolas-phase-5.md`. **La maquette A5 est la spécification : un écran codé doit lui ressembler à 360, 390 et 430 px.** Les critères « variantes à choisir » des tickets C à K sont donc remplis ; il reste à coder. Écarts entre l'application et la maquette qui sont des changements de règle ou de texte décidés par Nicolas : monnaie ₽, plus de versions de sauvegarde, auto-clic lié, sons 0-100.

Découpage et ordre (une seule écriture à la fois sur la coquille) :

| Lot | Contenu | Tickets | Dépend de |
|---|---|---|---|
| 1 | Fondations : police Atkinson gras, ₽ partout (code et textes), mise en page fluide pleine largeur, bandeau du haut, barre du bas à 5 entrées, ligne de zone seulement dans le combat | C | — |
| 2 | Menu de jeu (Sauvegarder, Monde, Pokédex, Badges, Statistiques, Guide, Réglages, Menu principal), Réglages (sons 0-100, auto-clic lié), écran Monde (Kanto seul) | C (suite) | 1 |
| 3 | Combat : ligne de capture, 4 boutons, réglage de l'arrêt auto, Fauchage et Poké-Radar dévoilés, fin du dialogue Chen permanent | D | 1 |
| 4 | Équipe, Sac en fenêtre, mode choix, PC (tri DPS, accès depuis l'Équipe), fiche Pokémon (favori, sexe, types en couleur) | H | 1 |
| 5 | Shop (3 catégories), Pokédex, Badges, Statistiques, Guide | J | 2 |
| 6 | Carte : liste + carte non cliquable, vol du jeu PC, fenêtre Céladopole | K | 1 |
| 7 | Zone compte : connexion, inscription, mot de passe, Mes parties, Mon compte, réglages, barre Parties / Compte / Réglages | E, F, G | 2 |
| 8 | Une sauvegarde par partie, reprise exacte, « partie reprise ailleurs », déconnexion « Sauvegarder et se déconnecter » (change la synchro de la phase 4 et l'ADR 0004 ; revue sécurité obligatoire, pas d'`agent-ok`) | F (suite) | 7 |

Les lots 3, 4, 6 et 7 touchent des fichiers différents : au plus trois en parallèle après le lot 2, chacun dans sa session. Le PC (ordinateur) se refait de la même façon après le téléphone (ticket I).

## A. `chore(design): capturer l'existant à 390 et 1440 px`

`type:chore`, `etat:fait`, `est:1-2`, `prio:1` · branche : `v2` · `agent-ok` possible (script, pas de décision)

### Histoire
En tant que Nicolas, je veux voir tous les écrans actuels côte à côte afin de juger sur pièces ce qui est à refaire.

### Critères d'acceptation
- [x] Étant donné les 35 écrans de l'inventaire, quand le script de capture tourne, alors `design/audit/` contient une image 390 px et une image 1440 px par écran, nommées d'après le fichier d'écran.
- [x] Étant donné les écrans qui demandent un état de jeu (combat, fin, panthéon, compte), quand le script les atteint, alors il passe par un état de partie de test déjà prévu (aucune règle de jeu modifiée).
- [x] Étant donné les captures, quand j'ouvre `design/audit/index.html`, alors je vois les écrans en planche navigable, groupés comme l'inventaire.

Fait le 05/11/2026 : `npm run audit:captures` (scripts/audit-captures.mjs), 42 captures (les 35 entrées de l’inventaire éclatées par sous-écran) dans `design/audit/`, planche `design/audit/index.html`. Aucun écran inatteignable, aucun accès de test ajouté dans `src/`. Constat pour l’audit (B) : à 1440 px, l’en-tête du combat recouvre les boutons « Mon compte » et « Mes parties » (clic de souris intercepté).

### Hors périmètre
Tout changement d'interface.

### Effort et risques
1 à 2 jours. Risque : états de jeu difficiles à atteindre (fin de jeu, panthéon) : utiliser les accès de test existants (`?onglet=carte`) et en ajouter si besoin.

## B. `docs(design): auditer les écrans avec Nicolas`

`type:docs`, `etat:fait`, `est:1-2`, `prio:1` · branche : `v2` · pas d'`agent-ok` (jugement avec Nicolas) · dépend de : A

### Histoire
En tant que Nicolas, je veux un diagnostic clair écran par écran afin de savoir quoi refaire en premier, sans avoir d'idée à l'avance.

### Critères d'acceptation
- [x] Étant donné la grille de `docs/projet/audit-interface-phase-5.md`, quand l'audit est fini, alors chaque écran a une note par ligne de la grille et une phrase de commentaire. (8 écrans prioritaires, section 6 ; Nicolas d'accord le 05/11)
- [x] Étant donné trois ou quatre jeux de référence que Nicolas choisit ou joue, quand ils sont regardés sur téléphone, alors le rapport note pour chacun ce qu'il fait mieux que PokiClicker (captures, pas de longs extraits). (Egg Inc, AdVenture Capitalist, Idle Miner d'après les fiches App Store, section 7)
- [x] Étant donné les notes, quand le rapport est lu, alors il classe les défauts par gravité et propose l'ordre des tickets C à K, que Nicolas valide. (validé le 05/11 : « je suis d'accord avec tout »)

### Hors périmètre
Dessiner une solution (tickets suivants).

### Effort et risques
1 à 2 jours, réparti sur plusieurs échanges. Risque : audit trop long ; limite : les 10 écrans les plus utilisés d'abord (combat, équipe, PC, shop, carte, plus, parties, connexion).

## C. `feat(ui): navigation et écran principal sur téléphone`

`type:feat`, `etat:en_cours`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` après maquette validée · dépend de : B

### Histoire
En tant que joueur sur téléphone, je veux une navigation visible et à portée de pouce afin de passer d'un écran à l'autre sans chercher.

### Contexte
La barre actuelle compte six entrées (Combat, Équipe, PC, Shop, Carte, Plus) alors que les guides de plateforme en recommandent cinq au plus. À trancher avec Nicolas sur maquettes : regrouper, déplacer PC ou Shop, feuille « Plus », écran principal avec tiroirs. Fichiers : `src/ui/Navigation.tsx`, `Coquille.tsx`.

### Critères d'acceptation
- [x] Étant donné trois ou quatre variantes navigables de la navigation, quand Nicolas en choisit une, alors le choix est noté dans le journal de décisions de `design/DESIGN.md`.
- [x] Étant donné la variante choisie, quand je navigue à 390 px, alors toutes les entrées ont une cible d'au moins 48 px avec 8 px d'écart et un libellé visible.
- [x] Étant donné un onglet pas encore débloqué (PC), quand je regarde la barre, alors son état est clair et son comportement est celui de la V1.
- [x] Étant donné la version PC (1440 px), quand je navigue, alors la barre reste une colonne à gauche, sans régression des tests existants.

### Hors périmètre
Contenu interne des pages.

### Effort et risques
2 à 3 jours. Risque : toucher la coquille casse beaucoup de tests de page ; garder les noms accessibles des onglets.

### Avancement
Lot 1 fait (05/11) : police Atkinson gras, ₽ partout (data touchée : `jalons.json`), bandeau du haut global sur téléphone (₽, DPS, Zone ; la ligne d'étapes reste dans le combat), barre à cinq entrées (Combat, Équipe, Shop, Carte, Menu), PC atteint depuis le Menu (« PC de Léo », grisé tant qu'il est fermé), plein écran fluide à 360-430 px. Sur PC (≥ 1024 px) : colonne de gauche à cinq entrées, bandeau masqué, en-tête de combat inchangé (argent compris).
Lot 2 fait (05/11) : Menu de jeu (cadre « Partie en cours » avec Sauvegarder maintenant, Monde, Pokédex, Badges, Statistiques, Guide, Réglages, Menu principal ; l'entrée « PC de Léo » reste jusqu'au lot 4), Réglages (musique et effets : interrupteur + curseur 0-100, stockés seulement, l'audio est le ticket N ; « Lier l'auto-clic à l'attaque auto » stocké, activé de base, non branché en combat : lot 3), écran Monde (Kanto jouable, huit régions verrouillées, `data/monde.json`). `aller('Monde')` dans `Coquille.tsx` est le point d'entrée : le bouton « Monde Pokémon » de la Carte (lot 6) doit l'appeler. « Menu principal » sauvegarde (local puis envoi attendu) et ouvre `EcranParties` (TODO lot 7 dans `App.tsx`). Écarts avec la maquette a5 : pas de nom de partie, temps de jeu ni « dernière sauvegarde » (non exposés par le store ; on montre le lieu et l'état de sauvegarde), pas de réglage Thème (aucune fonction de thème), pas d'« en ligne » dans le cadre. Restent aussi du lot 1 vers les lots 3 et 6 : boutons Zone précédente/suivante encore dans le dialogue de Chen (lot 3), Sac encore dans l'Équipe (lot 4).

## D. `feat(ui): combat sur téléphone`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` après maquette validée · dépend de : C

### Histoire
En tant que joueur, je veux voir le combat, mes gains et ma prochaine amélioration sur un seul écran lisible afin de jouer d'une main.

### Critères d'acceptation
- [ ] Étant donné les variantes de l'écran de combat, quand Nicolas en choisit une, alors le choix est noté dans `design/DESIGN.md`.
- [ ] Étant donné un combat à 390 px, quand je clique, capture ou ouvre le sac, alors les actions principales sont dans la moitié basse avec des cibles de 48 px au moins.
- [ ] Étant donné les barres de PV, d'XP et de temps, quand je regarde l'écran, alors les nombres restent lisibles (16 px au moins pour le texte courant).
- [ ] Étant donné les tests du combat, quand `npm test` tourne, alors aucune règle de jeu n'a changé (résultats du simulateur inchangés).

### Hors périmètre
Animations nouvelles (ticket L).

### Effort et risques
2 à 3 jours. Risque : `EcranCombat.tsx` fait 302 lignes ; découper sans changer le comportement.

## E. `feat(compte): refaire connexion, inscription et mot de passe`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:2` · branche : `v2` · pas d'`agent-ok` (authentification) · dépend de : B

### Histoire
En tant que joueur, je veux une connexion courte et claire afin de reprendre ma partie en quelques secondes.

### Contexte
Quatre états dans `compte/EcranCompte.tsx` : connexion, inscription, mot de passe oublié, nouveau mot de passe. Compte obligatoire (décision du 04/11) : l'écran doit être très simple. Aucune logique d'authentification ne change ; seule la présentation est refaite.

### Critères d'acceptation
- [ ] Étant donné trois ou quatre variantes navigables, quand Nicolas en choisit une, alors le choix est noté dans `design/DESIGN.md`.
- [ ] Étant donné la variante choisie, quand je me connecte à 390 px avec le clavier du téléphone ouvert, alors les champs et le bouton restent visibles sans défilement caché.
- [ ] Étant donné une erreur (mot de passe faux, trop court, e-mail déjà pris), quand elle s'affiche, alors le message est clair, près du champ concerné, et lu par un lecteur d'écran.
- [ ] Étant donné les tests du ticket C de la phase 4, quand `npm test` tourne, alors ils restent verts.

### Hors périmètre
Changement du serveur, suppression de compte, connexion par un tiers.

### Effort et risques
2 à 3 jours.

## F. `feat(compte): refaire la liste des parties et les choix de synchro`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` après maquette validée · dépend de : B

### Histoire
En tant que joueur avec plusieurs parties ou appareils, je veux voir mes parties comme des cartes lisibles et comprendre les conflits afin de ne jamais perdre de progression.

### Contexte
Écrans : mes parties (`EcranParties.tsx`), choix de version (`EcranChoixVersion.tsx`, y compris « partie supprimée ailleurs »), partie ouverte ailleurs (`EcranAutreAppareil.tsx`), indicateur de synchro. Repères du benchmark : une carte par partie avec nom, temps de jeu, dernière sauvegarde, avancée ; deux versions côte à côte ; statut de synchro visible.

### Critères d'acceptation
- [ ] Étant donné trois ou quatre variantes navigables pour chacun de ces écrans, quand Nicolas choisit, alors les choix sont notés dans `design/DESIGN.md`.
- [ ] Étant donné un compte avec 3 parties, quand j'ouvre la liste à 390 px, alors chaque carte montre nom, région, temps de jeu et dernière sauvegarde, et jouer ou supprimer demande une cible de 48 px.
- [ ] Étant donné un conflit de versions, quand l'écran s'affiche, alors les deux versions sont comparables d'un coup d'œil et l'action destructive demande une confirmation explicite.
- [ ] Étant donné la synchro, quand elle est hors ligne, en cours, en conflit ou à jour, alors l'état est visible en permanence dans le jeu sans gêner le combat.
- [ ] Étant donné les tests du scénario deux appareils, quand `npm test` tourne, alors ils restent verts.

### Hors périmètre
Logique de synchronisation (phase 4, faite).

### Effort et risques
2 à 3 jours. Risque : l'indicateur de synchro touche la coquille (en même temps que le ticket C : faire C d'abord).

## G. `feat(compte): refaire mon compte, diamants, succès et skins`

`type:feat`, `etat:a_faire`, `est:1-2`, `prio:3` · branche : `v2` · `agent-ok` après maquette validée · dépend de : E

### Histoire
En tant que joueur, je veux retrouver mes diamants, mes succès et mes skins dans un écran qui donne envie d'y revenir.

### Critères d'acceptation
- [ ] Étant donné les variantes de `EcranMonCompte.tsx`, quand Nicolas choisit, alors le choix est noté dans `design/DESIGN.md`.
- [ ] Étant donné trois succès d'exemple, quand j'ouvre l'écran à 390 px, alors chaque succès montre son état (obtenu ou non), sa récompense en diamants et sa condition.
- [ ] Étant donné la déconnexion, quand je l'utilise, alors elle est atteignable en un geste et demande confirmation si une synchro est en attente.

### Hors périmètre
Boutique de skins, nouveaux succès.

### Effort et risques
1 à 2 jours.

## H. `feat(ui): équipe, sac, PC et fiche Pokémon sur téléphone`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:3` · branche : `v2` · `agent-ok` après maquette validée · dépend de : C

### Histoire
En tant que joueur, je veux gérer mon équipe et mes boîtes avec le pouce, avec de grosses cases et une fiche claire.

### Critères d'acceptation
- [ ] Étant donné les variantes pour `PageEquipe`, `PagePC`, `Sac` et `FichePokemon`, quand Nicolas choisit, alors les choix sont notés dans `design/DESIGN.md`.
- [ ] Étant donné six Pokémon dans l'équipe à 390 px, quand j'ouvre l'équipe, alors chaque case fait 48 px au moins de haut et montre nom, niveau, PV.
- [ ] Étant donné le PC, quand je déplace un Pokémon entre boîte et équipe, alors l'action se fait au toucher sans glisser-déposer obligatoire.
- [ ] Étant donné les tests existants, quand `npm test` tourne, alors ils restent verts.

### Effort et risques
2 à 3 jours. Risque : `PageEquipe.tsx` (281 lignes) et `FichePokemon.tsx` (227) sont denses.

## I. `feat(ui): détails du jeu sur PC`

`type:feat`, `etat:a_faire`, `est:1-2`, `prio:3` · branche : `v2` · pas d'`agent-ok` avant la liste de Nicolas

### Histoire
En tant que joueur sur ordinateur, je veux que le jeu profite de la largeur et du clavier.

### Contexte
Nicolas a « quelques détails » en tête sur la version PC : il les liste (voir `docs/projet/notes-nicolas-phase-5.md`, à créer à sa dictée), on découpe ensuite en critères.

### Critères d'acceptation
- [ ] Étant donné la liste de détails de Nicolas, quand elle est reprise ici, alors chaque détail devient un critère vérifiable (à 1440 px).
- [ ] Étant donné chaque détail corrigé, quand je regarde la capture 1440 px, alors il est visible et Nicolas le valide.

### Effort et risques
1 à 2 jours, à resserrer quand la liste existe.

## J. `feat(ui): boutique, Pokédex, Plus et réglages`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:3` · branche : `v2` · `agent-ok` après maquette validée · dépend de : C

### Critères d'acceptation
- [ ] Étant donné les variantes pour `PageShop`, `Pokedex`, `PagePlus` et ses sous-pages, quand Nicolas choisit, alors les choix sont notés dans `design/DESIGN.md`.
- [ ] Étant donné le Pokédex, quand un Pokémon est vu mais pas capturé, alors l'écran distingue clairement « capturé », « vu » et « inconnu ».
- [x] Étant donné la boutique à 390 px, quand j'achète un objet, alors le prix, le solde et la quantité tiennent sur l'écran sans défilement horizontal. (Lot 5 : trois catégories, solde dans le bandeau du haut, lignes compactes, aucun défilement horizontal à 360, 390 et 430 px.)
- [ ] Étant donné les réglages, quand je les ouvre, alors ils sont regroupés par thème (son, combat, compte) avec des cibles de 48 px.

### Effort et risques
2 à 3 jours.

### Avancement
Lot 5 fait (06/11), partie Shop, Pokédex, Badges, Statistiques, Guide : sous 1024 px, Shop en trois catégories (Poké Ball, Objets, Accessoires ; plus de « Soin », répartition d'après `categorie` et `unique`, prix et effets inchangés), lignes compactes, solde non répété ; Pokédex, Badges, Statistiques et Guide en pages avec bouton retour vers le Menu, d'après `a5-app.html` ; le Diplôme du Pokédex passe du Menu à la page Pokédex ; l'argent total des Statistiques s'écrit en ₽ (PC compris). Le PC (≥ 1024 px) garde ses composants et ses fenêtres. Écarts avec la maquette : pas de ligne « Champion » (absente de `data/badges.json`), pas d'état « vu » (le jeu ne l'enregistre pas : seuls capturé et inconnu existent, d'où la case « vu mais pas capturé » du premier critère laissée ouverte), quantité par pas (− / +) conservée sur les objets non uniques. Restent du ticket J : réglages (lot 2).

## K. `feat(ui): carte, centre commercial, casino et pension`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:4` · branche : `v2` · `agent-ok` après maquette validée · dépend de : C

### Critères d'acceptation
- [ ] Étant donné les variantes pour `CarteKanto`, `PageCentre`, `PageCasino` et `PagePension`, quand Nicolas choisit, alors les choix sont notés dans `design/DESIGN.md`.
- [x] Étant donné la carte à 390 px, quand je touche une zone, alors la cible fait 48 px au moins (zone agrandie si l'image est plus petite) et la zone courante est signalée. (Lot 6 : liste de zones à lignes de 56 px, zone actuelle en vert.)
- [ ] Étant donné le casino et la pension, quand je joue à 390 px, alors tout reste utilisable au pouce sans changer les règles ni les gains.

### Effort et risques
2 à 3 jours. Risque : la carte est une image provisoire (ticket O).

### Avancement
Lot 6 fait (05/11), partie carte seulement : sous 1024 px, liste des zones à défilement propre en haut (lignes de 56 px, zone actuelle en vert, zones fermées grisées sans cadenas), vraie carte avec ses cercles dessous, non cliquable ; toucher une zone lance l'animation de vol du PC (même `useVol`, mêmes durées, mouvement réduit respecté) puis ouvre le combat ; Céladopole ouvre une fenêtre à trois choix (Arène, Centre commercial, Casino) qui se ferme au choix puis lance le vol. Le PC ne change pas. Restent du ticket K : centre commercial, casino et pension sur téléphone (lots suivants).

## L. `feat(ui): retours visuels des gains, des dégâts et de la synchro`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:4` · branche : `v2` · `agent-ok` après maquette validée · dépend de : D

### Contexte
Reprendre les animations et effets de la V1 (`docs/projet/v1-visuel-a-porter.md`) avant d'en inventer.

### Critères d'acceptation
- [ ] Étant donné l'inventaire `docs/projet/v1-visuel-a-porter.md`, quand le ticket est fini, alors chaque effet marqué « à porter » est porté ou écarté avec une raison.
- [ ] Étant donné un gain (argent, XP, capture, diamants), quand il arrive, alors un signe visible l'accompagne sans masquer le combat.
- [ ] Étant donné la préférence système « réduire les animations », quand elle est active, alors les effets forts sont coupés.

### Effort et risques
2 à 3 jours.

## M. `feat(a11y): accessibilité de l'interface`

`type:feat`, `etat:a_faire`, `est:1-2`, `prio:4` · branche : `v2` · `agent-ok` · dépend de : C à K

### Critères d'acceptation
- [ ] Étant donné chaque page, quand j'exécute le contrôle automatique d'accessibilité (axe ou équivalent déjà présent), alors il n'y a aucune erreur de contraste ni de nom manquant.
- [ ] Étant donné le clavier, quand je navigue sur PC, alors tous les boutons sont atteignables dans un ordre logique avec un focus visible.
- [ ] Étant donné un lecteur d'écran, quand un gain ou une erreur apparaît, alors il est annoncé sans spam (région `status` limitée).

### Effort et risques
1 à 2 jours.

## N. `feat(audio): audio réel et réglages de son`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:5` · branche : `v2` · pas d'`agent-ok` (choix de ressources externes et droits) · à cadrer avec Nicolas

### Critères d'acceptation
- [ ] Étant donné les sons de la V1 portés (`docs/projet/v1-visuel-a-porter.md`), quand le jeu tourne, alors musique et bruitages jouent après un premier geste de l'utilisateur et se règlent séparément.
- [ ] Étant donné une source de sons nouvelle, quand elle est ajoutée, alors sa licence est notée dans le dépôt (aucune ressource chargée depuis l'extérieur).

### Effort et risques
2 à 3 jours. À cadrer : sources et droits des sons.

## O. `chore(assets): régénérer les décors et la carte au bon format`

`type:chore`, `etat:a_faire`, `est:2-3`, `prio:5` · branche : `v2` · pas d'`agent-ok` (génération d'images, choix artistique) · voir `docs/projet/decors-provisoires.md`

### Critères d'acceptation
- [ ] Étant donné les décors provisoires recadrés de la V1, quand les nouveaux décors sont intégrés, alors chaque lieu a un décor 16:9 au bon format (un seul ratio par type d'image).
- [ ] Étant donné la carte de Kanto, quand elle est remplacée, alors les zones cliquables restent alignées (test de géométrie existant vert).

### Effort et risques
2 à 3 jours. Dépend du choix de style de Nicolas.

## P. `chore(design): passe finale, Kanto « propre » sur téléphone et PC`

`type:chore`, `etat:a_faire`, `est:1-2`, `prio:5` · branche : `v2` · dépend de : C à O

### Critères d'acceptation
- [ ] Étant donné les captures de l'existant (ticket A), quand elles sont refaites, alors la planche avant/après de chaque écran est dans `design/audit/`.
- [ ] Étant donné la grille d'audit, quand chaque écran est renoté, alors aucun n'a de note 0.
- [ ] Étant donné un téléphone réel, quand Nicolas joue une session complète de Kanto, alors ses remarques sont notées et les bloquants sont corrigés.

### Effort et risques
1 à 2 jours.
