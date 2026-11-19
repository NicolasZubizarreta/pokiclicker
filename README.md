# PokiClicker

Jeu clicker Pokémon pour PC et mobile, construit avec React et TypeScript.
Le cœur du jeu reste en TypeScript pur dans `src/core` ; les données sont en JSON dans `data/`.

Avec Node.js 22 et npm :

```bash
npm ci
npm run dev
npm run ci
```

`npm run dev` lance le serveur de développement du jeu (Vite, pas l’API) ; `npm run ci` vérifie les types, les règles de code, les tests et la construction.

Carte du dépôt :

- `src/` : le jeu (`src/core` cœur pur, `src/ui` interface) ; `data/` : contenus JSON ; `public/` : images et sons ;
- `server/` : API de comptes et de sauvegardes en ligne (Hono, Better Auth, Postgres), avec son propre `package.json` ; `npm run ci:serveur` la vérifie (types, tests, build), voir `server/README.md` ;
- `scripts/` : outils de données et d’audit (génération, extraction depuis la V1) ;
- `tests/` et `tests-e2e/` : tests du jeu ; `docs/` : vision, plan, backlog ; `legacy/` : la V1.

Voir la [vision du jeu](docs/vision.md), le [plan de développement](docs/plan.md)
et la [V1 dans legacy/](legacy/), conservée en lecture seule.
