# Audit d'interface, point de départ de la phase 5 (05/11/2026)

But : donner à Nicolas des repères pour choisir les maquettes, puisqu'il n'a pas d'idée arrêtée. Ce document a deux parties : ce que dit la recherche (peu, et de qualité inégale) et la grille avec laquelle on regardera chaque écran du jeu. Il se complète pendant l'audit (ticket B).

## 1. Ce que la recherche a donné

Recherche du 05/11 : une vingtaine de requêtes, neuf pages lues. Aucune analyse d'interface publiée n'existe pour Cookie Clicker mobile, Realm Grinder, Clicker Heroes ni PokéClicker. Les jeux de référence se jugent donc **en y jouant**, ce qu'on fera pendant l'audit. Les faits solides viennent surtout des guides des plateformes.

| Repère | Fait | Source | Fiabilité |
|---|---|---|---|
| Barre de navigation basse | 3 à 5 destinations d'importance égale | developer.android.com/develop/ui/compose/components/navigation-bar | bonne |
| Cible tactile | 48 × 48 dp au moins, 8 dp d'écart entre cibles (Apple : 44 × 44 pt, source secondaire) | support.google.com/accessibility/android/answer/7101858 | bonne (Apple : moyenne) |
| Menu caché | une navigation cachée est moins découverte qu'une navigation visible | nngroup.com/articles/hamburger-menus | bonne |
| Pokémon GO | actions dans la moitié basse de l'écran ; critique du menu principal caché derrière une petite icône ; pas d'indication claire « déjà capturé / nouveau » | gamesbeat.com/?p=135805, ixd.prattsi.org/2026/09/design-critique-pokemon-go | moyenne |
| Idle Miner Tycoon | toute la boucle visible sur un seul écran ; prototype simple, rétention J1 de 63 à 81 % annoncée par l'éditeur | gameanalytics.com/blog/making-a-hit-idle-game-eight-lessons-from-kolibri-games | moyenne |
| Egg, Inc. | pas de menus traditionnels : l'écran principal est la ferme (fiche App Store, note 4,8) | apps.apple.com/us/app/egg-inc/id993492744 | faible pour l'interface |
| Sauvegardes multiples | une sauvegarde porte un nom, une description, l'heure, le temps de jeu ; en cas de conflit l'utilisateur décide, on montre les deux versions | developer.android.com/games/pgs/savedgames | bonne |
| Surcharge | introduire les systèmes par paliers ; retirer les boutons peu utiles (retours de développeurs, sources faibles) | blogs de développeurs | faible |

## 2. Cinq principes retenus, à discuter avec Nicolas

1. **Un écran principal qui est le jeu** : le combat, les gains et la prochaine amélioration visibles ensemble, les menus au second plan.
2. **Navigation visible en bas, 5 entrées au plus, avec texte.** Aujourd'hui il y en a 6 (Combat, Équipe, PC, Shop, Carte, Plus) : c'est un écart à examiner.
3. **Cibles de 48 dp au moins**, actions principales dans la moitié basse (usage au pouce).
4. **Dévoiler les systèmes au fil de la progression** (PC, casino, succès grisés ou cachés au début), sans retirer ce que la V1 offrait.
5. **Compte et parties** : une carte par partie (nom, temps de jeu, dernière sauvegarde, avancée), les deux versions côte à côte en cas de conflit, indicateur de synchro visible.

Point où la recherche **contredit une décision de Nicolas** : les guides recommandent de ne pas obliger à se connecter ; Nicolas a décidé le 04/11 que le compte est obligatoire. La décision reste, mais l'écran de connexion devra être très court et clair (ticket E).

## 3. Grille d'audit d'un écran

Chaque écran est regardé à 390 px et à 1440 px, avec une note de 0 à 2 par ligne (0 = à refaire, 1 = passable, 2 = bon) et un commentaire d'une phrase.

