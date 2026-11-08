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
| 6 | F. Parties : liste, création, une seule sauvegarde, autre appareil | 2 à 3 j |
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

`type:feat`, `etat:en_cours`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` après maquette validée · dépend de : C

### Histoire
En tant que joueur, je veux voir le combat, mes gains et ma prochaine amélioration sur un seul écran lisible afin de jouer d'une main.

### Critères d'acceptation
- [x] Étant donné les variantes de l'écran de combat, quand Nicolas en choisit une, alors le choix est noté dans `design/DESIGN.md`. (maquette a5, entrée du 2026-11-05)
- [x] Étant donné un combat à 390 px, quand je clique, capture ou ouvre le sac, alors les actions principales sont dans la moitié basse avec des cibles de 48 px au moins. (ligne capture, quatre boutons, Fauchage et Poké-Radar une fois débloqués ; Sac en fenêtre)
- [ ] Étant donné les barres de PV, d'XP et de temps, quand je regarde l'écran, alors les nombres restent lisibles (16 px au moins pour le texte courant).
- [x] Étant donné les tests du combat, quand `npm test` tourne, alors aucune règle de jeu n'a changé (résultats du simulateur inchangés). (`--clics 7 --pokedex theorique` : Ligue 87,0 min, 767 762 / 683 900 / 83 862)
- [x] Retours de Nicolas (notes phase 5, A2) : ligne de capture (balle + Capturer) ; quatre boutons Attaque auto, Arrêt auto, Réglage de l'arrêt auto, Sac ; plus de bouton Outils ni « Arrêter après » ; auto-clic lié à l'attaque auto (préférence `autoClicLie`, déliée : désactivé) ; Fauchage et Poké-Radar invisibles puis sous les quatre boutons ; plus de dialogue permanent du Prof. Chen sur téléphone ; ligne Zone précédente / suivante dans le bandeau, seulement en combat.

**Lot 3 fait** (06/11, commits locaux). Écarts avec la maquette a5 : l'équipe garde les cartes actuelles (pas la bande de sprites) ; libellés des quatre boutons en 14 px comme dans a5 (le critère des 16 px des barres reste ouvert, il porte sur PV, XP et temps) ; icône de Fauchage différente. Reste : l'annonce de déblocage dit encore « dans les outils du combat » (`data/deblocages.json`, lignes 37 et 47 : donnée de contenu, à trancher) ; `intro.spec.ts` (390 px, Pokéball dans l'Équipe) et `jalon-2.spec.ts`, `fin.spec.ts`, `evolution.spec.ts` échouaient lors du dernier passage complet, pour des raisons de Sac, Badges et Menu qui ne viennent pas du combat.

### Hors périmètre
Animations nouvelles (ticket L).

### Effort et risques
2 à 3 jours. Risque : `EcranCombat.tsx` fait 302 lignes ; découper sans changer le comportement.

## E. `feat(compte): refaire connexion, inscription et mot de passe`

`type:feat`, `etat:fait`, `est:2-3`, `prio:2` · branche : `v2` · pas d'`agent-ok` (authentification) · dépend de : B

### Histoire
En tant que joueur, je veux une connexion courte et claire afin de reprendre ma partie en quelques secondes.

### Contexte
Quatre états dans `compte/EcranCompte.tsx` : connexion, inscription, mot de passe oublié, nouveau mot de passe. Compte obligatoire (décision du 04/11) : l'écran doit être très simple. Aucune logique d'authentification ne change ; seule la présentation est refaite.

### Critères d'acceptation
- [x] Étant donné trois ou quatre variantes navigables, quand Nicolas en choisit une, alors le choix est noté dans `design/DESIGN.md`. (maquette a5, journal du 05/11)
- [x] Étant donné la variante choisie, quand je me connecte à 390 px avec le clavier du téléphone ouvert, alors les champs et le bouton restent visibles sans défilement caché. (e2e `compte.spec.ts`, viewport 390×420 : champ visible, bouton atteint par défilement de la page)
- [x] Étant donné une erreur (mot de passe faux, trop court, e-mail déjà pris), quand elle s'affiche, alors le message est clair, près du champ concerné, et lu par un lecteur d'écran. (`role="alert"`, `aria-invalid`, `aria-describedby` ; champs vides signalés par nos soins, plus de bulle native)
- [x] Étant donné les tests du ticket C de la phase 4, quand `npm test` tourne, alors ils restent verts.

**Lot 7 fait (06/11)** : connexion, inscription, oubli et nouveau mot de passe au style a5 (`EcranCompte.tsx`, `Compte.css`). Logique d'authentification inchangée.

### Hors périmètre
Changement du serveur, suppression de compte, connexion par un tiers.

### Effort et risques
2 à 3 jours.

## F. `feat(compte): refaire la liste des parties et les choix de synchro`

`type:feat`, `etat:en_cours`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` après maquette validée · dépend de : B

