# Blocages longs : la partie de Nicolas contre le simulateur (ticket C, 03/11/2026)

Sources : deux exports du relevé de partie (ticket B), faits par Nicolas le 03/11 dans `Downloads` :
- `poki-releve-2026-11-03.json` (A), révision des données `583262b`, de 10:32 à 13:43 UTC : la première partie, Route 1 jusqu'à la Ligue, en capturant tout, avec des retours en arrière pour le Pokédex. Durée réelle 191 min.
- `poki-releve-2026-11-03 (1).json` (B), révision `1073e40f`, de 13:45 à 15:55 UTC : équipe améliorée (Pokédex complet, bonheur, calcium, niveaux), Kanto refait, Ligue rejouée et Professeur Chen battu.
Simulateur : `scripts/simuler-parcours.mjs`, chiffres de `docs/projet/equilibrage-28-10.md` (Ligue en 70,8 min, blocages après échec : Pont Pépite 4,8, Carmin 19,0, Tour Pokémon 13,2, Céladopole 14,4 min).

Les chiffres viennent d'un script jetable lancé sur ces deux fichiers (somme des visites par zone, essais et issues). Le fichier A est la référence pour les blocages, le fichier B montre le jeu une fois l'équipe au maximum.

## Ce que le relevé permet de dire

Définitions : temps de zone = temps entre l'entrée dans la zone et la victoire du boss (première visite). Temps après échec = temps entre le premier échec et la victoire suivante. « Masqué » = onglet masqué, dont la partie réelle n'est pas jouée.

| Zone | Temps de zone (A) | Essais (A, toutes visites) | Échecs | Temps après échec | Simulateur (après échec) |
|---|---|---|---|---|---|
| Pont Pépite | 5,4 min | 7 victoires | 0 | aucun échec | 4,8 min |
| Arène de Carmin | 5,3 min | 3 victoires, 1 abandon | 0 | aucun échec | 19,0 min |
| Tour Pokémon | 15,2 min dont 10,3 masqué | 4 victoires, 8 échecs, 1 abandon | 8 | 14,4 min, environ 4 min hors onglet masqué | 13,2 min |
| Arène de Céladopole | 2,6 min | 1 victoire | 0 | aucun échec | 14,4 min |
| Îles Écume | 4,2 min | 2 victoires | 0 | aucun échec | non mesuré |

Autres zones avec des échecs : Centrale (10 échecs en deux passages, 2,6 min de jeu visible et 5,4 min masquées dans le passage des échecs) et Route de Ronflex (2 échecs). Arène d'Azuria : 1 échec.

Constats :
- Pour un joueur humain, aucune des cinq zones ne bloque plus de 15 min. Les seuls vrais blocages mesurés sont la Tour Pokémon (8 échecs, 4 à 6 min de jeu visible) et la Centrale (10 échecs, environ 3 min).
- Les 19,0 min de Carmin et les 14,4 min de Céladopole du simulateur ne se retrouvent pas du tout : zéro échec dans les deux zones, 5,3 et 2,6 min de temps de zone. Pont Pépite (5,4 contre 4,8) et la Tour (14,4 contre 13,2 min) sont proches du simulateur, mais la Tour contient 10,3 min d'onglet masqué (Nicolas était parti).
- Durée de la partie A : 191 min de montre. Sans les périodes d'onglet masqué (83,8 min, dont 67 min d'absence à Céladopole), environ 107 min de jeu, retours en arrière pour le Pokédex et achats compris. Le simulateur annonce 70,8 min sans retour en arrière : l'écart d'environ 36 min correspond à un comportement humain que le simulateur ne reproduit pas, pas à un blocage.
- Partie B, équipe au maximum : Route 1 jusqu'à Caverne Azurée en 12,6 min de jeu, aucun échec, bosses battus en 3 à 12 s chacun ; Route Victoire, Ligue et Chen en environ 7 min (seconde passe). Un jeu sans blocage à ce niveau de puissance, sans surprise.

Part imputable au simulateur : il ne revient jamais en arrière, donc il n'a ni les captures ni les bonus de Pokédex que Nicolas accumule en chemin ; c'est la cause la plus probable de ses blocages à Carmin et à Céladopole. Cette cause est une hypothèse : le relevé n'enregistre ni l'équipe, ni l'argent, ni les achats, ni les niveaux.

## Données absentes ou fragiles

