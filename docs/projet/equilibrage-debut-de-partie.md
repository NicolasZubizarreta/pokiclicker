# Mesure des boss du début de partie — 03/11/2026

## Protocole

Commande exacte depuis la racine : `node scripts/simuler-parcours.mjs --debut` (graine 1 par défaut).
Paramètres explicites et états complets : `node scripts/simuler-parcours.mjs --debut --graine 1 --json`.
Branche `v2`, révision de départ `51ed81a5b9856ae44a46f0f12d01319695ba6e1b`, avec les modifications non commitées du ticket A dans le script et le test. Aucun commit créé.

60 parcours indépendants : 2 zones × 3 starters × 2 cadences × 5 multiplicateurs. Chaque ligne repart d’une sauvegarde neuve : starter non chromatique niveau 5, XP 0, argent 0, cinq Poké Balls, Pokédex limité au starter, aucune amélioration ni bonus actif. L’aléatoire du starter, des rencontres et des captures utilise le générateur déterministe existant, graine 1. L’horloge simulée commence à 0, par pas de 100 ms ; les clics sont répartis par accumulateur (0 ou 7/s, limiteur réel du jeu). Il n’y a aucun temps humain de réaction.

Politique existante de `jouerParcours` : capturer les espèces absentes du Pokédex dès apparition, jusqu’à trois lancers ; évoluer dès que possible ; placer les six meilleurs DPS sans type en équipe ; acheter les balles jusqu’au stock de dix quand il en reste moins de cinq, puis les améliorations accessibles par prix croissant. Les boosters ne sont utilisés qu’après un échec : ils ne concernent donc pas le premier essai mesuré. Les jalons du Pokédex, récompenses et achats suivent les règles actuelles. Les bonbons reçus restent dans l’inventaire.

La Forêt est atteinte en rejouant Route 1 aux valeurs actuelles pour chaque scénario ; son état n’est pas injecté artificiellement. Le multiplicateur candidat s’applique à tous les ennemis de la seule zone ciblée, conformément au mode existant, et peut donc modifier l’équipe à l’arrivée. ×1 signifie valeurs actuelles : coefficient interne Route 1 = 1, Forêt = 1,5 ; ×1,5 / ×2 / ×3 / ×4 multiplient ces coefficients. Ce ne sont pas des comparaisons à équipe constante.

Seul le **premier essai** du boss est retenu, victoire ou expiration du minuteur de 30 s, même si le parcours poursuit ses tentatives. L’arrivée au boss exclut son combat ; elle est donnée depuis la création et depuis l’entrée de zone. La durée couvre le combat actif, sans attente d’apparition. La détection au début du pas suivant était décalée de 100 ms dans l’ancien script : le début est maintenant daté à la fin du pas précédent. Les durées sont mesurées au pas de 0,1 s, sans prétendre à une précision supérieure.

## Référence ×1

PV des boss : Route 1 = 1 824 ; Forêt de Jade = 7 200. Les douze essais sont gagnés dans la limite de 30 s.

| Zone | Starter | Clics/s | Arrivée au boss depuis création (s) | Depuis entrée de zone (s) | Combat du boss (s) | Résultat (limite 30 s) |
|---|---|---:|---:|---:|---:|---|
| Route 1 | Bulbizarre (1) | 0 | 27,6 | 27,6 | 6,8 | victoire |
| Route 1 | Bulbizarre (1) | 7 | 26,3 | 26,3 | 6,0 | victoire |
| Route 1 | Salamèche (4) | 0 | 27,7 | 27,7 | 6,8 | victoire |
| Route 1 | Salamèche (4) | 7 | 26,3 | 26,3 | 6,1 | victoire |
| Route 1 | Carapuce (7) | 0 | 27,7 | 27,7 | 6,8 | victoire |
| Route 1 | Carapuce (7) | 7 | 26,3 | 26,3 | 6,0 | victoire |
| Forêt de Jade | Bulbizarre (1) | 0 | 65,1 | 30,7 | 13,0 | victoire |
| Forêt de Jade | Bulbizarre (1) | 7 | 62,3 | 30,0 | 12,1 | victoire |
| Forêt de Jade | Salamèche (4) | 0 | 65,6 | 31,1 | 11,2 | victoire |
| Forêt de Jade | Salamèche (4) | 7 | 62,6 | 30,2 | 10,6 | victoire |
| Forêt de Jade | Carapuce (7) | 0 | 64,7 | 30,2 | 13,0 | victoire |
| Forêt de Jade | Carapuce (7) | 7 | 61,5 | 29,2 | 12,1 | victoire |

