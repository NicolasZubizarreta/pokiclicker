# Charte graphique — PokiClicker v2 (nom de travail)

Version 1.0.0 · 23/10/2026. Valeurs : `charte.json` (Kanto, thème de base), `regions.json` (Johto, Hoenn provisoire, atlas), générés en `tokens.css` et `regions.css`. Règles de construction pour les agents : `DESIGN.md`.

## 1. Identité
**Mission.** Un jeu clicker Pokémon pour Nicolas et ses amis : on avance, on collectionne, on choisit quoi acheter et quand. L'interface doit se lire d'un coup d'œil au pouce, sur téléphone en portrait d'abord.
**Publics.** Nicolas et ses amis, sur mobile et PC. Pas de public, pas de monétisation.
**Personnalité.** Lumineux, joueur, lisible, chaleureux.
**Curseurs.** Variance 5 (squelette régulier, détails qui varient selon la région), mouvement 6 (retours de clic riches, un seul moment d'entrée par écran), densité 6 (équipe, DPS et boutons visibles ensemble).
**Trois couches (décision du 23/10).** 1) Un **squelette** commun : mêmes composants et mêmes agencements dans toutes les régions. 2) Un **thème par région**, qui reprend l'esprit du jeu officiel de la région, en pixel mais moderne : Kanto = Rouge Feu / Vert Feuille, Johto = HeartGold / SoulSilver, les autres plus tard. L'esprit Rouge Feu ne vaut que pour Kanto. 3) La **carte du monde** (hub) : style « atlas » illustré, papier et encre, hors thème de région.

## 2. Logo
Aucun logo : le jeu n'a pas de nom définitif. L'en-tête affiche le nom de travail en `titre`. Un logo viendra avec le nom ; il vivra dans `design/logo/` (SVG). Pas de mascotte inventée : le Prof. Chen (personnage de la série) est le seul guide.

## 3. Couleurs
Gammes OKLCH à 11 paliers (`tokens.css`) : `primaire` rouge Feu (palier 600 = `#c8321e`), `secondaire` jaune pièce (400 = `#f5c033`), `accent` bleu mer (600 = `#2b6c9e`), `neutre` bleu nuit à deux paliers clairs crème (50 = `#f4efe4`, 950 = `#141821`).
Rôles (toujours utilisés, jamais les gammes dans un composant) : `fond`, `surface`, `surface-2`, `bordure`, `texte`, `texte-doux`, `texte-inverse`, `action`, `action-survol`, `action-texte`, `lien`, `focus`, `selection`, `blanc`. Rôles de région : `region-accent` (liserés, chiffres importants), `region-argent` (liserés secondaires), `region-socle` (socle sous les Pokémon).
**Mode sombre par défaut** (décidé par Nicolas) ; le clair existe pour chaque thème.
Proportions indicatives : 70 % neutres, 20 % couleur de la région (cadres, boutons), 10 % accent (argent, étape active).
Sémantiques : succès vert, alerte or, erreur cramoisi, info bleu. L'erreur et le succès portent toujours un pictogramme en plus de la couleur.

## 4. Typographie
- **Titres et étiquettes** : Pixelify Sans 600, uniquement aux tailles `xl` (20 px), `2xl` (24), `3xl` (32), quatre mots au plus, jamais une phrase.
- **Texte et chiffres** : Atkinson Hyperlegible Next (repli Atkinson Hyperlegible, puis `system-ui`), 400, 600, 700, chiffres tabulaires partout (`font-variant-numeric: tabular-nums`).
- **Carte du monde (atlas)** : Lilita One (titres, boutons) et Nunito (texte).
- Échelle : `xs` 12 px (légendes seulement), `sm` 14, `base` 16 (texte courant, minimum sur mobile), `lg` 18, `xl` 20, `2xl` 24, `3xl` 32, `4xl` 40, `5xl` 48. Ligne de texte ≤ 75 caractères. Les polices sont hébergées localement en production.

## 5. Espace et grille
Grille de 8 px (`espacement` de base 4 px, usage par multiples de 2). Marges de page : 16 px sur mobile, 32 px sur PC. Unité de pixel : 1 px d'art = 2 px CSS sur mobile, 3 px sur PC (sprites, cadres, icônes pixel). Aucune largeur fixe en px sur un conteneur ; réglage par container queries et `clamp()`.

## 6. Formes
- **Kanto** : aucun rayon, cadres pixel à double liseré, ombres pleines sans flou (`sm` 2 px, `md` 4 px, `lg` 8 px).
- **Johto** : coins légèrement arrondis par pas de pixel (4 px), double liseré or puis argent, reflets fins sur les boutons, médaillons ronds pour les étapes.
- **Atlas** : bords d'encre irréguliers, rayon visuel 12 px, ombre pleine décalée de type cartoon.
- Pas de `backdrop-filter`, pas de flou d'ombre.

