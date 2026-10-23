# PokiClicker v2 (nom de travail)

Clicker Pokémon pour Nicolas et ses amis, PC et mobile (mobile prioritaire). Cible : toutes les régions, comptes en ligne.

Source de vérité : `docs/vision.md` (le jeu), `docs/plan.md` (phases et questions ouvertes), `docs/projet/` (charte, risques). Lire ces fichiers avant toute tâche ; les mettre à jour quand une décision change.

La V1 (vanilla JS, Kanto complet) est le point de départ : **on porte ses règles, ses formules, ses données de Kanto, ses textes et ses sprites, on ne repart pas de zéro sur le concept**. Même dépôt GitHub (`NicolasZubizarreta/pokiclicker`) : la V1 reste sur `main` ; la V2 vit sur la branche `v2`, où la V1 est rangée dans `legacy/` (lecture seule). **Ne pas modifier la V1.** Ne change aucune règle de jeu sans ticket : un écart avec la V1 est un bug.

Règles :
- Ne rien coder avant que le ticket soit « prêt » et validé par Nicolas.
- Cœur de jeu en TypeScript pur dans `src/core`, sans dépendance à React ni au DOM.
- Données de contenu (régions, zones, boss, objets, événements) en JSON dans `data/`, jamais en dur dans le code.
- Un seul ratio par type d'image ; pas de ressource externe au chargement.
- Rien n'est poussé sur un dépôt distant sans accord explicite de Nicolas.
- Français pour les textes du jeu, les documents et les commentaires.

## Design
Avant tout travail d'interface, lis design/DESIGN.md puis design/tokens.css et design/regions.css. N'invente aucune valeur : tout vient de ces fichiers.
Si un cas n'est pas couvert, pose la question avant de choisir. Pour toute page nouvelle, propose trois variantes avant d'en polir une.
Avant de me montrer un écran, capture-le à 390 et 1440 px, regarde-le, et corrige ce qui échoue à DESIGN.md.