Sans clic, Route 1 donne 6,8 s pour les trois starters, soit 7 s arrondies à la seconde comme dans le rapport du 28/10. La Forêt donne 13,0 s pour Bulbizarre et Carapuce, 11,2 s pour Salamèche : cela confirme les 11 à 13 s annoncées. Les différences au dixième avec l’ancienne sortie (6,7 ; 12,9 ; 11,1 s) viennent de la correction du départ de mesure, sans changement des règles ni des dégâts. Les cadences de 7 clics/s sont mesurées séparément et ne sont pas les références « sans clic ».

## Candidats et états à l’arrivée

Le tableau ci-dessous publie chaque état au premier boss : équipe en numéros et niveaux, achats cumulés avec quantités et coûts, argent restant, inventaire, améliorations, Pokédex et effets actifs. La sortie JSON donne aussi les états de région complets (XP, attributs des Pokémon, progression) et l’instant de chaque achat. Numéros utiles : 1 Bulbizarre, 4 Salamèche, 7 Carapuce, 10 Chenipan, 11 Chrysacier, 14 Coconfort, 16 Roucool, 19 Rattata, 21 Piafabec, 25 Pikachu. Les noms d’objets sont leurs identifiants du jeu.

Sauvegarde neuve par ligne ; graine 1 ; starter niveau 5, 5 Poké Balls ; argent initial 0.
Premier essai seulement ; limite 30 s ; ×1 = PV actuels ; variante sur toute la zone ciblée, zones précédentes inchangées.
Cadence répartie par accumulateur au pas de 100 ms ; arrivée depuis la sauvegarde neuve (et depuis l’entrée de zone).

