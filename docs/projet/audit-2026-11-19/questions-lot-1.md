# Questions du lot 1 (ticket A, cœur de jeu)

Ces éléments ne sont pas codés : ils changent une règle de jeu ou un comportement que les tests actuels décrivent comme voulu. Les 28 autres éléments du ticket A sont faits ou sans objet (voir `docs/projet/backlog-phase-audit.md`).

## À décider avant de coder

1. **B-core-21 : casino, Pokémon déjà possédé.** Le casino revend-il à l'infini un Pokémon déjà possédé (ex. Abra à 250 jetons) ? Options : (a) oui, voulu, on retire l'indicateur « possédé » ; (b) un seul achat par Pokémon ; (c) autre.
2. **B-core-05 et B-core-37 : un œuf peut-il être parent à la pension ?** Aujourd'hui `deposerParent` accepte un œuf et `couplePonte` le lit comme parent. Les tests de `pension.test.ts` décrivent ce comportement comme voulu, je l'ai laissé. Options : (a) voulu, rien à faire ; (b) refuser un œuf comme parent et l'ignorer dans `couplePonte`.
3. **B-core-36 : Jeton Shiny sur un œuf.** `utiliserJetonShiny` accepte un œuf, et `objets-equipe.test.ts` comme `dex.test.ts` l'affirment (l'œuf éclôt chromatique). Options : (a) voulu, rien à faire ; (b) refuser un œuf.
4. **B-core-11 : le temps hors ligne compte-t-il pour les boosts et la recharge du Fauchage ?** Ces durées reposent sur l'horloge système, donc reculer l'horloge les prolonge et l'avancer les raccourcit. Options : (a) durées décrémentées par le tick du jeu (le temps hors ligne ne compte pas) ; (b) garder l'horloge et ajouter une garde contre le recul. Dans les deux cas il faut toucher `src/ui/store.ts` et le format de sauvegarde, donc ce correctif est à faire avec le ticket C.
5. **Plafond de jeu pour l'argent et les jetons (S-core-02, B-core-16).** Seuls des plafonds techniques ont été codés (`Number.MAX_SAFE_INTEGER`). Faut-il un plafond de jeu (par exemple 999 999 999 Pokédollars et un maximum de jetons) ? Cela change la règle de jeu.

## À confirmer (déjà codé, réversible)

6. **B-core-10 : l'or est arrondi à l'entier inférieur.** 29 × 1,6 = 46,4 donne 46. Les anciennes sauvegardes à virgule sont arrondies au chargement (inférieur).
7. **B-core-35 : un favori n'est jamais relâché**, ni à la main, ni par le relâchement automatique.

## Pour les tickets suivants

- `src/ui` doit attraper `ErreurStockage` (stockage plein ou indisponible) et afficher son message : tickets C et D.
- `listerParties()` ne renvoie plus les parties illisibles ; l'écran des parties doit afficher `listerPartiesIllisibles()` et proposer l'export de secours (`exporterPartie`, `exporterCompte`). Sans cela une partie abîmée disparaît silencieusement de la liste.
- Le catalogue d'événements est injecté par le store ; la validation des sauvegardes ne juge donc que ce qui n'en dépend pas (S-core-12 en partie, S-core-31 sans objet car le moteur ignore déjà un état hors catalogue).
