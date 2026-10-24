# Choix de Nicolas sur les variantes des pages (ticket B, 24/10/2026)

Source : son bilan sur les trois sites de `design/variantes/` (A, B, C). Ses mots entre guillemets. Ce document décide la forme des pages ; les tickets H, I, L, G, N, P le citent.

## Règle générale (nouvelle, à appliquer partout)
« La V1, c'est l'idéal de mon jeu : les améliorations sont techniques (optimisation, suite), mais **le visuel, les animations et les easter eggs, c'est pile ce que j'aimais**. » On porte donc fidèlement les **visuels, animations et easter eggs de la V1** (retravaillés si besoin, jamais supprimés). L'inventaire détaillé est dans `docs/projet/v1-visuel-a-porter.md`. Tout ticket qui touche une page reprend d'abord ce que la V1 faisait.

## Verdicts par page
| Page | Retenu | À faire en plus |
|---|---|---|
| Équipe | **A** (liste + détail) | — |
| Fiche Pokémon | **B** (fiche en fenêtre superposée) | Le défilement doit marcher avec le curseur sur la fiche ; l'étoile « Retire des favoris » est mal alignée avec son texte ; on affiche le **nom de l'espèce** en plus du surnom (« Éclair » est un surnom d'exemple, pas un nom d'espèce) |
| PC | **B** (grille + détail) | Ajouter une **barre de recherche** et un **tri par shiny** ; sur PC, la **liste de l'équipe à droite, au-dessus de la fiche du Pokémon** (équipe d'abord, fiche dessous, défilement si trop grand) |
| Sac | aucune variante ne convient | Icônes **officielles des objets comme en V1**, cases beaucoup plus petites, aucun vide inutile, **système d'utilisation des objets à refaire** (nul sur les trois), garder le **filtre par catégorie** de C |
| Shop | **B** (cartes produit) | Mieux aligner les éléments ; **retirer** la case « Prépare ta route » et le message « Il te manque X pièces » (un bouton grisé suffit) ; garder le **tri par catégorie** de C ; **pas de panier** |
| Plus et Pokédex | **C** (tableau de bord) | Garder le **carnet de badges** de la V1 et **l'animation d'obtention d'un badge** ; garder **toutes les animations de la V1** (retravaillées) |
| Carte | **A** (plein cadre) | Ajouter la **barre de progression « Ton voyage »** de C ; le cadre de détail de la zone **dans la carte** mais sans cacher le bas (plus petit ou carte plus grande avec un espace réservé) ; afficher le **numéro de zone** au clic ; pas de tracé du chemin ; **carte de Kanto à refaire** : reprendre celle de la V1 (image mapping, **animation de déblocage d'une zone**, **animation de téléportation au clic**…) |
| Dialogue de Chen et choix du starter | **aucune** (les trois « vides et moches ») | Reprendre la **V1** : on se réveille chez Maman, on sort, on se **balade dans Kanto sur la carte en image mapping**, on va au labo, etc. |

## Conséquences sur les tickets (appliquées au backlog)
- **G (carte)** : refonte sur la carte et l'image mapping de la V1, animations de déblocage et de téléportation, variante A + progression de C.
- **N (badges et Pokédex)** : carnet de badges et animation d'obtention de la V1 ; page Plus en variante C.
- **P (intro)** : la balade jouable de la V1 remplace le dialogue statique.
- **H, I** : Équipe A, fiche B (fenêtre), PC B avec recherche, tri shiny, équipe à droite.
- **L (Sac et Shop)** : Shop B sans panier ni message de manque, Sac à refaire avec icônes officielles.
- **Nouveau ticket Z** : inventaire et reprise des visuels, animations et easter eggs de la V1 (transversal).

## Questions restantes
- Sac : comment utilisais-tu un objet en V1 (mode de sélection d'un Pokémon cible) ? À confirmer sur l'inventaire.
- Le Combat des trois sites est la maquette tactile ; la bande verte en dents de scie sous la barre d'étapes (sol décoratif de la maquette qui chevauchait « Étape n sur 10 ») est retirée.
