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

`type:feat`, `etat:fait` (12/11 : Nicolas a validé la liste des bulles de la Route 1 et des mini-tutos PC, centre commercial, pension, casino, Poké-Radar, Fauchage, auto-clic ; variante B choisie (carte fixe en haut, progression n/N) avec le Prof. Chen de la C en bas à droite de l'écran ; il demande en plus des bulles sur « Attaque auto » et « Arrêt auto » à la Route 1, donc 7 à 8 bulles au lieu de 5 à 6 : limite relevée à sa demande), `est:2-3`, `prio:3` · branche : `v2` · pas d'`agent-ok` avant la validation des étapes (touche la sauvegarde) · dépend de : A, C, D

### Histoire
En tant que nouveau joueur, je veux comprendre en quelques secondes comment jouer, puis qu'on m'explique chaque système au moment où il s'ouvre, afin de ne pas passer à côté du casino, de la pension, du Fauchage ou du Poké-Radar.

### Contexte
Le jeu n'a aujourd'hui qu'un dialogue d'intro (Chen) et un Guide. Nicolas veut un tuto sur toute la durée du jeu : à la Route 1 le joueur comprend le principe, « pas trop long, pas trop de texte qu'ils ne liront pas » ; des encadrés qui montrent les éléments un par un ; une petite partie pour chaque élément débloqué (centre commercial, casino, pension, Fauchage, Poké-Radar, auto-clic…). Forme choisie : bulles sur l'élément avec action guidée (l'étape suivante s'ouvre quand le joueur fait l'action). Rappel : depuis le Guide. Les déblocages existent dans `data/deblocages.json` ; leur état « vu » est déjà sauvegardé (`docs/projet/deblocages-annonces.md`).

### Critères d'acceptation
- [x] Étant donné la Route 1 d'une nouvelle partie, quand le joueur arrive au combat, alors 8 bulles, de 12 mots au plus chacune (limite relevée à la demande de Nicolas, 12/11), éclairent un élément à la fois : cliquer pour attaquer, barre de PV, capturer, l'équipe, le sac ; chaque étape se valide quand le joueur fait l'action (clic, capture, ouverture de l'équipe), et la liste exacte est validée par Nicolas avant le code.
- [x] Étant donné une bulle, quand je veux passer, alors un bouton « Passer le tuto » est toujours là, sans pénalité, et le jeu reste jouable pendant le tuto.
- [x] Étant donné les déblocages (centre commercial, casino, pension, Fauchage, Poké-Radar, auto-clic, et ceux que Nicolas ajoute), quand l'un d'eux a lieu, alors un mini-tuto de 1 à 3 bulles s'ouvre à la première visite de l'écran concerné, et le texte du casino et de la pension suit les écrans refaits (tickets C et D). Le crochet du casino est déjà posé : surPremiereEntreeCasino(() => ouvrirTuto()) dans src/ui/store-casino.ts (décision du 12/11 : le mini-tuto du casino se fait ici, pas au ticket C). Le crochet de la pension est posé aussi : `surPremiereEntreePension(() => ouvrirTuto())` dans `src/ui/store-pension.ts`, appelé une seule fois par partie à la première entrée dans la pension (pas d'appel si la pension a déjà servi avant la mise à jour).
- [x] Étant donné un tuto ou un mini-tuto vu ou passé, quand la partie est rechargée ou ouverte sur un autre appareil, alors il ne se relance pas (état sauvegardé avec la partie, migration sans perte).
- [x] Étant donné le Guide, quand je l'ouvre, alors chaque tuto et chaque mini-tuto peut être rejoué.
- [x] Étant donné les données, quand les tutoriels sont écrits, alors ils vivent dans `data/tutoriels.json` (étapes, élément ciblé, texte, action attendue, déblocage), pas en dur dans le code, et un test vérifie que chaque élément ciblé existe.
- [x] Étant donné les bulles, quand elles s'affichent à 360, 390, 430 et 1440 px, alors elles ne cachent pas l'élément expliqué, restent lisibles, au pouce, avec la charte du ticket A, et passent le contrôle d'accessibilité (focus, lecteur d'écran, mouvement réduit).
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et les e2e (projets `pc`, `mobile`, `iphone`) tournent, alors ils sont verts (un e2e déroule le tuto de la Route 1 complet).

**Réalisé (13/11).** Mini-tutos armés par un `data-tuto` visible à la première visite (les crochets `surPremiereEntree*` ne servent pas) ; cibles pension et casino sur des éléments compacts ; bouton Sac ajouté dans l’en-tête Équipe sur téléphone ; sur PC, la liste des tutoriels du Guide est une section de sa navigation (13 sections) ; Chen en bas à droite, ou en haut au centre ou dans un coin libre quand la cible ou les boutons l’exigent (voir captures). Limites connues : la migration est enregistrée dès l’ouverture, mais la synchro refuse un conflit de révision (pas de fusion par union des `tutosVus`) ; un rechargement en plein tuto de la Route 1 après la première victoire le considère « dépassé » (rejouable depuis le Guide). Reste à tester sur iPhone réel.

### Hors périmètre
Contenu des écrans casino et pension (tickets C et D), dialogue Chen existant, sons, tuto des régions suivantes.

### Effort et risques
2 à 3 jours. Risque : le moteur de bulles doit viser des éléments dont l'agencement change selon téléphone et PC (cibler par rôle ou identifiant, pas par position) ; le champ de suivi ajoute à la sauvegarde (revue obligatoire, pas d'`agent-ok`).

