# ADR 0007 — Migrer vers les patterns du cours par tranches, pas d'un seul coup

**Statut : accepté — décidé par Nicolas le 19/11/2026.** Suite de l'ADR 0006 (architecture actuelle), pour l'atelier 6 du cours SOLID Architecture. Il s'appuie sur `docs/anti-patterns.md` (atelier 1), `docs/patterns-creation-structure.md` (atelier 2), `docs/patterns-comportement.md` (atelier 3) et `docs/atelier-4-di.md` (atelier 4).

## Contexte et problème
Les quatre premiers ateliers ont produit un diagnostic, quatre patterns proposés (Façade sur le store, Adapter sur le serveur, State sur la synchro, Strategy sur la fin de boss) et une injection de dépendances sur les régions. Seule la DI a du code. L'atelier 6 demande de choisir une direction d'architecture, de la documenter et de migrer.

Les points qui font mal, d'après l'ADR 0006 : `store.ts` (1345 lignes, 21 % des commits qui touchent `src`), `regions.ts` figé sur Kanto (61 importeurs), des identifiants `kanto.*` écrits en dur dans l'interface.

## Critères de décision
1. Ne pas casser le jeu : 3169 tests passent aujourd'hui, c'est le filet.
2. Temps : les estimations des ateliers 2 et 3 vont de 1 à 4 jours par chantier. Le créneau de ce TP est de 2 heures.
3. Gain sur la suite de la feuille de route : Johto et les régions suivantes.
4. Un diff que Nicolas peut expliquer et justifier.

## Options envisagées
- **A. Statu quo** : on ne change rien et on décrit seulement.
- **B. Tout migrer d'un coup** : Façade sur le store, Adapter serveur, State, Strategy, régions en dépendance partout, identifiants sortis du code.
- **C. Migrer par tranches**, dans l'ordre du rapport coût / risque, chaque tranche gardant les tests existants verts. Le reste va au backlog avec son estimation.

## Décision
Nous retenons l'option C, parce que B dépasse très largement le créneau (les trois chantiers chiffrés par les ateliers 2 et 3 font 5 à 9 jours cumulés, sans l'Adapter ni les régions) et touche `traiter`, le point le plus risqué du projet, et parce que A laisse sans réponse le diagnostic que nous avons nous-mêmes écrit.

Ordre retenu : d'abord ce qui est petit, local et couvert par des tests (le State sur la synchro, 40 tests déjà écrits), puis ce qui bloque Johto.

### Tranches faites dans ce TP
| Atelier | Tranche | Fichiers |
|---|---|---|
| 4 (DI) | `Region` en dépendance : interface, chargeur de Kanto à la demande, composition root, contexte React. Branchée sur la carte des zones de Kanto. | `core/region.ts`, `core/region-kanto.ts`, `ui/composition-root.ts`, `ui/ContexteRegion.ts`, `ui/CarteKanto.tsx`, `ui/main.tsx` |
| 3 (State) | Les transitions de la synchro dans une fonction pure `suivant(état, événement)`. La variable `bloque` disparaît : `bloque(état)` la déduit. `App.tsx` utilise `envoiEnEchec(état)` au lieu de recopier une liste deux fois. | `ui/etat-synchro.ts` (nouveau), `ui/synchro.ts`, `ui/App.tsx` |

### Tranches reportées (au backlog)
| Chantier | Raison | Estimation du document de l'atelier |
|---|---|---|
| Façade `ServiceCombat` sur le store (atelier 2) | `traiter` modifie une quarantaine de variables : il faut choisir ce que le service reçoit et rend | 2 à 4 jours |
| Adapter serveur (atelier 2) | quatre copies du même appel HTTP à regrouper sans changer les tests de `synchro` | voir `docs/patterns-creation-structure.md` |
| Strategy sur la fin de boss (atelier 3) | touche les mêmes lignes de `traiter` que la Façade : les deux ne se font pas en parallèle | 2 à 3 jours |
| Conversion des importeurs de `regions.ts` (atelier 4) | 61 fichiers, dont 47 de tests ; à faire juste avant Johto | à chiffrer |
| Identifiants `kanto.*` en dur (AP-4) | 42 occurrences dans 7 fichiers ; la région doit répondre à la place du code | à chiffrer |

## Conséquences
- Positif :
  - Les transitions de la synchro sont lisibles à un seul endroit et testées sans réseau (18 cas dans `etat-synchro.test.ts`).
  - Une variable de moins qui pouvait s'écarter de l'état, et deux listes de moins dans `App.tsx`.
  - Chaque tranche se relit et se retire seule.
- Négatif :
  - Le projet passe un temps avec deux styles : la synchro et la carte suivent les patterns, le store et les 61 importeurs non.
  - Un niveau d'indirection de plus pour suivre une réponse du serveur : réponse HTTP, événement, puis `suivant`.
  - **Le State change le comportement dans deux cas**, que les tests existants ne couvrent pas. Après un arrêt puis un redémarrage, l'état `refuse` repasse à `inactif` (avant, il restait `refuse` alors que les envois reprenaient). Et une panne réseau pendant un envoi ne remplace plus l'état `divergence`. Les 40 tests de la synchro passent sans changement.
  - Le gain de chargement à la demande des régions reste nul tant que `zones.json` est importé en dur ailleurs.

## Avantages et inconvénients des options
| | A. Statu quo | B. Tout d'un coup | C. Par tranches |
|---|---|---|---|
| Risque de casser le jeu | nul | élevé (`traiter`) | faible, une tranche à la fois |
| Tient dans 2 heures | oui | non | oui |
| Répond au diagnostic | non | oui | en partie, le reste est daté |
| Cohérence du code | celle d'aujourd'hui | une seule | deux styles pendant un temps |

## À revoir si
- Une deuxième région est ajoutée : la conversion de `regions.ts` devient alors la priorité.
- `store.ts` dépasse 2000 lignes : la Façade passe devant.
- Les deux écarts de comportement de la synchro sont jugés gênants : il faut alors un état supplémentaire plutôt qu'une variable déduite.
