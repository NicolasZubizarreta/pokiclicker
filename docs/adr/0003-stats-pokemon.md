# ADR 0003 — Stats des Pokémon : formule, surcharges et données générées

**Statut : proposé le 23/10/2026, en attente de la validation de Nicolas.**

## Contexte
- La V1 utilise deux tables écrites à la main, `BASE_STATS` (puissance d'attaque) et `BASE_HP` (PV), pour les 151 Pokémon (`legacy/js/data/constants.js`). Le DPS d'un Pokémon vaut `BASE_STATS × niveau / 5`, puis des bonus (`legacy/js/game/stats.js`). Les PV d'un ennemi valent `BASE_HP × niveau × 2 × multiplicateur de zone`, fois 4 pour un boss (`legacy/js/game/combat.js`).
- Il y a 1 025 Pokémon à couvrir jusqu'à Paldea : les écrire à la main n'est pas tenable.
- **Mesure faite le 23/10** en comparant les tables de la V1 aux stats de base de PokeAPI pour les 151 Pokémon :
  - `BASE_STATS = ⌊somme des 6 stats de base ÷ 4⌋` pour **143 Pokémon sur 151**. Les 8 autres sont des réglages à la main : Papillusion (118), Triopikeur (101), Canarticho (77), Doduo (92), Électrode (120), Noadkoko (130), Hypocéan (135) et Magicarpe (5, volontairement faible).
  - `BASE_HP` n'a **pas de formule simple** : la meilleure approximation trouvée, `0,33 × PV + 0,30 × Défense + 0,30 × Déf. Spé. + 10`, s'écarte de 4,6 points en moyenne et de 22 au pire. Ces valeurs sont des réglages à la main.

## Options écartées
- **Tout recalculer par une formule** : changerait le jeu de Kanto (« un écart avec la V1 est un bug », `CLAUDE.md`).
- **Tout écrire à la main** : impossible pour 1 025 Pokémon.
- **Appeler PokeAPI pendant le jeu** : interdit (aucune ressource externe au chargement).

## Décision
1. **Données de base** (`data/pokemon.json`, **générées**, jamais éditées à la main) : pour chaque Pokémon : numéro, nom français, types, les six stats de base, évolution, génération. Source : PokeAPI, interrogée seulement par le script `scripts/generer-pokemon.mjs` (jamais par le jeu). Lancer le script deux fois donne le même fichier, octet pour octet.
2. **Puissance (DPS)** : `puissance = ⌊(PV + Att + Déf + AttSpé + DéfSpé + Vit) ÷ 4⌋`. C'est la règle de la V1 pour 143 Pokémon sur 151, étendue à tous.
3. **PV de base** : `pv = ⌊0,33 × PV + 0,30 × Déf + 0,30 × DéfSpé + 10⌋` pour les Pokémon des régions **nouvelles** (les coefficients sont réglables dans `data/reglages.json`, pas en dur).
4. **Surcharges** (`data/surcharges-stats.json`, **écrites à la main**) : une liste `{ "pokemon": 129, "puissance": 5, "pv": 20, "raison": "Magicarpe volontairement faible (V1)" }`. Elles portent : les 8 écarts de puissance ci-dessus et **les PV des 151 de Kanto repris tels quels de la V1**. Le jeu lit la surcharge si elle existe, sinon la formule. Un Pokémon de Kanto garde donc exactement son comportement de la V1.
5. **DPS et PV d'ennemi** gardent les formules de la V1 (ADR de combat, ticket D) : `DPS = puissance × niveau ÷ 5 × bonus` et `PV ennemi = pv × niveau × 2 × multiplicateurPv`, fois le coefficient de boss lu dans `data/reglages.json`.
6. **Le script échoue** (et n'écrit rien) s'il manque le nom français d'un Pokémon : il n'écrit jamais un nom anglais dans le jeu.
7. **Test de non-régression** : pour 10 Pokémon de Kanto figés, `puissance` et `pv` du jeu sont identiques aux valeurs de la V1.

## Points à trancher par Nicolas
- Les coefficients de la formule des PV sont une **approximation** de ce que la V1 faisait à la main : à ajuster au simulateur d'équilibrage (phase 3) pour Johto et les régions suivantes.
- Les 8 écarts de puissance sont-ils voulus (réglages d'équilibrage) ou des restes à corriger ? Par défaut ils sont gardés.

## Conséquences
- Ajouter une génération = relancer le script avec un autre intervalle de numéros.
- La table de surcharges reste courte pour les nouvelles régions et devient l'outil d'équilibrage fin.
- Tickets concernés : C (modèle et stats), D (combat), phase 3 (équilibrage).
