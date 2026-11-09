# Décors à régénérer (ticket O)

Décision de Nicolas (09/11) : tous les décors sont refaits dans le style de la carte réaliste de Kanto (déjà en place, commit 1f8a0c5), tous en 16:9 (1920 × 1080), sans aucune bande noire ni blanche. Les 30 décors, leurs easter eggs validés un par un et le prompt complet de chacun sont dans `docs/projet/decors-prompts.md`.

## Les 30 décors
- 21 zones de combat : Route 1, Forêt de Jade, Arène d'Argenta, Mont Sélénite, Arène d'Azuria, Pont Pépite, Arène de Carmin, Cave Taupiqueur, Tunnel Rocheux, Tour Pokémon, Arène de Céladopole, Centrale, Arène de Parmanie, Sylphe SARL, Arène de Safrania, Îles Écume, Arène de Cramois'Île, Arène de Jadielle, Caverne Azurée, Route Victoire, Ligue Pokémon (une seule salle, plus de collage).
- Route de Ronflex (nouveau, centre dégagé pour le sprite et le mini-jeu de flûte) et Pension (la V1 avait une pension, `Pension.png`, jamais convertie car le recadrage 16:9 perdait 12,7 % ; on ne la reprend pas).
- Chez Blue, Chez Maman, Centre Commercial, Casino.
- À la fin : Bourg Palette, Labo, Panthéon. Ce sont des scènes carrées avec zones cliquables : une fois les versions 16:9 livrées, replacer les zones (`data/regions/kanto/scenes.json`, ratio 1:1 aujourd'hui) et refaire leurs tests.

## Méthode
1. Coller le prompt du décor dans ChatGPT et joindre la carte seule (pour le rendu). Aucune ancienne image de décor : chaque lieu est décrit d'après les jeux.
2. Enregistrer l'image sous le nom du lieu dans `assets-src/decors-chatgpt/` (ex. `route-1.png`).
3. `node scripts/preparer-decors.mjs` : recadre en 16:9, écrit `public/img/decors/<nom>.webp` en 1920 × 1080 et met `tailles.json` à jour. Il refuse un nom inconnu ou une image de moins de 1920 px de large. Option `--marge 0.105` : retire 10,5 % à droite et en bas, pour une image qui aurait un logo (inutile avec ChatGPT).
4. `tests/decors-formats.test.ts` garde le format. Pension livrée : la retirer de `SANS_DECOR_16_9`.

## À faire dans le code quand les images arrivent
- Route de Ronflex : passer `data/regions/kanto/zones.json` de `centrale.webp` à `route-de-ronflex.webp` (et la ligne correspondante de `src/core/monde.test.ts`).
- Mettre à jour `docs/projet/decors-provisoires.md` et `data/credits-images.json` (les nouvelles images sont générées, plus issues de la V1).
- Vérifier sur le premier décor livré que l'easter egg reste visible sur téléphone (le décor est coupé au centre).
