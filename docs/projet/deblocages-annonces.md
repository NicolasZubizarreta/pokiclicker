# Annonces de déblocage (ticket AH)

Quand une fonction ou un lieu s'ouvre, une annonce en haut de l'écran le dit et indique où le trouver. Depuis le ticket AM, trois objets du Shop (Poké-Radar, CT Fauchage, Restes) sont aussi annoncés le jour où ils arrivent au Shop, avant l'achat. Les déclencheurs et les textes sont dans `data/deblocages.json` ; la logique est dans `src/core/deblocages.ts` (quoi annoncer) et `src/ui/store.ts` (quand l'afficher).

## Fonction, déclencheur, texte

| Fonction | Déclencheur | Texte affiché |
| --- | --- | --- |
| Sac | Route 1 ouverte (le Sac s'ouvre à la Route 1) | Sac débloqué ! Il est dans l'onglet Équipe. |
| PC | Arène d'Argenta ouverte (boss de la Forêt de Jade battu) | PC débloqué ! Il est dans la barre de navigation. |
| Pension | Boss de la Tour Pokémon battu | Pension débloquée ! Elle est à Bourg Palette. |
| Centre commercial | Boss de la Tour Pokémon battu | Centre commercial débloqué ! Il est sur la Carte, dans la fiche de Céladopole. |
| Casino | Boss de la Tour Pokémon battu | Casino débloqué ! Il est sur la Carte, dans la fiche de Céladopole. |
| Poké-Radar au Shop | Objet « Poké-Radar » achetable : Shop ouvert et Cave Taupiqueur (zone 8) ouverte, soit le boss de l'Arène de Carmin battu | Poké-Radar disponible au Shop ! |
| Poké-Radar | Objet « Poké-Radar » acheté (Shop, Cave Taupiqueur) | Poké-Radar débloqué ! Il est dans les outils du combat. |
| CT Fauchage au Shop | Objet « CT Fauchage » achetable : Centrale (zone 12) ouverte, soit le boss de l'Arène de Céladopole battu | CT Fauchage disponible au Shop ! |
| Fauchage | Objet « CT Fauchage » acheté (Shop, Centrale) | Fauchage débloqué ! Il est dans les outils du combat. |
| Auto-clic au Shop | Objet « Restes » achetable : Sylphe SARL (zone 14) ouverte, soit le boss de l'Arène de Parmanie battu | Auto-clic (Restes) disponible au Shop ! |
| Auto-clic | Objet « Restes » acheté (Shop, Sylphe SARL) | Auto-clic débloqué ! Le bouton est dans les réglages du combat. |

Le déclencheur d'une ligne est l'une des quatre formes de `data/deblocages.json` : `zone` (une zone devient accessible), `lieu` (la condition `si` du lieu annexe dans `data/regions/kanto/zones.json` est vraie), `amelioration` (l'objet est dans `ameliorations`), `objetShop` (l'objet figure dans la liste du Shop, calculée par `objetsDuShop` : Shop ouvert à la Forêt de Jade et zone de l'objet ouverte, la même règle que l'écran Shop). Un déblocage est donc vrai tant que son état l'est ; ce qui évite de brancher un événement par fonction.

Le Sac a une particularité : l'intro de Chen l'annonce déjà (« +5 POKÉBALLS ! », drapeau `sac-ouvert`). Sa ligne porte `dejaAnnonceSi: "sac-ouvert"` : quand le drapeau est posé, le Sac est noté comme vu sans rien afficher.

La Pension annonçait avant « Pension débloquée (Bourg Palette) ! » dans l'annonce du boss ; ce message a été retiré de `data/reglages.json` (`pension.messages.debloquee`) pour ne pas doubler.

## Règles d'affichage

- Une annonce de déblocage dure `interface.annonceDeblocageMs` (3 000 ms, `data/reglages.json`), mesurées sur le temps de jeu. Les autres annonces (« CARTE DÉBLOQUÉE ! », capture, achat, zone) gardent `interface.annonceMs` (1 200 ms).
- Une file de plusieurs annonces dure donc 3 s par annonce (Pension, Centre commercial et Casino : 9 s). L'ordre et l'absence de superposition sont inchangés.
- Les annonces s'affichent une à une, dans l'ordre du tableau ci-dessus. La suivante démarre quand la précédente se termine.
- Une annonce attend que l'écran soit libre : pas de badge en cours d'obtention, pas de dialogue ou d'événement (M. Fuji après la Tour Pokémon, par exemple), pas d'intro ni de choix du partenaire, pas de Panthéon, pas de crédits, pas d'évolution en cours, pas d'annonce du jeu affichée (« Zone débloquée ! », capture…).
- Elle est visible sur toutes les pages (composant `AnnonceDeblocage` dans `Coquille`), en `aria-live="polite"`, sans `role="status"`. Sous `prefers-reduced-motion`, le cadre apparaît sans glissement, avec le même texte.

## Sauvegarde

Champ optionnel `annoncesVues` (liste d'identifiants) dans les données de région. La version du schéma ne change pas.

- Une annonce est marquée vue au moment où elle commence à s'afficher, et la région est enregistrée.
- Une sauvegarde sans `annoncesVues` est une ancienne sauvegarde : au chargement, tout ce qui est déjà ouvert est noté comme vu, donc rien ne se rejoue. Une fonction qui s'ouvre ensuite est annoncée normalement.
- Un objet du Shop et son achat ont chacun leur identifiant (`poke-radar-au-shop` puis `poke-radar`) : l'annonce d'arrivée au Shop ne dépend pas de l'achat et ne se rejoue pas quand on achète. Une sauvegarde faite avec `annoncesVues` avant le ticket AM, et qui a déjà ouvert l'une de ces zones, verra l'annonce du Shop une fois (ses identifiants manquent).
- Si la page est rechargée au milieu d'une file (Pension vue, Centre commercial et Casino pas encore), les annonces non vues reviennent au chargement suivant.

## Tests

`src/core/deblocages.test.ts`, `src/ui/store-deblocages.test.ts`, `src/ui/store-pension.test.ts`, `src/ui/Coquille.test.tsx`, e2e `tests-e2e/deblocages.spec.ts`.
