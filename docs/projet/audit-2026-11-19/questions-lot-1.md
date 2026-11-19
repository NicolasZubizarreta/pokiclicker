# Questions du lot 1 (ticket A, cœur de jeu)

Décisions de Nicolas du 19/11/2026 sur les cinq points qui attendaient une réponse. Tout est appliqué dans `src/core`, sauf B-core-11 (lot 3).

## Décisions prises

1. **B-core-21 : casino, Pokémon déjà possédé.** Voulu : un Pokémon déjà possédé reste rachetable à l'infini. Fait : `objetsDuCasino` renvoie `possede: false` pour les Pokémon. L'indicateur n'apparaît pas dans `src/ui` (le champ n'y sert qu'aux objets uniques), rien à retirer pour le lot 4.
2. **B-core-05 et B-core-37 : un œuf ne peut pas être parent.** Fait : `deposerParent` refuse un œuf (« Un œuf ne peut pas être parent. ») et `couplePonte` ignore un œuf déjà présent (raison « incomplet »). Tests mis à jour.
3. **B-core-36 : Jeton Shiny refusé sur un œuf.** Fait : `utiliserJetonShiny` renvoie « Pokémon invalide ! ». Tests de `objets-equipe`, `dex` et `PagePC-objets` mis à jour : l'œuf n'éclôt plus chromatique par ce moyen.
4. **S-core-02 et B-core-16 : plafonds de jeu.** 999 999 999 Pokédollars et 999 999 jetons (`src/core/plafonds.ts`). Les gains (combat, capture, relâchement auto, jalons, machines, blackjack, roulette, plus ou moins, grattage, cadeau d'entrée) sont tronqués au plafond. Achat de jetons et échange de jetons contre de l'argent : refusés avec un message s'ils dépasseraient le plafond (le joueur ne paie pas pour des jetons perdus). Une sauvegarde chargée ou importée au-dessus est ramenée au plafond, sans rejet. `argentTotalGagne` n'est pas plafonné.
5. **B-core-11 : le temps hors ligne ne compte pas** pour les boosts ni la recharge du Fauchage : durées décrémentées par le tick du jeu. **Décidé, à faire avec le lot 3** (touche `src/ui/store.ts` et le format de sauvegarde). Non codé ici.

## Confirmés tels quels

- **B-core-10** : l'or est arrondi à l'entier inférieur (29 × 1,6 = 46,4 donne 46) ; les anciennes sauvegardes à virgule sont arrondies au chargement.
- **B-core-35** : un favori n'est jamais relâché, ni à la main, ni par le relâchement automatique.

## Pour les tickets suivants

- Les écrans doivent afficher le plafond atteint (argent à 999 999 999, jetons à 999 999) et les deux nouveaux messages de refus du casino (`plafondJetons`, `plafondArgent` dans `data/casino.json`) : lots 3 et 4.
- `src/ui` doit attraper `ErreurStockage` (stockage plein ou indisponible) et afficher son message : tickets C et D.
- `listerParties()` ne renvoie plus les parties illisibles ; l'écran des parties doit afficher `listerPartiesIllisibles()` et proposer l'export de secours (`exporterPartie`, `exporterCompte`). Sans cela une partie abîmée disparaît silencieusement de la liste.
- Le catalogue d'événements est injecté par le store ; la validation des sauvegardes ne juge donc que ce qui n'en dépend pas (S-core-12 en partie, S-core-31 sans objet car le moteur ignore déjà un état hors catalogue).
