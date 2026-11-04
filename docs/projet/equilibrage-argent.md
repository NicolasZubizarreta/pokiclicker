# Argent disponible et puits — ticket F, phase 3

Mesures du 04/11/2026, branche `v2`. **Aucune valeur de jeu n'est modifiée. La décision revient à Nicolas.**

À ×1,6 : référence **83 862 pièces et 87,03 min** à la Ligue gagnée ; « achète tout » **36 764 pièces et 71,91 min**. Les achats changent les captures, les niveaux et les gains : soustraire un coût au solde de référence ne prédit pas une autre partie.

## Protocole et commandes exactes

PowerShell, depuis la racine du dépôt :

```powershell
$env:PATH = 'C:\Program Files\nodejs;' + $env:PATH
node scripts/simuler-parcours.mjs --clics 7 --pokedex theorique
node scripts/simuler-parcours.mjs --clics 7 --reactions --pokedex theorique
node scripts/simuler-parcours.mjs --clics 7 --pokedex theorique --argent --json > "$env:TEMP/f-base.json"
node scripts/simuler-parcours.mjs --clics 7 --pokedex theorique --achete-tout --json > "$env:TEMP/f-tout.json"
node scripts/simuler-parcours.mjs --clics 7 --pokedex theorique --achete-tout --achete-tout-max-doses 0 --json > "$env:TEMP/f-zero.json"
node scripts/simuler-parcours.mjs --clics 7 --pokedex theorique --achete-tout --achete-tout-max-doses 1 --json > "$env:TEMP/f-une.json"
```

Options inchangées : starter Bulbizarre, graine 1, 7 clics/s, Pokédex théorique, réactions désactivées, limite de 120 min par zone. Le Pokédex théorique reste une borne haute ; ce n'est pas l'équipe de Nicolas. Le temps de Ronflex est compté sans ligne de combat ni flux d'argent.

`--argent` ajoute seulement la comptabilité et ses contrôles. Sans cette option ni `--achete-tout`, les sorties texte et la forme des résultats restent inchangées. Les exports `jouerParcours` et `graineAlea` gardent leurs signatures. Avec l'une des options, chaque zone expose `argentEntree`, `argentSortie`, `achats` (objet, quantité, coût total, tempsMs), `usages` (objet, quantité, cible, tempsMs), `possibles`, `differes` et `doses`. Le temps est celui du parcours simulé, en millisecondes. La sortie texte ajoute également ce détail.

Politique « achète tout » :
- Au passage de la politique d'achat (chaque seconde simulée), toutes les améliorations ouvertes non possédées sont examinées par prix réel croissant et achetées si abordables, y compris Poké-Radar et Fauchage. Le simulateur ne sait toujours pas utiliser ces deux capacités.
- À l'entrée de chaque zone et après chaque victoire de boss, y compris les boss intermédiaires de la Ligue, la politique d'achat passe aussi immédiatement. Les améliorations passent avant les balles ; le reste de la politique de balles demeure.
- Avec le solde restant : Calcium, puis bonbons (`candy`), puis Baie Grena (`pomegBerry`). Pour chaque dose, cible valide de plus haut DPS sans type, départagée par UID ; la sélection est refaite après chaque dose. L'équipe active reçoit les doses ; évolutions par niveau puis synchronisation.
- Plafond de **10 doses par type et par zone**, partagé entre l'entrée et toutes les victoires de cette zone, et non 10 par Pokémon ni par visite au magasin. Une dose non abordable n'est pas réservée : la politique passe au type suivant. `--achete-tout-max-doses 0` conserve toutes les améliorations, sans consommable permanent.
- L'ouverture, les prix, remises, limites de cible, achats et usages viennent des vraies fonctions de `boutique` et `objets-equipe`. Aucune formule de jeu n'est dupliquée. Attaque + et Attaque Spé + gardent leur politique existante après échec.

