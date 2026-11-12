# Pension : ce que rapporte un œuf, et 3 pistes (ticket D)

Sources : `src/core/pension.ts`, `data/reglages.json` (blocs `pension`, `combat`, `capture`), `data/objets.json`. Les chiffres viennent de ces fichiers ; ce que je n'ai pas mesuré est dit comme tel.

## Comment marche la pension aujourd'hui

- Deux parents au maximum. Chaque combat gagné : un tirage de ponte (4 % si deux Pokémon de même espèce et de sexes opposés ou si l'un est un Métamorph ; 2 % s'ils partagent un type ; sinon 0).
- L'œuf contient l'espèce de la mère, en forme de base (Dracaufeu donne Salamèche). Avec un Métamorph : l'espèce de l'autre parent. Deux Métamorph : une espèce au hasard parmi les 151.
- 1 emplacement d'œuf au départ, jusqu'à 5 (5 000 ₽ par emplacement en plus). Éclosion après 25 combats gagnés.
- Le Pokémon éclos est niveau 1, bonheur 125, chromatique dans 12,5 % des cas.

## Un œuf contre les autres voies

| Ce qu'on veut | Par l'œuf | Autre voie | Verdict |
|---|---|---|---|
| Un Pokémon chromatique | 12,5 % par œuf (1 œuf sur 8 en moyenne) | Capture : 1/256 de base, ×3 avec l'objet `shinyCharm`, ×2 avec le jalon 151, soit 6/256 (2,3 %). Jeton Shiny : 250 000 ₽, certain, sur un Pokémon déjà possédé | L'œuf est 5 fois meilleur que la capture, mais le Jeton Shiny le remplace dès qu'on a 250 000 ₽ |
| Une espèce nouvelle | Seulement Métamorph + Métamorph (espèce au hasard parmi 151) | Capture, avec Master Ball (certain, 40 000 jetons au casino) | L'œuf ne donne presque jamais une espèce qu'on n'a pas : ses parents sont déjà possédés |
| Du bonheur | 125 d'office à l'éclosion | Baie Grena : 500 ₽ pour +2, soit environ 31 000 ₽ pour passer de 0 à 125 | Aucun intérêt (31 000 ₽ contre 38 millions en fin de partie) |
| Du niveau | Niveau 1 (donc plus bas qu'une capture) | Bonbon : 5 000 ₽ par niveau | L'œuf est en dessous |
| De la puissance | Rien | Calcium : 20 000 ₽, +2 % de dégâts, 10 par Pokémon | L'œuf n'en donne pas |

À retenir : la pension fournit des Pokémon qu'on a déjà, plus faibles, avec un seul avantage (le chromatique) que l'argent achète. Quand on a 38 millions de ₽, elle ne fournit rien qu'on ne puisse acheter.

Non mesuré : combien d'œufs par heure à 7 clics par seconde (il faut le simulateur). Je chiffre donc les pistes en nombre d'éclosions.

## 3 pistes (choisir une ou plusieurs)

### 1. Marque d'éclosion : de la puissance qu'on ne peut pas acheter
Un Pokémon né d'un œuf reçoit une marque : +5 % de dégâts propres, une fois par Pokémon (donc 151 marques au plus). Pour comparer : le Calcium au maximum donne +20 % pour 200 000 ₽ par Pokémon. La marque ne s'achète pas : seule l'éclosion la donne.
- Coût de développement : 1 jour (champ sur le Pokémon, calcul des dégâts, affichage, migration de sauvegarde).
- Risque : touche l'équilibrage (le simulateur de la phase 3 à relancer, durée de Kanto à vérifier).

### 2. Collection d'éclosions : un objectif à long terme
Un compteur « Espèces écloses » (sur 151) avec des paliers (10, 50, 100, 151) qui rapportent des récompenses uniques. Pas de dégâts en plus : des diamants ou un titre, selon ce que tu veux. Le Métamorph devient la clé pour les espèces qu'on ne possède pas.
- Coût : 1 jour (compteur, paliers dans `data/`, écran de la pension).
- Risque : faible, aucune règle de combat ne change. Mais l'intérêt dépend de ce que les paliers donnent, à décider.

### 3. Œuf garanti payant (la piste la plus faible)
Payer, par exemple, 25 000 ₽ pour avoir l'œuf de l'espèce voulue sans attendre le tirage de 4 %.
- Coût : 0,5 jour.
- Défaut : l'argent est abondant en fin de partie, donc ça ne crée pas de raison de s'en servir. À ne retenir que combinée avec la 1 ou la 2.

## À décider avec Nicolas
Quelles pistes (1, 2, 3, plusieurs) ; pour la 1, la valeur de la marque ; pour la 2, ce que rapportent les paliers.