| Zone | Starter | Clics/s | ×PV | Boss (s), résultat | Arrivée (s ; zone) | Équipe au boss (numéro:niveau) | Achats cumulés avant boss | État au boss (argent ; inventaire ; améliorations ; Pokédex ; actifs) |
|---|---:|---:|---:|---|---|---|---|---|
| Route 1 | 1 | 0 | 1 | 6.8 — victoire | 27.6 ; 27.6 | 16:6, 1:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 19 ; aucun |
| Route 1 | 1 | 7 | 1 | 6.0 — victoire | 26.3 ; 26.3 | 16:6, 1:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 19 ; aucun |
| Route 1 | 1 | 0 | 1.5 | 10.1 — victoire | 33.0 ; 33.0 | 16:6, 1:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 21 ; aucun |
| Route 1 | 1 | 7 | 1.5 | 9.0 — victoire | 29.9 ; 29.9 | 16:6, 1:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 19 ; aucun |
| Route 1 | 1 | 0 | 2 | 13.4 — victoire | 37.2 ; 37.2 | 16:6, 1:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 21 ; aucun |
| Route 1 | 1 | 7 | 2 | 11.9 — victoire | 34.9 ; 34.9 | 16:6, 1:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 21 ; aucun |
| Route 1 | 1 | 0 | 3 | 20.1 — victoire | 48.1 ; 48.1 | 16:6, 1:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 21 ; aucun |
| Route 1 | 1 | 7 | 3 | 17.8 — victoire | 44.4 ; 44.4 | 16:6, 1:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 21 ; aucun |
| Route 1 | 1 | 0 | 4 | 26.7 — victoire | 56.9 ; 56.9 | 16:6, 1:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 21 ; aucun |
| Route 1 | 1 | 7 | 4 | 23.7 — victoire | 52.1 ; 52.1 | 16:6, 1:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 1, 16, 21 ; aucun |
| Route 1 | 4 | 0 | 1 | 6.8 — victoire | 27.7 ; 27.7 | 16:6, 4:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 19 ; aucun |
| Route 1 | 4 | 7 | 1 | 6.1 — victoire | 26.3 ; 26.3 | 16:6, 4:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 19 ; aucun |
| Route 1 | 4 | 0 | 1.5 | 10.2 — victoire | 33.2 ; 33.2 | 16:6, 4:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 21 ; aucun |
| Route 1 | 4 | 7 | 1.5 | 9.1 — victoire | 30.0 ; 30.0 | 16:6, 4:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 19 ; aucun |
| Route 1 | 4 | 0 | 2 | 13.5 — victoire | 37.4 ; 37.4 | 16:6, 4:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 21 ; aucun |
| Route 1 | 4 | 7 | 2 | 12.0 — victoire | 35.0 ; 35.0 | 16:6, 4:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 21 ; aucun |
| Route 1 | 4 | 0 | 3 | 20.3 — victoire | 48.2 ; 48.2 | 16:6, 4:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 21 ; aucun |
| Route 1 | 4 | 7 | 3 | 17.9 — victoire | 44.6 ; 44.6 | 16:6, 4:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 21 ; aucun |
| Route 1 | 4 | 0 | 4 | 27.0 — victoire | 57.4 ; 57.4 | 16:6, 4:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 21 ; aucun |
| Route 1 | 4 | 7 | 4 | 23.9 — victoire | 52.2 ; 52.2 | 16:6, 4:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 21 ; aucun |
| Route 1 | 7 | 0 | 1 | 6.8 — victoire | 27.7 ; 27.7 | 16:6, 7:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 19 ; aucun |
| Route 1 | 7 | 7 | 1 | 6.0 — victoire | 26.3 ; 26.3 | 16:6, 7:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 19 ; aucun |
| Route 1 | 7 | 0 | 1.5 | 10.1 — victoire | 33.1 ; 33.1 | 16:6, 7:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 21 ; aucun |
| Route 1 | 7 | 7 | 1.5 | 9.0 — victoire | 30.0 ; 30.0 | 16:6, 7:6, 19:5 | aucun | 870 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 19 ; aucun |
| Route 1 | 7 | 0 | 2 | 13.5 — victoire | 37.2 ; 37.2 | 16:6, 7:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 21 ; aucun |
| Route 1 | 7 | 7 | 2 | 11.9 — victoire | 34.9 ; 34.9 | 16:6, 7:6, 21:5 | aucun | 896 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 21 ; aucun |
| Route 1 | 7 | 0 | 3 | 20.2 — victoire | 48.1 ; 48.1 | 16:6, 7:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 21 ; aucun |
| Route 1 | 7 | 7 | 3 | 17.9 — victoire | 44.5 ; 44.5 | 16:6, 7:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 21 ; aucun |
| Route 1 | 7 | 0 | 4 | 26.9 — victoire | 57.0 ; 57.0 | 16:6, 7:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 21 ; aucun |
| Route 1 | 7 | 7 | 4 | 23.8 — victoire | 52.1 ; 52.1 | 16:6, 7:6, 21:5 | aucun | 922 ; {"pokeball":0,"bonbon":5} ; aucune ; 7, 16, 21 ; aucun |
| Forêt de Jade | 1 | 0 | 1 | 13.0 — victoire | 65.1 ; 30.7 | 16:8, 1:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 46 ; {"pokeball":1,"bonbon":5} ; aucune ; 1, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 1 | 7 | 1 | 12.1 — victoire | 62.3 ; 30.0 | 16:8, 1:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 46 ; {"pokeball":1,"bonbon":5} ; aucune ; 1, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 1 | 0 | 1.5 | 19.5 — victoire | 73.3 ; 38.9 | 16:8, 1:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 12 ; {"pokeball":1,"bonbon":5} ; aucune ; 1, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 1 | 7 | 1.5 | 18.1 — victoire | 68.1 ; 35.8 | 16:8, 1:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 156 ; {"pokeball":1,"bonbon":5} ; aucune ; 1, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 1 | 0 | 2 | 18.6 — victoire | 75.0 ; 40.6 | 16:7, 1:7, 19:7, 25:6, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200) | 14 ; {"pokeball":1,"bonbon":5} ; aucune ; 1, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 1 | 7 | 2 | 24.1 — victoire | 78.4 ; 46.1 | 16:8, 1:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 128 ; {"pokeball":1,"bonbon":5} ; aucune ; 1, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 1 | 0 | 3 | 27.9 — victoire | 83.1 ; 48.7 | 16:7, 1:7, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 228 ; {"pokeball":5,"bonbon":5} ; aucune ; 1, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 1 | 7 | 3 | 26.4 — victoire | 79.3 ; 47.0 | 16:7, 1:7, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 228 ; {"pokeball":5,"bonbon":5} ; aucune ; 1, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 1 | 0 | 4 | 30.0 — échec | 91.4 ; 57.0 | 16:7, 1:7, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 228 ; {"pokeball":5,"bonbon":5} ; aucune ; 1, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 1 | 7 | 4 | 30.0 — échec | 87.2 ; 54.9 | 16:7, 1:7, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 228 ; {"pokeball":5,"bonbon":5} ; aucune ; 1, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 4 | 0 | 1 | 11.2 — victoire | 65.6 ; 31.1 | 16:8, 4:8, 19:7 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 70 ; {"pokeball":1,"bonbon":5} ; aucune ; 4, 16, 19 ; aucun |
| Forêt de Jade | 4 | 7 | 1 | 10.6 — victoire | 62.6 ; 30.2 | 16:8, 4:8, 19:7 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 70 ; {"pokeball":1,"bonbon":5} ; aucune ; 4, 16, 19 ; aucun |
| Forêt de Jade | 4 | 0 | 1.5 | 13.0 — victoire | 69.7 ; 35.2 | 16:7, 25:7, 4:7, 19:7, 11:7 | pokeball×7 (1400), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200) | 104 ; {"pokeball":4,"bonbon":5} ; aucune ; 4, 16, 19, 10, 11, 25 ; aucun |
| Forêt de Jade | 4 | 7 | 1.5 | 15.0 — victoire | 68.2 ; 35.8 | 16:8, 4:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×2 (400) | 104 ; {"pokeball":0,"bonbon":5} ; aucune ; 4, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 4 | 0 | 2 | 15.4 — victoire | 78.6 ; 44.1 | 16:8, 25:8, 4:8, 19:7, 11:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×3 (600), pokeball×2 (400), pokeball×1 (200) | 46 ; {"pokeball":5,"bonbon":5} ; aucune ; 4, 16, 19, 10, 11, 25 ; aucun |
| Forêt de Jade | 4 | 7 | 2 | 16.5 — victoire | 71.0 ; 38.6 | 16:7, 25:7, 4:7, 19:7, 11:7 | pokeball×7 (1400), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200) | 104 ; {"pokeball":4,"bonbon":5} ; aucune ; 4, 16, 19, 10, 11, 25 ; aucun |
| Forêt de Jade | 4 | 0 | 3 | 22.7 — victoire | 86.0 ; 51.5 | 16:8, 4:8, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200) | 1058 ; {"pokeball":5,"bonbon":5} ; aucune ; 4, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 4 | 7 | 3 | 21.8 — victoire | 82.0 ; 49.6 | 16:8, 4:8, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200) | 1058 ; {"pokeball":5,"bonbon":5} ; aucune ; 4, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 4 | 0 | 4 | 30.0 — échec | 95.3 ; 60.8 | 16:8, 4:8, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200) | 1058 ; {"pokeball":5,"bonbon":5} ; aucune ; 4, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 4 | 7 | 4 | 29.0 — victoire | 90.5 ; 58.1 | 16:8, 4:8, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200) | 1058 ; {"pokeball":5,"bonbon":5} ; aucune ; 4, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 7 | 0 | 1 | 13.0 — victoire | 64.7 ; 30.2 | 16:8, 7:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 46 ; {"pokeball":1,"bonbon":5} ; aucune ; 7, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 7 | 7 | 1 | 12.1 — victoire | 61.5 ; 29.2 | 16:8, 7:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 46 ; {"pokeball":1,"bonbon":5} ; aucune ; 7, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 7 | 0 | 1.5 | 19.3 — victoire | 74.7 ; 40.2 | 16:8, 7:8, 19:7, 11:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200) | 170 ; {"pokeball":1,"bonbon":5} ; aucune ; 7, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 7 | 7 | 1.5 | 18.2 — victoire | 67.6 ; 35.3 | 16:8, 7:8, 19:7, 11:7 | pokeball×7 (1400), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 156 ; {"pokeball":1,"bonbon":5} ; aucune ; 7, 16, 19, 10, 11 ; aucun |
| Forêt de Jade | 7 | 0 | 2 | 18.6 — victoire | 73.2 ; 38.7 | 16:7, 7:7, 19:7, 25:6, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200) | 14 ; {"pokeball":1,"bonbon":5} ; aucune ; 7, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 7 | 7 | 2 | 23.1 — victoire | 71.1 ; 38.8 | 16:7, 7:7, 19:7, 14:8, 11:7 | pokeball×7 (1400), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 56 ; {"pokeball":2,"bonbon":5} ; aucune ; 7, 16, 19, 10, 14, 11 ; aucun |
| Forêt de Jade | 7 | 0 | 3 | 27.9 — victoire | 81.5 ; 47.0 | 16:7, 7:7, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 228 ; {"pokeball":5,"bonbon":5} ; aucune ; 7, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 7 | 7 | 3 | 26.5 — victoire | 77.9 ; 45.6 | 16:7, 7:7, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 228 ; {"pokeball":5,"bonbon":5} ; aucune ; 7, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 7 | 0 | 4 | 30.0 — échec | 89.3 ; 54.8 | 16:7, 7:7, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 228 ; {"pokeball":5,"bonbon":5} ; aucune ; 7, 16, 19, 10, 14, 25, 11 ; aucun |
| Forêt de Jade | 7 | 7 | 4 | 30.0 — échec | 85.3 ; 53.0 | 16:7, 7:7, 25:6, 19:7, 11:7, 14:8 | pokeball×7 (1400), pokeball×1 (200), pokeball×1 (200), pokeball×2 (400), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200), pokeball×1 (200) | 228 ; {"pokeball":5,"bonbon":5} ; aucune ; 7, 16, 19, 10, 14, 25, 11 ; aucun |

