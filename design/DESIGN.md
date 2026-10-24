# DESIGN.md — règle de construction (PokiClicker v2, nom de travail)

## Lis d'abord
1. `design/tokens.css` (Kanto, thème de base) puis `design/regions.css` (Johto, Hoenn provisoire, atlas).
2. `design/assets.json` (sprites, cartes, Prof. Chen, ressources à produire).
3. L'exemple le plus proche dans `design/examples/` : `2026-10-23-kanto-combat.html`, `2026-10-23-johto-combat.html`, `2026-10-23-atlas-carte-monde.html`.
Ne choisis aucune valeur : tout vient de ces fichiers. Cas non couvert : pose la question.

## Trois couches
- **Squelette** commun : mêmes composants et agencements partout.
- **Thème de région** : `<html data-region="johto" data-theme="dark">` (Kanto = aucun attribut). Chaque région a son jeu de référence (Kanto Rouge Feu, Johto HeartGold / SoulSilver). Ajouter une région = ajouter un bloc dans `design/regions.json`, puis `node design/scripts/regions-build.cjs`.
- **Atlas** (carte du monde, hub) : `data-region="atlas"`, papier et encre, hors thème de région.

## Jetons par rôle (jamais par teinte)
| Rôle | Kanto sombre | Kanto clair | Usage |
|---|---|---|---|
| `--fond` | #141821 | #f4efe4 | fond de page |
| `--surface` | #2c3039 | #fffdf7 | cadres, cartes |
| `--surface-2` | #2f3648 | #e8e6e0 | zones imbriquées |
| `--bordure` | #737781 | #bfc4cf | liserés |
| `--texte` | #f4efe4 | #141821 | texte principal |
| `--texte-doux` | #bfc4cf | #595e67 | texte secondaire |
| `--action` + `--action-texte` | #c8321e + #ffffff | #c8321e + #ffffff | bouton principal, un seul par écran |
| `--action-survol` | #ac1c0a | #ac1c0a | survol, pressé |
| `--lien` | #f5c033 | #ac1c0a | liens |
| `--focus` | #f5c033 | #2b6c9e | anneau de focus |
| `--selection` | #3a3320 | #f9ecce | carte ou ligne choisie |
| `--region-accent`, `--region-argent`, `--region-socle` | définis par région (`regions.css`) | idem | chiffres importants, liserés, socle sous le Pokémon |
Valeurs exactes : `tokens.css` et `regions.css`. Sémantiques : `--succes-*`, `--alerte-*`, `--erreur-*`, `--info-*` (toujours avec pictogramme).

## Échelles réelles
- Texte : xs 12 · sm 14 · **base 16 (minimum mobile)** · lg 18 · xl 20 · 2xl 24 · 3xl 32 · 4xl 40 · 5xl 48 (px). Titres Pixelify Sans 600 à 20/24/32 seulement, quatre mots au plus ; texte Atkinson Hyperlegible Next, `tabular-nums` partout ; atlas : Lilita One + Nunito.
- Espacement : multiples de 8 px (4 px de base). Marges de page 16 px mobile, 32 px PC.
- Unité de pixel : 1 px d'art = 2 px CSS (mobile) ou 3 px (PC). Sprites 96 × 96 natifs, facteur **entier**, `image-rendering: pixelated`.
- Rayons : Kanto 0 · Johto 4 px · atlas 12 px. Ombres pleines, sans flou : `sm` 0 2px · `md` 0 4px · `lg` 0 8px (noir à 45 %).
- Mouvement : 90 ms (recul, pression) · 150 ms · 300 ms (barre fantôme). Courbe `cubic-bezier(0.2, 0, 0, 1)`. Propriétés : `transform` et `opacity` seulement.
- Ruptures : 390 · 768 · 1024 · 1440 px, container queries et `clamp()`, aucune largeur fixe en px sur un conteneur.

## Composants nommés
- **Bouton d'action** : plaque en relief, ≥ 44 px. États : survol, pressé (descend de 2 px), désactivé (avec explication visible), focus (anneau 3:1). **Il n'y a plus de bouton « Attaque » (décision du 24/10) : on touche la scène, comme dans la V1.** La scène entière est la cible (un seul élément focalisable, nom accessible « Attaquer <Pokémon> », Entrée et Espace comme alternative au toucher) ; le recul du sprite et le chiffre de dégâts confirment l'appui.
- **Cadre** : double liseré (Kanto : crème ; Johto : or puis argent ; atlas : encre irrégulière). Un seul style de cadre par écran.
- **Barre de PV** : pixel, vert puis jaune puis rouge ; `scaleX` en 120 ms, barre fantôme après 300 ms.
- **Étapes** : 10 marques ; la 10e = boss (Poké Ball / cachet / cachet de cire).
- **Carte de Pokémon** : sprite sur socle `--region-socle`, nom, niveau, DPS.
- **Boîte de dialogue** : en bas de la scène, sprite du Prof. Chen, flèche qui rebondit.
- **Navigation** : 5 entrées (Combat, Équipe, Shop, Carte, Plus), 56 px ; active = forme et couleur. Mobile en bas, PC en colonne à gauche.
- **Feuille basse** (mobile) : compacte (nom, état, bouton), jamais plus d'une demi-hauteur.
- **Pin de carte** : terminé = cachet à étoile, actuel = épingle dorée, verrouillé = cachet cadenas. Position en %, cible ≥ 44 px.

