# Charte projet

## Problème et objectif
La V1 (`PERSO/pokiclicker`, vanilla JS, Kanto complet) a été abandonnée faute de niveau en développement, et son équilibrage est incertain. Objectif : un jeu fini, jouable à plusieurs amis sur PC et mobile, toutes régions, avec comptes en ligne. Détail dans `docs/vision.md`.

## Périmètre
- **Dedans** : jeu web (PWA), compte en ligne, parties multiples, toutes les régions jusqu'à Paldea, expéditions, succès/diamants/skins.
- **Dehors** : publication au public, monétisation, application native dans les stores.

## Qui décide (RACI)
| Sujet | Décide | Prépare | Exécute | Relit |
|---|---|---|---|---|
| Vision, équilibrage, nom, style | Nicolas | Claude | | Nicolas |
| Plan, tickets, risques | Nicolas | Claude (`/projet`) | | Nicolas |
| Code | Nicolas | Claude (cadrage, revue) | Codex via `/route` | Claude puis Nicolas |
| Tests de jeu | | Nicolas | amis | Nicolas |

## Façon de travailler
- Une seule personne, plus des agents : flux continu, pas de sprints. Tableau (À faire, En cours, En revue, Fini), 1 à 2 tickets en cours, 1 PR en revue à la fois.
- Un ticket ne passe à un agent que s'il est « prêt » (`/projet ticket`) et que Nicolas pose `agent-ok`.
- Point hebdomadaire (`/projet point`) quand le dépôt et les tickets existent.
- Git : GitHub Flow, Conventional Commits, fusion par squash. Rien n'est poussé sans accord de Nicolas.

## Définition de « fini »
- Critères d'acceptation vérifiés.
- Tests ajoutés et verts, y compris le simulateur d'équilibrage dès qu'il existe.
- Revue faite (Claude, puis Nicolas).
- Testé sur un écran de téléphone (portrait) et sur PC.
- Documentation touchée si le comportement ou les données changent.
- Aucun secret ni TODO oublié ; déployable sans étape manuelle cachée.
- Ticket fermé par la PR.

## Seuils de qualité (départ)
Poids des images optimisé (WebP, un ratio par type) ; aucune dépendance externe au chargement (sprites, polices, scripts locaux) ; tests sur toutes les formules du cœur de jeu.