Référence à ×2 et vérification reproductible du déterminisme, **réglage en mémoire uniquement** (aucune écriture dans `data/`, donc aucune restauration Git susceptible d'écraser le travail d'une autre tâche) :

```powershell
@'
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
import { chargerCoeur, jouerParcours } from './scripts/simuler-parcours.mjs';
const { M, fermer } = await chargerCoeur();
const initial = M.reglages.reglages.recompenses.or.multiplicateur;
try {
  for (const [nom, multiplicateur, options] of [
    ['base', 1.6, {}],
    ['tout', 1.6, { acheteTout: true }],
    ['zero', 1.6, { acheteTout: true, acheteToutMaxDoses: 0 }],
    ['une', 1.6, { acheteTout: true, acheteToutMaxDoses: 1 }],
    ['double', 2, {}],
  ]) {
    M.reglages.reglages.recompenses.or.multiplicateur = multiplicateur;
    const o = { clics: 7, pokedex: 'theorique', argent: true, ...options };
    const r = jouerParcours(M, o);
    assert.deepEqual(r, jouerParcours(M, o));
    for (const z of r.zones) assert.ok(Math.abs(
      z.argentSortie - z.argentEntree - z.gagne + z.depense
    ) < 1e-7);
    writeFileSync(process.env.TEMP + '/f-' + nom + '.json', JSON.stringify(r));
    console.log(nom, r.fin, r.tempsMs / 60000, r.totalGagne, r.totalDepense, r.argentFinal);
  }
} finally {
  M.reglages.reglages.recompenses.or.multiplicateur = initial;
  await fermer();
}
'@ | node --input-type=module
```

## Lecture des relevés par zone

Soldes et flux ci-dessous arrondis à la pièce pour la lecture ; les assertions utilisent les montants bruts (les gains à ×1,6 peuvent être fractionnaires). Il peut donc y avoir une pièce d'écart en additionnant les nombres affichés. Le simulateur vérifie **sortie = entrée + gagné − dépensé** pour chaque zone, y compris une zone terminée par la limite de temps.

« Différés puis achetés » : objet vendu et ouvert, trop cher lors d'au moins un passage de la politique dans cette zone, puis acheté plus tard dans le parcours, éventuellement dans la même zone. Le JSON conserve le premier constat de manque, son prix et l'heure de l'achat ultérieur. Cela ne signifie pas que la politique a acheté à la première possibilité : les balles, les autres priorités et les refus volontaires interviennent. « Abordables mais jamais achetés » : au moins une dose ou amélioration financièrement accessible lors d'un passage, sans achat de cet objet sur tout le parcours. Les observations de consommables ne promettent pas une cible encore valide ou un quota de doses restant. Les objets trop chers et jamais achetés restent dans `differes` avec `achatUlterieur: null` ; ils ne sont pas classés comme achats possibles différés. Pierres, objets de stase, poupées et jetons shiny ne sont pas des usages permanents simulés ici.

### Référence ×1,6

