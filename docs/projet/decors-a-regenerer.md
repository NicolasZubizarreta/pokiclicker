# Décors à régénérer (ticket O)

Décision de Nicolas (09/11) : tout refaire, avec le même style que la carte réaliste de Kanto, sans logo Gemini, plus un fond pour la Route de Ronflex, et des easter eggs cachés dans les décors. La carte est déjà remplacée (commit 1f8a0c5, test de géométrie vert).

## Méthode
1. Pour chaque lieu : joindre à Gemini le décor actuel (`public/img/decors/<nom>.webp`) comme référence de composition, coller le bloc STYLE puis la ligne du lieu.
2. Enregistrer l'image sous le nom du lieu dans `assets-src/decors-gemini/` (ex. `route-1.png`), sans la retoucher.
3. Lancer `node scripts/preparer-decors-gemini.mjs`. Le script retire le coin du logo (10,5 % à droite et en bas, `--marge 0` si l'image n'en a pas), recadre en 16:9, écrit `public/img/decors/<nom>.webp` en 1920 × 1080 et met `tailles.json` à jour. Il refuse un nom inconnu ou une image trop petite (il faut environ 2150 px de large).
4. Le test `tests/decors-formats.test.ts` garde le format 16:9. Il tient aussi la liste des lieux encore sans décor 16:9 : quand Pension est livrée, la retirer de `SANS_DECOR_16_9`.

Conséquence du recadrage : tout ce qui compte doit rester dans la partie haut-gauche de l'image (à moins de 10 % du bord droit et du bas, rien d'important). Sur téléphone le décor est coupé au centre : placer les easter eggs entre 25 % et 75 % de la largeur et dans la moitié haute pour qu'ils se voient partout (à vérifier sur le premier décor livré).

## Bloc STYLE (à coller avant chaque lieu)
```
Detailed hand-illustrated scene, 16:9 landscape, 3/4 top-down view like a classic Pokémon game map seen from above at an angle. Style: painterly illustration with fine ink outlines and a pixel-art feel, rich natural colours, the same look as the attached Kanto map (same artist). Full-bleed: the scene fills the whole image to every edge, no black bars, no white margins, no frame, no cut-out layout. No characters, no Pokémon unless stated, no text or labels except where stated, no user interface, no watermark. Keep the centre of the picture fairly calm (a Pokémon battle is shown on top of it); put the details around. Leave the bottom-right corner empty (plain floor or grass, nothing important).
```

## Les lieux
Deux easter eggs sont déjà décidés par Nicolas ; les autres sont des propositions à garder, changer ou retirer. Chacun est petit : l'œil doit le trouver après quelques minutes de jeu.

