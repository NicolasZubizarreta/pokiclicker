# Anti-patterns de PokiClicker v2

Atelier 1 du cours SOLID Architecture : relecture critique de notre projet, sans rien corriger. Relevé du 16/11/2026 sur la branche `v2` (commit `1f7165e`). Le travail est fait sur `atelier-1/diagnostic` et aucun fichier de code n'a été touché.

## 1. Ce que j'ai mesuré

| Mesure | Outil | Résultat |
|---|---|---|
| Complexité | ESLint, règle `complexity` réglée à 1, tests exclus | 1111 fonctions, 107 au-dessus de 10, 32 au-dessus de 20 |
| Taille | comptage des lignes | 8 fichiers dépassent 300 lignes |
| Imports | comptage des `import` | 9 fichiers ont 15 imports ou plus |
| État local | comptage des `useState(` | `App.tsx` 9, `EcranParties.tsx` 8, `PageIntro.tsx` 7 |
| Cycles | petit script avec l'API TypeScript (imports de valeurs seulement) | 200 fichiers, 645 imports, aucun cycle, aucun import de `core` vers `ui` |
| Typage | `tsc -b` en mode strict | aucune erreur |
| Churn | `git log --name-only -- src` | 276 commits touchent `src` |
| Code mort | `knip` | pas lancé, il faut le télécharger |

Pour classer les hotspots, j'ai multiplié le nombre de commits d'un fichier par la complexité cumulée de ses fonctions.

| Score | Fichier | Commits | Complexité | Lignes |
|---|---|---|---|---|
| 31 447 | `src/ui/store.ts` | 59 | 533 | 1278 |
| 10 000 | `src/ui/EcranCombat.tsx` | 50 | 200 | 385 |
| 7 770 | `src/ui/CarteKanto.tsx` | 30 | 259 | 389 |

Viennent ensuite `PageEquipe.tsx` (5 211), `Coquille.tsx` (4 752) et `synchro.ts` (3 654, avec une complexité de 406 pour seulement 9 commits). Je n'ai pas ouvert ces trois-là.

`store.ts` revient dans 59 des 276 commits qui touchent `src`, soit 21 %. Un commit qui le modifie touche en moyenne 6,2 fichiers de production, contre 4,1 pour l'ensemble des commits. Onze de ses 59 messages parlent d'une correction, et 54 commits modifient l'un des 23 fichiers de test `store*.test`.

## 2. Les anti-patterns, dans l'ordre où je les traiterais

Pour la priorité, je note chaque anti-pattern deux fois. La gravité va de 1 (ça gêne) à 3 (ça bloque ou ça casse). La fréquence va de 1 (moins de 15 commits sur le fichier) à 3 (plus de 40). La priorité est le produit des deux, et à égalité je mets devant ce qui coûte le moins à corriger. Ces notes sont mon jugement ; les chiffres cités dans les fiches sont mesurés.

### AP-1. `traiter` et `afficher` mélangent lecture et écriture

`src/ui/store.ts:321-471` (`traiter`, complexité 59) et `store.ts:472-601` (`afficher`, complexité 74). `traiter` règle dans le même bloc le son, les gains, la capture, la victoire, la ponte, la Ligue, les boss et le défi de Chen. `afficher` est censée préparer ce que l'écran montre, mais elle écrit aussi dans la partie : elle met à jour le Pokédex des Pokémon vus (lignes 475-481) et les annonces (lignes 485-491), puis elle recalcule la carte, la pension et l'équipe à chaque appel.

Principes en cause : responsabilité unique (SRP) et séparation commande/requête, une lecture ne devrait rien modifier. Un bug peut dépendre de qui appelle `afficher` et à quel moment, ce qui le rend difficile à reproduire. Je n'ai pas mesuré ce que coûte son recalcul.

Gravité 3, fréquence 3, score 9. Effort moyen. Priorité haute.

### AP-2. God module `creerStoreJeu`

