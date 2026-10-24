# Décors provisoires de Kanto

**PROVISOIRE : à remplacer par les décors régénérés de la phase 5.** Ils viennent de la V1 (`legacy/img/kanto/background/`), recadrés au centre en 16:9 par `scripts/preparer-decors-v1.mjs`, puis convertis en WebP 1920 × 1080 par `scripts/traiter-images.mjs`. Les sources préparées sont dans `assets-src/decors/` (ignoré par git), les sorties dans `public/img/decors/`.

Règle du script : recadrage central en largeur seulement, refus si l'image est plus étroite que 16:9 ou si la perte de bord dépasse 10 % (`data/images.json`, `decor.perteMax`).

## Recadrés (24 décors utilisables)
| Décor | Source V1 | Perte de bord |
|---|---|---|
| route-1 | Zone 1 | déjà préparé en phase 1 (2730 × 1536), conservé |
| foret-de-jade, arene-d-argenta, mont-selenite | Zone 2 à 4 (2816 × 1536) | 3,03 % |
| arene-d-azuria, pont-pepite, arene-de-carmin, tunnel-rocheux, tour-pokemon, arene-de-celadopole, centrale, arene-de-parmanie, sylphe-sarl, arene-de-safrania, iles-ecume, arene-de-cramois-ile, arene-de-jadielle, caverne-azuree, route-victoire, ligue-pokemon | Zone 5 à 7, 9 à 21 (2784 × 1536) | 1,92 % |
| centre-commercial, casino | CentreCommercial, Casino (2784 × 1536) | 1,92 % |

## Agrandis (source plus petite que 1920 × 1080, donc plus flous)
- **cave-taupiqueur** (Zone 8, 1392 × 768) : perte de bord 1,92 %, agrandi d'environ ×1,4.
- **chez-maman** (1201 × 656) : perte de bord 2,90 %, agrandi d'environ ×1,6.

## Refusés (pas de décor 16:9 pour l'instant)
Ces fichiers sont plus étroits que 16:9 ou carrés : les rendre 16:9 obligerait à couper plus de 40 % de l'image, ou à ajouter des bandes. Aucun écran actuel ne les affiche. Leur ticket choisit la solution (nouvelle image, fond étendu, affichage dans un cadre).

| Décor | Source V1 | Dimensions | Ticket |
|---|---|---|---|
| bourg-palette | Zone 0 | 2048 × 2048 | P (intro et lieux de départ) |
| labo | LaboPokemon | 2048 × 2048 | P |
| chez-blue | Chez Blue | 1053 × 692 | P |
| pension | Pension | 2383 × 1536 (perte de 12,7 %) | T (pension) |
| pantheon | Pantheon | 1024 × 1024 | R (Panthéon) |

## Défauts constatés dans les images de la V1 (non corrigés, à traiter en phase 5)
- Une **étincelle** (filigrane d'outil d'image) est incrustée dans l'angle en bas à droite de chaque décor.
- Des **bandes noires** entourent certains décors (cave-taupiqueur, mont-selenite, ligue-pokemon, chez-maman) : la V1 les affichait déjà ainsi. Ligue-pokemon est un assemblage de plusieurs salles, chez-maman un plan à découpes noires.

## Hors connexion
Seul le décor de la Route 1 est préchargé avec l'application (`vite.config.ts`, `workbox.globIgnores`). Les autres décors, les artworks et l'animation de Roucarnage entrent dans le cache à leur première vue (`CacheFirst`, cache `images-lourdes`) : un décor jamais affiché en ligne n'est pas disponible hors connexion. Précharger les 24 décors (≈ 4 Mo) dépassait le délai d'activation du service worker et ralentissait le jeu pendant son installation (test de fluidité).
Carte de Kanto reprise telle quelle de la V1 pour le ticket G, à régénérer en phase 5.