| Zone | Entrée | Gagné | Dépensé | Sortie | Achats (quantités) | Différés puis achetés | Abordables mais jamais achetés |
|---|---:|---:|---:|---:|---|---|---|
| Route 1 | 0 | 1 280 | 0 | 1 280 | — | — | — |
| Forêt de Jade | 1 280 | 4 358 | 4 400 | 1 238 | pokeball ×12, runningShoes ×1 | amuletCoin, runningShoes | — |
| Arène d'Argenta | 1 238 | 3 026 | 2 200 | 2 063 | pokeball ×11 | amuletCoin, protein | — |
| Mont Sélénite | 2 063 | 3 618 | 2 310 | 3 371 | pokeball ×11 | amuletCoin, protein, expShare | — |
| Arène d'Azuria | 3 371 | 5 416 | 3 780 | 5 007 | pokeball ×18 | amuletCoin, protein, expShare | — |
| Pont Pépite | 5 007 | 9 507 | 9 500 | 5 014 | superball ×10, amuletCoin ×1 | protein, expShare, hardStone, amuletCoin | — |
| Arène de Carmin | 5 014 | 27 274 | 16 850 | 15 438 | superball ×17, protein ×1 | protein, expShare, hardStone, bicycle | — |
| Cave Taupiqueur | 15 438 | 11 978 | 13 128 | 14 287 | expShare ×1, superball ×6 | bicycle, hardStone | candy |
| Tunnel Rocheux | 14 287 | 23 728 | 26 826 | 11 189 | hyperball ×12, hardStone ×1 | bicycle, hardStone | candy |
| Tour Pokémon | 11 189 | 30 013 | 16 422 | 24 780 | hyperball ×14 | bicycle, luckyEgg | candy |
| Arène de Céladopole | 24 780 | 13 043 | 21 114 | 16 709 | hyperball ×18 | bicycle, luckyEgg | candy, calcium, pomegBerry |
| Centrale | 16 709 | 23 709 | 25 194 | 15 224 | hyperball ×6, xAttack ×1, xSpecial ×1 | bicycle, luckyEgg | candy, pomegBerry, calcium |
| Arène de Parmanie | 15 224 | 28 742 | 24 480 | 19 486 | hyperball ×20 | bicycle, luckyEgg | candy, pomegBerry |
| Sylphe SARL | 19 486 | 23 859 | 15 300 | 28 046 | hyperball ×12 | bicycle, luckyEgg | candy, calcium, pomegBerry |
| Arène de Safrania | 28 046 | 27 843 | 22 950 | 32 939 | hyperball ×18 | luckyEgg, bicycle | candy, calcium, pomegBerry |
| Îles Écume | 32 939 | 135 518 | 149 918 | 18 539 | hyperball ×23, bicycle ×1, xAttack ×10, xSpecial ×1 | luckyEgg, bicycle | candy, calcium, pomegBerry |
| Arène de Cramois'Île | 18 539 | 40 589 | 23 868 | 35 260 | hyperball ×18 | luckyEgg | candy, calcium, pomegBerry |
| Arène de Jadielle | 35 260 | 33 346 | 16 524 | 52 082 | hyperball ×12 | luckyEgg | candy, calcium, pomegBerry, pokeradar |
| Caverne Azurée | 52 082 | 69 154 | 72 318 | 48 917 | luckyEgg ×1, hyperball ×6 | luckyEgg | candy, pokeradar, calcium, pomegBerry |
| Route Victoire | 48 917 | 44 267 | 8 568 | 84 616 | hyperball ×6 | — | candy, pokeradar, calcium, pomegBerry |
| Ligue Pokémon | 84 616 | 207 496 | 208 250 | 83 862 | xAttack ×10, xSpecial ×10 | — | candy, pokeradar, calcium, pomegBerry |

Total : **767 762 gagnés, 683 900 dépensés, 83 862 restants**, 87,03 min.

### « Achète tout » ×1,6, maximum 10 doses