## Assets
- Sprites : `design/specimens/assets/pokemon/` (face et dos), cartes : `design/specimens/assets/maps/` (1800 × 963, filigrane retiré par recadrage), Prof. Chen : `…/v1/SpriteChen1-3.png`.
- Geste signature : **le socle éclairé sous chaque Pokémon**, teinté par la région (Kanto vert, Johto doré) ; en atlas, le Pokémon-vignette collé sur la carte.
- Décors : 16:9 1920 × 1080, vus de face ou de trois quarts, point focal dans les données. Les décors de la V1 sont à régénérer.

## Responsive
- 390 px : navigation basse, scène ≈ 300 px (cible tactile), équipe en 6 cases de 56 px, dialogue visible sans défiler.
- 1440 px : navigation à gauche, scène 16:9 au centre (largeur limitée pour que scène et dialogue tiennent sans défiler dans la fenêtre), équipe à droite, dialogue sous la scène ; atlas en double page.
- Ordre des blocs repensé sur mobile, pas réduit.

## Interdits de la marque
1. Pas de publicité. 2. Pas de texte en anglais. 3. Pas de mascotte inventée. 4. Pas d'animation saccadée (ni `steps()` sur un sprite, ni flou animé). 5. Pas d'image qui saute, bugue ou soit mal découpée (bandes noires, étirement, décalage : un seul ratio par type d'image, `width`/`height` posés, sprite suivant préchargé).
Hérités : pas de `backdrop-filter`, pas de dégradé violet, pas de texte en dégradé, pas d'emoji en icône, pas d'ombre floue, pas d'animation sur chaque bloc, pas de capitales espacées ni de numérotation de sections, pas de flèche décorative, pas de valeur en dur hors des jetons.

## Voix
Tutoiement, phrases courtes, chaleureux. Boutons à l'impératif court. Erreur = ce qui s'est passé + quoi faire. Textes de la V1 à reprendre.

## Journal de décisions (ajouter, ne jamais réécrire)
- 2026-10-23 — Rouge Feu pour Kanto seulement ; un thème par région fidèle au jeu officiel ; carte du monde en atlas — décision de Nicolas.
- 2026-10-23 — Johto = HeartGold / SoulSilver, thème d'interprétation faute de captures d'interface — à recaler avec des captures du jeu.
- 2026-10-23 — Direction C « appareil de région » (boîtier Pokédex / Pokégear) abandonnée — incomprise, rendu jouet, coût de 9 boîtiers.
- 2026-10-23 — Plafond de 12 clics/s, tutoiement, mode sombre par défaut — décisions de Nicolas.
- 2026-10-24 — Plus de bouton « Attaque » : on touche la scène (comme la V1 et les autres clickers) ; gain de place, le dialogue et le message de fin de zone doivent être visibles sans défiler ; les notifications (mise à jour, hors connexion) sont des toasts flottants qui ne déplacent jamais la mise en page — décisions de Nicolas après essai sur PC et téléphone.
- 2026-10-24 — Choix des variantes de pages (bilan de Nicolas, `docs/projet/choix-variantes-b.md`) : Équipe A, Fiche Pokémon B (fenêtre superposée), PC B (recherche, tri shiny, équipe à droite), Shop B (sans panier), Plus C, Carte A + « Ton voyage » ; Sac, Chen et starter à refaire d'après la V1 — décisions de Nicolas.
- 2026-10-24 — **On reprend le visuel, les animations, les sons et les easter eggs de la V1** (retravaillés si besoin, jamais supprimés) ; inventaire dans `docs/projet/v1-visuel-a-porter.md` — décision de Nicolas.
- 2026-10-24 — Carte d'équipe : sur mobile, le niveau s'affiche en chiffre seul au-dessus d'une barre d'XP fine (jeton `info`, comme en V1) ; sur PC « Niv. N » reste, la barre s'ajoute — décision de Nicolas. Message de montée de niveau « <Nom> passe au niveau N ! » en cadre bref dans la scène.