### Histoire
En tant que joueur avec plusieurs parties ou appareils, je veux voir mes parties comme des cartes lisibles et comprendre les conflits afin de ne jamais perdre de progression.

### Contexte
Écrans : mes parties (`EcranParties.tsx`), partie ouverte ailleurs (`EcranAutreAppareil.tsx`), partie reprise ailleurs (`EcranRepriseAilleurs.tsx`), partie supprimée ailleurs (`EcranSupprimeeAilleurs.tsx`), indicateur de synchro. Plus de choix de version : une seule sauvegarde par partie (ADR 0004, 06/11/2026). Repères du benchmark : une carte par partie avec nom, temps de jeu, dernière sauvegarde, avancée ; deux versions côte à côte ; statut de synchro visible.

### Critères d'acceptation
- [x] Étant donné trois ou quatre variantes navigables pour chacun de ces écrans, quand Nicolas choisit, alors les choix sont notés dans `design/DESIGN.md`. (maquette a5, journal du 05/11)
- [x] Étant donné un compte avec 3 parties, quand j'ouvre la liste à 390 px, alors chaque carte montre nom, région, temps de jeu et dernière sauvegarde, et jouer ou supprimer demande une cible de 48 px. (e2e ; suppression par `<dialog>` modal avec confirmation)
- [x] Étant donné une partie jouée sur deux appareils, quand je reprends ici, alors la sauvegarde la plus récente est reprise exactement, l'autre appareil affiche « Partie reprise ailleurs » et n'écrit plus, et aucun écran de deux versions n'existe. (**lot 8, 07/11** : tests serveur deux appareils sur vraie base, tests client, e2e ; divergence hors ligne : le serveur gagne, le local est archivé sur le serveur)
- [ ] Étant donné la synchro, quand elle est hors ligne, en cours, en conflit ou à jour, alors l'état est visible en permanence dans le jeu sans gêner le combat. (l'état est visible dans « Mon compte » ; l'indicateur dans le jeu reste celui du ticket C)
- [x] Étant donné les tests du scénario deux appareils, quand `npm test` tourne, alors ils restent verts.

**Lot 7 fait pour la partie liste (06/11)** : « Mes parties » en cartes dans la zone compte hors partie (`ZoneCompte.tsx`, `EcranParties.tsx`), « Menu principal » ramène à l'onglet Parties. **Lot 8 (07/11)** : une seule sauvegarde par partie, « Partie reprise ailleurs », « Partie supprimée ailleurs », plus d'écran de choix de version. Non fait (à décider) : renommer une partie, état « ouverte ailleurs » sur chaque carte de « Mes parties » (le GET `/parties` devrait exposer l'appareil actif), écran de restauration d'une version archivée.

### Hors périmètre
Logique de synchronisation (phase 4, faite).

### Effort et risques
2 à 3 jours. Risque : l'indicateur de synchro touche la coquille (en même temps que le ticket C : faire C d'abord).

