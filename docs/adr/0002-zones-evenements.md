# ADR 0002 — Zones en graphe, événements en données

**Statut : accepté — décidé par Nicolas le 23/10/2026.** Deux points restent ouverts pour la phase 2 (voir ci-dessous).

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
4. **Événements** dans `data/regions/<region>/evenements.json` : `{ id, declencheur, si, etapes[] }`. Déclencheurs : `entree-zone`, `boss-vaincu`, `objet-utilise`, `debut-partie`. Étapes : `dialogue` (locuteur, texte, `pose` facultative : identifiant de l'image du locuteur, ex. `chen-2`), `combat` (rival, boss), `donner` (objet, Pokémon), `poser-drapeau`, `deplacer`. Un événement ne se joue qu'une fois sauf indication contraire ; le drapeau « déjà joué » est dans la sauvegarde de la région (ADR 0001).
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

## Précisions de la saisie de Kanto (ticket C, 24/10/2026)
- **Carte** (ticket G) : le bloc `carte` est à la racine du fichier : `{ image, ratio: [16, 9], formes }` ; il précise le point 2.
  Les formes sont ordonnées comme `MAP_DATA` : `{ zone, nom, teinte, forme, … }`, avec `zone` = id V2 ou `null` pour les lieux non jouables.
  `forme` vaut `rect` (`x,y,l,h`), `cercle` (`x,y,r`) ou `polygone` (`points: [[x,y],…]`).
  Toutes les coordonnées sont des fractions de l'image : x et l sur la largeur, y et h sur la hauteur ; `r` est une fraction de la largeur.
- **Zone sans combat** : Bourg Palette (zone 0 de la V1, sans ennemi) est un nœud du graphe marqué `"sansCombat": true`, sans `niveaux`, `etapes`, `sauvages` ni `boss`. C'est le `depart` du monde ; `premierCombat` (`kanto.route-1`) désigne la première zone où l'on se bat et fournit la zone de départ par défaut de `creerPartie`. La scène d'ouverture reste au ticket O. Un `message` facultatif, non vide, décrit les zones sans combat. Le moteur distingue `monde.zone(id)` (tout nœud) de `monde.zoneDeCombat(id)` (lève « Zone sans combat : <id> »).
- **Accès aux zones** : `accesZone(vers, etat)` autorise toute zone déjà ouverte, y compris lors d'un retour. Sinon, il réutilise `peutPasser` depuis `zonePrecedente(vers)`, la première zone dans l'ordre des données dont un lien mène à la destination, et renvoie la raison du refus en français.
- **Type de zone** : `type` vaut `"arene"` (zones des badges de la V1, `BADGES[].zoneIdx`) ou `"ligue"`. Un type inconnu est refusé (« Type de zone inconnu : <x> »).
- **Ligue** : `sauvages` vide, `adversaires` (les neuf combats qui précèdent) et `boss` (le dixième, Maître Blue) ; `etapes - 1` doit égaler le nombre d'adversaires (« Adversaires de la Ligue invalides : <id> »). Son déroulé en jeu relève du ticket Q.
- **Lieux spéciaux** (précise le point 7) : les sept lieux de la V1 à indices négatifs ne sont ni des zones ni, pour l'instant, des événements. Ils sont listés dans `lieux` (`lieu`, `nom`, `decor`, `ancienId`, `depuis`, `si?`) ; `depuis` est la zone d'où l'on y accède, `si` la condition de la V1. Les tickets qui en ont besoin (pension, labo, panthéon, casino…) les lisent ; les scènes d'introduction restent des événements `debut-partie` (ticket O).
- **Validation** (complète le point 6) : `premierCombat` doit être une zone de combat, un lieu est unique et part d'une zone existante, sa condition est valide.
- **Génération** : `data/regions/kanto/zones.json` est produit par `scripts/extraire-zones-v1.mjs`, qui exécute le code de la V1 ; la copie brute `tests/fixtures/v1-zones.json` sert aux tests de fidélité (`src/core/monde-fidelite.test.ts`). Les conditions d'accès des lieux sont écrites à la main, avec la ligne de la V1 citée en commentaire ; le message de Bourg Palette est un contenu supplémentaire propre à la V2. Le champ `carte` n'est pas saisi ici (ticket G).

## Points laissés ouverts (phase 2)
- Le combat de Ronflex avant le passage, ou le réveil seul ? L'exemple ci-dessus fait les deux ; à confirmer en saisissant Kanto.
- Les combats de rival, obligatoires ou facultatifs ? À reprendre de la V1.

## Conséquences
- Ajouter une région = ajouter des fichiers JSON ; le moteur ne change pas.
- La carte du monde et la carte de région lisent les mêmes positions en fractions.
- Un test vérifie le graphe de chaque région (chemin jusqu'à la Ligue).
- Tickets concernés : E (graphe et Route 1), puis phase 2 (saisie de tout Kanto).
