# Plan de développement

Pas de dates : les durées s'estiment ticket par ticket, en fourchettes, une fois la phase 1 lancée. Chaque phase se termine par un **jalon jouable**.

| # | Phase | Contenu | Jalon |
|---|---|---|---|
| 0 | Cadrage | vision, charte projet, nom, dépôt, charte graphique à créer (`/charte`), backlog de la phase 1 | documents validés |
| 1 | Fondations | dépôt Vite/React/TS, CI, `src/core` pur avec tests, modèle de données (Pokémon, régions, graphe de zones, événements), sauvegarde versionnée à trois niveaux (compte/partie/région), boucle de jeu basée sur le temps écoulé, pipeline d'images, PWA, coquille d'UI mobile | Route 1 jouable sur téléphone et PC |
| 2 | Kanto jouable | zones, boss, capture, équipe, PC, shop, badges, Ligue en données ; plafond de cps ; événements (Chen, rival, Ronflex/Pokéflûte) ; pension, centre commercial, casino (conservés) | Kanto terminable |
| 3 | Équilibrage outillé | simulateur (joueur à 7 cps), courbe cible par zone, tableau de réglage JSON, puits d'argent, correction des dents de scie, tests de régression de durée | Kanto en 60-90 min à 7 cps |
| 4 | Compte et sauvegarde en ligne | authentification, parties multiples, synchro, diamants/succès/skins (socle), export/import JSON | partie jouable sur deux appareils |
| 5 | Design et UX | charte `/charte`, écrans mobile-first, animations, vrai audio, accessibilité, décors et cartes régénérés au bon format | Kanto "propre" |
| 6 | Monde | carte du monde, Pokédex national, PC global, expéditions, Johto comme gabarit de région | Johto jouable |
| 7 | Régions suivantes et méta | Hoenn à Paldea, Tournoi du Maître, succès complets, skins | une région par livraison |

La phase 5 démarre dès la phase 1 pour la coquille d'UI et le système de design ; seul le polish reste en fin.

## Décisions techniques à figer en phase 1 (ADR)
1. Modèle de sauvegarde à trois niveaux et numéro de version avec migrations.
2. Zones en graphe avec conditions de passage ; événements scriptés en données.
3. Génération des stats des Pokémon depuis PokeAPI par formule (pas 1 025 entrées à la main) ; réglages en JSON.
4. Fréquence d'enregistrement en ligne (proposition : toutes les 30 à 60 s et à la fermeture), résolution des conflits entre deux appareils.

## Décidé le 23/10
Kanto en 60-90 min ; plafond de 12 clics/s ; chaque région repart avec une équipe neuve et un choix de starter animé ; carte du monde libre de style ; aucune charte graphique écrite (à créer).

Pension, centre commercial et casino sont gardés (principe bon en V1, design et pratique à refaire). Les Pokémon du PC global ne rejoignent pas l'équipe d'une région.

## Questions ouvertes
1. Nom du jeu et nom du dépôt (Nicolas y réfléchit).
2. Apparence des easter eggs Bjorn et Gabriel (Nicolas décide).
3. Créer la charte graphique avec `/charte` : à lancer avant les écrans de la phase 1.