Les résultats ne sont pas toujours monotones : par exemple, Bulbizarre sans clic dans la Forêt gagne en 19,5 s à ×1,5, mais en 18,6 s à ×2 grâce à une équipe différente incluant Pikachu. De même, une cadence supérieure peut changer les captures et devenir moins favorable. Ces variantes mesurent un parcours complet avec sa politique d’achats et de captures, pas une simple multiplication de la durée du boss. À ×4 dans la Forêt, cinq scénarios échouent à 30,0 s ; Salamèche à 7 clics/s gagne en 29,0 s.

## Vérifications

Le test du ticket A lance réellement deux processus `--debut --graine 1 --json`, compare les 60 résultats complets et compare octet pour octet `data/regions/kanto/zones.json` et `data/reglages.json` avant/après. Il vérifie aussi les douze références et la durée limite des échecs. Le fichier ciblé passe en 3,01 s lors du premier contrôle.

Contrôles exécutés le 03/11 :

- `node scripts/simuler-parcours.mjs --debut` : succès, 60 lignes lisibles avec les états et durées séparées.
- `npx.cmd tsc --noEmit -p .` : succès ; le contrôle complet des trois projets TypeScript passe aussi dans la CI.
- `npx.cmd eslint scripts/simuler-parcours.mjs tests/equilibrage-ab.test.ts docs/projet/equilibrage-debut-de-partie.md docs/projet/backlog-phase-3.md` : succès, aucune erreur ; deux avertissements car les Markdown sont ignorés par la configuration.
- `npx.cmd vitest run --configLoader runner --no-file-parallelism tests/equilibrage-ab.test.ts` : 9 tests réussis, durée totale 3,01 s.
- `npm.cmd run ci` : succès, 179 fichiers et 2 329 tests réussis, compilation de production réussie ; avertissement Vite sur un chunk supérieur à 500 kB.
- `git diff --check` : succès ; aucun changement dans `data/` ni `legacy/`.

Rien n’est appliqué : Nicolas choisit une ligne ou garde les valeurs actuelles ; toute application éventuelle relève d’un ticket ultérieur validé avec la valeur exacte et son retour arrière.