| Zone | Entrée | Gagné | Dépensé | Sortie | Achats (quantités) | Différés puis achetés | Abordables mais jamais achetés |
|---|---:|---:|---:|---:|---|---|---|
| Route 1 | 0 | 1 280 | 1 200 | 80 | pokeball ×6 | runningShoes, amuletCoin | — |
| Forêt de Jade | 80 | 4 358 | 4 400 | 38 | runningShoes ×1, pokeball ×12 | amuletCoin, protein | — |
| Arène d'Argenta | 38 | 3 026 | 1 000 | 2 063 | pokeball ×5 | amuletCoin, protein, expShare | — |
| Mont Sélénite | 2 063 | 3 618 | 2 310 | 3 371 | pokeball ×11 | amuletCoin, protein, expShare | — |
| Arène d'Azuria | 3 371 | 5 416 | 8 330 | 457 | pokeball ×18, amuletCoin ×1, superball ×1 | amuletCoin, protein, expShare, hardStone | — |
| Pont Pépite | 457 | 10 710 | 5 500 | 5 667 | superball ×10 | protein, expShare, hardStone, bicycle | — |
| Arène de Carmin | 5 667 | 27 274 | 29 400 | 3 541 | superball ×18, protein ×1, expShare ×1 | protein, expShare, hardStone, bicycle, pokeradar | — |
| Cave Taupiqueur | 3 541 | 11 978 | 14 658 | 860 | superball ×6, hyperball ×10 | candy, hardStone, bicycle, pokeradar | — |
| Tunnel Rocheux | 860 | 22 578 | 22 524 | 914 | hardStone ×1, candy ×2 | candy, hardStone, bicycle, pokeradar | — |
| Tour Pokémon | 914 | 29 618 | 30 494 | 38 | hyperball ×16, candy ×2, pomegBerry ×4 | candy, bicycle, pokeradar, calcium | — |
| Arène de Céladopole | 38 | 16 891 | 16 524 | 405 | hyperball ×8, candy ×1, pomegBerry ×4 | candy, bicycle, pokeradar, calcium, pomegBerry | — |
| Centrale | 405 | 33 456 | 33 456 | 405 | hyperball ×14, candy ×3, pomegBerry ×2 | candy, bicycle, pokeradar, calcium, pomegBerry | — |
| Arène de Parmanie | 405 | 21 803 | 21 847 | 361 | hyperball ×7, candy ×2, pomegBerry ×5 | candy, bicycle, pokeradar, calcium, pomegBerry | — |
| Sylphe SARL | 361 | 27 376 | 27 624 | 113 | hyperball ×20, pomegBerry ×4 | candy, bicycle, pokeradar, calcium, pomegBerry | — |
| Arène de Safrania | 113 | 33 192 | 32 935 | 370 | hyperball ×15, candy ×2, pomegBerry ×5 | candy, bicycle, pokeradar, calcium, pomegBerry | — |
| Îles Écume | 370 | 43 558 | 43 536 | 392 | hyperball ×12, xAttack ×2, candy ×2 | candy, bicycle, pokeradar, calcium, pomegBerry | — |
| Arène de Cramois'Île | 392 | 38 661 | 39 013 | 40 | hyperball ×5, bicycle ×1, candy ×1, pomegBerry ×2 | candy, bicycle, pokeradar, calcium, pomegBerry | — |
| Arène de Jadielle | 40 | 43 190 | 43 078 | 153 | hyperball ×9, calcium ×1, candy ×2, pomegBerry ×3 | candy, pokeradar, calcium, pomegBerry | — |
| Caverne Azurée | 153 | 67 613 | 67 337 | 428 | hyperball ×24, xAttack ×1, calcium ×1, candy ×1, pomegBerry ×2 | candy, pokeradar, calcium, pomegBerry | — |
| Route Victoire | 428 | 55 752 | 55 981 | 199 | hyperball ×12, pokeradar ×1, pomegBerry ×1 | candy, pokeradar, calcium, pomegBerry | — |
| Ligue Pokémon | 199 | 292 840 | 256 275 | 36 764 | calcium ×10, pomegBerry ×10, candy ×10, xAttack ×1, xSpecial ×1 | candy, calcium, pomegBerry | — |

Total : **794 186 gagnés, 757 422 dépensés, 36 764 restants**, 71,91 min. Les consommables permanents représentent **382 976** de dépenses. La caisse remonte à la Ligue parce que le quota est partagé entre ses boss et que les achats d'améliorations restent conditionnés par le solde réellement disponible à chaque instant.

### Référence ×2