## 7. Icônes et images
- Icônes : un seul jeu, dessiné en SVG en ligne, trait de 2 px, 24 px (nav) ou 20 px. Pas d'emoji.
- Sprites Pokémon : 96 × 96 px natifs, agrandis par un facteur **entier** (×2 mobile, ×3 PC), `image-rendering: pixelated`, `width`/`height` toujours posés.
- Décors de zone : **16:9, 1920 × 1080**, WebP, vus de face ou de trois quarts avec un sol où poser le Pokémon ; le point focal est enregistré dans les données (`object-position`), jamais de recadrage à la main. Le décor de la V1 (vu de dessus, filigrane étoile) est à régénérer.
- Cartes illustrées : un ratio par type (référence : **1800 × 963**), zones cliquables en **pourcentages** dans les données, mode « Placer » pour les régler, filigrane retiré.

## 8. Composants
Détail et états dans `DESIGN.md`. Principes :
- **Bouton d'action** : `action` + `action-texte`, ≥ 44 px (≥ 88 px pour « Attaque » sur mobile), plaque en relief (arête claire de 2 px en haut, ombre pleine `md`), au pressé il descend de 2 px. Un seul bouton primaire par écran.
- **Cadre** : double liseré, thème de région.
- **Barre de PV** : pixel, vert puis jaune puis rouge selon le niveau ; une barre « fantôme » plus claire la rattrape après 300 ms.
- **Étapes** : 10 marques, la 10e est le boss (Poké Ball en Kanto, cachet en Johto, cachet de cire en atlas).
- **Carte de Pokémon** : sprite sur socle `region-socle`, nom, niveau, DPS (chiffres tabulaires).
- **Boîte de dialogue** : en bas de la scène, sprite du Prof. Chen, flèche qui rebondit doucement.
- **Navigation basse** : 5 entrées (Combat, Équipe, Shop, Carte, Plus), 56 px de haut, l'entrée active est marquée par la forme et la couleur.

## 9. Mouvement
Un seul moment orchestré à l'arrivée d'un écran ; ensuite, retours d'état seulement. Propriétés : `transform` et `opacity` uniquement. Durées : `rapide` 90 ms (reculs, pressions), `normal` 150 ms, `lent` 300 ms. Chiffre de dégâts : monte de 24 px et s'efface en 500 ms. Recul de l'ennemi : 4 px, 90 ms. Aucune animation de sprite par `steps()`, aucun flou animé. `prefers-reduced-motion` coupe tout (le chiffre de dégâts reste, sans mouvement). Les animations ne tournent pas au rythme de la boucle de jeu (10 Hz). Le sprite suivant est préchargé avant la mort de l'ennemi : aucune image ne saute.

## 10. Voix et ton
- **Tutoiement**, phrases courtes, registre chaleureux et complice (« Beau travail ! Encore 6 combats avant le boss »). Les textes de la V1 sont à reprendre (intro du Prof. Chen, fins, Panthéon, Johto) en les relisant avec cette règle.
- Boutons : verbe à l'infinitif ou impératif court (« Attaque », « Y aller », « Capturer »).
- Erreurs : ce qui s'est passé, puis quoi faire (« Plus de Poké Balls. Passe au Shop pour en acheter. »).
- Tout est en français ; jamais de texte en anglais, y compris dans les états de chargement et les erreurs.
- Mots bannis : « Libérez », « solution », « révolutionnaire ». Pas de ton publicitaire : le jeu n'a pas de pub.

## 11. Accessibilité
Contrastes contrôlés par `charte-build` (44 contrôles, 0 échec) et `scripts/regions-build.cjs` pour les régions : texte ≥ 4,5:1, focus ≥ 3:1. Texte ≥ 16 px sur mobile. Cibles tactiles ≥ 44 × 44 px. Focus clavier toujours visible. Libellé visible sur chaque champ. Textes alternatifs décrivant l'action (« Rattata sauvage, niveau 4 »). Couleur jamais seul porteur d'information.

## 12. Déclinaisons
- **Écran de jeu** (combat, équipe, PC, shop, pension, casino, centre commercial, Pokédex, profil) : thème de la région courante.
- **Carte du monde et choix de région** : atlas.
- **Compte et choix de partie** : thème de la dernière région jouée, ou Kanto par défaut.
- **Dialogues et séquences** (Prof. Chen, rival, Ronflex) : boîte de dialogue du thème, sprites du personnage.
- Mobile : navigation basse, bouton d'action sous le pouce droit, feuille basse compacte (nom, état, bouton) pour les fiches. PC : navigation à gauche, scène au centre, équipe à droite.

## 13. Interdits
Ceux de la marque (cinq) : pas de pub ; pas de texte en anglais ; pas de mascotte inventée ; pas d'animation saccadée ; pas d'image qui saute, bugue ou soit mal découpée (bandes noires, étirement, décalage).
Hérités des interdits par défaut : dégradé violet vers bleu ou rose ; texte en dégradé ; plus de deux couleurs vives par écran ; emojis comme icônes ; `backdrop-filter` ; ombres floues larges ; animation sur chaque bloc ; étiquettes en capitales espacées et numérotation de sections ; flèches décoratives ; carte dans une carte dans une carte ; couleur ou taille en dur hors des jetons. Assumés volontairement : bordure + ombre + fond sur un même élément (le cadre pixel est une seule matière dessinée) et fond texturé en atlas.

## 14. Historique
- 1.0.0 — 23/10/2026 — première version : squelette, thème Kanto (Rouge Feu), thème Johto (HeartGold / SoulSilver, interprétation), thème Hoenn provisoire, atlas du monde. Écarte la direction « appareil de région ».
