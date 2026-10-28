# Équilibrage de Kanto, 28/10/2026 (ticket AB)

Rapport du simulateur `scripts/simuler-parcours.mjs`. Les chiffres ci-dessous viennent de lui, pas d'un calcul à la main. Nicolas relit à son retour : tout ce qui est appliqué est dans les données et se défait en changeant une valeur.

## Ce qui est appliqué

| Décision de Nicolas | Où | Effet |
|---|---|---|
| Argent ×2 sur tous les gains (ennemi, boss, chromatique) | `data/reglages.json`, `recompenses.or.multiplicateur` = 2, appliqué une seule fois à la fin de `calculerOr` | un ennemi rapporte le double de la V1 |
| Capture | `recompenses.or.capture` = 2 (règle de la V1, la capture rapporte le double d'une victoire), puis le ×2 global | la capture vaut 4 fois l'or de base de la V1, pas 8 : le ×2 global n'est pas compté deux fois |
| Centrale et suivantes : 20 % de PV en moins | `multiplicateurPv` de 10 zones (Centrale à Ligue) multiplié par 0,8 dans `data/regions/kanto/zones.json`, produit par `scripts/extraire-zones-v1.mjs` | les dégâts ne changent pas ; la Ligue est incluse |
| Zones 1 et 2 | rien | Nicolas les teste lui-même, voir plus bas |
| Pierres et Calcium | rien | prix déjà à 8 000 (inflation par badge gardée) et 20 000 (ticket AA) |

Une sauvegarde existante garde son argent et ses niveaux : seules les récompenses futures et les PV des ennemis changent, rien n'est écrit dans la sauvegarde au chargement (test `tests/equilibrage-ab.test.ts`).

## Comment le simulateur joue

Il charge `src/core` sans DOM et fait tourner `creerBoucle` (`src/core/loop.ts`) avec une horloge simulée au pas de 100 ms. Les victoires, captures, badges, paliers du Pokédex, achats, boosters et évolutions passent par les fonctions du jeu. Il ne recopie aucune formule.

Ce qu'il invente est la politique du joueur, et c'est sa limite :
- équipe : le starter (Bulbizarre, graine 1) puis les six meilleurs DPS parmi l'équipe et le PC, recalculés à chaque capture ou évolution ;
- capture : jusqu'à trois lancers par ennemi dès son apparition, pour toute espèce pas encore prise ;
- achats : balles, puis la moins chère des améliorations utiles (Chaussures, Pièce Rune, Protéine, Multi Exp, Pierre Dure, Bicyclette, Œuf Chance, Restes), puis Attaque + et Attaque Spé + après un boss raté ;
- pas de Pension, de pierres, de Casino, de Fauchage, de Poké-Radar ni d'événements, et jamais de retour dans une zone précédente ;
- un boss raté se rejoue après l'étape 9, comme dans le jeu.

Deux réglages du Pokédex : `reel` compte ce que le simulateur capture vraiment (3 à 68 espèces, il en rate beaucoup) ; `theorique` compte toutes les espèces rencontrables dans les zones visitées, avec leurs évolutions par niveau (136 sur 151). Le second est une borne haute, celle d'un joueur qui complète son Pokédex. Les tableaux ci-dessous sont en `theorique`, à 7 clics/s.

Commandes :
```
node scripts/simuler-parcours.mjs --clics 7 --pokedex theorique
node scripts/simuler-parcours.mjs --comparer --pokedex theorique
node scripts/simuler-parcours.mjs --sans-bonus centrale --pokedex theorique
node scripts/simuler-parcours.mjs --debut
node scripts/simuler-parcours.mjs --frequences 10000
```

## Tableau par zone (valeurs actuelles, critère 1)

| Zone | Temps (min) | dont après un échec | Niveau moyen au boss | Argent gagné | Argent dépensé | Espèces (Pokédex) | Marge 1er essai | Boss |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| Route 1 | 0,6 | 0,0 | 6,0 | 1 600 | 0 | 10 | 0,22 | victoire au 1er essai |
| Forêt de Jade | 0,6 | 0,0 | 8,3 | 4 822 | 5 000 | 20 | 0,44 | victoire au 1er essai |
| Arène d'Argenta | 0,5 | 0,0 | 10,6 | 4 558 | 4 000 | 33 | 0,21 | victoire au 1er essai |
| Mont Sélénite | 0,7 | 0,0 | 13,5 | 4 764 | 2 520 | 42 | 0,48 | victoire au 1er essai |
| Arène d'Azuria | 1,0 | 0,0 | 16,3 | 7 574 | 6 520 | 54 | 0,83 | victoire au 1er essai |
| Pont Pépite | 4,8 | 3,6 | 19,2 | 11 918 | 12 100 | 62 | 1,04 | victoire à l’essai 7 |
| Arène de Carmin | 19,0 | 17,5 | 22,0 | 27 482 | 26 100 | 69 | 1,19 | victoire à l’essai 29 |
| Cave Taupiqueur | 0,8 | 0,0 | 26,7 | 11 972 | 2 928 | 73 | 0,60 | victoire au 1er essai |
| Tunnel Rocheux | 1,0 | 0,0 | 28,3 | 15 710 | 11 730 | 78 | 0,74 | victoire au 1er essai |
| Tour Pokémon | 13,2 | 11,9 | 30,2 | 36 648 | 25 653 | 83 | 1,27 | victoire à l’essai 21 |
| Arène de Céladopole | 14,4 | 13,1 | 33,8 | 42 910 | 62 156 | 87 | 1,26 | victoire à l’essai 23 |
| Centrale | 1,5 | 0,5 | 37,0 | 23 876 | 14 994 | 90 | 1,01 | victoire à l’essai 2 |
| Arène de Parmanie | 0,9 | 0,0 | 38,0 | 32 572 | 14 688 | 102 | 0,75 | victoire au 1er essai |
| Sylphe SARL | 1,0 | 0,0 | 39,5 | 28 804 | 15 300 | 111 | 0,77 | victoire au 1er essai |
| Arène de Safrania | 1,0 | 0,0 | 41,3 | 38 696 | 15 300 | 115 | 0,68 | victoire au 1er essai |
| Îles Écume | 1,5 | 0,4 | 43,3 | 35 896 | 91 043 | 123 | 1,07 | victoire à l’essai 2 |
| Arène de Cramois'Île | 1,1 | 0,0 | 46,3 | 57 106 | 7 956 | 131 | 0,87 | victoire au 1er essai |
| Arène de Jadielle | 0,7 | 0,0 | 49,2 | 33 882 | 8 262 | 133 | 0,32 | victoire au 1er essai |
| Caverne Azurée | 1,6 | 0,4 | 52,0 | 55 328 | 55 097 | 135 | 1,05 | victoire à l’essai 2 |
| Route Victoire | 0,8 | 0,0 | 58,0 | 69 158 | 136 068 | 136 | 0,81 | victoire au 1er essai |
| Ligue Pokémon | 4,0 | 1,1 | 59,0 | 286 040 | 83 300 | 136 | 0,89 | victoire |

Ligue gagnée en 70,8 min de jeu, 831 316 gagnés, 600 715 dépensés, 8 badges, Pokédex 136/151.

La marge est « PV du boss ÷ dégâts cumulés en 30 s » avec 7 clics/s : en dessous de 1, le boss tombe au premier essai ; au-dessus de 1, il faut plusieurs essais.

Autres lancers, pour situer la dispersion (mêmes données) :

| Lancer | Résultat |
|---|---|
| Pokédex `theorique`, 0 clic | Ligue gagnée en 167,5 min ; blocages à Carmin (42 essais), Tour Pokémon (76), Centrale (27), Îles Écume (99) |
| Pokédex `reel`, 7 clics | bloqué à la Ligue après 337 min (marge 1,04) avec 68 espèces ; Îles Écume en 66 essais |
| Avec les valeurs de la V1 (`--comparer`, partie « avant ») | bloqué à la Ligue après 317 min ; Tour Pokémon en 113 essais, Cramois'Île en 102 |

Le simulateur n'est pas un joueur : il bloque plus longtemps qu'un humain sur les zones où il faut revenir acheter ou attendre un Pokémon précis, et il ne joue jamais ses clics au bon moment. Les temps absolus ne se lisent pas comme une durée de partie réelle. Les écarts entre les lancers servent à comparer deux jeux de données, pas à prédire une durée.

## Marges avant et après (critère 3)

« Avant » = PV de la V1 (fixture extraite du vrai code V1) et argent ×1 ; « après » = valeurs actuelles. Les deux lancers font acheter des choses différentes (l'argent double), donc leurs équipes diffèrent et la colonne « variation des deux parties » mélange deux effets. La colonne qui mesure le changement de PV seul est la dernière : on prend l'équipe du lancer « après » et on la confronte aux PV d'avant.

| Zone | PV du boss avant | PV du boss après | Marge avant | Marge après | Variation des deux parties | Marge de l'équipe « après » avec les PV d'avant | Variation à équipe égale |
|---|---:|---:|---:|---:|---:|---:|---:|
| Route 1 | 1 824 | 1 824 | 0,22 | 0,22 | +0 % | 0,22 | +0 % |
| Forêt de Jade | 7 200 | 7 200 | 0,44 | 0,44 | +0 % | 0,44 | +0 % |
| Arène d'Argenta | 19 712 | 19 712 | 0,31 | 0,21 | -33 % | 0,21 | +0 % |
| Mont Sélénite | 40 320 | 40 320 | 0,48 | 0,48 | +1 % | 0,48 | +0 % |
| Arène d'Azuria | 82 656 | 82 656 | 0,66 | 0,83 | +25 % | 0,83 | +0 % |
| Pont Pépite | 155 848 | 155 848 | 1,07 | 1,04 | -3 % | 1,04 | +0 % |
| Arène de Carmin | 190 944 | 190 944 | 1,08 | 1,19 | +11 % | 1,19 | +0 % |
| Cave Taupiqueur | 211 584 | 211 584 | 0,65 | 0,60 | -8 % | 0,60 | +0 % |
| Tunnel Rocheux | 449 328 | 449 328 | 1,01 | 0,74 | -27 % | 0,74 | +0 % |
| Tour Pokémon | 453 600 | 453 600 | 1,70 | 1,27 | -26 % | 1,27 | +0 % |
| Arène de Céladopole | 637 884 | 637 884 | 0,87 | 1,26 | +46 % | 1,26 | +0 % |
| Centrale | 889 200 | 711 360 | 1,00 | 1,01 | +0 % | 1,26 | -20 % |
| Arène de Parmanie | 851 580 | 681 264 | 1,00 | 0,75 | -25 % | 0,94 | -20 % |
| Sylphe SARL | 850 888 | 680 708 | 0,83 | 0,77 | -8 % | 0,96 | -20 % |
| Arène de Safrania | 836 160 | 668 928 | 0,97 | 0,68 | -30 % | 0,85 | -20 % |
| Îles Écume | 1 512 000 | 1 209 600 | 0,94 | 1,07 | +14 % | 1,34 | -20 % |
| Arène de Cramois'Île | 1 496 880 | 1 197 504 | 1,33 | 0,87 | -35 % | 1,09 | -20 % |
| Arène de Jadielle | 1 731 840 | 1 385 468 | 0,53 | 0,32 | -40 % | 0,39 | -20 % |
| Caverne Azurée | 2 314 200 | 1 851 356 | 1,15 | 1,05 | -9 % | 1,31 | -20 % |
| Route Victoire | 2 796 800 | 2 237 440 | 0,90 | 0,81 | -11 % | 1,01 | -20 % |
| Ligue Pokémon | 2 928 624 | 2 342 896 | 0,84 | 0,89 | +6 % | 1,11 | -20 % |

À équipe égale, la marge baisse de 20 % exactement dans les dix zones de la Centrale à la Ligue et ne bouge pas avant. C'est mécanique (PV × 0,8, mêmes dégâts), donc le critère 3 tient pour ce qui dépend des données. Ce que le simulateur ne dit pas honnêtement, c'est l'effet sur un vrai joueur : les variations « des deux parties » vont de -40 % à +14 % parce que l'équipe change d'un lancer à l'autre.

La Ligue (Maître Blue et ses huit adversaires) est dans les 20 %.

## Sans les bonus (critère 4)

`--sans-bonus` seul retire tout dès le départ : le simulateur reste alors bloqué à Azuria puis Carmin, très avant la Centrale, ce qui ne prouve rien sur la Centrale. La mesure du ticket est `--sans-bonus centrale` : le joueur joue normalement jusqu'à la Centrale, puis perd ses améliorations, ses paliers de Pokédex et ses boosters à l'entrée de la zone, et n'en achète plus.

| Zone | Marge 1er essai | Résultat |
|---|---:|---|
| Centrale avec les bonus | 1,01 | victoire à l'essai 2 |
| Centrale sans bonus | 2,57 | 181 essais en 120 min, jamais battu |

Le critère tient : sans les bonus le simulateur échoue sur la Centrale, avec eux il passe. La marge sans bonus (2,57) est large ; un vrai joueur qui monte une équipe plus forte (Pension, pierres) s'en sortirait mieux que ce simulateur.

## Début de partie (critère 2) : mesuré, rien d'appliqué

Les zones 1 et 2 sont inchangées. Avec les données actuelles, le critère 2 ne tient pas : le boss de la Route 1 tombe en 7 s sans aucun clic, celui de la Forêt de Jade en 11 à 13 s.

Le simulateur a rejoué ces deux zones avec d'autres multiplicateurs de PV (`--debut`, trois starters, 0 clic et 7 clics/s). Les dégâts en 30 s sont ceux de l'équipe de départ.

Route 1 (multiplicateur actuel 1, PV du boss 1 824) :

| Multiplicateur | PV du boss | Sans clic | 7 clics/s |
|---:|---:|---|---|
| 1 (actuel) | 1 824 | tombe en 7 s | tombe en 6 s |
| 2 | 3 648 | tombe en 13 s | tombe en 12 s |
| 3 | 5 472 | tombe en 20 s | tombe en 18 s |
| 4 | 7 296 | tombe en 27 s | tombe en 24 s |
| 4,5 | 8 208 | pas battu en 30 s | tombe en 27 s |
| 5 | 9 120 | pas battu en 30 s | tombe en 30 s (limite) |
| 6 | 10 944 | pas battu en 30 s | pas battu en 30 s |

Forêt de Jade (multiplicateur actuel 1,5, PV du boss 7 200), Bulbizarre :

| Multiplicateur | PV du boss | Sans clic | 7 clics/s |
|---:|---:|---|---|
| 1,5 (actuel) | 7 200 | tombe en 13 s | tombe en 12 s |
| 3 | 14 400 | tombe en 19 s | tombe en 24 s |
| 4 | 19 200 | tombe en 25 s | tombe en 23 s |
| 4,5 | 21 600 | tombe en 28 s | tombe en 26 s |
| 5 | 24 000 | pas battu en 30 s | tombe en 29 s |
| 6 | 28 800 | pas battu en 30 s | pas battu en 30 s |

Valeurs candidates, si Nicolas veut que le critère tienne : environ 4,5 pour la Route 1 (valable pour les trois starters) et 5 pour la Forêt de Jade (Bulbizarre et Carapuce ; Salamèche demande 6). Ce sont des multiplicateurs 4,5 fois et 3,3 fois plus grands qu'aujourd'hui : le critère demande un saut de difficulté, pas un réglage fin.

Deux choses à savoir avant de choisir :
- sur la Route 1, les clics à 7/s ajoutent environ 13 % de dégâts à l'équipe de départ (9 187 contre 8 137 en 30 s). Le créneau « pas battu sans clic mais battu avec 7 clics/s » est donc étroit : entre 4,5 et 5 environ. Un joueur à 5 clics/s le rate ;
- dans la Forêt de Jade, le niveau de l'équipe au boss change d'un essai à l'autre (7,0 à 7,8) selon les captures, ce qui décale les durées de 2 à 4 s.

## Argent et farm hors progression (critère 6)

Sur les zones 1 à 10 (Route 1 à Tour Pokémon), le simulateur passe 42,2 min dont 33,0 min après un premier échec de boss, soit 78 %. Le critère demande moins de 20 %. Il n'est donc pas tenu par ce simulateur.

Deux réserves :
- « farm hors progression » n'est pas mesurable tel quel : le simulateur ne revient jamais en arrière, et j'ai compté comme farm tout le temps passé après un premier échec dans une zone. Le chiffre est une borne, pas une mesure exacte ;
- le temps est surtout perdu à Pont Pépite (3,6 min), Carmin (17,5 min) et Tour Pokémon (11,9 min). L'argent gagné y est du même ordre que l'argent dépensé (Carmin : 27 482 gagnés, 26 100 dépensés), donc il achète bien les objets de la zone ; c'est le boss qui résiste avec la politique d'équipe du simulateur, qui capture mal et n'a pas de Pension.

Je ne change rien sur cette base. La mesure à faire est celle de Nicolas, de la Route 1 à la Sylphe.

## Fréquences des légendaires (critère 7)

10 000 rencontres par zone qui a un légendaire (`creerEnnemi` sur les étapes 1 à 9, graine fixe). « Attendu » est la valeur des données, qui est celle de la V1.

| Zone | Légendaire | Rencontres | Attendu (données) | Observé | Écart (σ) | Dans la statistique (±3 σ) |
|---|---|---:|---:|---:|---:|---|
| Pont Pépite | Mew (n° 151) | 10 000 | 1,0 % | 1,01 % | +0,10 | oui |
| Centrale | Électhor (n° 145) | 10 000 | 2,0 % | 2,00 % | +0,00 | oui |
| Îles Écume | Artikodin (n° 144) | 10 000 | 5,0 % | 5,05 % | +0,23 | oui |
| Caverne Azurée | Mewtwo (n° 150) | 10 000 | 5,0 % | 5,27 % | +1,24 | oui |
| Route Victoire | Sulfura (n° 146) | 10 000 | 5,0 % | 4,92 % | -0,37 | oui |

Les cinq fréquences sont celles des données. Le ticket cite Artikodin à 2 % et Électhor à 5 %, mais les données de la V1 donnent l'inverse (Électhor 2 %, Artikodin 5 %). J'ai suivi les données : un écart avec la V1 est un bug et le ticket ne demande pas de changer ces valeurs.

## Critères du ticket, un par un

| Critère | État |
|---|---|
| 1 Tableau par zone | tenu (`node scripts/simuler-parcours.mjs --clics 7`) |
| 2 Zones 1 et 2 : pas battu sans clic, battu avec 7 clics/s | **non tenu** avec les données actuelles, volontairement : zones 1 et 2 inchangées sur consigne de Nicolas. Valeurs candidates mesurées plus haut, non appliquées |
| 3 Marge d'environ 20 % de moins à partir de la Centrale | tenu à équipe égale (-20 % exactement) ; non mesurable sur un joueur réel |
| 4 Sans les bonus, échec sur au moins un boss à partir de la Centrale | tenu (Centrale, marge 2,57 contre 1,01) |
| 5 Argent ×2, capture non doublée deux fois | tenu, avec la lecture « capture = règle V1 ×2 puis ×2 global » (4 fois l'or de base de la V1) : à confirmer |
| 6 Farm hors progression sous 20 % du temps | **non tenu** par le simulateur (78 %), mesure peu fiable, voir plus haut |
| 7 Fréquences des légendaires | tenu, sous réserve de l'inversion Artikodin/Électhor du ticket |
| 8 Sauvegarde existante inchangée | tenu (test de chargement sans écriture) |

## Limites à garder en tête

- Le simulateur ne joue pas l'équipe réelle d'un joueur : pas de Pension, pas de pierres, pas de retour en arrière, captures au premier lancer seulement. Il mesure l'effet d'un changement de données (avant/après), pas la difficulté ressentie.
- La graine est fixe (1) et le starter est Bulbizarre : un autre starter ou une autre graine change les durées, pas les rapports de PV.
- Le Pokédex `theorique` est une borne haute, `reel` une borne basse.