| Zone | Entrée | Gagné | Dépensé | Sortie | Achats (quantités) | Différés puis achetés | Abordables mais jamais achetés |
|---|---:|---:|---:|---:|---|---|---|
| Route 1 | 0 | 1 600 | 0 | 1 600 | — | — | — |
| Forêt de Jade | 1 600 | 4 822 | 5 000 | 1 422 | pokeball ×15, runningShoes ×1 | amuletCoin | — |
| Arène d'Argenta | 1 422 | 4 558 | 4 000 | 1 980 | pokeball ×20 | amuletCoin, protein | — |
| Mont Sélénite | 1 980 | 4 764 | 2 520 | 4 224 | pokeball ×12 | amuletCoin, protein, expShare | — |
| Arène d'Azuria | 4 224 | 7 574 | 6 520 | 5 278 | amuletCoin ×1, pokeball ×12 | protein, expShare | — |
| Pont Pépite | 5 278 | 11 918 | 12 100 | 5 096 | superball ×22 | protein, expShare, hardStone | — |
| Arène de Carmin | 5 096 | 27 482 | 26 100 | 6 478 | superball ×12, protein ×1, expShare ×1 | protein, expShare, hardStone, bicycle | — |
| Cave Taupiqueur | 6 478 | 11 972 | 2 928 | 15 522 | superball ×6 | hardStone, bicycle | candy |
| Tunnel Rocheux | 15 522 | 15 710 | 11 730 | 19 502 | hyperball ×10 | bicycle, hardStone | candy |
| Tour Pokémon | 19 502 | 36 648 | 25 653 | 30 497 | hardStone ×1, hyperball ×11 | bicycle, luckyEgg | candy |
| Arène de Céladopole | 30 497 | 42 910 | 62 156 | 11 251 | hyperball ×25, bicycle ×1, xAttack ×1 | luckyEgg, bicycle | candy, calcium, pomegBerry |
| Centrale | 11 251 | 23 876 | 14 994 | 20 133 | hyperball ×6, xAttack ×1 | luckyEgg | candy, pomegBerry |
| Arène de Parmanie | 20 133 | 32 572 | 15 912 | 36 793 | hyperball ×13 | luckyEgg | candy, calcium, pomegBerry |
| Sylphe SARL | 36 793 | 28 804 | 15 300 | 50 297 | hyperball ×12 | luckyEgg, leftovers | candy, calcium, pomegBerry, pokeradar |
| Arène de Safrania | 50 297 | 38 696 | 15 300 | 73 693 | hyperball ×12 | luckyEgg, leftovers | candy, pokeradar, calcium, pomegBerry |
| Îles Écume | 73 693 | 35 896 | 91 043 | 18 546 | luckyEgg ×1, hyperball ×6, xAttack ×1, xSpecial ×1 | leftovers | candy, pokeradar, calcium, pomegBerry |
| Arène de Cramois'Île | 18 546 | 57 106 | 7 956 | 67 696 | hyperball ×6 | leftovers | candy, calcium, pomegBerry, pokeradar |
| Arène de Jadielle | 67 696 | 33 882 | 8 262 | 93 316 | hyperball ×6 | leftovers | candy, pokeradar, calcium, pomegBerry |
| Caverne Azurée | 93 316 | 55 328 | 46 529 | 102 115 | hyperball ×18, xAttack ×1, xSpecial ×1 | leftovers | candy, pokeradar, falseSwipe, calcium, pomegBerry |
| Route Victoire | 102 115 | 69 158 | 144 636 | 26 637 | hyperball ×12, leftovers ×1 | leftovers | candy, pokeradar, falseSwipe, calcium, pomegBerry |
| Ligue Pokémon | 26 637 | 286 040 | 83 300 | 229 377 | xAttack ×4, xSpecial ×4 | — | candy, calcium, pomegBerry, pokeradar, falseSwipe |