- Équipe, niveaux, argent, achats : absents du relevé. Les critères « argent, niveau, Pokémon précis, marge de boss » ne peuvent pas être chiffrés. Un ajout léger au relevé (niveaux de l'équipe et argent à l'entrée de chaque zone) permettrait de le faire.
- Temps actif : le relevé compte du temps actif pendant l'onglet masqué (visite de Céladopole : 53,5 min actives pour 67,4 min masquées ; somme des temps actifs 160,7 min, plus 83,8 min masqués, supérieure aux 191 min réelles). La convention du ticket B voulait exclure l'onglet masqué du temps actif. À vérifier : le jeu continue-t-il de simuler en arrière-plan, auquel cas c'est du temps de jeu simulé et non du temps joué ? Le tableau ci-dessus n'utilise pas ce temps actif.
- Îles Écume : une seule mesure, aucun échec ; aucun blocage acquis.
- Nicolas a dit être resté AFK à la Tour (confirmé : 10,3 min masquées) et à la zone 12 (la Centrale est la zone 12 : 5,4 min masquées ; l'absence de 67 min est à Céladopole, zone 11).

## Format du relevé v2

Le relevé reste local, désactivé par défaut et interdit en production. Export : `window.pokiJournal.exporter()`. Un relevé v1 est écarté ; aucun changement des sauvegardes de partie.

- `version: 2` ; chaque visite conserve `entree`, chaque essai `debut` et `fin` : argent, gains cumulés, nombre de badges, captures/total du Pokédex, palier atteint, clés des bonus actifs (objets, badges, jalons et effets temporaires), améliorations, inventaire et équipe (numéro, niveau, bonheur, calcium, shiny). Les fonctions du jeu fournissent les paliers et bonus ; aucun instantané n'est calculé à chaque pas. L'inventaire complet inclut notamment Attaque +, Attaque spé +, bonbons, Calcium et Baie Grena.
- `essais[].boss` : PV maximaux réels, DPS de l'équipe contre cet adversaire, dégâts d'un clic (`degatsClic`), fréquence des clics acceptés (`clicParSeconde`, manuels et automatiques, sur le temps simulé de l'essai), limite et `margeTemps = pvBoss / dpsEquipe × 1000 / tempsAccordeMs`. La marge ignore les clics ; `null` signifie absence de limite ou DPS nul. Les valeurs de dégâts et la marge décrivent le début de l'essai ; la fréquence est actualisée pendant l'essai. `nombreClics` permet de distinguer un essai très bref.
- `actions[]` : achats réussis du Shop/Centre, améliorations, usages d'objets et entrées dans une zone déjà vaincue ; `tMs` est une date d'horloge en millisecondes, `prix` le coût total, `soldeApres` le solde effectif. Aucune équipe n'est répétée dans ces actions.
- `tempsSimuleMs` compte tous les pas effectivement exécutés, y compris en arrière-plan ; `tempsActifMs` compte leur part attribuable au temps visible. `tempsMontreMs` mesure l'horloge entre entrée et sortie (ou export), interruptions et rechargements inclus. Le temps simulé inclut le temps actif : ces deux compteurs ne s'additionnent pas. Leur différence représente les pas masqués ou rattrapés au retour ; les interruptions restent des intervalles d'horloge.

Cause identifiée dans le code : `setInterval` appelle encore `tick` en arrière-plan ; `creerBoucle` simule le temps écoulé avec un rattrapage plafonné, sans consulter la visibilité. Au retour, les pas rattrapés peuvent être exécutés après `visibilitychange` et donc être déclarés actifs par le filtre v1. Le v2 limite la part active au temps visible écoulé depuis la reprise. Le jeu continue de simuler exactement comme avant. Si le navigateur ne déclare pas une fenêtre cachée via `visibilityState`, ce masquage reste indétectable par ce relevé. Le détail des 53,5 minutes historiques ne peut pas être reconstruit avec le seul export v1.

Budget vérifié par un export synthétique avec six Pokémon par équipe : 100 visites, 1 000 essais et 10 000 actions occupent environ **2,69 Mo** de JSON UTF-8. C'est une estimation de parcours complet avec retours, pas la mesure d'une nouvelle partie humaine ; la taille augmente avec le nombre d'essais et d'actions. Le test d'équivalence compare combats et récompenses sur un parcours déterministe avec et sans relevé.

## Options (aucune n'est appliquée)

Aucune cause étayée dans les règles du jeu : les blocages du simulateur ne se retrouvent pas dans la partie réelle, donc aucune variante de valeur n'a été simulée.

| Option | Fichier concerné | Effet attendu | Retour arrière |
|---|---|---|---|
| 1. Conserver le jeu actuel (recommandée) | aucun | Les blocages réels restent courts (Tour 4 à 6 min, Centrale environ 3 min). | sans objet |
| 2. Corriger le simulateur : retours en arrière pour compléter le Pokédex, avant de relire ses blocages | `scripts/simuler-parcours.mjs` | Un simulateur plus proche d'un humain ; il ne change aucune valeur de jeu. | revenir sur le script |
| 3. Compléter le relevé : équipe, niveaux et argent à l'entrée de zone, temps simulé à part du temps joué | `src/core/journal-zones.ts` et son branchement | Permet de chiffrer l'argent et la marge de boss, et de fermer le point sur le temps actif. | désactiver le relevé (réglage existant) |

Si Nicolas trouve la Tour Pokémon ou la Centrale trop dures malgré ces chiffres, c'est une autre décision : elle demande d'abord une mesure de la marge de leurs boss (option 3), pas un réglage à l'aveugle.