## G. `feat(compte): refaire mon compte, diamants, succès et skins`

`type:feat`, `etat:en_cours`, `est:1-2`, `prio:3` · branche : `v2` · `agent-ok` après maquette validée · dépend de : E

### Histoire
En tant que joueur, je veux retrouver mes diamants, mes succès et mes skins dans un écran qui donne envie d'y revenir.

### Critères d'acceptation
- [x] Étant donné les variantes de `EcranMonCompte.tsx`, quand Nicolas choisit, alors le choix est noté dans `design/DESIGN.md`. (maquette a5, journal du 05/11)
- [x] Étant donné trois succès d'exemple, quand j'ouvre l'écran à 390 px, alors chaque succès montre son état (obtenu ou non), sa récompense en diamants et sa condition.
- [x] Étant donné la déconnexion, quand je l'utilise, alors elle est atteignable en un geste et demande confirmation si une synchro est en attente. (**lot 8, 07/11** : bouton « Se déconnecter » de l'onglet Compte ; synchro en attente → « Sauvegarder et se déconnecter », page « Sauvegarde en cours… », puis déconnexion ; échec → on reste connecté, la sauvegarde locale est intacte)

**Lot 7 fait (06/11)** : « Mon compte » (diamants, succès, skins, état de synchro, déconnexion) et Réglages dans la zone compte. Écarts avec a5 : pas d'e-mail affiché ni de « Changer mon mot de passe » (la session ne connaît pas l'e-mail), pas de ligne « Thème » dans Réglages.

### Hors périmètre
Boutique de skins, nouveaux succès.

### Effort et risques
1 à 2 jours.

## H. `feat(ui): équipe, sac, PC et fiche Pokémon sur téléphone`

`type:feat`, `etat:fait`, `est:2-3`, `prio:3` · branche : `v2` · `agent-ok` après maquette validée · dépend de : C

### Histoire
En tant que joueur, je veux gérer mon équipe et mes boîtes avec le pouce, avec de grosses cases et une fiche claire.

### Critères d'acceptation
- [x] Étant donné les variantes pour `PageEquipe`, `PagePC`, `Sac` et `FichePokemon`, quand Nicolas choisit, alors les choix sont notés dans `design/DESIGN.md` (entrée du 2026-11-05, maquette a5).
- [x] Étant donné six Pokémon dans l'équipe à 390 px, quand j'ouvre l'équipe, alors chaque case fait 48 px au moins de haut et montre nom, niveau, PV. Écart voulu par la maquette a5 : la ligne montre nom, niveau, DPS et barre d'XP (pas de PV) ; chaque ligne dépasse 80 px.
- [x] Étant donné le PC, quand je déplace un Pokémon entre boîte et équipe, alors l'action se fait au toucher sans glisser-déposer obligatoire (`tests-e2e/pc.spec.ts`, `tests-e2e/sac.spec.ts`).
- [x] Étant donné les tests existants, quand `npm test` tourne, alors ils restent verts.
- [x] Retours de Nicolas (notes phase 5, A2 à A4) : Sac en fenêtre avec mode choix et bouton Annuler ; PC trié par DPS décroissant par défaut ; fiche avec Favori à la taille des pastilles, sexe lisible, types aux couleurs du jeu.

**Lot 4 fait** (commits locaux du 06/11 : `1d08609`, `027858f`, `7bf1810`, `e63bc46`, `8575d85`, `48d1fbe`, `2759a75`, `5a7fed3`). Reste : le bouton « Sac » du Combat (lot 3) ; le parcours phone des objets est dans `sac.spec.ts`, `objets-actifs.spec.ts` ne tourne plus que sur grand écran.

### Effort et risques
2 à 3 jours. Risque : `PageEquipe.tsx` (281 lignes) et `FichePokemon.tsx` (227) sont denses.

## I. `feat(ui): version PC, de la maquette à l'implémentation`

