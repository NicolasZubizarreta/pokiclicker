# Backlog, phase 4.5 « Habillage et découverte »

Jalon : Kanto « attirant » (charte Pokémon, casino, pension, tutoriel). **Demandé par Nicolas le 10/11/2026**, à jouer **avant** l'audio (ticket N) et la passe finale (ticket P) de la phase 5, qui restent dans `backlog-phase-5.md`. Cette phase existe parce que le backlog de la phase 5 n'a plus de lettre libre (le parseur du tableau lit une seule lettre, A à Z).

Source : message de Nicolas du 10/11/2026 et ses réponses aux questions du même jour (texte brut dans `docs/projet/notes-nicolas-phase-5.md`, section du 10/11). Aucun code avant la maquette ou le chiffrage validé, écran par écran (règle du dépôt).

## Décisions de Nicolas (10/11/2026)

- Charte : l'agencement des éléments est parfait, rien ne bouge, ni le fonctionnement. Changent : couleurs, styles de boutons, de bordures, de survol. Le constat : « un site tout gris avec des boutons carrés gris et des doubles bordures partout », ni ludique ni attirant, qui ne rappelle pas Pokémon. Méthode : 3 ou 4 variantes navigables (skill `/design`), il choisit ou mélange.
- Casino : visibilité par annonce plus marquante et rappel, jetons offerts, mini-tuto au déblocage. On garde les jeux de la V1 et on peut en ajouter. Jetons : achat et rachat par 50 seulement, il faut pouvoir choisir le montant. Équilibrage : trop facile, « peu rentable, fun » (un ami est passé de 100 000 à 60 millions en 10 minutes à la machine à sous).
- Pension : « je n'ai pas d'idée » sur son utilité, il tranchera à la maquette sur des pistes chiffrées.
- Tutoriel : bulles sur les éléments, avec action guidée, peu de texte, rejouable depuis le Guide.

## Lecture du lot

