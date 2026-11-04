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