1. **But** : en trois secondes, qu'est-ce qu'on fait ici ?
2. **Hiérarchie** : l'élément principal est-il le plus gros et le plus contrasté ?
3. **Pouce** : les actions courantes sont-elles dans la moitié basse, à 48 dp et 8 dp d'écart ?
4. **Lisibilité** : taille du texte (16 px au moins pour le corps sur téléphone), contraste, nombres longs.
5. **Densité** : chaque bouton sert-il ? Que supprimer ?
6. **Navigation** : sait-on où on est et comment revenir ?
7. **Retour d'information** : un clic, un gain, une erreur, une synchro produisent-ils un signe visible ?
8. **Cohérence** : mêmes composants, mêmes espacements, mêmes jetons (`design/DESIGN.md`).
9. **Charte** : aucune valeur inventée, aucun interdit de la marque.
10. **Version PC** : l'écran profite-t-il de la largeur sans étirer le mobile ?

## 4. Inventaire des écrans (35)

Source : relevé du code (`src/ui/`). Navigation permanente : barre fixe en bas sur mobile, colonne à gauche en `lg` (`Navigation.tsx`, `Coquille.tsx`).

| Groupe | Écrans (fichier) |
|---|---|
| Compte et parties (à refaire) | connexion, inscription, mot de passe oublié, nouveau mot de passe (`compte/EcranCompte.tsx`) ; mes parties (`EcranParties.tsx`) ; choix de version (`EcranChoixVersion.tsx`) ; partie ouverte ailleurs (`EcranAutreAppareil.tsx`) ; mon compte, diamants, succès, skins (`EcranMonCompte.tsx`) |
| Combat (écran principal) | `EcranCombat.tsx` (302 lignes), scènes du bourg et de Ronflex, dialogues de Chen, sac en combat, radar |
| Introduction | `PageIntro.tsx`, `EcranTitre.tsx`, `ChoixStarter.tsx`, `DialogueIntro.tsx` |
| Équipe, PC, Sac | `PageEquipe.tsx` (281), `PagePC.tsx` (173), `Sac.tsx`, `FichePokemon.tsx` (227), `MenuPokemon.tsx` |
| Shop | `PageShop.tsx` |
| Carte et bâtiments | `CarteKanto.tsx` (266), `PageCentre.tsx` (centre commercial), `PageCasino.tsx`, `PagePension.tsx` |
| Plus | `PagePlus.tsx` (menu, réglages), `Pokedex.tsx`, `BoiteBadges.tsx`, `Guide.tsx`, `Statistiques.tsx`, `Diplome.tsx` |
| Fin de jeu | `SceneFin.tsx`, `Pantheon.tsx`, `Credits.tsx` |

## 5. Méthode de travail avec Nicolas

Un écran à la fois, dans cet ordre : (1) captures de l'état actuel, (2) note sur la grille, (3) trois ou quatre variantes **navigables** (pas des captures), bâties sur de vraies bases de qualité, (4) Nicolas choisit ou mélange, (5) implémentation dans la vraie application, (6) captures 390 et 1440 px regardées avant de lui montrer. Une maquette validée est le critère d'un ticket d'implémentation ; aucun écran n'est refait sans cela.

## 6. Premier jet de l'audit, 8 écrans à 390 px (05/11, à corriger avec Nicolas)

Notes de Claude d'après les captures `design/audit/*-390.png`, donc **sur image fixe** : les lignes 7 (retour d'information) et 9 (charte) ne se jugent qu'en jouant ou avec `design/DESIGN.md` ouvert, elles sont laissées de côté. La ligne 10 (PC) n'est pas notée ici. Notes de 0 à 2 sur les lignes 1 à 6 et 8 de la grille, total sur 14.

