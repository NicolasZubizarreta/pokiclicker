# Casino : roulette, plus ou moins, carte à gratter (ticket C, cœur de jeu)

Cœur seulement, sans interface. Code : `src/core/jeux-casino.ts`. Valeurs : `data/casino-jeux.json`. Tests : `src/core/jeux-casino.test.ts`.

Convention commune, celle de `casino.ts` : chaque jeu est un coup atomique (débit de la mise, tirage, crédit du gain). `gain` est le nombre de jetons rendus au total, mise comprise. Aucun état à sauvegarder. Mise = entier ≥ 1 au plus égal au solde ; sinon `{ ok: false, raison: 'Mise invalide.' | 'Pas assez de jetons.' }` sans tirage d'aléa. Résultat : `{ ok: true, region, message, gain, … } | { ok: false, raison }`. La région passée n'est jamais modifiée.

## Roulette

37 cases (0 à 36), rouges et noirs d'une roulette européenne, 0 vert. Un seul tirage d'aléa par coup.

| Mise | Gain total | Rendement exact |
|---|---|---|
| Rouge ou noir | ×2 (le 0 perd) | 36/37 = 97,297 % |
| Pair ou impair | ×2 (le 0 perd) | 36/37 = 97,297 % |
| Numéro plein 0 à 36 | ×36 | 36/37 = 97,297 % |

Signature : `jouerRoulette(region, mise, pari, alea)` avec `pari` = `{ type: 'couleur', couleur: 'rouge' | 'noir' } | { type: 'parite', parite: 'pair' | 'impair' } | { type: 'numero', numero }`. Pari invalide (numéro hors 0–36, couleur « vert »…) : « Choix invalide. ». Résultat : `numero`, `couleur` (`'rouge' | 'noir' | 'vert'`), `gain`.
Pour l'interface : `couleurRoulette(numero)` (colorier les 37 cases), `multiplicateurRoulette(pari)` (0 si invalide), `pariGagnant(pari, numero)`, `tirerNumeroRoulette(alea)`.

## Plus ou moins

Une carte visible de rang 1 à 13 (as = 1, roi = 13), chaque rang à 1 chance sur 13. Le joueur choisit `'plus'` ou `'moins'` ; la nouvelle carte est tirée indépendamment ; l'égalité perd. Un seul tirage d'aléa dans `jouerPlusOuMoins`.