`src/ui/store.ts:166-1258` : une seule fonction de 1090 lignes porte tout le jeu. Elle garde une quarantaine de variables `let` dans sa fermeture (lignes 172-227) et le fichier a 54 imports.

Principe en cause : SRP. Le fichier est dans 21 % des commits, c'est donc là que les conflits Git tombent. Chaque nouvelle fonctionnalité s'y ajoute sans qu'on extraie jamais rien.

Gravité 3, fréquence 3, score 9. Effort gros. Priorité haute.

### AP-3. Les règles du jeu vivent dans la couche d'affichage

`src/ui/store.ts:351-460` applique les règles de victoire, de ponte, de Ligue et de défi, avec 37 imports depuis `src/core`. Notre propre règle dit pourtant que le cœur du jeu est en TypeScript pur dans `src/core`.

Principes en cause : SRP et inversion des dépendances (DIP). Pour tester une règle, il faut monter le store de l'interface.

Gravité 3, fréquence 3, score 9. Effort gros. Priorité haute.

### AP-4. Identifiants de zones et d'événements écrits en chaînes

On trouve `'kanto.labo'`, `'kanto.intro'` et leurs semblables 42 fois dans 7 fichiers de `src/ui` : 23 lignes dans `store.ts` (186, 191, 289, 386, 389, 398, 425, 455, 611, 674, 794…), 9 dans `ScenesBourgPalette.tsx`, 3 dans `EcranCombat.tsx`, 2 chacun dans `Coquille.tsx`, `PageIntro.tsx` et `SceneRonflex.tsx`, 1 dans `store-boutique.ts`. Un cas particulier est même écrit à la main : `kanto.rival-foret` et `kanto.blue-presentation`, `store.ts:1150-1152`.

Principes en cause : ouvert/fermé (OCP) et obsession des types primitifs, une chaîne de caractères tient lieu de concept. Pour ajouter une région il faut modifier du code existant. C'est l'inverse de l'objectif « toutes les régions » du projet, et de notre règle « contenu en JSON, jamais en dur ».

Gravité 3, fréquence 2, score 6. Effort moyen. Priorité haute, parce que ça bloque la suite de la feuille de route.

### AP-5. God component `Scene`

`src/ui/EcranCombat.tsx:68-180`, complexité 48. Le composant affiche quatre écrans différents par des `return` anticipés : Bourg Palette et le labo (ligne 112), la Route de Ronflex (124), une scène de lieu (126) et le combat (133). Il lit 17 morceaux du store (lignes 82-99).

Principe en cause : SRP. Ces 17 lectures font 17 raisons de se redessiner, et on ne peut pas tester un écran sans les trois autres. Le fichier a 50 commits.

Gravité 2, fréquence 3, score 6. Effort moyen. Priorité moyenne.

### AP-6. God component `CarteKanto`

`src/ui/CarteKanto.tsx:35`, complexité 92. Le composant porte au moins six rôles : zoom à la molette et glissement (lignes 137-160), focus et piège du Tab (112-125), fenêtre de Céladopole (92-104), position de la fiche (77-88), fondu des nouvelles zones (127-134) et mesure de la carte. Du métier y traîne aussi : le texte « Bientôt disponible. » (47 et 49), Céladopole retrouvée par son nom (66), les zones triées par `findIndex` en plein affichage (70-71).

Principes en cause : SRP, et OCP pour les règles de Céladopole écrites en dur. La mise en page de la fiche (ligne 88) dépend de 7 valeurs à la fois, ce qui laisse craindre des régressions de focus et d'accessibilité. Le fichier a 30 commits.

Gravité 3, fréquence 2, score 6. Effort moyen. Priorité moyenne.

### AP-7. Interface obèse `AffichageJeu`

`src/ui/store.ts:69-158` : un seul type d'une centaine de membres, qui mélange casino, pension, Panthéon, tutoriels, journal, son, capture, évolution, carte et échange.

Principe en cause : ségrégation des interfaces (ISP). Modifier un membre se répercute sur tous les composants et tous les tests qui connaissent ce type, dont les 23 fichiers de test du store. Le problème s'allège beaucoup si on règle AP-2.

