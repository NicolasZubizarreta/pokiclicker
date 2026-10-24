# Questions pour Nicolas — phase 2 (travail de nuit du 25/10/2026)

Mandat reçu le 25/10 : enchaîner les tickets de la phase 2 sans attendre, poser les questions au réveil. Règles tenues : aucun push, rien d'écrit sur GitHub, aucun téléchargement ni fichier audio sans accord, aucune règle de jeu changée sans ticket (écart avec la V1 = bug).
Quand un choix n'est tranché par aucun document, je prends l'option par défaut la plus proche de la V1, je la note ici, et je continue. Un ticket qui exige ton choix (variantes, décision d'ADR, accord sur des assets) est sauté et listé ci-dessous.

## Décisions prises à ta place (à valider)
- **F — couleur de la barre de temps du boss** : la V1 la fait violette, aucun jeton violet n'existe. Choix : `--alerte-base` (jaune d'urgence), distinct de l'XP (bleu). À changer si tu préfères le bleu ou un nouveau jeton.
- **F — message du Bourg Palette** : la V1 n'affiche rien. Choix : « Pas de Pokémon sauvage ici. Va sur la Route 1 pour combattre. » (champ `message` de la zone, donnée JSON).
- **F — Ligue minimale** : pour que le sélecteur de zones ne plante pas sur la Ligue, F donne aux 10 combats de la Ligue leurs adversaires V1 (tous boss, minuteur, échec → étape 1, zone 21 corrigée). Le Panthéon, le Maître Blue selon le starter et les victoires de Ligue restent au ticket Q.
- **F — « Zone débloquée ! »** remplace « <zone> terminée ! » à la première victoire d'une zone qui a une suite (texte V1).

## Tickets en attente de toi
_(rien pour l'instant)_

## Journal de la nuit
_(un ticket par ligne : état, commit local, ce qui reste)_
- **F** — fait, commits locaux 1833028 → 761322f. CI verte (499 tests), e2e PC et mobile verts, revue acceptée avec retouches appliquées. Bourg Palette n'a pas encore de décor (arrive avec P) : l'écran s'affiche sans image. Le minuteur du boss se vérifie en unitaire (le DPS des starters tue le boss avant 30 s dans le navigateur).
- **G** — fait, commits locaux (carte → « fix(carte): contour de focus »). CI verte (574 tests), e2e complets verts. Carte SVG en fractions (24 formes de MAP_DATA), fiche sous la carte, barre « Ton voyage », vol Gen 1 de 3,8 s, signal de l'onglet Carte, zoom/déplacement. Décisions prises à ta place : flèches précédente/suivante gardées en combat (la V1 les a) ; miniature 16:9 sans recadrage ; couleurs V1 → jetons (arène rouge, route jaune, donjon bleu) ; Centre commercial et Casino désactivés « Bientôt disponible. » ; « clip-path » de la télé CRT remplacé par `scale`, Roucarnage ×2 ; tutoriel de la Route 1 déduit sans champ de sauvegarde ; l'animation de déblocage ne survit pas à un rechargement.