| Fichier | Lieu et décor | Easter egg |
|---|---|---|
| `route-1` | Route de campagne herbeuse, barrières en bois, terrier de Rattata | Une casquette rouge et blanche posée sur un poteau de barrière (Sacha) |
| `foret-de-jade` | Forêt dense, sentier, filets à insectes | Un unique lampadaire ancien au milieu des arbres (Narnia) |
| `arene-d-argenta` | Arène de roche, sol de gravier, blocs de pierre | Un onigiri posé sur un rocher, à côté d'un fossile de Kabuto (Pierre et ses beignets) |
| `mont-selenite` | Grotte lunaire, cristaux, mousse | Un monolithe noir parfaitement lisse, à demi enfoui (2001, l'Odyssée de l'espace) |
| `arene-d-azuria` | Arène d'eau, grande piscine, plongeoir | Un vélo rouge tordu au fond du bassin (le vélo d'Ondine dans l'anime) |
| `pont-pepite` | Pont de bois sur la rivière, falaises | Un ballon en forme de tête de Miaouss très haut dans le ciel, minuscule (Team Rocket) |
| `arene-de-carmin` | Arène électrique, sol métallique, câbles, paratonnerres | Un autocollant « 1,21 GW » sur un générateur (Retour vers le futur) |
| `cave-taupiqueur` | Terrier de terre meuble, galeries, trous | Un énorme maillet jouet abandonné contre la paroi (jeu de la taupe) |
| `tunnel-rocheux` | Grotte sombre, rochers, lampe qui éclaire un cercle | Un gros rocher rond qui bloque un couloir, et un fouet usé à côté (Indiana Jones) |
| `tour-pokemon` | Tour funéraire violette, tombes, brume | **Décidé :** un Osselait devant une tombe (sa mère dans l'anime) |
| `arene-de-celadopole` | Arène de plantes, serre, thé | Une rose rouge sous cloche de verre (La Belle et la Bête) |
| `centrale` | Centrale électrique, turbines, voyants | Un grand bouton rouge sous capot, étiquette « ne pas toucher », un donut à côté (les Simpson) |
| `route-de-ronflex` (nouveau) | Chemin de forêt large qui se rétrécit au milieu, avec une clairière vide au centre (le jeu pose le sprite de Ronflex dessus, ne pas en dessiner) ; sert aussi à un mini-jeu de flûte : garder le centre dégagé | Un abribus rouillé avec un parapluie oublié et des glands (Mon voisin Totoro) |
| `arene-de-parmanie` | Dojo ninja, tatamis, shurikens | **Décidé :** un parchemin au mur titré « parchemin du spinjitzu » (LEGO Ninjago) |
| `sylphe-sarl` | Hall et bureaux de la Sylphe SARL, plantes, ordinateurs | Une agrafeuse rouge sur un bureau, à côté d'un Rubik's Cube (Office Space) |
| `arene-de-safrania` | Arène psy, sol de carreaux blancs et violets, cristaux | Une cuillère en train de se plier, flottant en l'air (Matrix, « il n'y a pas de cuillère ») |
| `iles-ecume` | Grotte de glace, eau gelée, stalactites | Un petit bonhomme de neige à nez de carotte tenant une fleur (La Reine des neiges) |
| `arene-de-cramois-ile` | Arène de lave, pont de pierre, panneaux de quiz | Un anneau d'or posé au bord de la lave, sur une pierre (Le Seigneur des anneaux) |
| `arene-de-jadielle` | Arène de terre, sol de roche sombre, bureau de chef | Un grand fauteuil de cuir avec un Persian blanc couché dessus (Le Parrain) |
| `caverne-azuree` | Caverne d'eau bleue, rochers, lueurs | Une capsule de verre brisée, étiquette « projet M » (le clone de Mewtwo) |
| `route-victoire` | Route de montagne sombre, grandes arches de roche | Un feu de camp avec une épée plantée à côté (Dark Souls) |
| `ligue-pokemon` | **Une seule grande salle de palais** (le décor actuel est un collage de cinq salles : le refaire en une pièce) : tapis rouge en croix, colonnes, cinq piédestaux | Une coupe de champion avec un nom gravé puis rayé et un nom vide dessous (Sacha jamais champion) |
| `pension` (nouveau) | Maison de campagne, pré clôturé, nids d'œufs, cabane | Un œuf doré posé dans l'herbe (un œuf de Pâques, easter egg au sens propre) |
| `chez-blue` | Intérieur de maison, bureau, étagères | Une Game Boy Color à l'écran fissuré sur la table |
| `chez-maman` | Salon et chambre d'une maison de ville, escalier, tapis | Une Super Nintendo branchée à la télé avec une manette (la maison du jeu de 1996) |
| `centre-commercial` | Grand magasin à étages, rayons, escalators | Une borne d'arcade Pac-Man dans un coin |
| `casino` | Salle de jeu, machines à sous, jetons | Un petit panneau « personnel uniquement » derrière une machine, avec un R rouge discret (la planque de la Team Rocket) |

Hors de cette liste, volontairement : les trois scènes carrées avec zones cliquables (`bourg-palette`, `labo`, `pantheon`). Nicolas a demandé de ne pas toucher à Bourg Palette, au labo du Prof. Chen ni à leurs zones ; leur décor 16:9 de combat (`kanto/bourg-palette.webp`…) reste donc à décider.

## Reste à faire côté code quand les images arrivent
- Route de Ronflex : passer `data/regions/kanto/zones.json` de `centrale.webp` à `route-de-ronflex.webp` (et la ligne correspondante de `src/core/monde.test.ts`).
- Pension : retirer `pension` de `SANS_DECOR_16_9` (`tests/decors-formats.test.ts`) ; la page Pension affiche déjà l'image quand elle existe.
- Mettre à jour `docs/projet/decors-provisoires.md` et `data/credits-images.json` (les anciennes images viennent de la V1, les nouvelles sont générées).
