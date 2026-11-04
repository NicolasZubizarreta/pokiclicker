# Décisions de Nicolas (04/11, au retour)

- Cibles D : gardées en `propose` (`valide: false`), à recaler plus tard.
- Tolérance : 25 %.
- Puits F : rien ne change, prix actuels conservés.
- Mode Pokédex intermédiaire : pas maintenant. Il faudra un relevé v2 complet (chaque clic, gain d'argent, achat) ; prévu pour la bêta, sur les parties d'amis.
- Push des commits locaux : accordé.

---

# Questions pour Nicolas — phase 3 (rédigé le 04/11 pendant ton absence)

Ce qui est fait : tickets I (simulateur réparé + réactions de blocage), D (cibles proposées + outil de comparaison), E (test de durée écrit, désactivé), F (rapport argent et puits). Rien dans `data/` n'a changé depuis le ×1,6. Trois commits locaux (8079e7f, e252a9f, 3dc38dc), non poussés.

## 1. Push
Je pousse les 3 commits sur `origin/v2` ? (oui / non)

## 2. Cibles de temps par zone (ticket D)
`data/equilibrage.json` contient, pour chaque zone, le temps que le simulateur mesure aujourd'hui (7 clics/s, Pokédex théorique, starter 1). Total visé : 87,2 min, dans la fourchette 60-90 min. Statut `propose`, `valide: false` : le test CI ne simule rien tant que tu ne passes pas `valide` à `true`.
Problème : ces cibles reprennent le simulateur, pas ta partie. Il donne Carmin 18,7 min et Îles Écume 28,2 min (47 échecs), alors que chez toi Carmin n'a eu aucun échec. Veux-tu :
- a) valider telles quelles ;
- b) que je les recale sur ta partie (il faut un export avec le relevé v2) ;
- c) me donner à la main les temps que tu veux par zone.

## 3. Tolérance
Le test échouerait si une zone dépasse sa cible de plus de 25 %. Ça te va (25 %), ou plus large / plus serré ?

## 4. Ligue à 87 min
Après le ×1,6 la Ligue tombe à 87,0 min au protocole de référence, près du haut de la fourchette 60-90. Tu veux garder le jeu comme ça (oui, tu as dit « le jeu est bien comme ça »), ou viser plus bas ?

## 5. Puits d'argent (ticket F, `docs/projet/equilibrage-argent.md`)
Référence ×1,6 : 767 762 gagnés, 683 900 dépensés, 83 862 en caisse à la Ligue. À ×2 il restait 229 377. L'argent ne dort donc plus beaucoup. Options mesurées :
- ne rien changer (recommandé tant qu'on n'a pas de relevé v2 de ta partie) ;
- « achète tout » : caisse 36 764 à la Ligue, 71,9 min ;
- Baie Grena : 128 doses pour un Pokémon de 0 à 255 de bonheur = 76 160 pièces, un puits qui existe déjà.
Je garde les prix actuels ?

## 6. Simulateur : mode Pokédex
Avec `--reactions` :
- Pokédex théorique (tout le rencontrable) : Ligue en 39,6 min, ce qui est loin de tes 107 min jouées ;
- Pokédex réel : bloqué à la Tour Pokémon après 181,5 min.
Aucun des deux ne ressemble à ta partie. Je peux ajouter un mode « Pokédex intermédiaire » (captures partielles par zone, calé sur ton export). Tu veux que je le fasse, ou on attend un relevé v2 ?

## 7. Partie de test avec le relevé v2
Pour fermer le ticket H, il reste à jouer une partie avec le relevé actif (Plus → Relevé de partie, en développement) puis exporter. C'est aussi ce qui permettrait de recaler D et F. Tu le fais quand tu veux, puis tu me passes le JSON.

## Limites à savoir
- Le simulateur ne modélise pas : l'échange de Pokémon, les shinies recherchés, les objets portés choisis, les achats d'Attaque + faits avant un échec.
- Le comparateur donne des durées simulées, pas des promesses de durée réelle.
