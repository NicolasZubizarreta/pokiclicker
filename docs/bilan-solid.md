# Bilan du TP SOLID Architecture

Atelier 6, branche `atelier-6/bilan`. Le projet est PokiClicker v2. L'état de départ est dans l'ADR 0006, le choix de migration dans l'ADR 0007. Ce document dit ce qui a été fait, ce qui a posé problème, ce qui n'a pas été fait et pourquoi, et ce que ça donne.

## Ce qui a été fait

| Atelier | Livrable | Code |
|---|---|---|
| 1. Anti-patterns | `docs/anti-patterns.md` : mesures (complexité, taille, churn) et dix anti-patterns classés | non |
| 2. Patterns de structure | `docs/patterns-creation-structure.md` : Façade sur le store, Adapter sur le serveur | non |
| 3. Patterns de comportement | `docs/patterns-comportement.md` : State sur la synchro, Strategy sur la fin de boss | non |
| 4. DI | `docs/atelier-4-di.md` + la région Kanto en dépendance | oui |
| 6. Bilan | ADR 0006 (état actuel), ADR 0007 (choix), State sur la synchro, ce document | oui |

Le code migré tient en 13 fichiers de `src` (+220 / −46 lignes depuis le commit `f95f09d`) : les régions en dépendance (atelier 4) et `etat-synchro.ts` avec les trois fichiers qui l'utilisent. Les tests existants n'ont pas été modifiés, à l'exception d'un fichier d'amorçage ajouté pour la région.

Vérifié le 19/11 : `tsc` et ESLint propres, 3169 tests passent, 3 échouent. Ces 3 échecs existaient avant le TP (`PagePlus.test.tsx`, `musiques.test.ts`, `sons-fidelite.test.ts`). Rien n'a été essayé dans un navigateur pour la synchro avec le vrai serveur.

## Problèmes rencontrés

1. **Les régions n'allègent pas encore le chargement.** Le build avertit que `zones.json` et `scenes.json` sont chargés à la demande par `region-kanto.ts` mais aussi importés en dur ailleurs : ils restent dans le gros fichier du jeu. Seules les positions de la carte (moins d'1 ko) sont sorties. Le gain n'arrivera qu'avec la conversion des importeurs.
2. **Les tests de l'interface ne passent pas par le contexte.** Pour ne pas réécrire une vingtaine de fichiers de tests, `src/ui/region-tests.ts` remplace `useRegion` par la région Kanto pour tous les tests d'écrans. Le cours préfère un faux injecté par le Provider : on a pris un raccourci.
3. **Le démarrage devient asynchrone.** `main.tsx` doit attendre la région avant d'afficher le jeu. Avec Kanto seul, ça ne se voit pas ; avec des régions lourdes, il faudra un écran d'attente.
4. **Deux variables de la synchro n'étaient pas d'accord.** En lisant `synchro.ts` pour le State, on a vu qu'après un arrêt puis un redémarrage, `statut` pouvait rester `refuse` alors que `bloque` était faux. Calculer `bloque` à partir de l'état a obligé à choisir : l'état repasse à `inactif`. C'est un changement de comportement, que les tests existants ne détectent pas. Une panne réseau pendant un envoi ne remplace plus non plus l'état `divergence`. Les deux sont écrits dans l'ADR 0007.
5. **Un nom déjà pris.** `synchro.ts` avait déjà une variable locale `suivant`, le nom que la documentation de l'atelier 3 donnait à la fonction. Les imports sont renommés (`transition`, `estBloque`).
6. **Les chiffres des documents ont bougé.** L'atelier 4 annonçait 62 importeurs de `regions.ts`, la mesure du 19/11 en donne 61 (14 du jeu, 47 de tests). Les documents des ateliers 1 à 3 citent des numéros de lignes de `store.ts` qui ont changé depuis (1278 lignes alors, 1345 aujourd'hui).
7. **Le travail en parallèle.** Les branches des ateliers 1 à 3 partent d'un commit plus ancien que `v2`, et d'autres sessions travaillent sur le projet. Il a fallu fusionner `atelier-3/patterns` pour avoir les documents dans le bilan, et travailler dans un dossier de travail séparé pour ne pas gêner les autres.
8. **Les outils sur cette machine.** Git échoue dans WSL sur ce dossier de travail, et `npx` est bloqué par la politique d'exécution de PowerShell. Les commandes passent par PowerShell et `node node_modules/...`.

