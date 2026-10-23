# ADR 0002 — Zones en graphe, événements en données

**Statut : proposé le 23/10/2026, en attente de la validation de Nicolas.**

## Contexte
- En V1, les zones sont un tableau `ZONES` linéaire (`legacy/js/regions/kanto.js`, `legacy/js/data/constants.js`) : identifiant numérique, nom, décor, niveaux mini et maxi, liste de Pokémon sauvages (`rarity`, `spawnRate`, `catchRate`), boss (`name`, `id`, `level`, `catchRate`). La progression suit `unlockedZone` et les badges (`BADGES[].zoneIdx`). Le multiplicateur de PV par zone est une table à part (`ZONE_MULT`). Les positions cliquables de la carte sont en **pixels** (`MAP_DATA`), d'où les décalages quand l'image change de taille. Les scènes d'introduction sont de « fausses zones » à indices négatifs (−7 à −1).
- Il n'y a **aucun Ronflex bloquant ni Pokéflûte** dans la V1 : Ronflex n'y est qu'un Pokémon sauvage rare. Ce comportement est nouveau en V2 (`docs/vision.md`).
- Le projet veut « tout est donnée » : une région s'ajoute sans toucher au code.

## Options écartées
- **Liste linéaire avec un seul « zone débloquée »** : ne sait pas exprimer deux chemins, un passage bloqué par un objet ou une quête.
- **Événements écrits en code** (comme les `chenChallenge*` de la V1) : chaque scène demande du code et des drapeaux ad hoc dans l'état.
- **Positions de carte en pixels** : cause des défauts de la V1.

## Décision
1. **Une zone = un nœud d'un graphe**, décrite en JSON sous `data/regions/<region>/zones.json`. Identifiants en **texte** (`kanto.route-1`) ; l'ancien numéro V1 est gardé dans `ancienId` pour reporter les règles.
2. **Format d'une zone** :
```json
{
  "id": "kanto.route-1",
  "nom": "Route 1",
  "decor": "kanto/route-1.webp",
  "niveaux": [2, 5],
  "etapes": 10,
  "multiplicateurPv": 1,
  "sauvages": [
    { "pokemon": 19, "rarete": "commun", "apparition": 0.3, "capture": 255 },
    { "pokemon": 16, "rarete": "commun", "apparition": 0.3, "capture": 255 }
  ],
  "boss": { "pokemon": 19, "nom": "Rattata (Géant)", "niveau": 6, "capture": 0 },
  "liens": [
    { "vers": "kanto.foret-de-jade", "si": { "type": "boss", "zone": "kanto.route-1" } }
  ],
  "carte": { "x": 0.17, "y": 0.72, "forme": "rect", "l": 0.03, "h": 0.05 },
  "ancienId": 1
}
```
   `multiplicateurPv` remplace `ZONE_MULT`. `carte` est en **fractions de l'image** (0 à 1), jamais en pixels. `etapes` vaut 10 : la dixième est le boss.
3. **Conditions de passage** (`si`, sur un lien ou sur une zone) : `badge`, `boss` (zone dont le boss est vaincu), `objet` (objet-clé possédé), `quete` (terminée), `drapeau` (posé par un événement). Combinables par `tous`, `un_parmi` et `non`. Évaluées par une fonction pure `peutPasser(condition, etat)` qui renvoie aussi la **raison lisible en français** quand c'est refusé.
4. **Événements** dans `data/regions/<region>/evenements.json` : `{ id, declencheur, si, etapes[] }`. Déclencheurs : `entree-zone`, `boss-vaincu`, `objet-utilise`, `debut-partie`. Étapes : `dialogue` (locuteur, texte), `combat` (rival, boss), `donner` (objet, Pokémon), `poser-drapeau`, `deplacer`. Un événement ne se joue qu'une fois sauf indication contraire ; le drapeau « déjà joué » est dans la sauvegarde de la région (ADR 0001).
5. **Exemple Ronflex et Pokéflûte** (deux événements, illustratifs : les noms de routes sont à confirmer en phase 2) :
```json
{
  "id": "kanto.ronflex-route-12",
  "declencheur": { "type": "entree-zone", "zone": "kanto.route-12" },
  "si": { "non": { "type": "drapeau", "id": "ronflex-reveille" } },
  "etapes": [
    { "type": "dialogue", "locuteur": "narration", "texte": "Ronflex dort en travers du chemin." },
    { "type": "bloquer", "lien": "kanto.route-12>kanto.route-13" }
  ]
}
{
  "id": "kanto.flute-reveille-ronflex",
  "declencheur": { "type": "objet-utilise", "objet": "pokeflute", "zone": "kanto.route-12" },
  "etapes": [
    { "type": "poser-drapeau", "id": "ronflex-reveille" },
    { "type": "combat", "pokemon": 143, "niveau": 30, "capture": 25 }
  ]
}
```
6. **Validation au chargement** : identifiants uniques, liens vers des zones existantes, un chemin depuis la zone de départ vers chaque zone, conditions connues. Un fichier invalide fait échouer le chargement avec un message en français (« Zone inconnue : kanto.route-99 »).
7. **Les scènes d'introduction** de la V1 (zones −7 à −1) deviennent des **événements** de type `debut-partie`, pas des zones.

## Points à trancher par Nicolas
- Le combat de Ronflex arrive-t-il **avant** de pouvoir passer, ou le réveil libère-t-il juste le passage ? (L'exemple ci-dessus fait les deux : combat puis passage ouvert.)
- Les combats de rival sont-ils obligatoires (bloquants) ou facultatifs ? (À reprendre depuis la V1 en phase 2.)

## Conséquences
- Ajouter une région = ajouter des fichiers JSON ; le moteur ne change pas.
- La carte du monde et la carte de région lisent les mêmes positions en fractions.
- Un test vérifie le graphe de chaque région (chemin jusqu'à la Ligue).
- Tickets concernés : E (graphe et Route 1), puis phase 2 (saisie de tout Kanto).