`type:feat`, `etat:en_cours`, `est:3-5`, `prio:3` · branche : `v2` · pas d'`agent-ok` avant la validation des maquettes par Nicolas

### Histoire
En tant que joueur sur ordinateur, je veux une version PC pensée pour la souris et le clavier, qui profite de la largeur et reprend les règles du téléphone, pour jouer au bureau sans me battre avec l'interface.

### Contexte
Nicolas (07/11) : trop de soucis d'UX sur PC pour les lister en vrac ; on part de la base téléphone, on la développe pour le PC et on lui présente les maquettes de toutes les situations, comme pour le téléphone. Maquettes : `design/variantes/navigation-pc/` (`index.html` liste les 96 écrans avec l'équivalent téléphone, `pc-app.html` est navigable, `README.md` résume la coquille, les raccourcis et les choix à trancher).

### Retours de Nicolas du 07/11 sur les maquettes (appliqués)
Barre latérale à six entrées (Combat, Équipe, PC, Shop, Carte, Menu, touches 1 à 6) et bouton « Menu principal » en bas de barre ; Centre Pokémon supprimé (pas de PV dans le jeu) ; Pension, Maman, Blue et labo accessibles depuis Bourg Palette par l'image mapping actuel ; Bourg Palette, labo du Prof. Chen et début de partie : **inchangés**, les maquettes montrent des captures du jeu actuel (`img/jeu-actuel/`) ; carte : croix de fermeture centrée, zone actuelle qui clignote en vert, sprite du personnage seulement pendant le vol ; sprites sans fond ni cadre carré (easter eggs compris) ; équipe toujours en 3 colonnes × 2 lignes de 1024 à 2560 px.

### Critères de la phase maquettes
- [x] Étant donné `index.html`, quand je l'ouvre, alors tous les écrans du téléphone (a5-index) et la zone compte y sont listés avec leur équivalent téléphone et leurs différences.
- [x] Étant donné `pc-app.html`, quand je navigue, alors chaque situation est atteignable : combat et états, équipe, fiche, PC, sac, shop, carte et vol, Céladopole, centre commercial, pension, Pokédex, badges, statistiques, guide, menu, réglages, notifications, états vides, chargement, erreurs réseau, hors connexion, easter eggs.
- [x] Étant donné chaque écran à 1280×800, 1440×900 et 1920×1080 (et la coquille à 1024 et 2560), quand je regarde la capture, alors rien ne déborde, aucun sprite ne sort de son cadre, aucun texte n'est coupé (`controle-pc.mjs`).
- [x] Étant donné les six choix du README, quand Nicolas tranche, alors la décision est notée dans `design/DESIGN.md` (fait le 07/11 : barre latérale gauche avec PC et Menu principal, pas de Centre Pokémon, raccourcis validés, fiche en fenêtre, pop-ups en bas à droite).
- [x] Étant donné les maquettes validées, quand Nicolas dit « prêt », alors ce ticket reçoit `agent-ok` et se découpe en lots d'implémentation. Validé le 08/11/2026 (« Je valide »).

