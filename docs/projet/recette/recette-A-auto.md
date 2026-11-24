# Recette A : suites automatiques (24/11/2026, branche v2)

Passe de toutes les suites automatiques. Rien n'est poussé. Aucun test supprimé, aucun `eslint-disable` ajouté.

## Bilan par suite

| Suite | Commande | Avant | Après |
|---|---|---|---|
| Typecheck | `npm run typecheck` | vert | vert |
| Build client | `npm run build` | vert (53 s) | vert (9 s, 214 entrées précache) |
| ESLint | `npx eslint .` | 11 133 erreurs (dont 6 réelles) | 0 erreur |
| Vitest | `npx vitest run` | 4 fichiers en échec sur 294 ; 4 tests en échec, 3369 passés, 1 ignoré | 296 fichiers, 3400 tests passés, 1 ignoré, 0 échec (passe complète à 3399 + 1 échec sur `images-completude`, corrigé puis relancé seul avec `ui-styles` : 9 tests verts) |
| Migrations v1→v5 | `npx vitest run tests/migration-chaine-complete.test.ts` | pas de test de la chaîne complète | 14 tests verts |
| Serveur | `npm run ci:serveur` (Postgres embarqué, `DATABASE_URL` vide : jamais la production) | typecheck OK, 14 fichiers / 112 tests verts, build serveur KO (6 erreurs TS) | tout vert |
| E2E | `npx playwright test` | ne démarrait pas (titre « PC » en double) | 664 tests : 390 passés, 168 ignorés par conception, 106 échecs (≈ 58 tests distincts, comptés deux fois mobile/pc) |

## Corrigé (commits locaux)

- e8880bb `chore(lint)` : ESLint ignorait mal `.claude/` (worktrees d'autres sessions), `dist-*`, `design/`, `docs/`. Les 6 vraies erreurs (`no-unused-vars` du cœur) passent par un helper `src/core/sans-cle.ts`.
- 1b7c764 `fix(ui)` : plus de valeur de design en dur dans `ObjectifPermanent.tsx` et `PluieBalles.tsx` (test `ui-valeurs-en-dur`).
- 00d7b6a `test` : deux tests périmés mis à jour. Import d'argent négatif : depuis caec335 la validation répare (argent ramené à 0) au lieu de refuser, le test vérifie ce comportement et que la partie d'origine reste intacte. Scans d'URL externes (`tests/ui-styles.test.ts` et `tests/images-completude.test.ts`) : ils ignorent les fichiers `*.test.ts(x)`, qui contiennent des URL d'exemple (`ErreurRendu.test.tsx`, `compte.test.tsx`) ; le code livré reste scanné.
- ae970d1 `test(e2e)` : doublon « PC » dans `accessibilite.spec.ts` qui empêchait Playwright de charger les tests.
- 3933d7c `test(sauvegarde)` : migration complète des versions 1 à 5 (régions, parties, comptes) par le vrai chemin de chargement. Vérifie version actuelle (6), champs conservés, `vus` reconstruit (Pokédex + PC sans œufs), chronos v4 convertis, idempotence.
- 9f91d0e `fix(serveur)` : `npm run build` du serveur échouait (corps d'inscription non typé dans `server/src/app.ts`).
- 915526b `fix(combat)` : `navigator.vibrate` appelé avant tout geste de la personne, Chrome le journalisait en erreur de console et faisait tomber une trentaine d'e2e mobiles. Vibration gardée par `navigator.userActivation`.
- 1391da6 `test(e2e)` : le build des e2e va dans `dist-e2e/` au lieu du `dist/` partagé (une autre session le reconstruisait en mode production, ce qui affichait l'écran titre et faisait tomber 435 tests).
- a9d7a3b `fix(casino)` : `npm run build` cassé par `useGrouping: 'min2'`, absent des types TS 5.9 (commit d'une autre session) ; conversion de type locale, 24 tests du casino verts.

## Reste rouge : e2e, ≈ 58 tests

Aucun n'a été affaibli ni supprimé. Ce sont en grande majorité des specs périmées par les refontes d'interface des lots 1 à 6 (les sélecteurs ne trouvent plus l'élément), pas des régressions de jeu constatées. Chaque cas doit être vérifié contre l'écran actuel avant mise à jour.

| Cause | Specs |
|---|---|
| Boutique refaite (boutons « − : diminuer », « + : augmenter », « +10 », « Max », « Acheter ×1 : 200 ₽ », statut « Quantité ») ; les specs cherchent « Plus » et « Acheter ×2 » | boutique ×3, centre-pc ×5 résolutions, centre:76 |
| Navigation entre zones : « Zone suivante » n'existe plus, remplacé par « Précédent : … » / « Suivant : … » | combat:109 et :239, intro ×2, navigation-centre, bourg-palette |
| Capture : sur PC la balle est une plaque « Pokéball ×5, changer de balle », plus un bouton par balle (`tests-e2e/aide-combat.ts`) | capture ×6, combat-equipe-pc ×2, equipe:63 |
| Annonce de déblocage : `[data-annonce-deblocage] [data-annonce-carte]` introuvable | casino-visibilite ×2, pension-visibilite ×3 (+ iphone, + variante PC) |
| Dialogue de scène : le sélecteur « bouton du dialogue » résout deux éléments (mode strict) ; Centrale : `[data-forme="Route de Ronflex"]` introuvable | scenes ×7 |
| Autres sélecteurs périmés | sac (« PC de Léo »), stats ×2 (région « Pokémon vaincus »), carte:68 (`[data-vol-overlay]`), etats-pc (`.barre-laterale kbd.touche-pc`), combat-equipe-pc (`.pc-places > button`), accessibilite:90 (axe « Statistiques » sur PC), coquille-pc:20, pc:144, objets-actifs ×3, casino:58 et centre:65 (bouton « Céladopole »), pension ×2, combat:80 et :231 |

À examiner : possibles défauts réels, notés sans correction (CSS et mise en page hors périmètre de cette passe) :
- `ecrans-pc.spec.ts` Réglages à 1280×800 et 1440×900 : « la zone de contenu défile en hauteur ».
- `pension-visibilite.spec.ts:139` : « bas d'une carte à 1280×800 ».
- `fluidite.spec.ts:4` (mobile) et `coquille-pc.spec.ts:20` (largeur de la barre latérale) : à confirmer contre DESIGN.md.
- `accessibilite.spec.ts:90` : erreur axe sur « Statistiques » (contraste, nom ou rôle) : probable vrai défaut d'accessibilité.

## Pièges d'environnement trouvés

- `dist/` est partagé entre sessions et réécrit par n'importe quel build : les e2e utilisent maintenant `dist-e2e/`.
- `tsc -b`, lancé par le démarrage Playwright, échoue dès qu'un commit d'une autre session casse le typage (cas `jeux-casino.ts`), et Playwright répond seulement « webServer was not able to start ».
- Les builds e2e embarquent le travail non committé des autres sessions : un échec peut venir d'un état intermédiaire d'autrui.
- Un run e2e complet dure environ 2,2 h (664 tests, 1 worker).
- La version 0 d'une partie n'est plus migrable (« Migration manquante ») : choix assumé, couvert par `migrations.test.ts`.

## Suite proposée

Mettre à jour les ≈ 58 specs périmées en session dédiée, par famille de cause (boutique, navigation, capture, annonces, scènes), en rejouant chaque famille seule avant un run complet. Coût estimé : plusieurs heures de travail et au moins un run complet de 2 h pour la preuve finale.