## Ce qui n'a pas été implémenté, et pourquoi

| Chantier | Pourquoi pas | Estimation (documents des ateliers) |
|---|---|---|
| Façade `ServiceCombat` sur le store | `traiter` modifie une quarantaine de variables : il faut décider ce que le service reçoit et rend. Trop risqué pour un créneau de 2 heures. | 2 à 4 jours |
| Strategy sur la fin de boss | Elle touche les mêmes lignes de `traiter` que la Façade, les deux ne se font pas en parallèle. Les `return` actuels sortent de `traiter` : le résultat d'une stratégie est à concevoir. | 2 à 3 jours |
| Adapter serveur | Quatre copies du même appel HTTP à regrouper sans changer les tests de `synchro`. Non commencé, faute de temps. | voir `docs/patterns-creation-structure.md` |
| Conversion des importeurs de `regions.ts` | 61 fichiers, dont 47 de tests. C'est le chantier qui active le gain de chargement. | à chiffrer |
| `guide.ts`, `scenes.ts`, `journal-zones.ts` | Ils lisent les JSON de Kanto sans passer par `regions.ts`. | à chiffrer |
| Identifiants `kanto.*` écrits en dur (AP-4) | 42 occurrences dans 7 fichiers. Une constante ne suffit pas : c'est la région qui doit répondre à la place du code. | à chiffrer |
| `CarteKanto` générique (`CarteRegion`) | L'image `carte-kanto.webp` est encore écrite en dur ; elle doit venir du champ `carte` de la région. À faire avant Johto. | petit |
| La sauvegarde retient la région du joueur | Nécessaire dès que le joueur peut changer de région. | à chiffrer |
| Contrôle automatique des couches (dependency-cruiser) | Seules les bibliothèques sont interdites dans le cœur aujourd'hui, pas les imports vers `src/ui`. Pas de besoin tant qu'aucun import n'existe. | petit |
| Tests d'écrans avec un Provider | Remplacer le fichier d'amorçage de l'atelier 4 par un vrai fournisseur injecté dans chaque test. | une journée |

La plupart de ces points sont aussi limités par l'état de certains fichiers : `store.ts` fait 1345 lignes et revient dans 21 % des commits qui touchent `src`, ce qui le rend difficile à changer en une journée sans conflit avec les autres sessions.

Ces chantiers sont à passer au backlog avant Johto. Aucun ticket n'est encore écrit dans `docs/projet/`.

## Avantages et inconvénients de la migration faite

**Avantages**
- La carte de Kanto reçoit sa région au lieu de l'importer : Johto pourra s'ajouter sans retoucher ce fichier.
- Les transitions de la synchro sont écrites à un seul endroit et testées sans réseau (18 cas de transition). `bloque` ne peut plus s'écarter de l'état.
- Chaque tranche se relit seule, sans toucher aux tests existants, et se retire seule.
- Des décisions écrites (ADR 0006 et 0007) avec leurs options et leur prix, au lieu d'un choix qu'on aurait oublié.

**Inconvénients**
- Deux styles côte à côte tant que le store et les 61 importeurs ne sont pas convertis.
- Un niveau d'indirection de plus à lire pour suivre une réponse du serveur.
- Deux changements de comportement dans la synchro, non couverts par des tests.
- Le gain de performance annoncé pour les régions n'existe pas encore.
- Plus de documents à tenir à jour : plusieurs chiffres des documents des ateliers 1 à 3 ont déjà vieilli.

## Ce que le cours a changé dans notre façon de travailler

- On mesure avant de choisir (complexité, commits, importeurs), ce qui a montré que `store.ts` est le vrai point central et pas l'écran de combat.
- Un pattern part d'un symptôme nommé, et la comparaison se fait uniquement avec les patterns du cours : la Chaîne de responsabilité et l'Observer ont été écartés avec une raison écrite.
- La règle « le cœur ne dépend pas de l'interface » existait déjà dans ESLint. Elle est maintenant écrite et justifiée dans un ADR.