### Lots d'implémentation (un seul writer à la fois, dans cet ordre)
- **I1** (fait le 08/11/2026, commits locaux) coquille : barre latérale gauche (6 entrées, Menu principal en bas, sauvegarde et synchro avant de quitter), bandeau haut, légende, raccourcis clavier, focus visible et survol, focus piégé dans les fenêtres, notifications en bas à droite.
- **I2** (fait le 08/11/2026, commits locaux) combat PC (scène à gauche, équipe et effets à droite, boutons 2×2 sous 1400 px) et équipe 3×2, sprites sans fond : `.combat-pc` (EcranCombat, RangEquipe, CombatPC.css), `.equipe-pc` (PageEquipe, EquipePC, EquipePC.css), évolution aussi dans la fiche sur PC, bouton Auto-clic gardé dans la colonne de droite, renommage par la fiche (pas de crayon sur la carte PC, comme la maquette), e2e `combat-equipe-pc.spec.ts` (1280, 1440, 1920, 2560).
- **I3** (fait le 08/11/2026, commits locaux) carte et vol, PC, Shop (onglets Rayons), Pokédex, badges (4 colonnes), statistiques, guide, menu (3 colonnes), réglages, pension, centre commercial, compte : un CSS par page (CartePC.css, PagePC.css, ShopPC.css, DexPC.css, MenuPC.css, ComptePC.css), e2e ecrans-pc.spec.ts (12 écrans à 1280, 1440, 1920 et 2560 px, plus /, grilles du menu et des badges, repère de la Carte, fenêtre de Céladopole, curseurs). Non vérifié : la zone compte (Mes parties) aux quatre largeurs (seulement compte.spec.ts), le casino reste « à venir » sur PC (ticket U). Le test de fluidité PC échoue de temps en temps sous charge (connu, pas corrigé).
- **I4** états (vide, chargement, erreur réseau, hors connexion), e2e à 1440 px, captures 1280/1440/1920/2560, revue.

