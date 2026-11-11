# Habillages de la charte Pokémon (ticket A, phase 4.5)

Dix habillages appliqués par CSS sur la vraie interface, sans rien déplacer. Historique des rondes ; **le skin 9 est retenu et porté dans les jetons** (`design/charte.json`, `design/regions.json`, `src/ui/Plaques.css`, `src/styles/index.css`). Depuis, le skin 0 (rendu du code de `dist/`) montre la charte retenue.

Lancer : `npm run build` puis `node design/variantes/charte-pokemon/serveur.mjs`, ouvrir http://localhost:4180/ et appuyer sur 0 à 9 (le bouton 10 en bas). Les liens `?skin=2` marchent aussi.

| n° | Nom | Base relevée | Ronde | Allure |
|---|---|---|---|---|
| 1 | Poké Ball | pokemon.com/fr (10/11) | 1 | contours anthracite francs, rouge et jaune, fond crème |
| 2 | Écarlate | scarletviolet.pokemon.com (10/11) | 1 | boutons bonbon ronds, jaune et rose, fond crème |
| 3 | Aventure | pokemongolive.com (10/11) | 1 | nuit bleu marine, vert menthe, pilules à contour |
| 4 | Home | home.pokemon.com (10/11) | 1 | blanc verdi, vert HOME, grands arrondis |
| 5 | Showdown | client.css de Showdown (11/11) | 2 | clair, dégradés gris, boutons à relief |
| 6 | Pokédex | pokemon.com/fr/pokedex (11/11) | 2 | clair, rouge Pokédex |
| 7 | Menu de jeu | non mesuré | 2 | cadres de menu de jeu, fond clair |
| 8 | Logo nuit | logo Pokémon via Bulbapedia | 3 | sombre, bleu et jaune du logo |
| **9** | **Pokédex rouge** | pokemon.com/fr/pokedex (11/11) | 3 | **sombre, plat, barre latérale rouge, bande jaune : retenu** |
| 10 | Violet nuit | scarletviolet.pokemon.com (11/11) | 3 | violet profond, jaune et rose |

Retours de Nicolas : ronde 1 « les choix des couleurs sont pas beau… les styles de bouton soit trop IA soit bugué » ; ronde 2 « beaucoup trop pauvre en couleur… je n'aime pas les trucs clair je suis toujours en dark mode » ; ronde 3 « pokédex j'aime bien » (sans ligne bleue sur le haut des boutons ni ombre basse), puis « nan ça me va en vrai ».

Cause du rendu « gris à doubles bordures » : `.cadre` empilait trois lignes (bordure, anneau de fond, anneau d'argent), `.plaque` ajoutait bordure et ombre dure, les rayons valaient 0, et fond / surface / surface-2 étaient trois gris proches.

`commun.css` applique les variables `--sk-*` aux composants ; chaque `skin-N.css` ne pose que des couleurs, rayons et bordures.