Gravité 2, fréquence 3, score 6. Effort lié à AP-2. Priorité moyenne.

### AP-8. Store global lu en direct, deux manières de faire dans le même projet

`src/ui/CarteKanto.tsx:41-45` et `src/ui/PageCentre.tsx` lisent le singleton `storeJeu`, alors que `src/ui/EcranCombat.tsx` (lignes 54 et 68) reçoit `store` en paramètre.

Principe en cause : inversion des dépendances (DIP). Conséquence visible : `PageCentre.test.tsx` doit remettre le store à zéro après chaque test (`arreter()`, ligne 10), sinon les tests se contaminent.

Gravité 2, fréquence 2, score 4. Effort moyen. Priorité basse.

### AP-9. Le choix PC ou téléphone est éparpillé

On compte 108 ternaires `telephone ?` dans `src/ui` et 35 appels de `useTelephone()` répartis sur 29 fichiers. Les plus chargés sont `CarteKanto.tsx` et `PagePC.tsx` (20 chacun), puis `PageEquipe.tsx` (9) et `FichePokemon.tsx` (8).

Principe en cause : OCP. Un nouveau format d'écran obligerait à parcourir tous ces fichiers. 13 commits ont touché au moins 5 pages ou écrans à la fois ; je n'ai pas prouvé que ce soit à cause de ce branchement.

Gravité 2, fréquence 2, score 4. Effort gros. Priorité basse.

### AP-10. Sélecteurs recopiés dans `EcranCombat.tsx`

Le fichier contient cinq composants (`Entete` ligne 54, `Scene` 68, `ActionsTelephone` 183, `Equipe` 206, `CombatPC` 310) et 46 imports. Trois d'entre eux relisent les mêmes morceaux du store : `ActionsTelephone` (184-195), `Equipe` (215-226) et `CombatPC` (311-320).

Principes en cause : SRP (le fichier n'est pas cohérent) et non-répétition (DRY). Changer une règle d'auto-clic ou de fauchage oblige à retoucher deux ou trois endroits.

Gravité 1, fréquence 3, score 3. Effort petit. Priorité basse, mais c'est la correction la moins chère.

## 3. Classement

| Rang | Réf. | Anti-pattern | Score | Effort | Priorité |
|---|---|---|---|---|---|
| 1 | AP-1 | `traiter` et `afficher` | 9 | moyen | haute |
| 2 | AP-2 | God module `creerStoreJeu` | 9 | gros | haute |
| 3 | AP-3 | Règles du jeu dans l'affichage | 9 | gros | haute |
| 4 | AP-4 | Identifiants en chaînes | 6 | moyen | haute |
| 5 | AP-5 | God component `Scene` | 6 | moyen | moyenne |
| 6 | AP-6 | God component `CarteKanto` | 6 | moyen | moyenne |
| 7 | AP-7 | Interface `AffichageJeu` | 6 | lié à AP-2 | moyenne |
| 8 | AP-8 | Store global lu en direct | 4 | moyen | basse |
| 9 | AP-9 | Choix PC / téléphone éparpillé | 4 | gros | basse |
| 10 | AP-10 | Sélecteurs recopiés | 3 | petit | basse |

AP-1 passe avant AP-2 parce qu'il se fait par petits pas, avec les 23 fichiers de test du store comme filet de sécurité, et qu'il prépare le découpage du God module. AP-4 est classé en haute priorité malgré son score de 6, parce qu'il empêche d'ajouter une région sans toucher au code.

## 4. Limites

- Je n'ai ouvert et lu que les trois premiers hotspots. `PageEquipe.tsx`, `Coquille.tsx` et `synchro.ts` sont des candidats sans fiche.
- La complexité d'un fichier est la somme de celle de ses fonctions, sans tenir compte de sa taille.
- Le script de cycles ignore les imports qui ne portent que des types.
- Rien n'a été corrigé, conformément à l'étape 6 de l'atelier.
