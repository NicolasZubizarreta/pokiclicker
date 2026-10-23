# PokiClicker

Jeu clicker Pokémon pour PC et mobile, construit avec React et TypeScript.
Le cœur du jeu reste en TypeScript pur dans `src/core` ; les données sont en JSON dans `data/`.

Avec Node.js 22 et npm :

```bash
npm ci
npm run dev
npm run ci
```

`npm run dev` lance le serveur local ; `npm run ci` vérifie les types, les règles de code, les tests et la construction.

Voir la [vision du jeu](docs/vision.md), le [plan de développement](docs/plan.md)
et la [V1 dans legacy/](legacy/), conservée en lecture seule.
