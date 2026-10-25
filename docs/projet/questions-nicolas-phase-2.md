# Questions pour Nicolas — phase 2 (travail de nuit du 25/10/2026)

Mandat reçu le 25/10 : enchaîner les tickets de la phase 2 sans attendre, poser les questions au réveil. Règles tenues : aucun push, rien d'écrit sur GitHub, aucun téléchargement ni fichier audio sans accord, aucune règle de jeu changée sans ticket (écart avec la V1 = bug).
Quand un choix n'est tranché par aucun document, je prends l'option par défaut la plus proche de la V1, je la note ici, et je continue. Un ticket qui exige ton choix (variantes, décision d'ADR, accord sur des assets) est sauté et listé ci-dessous.

## Décisions prises à ta place (à valider)
- **F — couleur de la barre de temps du boss** : la V1 la fait violette, aucun jeton violet n'existe. Choix : `--alerte-base` (jaune d'urgence), distinct de l'XP (bleu). À changer si tu préfères le bleu ou un nouveau jeton.
- **F — message du Bourg Palette** : la V1 n'affiche rien. Choix : « Pas de Pokémon sauvage ici. Va sur la Route 1 pour combattre. » (champ `message` de la zone, donnée JSON).
- **F — Ligue minimale** : pour que le sélecteur de zones ne plante pas sur la Ligue, F donne aux 10 combats de la Ligue leurs adversaires V1 (tous boss, minuteur, échec → étape 1, zone 21 corrigée). Le Panthéon, le Maître Blue selon le starter et les victoires de Ligue restent au ticket Q.
- **F — « Zone débloquée ! »** remplace « <zone> terminée ! » à la première victoire d'une zone qui a une suite (texte V1).
- **H — « Envoyer au PC »** : bouton désactivé (« Le PC arrive bientôt. ») jusqu'au ticket I ; les règles (dernier Pokémon, œufs, équipe pleine → échange) sont codées et testées, le mode échange s'affiche déjà dans la page Équipe.
- **H — textes et détails** : « Veux-tu vraiment relâcher <nom> ? » (tutoiement) ; renommer à 13 caractères affiche « Entre un nom de 1 à 12 caractères. » (la V1 annulait sans rien dire) ; types en français ; badges de type neutres ; menu clic droit = « Résumé » seul (« Retirer l'objet » au ticket M) ; pas de réordonnancement de l'équipe.
- **H — migration v3** : les sexes des espèces à sexe fixe (Voltorbe, Nidoran♀…) sont corrigés dans les anciennes sauvegardes (la migration v1→v2 les avait mis selon la parité de l'uid) ; le fichier d'export porte désormais la version 3.

## Tickets en attente de toi
_(rien pour l'instant)_

## Journal de la nuit
_(un ticket par ligne : état, commit local, ce qui reste)_
- **F** — fait, commits locaux 1833028 → 761322f. CI verte (499 tests), e2e PC et mobile verts, revue acceptée avec retouches appliquées. Bourg Palette n'a pas encore de décor (arrive avec P) : l'écran s'affiche sans image. Le minuteur du boss se vérifie en unitaire (le DPS des starters tue le boss avant 30 s dans le navigateur).
- **G** — fait, commits locaux (carte → « fix(carte): contour de focus »). CI verte (574 tests), e2e complets verts. Carte SVG en fractions (24 formes de MAP_DATA), fiche sous la carte, barre « Ton voyage », vol Gen 1 de 3,8 s, signal de l'onglet Carte, zoom/déplacement. Décisions prises à ta place : flèches précédente/suivante gardées en combat (la V1 les a) ; miniature 16:9 sans recadrage ; couleurs V1 → jetons (arène rouge, route jaune, donjon bleu) ; Centre commercial et Casino désactivés « Bientôt disponible. » ; « clip-path » de la télé CRT remplacé par `scale`, Roucarnage ×2 ; tutoriel de la Route 1 déduit sans champ de sauvegarde ; l'animation de déblocage ne survit pas à un rechargement.
- **G (suite)** — Corrections de la revue appliquées (oiseau dans le bon sens, « Zone débloquée ! » qui reste, bouton « Arène » à Céladopole, dresseur qui reste sur la zone de départ, calendrier V1 de la piste, constantes déplacées dans les réglages). À savoir : changer d'onglet pendant le vol annule le voyage sans message (la V1 bloquait la carte par l'overlay) ; à décider : appeler `allerVers` au démontage ou désactiver la navigation pendant le vol.
- **H** — fait, commits locaux 234865b → (fin de revue). CI verte (669 tests), e2e verts. Revue : 2 défauts bloquants corrigés (tests du catalogue supprimés, fichier de résultats Vitest commité), clic dans la marge de la fiche qui la fermait, message de relâchement V1 « Il faut au moins 1 Pokémon actif », XP arrondie, focus après relâchement, Tab dans le menu. Reste : la fiche n'a pas l'affichage « œuf » de la V1 (aucun œuf ne peut arriver dans l'équipe avant le ticket T) ; « Envoyer au PC » s'active au ticket I.
