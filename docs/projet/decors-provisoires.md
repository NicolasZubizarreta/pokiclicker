# Décors de Kanto

**Plus provisoires depuis le 09/11 (ticket O).** Les 30 décors sont des images générées avec ChatGPT, dans le style de la carte réaliste de Kanto, validées une à une par Nicolas avec leur easter egg (liste et prompts : `docs/projet/decors-prompts.md`). Elles remplacent les décors de la V1 (qui portaient le logo Gemini et des bandes noires).

- Sources : `assets-src/decors-chatgpt/<lieu>.png` (1672 × 941, ignoré par git).
- Sorties : `public/img/decors/<lieu>.webp`, 1920 × 1080 (agrandissement de 15 %, qualité WebP 82, 400 Ko en moyenne, 605 Ko au plus), par `node scripts/preparer-decors.mjs --min-largeur 1600`.
- Les zones cliquables de Bourg Palette, Chez Maman, Chez Blue et du Labo sont dans `data/regions/kanto/scenes.json` (images 16:9, plus de recadrage).
- Le Panthéon utilise `decors/pantheon.webp` ; la position des six Pokémon est dans `data/pantheon-scene.json` (x, y et tailles en largeurs d'image), les délais et textes V1 restent dans `data/pantheon.json`. Sur écran de moins de 768 px, les sprites sont agrandis de 30 % et les étiquettes passent sous l'image, sur trois rangées.
- Les anciennes scènes carrées (`scenes/bourg-palette.webp`, `labo.webp`, `pantheon.webp`) sont supprimées.

## Reste
- Vérifier la visibilité des easter eggs sur téléphone (le décor y est coupé au centre).

## Hors connexion
Seul le décor de la Route 1 est préchargé avec l'application (`vite.config.ts`, `workbox.globIgnores`). Les autres décors, les artworks et l'animation de Roucarnage entrent dans le cache à leur première vue (`CacheFirst`, cache `images-lourdes-<hash>`) : le nom du cache change quand un fichier de ces dossiers change (hash dans `vite.config.ts`), et `src/pwa/nettoyer-caches.ts` supprime les anciens au démarrage, donc un décor remplacé n'est plus servi depuis l'ancienne copie. Un décor jamais affiché en ligne n'est pas disponible hors connexion. Précharger les 30 décors (≈ 12 Mo) ralentirait l'installation du service worker.
