# ADR 0007 — Migrer par petites tranches (atelier 6)

**Statut : accepté — décidé par Nicolas le 19/11/2026.**

## 1. Le projet
PokiClicker v2 : un clicker Pokémon en React et TypeScript, avec un serveur. Il est assez gros : 52 fichiers pour les règles du jeu, 153 pour l'interface, un serveur à part et plus de 200 fichiers de tests.

## 2. L'architecture actuelle
- Les règles du jeu sont dans `src/core`, en TypeScript pur. ESLint interdit d'y mettre React ou le navigateur.
- Les écrans sont dans `src/ui`.
- Le contenu (zones, Pokémon, événements) est en JSON dans `data/`.
- Le serveur est séparé : il ne partage avec le jeu que le format de sauvegarde.

Deux problèmes :
- `store.ts` fait 1345 lignes et orchestre presque tout le jeu.
- `regions.ts` est importé par 61 fichiers et connaît Kanto par son nom. Ajouter Johto obligerait à tous les retoucher.

Le détail est dans l'ADR 0006.

## 3. Le choix de changement
Trois options :
- **Ne rien changer.** Les problèmes restent.
- **Tout migrer d'un coup.** C'est 5 à 9 jours d'après les estimations de mes ateliers 2 et 3, et ça touche la partie la plus risquée du code.
- **Migrer petit à petit.** On fait une tranche à la fois, et les tests existants doivent rester verts.

Nous retenons la troisième. Raisons : le TP dure 2 heures, et les 3169 tests sont notre filet de sécurité, on ne veut pas le casser.

## 4. La migration faite
**Atelier 4 : la région en dépendance.** La carte de Kanto reçoit sa région au lieu de l'importer. Un seul fichier, `composition-root.ts`, choisit la région à charger.

**Atelier 3 : le pattern State sur la synchro.**
- Avant : l'état de la synchro (`statut`) et un booléen (`bloque`) étaient changés à la main, ensemble, à une vingtaine d'endroits. Ils pouvaient ne plus être d'accord.
- Après : il n'y a qu'une variable. Toutes les règles de changement d'état sont dans un fichier, `src/ui/etat-synchro.ts`. « Bloqué » se calcule à partir de l'état.

Preuve : les anciens tests de la synchro passent sans modification (141 tests avec ceux de l'application). `tsc` et ESLint sont propres. La suite complète donne 3169 tests réussis et 3 échecs qui existaient déjà avant.

## 5. Problèmes, ce qui n'est pas fait, avantages et inconvénients

**Problèmes rencontrés**
- Le chargement à la demande des régions ne fait gagner aucun temps pour l'instant : d'autres fichiers importent encore les JSON de Kanto en dur.
- Les tests d'écrans reçoivent la région par un fichier d'amorçage, pas par un vrai Provider comme le cours le conseille. C'est un raccourci pour ne pas réécrire 20 fichiers de tests.
- Deux changements de comportement dans la synchro, que les tests ne vérifient pas : après un arrêt puis un redémarrage, l'état « refusé » repasse à « inactif ». Et une coupure réseau pendant un envoi ne remplace plus l'état « conflit ». Je ne les ai pas essayés avec un vrai serveur.
- Les chiffres de mes anciens documents ont changé depuis (62 importeurs annoncés, 61 mesurés).

**Ce qui n'est pas fait, et pourquoi** (tout va au backlog)
- Façade sur le store (2 à 4 jours) : la fonction `traiter` modifie une quarantaine de variables, c'est trop risqué pour 2 heures.
- Strategy sur la fin de boss (2 à 3 jours) : elle touche la même fonction que la Façade, on ne fait pas les deux en même temps.
- Adapter pour le serveur : le même appel HTTP est copié à quatre endroits, pas eu le temps.
- Conversion des 61 fichiers qui importent `regions.ts` : trop de fichiers pour un jour, et `store.ts` est trop gros pour être modifié sans conflit avec les autres sessions. À faire avant Johto.
- Identifiants `kanto.*` écrits en dur (42 occurrences dans 7 fichiers).

**Avantages**
- Les règles de la synchro sont à un seul endroit et se testent sans réseau (18 cas).
- Une variable de moins qui pouvait se tromper.
- Johto pourra être ajoutée sans retoucher la carte.
- Chaque tranche se relit et se retire seule.

**Inconvénients**
- Deux styles de code côte à côte jusqu'à la fin de la migration.
- Un fichier de plus à lire pour suivre une réponse du serveur.
- Le gain de performance des régions n'existe pas encore.

## À revoir si
- Une deuxième région est ajoutée : la conversion de `regions.ts` passe en premier.
- `store.ts` dépasse 2000 lignes : la Façade passe devant.
- Les deux changements de comportement de la synchro posent problème : il faudra alors un état en plus au lieu d'une valeur déduite.
