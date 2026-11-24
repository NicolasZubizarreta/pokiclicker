# Recette E : remise à niveau des e2e (24/11/2026)

Mission : les specs Playwright rouges (environ 58 cas) l'étaient parce que l'interface avait changé aux lots 1 à 6, pas parce que le jeu cassait. Chaque famille a été rejouée seule (projets `mobile` et `pc`) avant la suivante. Aucun test affaibli, aucun changement dans `src/` ni `data/`. Rien n'est poussé. La suite complète de 2 h n'a pas été relancée.

## Résultat

- Rejoués et verts : boutique, navigation entre zones, capture et choix de balle, équipe, dialogues de scène, annonces de déblocage (casino, pension), Sac, Statistiques, Carte, PC (téléphone), états PC, objets actifs, coquille PC, écrans PC (Réglages 1280×800 et 1440×900), accessibilité (ligne 90).
- Reste rouge, défauts réels : `pc.spec.ts:148` (PC, 1440×900) et `fluidite.spec.ts:4` (mobile). Détail plus bas.
- `combat.spec.ts` (pc) a dépassé son délai quand la machine était chargée par d'autres sessions (trois tests à 60 s, un à 120 s), puis est passé seul : `combat.spec.ts:109` en 32 s. Ce n'est pas un défaut.

## Par famille

### 1. Boutique, commit ba9c352
`boutique.spec.ts`, `centre-pc.spec.ts`, `centre.spec.ts`. Le sélecteur de quantité remplace l'ancien bouton : `'+ : augmenter'`, `/^Acheter ×2 : /`, bouton désactivé « Il te manque X ₽ », drapeau `starter-choisi` ajouté à l'état de départ de `centre.spec.ts`.

### 2. Navigation entre zones et données, commit a0a7923
`combat.spec.ts`, `bourg-palette.spec.ts`, `intro.spec.ts`, `navigation-centre.spec.ts`. Flèches `/^Suivant : /` et `/^Précédent : /`, boîte de dialogue lue par `/^[^:]+ : /`. Blue est « parti s'entraîner » (bulle et bouton « Défier Blue » désactivé). Le test « Erreur de données » corrompt une région et attend « Cette sauvegarde ne peut pas être lue. ».

### 3. Capture, balle, équipe, commit f290a25
`aide-combat.ts` (helpers `balle` et `choisirBalle`, bouton « Nom ×n, changer de balle »), `capture.spec.ts` (compteur « 4 / 6 » visible parmi deux textes), `combat-equipe-pc.spec.ts` (équipe de départ à six), `equipe.spec.ts` (un favori ne se relâche pas : bouton désactivé et message ; la confirmation « Veux-tu vraiment relâcher » se teste après avoir retiré le favori).

### 4. Annonces de déblocage, commit 1c9b9d8
`casino-visibilite.spec.ts`, `pension-visibilite.spec.ts`. L'annonce de la carte arrive après `ecranLibre()` : `runFor(1000)` devient `runFor(5000)`. La Pension a un seul bouton « Retour ». Les cartes `.pension-fente` sont sous la scène : la mesure compare à `mesures.zoneBas` (787, 860, 1040 px pour 800, 900, 1080 de haut).

### 5. Dialogues de scène, commit 3022c15
`scenes.spec.ts`. Boîte de dialogue lue par `/^[^:]+ : /`. À la Centrale, la zone suivante est `?` sur la carte tant que la précédente n'est pas finie : le test le vérifie par `data-zone` / `data-forme`.

### 6. Sélecteurs isolés, commits 6a55dfb et 21bb072
- `sac.spec.ts` : Fermer ramène à la page d'où le Sac a été ouvert (le Combat) et rouvre le Sac ; appliquer l'objet ramène aussi au Combat (`Coquille.tsx`, `retourChoix`) ; la proposition d'évolution de Bulbizarre niveau 16 est remise à plus tard.
- `stats.spec.ts` : douze cartes (Partie, Argent dépensé, Casino, Records, Argent gagné sur 7 jours s'ajoutent aux sept d'origine) ; `revision += 1` après édition de la sauvegarde.
- `carte.spec.ts` : Bourg Palette est la zone de départ, on y arrive sans vol. Le test de vol part maintenant de Bourg Palette vers la Forêt de Jade avec `bossVaincus = ['kanto.route-1']`.
- `casino.spec.ts` : drapeau `starter-choisi`. `pension.spec.ts` : « Retour » exact.
- `pc.spec.ts` : sur téléphone, « Trie par » est derrière le bouton « Filtres » ; le compteur « 6 / 6 » existe deux fois (panneau PC et téléphone), on prend le visible ; `ouvrirPc` remet à plus tard la proposition d'évolution d'un Pokémon du PC placé dans l'équipe.
- `etats-pc.spec.ts`, `coquille-pc.spec.ts` : sept entrées de navigation sur PC, touches 1 à 7 (DESIGN.md, Navigation : Équipe fusionnée dans PC).
- `objets-actifs.spec.ts` : après rechargement, Repousse garde ses 20 s (les durées d'objets ne courent plus hors ligne, B-core-11, commit b5c5a66) ; le retrait de la Pierre Stase passe par la fiche (« Retirer la Pierre Stase de … ») ; la proposition d'évolution est écartée avant d'ouvrir le Sac.

## Défauts réels restants

1. **PC, 1440×900 : le panneau « Ton équipe » défile** (`pc.spec.ts:148`, assertion « les six places sont visibles sans défilement dans le panneau »). Mesures : `.pc-panneau` fait 356 px de haut pour 520 px de contenu. Le bloc « Équipes enregistrées » (`EquipesEnregistrees`, ajouté par b1bc564) prend environ 260 px au-dessus de la grille ; `.pc-corps` n'a plus que 452 px et la ligne du panneau 356 px. À régler dans `src/ui/PagePC.css` / `PagePC.tsx` (par exemple équipes enregistrées repliées ou à côté du panneau), pas dans le test. La suite du test (glisser de l'équipe vers le PC, « C'est ton dernier Pokémon ») n'a pas été atteinte tant que cette ligne échoue.
2. **Fluidité à 12 appuis par seconde, processeur ralenti 4×** (`fluidite.spec.ts:4`, projet mobile). Rejoué seul sur machine au repos (8 % de charge) : plus petite fenêtre d'une seconde 15 images (seuil 50), moyenne 29,4 (seuil 55), 86 tâches longues de plus de 50 ms (seuil 5). Deux mesures donnent le même ordre de grandeur. Le coût vient de `src/` (suivi, statistiques ou rendu à chaque tick) ; non investigué ici.

## Points à connaître

- Les « 4 défauts » traités par l'autre session : Réglages PC (3780aba) et accessibilité des Stats PC (e376034) sont corrigés côté `src/` ; `ecrans-pc.spec.ts` et `accessibilite.spec.ts:90` passent sans modification de ma part. `pension-visibilite:139/140` passe après b146dff.
- La proposition d'évolution d'un Pokémon de niveau 16 ou plus bloque les clics au chargement : plusieurs specs partent d'un Bulbizarre niveau 16 et doivent la fermer.
- `iphone` (WebKit) n'a pas été rejoué pour casino et pension.