**831 316 gagnés, 601 939 dépensés, 229 377 en caisse ; 70,76 min** : reproduction exacte des totaux historiques de référence. **286 040 = gains de la Ligue seule**, et **69 158 = Route Victoire** ; leur somme est **355 198**, pas 286 040. L'écart vient donc du périmètre annoncé pour les 286 040, pas d'une différence du simulateur. À ×1,6, les deux zones rapportent ensemble 251 763,2 dans la référence ; leur gain n'est pas une simple réduction de 20 % du total ×2, car le parcours et les bonus diffèrent.

## Où l'argent dort

Critère demandé : sortie strictement supérieure à la moitié des gains de la zone de combat suivante, y compris ses jalons et captures. Il décrit une trésorerie, sans prouver qu'un achat utile est disponible. La Ligue n'a pas de zone suivante ; elle est exclue de ce classement.

- Référence ×1,6 : Arène d'Argenta, Mont Sélénite, Arène d'Azuria, Arène de Carmin, Cave Taupiqueur, Tour Pokémon, Arène de Céladopole, Centrale, Arène de Parmanie, Sylphe SARL, Arène de Cramois'Île, Arène de Jadielle, Caverne Azurée.
- « Achète tout » ×1,6 : **Arène d'Argenta, Mont Sélénite**.
- Référence ×2 : Mont Sélénite, Arène de Carmin, Cave Taupiqueur, Tunnel Rocheux, Tour Pokémon, Centrale, Arène de Parmanie, Sylphe SARL, Arène de Safrania, Arène de Cramois'Île, Arène de Jadielle, Caverne Azurée.

En particulier, référence ×1,6 : Caverne Azurée conserve 48 917 face à 44 267 de gains à Route Victoire ; Route Victoire conserve 84 616, mais ne franchit pas la moitié des 207 496 de gains de la Ligue. Cette réserve finance les boosters : assimiler toute caisse à de l'argent inutile serait trompeur.

## Relevé de Nicolas

Le relevé **v1 ne contient ni argent ni achats**. Aucun solde réel par zone, écart de dépense humain/simulateur ou montant d'argent dormant chez Nicolas ne peut être chiffré. Le [ticket C](equilibrage-blocages.md) mesure 191 min de montre, environ 107 min hors onglet masqué, avec retours pour le Pokédex. Comparer ces durées aux 87,03 ou 71,91 min ne permet pas d'attribuer l'écart à l'argent.

Le relevé **v2 (ticket H)** permettra de relire :
- `visites[].entree`, et les instantanés `debut`/`fin` des essais : argent, gains cumulés, inventaire, améliorations, badges, équipe (niveau, calcium, bonheur) et paliers du Pokédex ;
- `actions[]` : achats, usages, `tMs`, `prix`, `soldeApres` ; rapprocher les quantités et les coûts par visite, identifier les stocks inutilisés et les achats repoussés malgré un solde suffisant ;
- les retours dans les zones déjà vaincues : conserver leurs visites séparées, reconstruire les soldes entre instantanés, et vérifier que les gains cumulés et les achats couvrent tous les flux avant d'appliquer l'identité comptable ;
- `tempsSimuleMs`, `tempsActifMs`, `tempsMontreMs` et les marges de boss : distinguer l'effet d'un achat sur la puissance du temps masqué ou des interruptions.

Aucun nouvel export humain v2 n'a été analysé pour ce ticket.

## Puits proposés à Nicolas — aucune application

Les objets et valeurs concernés sont dans `data/objets.json` ; accès au Centre dans `centre.objets`, inflation et remise dans `boutique` de `data/reglages.json`. Prix de base actuels : Calcium 20 000 sans inflation, bonbon 5 000, Baie Grena 500, Attaque + 7 500, Attaque Spé + 10 000. Calcium et Baie Grena sont au Centre, les bonbons au Shop. Les boosters sont déjà dépensés par la politique existante.

À huit badges et avec remise, le vrai calcul de prix donne 595 pour une Baie Grena. De 0 à 255 bonheur : 128 doses, **76 160 par Pokémon**, soit 456 960 pour six. Le bonheur déjà acquis réduit ce besoin. Ce puits existe déjà ; il peut consommer presque toute la caisse finale de référence sur un seul Pokémon.