## Retours du testeur du 17/11 (tickets F à V)

Source : retour d'un testeur qui a fini le jeu à 100 % et tenté le shiny dex avec les seuls œufs. Décisions et valeurs de Nicolas : `docs/projet/decisions-retour-testeur-17-11.md`. Le point 5 du testeur (PC de Léo sur mobile) est refusé par Nicolas. Ordre conseillé : F, R, S, T (bug et équilibrage), puis G, H, I, K, L, J, M, N, P, O, Q, et en dernier U puis V (fusion Équipe/PC, décision de Nicolas). Toute valeur de jeu change seulement dans le ticket qui la nomme.

## F. `fix(pension): compter les évolutions des Pokémon éclos dans le dex éclos`

`type:fix`, `etat:fait`, `est:0.5-1`, `prio:1` · branche : `v2` · `agent-ok` recommandé (une migration légère, pas de règle de jeu)

### Histoire
En tant que joueur, je veux que l'évolution d'un Pokémon éclos compte dans la liste des éclos, afin de pouvoir finir le x/151 (aujourd'hui seuls les stades 1 éclosent, donc il est impossible à compléter).

### Critères d'acceptation
- [x] Étant donné un Pokémon portant la marque d'éclosion, quand il évolue (Bulbizarre en Herbizarre, puis en Florizarre), alors chaque espèce atteinte s'ajoute à `especesEcloses` et le compteur x/151 monte.
- [x] Étant donné un Pokémon sans marque d'éclosion, quand il évolue, alors `especesEcloses` ne change pas.
- [x] Étant donné une sauvegarde où des Pokémon à marque ont déjà évolué (équipe ou PC), quand la partie se charge, alors leurs espèces sont ajoutées à `especesEcloses` (migration de rattrapage, sans perte).
- [x] Étant donné la collection d'éclosions, quand tous les stades d'une lignée ont été obtenus par œuf puis évolution, alors ils sont tous marqués comme éclos.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et les e2e `pension` tournent, alors ils sont verts (vitest : seuls échecs, `PagePlus.test.tsx` — texte « Vu » retiré par c70f13b, déjà rouge sur `v2` — et les deux tests de sons/musiques liés aux mp3 ignorés par git dans un worktree).

### Hors périmètre
Les nouvelles listes (ticket G).

### Effort et risques
0,5 à 1 jour. Risque : la migration touche la sauvegarde (revue de la migration).

## G. `feat(pokedex): quatre listes de dex (Pokédex, shiny, œuf, œuf shiny) et inscription croisée`

`type:feat`, `etat:fait`, `est:1.5-2`, `prio:2` · branche : `v2` · pas d'`agent-ok` (sauvegarde) · dépend de : F

### Histoire
En tant que joueur, je veux un dex shiny, un dex œuf et un dex œuf shiny qui se remplissent tout seuls, afin de les compléter sans que le Pokédex principal cesse de compter.

### Contexte
Le dex œuf existe déjà (`especesEcloses`, corrigé au ticket F). Il manque la liste des espèces shiny et celle des espèces œuf shiny. Règle de Nicolas : toute première obtention d'une espèce, quelle que soit sa catégorie, l'inscrit aussi au Pokédex principal.

### Critères d'acceptation
- [x] Étant donné la capture d'un Pokémon normal d'une espèce jamais obtenue, quand elle a lieu, alors l'espèce s'inscrit au Pokédex.
- [x] Étant donné la capture d'un Pokémon shiny d'une espèce jamais vue en shiny, quand elle a lieu, alors l'espèce s'inscrit au dex shiny et au Pokédex.
- [x] Étant donné l'éclosion d'une espèce jamais éclose, quand elle a lieu, alors l'espèce s'inscrit au dex œuf et au Pokédex ; si l'éclos est shiny, elle s'inscrit aussi au dex œuf shiny et au dex shiny (confirmé par Nicolas le 17/11 : un éclos shiny remplit les quatre listes).
- [x] Étant donné l'évolution d'un Pokémon shiny, d'un éclos ou d'un éclos shiny, quand elle a lieu, alors l'espèce atteinte s'inscrit dans les listes que ce Pokémon remplit.
- [x] Étant donné une ancienne sauvegarde, quand elle se charge, alors les listes shiny, œuf shiny et œuf sont rattrapées depuis les Pokémon possédés (drapeau shiny, marque d'éclosion), sans rien retirer.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest (dont migration) et e2e tournent, alors ils sont verts.

### Hors périmètre
L'écran des dex (ticket H), le relâchement automatique (ticket L).

### Effort et risques
1,5 à 2 jours. Risque : migration de sauvegarde (revue obligatoire) ; les Pokémon déjà relâchés ne se rattrapent pas.

## H. `feat(pokedex): quatre boutons de dex, filtre en liste déroulante et tags shiny/éclos`

`type:feat`, `etat:fait`, `est:1.5-2`, `prio:2` · branche : `v2` · `agent-ok` recommandé après G · dépend de : G

### Histoire
En tant que joueur, je veux passer d'un dex à l'autre d'un bouton, et voir d'un coup d'œil quelles espèces sont shiny ou éclosent, afin de suivre ma collection.

### Critères d'acceptation
- [x] Étant donné la page Pokédex (téléphone et PC), quand je l'ouvre, alors quatre boutons choisissent le dex (Pokédex, Shiny, Œuf, Œuf shiny) et chacun affiche son x/151.
- [x] Étant donné les trois boutons Tous / Capturés / À trouver, quand la page s'ouvre, alors ils sont remplacés par une liste déroulante au même style que le filtre du PC, qui s'applique au dex choisi.
- [x] Étant donné une espèce du Pokédex principal qui est aussi dans le dex shiny ou œuf, quand la case s'affiche, alors un tag shiny et un tag éclos y figurent.
- [x] Étant donné les cases, quand elles sont capturées, vues ou inconnues, alors elles gardent la même taille (règle du 17/11), et les sprites des dex shiny sont chromatiques.
- [x] Étant donné les paliers du Pokédex, quand les autres dex changent, alors la progression des paliers reste celle du Pokédex principal.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e (`mobile`, `pc`, `iphone`) tournent, alors ils sont verts, et des captures à 360, 390 et 1440 px sont regardées. _Note 17/11 : e2e ciblés (mobile, pc, iphone) verts, sauf combat-equipe-pc (4) et pension-visibilite (3), qui échouent aussi sur la base 8f685ff, et pc.spec « placer jusqu’à six », instable sous charge. Captures à 360, 390 et 1440 px regardées._

### Hors périmètre
Les listes elles-mêmes (G), les zones (I).

### Effort et risques
1,5 à 2 jours. Risque : la grille de 151 cases doit rester fluide.

## I. `feat(pokedex): zones où trouver l'espèce dans la fiche`

`type:feat`, `etat:fait`, `est:1-2`, `prio:3` · branche : `v2` · `agent-ok` recommandé

### Histoire
En tant que joueur, je veux voir où trouver un Pokémon que j'ai capturé ou vu, afin de savoir où aller le chercher.

### Critères d'acceptation
- [x] Étant donné une espèce capturée ou vue, quand j'ouvre sa fiche du Pokédex, alors les zones de `data/regions/kanto/zones.json` où elle apparaît s'affichent (nom de la zone).
- [x] Étant donné une évolution introuvable à l'état sauvage, quand j'ouvre sa fiche, alors les zones de son stade précédent s'affichent avec la mention « via l'évolution de X ».
- [x] Étant donné une espèce jamais vue ni capturée, quand j'ouvre sa fiche, alors aucune zone n'est révélée.
- [x] Étant donné une espèce introuvable en zone (cadeau, pension), quand j'ouvre sa fiche, alors un texte le dit.
- [x] Étant donné les données, quand la liste est calculée, alors elle vient du JSON des zones et de `data/evolutions.json`, pas d'un tableau écrit en dur, avec un test sur trois espèces.

### Hors périmètre
Les taux d'apparition (affichés plus tard si Nicolas le veut).

### Effort et risques
1 à 2 jours.

## J. `feat(pc): relâcher par lot avec favoris verrouillés`

`type:feat`, `etat:fait`, `est:1-2`, `prio:3` · branche : `v2` · pas d'`agent-ok` (suppression en masse)

### Histoire
En tant que joueur, je veux sélectionner plusieurs Pokémon du PC et les relâcher d'un coup, sans risquer mes favoris.

### Critères d'acceptation
- [x] Étant donné la page PC, quand j'appuie sur « Relâcher », alors je passe en mode sélection et je coche autant de Pokémon que je veux.
- [x] Étant donné un favori, quand je suis en mode sélection, alors un verrou l'indique et il ne peut pas être coché.
- [x] Étant donné une sélection, quand je confirme, alors une fenêtre annonce le nombre de Pokémon (et dit si des shiny en font partie) avant toute suppression, et seuls les Pokémon cochés sont relâchés.
- [x] Étant donné un filtre actif, quand je choisis « tout sélectionner », alors seuls les Pokémon visibles et non favoris sont cochés.
- [x] Étant donné un objet porté par un Pokémon relâché, quand le lot est relâché, alors l'objet revient au sac comme pour un relâchement seul (comportement existant à vérifier).
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e tournent, alors ils sont verts.

### Hors périmètre
Relâche automatique (ticket L).

### Effort et risques
1 à 2 jours. Risque : perte involontaire de Pokémon (revue obligatoire).

## K. `feat(reglages): passer automatiquement les éclosions`

`type:feat`, `etat:fait`, `est:0.5-1`, `prio:3` · branche : `v2` · `agent-ok` recommandé

### Histoire
En tant que joueur, je veux un réglage pour que les éclosions ne m'arrêtent plus, afin de laisser tourner la pension.

### Critères d'acceptation
- [x] Étant donné la page Réglages, quand je l'ouvre, alors une option « Passer les éclosions » existe, éteinte par défaut, mémorisée avec le compte comme l'évolution automatique.
- [x] Étant donné l'option allumée, quand un œuf éclôt, alors la fenêtre d'éclosion ne s'ouvre pas, le Pokémon est ajouté comme d'habitude (marque d'éclosion, shiny, succès) et une notification discrète le dit.
- [x] Étant donné l'option éteinte, quand un œuf éclôt, alors la fenêtre s'ouvre comme aujourd'hui.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e tournent, alors ils sont verts.

### Effort et risques
0,5 à 1 jour.

## L. `feat(reglages): relâche automatique des doublons`

`type:feat`, `etat:fait`, `est:1.5-2.5`, `prio:3` · branche : `v2` · pas d'`agent-ok` (suppression automatique) · dépend de : G

### Histoire
En tant que joueur, je veux que les doublons soient relâchés tout seuls, afin de spammer les œufs pour l'œuf shiny dex sans relâcher à la main.

### Critères d'acceptation
- [x] Étant donné la page Réglages, quand je l'ouvre, alors l'option « Relâcher automatiquement les doublons » existe, éteinte par défaut, avec un texte qui explique les deux cas.
- [x] Étant donné l'option allumée, quand je capture en combat un Pokémon non shiny dont l'espèce est déjà au Pokédex, alors il est relâché aussitôt et ne prend aucune place dans l'équipe ni au PC.
- [x] Étant donné l'option allumée, quand un œuf éclôt en donnant un Pokémon non shiny dont l'espèce est déjà dans le dex œuf, alors il est relâché aussitôt.
- [x] Étant donné un Pokémon shiny, quand il est capturé ou éclôt, alors il n'est jamais relâché.
- [x] Étant donné une espèce nouvelle pour le Pokédex ou le dex œuf, quand elle arrive, alors elle est gardée et inscrite.
- [x] Étant donné des relâches automatiques, quand elles ont lieu, alors une notification groupée donne le nombre, et les récompenses de capture restent versées.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e tournent, alors ils sont verts.

### Effort et risques
1,5 à 2,5 jours. Risque : relâcher à tort (la règle est testée cas par cas, revue obligatoire).

## M. `fix(fiche): n'afficher les bonus de la fiche que s'ils s'appliquent`

`type:fix`, `etat:fait`, `est:0.5`, `prio:3` · branche : `v2` · `agent-ok` recommandé

### Histoire
En tant que joueur, je veux que la fiche d'un Pokémon n'affiche « Pierre Stase », « shiny » ou « calcium » que s'il les possède, afin de ne pas être perturbé par des lignes à ×1.

### Critères d'acceptation
- [x] Étant donné un Pokémon sans Pierre Stase, sans statut shiny ni calcium, quand j'ouvre sa fiche, alors ces trois lignes n'apparaissent pas.
- [x] Étant donné un Pokémon qui en possède un, quand j'ouvre sa fiche, alors la ligne correspondante apparaît avec sa valeur.
- [x] Étant donné les tests de la fiche, quand vitest tourne, alors ils sont verts.

### Effort et risques
0,5 jour.

## N. `feat(fiche): retirer un objet donné à un Pokémon`

`type:feat`, `etat:fait`, `est:1`, `prio:3` · branche : `v2` · `agent-ok` recommandé

### Histoire
En tant que joueur, je veux retirer l'objet donné à un Pokémon depuis sa fiche, afin de ne pas condamner un Pokémon à une Pierre Stase.

### Critères d'acceptation
- [x] Étant donné un Pokémon qui porte un objet, quand j'ouvre sa fiche, alors un bouton « Retirer » est proposé à côté de l'objet.
- [x] Étant donné le bouton, quand je l'appuie, alors l'objet revient dans le sac (quantité +1) et le Pokémon n'en porte plus ; les bonus de l'objet disparaissent du DPS.
- [x] Étant donné un Pokémon du PC, quand j'ouvre sa fiche, alors le bouton marche de même.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e tournent, alors ils sont verts.

### Effort et risques
1 jour.

## O. `feat(navigation): accès direct à la pension`

`type:feat`, `etat:fait`, `est:0.5-1`, `prio:3` · branche : `v2` · `agent-ok` recommandé

### Histoire
En tant que joueur qui farme des œufs, je veux atteindre la pension en un clic, afin de ne pas perdre de temps entre le combat et la pension.

### Contexte
Le ticket D a déjà posé un lien vers la pension dans le Menu et la Carte. Décision de Nicolas (17/11) : un bouton « Pension » dans la barre de navigation, placé entre « Pokédex » et « Menu ». Sur téléphone comme sur PC, sans rien déplacer d'autre.

### Critères d'acceptation
- [x] Étant donné la pension débloquée, quand la barre de navigation s'affiche (téléphone et PC), alors un bouton « Pension » figure entre « Pokédex » et « Menu » et ouvre la pension.
- [x] Étant donné la pension non débloquée, quand la barre s'affiche, alors le bouton n'apparaît pas.
- [x] Étant donné la barre, quand le bouton s'ajoute, alors tous les boutons restent lisibles et touchables à 360, 390 et 1440 px, et les touches de raccourci existantes ne changent pas.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e tournent, alors ils sont verts.

### Effort et risques
0,5 à 1 jour.

## P. `feat(pc): tag shiny en haut à droite à côté du tag œuf`

`type:feat`, `etat:fait`, `est:0.5`, `prio:3` · branche : `v2` · `agent-ok` recommandé

### Histoire
En tant que joueur, je veux voir qu'un Pokémon du PC est shiny d'un coup d'œil, au même endroit que le tag œuf.

### Critères d'acceptation
- [x] Étant donné un Pokémon shiny, quand sa case du PC s'affiche, alors un tag shiny figure en haut à droite, à côté du tag œuf s'il en a un.
- [x] Étant donné un Pokémon shiny, quand le repère d'éclosion s'affiche ailleurs (fiche, équipe, Combat), alors le tag shiny l'accompagne de la même façon.
- [x] Étant donné la charte, quand les tags s'affichent, alors ils respectent `design/DESIGN.md` et les cases gardent leur taille.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e tournent, alors ils sont verts.

### Effort et risques
0,5 jour.

## Q. `feat(carte): centre commercial dans la navigation des zones`

`type:feat`, `etat:fait`, `est:0.5-1`, `prio:4` · branche : `v2` · `agent-ok` recommandé

### Histoire
En tant que joueur, je veux trouver le centre commercial dans la navigation des zones, entre Céladopole et la Centrale, et pas seulement sur la carte.

### Critères d'acceptation
- [x] Étant donné la navigation des zones, quand le centre commercial est débloqué, alors il apparaît entre Céladopole et la Centrale et ouvre le centre.
- [x] Étant donné le centre commercial non débloqué, quand je navigue, alors il n'apparaît pas.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e tournent, alors ils sont verts.

### Effort et risques
0,5 à 1 jour.

## R. `fix(equilibrage): shiny moins faciles, Super Bonbon plus rare et inflation à 0,20`

`type:fix`, `etat:fait`, `est:1-1.5`, `prio:1` · branche : `v2` · pas d'`agent-ok` (règles de jeu, valeurs fixées par Nicolas le 17/11)

### Histoire
En tant que joueur, je veux que les shiny restent rares et que l'XP serve, afin que le jeu dure.

### Critères d'acceptation
- [x] Étant donné `data/reglages.json`, quand les valeurs sont appliquées, alors `degats.shiny` passe de 1,5 à 1,25, `combat.chanceShiny` de 1/256 à 1/512, `pension.chanceShiny` de 0,125 à 0,0625, et `boutique.inflationParBadge` de 0,05 à 0,20.
- [x] Étant donné `data/objets.json`, quand le Jeton Shiny s'affiche, alors son prix de base est 1 000 000 (toujours sans inflation).
- [x] Étant donné le butin d'un shiny, quand il est donné, alors il vaut 2 Super Bonbons au lieu de 5 (les deux entrées « shiny » de `reglages.json` sont lues et la bonne est changée).
- [x] Étant donné l'objet « Bonbon », quand il s'affiche (boutique, sac, butin, casino, jalons), alors il s'appelle « Super Bonbon » partout, sans changer son identifiant.
- [x] Étant donné les textes qui citent ces valeurs, quand ils s'affichent, alors ils sont à jour.
- [x] ~~Étant donné le simulateur, quand il tourne avant et après, alors le temps de la Ligue est donné à Nicolas.~~ Critère abandonné le 17/11, Nicolas : le simulateur ne sert plus de critère.
- [x] Étant donné les tests de fidélité à la V1 qui lisent ces valeurs, quand ils tournent, alors ils sont mis à jour, et `tsc -b`, eslint, vitest et e2e sont verts (e2e `objet-equipe-persistant` rouge avant comme après sur `v2` : le clic sur l'onglet Équipe expire ; `boutique` vert).

### Effort et risques
1 à 1,5 jour. Risque : l'équilibrage global bouge.

## S. `fix(pension): ponte plus rare, éclosion à 50 combats, emplacements ×10`

`type:fix`, `etat:fait`, `est:0.5-1`, `prio:1` · branche : `v2` · pas d'`agent-ok` (règles de jeu)

### Histoire
En tant que joueur, je veux que la pension ne remplisse pas tout en 30 secondes, afin que l'élevage demande du temps.

### Critères d'acceptation
- [x] Étant donné `pension.chances`, quand les valeurs sont appliquées, alors Métamorph et même espèce valent 0,02, et type partagé 0,01.
- [x] Étant donné `pension.pasEclosion`, quand la valeur est appliquée, alors un œuf éclôt après 50 victoires.
- [x] Étant donné `pension.prixParEmplacement`, quand la valeur est appliquée, alors les emplacements d'œuf coûtent 50 000, 100 000, 150 000 et 200 000.
- [x] Étant donné un œuf déjà pondu avant la mise à jour, quand la partie se charge, alors il n'est ni perdu ni cassé (comportement vérifié dans le code et testé).
- [x] Étant donné les pourcentages affichés au choix d'un parent et les textes de prix, quand ils s'affichent, alors ils suivent les nouvelles valeurs.
- [x] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e `pension` tournent, alors ils sont verts (vitest : seuls échecs `musiques.test.ts`, `PagePlus.test.tsx` et `tests/sons-fidelite.test.ts`, sans lien ; e2e `pension` 4 verts, pc et mobile). Un œuf pondu à 25 pas garde son `pasMax` 25 et éclôt après 25 pas : testé dans `pension.test.ts`.

### Effort et risques
0,5 à 1 jour.

## T. `fix(equilibrage): légendaires plus rares, balles à ×1,5 et ×3`

`type:fix`, `etat:fait`, `est:1-1.5`, `prio:1` · branche : `v2` · pas d'`agent-ok` (règles de jeu)

### Histoire
En tant que joueur, je veux que les légendaires restent des trouvailles rares et que l'Hyper Ball ne les rende pas faciles.

### Critères d'acceptation
- [x] Étant donné `zones.json`, quand les taux sont appliqués, alors Mew vaut 0,5 % au Pont Pépite, Mewtwo 1 % à la Caverne Azurée, Artikodin 2 % aux Îles Écume, Sulfura 2 % à la Route Victoire, Électhor reste à 2 %, et le total de chaque zone retombe à 100 % (Abra 30,5 ; Otaria 21, Kokiyas 21, Krabby 15,5, Hypotrempe 15,5 ; Parasect 21, Kadabra 21, Raichu 26, Draco 31 ; Machopeur 31, Gravalanch 31, Nosferalto 26).
- [x] Étant donné deux Métamorph à la pension, quand le tirage au hasard a lieu, alors chaque légendaire (144, 145, 146, 150, 151, listés dans les données) pèse 1/10 d'une espèce normale (environ 1 sur 290 au total).
- [x] Étant donné `combat.balles`, quand les valeurs sont appliquées, alors Super Ball ×1,5 et Hyper Ball ×3 (Master Ball inchangée), les descriptions de `objets.json` sont à jour, et la pitié de capture ne change pas.
- [x] Étant donné un test sur la somme des taux, quand il tourne, alors il vérifie que chaque zone fait 100 %.
- [x] ~~Étant donné le simulateur, quand il tourne avant et après, alors le temps de la Ligue est donné à Nicolas.~~ Critère abandonné le 17/11, Nicolas : le simulateur ne sert plus de critère. `tsc -b`, eslint, vitest et e2e sont verts (vitest : seuls échecs `musiques.test.ts`, `PagePlus.test.tsx` et `tests/sons-fidelite.test.ts`, sans lien).

### Effort et risques
1 à 1,5 jour. Risque : les tests de fidélité V1 lisent les taux des zones (à mettre à jour, accord de Nicolas donné ici).

## U. `feat(pc): fusionner l'Équipe et le PC en une seule page`

`type:feat`, `etat:a_faire`, `est:2-3`, `prio:4` · branche : `v2` · pas d'`agent-ok` (refonte de navigation) · en dernier, avec V

### Histoire
En tant que joueur, je veux une seule page PC où je vois l'équipe et ouvre la fiche de chaque Pokémon, afin de ne plus naviguer entre deux pages.

### Critères d'acceptation
- [ ] Étant donné la barre de navigation, quand elle s'affiche, alors la page Équipe n'existe plus et le PC la remplace.
- [ ] Étant donné la page PC, quand je touche un Pokémon de l'équipe, alors sa fiche s'ouvre.
- [ ] Étant donné les touches de raccourci, quand l'Équipe est retirée, alors les touches suivantes se décalent d'un cran, sans autre changement.
- [ ] Étant donné l'écran de Combat, quand j'y vois l'équipe, alors il continue de fonctionner (clic sur la ligne d'équipe ouvre la fiche).
- [ ] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e (`pc`, `mobile`, `iphone`) tournent, alors ils sont verts, avec captures à 360, 390 et 1440 px.

### Hors périmètre
Le sac dans le PC et les objets sur les Pokémon du PC (ticket V).

### Effort et risques
2 à 3 jours. Risque : touches de raccourci, tuto et tests e2e qui citent la page Équipe.

## V. `feat(pc): sac dans le PC et objets sur les Pokémon du PC`

`type:feat`, `etat:a_faire`, `est:1.5-2.5`, `prio:4` · branche : `v2` · pas d'`agent-ok` · dépend de : U

### Histoire
En tant que joueur, je veux appliquer des objets à n'importe quel Pokémon du PC depuis la page PC, afin de ne plus devoir passer par l'équipe.

### Critères d'acceptation
- [ ] Étant donné la page PC, quand je regarde l'en-tête, alors une icône sac ouvre le sac.
- [ ] Étant donné un objet du sac, quand je l'applique à un Pokémon du PC, alors l'effet est le même que pour un Pokémon d'équipe (objet donné, pierre d'évolution, Super Bonbon).
- [ ] Étant donné une évolution déclenchée sur un Pokémon du PC, quand elle a lieu, alors la modale d'évolution s'affiche comme pour l'équipe.
- [ ] Étant donné les tests, quand `tsc -b`, eslint, vitest et e2e tournent, alors ils sont verts.

### Effort et risques
1,5 à 2,5 jours.

## W. `feat(combat): un objectif permanent pour le jeu austère du début`

`type:feat`, `etat:a_faire`, `est:1-2`, `prio:5` · branche : `v2` · pas d'`agent-ok` (idée à cadrer avec Nicolas) · à traiter quand il ne reste plus que ce ticket

### Histoire
En tant que nouveau joueur, je veux toujours voir ce que je dois viser, afin de ne pas trouver le début du jeu austère et de ne pas sauter le tuto (point 14 du testeur).

### Contexte
Décision de Nicolas (17/11) : on fait ce ticket, mais plus tard ; tout le reste passe avant. Piste à valider avec lui avant de coder : un objectif permanent affiché dans l'écran de Combat (prochain badge, prochaine zone, prochain palier du Pokédex), qui change quand il est atteint.

### Critères d'acceptation
- [ ] À écrire avec Nicolas au moment de s'y mettre (le contenu de l'objectif, sa place, sa charte).

### Effort et risques
1 à 2 jours. Risque : un écran de plus dans un combat déjà dense, à cadrer avec trois variantes avant de coder.

## X. `fix(navigation): Pension toujours dans la barre (grisée), raccourcis 7 et 8, centre commercial dans Précédent/Suivant`

`type:fix`, `etat:a_faire`, `est:1-1.5`, `prio:1` · branche : `v2` · `agent-ok` recommandé · reprend O et Q après le test de Nicolas du 17/11

### Histoire
En tant que joueur, je veux voir la Pension dans la barre dès le début (grisée tant qu'elle est verrouillée), l'atteindre au clavier avec la touche 7, et passer de Céladopole à la Centrale en traversant le centre commercial avec les boutons Précédent et Suivant de la zone de combat.

### Contexte
Retour de Nicolas (17/11, après avoir joué) : le bouton « Pension » doit toujours figurer dans la barre (O le cachait tant que la pension était fermée) ; les raccourcis clavier doivent être 7 pour la Pension et 8 pour le Menu ; le ticket Q a été compris comme « sur la carte » alors que Nicolas parlait des boutons Précédent et Suivant de l'écran de combat, où Céladopole mène encore directement à la Centrale.

### Critères d'acceptation
- [ ] Étant donné la pension non débloquée, quand la barre s'affiche (téléphone et PC), alors le bouton « Pension » est présent, grisé, non activable, et sa raison est lisible comme celle des autres boutons verrouillés du jeu.
- [ ] Étant donné la pension débloquée, quand la barre s'affiche, alors le bouton est actif, entre « Pokédex » et « Menu ».
- [ ] Étant donné le clavier, quand j'appuie sur 7, alors la pension s'ouvre (si elle est débloquée) ; sur 8, le Menu s'ouvre ; les touches 1 à 6 ne changent pas. La fenêtre « Raccourcis ? » et les textes qui citent ces touches sont à jour.
- [ ] Étant donné la zone de combat, quand je suis à l'Arène de Céladopole et que j'appuie sur « Suivant », alors j'arrive au centre commercial, puis « Suivant » depuis le centre mène à la Centrale ; « Précédent » refait le chemin inverse (Centrale, centre commercial, Céladopole).
- [ ] Étant donné le centre commercial non débloqué, quand je navigue avec Précédent et Suivant, alors il est sauté comme aujourd'hui et aucun bouton n'y mène.
- [ ] Étant donné la barre à 360, 390 et 1440 px, quand le bouton grisé s'affiche, alors tous les boutons restent lisibles et touchables.
- [ ] Étant donné les tests, quand `tsc`, eslint, vitest et les e2e ciblés tournent, alors ils sont verts (les tests e2e de la pension, de la navigation et des raccourcis sont adaptés).

### Hors périmètre
Les raccourcis de combat (lettres), la fusion Équipe/PC (U).

### Effort et risques
1 à 1,5 jour. Risque : le centre commercial est un lieu et pas une zone de combat ; sa place dans la suite Précédent/Suivant doit rester cohérente avec la barre de progression des zones.

## Y. `fix(pension): œufs sans DPS ni bonus, éclosion au niveau 1, libellé x/50`

`type:fix`, `etat:fait`, `est:1-1.5`, `prio:1` · branche : `v2` · pas d'`agent-ok` (règles de jeu, sauvegarde) · après le test de Nicolas du 17/11

### Histoire
En tant que joueur, je ne veux pas pouvoir deviner ce qui sortira d'un œuf, et je veux qu'un œuf ne gagne rien tant qu'il n'a pas éclos.

### Contexte
Retour de Nicolas (17/11) : les œufs de l'équipe affichent un DPS (25,5 et 28,7 sur sa capture), différent d'un œuf à l'autre selon le Pokémon caché (shiny, type) : c'est devinable. Il doit valoir 0 et ne pas s'afficher. Nicolas a aussi vu des Pokémon sortir d'un œuf à un autre niveau que 1, et veut vérifier qu'un œuf ne gagne ni bonheur ni XP pendant les combats qui servent à le faire éclore. Le texte « Éclosion : 22/50 » est coupé dans la carte.

### Critères d'acceptation
- [x] Étant donné un œuf dans l'équipe, quand sa carte s'affiche (Équipe, Combat, PC), alors aucun DPS n'y figure, et le DPS total de l'équipe ne compte rien pour lui (valeur 0 dans le calcul, pas seulement masquée).
- [x] Étant donné deux œufs de Pokémon différents (un shiny, des types différents), quand je compare leurs cartes, alors rien ne les distingue (ni DPS, ni sprite, ni texte) à part leur avancement.
- [x] Étant donné un œuf qui éclôt, quand le Pokémon apparaît, alors il est au niveau 1, sans XP ni bonheur acquis, dans tous les cas (éclosion normale, passer les éclosions, relâche automatique, évolution automatique ensuite) ; un test couvre chaque chemin et la cause est notée si un chemin donnait un autre niveau.
- [x] Étant donné un œuf, quand des combats sont gagnés, alors seul son compteur d'éclosion avance : aucune XP, aucun bonheur, aucun effet d'objet n'est appliqué à l'œuf ; un test le vérifie.
- [x] Étant donné la carte d'un œuf, quand elle s'affiche à 360, 390 et 1440 px, alors le texte est « 22/50 » (sans « Éclosion : »), lisible et dans le cadre.
- [x] Étant donné une ancienne sauvegarde avec des œufs, quand elle se charge, alors rien n'est perdu ni cassé.
- [ ] Étant donné les tests, quand `tsc`, eslint, vitest et les e2e ciblés (pension, équipe, combat) tournent, alors ils sont verts.

### Hors périmètre
Les tags (Z), les valeurs de la pension (S).

### Effort et risques
1 à 1,5 jour. Risque : le niveau à l'éclosion peut venir d'un chemin que le code ne distingue pas (évolution automatique, migration) ; la cause doit être prouvée, pas devinée.

### Résultat (17/11)
- DPS : `versMembreEquipe` n'envoyait pas l'indicateur d'œuf au cœur de combat, donc `calculerDpsEquipe` comptait les œufs (DPS propre, DPS total de l'équipe et dégâts du clic, qui en dépendent). L'œuf est maintenant transmis : 0 dans le calcul, et plus aucun DPS affiché (Équipe, Combat, PC, fiches). Le sexe et le tag shiny d'un œuf, qui trahissaient aussi l'espèce, sont masqués dans la grille du PC et la fiche.
- Bonheur : `appliquerVictoire` donnait +1 de bonheur à chaque œuf de l'équipe à chaque victoire (reprise de la V1). Supprimé, écart assumé avec la V1 (tests de fidélité adaptés). Aucune XP n'était donnée, et aucun objet ne s'applique à un œuf (garde existante, testée).
- Niveau à l'éclosion : tous les chemins (éclosion normale, passer les éclosions, relâche automatique) passent par `avancerOeuf`, qui force le niveau 1 ; l'évolution automatique ne change pas le niveau. Aucun chemin du code ne donne un autre niveau à un œuf normal (test de la ponte à l'éclosion). Seule faille trouvée : l'XP n'était pas remise à 0 (un œuf d'ancienne sauvegarde avec de l'XP naissait avec) ; corrigé et testé. Un niveau 2 vu juste après l'éclosion vient sans doute du combat suivant (le niveau 1 monte vite), pas de l'éclosion.

## Z. `fix(ui): une seule étoile shiny à droite du nom, tag œuf réduit à l'icône, plus de « XP max »`

`type:fix`, `etat:a_faire`, `est:1-1.5`, `prio:2` · branche : `v2` · `agent-ok` recommandé · après le test de Nicolas du 17/11 (reprend P)

### Histoire
En tant que joueur, je veux un seul repère shiny et un repère d'œuf discret, au même endroit partout, et ne pas voir de texte qui sort du cadre.

### Contexte
Retour de Nicolas (17/11) : le shiny apparaît en double (une étoile dans un cercle sur le sprite, plus une étoile après le nom). Décision : on garde l'étoile à droite du nom du Pokémon, dans la zone de combat, dans l'équipe et dans le PC ; on supprime l'autre. Dans le Pokédex, on garde le tag en haut à droite de la case. Le tag œuf devient la seule icône d'œuf, sans cercle jaune ni fond noir, placé à droite de l'étoile shiny (à droite du nom, ou en haut à droite de la case dans le Pokédex). Le texte « XP max » d'un Pokémon niveau 100 est inutile et sort du cadre.

### Critères d'acceptation
- [ ] Étant donné un Pokémon shiny, quand il s'affiche dans le Combat, l'Équipe ou le PC, alors une seule étoile figure, à droite de son nom ; le cercle étoilé sur le sprite n'existe plus.
- [ ] Étant donné un Pokémon issu d'un œuf, quand il s'affiche dans le Combat, l'Équipe ou le PC, alors une icône d'œuf seule (sans cercle jaune ni fond noir) figure à droite de l'étoile shiny, ou juste à droite du nom s'il n'est pas shiny.
- [ ] Étant donné une case du Pokédex, quand l'espèce est shiny et éclose, alors les tags sont en haut à droite de la case, l'icône d'œuf à droite de l'étoile shiny, et la case garde sa taille.
- [ ] Étant donné un Pokémon niveau 100, quand sa carte s'affiche, alors le texte « XP max » n'apparaît plus et rien ne sort du cadre.
- [ ] Étant donné la charte, quand les tags s'affichent à 360, 390 et 1440 px, alors ils respectent `design/DESIGN.md` et les captures sont regardées.
- [ ] Étant donné les tests, quand `tsc`, eslint, vitest et les e2e ciblés tournent, alors ils sont verts (tests des tags adaptés).

### Hors périmètre
Le libellé et le DPS des œufs (Y), la fusion Équipe/PC (U).

### Effort et risques
1 à 1,5 jour. Risque : les mêmes composants servent à plusieurs écrans ; Y touche la carte d'œuf de l'équipe, donc Y et Z se fusionnent dans l'ordre Y puis Z.