| Écran | But | Hiér. | Pouce | Lisib. | Dens. | Nav. | Cohér. | Total | Constat principal |
|---|---|---|---|---|---|---|---|---|---|
| Combat | 2 | 1 | 1 | 1 | 0 | 1 | 1 | 7 | Tout est empilé : bandeau, étape, pièces, scène, DPS, 5 icônes sans texte, 6 portraits, dialogue de Chen. La barre du bas coupe le dialogue et ses boutons de zone. |
| Équipe | 2 | 1 | 1 | 2 | 0 | 2 | 1 | 9 | Six cartes identiques, le sac est collé dessous (1400 px de haut). Le crayon d'édition fait ~20 px. Le bandeau « PO débloqué » recouvre le titre. |
| PC | 1 | 0 | 1 | 2 | 1 | 2 | 1 | 8 | « Ton PC est vide » s'affiche juste sous une rangée de six portraits : on ne sait pas ce que la rangée représente. Tri et recherche prennent la moitié de l'écran. |
| Shop | 2 | 0 | 1 | 1 | 0 | 1 | 1 | 6 | 17 articles de même poids sur 5200 px. Les boutons − et + font ~28 px. Les onglets filtrent mais « Tout » montre tout par défaut. |
| Carte | 1 | 1 | 0 | 1 | 2 | 2 | 1 | 8 | La carte tient dans 190 px : les points à toucher font ~20 px, loin des 48. La barre de progression est d'un vert pur qui semble hors charte (à vérifier dans les jetons). |
| Plus | 1 | 1 | 2 | 2 | 1 | 1 | 1 | 9 | Fourre-tout (stats, Pokédex, badges, guide, diplôme, réglages). Le Pokédex apparaît deux fois (résumé et ligne). |
| Mes parties | 2 | 1 | 1 | 2 | 2 | 1 | 0 | 9 | Style différent du jeu (liens soulignés, titre encadré en doré). « Retour au jeu » et « Supprimer » sont de petits liens ; aucune trace de la synchro. |
| Connexion | 1 | 1 | 1 | 2 | 2 | 1 | 1 | 9 | Formulaire centré sans nom ni identité du jeu. « Créer un compte » et « Mot de passe oublié » sont de petits liens côte à côte. |

Défauts qui reviennent sur plusieurs écrans :
1. **Densité** : des pages longues où tout a le même poids (combat, équipe, shop). Gravité haute.
2. **Cibles tactiles trop petites** : crayon d'édition, − et +, points de la carte, liens de compte. Gravité haute sur téléphone.
3. **Bandeau « PO débloqué »** : il prend la place en haut de chaque écran et recouvre le titre de l'équipe (à confirmer en jeu : il peut venir de l'état de la capture).
4. **Compte et parties** : style à part et pas d'identité. Déjà prévu en refonte.
5. **Barre du bas** : elle coupe le contenu sur le combat et a 6 entrées.

Ordre proposé pour les tickets : C (navigation et écran principal) en premier, puis D (combat), E (compte), F (parties), G, H, I, J, K. Il suit l'ordre actuel du backlog ; à discuter avec Nicolas.

## 7. Jeux de référence, regardés par Claude (05/11)

Source : les captures des fiches App Store (Egg Inc, AdVenture Capitalist, Idle Miner Tycoon). Seul Egg Inc montre de vrais écrans de jeu ; les deux autres sont des visuels de pub, donc fiabilité faible pour les menus. Les images ne sont pas dans le dépôt (droits). Rien n'a été joué.

| Jeu | Ce qu'il fait mieux que PokiClicker | Fiabilité |
|---|---|---|
| Egg Inc | Trois chiffres clés fixes en haut (œufs, œufs par seconde, argent), en gros avec l'unité. Une action principale en gros bouton rouge tout en bas, quatre petites icônes rondes au-dessus. Pas de barre de navigation : l'écran est la ferme. Les menus s'ouvrent en fenêtre par-dessus le jeu (fond flou, croix pour fermer). Une ligne d'achat = icône, nom, effet, bouton avec le prix, environ 60 px de haut. | bonne (vrais écrans) |
| AdVenture Capitalist | Une ligne par commerce : barre de progression, bouton orange « acheter ×10 » avec le prix, durée du cycle. Colonne de boutons rapides à droite. Les gros chiffres en haut. | faible (pub) |
| Idle Miner Tycoon | Le bouton « New Shaft » n'apparaît que quand on peut s'en servir : la progression se dévoile à l'écran. | faible (pub) |

Ce que ça change pour PokiClicker :
1. **Chiffres clés** : pièces et DPS sont dispersés (sous le titre, dans le bandeau rouge). À regrouper en une barre fixe.
2. **Menus en fenêtre** plutôt qu'en pages longues : le shop fait 5200 px avec 17 cartes de ~170 px (stepper − +, bouton Acheter). Une ligne de 60 px avec le prix dans le bouton ferait le même travail.
3. **Barre du bas** : Egg n'en a pas. Si on la garde, 5 entrées avec texte au plus (PokiClicker : 6).
4. **Apparition progressive** des boutons (PC, casino, succès) : déjà prévu dans les principes.

Reste à faire pour clore B : les corrections de Nicolas sur le tableau de la section 6, sa liste de détails PC (ticket I), la validation de l'ordre des tickets.
