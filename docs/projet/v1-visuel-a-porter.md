# Visuels, animations et easter eggs de la V1 à porter

Inventaire lu dans `legacy/` le 24/10/2026 (agent d'exploration, faits seulement). Règle de Nicolas : **on reprend tout ce qui fait le visuel et le plaisir de la V1, retravaillé si besoin, jamais supprimé** (voir `choix-variantes-b.md`). Chemins relatifs à `legacy/` ; `kanto.js` = `js/regions/kanto.js`, `save.js` = `js/game/save.js`, `styles.css` = `css/styles.css`.

## 1. Carte de Kanto (ticket G)
- **Fond** : `img/kanto/kanto.png` (1920 × 1080, 156 Ko), modale 16:9, opacité 0,9.
- **Zones cliquables** : un SVG superposé, `viewBox` = `0 0 1920 1080`, donc coordonnées en pixels natifs (`MAP_DATA`, `kanto.js:12-37`, 24 entrées `rect [x1,y1,x2,y2]`, `circle [cx,cy,r]`, `polygon [x,y,…]`). Deux entrées non cliquables : « Lavanville » et « Daran Ass » (zone fantôme). Les formes se chevauchent (l'ordre décide). **À convertir en pourcentages** (la V2 n'a pas de pixels en dur).
- **États** : verrouillée (gris), débloquée (couleur de type de lieu), actuelle (vert, pulsation), survol (contour jaune). **Pas d'état « terminée » en V1** (nouveau en V2). Tutoriel : Route 1 clignote en vert (`flash-green-strong`, 0,8 s en boucle) ; le bouton carte rebondit avec un anneau vert tant que la Route 1 n'a pas été visitée.
- **Déblocage** (V1 : aucune animation sur la carte, seulement un fondu de 300 ms) : message « ZONE DÉBLOQUÉ ! » jaune qui rebondit, puis « POKÉSHOP DÉBLOQUÉ ! » (zone 2), « PC DE LÉO DÉBLOQUÉ ! » (3), « PENSION DÉBLOQUÉE » (11), puis les objets du Shop ; flèche « suivant » bleue pulsante. **À créer en V2 : une vraie animation de déblocage sur la carte.**
- **Téléportation « vol Gen 1 »** (`flyToZone`, `save.js:717-798`, `styles.css:97-154`), 3,8 s : sprite de dresseur animé (`SpriteFly1-5.png`, 150 ms par image) au centre de la zone actuelle, puis overlay noir en « télé CRT » (ouverture 0,4 s), traits de vitesse, oiseau (Roucarnage animé) qui traverse en 2,5 s, changement de zone derrière l'overlay, fermeture 0,4 s. Double clic ignoré.
- **Info au clic** (`showZoneInfo`) : miniature 96 × 96 du fond de zone, nom, « Zone N », bouton « Y ALLER » (ou « BLOQUÉ »). Céladopole : 3 boutons (Arène, Centre commercial, Casino). Infobulle « Nom (Zone N) ».

## 2. Badges (ticket N)
- **« Boîte à badges »** : modale, grille de 4 colonnes, 8 cercles ; obtenu = fond clair, bordure et halo dorés ; non obtenu = silhouette blanche grisée à 30 %. Survol : « **Nom** : effet ». Assets `img/kanto/badges/*.png` (8 fichiers).
- **Animation d'obtention** (`checkBadges`, `save.js:561-584`, `badge-slam` `styles.css:191-198`) : message « BADGE X OBTENU ! » (1,2 s) + son, la boîte à badges s'ouvre à 1,2 s, le badge est caché puis « claque » à 2 s (échelle 5 → 1 → 1,4 → 1, 1,2 s, courbe `cubic-bezier(.175,.885,.32,1.275)`), fin à ≈ 3,2 s.

## 3. Intro jouable (ticket P)
Pas de déplacement libre : des **scènes avec zones cliquables en SVG** (pixels natifs de chaque image).
1. **Écran titre** (sans sauvegarde) : « POKÉ CLICKER / KANTO ORIGINS » qui rebondit, bouton JOUER, import JSON ; fondu d'entrée de l'interface 1 s.
2. **Chez Maman** (`Chez Maman.png`) : « Il n'y a rien à faire ici, sortons. », sortie verte pulsante ; **télé cliquable cachée = easter egg** (lecture de `Daran.mp4`).
3. Transition : voile noir 300 ms.
4. **Bourg Palette** (`Zone 0.png`) : Chez Maman, Chez Blue (scène gag : « Eh pourquoi il a le droit à une maison en 3D lui ? »), Pension (après la zone 11), **Labo de Chen** (clignote en vert tant que non visité), Bateau vers Johto.
5. **Labo** : à la première visite, dialogue de Chen après 1 s : Chen glisse de la droite en 1,5 s, boîte de dialogue à 1,6 s, **machine à écrire 30 ms par caractère**, ▼ rouge qui rebondit, `SpriteChen1-3`, à la 4e ligne **le cadenas du sac se brise** (`break-lock`) et +5 Pokéballs, à la 6e la **carte est débloquée** (bouton qui rebondit).
6. **Choix du starter** : « CHOISIS TON PARTENAIRE », 3 Poké Balls ; au survol la ball cède la place à l'artwork (fondu 300 ms, ×1,1) avec le nom ; au clic l'artwork passe à ×1,5, les autres disparaissent, bouton « CHOISIR <NOM> » ; niveau 5, sexe aléatoire, shiny pré-tiré 1/256 avec halo doré.
7. Sortie du labo qui clignote → bouton carte qui rebondit → Route 1 qui clignote → info → vol.

## 4. Animations (ticket Z) 
Keyframes de `styles.css` : `float` (sprite ennemi, 3 s), `shake` (chaque clic, 0,3 s, ± 5 px, éclat blanc), `catch-shake` (capture : silhouette noire qui tremble, 1 s), `evolution-flash` (3 s, clignotement blanc), `badge-slam`, `flash-green-strong`, `break-lock`, `rainbow` (jeb_), `float-upside-down` (dinnerbone), `coin-spin` (pile ou face), `flicker-black` (glitch du défi de Chen et de la fin), `zoom-in-entrance`, `fly-to-bag`, `diploma-entrance`, `title-slam` (« MAÎTRE DE LA LIGUE DE KANTO »), `end-credits-scroll` (110 s), `credits-float-life`, et les trois du vol. Aussi : `shiny-glow` (ombre dorée), nombres de dégâts flottants (vert efficace, rouge peu efficace), barre de PV (vert, jaune < 50 %, rouge < 25 %), minuteur de boss violet, anneau de bonheur (`conic-gradient`), bannière « SHINY APPARU ! AUTO STOPPÉ ! » qui rebondit, « RECHERCHE EN COURS... » entre deux ennemis, confettis et feux d'artifice du Panthéon, chute des Pokémon sur les socles (1 toutes les 2 s), générique avec images flottantes, fin du Pokédex (glitch, Chen qui monte, diplôme, charme chroma), défi secret de Chen (6 combats niveau 100), machine à sous (rouleaux à 80 ms, arrêts à 700/950/1200 ms), pension (cœur pulsant, œufs qui rebondissent), évolution (alternance des deux formes toutes les 150 ms).
**État de chaque animation (25/10, ticket Z)** :
- **Reprises** : `float` (flottement 3 s, Z), `shake` (secousse 0,3 s + éclat blanc, Z), `shiny-glow` (halo doré net, proposé : à confirmer), bannière d'arrêt auto (Z), « Recherche en cours… » (pulsation, Z), nombres de dégâts verts/rouges (H, couleur Z), `catch-shake` (J), `evolution-flash` et alternance 150 ms (K), `badge-slam` (N), `flash-green-strong` (P), `break-lock` (G), les trois du vol (G), barre de PV (H).
- **Retravaillée** : minuteur de boss violet → `alerte-base` (jeton de la charte) ; ombre dorée floue du `shiny-glow` → contour net (la charte interdit l'ombre floue).
- **À porter dans leur ticket** : `rainbow`, `float-upside-down` (W) ; `coin-spin`, machine à sous (V) ; `flicker-black`, `zoom-in-entrance`, `fly-to-bag`, `diploma-entrance`, `title-slam`, générique, défi de Chen (X) ; confettis, chute sur les socles (R) ; cœur pulsant et œufs qui rebondissent de la pension (T, page en attente de ton choix).
- **« Recherche en cours… »** : reprise (`EcranCombat.tsx`, pulsation, coupée en mouvement réduit).
- **Finitions tranchées par Nicolas le 27/10** (page d'essai `design/variantes/finitions/index.html`) :
  - contour noir des textes posés sur l'image : **repris, version fine** (1 px, ombre pleine sans flou, `.contour-texte` dans `src/styles/index.css`) ; appliqué aux nombres de dégâts et à « Recherche en cours… », qui n'ont plus de panneau ;
  - verre dépoli : **écarté** (la charte interdit `backdrop-filter`) ; remplacé par des panneaux semi-transparents à 82 % sans flou (`bg-surface/82`) sur la scène de combat (fiche de l'ennemi, annonce, message de lieu) ;
  - police Press Start 2P : **écartée**, Pixelify Sans reste la police des titres ;
  - étoiles ✦ : **reprises** pour les chromatiques, en doré de la charte (`--color-alerte-base-sombre`), à la place du double éclat bleu-vert (`src/ui/IconeShiny.tsx`).

## 5. Icônes (tickets L, D)
- **Objets** : 20 sur 31 viennent de `raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/<nom>.png` (poke-ball, great-ball, ultra-ball, master-ball, rare-candy, repel, super-repel, x-attack, x-sp-atk, calcium, 5 pierres, poke-doll, everstone, amulet-coin, protein, exp-share, hard-stone, bicycle, lucky-egg, leftovers). Locaux : `JetonShiny`, `CharmeChroma`, `Diplôme`, `OmniExp`, `PokeRadar`, `Carte` (dans `img/kanto/icones/`). Material Symbols pour Chaussures (`sprint`), Radar, CT Fauchage, CT Jackpot. **Ce sont les « icônes officielles » que Nicolas veut** : à rapatrier en local (règle « aucune ressource externe au chargement ») avec son accord pour le téléchargement.
- **Pokémon** : sprites `sprites/pokemon/<id>.png` (petits), artworks `other/official-artwork/<id>.png` et `other/home/shiny/<id>.png` (grands, starters, Panthéon). Types : couleurs seulement (`TYPE_COLORS`, 18). Sexe : ♂ bleu, ♀ rose.
- Assets locaux de la V1 : `img/kanto/` (56 fichiers, ≈ 217 Mo) : 22 fonds de zone + 7 scènes (Casino, CentreCommercial, Chez Blue, Chez Maman, LaboPokemon, Pantheon, Pension), 8 badges, 8 sprites (Chen 1-3, Fly 1-5), 6 icônes, 4 fichiers d'easter eggs.

## 6. Easter eggs (ticket W)
Renommage : **dinnerbone / grumm** (sprite retourné), **jeb_** (arc-en-ciel), **caca** (filtre brun), **Daran** (photos `DaranStade1-3.png` selon le stade ; pendant l'évolution elles alternent), **Johnny** (×1,5 contre les Ténèbres : décision précédente = non porté), **Évoli** renommé jolteon/vaporeon/flareon → évolution voulue. **Télé de Chez Maman** qui joue `Daran.mp4` (muet). **Zone fantôme « Daran Ass »** sur la carte. Cheat par mot de passe (non porté). Défi secret de Chen après 2 victoires de Ligue et 151 espèces.

## 7. Sons
Aucun fichier audio. Un synthé Tone.js (5 tons : `hit` clic, `coin` kill, `catch` capture / arrivée au Panthéon, `up` niveau / badge / évolution / bonbon, `pc`). Pas de musique. À reproduire avec la Web Audio de base (sans bibliothèque ni CDN). **Repris** dans `src/ui/sons.ts`. La musique de la V2 est nouvelle (pistes CC0, voir `docs/projet/musiques.md`).

## 8. Utilisation des objets dans le Sac (ticket L)
- Balles : clic direct (capture).
- **Mode sélection** : cliquer l'objet affiche « SÉLECTIONNEZ UN POKÉMON » et les lignes d'équipe pulsent en bleu ; Calcium, Stase, pierres : cibles valides vertes, invalides grisées ; clic ailleurs = annulation ; un seul mode à la fois.
- **Bonbon** : sélecteur − / n / + sur la ligne du Pokémon avec ✓ ✗ (max = min(stock, 100 − niveau)), « +N NIVEAUX ! ». **Calcium** : même sélecteur, limite 10, « +N % DPS PERMANENT ». **Pierres** : confirmation, puis évolution animée (Évoli : 3 branches). **Pierre Stase** : retrait par clic droit → « Retirer l'objet ». **Jeton Shiny** : cible + confirmation + « SHINY !!! ».
- **Sans cible** : Repousse (+30 s), Super Repousse, Attaque + / Attaque Spé + (×1,5 pendant 30 s, **pastilles de compte à rebours sous les PV**), Poké Poupée (boss invoqué), CT Fauchage (bouton dans l'en-tête de l'équipe, recharge 30 s).
- Passifs : « ACTIF » en vert ; Diplôme : « VOIR ». Shop : clic = achat, bouton « i » = fiche, prix rouge si pas assez d'argent.

## 9. À ne pas oublier
Pension (cœur, œufs), Casino complet (jetons, machine à sous à 5 symboles, blackjack contre « Croupier Rocket », pile ou face, boutique de jetons), Centre commercial, Poké-Radar (grille de la zone, silhouettes, pastille de rareté), Pokédex 151 + 10 paliers, fiche résumé (anneau de bonheur), Stats détaillées, auto-stop paramétrable avec bannière, menu contextuel clic droit, **Guide du jeu** complet, intro de Johto et bateau, menu mobile en grille 4 × 2.
**Guide du jeu : porté le 28/10 (ticket AL)** : voir la section 10.
Défauts hérités à ne pas reproduire : encodage cassé (`controls.js` en Windows-1252, « ? » à la place de ♥ ★ ♂ ♀, « Nidoran? »), texte « DÉBLOQUÉ ZONE 4 » du PC alors que le code l'ouvre à la zone 3, keyframes jamais utilisées (`coin-blink`, `shiny-filter`, `end-credits-intro`…).

## 10. Guide du jeu (ticket AL, 28/10)
Les 13 sections de la V1 (`legacy/index.html:800-890`) sont dans `data/guide.json`, dans le même ordre, **mot pour mot** (un test relit la V1 et compare). Affichage : `src/ui/Guide.tsx`, ouvert par le bouton « Guide du jeu » de la page Plus. Les numéros de zone d'ouverture (Auto-clic, Poké-Radar, Pension, PC, Fauchage) et les chiffres (10 étapes, 30 s, 2 % / 4 %, 125 de bonheur, +25 %, 10 combats de Ligue, 6 combats du défi, 151 espèces) sont des marqueurs `{…}` remplacés par les valeurs de `data/` (`src/core/guide.ts`) : ils ne peuvent plus se désynchroniser. Les marqueurs donnent aujourd'hui exactement les chiffres de la V1.

**Phrases devenues fausses ou obsolètes en V2.** Le texte n'a pas été corrigé à la place de Nicolas ; à lui de dire quoi réécrire.
| Section | Phrase de la V1 | Pourquoi elle ne correspond plus |
|---|---|---|
| Parcours, 1 | « Départ chez Maman (Bourg Palette): sors, puis va au Labo du Prof. Chen. » | La V2 enchaîne titre, Chez Maman, Bourg Palette puis Labo dans l'intro : on ne sort pas soi-même de chez Maman. À vérifier. |
| Parcours, 7 et Fauchage | « Pokéshop » | L'onglet s'appelle « Shop » en V2. |
| Fonctionnalités | « Auto-attaque: … (bouton épées) » | Le bouton est un bouton texte « Auto-attaque » (le ticket AE pourrait le passer en icône). |
| Fonctionnalités | « Auto-stop: … bouton “main” … icône “settings” » | Les boutons s'appellent « Arrêt auto » et « Réglages de l'arrêt ». |
| Fonctionnalités | « Menu Stats: accessible via Profil. » | Il n'y a ni Profil ni menu Stats en V2 (la page Plus a seulement « Ton aventure »). Fonction de la V1 non portée. |
| Pokédex | « une récompense visible dans le menu “Récompenses” » | Les paliers sont affichés dans la page Pokédex, sans menu « Récompenses ». |
| Sauvegarde | « utilise “Sauver” dans le profil … “Importer une sauvegarde (JSON)” dans le menu de début du jeu » | Aucun export ni import de fichier en V2 pour l'instant, seulement la sauvegarde automatique locale. |
| Reset | « Le bouton Reset réinitialise la progression… » | Aucun bouton Reset en V2. |
| Centre Commercial | « Retrait via la fiche Résumé. » (Pierre Stase) | En V2 le retrait passe par le menu du Pokémon dans l'équipe (la V1 elle-même le faisait par le clic droit). |
| Centre Commercial | liste des « objets exclusifs » | Incomplète depuis la V1 : le Centre vend aussi le Calcium et le Jeton Shiny. |
| Ligue | « En battant la Ligue, tu accèdes à la prochaine région. » | Johto n'est pas jouable : la V2 affiche « bientôt » à la première victoire. |
| PC | « trier par numéro, nom, niveau ou favori » | La V2 ajoute le tri « Shiny » et une recherche. |
Ce qui ne bouge pas malgré les écarts décidés : le guide ne cite ni prix, ni recharge, ni inflation, donc ni le Calcium à 20 000, ni les pierres sans inflation, ni la recharge du Fauchage à 20 s ne le rendent faux.
