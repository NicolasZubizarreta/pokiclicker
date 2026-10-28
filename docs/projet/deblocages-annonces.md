# Annonces de déblocage (ticket AH)

Quand une fonction ou un lieu s'ouvre, une annonce en haut de l'écran le dit et indique où le trouver. Les déclencheurs et les textes sont dans `data/deblocages.json` ; la logique est dans `src/core/deblocages.ts` (quoi annoncer) et `src/ui/store.ts` (quand l'afficher).

## Fonction, déclencheur, texte

| Fonction | Déclencheur | Texte affiché |
| --- | --- | --- |
| Sac | Route 1 ouverte (le Sac s'ouvre à la Route 1) | Sac débloqué ! Il est dans l'onglet Équipe. |
| PC | Arène d'Argenta ouverte (boss de la Forêt de Jade battu) | PC débloqué ! Il est dans la barre de navigation. |
| Pension | Boss de la Tour Pokémon battu | Pension débloquée ! Elle est à Bourg Palette. |
| Centre commercial | Boss de la Tour Pokémon battu | Centre commercial débloqué ! Il est sur la Carte, dans la fiche de Céladopole. |
| Casino | Boss de la Tour Pokémon battu | Casino débloqué ! Il est sur la Carte, dans la fiche de Céladopole. |
| Poké-Radar | Objet « Poké-Radar » acheté (Shop, Cave Taupiqueur) | Poké-Radar débloqué ! Il est dans les outils du combat. |
| Fauchage | Objet « CT Fauchage » acheté (Shop, Centrale) | Fauchage débloqué ! Il est dans les outils du combat. |
| Auto-clic | Objet « Restes » acheté (Shop, Sylphe SARL) | Auto-clic débloqué ! Le bouton est dans les réglages du combat. |

Le déclencheur d'une ligne est l'une des trois formes de `data/deblocages.json` : `zone` (une zone devient accessible), `lieu` (la condition `si` du lieu annexe dans `data/regions/kanto/zones.json` est vraie), `amelioration` (l'objet est dans `ameliorations`). Un déblocage est donc vrai tant que son état l'est ; ce qui évite de brancher un événement par fonction.

Le Sac a une particularité : l'intro de Chen l'annonce déjà (« +5 POKÉBALLS ! », drapeau `sac-ouvert`). Sa ligne porte `dejaAnnonceSi: "sac-ouvert"` : quand le drapeau est posé, le Sac est noté comme vu sans rien afficher.

La Pension annonçait avant « Pension débloquée (Bourg Palette) ! » dans l'annonce du boss ; ce message a été retiré de `data/reglages.json` (`pension.messages.debloquee`) pour ne pas doubler.

## Règles d'affichage

- Une annonce dure `interface.annonceMs` (1 200 ms, `data/reglages.json`), mesurées sur le temps de jeu comme les autres annonces.
- Les annonces s'affichent une à une, dans l'ordre du tableau ci-dessus. La suivante démarre quand la précédente se termine.
- Une annonce attend que l'écran soit libre : pas de badge en cours d'obtention, pas de dialogue ou d'événement (M. Fuji après la Tour Pokémon, par exemple), pas d'intro ni de choix du partenaire, pas de Panthéon, pas de crédits, pas d'évolution en cours, pas d'annonce du jeu affichée (« Zone débloquée ! », capture…).
- Elle est visible sur toutes les pages (composant `AnnonceDeblocage` dans `Coquille`), en `aria-live="polite"`, sans `role="status"`. Sous `prefers-reduced-motion`, le cadre apparaît sans glissement, avec le même texte.

## Sauvegarde

Champ optionnel `annoncesVues` (liste d'identifiants) dans les données de région. La version du schéma ne change pas.

- Une annonce est marquée vue au moment où elle commence à s'afficher, et la région est enregistrée.
- Une sauvegarde sans `annoncesVues` est une ancienne sauvegarde : au chargement, tout ce qui est déjà ouvert est noté comme vu, donc rien ne se rejoue. Une fonction qui s'ouvre ensuite est annoncée normalement.
- Si la page est rechargée au milieu d'une file (Pension vue, Centre commercial et Casino pas encore), les annonces non vues reviennent au chargement suivant.

## Tests

`src/core/deblocages.test.ts`, `src/ui/store-deblocages.test.ts`, `src/ui/store-pension.test.ts`, `src/ui/Coquille.test.tsx`, e2e `tests-e2e/deblocages.spec.ts`.