| Option proposée | Coût cumulé | Solde à la Ligue | Durée et effet mesuré | Retour arrière, une ligne par valeur |
|---|---:|---:|---|---|
| **Ne rien changer** : réglages et politique de référence | 683 900 | 83 862, Ligue gagnée | 87,03 min | Sans objet : aucune valeur modifiée. |
| Acheter toutes les améliorations, sans dose permanente (quota 0) | 617 181, dont 0 permanent | 37 829, Ligue gagnée | 63,09 min ; change aussi le moment des achats | Relancer sans `--achete-tout` ; aucune valeur de jeu modifiée. |
| Utiliser les puits actuels, quota 10 par type/zone | 757 422, dont 382 976 permanent | 36 764, Ligue gagnée | 71,91 min ; caisse réduite de 47 098 | Relancer sans `--achete-tout` ; aucune valeur de jeu modifiée. |
| Variante prudente en quantité, quota 1 par type/zone | 549 243, dont 133 805 permanent | **Ligue non gagnée** ; 5 830 à l'arrêt | 205,51 min au total, dont 120 min sans victoire à la Ligue ; risque mesuré | Remettre `--achete-tout-max-doses 10` ; aucune valeur de jeu modifiée. |
| Dépense après victoire : 10 Baies Grena, prix de base 500 conservé | 5 950 supplémentaires ; 689 850 avec référence | 77 912 après l'achat final | Aucun effet sur la durée jusqu'à la victoire : usage après celle-ci, +20 bonheur si cible valide | Ne pas acheter ces 10 doses ; pas de valeur à restaurer. |
| Dépense après victoire : amener un Pokémon de bonheur 0 à 255 avec 128 Baies Grena | 76 160 supplémentaires ; 760 060 avec référence | 7 702 après l'achat final | Aucun effet sur la durée jusqu'à la victoire ; budget théorique, suppose une cible à 0 et valide | Ne pas acheter ces 128 doses ; pas de valeur à restaurer. |

Les deux dernières lignes sont des budgets calculés au prix de fin de partie, pas des parcours rejoués ; aucun effet futur sur Chen ou une seconde Ligue n'est mesuré. Les doses doivent être réparties en achats respectant la limite de 99. Le quota 1 échoue malgré moins de doses : un ordre d'achat différent peut priver d'améliorations ou de boosters au mauvais moment. Ces variantes ne forment donc pas une courbe monotone « dépenses → vitesse ».

Proposition de décision : conserver les prix pour l'instant et relire un export v2 avant d'augmenter un puits. Si Nicolas préfère une autre valeur, consigner son choix et ouvrir le ticket d'application avec la valeur exacte et sa valeur précédente (une ligne de retour par valeur). **Aucun choix n'est consigné comme validé dans ce rapport.**

## Vérifications réalisées

- Deux simulations identiques comparées intégralement par `assert.deepEqual` pour chacune des cinq variantes ci-dessus : déterministes.
- Identité monétaire brute par zone : vérifiée dans le simulateur et dans le script de mesure ; tolérance 1e-7 pour les flottants.
- Sorties texte sans nouvelle option : comparaison avant/après par `Compare-Object`, aucun écart pour `--clics 7 --pokedex theorique` et `--clics 7 --reactions --pokedex theorique`.
- `npx.cmd eslint scripts/simuler-parcours.mjs` : propre.
- `npx.cmd vitest run --configLoader runner --no-file-parallelism tests/equilibrage-ab.test.ts` : **10 tests réussis**.
- Aucune écriture dans `data/`, `src/` ou `legacy/` ; aucun commit ni push. Le fichier non suivi `data/equilibrage.json` était déjà présent au début : il est conservé. `data/` n'est donc pas littéralement vide dans `git status`, mais aucune modification de données n'est due à ce ticket.