Gain total : `floor(mise × 0,96 × 13 / g)`, `g` = nombre de rangs gagnants (plus : 13 − carte ; moins : carte − 1), calculé en entiers (pas d'erreur de flottant). Un choix sans rang gagnant (plus sur un roi, moins sur un as) est refusé : « Choix invalide. ».

| Carte visible | Plus : g, multiplicateur | Moins : g, multiplicateur |
|---|---|---|
| As (1) | 12, ×1,04 | refusé |
| 2 | 11, ×1,135 | 1, ×12,48 |
| 3 | 10, ×1,248 | 2, ×6,24 |
| 4 | 9, ×1,387 | 3, ×4,16 |
| 5 | 8, ×1,56 | 4, ×3,12 |
| 6 | 7, ×1,783 | 5, ×2,496 |
| 7 | 6, ×2,08 | 6, ×2,08 |
| 8 | 5, ×2,496 | 7, ×1,783 |
| 9 | 4, ×3,12 | 8, ×1,56 |
| 10 | 3, ×4,16 | 9, ×1,387 |
| Valet (11) | 2, ×6,24 | 10, ×1,248 |
| Dame (12) | 1, ×12,48 | 11, ×1,135 |
| Roi (13) | refusé | 12, ×1,04 |

Rendement exact : `g/13 × floor(mise × 12,48 / g) / mise`, au plus 96 % (vérifié par test en entiers pour les 13 cartes, les 2 choix et les mises 1, 10, 100, 1000). Maximum atteint : 96,00 % (mise 100 ou 1000 quand la division tombe juste), 95,38 % à mise 10, 92,31 % à mise 1. L'arrondi vers le bas joue toujours pour la banque : à mise 1, un pari sur un rang à ×1,04 rend 1 jeton (mise rendue) quand il gagne, et le rendement tombe à 54 % au plus bas (7 rangs gagnants, ×1,78 arrondi à 1 jeton). Une mise de 1 jeton est donc le choix le moins avantageux ; l'interface peut le signaler.

Signatures :
- `tirerCarteVisible(alea)` : carte de départ (1 à 13). L'interface la garde en mémoire locale ; la mise n'est débitée qu'au choix.
- `jouerPlusOuMoins(region, mise, carteVisible, choix, alea)` → `carteVisible`, `nouvelleCarte`, `gain`.
- `multiplicateurPlusOuMoins(carteVisible, choix)` : multiplicateur exact (0,96 × 13 / g) à afficher avant de jouer, 0 si le choix est refusé.
- Aussi : `rangsGagnants`, `gainPlusOuMoins(mise, carte, choix)` (gain entier affichable pour la mise saisie), `nomCarte(rang)` (As, 2…10, Valet, Dame, Roi).

## Carte à gratter

La mise est le prix du ticket. 6 cases, chacune tire un symbole parmi 10 (poids sur 100). Le ticket gagne s'il y a au moins 3 cases identiques ; le gain est la meilleure combinaison (celle qui paie le plus), une seule série est payée. Six tirages d'aléa dans l'ordre des cases.

| Symbole | Poids | 3 identiques | 4 | 5 | 6 |
|---|---|---|---|---|---|
| 7 (Master Ball) | 1 | ×200 | ×400 | ×800 | ×5000 |
| Pikachu | 3 | ×40 | ×80 | ×200 | ×800 |
| Ronflex | 5 | ×20 | ×40 | ×100 | ×400 |
| Staross | 7 | ×12 | ×25 | ×60 | ×250 |
| Évoli | 9 | ×8 | ×16 | ×40 | ×150 |
| Baie | 11 | ×5 | ×10 | ×25 | ×100 |
| Roucool | 13 | ×3 | ×6 | ×15 | ×60 |
| Rattata | 15 | ×2 | ×4 | ×10 | ×40 |
| Nosferapti | 17 | ×2 | ×4 | ×9 | ×35 |
| Magicarpe | 19 | ×2 | ×3 | ×6 | ×20 |

Ids et images de la machine à sous repris (7, Pikachu, Staross, Baie, Magicarpe) ; ajoutés : Ronflex (`pokemon/143`), Évoli (`pokemon/133`), Roucool (`pokemon/16`), Rattata (`pokemon/19`), Nosferapti (`pokemon/41`). Les 5 symboles de la machine ne suffisaient pas : avec 5 symboles, 55 à 70 % des tickets contiennent 3 identiques, bien au-dessus des 15–30 % demandés.

Résultats exacts (loi multinomiale, entiers ; recoupés par énumération des 10^6 tickets dans les tests) :
- rendement : **92,03 %** (numérateur/dénominateur exacts via `analyserGratter()`) ;
- tickets gagnants : **27,02 %** ;
- gros lot : 6 × « 7 » = ×5000 (probabilité 1 sur 10^12 par ticket) ; 3 × « 7 » = ×200.

Signature : `gratter(region, mise, alea)` → `symboles` (6 ids dans l'ordre des cases), `combinaison` (`{ symbole, nombre, multiplicateur } | null`), `gain`. Pour l'interface : `tirerSymboleGratter`, `combinaisonGratter(symboles)`, `gainGratter(symboles, mise)`, `gainsSymboleGratter(id)` (table à afficher), `analyserGratter()`. Les noms et images sont dans `data/casino-jeux.json` (`gratter.symboles`, `image` au même format que `data/casino.json`).

## Tests

- chaque règle avec des aléas imposés, refus sans tirage d'aléa, entrée jamais modifiée ;
- conservation des jetons sur 10 000 coups par jeu (finaux = départ − mises + gains) ;
- rendements exacts : roulette (37 numéros × tous les paris), plus ou moins (entiers), gratter (multinomial et énumération) ;
- 200 000 coups à graine fixée par jeu, rendement mesuré sous 100 %.

## Reste à faire pour l'interface (non fait ici)

- Actions du store (`src/ui/store-casino.ts`) : `jouerRoulette`, `tirerCarteVisible` puis `jouerPlusOuMoins`, `gratter`, avec `alea` = `Math.random`, comme les jeux existants ; mêmes messages et même toast.
- Page casino : trois nouveaux onglets/entrées à placer selon la maquette choisie par Nicolas (roulette : grille des 37 cases ou tapis simplifié + choix du pari ; plus ou moins : carte visible, deux boutons avec le multiplicateur de `multiplicateurPlusOuMoins`, bouton masqué ou grisé quand le choix est refusé ; gratter : 6 cases à gratter, révélation case par case en suivant l'ordre de `symboles`).
- Plus ou moins : la carte visible est gardée en état local de l'interface (pas dans la sauvegarde) ; si le joueur quitte la page, il en retire une autre, sans perte de jetons.
- Animations : le résultat est connu dès le retour de la fonction ; l'interface décide du temps de révélation (roue, retournement de carte, grattage).
- Images : vérifier que `pokemon/143`, `133`, `16`, `19`, `41` se résolvent comme `pokemon/25` dans les symboles de la machine ; `objets/master-ball.png` et `objets/cheri-berry.png` existent déjà.
- Sauvegarde : rien à ajouter pour jouer. Question ouverte : compter le nombre de parties ou les gains par jeu (statistiques, succès) demanderait des champs dans la sauvegarde, à trancher avec Nicolas.
- Déblocage : le casino est ouvert par `accesCasino` ; savoir si chaque nouveau jeu a son propre déblocage relève de la session « visibilité du casino ».
- Écarts V1 : roulette, plus ou moins et gratter sont des ajouts V2 absents de la V1 ; aucune entrée à prévoir dans `tests/ecarts-v1.ts` tant qu'aucune règle V1 n'est modifiée.
