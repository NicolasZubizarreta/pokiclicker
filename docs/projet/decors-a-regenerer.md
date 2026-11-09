# Décors à régénérer (ticket O)

Décision de Nicolas (09/11) : tous les décors sont refaits dans le style de la carte réaliste de Kanto (déjà en place, commit 1f8a0c5), tous en 16:9 (1920 × 1080), sans aucune bande noire ni blanche. Les 30 décors, leurs easter eggs validés un par un et le prompt complet de chacun sont dans `docs/projet/decors-prompts.md`.

## Les 30 décors
- 21 zones de combat : Route 1, Forêt de Jade, Arène d'Argenta, Mont Sélénite, Arène d'Azuria, Pont Pépite, Arène de Carmin, Cave Taupiqueur, Tunnel Rocheux, Tour Pokémon, Arène de Céladopole, Centrale, Arène de Parmanie, Sylphe SARL, Arène de Safrania, Îles Écume, Arène de Cramois'Île, Arène de Jadielle, Caverne Azurée, Route Victoire, Ligue Pokémon (une seule salle, plus de collage).
- Route de Ronflex (nouveau, centre dégagé pour le sprite et le mini-jeu de flûte) et Pension (la V1 avait une pension, `Pension.png`, jamais convertie car le recadrage 16:9 perdait 12,7 % ; on ne la reprend pas).
- Chez Blue, Chez Maman, Centre Commercial, Casino.
- À la fin : Bourg Palette, Labo, Panthéon. Fait le 09/11 : zones cliquables replacées (`data/regions/kanto/scenes.json`) et socles du Panthéon recalés (`data/pantheon-scene.json`), tests refaits. Ticket O terminé.

## Easter eggs changés après les tests (09/11)
Prompts à jour dans `decors-prompts.md` pour : Pension (œuf de Yoshi bien démarqué), Chez Maman (Super Nintendo + Luxo Jr., plus de lettre), Centre Commercial (Où est Charlie), Panthéon (étoile CHEN du Walk of Fame, correction de l'image existante). Chez Blue (bandeau de Konoha rayé, Sasuke) et Arène de Safrania (Cerebro flottant au-dessus du fauteuil du Professeur X) validés aussi. Jadielle (mallette de Pulp Fiction) validé aussi. Livrés et convertis le 09/11 : Safrania, Jadielle, Pension, Chez Blue, Chez Maman (écran et bouton de la télé recalés dans `scenes.json`), Centre Commercial. Panthéon livré et converti le 09/11 (étoile rouge « CHEN » au contour jaune et à la Poké Ball dorée ; composition inchangée, socles de `data/pantheon-scene.json` toujours bons ; ChatGPT avait refusé le premier prompt à cause de la photo d'une étoile avec un nom réel). Tous les décors sont à jour. Les images sont à refaire par Nicolas dans ChatGPT puis à repasser par `scripts/preparer-decors.mjs`.

## Méthode
1. Coller le prompt du décor dans ChatGPT et joindre la carte seule (pour le rendu). Aucune ancienne image de décor : chaque lieu est décrit d'après les jeux.
2. Enregistrer l'image sous le nom du lieu dans `assets-src/decors-chatgpt/` (ex. `route-1.png`).
3. `node scripts/preparer-decors.mjs` : recadre en 16:9, écrit `public/img/decors/<nom>.webp` en 1920 × 1080 et met `tailles.json` à jour. Il refuse un nom inconnu ou une image de moins de 1920 px de large. Option `--marge 0.105` : retire 10,5 % à droite et en bas, pour une image qui aurait un logo (inutile avec ChatGPT).
4. `tests/decors-formats.test.ts` garde le format. Pension livrée : la retirer de `SANS_DECOR_16_9`.

## À faire dans le code quand les images arrivent
- Route de Ronflex : passer `data/regions/kanto/zones.json` de `centrale.webp` à `route-de-ronflex.webp` (et la ligne correspondante de `src/core/monde.test.ts`).
- Mettre à jour `docs/projet/decors-provisoires.md` et `data/credits-images.json` (les nouvelles images sont générées, plus issues de la V1).
- Vérifier sur le premier décor livré que l'easter egg reste visible sur téléphone (le décor est coupé au centre).