### Critères d'implémentation (après validation)
- [x] Étant donné 1024 px et plus, quand j'ouvre le jeu, alors la barre latérale gauche, le bandeau haut et la légende des raccourcis remplacent la barre du bas du téléphone ; en dessous de 1024 px, la mise en page téléphone reste inchangée.
- [x] Étant donné le combat sur PC, quand j'appuie sur Espace ou Entrée, alors j'attaque ; C, B, A, T, R, S, F, P, les flèches, 1 à 6 et `/` font ce que dit la liste du README, sauf dans un champ de saisie.
- [x] Étant donné une fenêtre ouverte (Sac, fiche, réglage de l'arrêt auto), quand j'appuie sur Tab, alors le focus reste dans la fenêtre ; Échap la ferme et rend le focus à l'élément d'origine.
- [ ] (coquille faite dans I1 ; combat et équipe dans I2 ; écrans restants dans I3, vérifiés à 1280, 1440, 1920 et 2560 par ecrans-pc.spec.ts ; états de I4 à faire) Étant donné chaque écran à 1280, 1440, 1920 et 2560 px, quand je capture, alors la page ne défile pas, les listes défilent dans leur cadre et rien ne déborde.
- [x] Étant donné une notification, quand elle apparaît sur PC, alors elle s'affiche en pop-up fixe sans déplacer la page.
- [x] Étant donné la souris, quand je survole ou que je tabule, alors chaque contrôle montre un état de survol et un focus visible (cadre jaune).
- [x] Étant donné les tests existants, quand `npm test` tourne, alors ils restent verts et un test e2e à 1440 px couvre le combat au clavier.

### Effort et risques
Maquettes : faites, validées par Nicolas le 07/11 avec les corrections ci-dessus. Implémentation : 3 à 5 jours. Risque : la zone de jeu partage ses composants avec le téléphone (divergence de mise en page).

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

## Q. `fix(ui): retours du test iPhone du 07/11`

`type:fix`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` · dépend de : lots 1 à 8 · source : `docs/projet/notes-nicolas-phase-5.md` (07/11/2026) et captures `docs/projet/retours-iphone-07-11/`

### Histoire
En tant que joueur sur iPhone, je veux que les fenêtres s'ouvrent à une taille lisible, que l'évolution ne décale plus l'écran et que chaque Pokémon reste dans son cadre, pour jouer au pouce sans surprise.

### Critères d'acceptation
- [x] Étant donné un iPhone 15 (WebKit, 393 px, tactile), quand j'ouvre la fiche Pokémon, le Sac, le réglage d'arrêt auto ou la fiche du Pokédex, alors la fenêtre fait au moins 60 % de la hauteur de l'écran, son contenu est visible et défile (test e2e WebKit).
- [x] Étant donné un Pokémon prêt à évoluer sur téléphone, quand je regarde le Combat ou l'Équipe, alors aucun bouton « Évoluer » n'apparaît en ligne : son cadre clignote en jaune (bordure jaune fixe si `prefers-reduced-motion`) et un toucher ouvre sa fiche, où se trouve « Évoluer ». Sur PC, rien ne change.
- [x] Étant donné la ligne d'équipe du Combat, quand je touche un Pokémon, alors sa fiche s'ouvre et se ferme par un bouton accessible.
- [x] Étant donné un sprite (ligne d'équipe, cartes d'Équipe, PC, fiche, Pokédex), quand il s'affiche, alors il tient entièrement dans son cadre sans déformation, Daran et Gabriel compris (test).
- [x] Étant donné la fiche du Pokédex, quand je touche une espèce, alors elle montre le sprite (silhouette si non capturé), le nom, le numéro, les types et les statistiques de base si elles existent dans `data/` ou `src/core`, sans changer ce que le jeu révèle.
- [x] Étant donné un ennemi sauvage, quand il apparaît à 360, 390 et 430 px, alors son sprite, agrandi de 30 à 40 %, est posé sur le cercle vert (réduit d'environ 20 %), entier dans la scène, la barre de PV et le nom restant visibles.
- [x] Étant donné les valeurs de design ajoutées, alors elles passent par des jetons ou variables existants (`tests/ui-valeurs-en-dur.test.ts`) ; aucune règle de jeu ni donnée de contenu ne change ; simulateur inchangé (Ligue 87,0 min).

### Effort et risques
2 à 3 jours. Risque : le bug des fenêtres ne se reproduit pas dans le WebKit de Playwright (Windows) ; la cause est déduite du CSS commun (`.fiche-contenu`) et à confirmer sur l'iPhone.

## R. `fix(ui): notifications en pop-up, lieux d'intro pleine largeur, dialogues en bas`

`type:fix`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` · dépend de : Q · source : `docs/projet/notes-nicolas-phase-5.md` (07/11/2026, quatrième test) et captures `docs/projet/retours-iphone-07-11/iphone-56.jpg` à `iphone-63.jpg`

### Histoire
En tant que joueur sur iPhone, je veux que les notifications n'altèrent jamais la mise en page, que les lieux d'intro remplissent l'écran de jeu et que les dialogues du Prof. Chen ne cachent plus son sprite, pour jouer sans que l'écran sursaute.

### Critères d'acceptation
- [x] Étant donné chez maman, chez Blue et le labo, quand ils s'affichent à 360, 390 et 430 px, alors l'image remplit la largeur de l'écran de jeu, sans bande latérale ni déformation ; « Sortie », le cadre de dialogue et la phrase d'état restent lisibles.
- [x] Étant donné le dialogue du Prof. Chen et le choix du starter, quand ils s'affichent, alors la boîte est ancrée juste au-dessus de la barre des 5 boutons et ne masque ni le prof ni les starters.
- [x] Étant donné n'importe quelle notification (achat, montée de niveau, gain, erreur, synchro), quand elle apparaît, alors elle s'affiche dans un calque fixe en haut de l'écran, borné à la largeur de l'écran, et aucun élément de la page ne change de position ni de taille (test e2e).
- [x] Étant donné le Shop, quand j'achète un objet, alors sa carte ne grandit pas et rien ne sort de l'écran ; aucun écran (Shop, Stats, Équipe, Menu) n'a de défilement horizontal à 360, 390 et 430 px (test e2e).
- [x] Étant donné l'accessoire Poké-Radar, quand le Shop l'affiche, alors l'image est vérifiée (constat noté, sans image inventée si elle manque).
- [x] Étant donné les valeurs de design ajoutées, alors elles passent par des jetons existants ; aucune règle de jeu ni donnée de contenu ne change ; simulateur inchangé.

### Effort et risques
2 à 3 jours. Risque : le recadrage des lieux d'intro touche les zones cliquables (fractions de l'image).
