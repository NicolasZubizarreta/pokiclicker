# Jalon 2 — Kanto jouable de bout en bout

Test automatique du 27/10/2026, sur le build de production (`npm run build` puis `npm run preview`), projets Playwright `mobile` (390 px) et `pc` (1440 px).

## Résultat
- `npm run ci` : 163 fichiers, 2161 tests unitaires, build propre.
- `npx playwright test --project=mobile --project=pc` : 186 réussis, 4 ignorés, 0 échec, 7 min 43 s (sous les 10 minutes du ticket Y).

## Ce que `tests-e2e/jalon-2.spec.ts` vérifie
- Trois départs (Bulbizarre, Salamèche, Carapuce) depuis une sauvegarde neuve : l'équipe contient un seul Pokémon, de niveau 5.
- Quatre sauvegardes d'étapes (Arène d'Argenta avec 1 badge, Arène de Céladopole avec 4, Arène de Jadielle avec 7, Ligue Pokémon avec 8) : elles se chargent sans erreur console et la page Plus affiche la bonne zone et le bon nombre de badges.
- Trois tailles (390, 1440, 1915 px) sur Combat, Équipe, Shop, Carte et Plus : pas de défilement horizontal, pas d'erreur console, pas de mot anglais de la liste de contrôle.

## Où sont les autres parcours
| Parcours | Fichier e2e |
|---|---|
| Capture | `capture.spec.ts` |
| Évolution | `evolution.spec.ts` |
| Achat au Shop, objets actifs | `boutique.spec.ts`, `objets-actifs.spec.ts` |
| Pension et éclosion | `pension.spec.ts` |
| Centre commercial | `centre.spec.ts` |
| Casino | `casino.spec.ts` |
| Ligue, Panthéon, `ligueGagnee` | `ligue.spec.ts`, `pantheon.spec.ts` |
| Diplôme, défi de Chen, crédits | `fin.spec.ts` |
| Easter eggs | `easter-eggs.spec.ts` |

## Écarts avec le ticket Y
- Les sauvegardes d'étapes sont écrites dans le stockage par un script du test, pas générées par `scripts/creer-sauvegarde-test.mjs` ni versionnées dans `tests-e2e/fixtures/jalon-2/`. Elles portent donc toujours le schéma courant : la migration d'une ancienne version est couverte par les tests unitaires, pas ici.
- Capture, évolution, Shop, éclosion et casino sont vérifiés dans leurs propres fichiers, pas dans `jalon-2.spec.ts`.

## Reste avant de déclarer la phase 2 terminée
- Essai de Nicolas (jalon humain, hors CI).
- Ticket Z : musique (accord et licences) et trois finitions V1 à trancher (contour noir, verre dépoli, étoiles).
- Étiquettes du Panthéon qui se chevauchent légèrement à 390 px.