Ordre de jeu : A (charte, car casino et pension s'habillent avec) puis B (équilibrage, correction de règle indépendante du visuel, à faire vite), C (casino), D (pension), E (tuto, car les mini-tutos du casino et de la pension décrivent les écrans refaits). B ne dépend de rien et peut passer avant A.

| n | Ticket | Effort |
|---|---|---|
| 1 | A. Charte graphique Pokémon (couleurs, boutons, bordures, survols) | 2 à 3 j |
| 2 | B. Casino : équilibrer la machine à sous, choisir le montant des jetons | 1 j |
| 3 | C. Casino : refonte et visibilité (téléphone et PC) | 2 à 3 j |
| 4 | D. Pension : refonte graphique, visibilité et utilité | 2 à 3 j |
| 5 | E. Tutoriel de la Route 1 et mini-tutos de déblocage | 2 à 3 j |

## A. `feat(design): charte graphique Pokémon, couleurs, boutons, bordures et survols`

`type:feat`, `etat:fait`, `est:2-3`, `prio:2` · branche : `v2` · pas d'`agent-ok` avant le choix des variantes (jugement avec Nicolas)

### Histoire
En tant que joueur, je veux une interface colorée, ludique et qui rappelle Pokémon afin d'avoir envie de jouer, sans que rien ne change de place ni de fonctionnement.

### Contexte
La maquette A5 (validée le 05/11) a fixé l'agencement ; le rendu actuel (plaques grises à angles droits avec bordure et ombre, voir `src/ui/Plaques.css`, `design/tokens.css`) est jugé triste. Nicolas dit ne pas savoir « d'où ça sort » pour les doubles bordures : la première étape est de trouver la cause (bordure + ombre dure + anneau de focus empilés ?) et de la supprimer. Le skill `design` part de vraies bases (jeux et sites Pokémon, UI de jeux mobiles) et produit des variantes navigables dans `design/examples/`. Lire `design/DESIGN.md`, `design/tokens.css`, `design/regions.css` ; les valeurs de la nouvelle charte les remplacent, rien n'est inventé hors de ces fichiers.

### Critères d'acceptation
- [x] Étant donné les captures de l'existant à 390 et 1440 px, quand je les compare, alors la liste des défauts visuels est notée (doubles bordures, gris dominant, boutons carrés, survols plats) avec la cause de chacun dans le code.
- [x] Étant donné la méthode du skill `design`, quand les variantes sont prêtes, alors 3 ou 4 variantes navigables sur la vraie interface (écran de combat, équipe, shop, une fenêtre) existent dans `design/examples/`, chacune passée par la porte de qualité du skill, et Nicolas en choisit une ou en mélange.
- [x] Étant donné la variante choisie, quand la charte est écrite, alors `design/DESIGN.md` (journal daté), `design/tokens.css` et `design/regions.css` portent les nouvelles valeurs (palette, rayons, bordures simples, ombres, états survol, appui, focus, désactivé).
- [x] Étant donné les styles partagés (`Plaques.css`, boutons, cartes, fenêtres, barres, onglets, pastilles), quand la charte est appliquée, alors aucun élément ne change de place, de taille de zone tactile ni de comportement (comparaison de captures avant et après à 360, 390, 430 et 1440 px). _Note 11/11 : aucune capture « avant » (pas de dépôt git), donc pas de comparaison image par image ; captures « après » regardées à 360, 390, 430 et 1440 px, tests de mise en page et de zones tactiles verts. Écart voulu : Fauchage carré 56 px sur téléphone._
- [x] Étant donné chaque état interactif, quand je survole (PC), appuie (téléphone) ou navigue au clavier, alors le retour visuel est net et le focus reste visible. _Note 11/11 : survol des boutons d'action = rouge plus sombre (et non le brun des boutons désactivés), appui = assombri, focus = anneau jaune de 3 px ; captures regardées. Thème clair : jetons contrôlés (contrastes OK), pas de rendu clair regardé, il n'est pas accessible depuis le jeu._
- [x] Étant donné les contrastes de texte et d'icônes, quand le test d'accessibilité du ticket M tourne, alors il passe encore.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et les e2e (projets `pc`, `mobile`, `iphone`) tournent, alors ils sont verts (les captures de référence éventuelles sont mises à jour). _Note 11/11 : e2e 382 passés sur 550 (166 ignorés par conception), un seul échec : `fluidite.spec.ts` (mobile, 12 appuis/s à processeur 4× plus lent), qui échoue aussi sur la base d'avant (machine chargée). `scenes.spec.ts:166` : erreur de routage Playwright, repasse. Correctif au passage : Sortie du labo bornée dans l'image (`SceneLieu.tsx`)._

### Hors périmètre
Agencement, textes, règles de jeu, sprites et décors (ticket O), sons (ticket N), casino et pension en détail (tickets C et D, qui s'appuient sur cette charte).

### Effort et risques
2 à 3 jours (1 jour de variantes, 1 à 2 jours d'application). Risque : une charte appliquée à des centaines de classes Tailwind ; passer par les jetons pour ne toucher qu'un nombre limité de fichiers. Les e2e comparant des captures sont à régénérer.

## B. `fix(casino): équilibrer la machine à sous et laisser choisir le montant des jetons`

`type:fix`, `etat:fait`, `est:1`, `prio:1` · branche : `v2` · pas d'`agent-ok` (touche une règle de jeu, chiffres à valider par Nicolas)

### Histoire
En tant que joueur, je veux que le casino reste un jeu de hasard où l'on perd en moyenne, et acheter ou revendre le nombre de jetons que je veux, afin que le casino ne soit pas une machine à argent et ne m'oblige pas à cliquer dix fois.

### Contexte
`data/casino.json` : jetons achetés et rachetés par lots fixes de 50 (1 000 pour 50, soit 20 par jeton). Machine à sous : trois rouleaux indépendants, poids Magicarpe 65, Baie 18, Staross 10, Pikachu 6, 7 1 ; gain pour trois symboles identiques ×5, ×10, ×20, ×50, ×500, et ×2 pour exactement deux Baies. Estimation à confirmer par le calcul exact : espérance ≈ 1,46 (trois identiques) + 0,16 (deux Baies) ≈ **162 % de la mise**, donc le spam rapporte (Nicolas : 100 000 → 60 millions en 10 minutes). Pile ou face est à 100 % ; le blackjack est à mesurer. La boutique du casino vend au contraire cher (Master Ball 40 000 jetons).

### Critères d'acceptation
- [x] Étant donné les trois jeux et la boutique du casino, quand le calcul exact (machine) et la simulation de 1 million de parties (blackjack avec la stratégie du croupier, pile ou face) tournent, alors un tableau note l'espérance de chaque jeu et le gain horaire d'un joueur qui joue sans arrêt.
- [x] Étant donné ce tableau, quand je propose de nouveaux gains et poids pour que chaque jeu soit sous 100 % (cible proposée : 90 à 97 % pour la machine, « peu rentable, fun » selon Nicolas), alors Nicolas valide les chiffres avant qu'ils soient écrits dans `data/casino.json`.
- [x] Étant donné les chiffres validés, quand un test simule 10 minutes de spam à 7 parties par seconde en partant de 100 000, alors le solde final reste proche du départ ou en baisse (seuil noté dans le test), loin des 60 millions constatés.
- [x] Étant donné l'écran du casino, quand j'achète des jetons, alors je saisis le montant en jetons (entier de 1 au maximum payable), avec les boutons rapides conservés (le lot de 50 reste proposé), au même taux qu'avant ; la même chose pour le rachat.
- [x] Étant donné un montant invalide (zéro, négatif, trop grand, non entier), quand je valide, alors rien ne se passe et le message « Mise invalide. » ou « Pas assez d'argent. » s'affiche.
- [x] Étant donné le taux d'achat et de rachat, quand j'achète puis je revends la même quantité, alors je ne gagne rien (pas d'arbitrage).
- [x] Étant donné les textes du casino (« +1 000 $ » dans `messages.rachatJetons`), quand l'argent s'affiche, alors la monnaie est ₽ partout.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et l'e2e du casino tournent, alors ils sont verts (tests du cœur : `src/core/casino.test.ts`, `tests/` de fidélité V1 : l'écart de règle voulu est noté dans `tests/ecarts-v1.ts`).

### Note du 11/11/2026 : blackjack
Blackjack complet (sabot de 6 paquets, carte cachée, doubler, séparer, assurance, abandon) à la demande de Nicolas le 11/11 (« un vrai blackjack avec les vraies chances »). Règles standard, aucun pourcentage réglé : sabot de 6 paquets remélangé sous 25 % de cartes restantes entre deux mains, croupier qui reste sur tous les 17, blackjack naturel ×2,5, doubler sur une carte, séparer jusqu'à 4 mains (as séparés : une carte chacun), assurance ×2 sur demi-mise, abandon (moitié de la mise). Arrondi toujours vers le bas ; assurance et abandon sont donc impossibles avec une mise de 1 jeton. Moteur : `src/core/blackjack.ts`, règles dans `data/casino.json`.
Rendement mesuré (`src/core/casino-blackjack-simulation.test.ts`, 1 000 000 de mains, stratégie de base simplifiée : tirer, rester, doubler ; ni séparation, ni abandon, ni assurance) : **99,04 %** à mise 10, **96,98 %** à mise 1 (le blackjack naturel y est arrondi à 2 au lieu de 2,5). La banque garde son avantage ; le chiffre exact dépend du joueur.

### Hors périmètre
Habillage et mise en page du casino (ticket C), nouveaux jeux, jetons offerts, boutique du casino (prix), simulateur de parcours.

### Effort et risques
1 jour. Risque : la fidélité V1 (tests de non-régression des gains) à mettre à jour comme écart voulu ; revoir l'effet sur le simulateur (la machine n'y entre pas, à vérifier).

## C. `feat(ui): refonte du casino, visibilité, habillage, jeux et jetons offerts`

`type:feat`, `etat:fait` (codé et poussé le 12/11 ; Nicolas est passé au ticket D le 12/11 sans signaler de défaut au test ; mini-tuto au ticket E), `est:2-3`, `prio:2` · branche : `v2` · pas d'`agent-ok` avant la maquette validée · dépend de : A, B · remplace le ticket U de `backlog-plus-tard.md`

### Histoire
En tant que joueur, je veux savoir que le casino existe, avoir envie d'y entrer et m'y amuser (téléphone et PC) afin qu'il ne reste pas un lieu que personne ne visite.

### Contexte
Décision du 07/11 : refonte complète du casino, sur téléphone et PC. Décision du 10/11 : « les joueurs ne savent même pas qu'il existe ». Aujourd'hui l'annonce de déblocage (« Casino débloqué ! Il est sur la Carte, dans la fiche de Céladopole », `data/deblocages.json`) disparaît en 3 secondes. Les trois jeux de la V1 (machine à sous, pile ou face, blackjack) et la boutique (Abra, Super Bonbon, Insecateur, Minidraco, Porygon, CT Jackpot, Master Ball) sont gardés ; Nicolas accepte des jeux en plus si j'ai des idées.

### Critères d'acceptation
- [x] Étant donné le déblocage du casino, quand il a lieu, alors l'annonce est plus marquante que les autres (carte en haut qui reste jusqu'à un geste, avec un bouton « Y aller ») et l'entrée du casino est rappelée par une pastille sur le menu ou la Carte tant que le joueur n'y est jamais entré (même mécanisme que les annonces vues, `docs/projet/deblocages-annonces.md`).
- [x] Étant donné le casino débloqué, quand j'ouvre le menu de jeu ou la Carte, alors un accès direct au casino y figure (plus seulement la fiche de Céladopole).
- [x] Étant donné la première entrée au casino, quand elle a lieu, alors un nombre de jetons est offert une seule fois (nombre proposé par moi, validé par Nicolas ; sauvegardé, pas rejouable) et le mini-tuto du casino (ticket E) s'ouvre.
  - Décision de Nicolas (12/11) : le mini-tuto se fera au moment du ticket E (critère « déblocages » du ticket E), pas ici ; la case est cochée pour les jetons offerts. Faits : les 100 jetons offerts (`premiereEntree` dans `data/casino.json`, champ sauvegardé `casinoVu`, message de bienvenue dans la page). Le mini-tuto n'est pas branché : au ticket E, s'y brancher avec `surPremiereEntreeCasino(() => ouvrirTuto())` dans `src/ui/store-casino.ts`, appelé une seule fois par partie, juste après le cadeau.
  - Choix pour les anciennes sauvegardes : `casinoVu` est optionnel, sans migration ni changement de version. Absent = « jamais entré » : un joueur qui a déjà le casino ouvert (ou des jetons) reçoit les 100 jetons à sa première entrée après la mise à jour et voit la pastille, mais pas l'annonce, si `annoncesVues` contient déjà `casino`.
  - Faits pour les critères 1 et 2 : annonce « carte » (`carte` dans `data/deblocages.json`) qui reste jusqu'à « Y aller » ou « Fermer » et revient au rechargement ; pastille sur les onglets Menu et Carte (barre du bas et barre latérale), sur la ligne Casino du Menu et sur la ligne Casino de la Carte. Sur PC, l'annonce s'affiche en bas à droite (mécanisme des notifications), en haut sur téléphone.
- [x] Étant donné la maquette, quand 3 variantes téléphone et PC sont prêtes (écran du casino, chacun des 3 jeux, la boutique, avec la charte du ticket A), alors Nicolas choisit ou mélange, et les maquettes sont des pages HTML dans `design/examples/`.
  - Fait (11/11) : Nicolas a choisi la variante A « salle en scène ». Sa version autonome (HTML unique, images et polices incluses) est dans `design/examples/2026-11-11-casino-a-scene.html` ; les trois variantes de travail restent dans `design/variantes/casino/`. `design/examples/` n'a pas de fichier `index.md`, rien n'y a été ajouté.
- [x] Étant donné le choix de Nicolas, quand le casino est codé, alors il ressemble à la maquette à 360, 390, 430 et 1440 px, les animations et sons du casino de la V1 sont portés (rouleaux, pièces), et le casino reste utilisable au pouce.
  - Fait (11/11) : `PageCasino.tsx` + `PageCasino.css` (jetons de `design/tokens.css` seulement, textes ≥ 16 px, boutons ≥ 44 px), captures regardées à 360, 390, 430 et 1440 px. La page s'ouvre sur la salle (sur la table de blackjack si une main est en cours). Rouleaux de la machine : changement de symbole toutes les 80 ms puis retombée de 350 ms (V1 : 700, 950 et 1 200 ms), pièce de 500 ms, « réduire les animations » respecté.
  - La V1 n'avait aucun son au casino : le ton existant `coin` est joué à chaque victoire. De vrais sons sont le ticket N.
  - Les notifications du jeu ne montrent plus les résultats du casino (elles les dévoilaient avant la fin de l'animation) ; la phrase d'état de la page les annonce.
- [x] Étant donné de nouveaux jeux, quand je les propose, alors 2 ou 3 idées avec leurs règles, leur espérance de gain (sous 100 %) et leur coût de développement sont présentées à Nicolas ; seuls les jeux qu'il valide sont codés, les autres restent des idées notées dans `backlog-plus-tard.md`.
  - Fait : roulette européenne, plus ou moins et carte à gratter (cœur et chiffres au ticket B) sont branchés dans la page, chaque coup est sauvegardé tout de suite. La carte visible du plus ou moins est sauvegardée (`plusOuMoinsCarte`, champ facultatif de la région, sans changement de version). Carte à gratter : un rechargement en plein ticket garde les jetons (déjà crédités) mais perd la révélation des cases.
- [x] Étant donné les règles de jeu, quand le casino est refait, alors aucune règle non décidée ne change (les chiffres du ticket B font foi).
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et les e2e (projets `pc`, `mobile`, `iphone`) tournent, alors ils sont verts.
  - Vérifié (12/11) : `tsc -b` et eslint propres, vitest complet, e2e `casino` et `casino-visibilite` sur `pc` et `mobile` (16 tests, dont une partie de chaque nouveau jeu) et `fenetres-iphone` sur `iphone` (4 tests).

### Hors périmètre
Équilibrage et montant des jetons (ticket B), contenu du tuto (ticket E), sons nouveaux (ticket N), argent réel (aucun paiement, mention « argent virtuel » conservée).

### Effort et risques
2 à 3 jours, plus le développement des jeux validés (à découper en autre ticket s'il dépasse 1 jour). Risque : la pastille et l'accès direct touchent la coquille de navigation (une seule écriture à la fois sur ces fichiers) ; les jetons offerts ajoutent un champ à la sauvegarde (migration, revue obligatoire).

## D. `feat(pension): refonte graphique, visibilité et utilité de la pension`

`type:feat`, `etat:fait` (codé et commité en local le 12/11, non poussé ; reste le test de Nicolas), `est:2-3`, `prio:3` · branche : `v2` · pas d'`agent-ok` (règles de jeu à décider avec Nicolas) · dépend de : A

### Histoire
En tant que joueur, je veux connaître la pension, la trouver attirante et avoir une vraie raison de m'en servir afin qu'elle compte dans ma progression.

### Contexte
Réglages actuels (`data/reglages.json`, bloc `pension`) : 5 emplacements à 5 000 chacun, éclosion après 25 pas, bonheur de naissance 125, chromatique à 12,5 %, Métamorph, même espèce (4 %) ou type partagé (2 %), espèces tirées parmi les 151. Constat de Nicolas : personne ne la connaît, lui-même ne s'en est jamais servi, et en fin de partie l'argent est abondant : une Master Ball sur un Mewtwo, un Jeton Shiny et des baies pour le bonheur maximal rendent l'œuf inutile. Il n'a pas d'idée de remède : il tranchera sur des pistes chiffrées.

### Critères d'acceptation
- [x] Étant donné les mécaniques de la pension et de la capture (Master Ball, Jeton Shiny, baies, bonbons, évolutions), quand j'analyse, alors un tableau compare ce qu'un œuf rapporte à ce que coûte la même chose par une autre voie, et dit lesquelles de ces choses la pension ne peut pas remplacer aujourd'hui.
- [x] (12/11 : pistes 1 et 2 retenues, marque +5 %, paliers = succès + diamants ; décision dans `docs/plan.md`) Étant donné ce tableau, quand je propose 3 pistes d'utilité chiffrées (exemples : œufs donnant des Pokémon obtenables seulement par œuf, œufs à objectif avec parents choisis pour un résultat sûr, ressource ou objet unique à l'éclosion), alors Nicolas choisit une ou plusieurs pistes avant tout code, et le choix est noté dans `docs/vision.md` ou `docs/plan.md`.
- [x] (12/11 : variante 1b « nid en scène » choisie par Nicolas, dans `design/variantes/pension/` ; copie autonome : `design/examples/2026-11-12-pension-nid-en-scene.html`, ligne ajoutée à `design/examples/index.md`) Étant donné la maquette, quand 3 variantes téléphone et PC sont prêtes (écran de la pension, une éclosion, avec la charte du ticket A), alors Nicolas choisit ou mélange, et les maquettes sont des pages HTML dans `design/examples/`.
- [x] Étant donné la pension débloquée, quand le déblocage a lieu, alors l'annonce est plus marquante et la pension est rappelée (pastille, accès direct depuis le menu de jeu ou la Carte) tant que le joueur n'y est jamais entré, sur le modèle du ticket C.
- [x] Étant donné les règles choisies, quand elles sont codées dans le cœur (`src/core/pension.ts`, données dans `data/`), alors des tests couvrent chaque règle nouvelle, la sauvegarde existante se migre sans perte, et l'écart avec la V1 est noté dans `tests/ecarts-v1.ts`.
- [x] Étant donné la pension refaite, quand je joue à 360, 390, 430 et 1440 px, alors elle ressemble à la maquette, l'éclosion est mise en scène (animation, son de la V1 porté) et tout reste utilisable au pouce.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et les e2e (projets `pc`, `mobile`, `iphone`) tournent, alors ils sont verts.

### Faits (12/11, ticket codé, commité en local, non poussé)
- Écran : `PagePension.tsx` + `.css` (décor entier, parents sur l'enclos, emplacements d'œuf, « Prendre l'œuf », achat d'emplacement), choix d'un parent dans une fenêtre native (feuille du bas sur téléphone, recherche, sections Équipe et PC, chance de ponte de chaque couple lue dans `couplePonte` du cœur), `CollectionEclosions.tsx` (x/151, silhouettes, quatre paliers lus dans `data/succes.json`), `FenetreEclosion.tsx` (éclosion mise en scène, ton `up`, marque +5 %, chromatique, succès gagnés). Un œuf de l'équipe éclôt à la victoire d'un combat : pas de bouton « Faire éclore ».
- Marque : ligne « Marque d'éclosion » dans la fiche (`detailDps`) et repère `RepereMarque` sur la fiche, l'équipe, le Combat et le PC ; la marque suit le Pokémon à l'évolution et à l'aller-retour PC (tests du cœur, aucune action de l'interface ne recopie le Pokémon).
- Visibilité : annonce « carte » qui revient au rechargement tant qu'elle n'est pas fermée, pastille sur Menu, Carte et leurs lignes tant que la pension n'a jamais été visitée, accès direct depuis le Menu et la Carte, rien si la pension est fermée. Drapeau `pensionVue` (facultatif, sans migration). Anciennes sauvegardes : une pension déjà utilisée (parents, œufs ou espèces écloses) compte comme visitée ; sinon la pastille s'affiche, mais pas l'annonce si `annoncesVues` contient déjà `pension`. Pas de cadeau de jetons.
- Vérifié : `tsc -b` (build), eslint (1 avertissement ancien, `PageEquipe.tsx`), vitest complet, e2e `pension`, `pension-visibilite` (pc, mobile) et `pension-visibilite` + `fenetres-iphone` (iphone, WebKit de Playwright) : 26 verts ; captures regardées à 360, 390, 430 et 1440 px, aucun défilement horizontal. Le projet `iphone` de `playwright.config.ts` lance aussi `pension-visibilite.spec.ts`.
- Non vérifié : iPhone réel, sons (le ton `up` n'a pas été écouté), éclosion avec le jeu réel sur plusieurs heures.
- À trancher : un œuf de l'équipe peut être choisi comme parent (le cœur ne l'interdit pas, règle d'avant ce ticket).

### Hors périmètre
Mini-tuto de la pension (ticket E), sons nouveaux (ticket N), règles autres que celles choisies par Nicolas.

### Effort et risques
2 à 3 jours pour l'analyse, la maquette et le visuel ; le code des règles choisies peut dépasser 3 jours : alors, un ticket de plus après le choix. Risque : une règle de pension qui casse l'équilibrage de la progression (à mesurer avec le simulateur de parcours avant de coder).

## E. `feat(tuto): tutoriel de la Route 1 et mini-tutos de déblocage`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:3` · branche : `v2` · pas d'`agent-ok` avant la validation des étapes (touche la sauvegarde) · dépend de : A, C, D

### Histoire
En tant que nouveau joueur, je veux comprendre en quelques secondes comment jouer, puis qu'on m'explique chaque système au moment où il s'ouvre, afin de ne pas passer à côté du casino, de la pension, du Fauchage ou du Poké-Radar.

### Contexte
Le jeu n'a aujourd'hui qu'un dialogue d'intro (Chen) et un Guide. Nicolas veut un tuto sur toute la durée du jeu : à la Route 1 le joueur comprend le principe, « pas trop long, pas trop de texte qu'ils ne liront pas » ; des encadrés qui montrent les éléments un par un ; une petite partie pour chaque élément débloqué (centre commercial, casino, pension, Fauchage, Poké-Radar, auto-clic…). Forme choisie : bulles sur l'élément avec action guidée (l'étape suivante s'ouvre quand le joueur fait l'action). Rappel : depuis le Guide. Les déblocages existent dans `data/deblocages.json` ; leur état « vu » est déjà sauvegardé (`docs/projet/deblocages-annonces.md`).

### Critères d'acceptation
- [ ] Étant donné la Route 1 d'une nouvelle partie, quand le joueur arrive au combat, alors 5 à 6 bulles au plus, de 12 mots au plus chacune (limites proposées), éclairent un élément à la fois : cliquer pour attaquer, barre de PV, capturer, l'équipe, le sac ; chaque étape se valide quand le joueur fait l'action (clic, capture, ouverture de l'équipe), et la liste exacte est validée par Nicolas avant le code.
- [ ] Étant donné une bulle, quand je veux passer, alors un bouton « Passer le tuto » est toujours là, sans pénalité, et le jeu reste jouable pendant le tuto.
- [ ] Étant donné les déblocages (centre commercial, casino, pension, Fauchage, Poké-Radar, auto-clic, et ceux que Nicolas ajoute), quand l'un d'eux a lieu, alors un mini-tuto de 1 à 3 bulles s'ouvre à la première visite de l'écran concerné, et le texte du casino et de la pension suit les écrans refaits (tickets C et D). Le crochet du casino est déjà posé : surPremiereEntreeCasino(() => ouvrirTuto()) dans src/ui/store-casino.ts (décision du 12/11 : le mini-tuto du casino se fait ici, pas au ticket C). Le crochet de la pension est posé aussi : `surPremiereEntreePension(() => ouvrirTuto())` dans `src/ui/store-pension.ts`, appelé une seule fois par partie à la première entrée dans la pension (pas d'appel si la pension a déjà servi avant la mise à jour).
- [ ] Étant donné un tuto ou un mini-tuto vu ou passé, quand la partie est rechargée ou ouverte sur un autre appareil, alors il ne se relance pas (état sauvegardé avec la partie, migration sans perte).
- [ ] Étant donné le Guide, quand je l'ouvre, alors chaque tuto et chaque mini-tuto peut être rejoué.
- [ ] Étant donné les données, quand les tutoriels sont écrits, alors ils vivent dans `data/tutoriels.json` (étapes, élément ciblé, texte, action attendue, déblocage), pas en dur dans le code, et un test vérifie que chaque élément ciblé existe.
- [ ] Étant donné les bulles, quand elles s'affichent à 360, 390, 430 et 1440 px, alors elles ne cachent pas l'élément expliqué, restent lisibles, au pouce, avec la charte du ticket A, et passent le contrôle d'accessibilité (focus, lecteur d'écran, mouvement réduit).
- [ ] Étant donné les tests, quand `tsc -b`, eslint, vitest et les e2e (projets `pc`, `mobile`, `iphone`) tournent, alors ils sont verts (un e2e déroule le tuto de la Route 1 complet).

### Hors périmètre
Contenu des écrans casino et pension (tickets C et D), dialogue Chen existant, sons, tuto des régions suivantes.

### Effort et risques
2 à 3 jours. Risque : le moteur de bulles doit viser des éléments dont l'agencement change selon téléphone et PC (cibler par rôle ou identifiant, pas par position) ; le champ de suivi ajoute à la sauvegarde (revue obligatoire, pas d'`agent-ok`).
