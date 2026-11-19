# Audit du jeu, partie 1 : QoL et fonctionnalités

Date : 19/11/2026. Branche `v2`. Rien n'a été codé ni modifié dans le dépôt.

Périmètre : intro et starter, tutoriels, combat (barre de zone, scène, ennemi, capture, outils, attaque auto, arrêt auto, Fauchage, Poké-Radar, objectif permanent), équipe, évolution, éclosion, fiche Pokémon, PC, Pokédex, sac, notifications, raccourcis, sons. Shop, centre commercial, casino, pension, carte, menu, réglages, compte, objectifs et mini-jeux sont vus par l'autre session.

## Comment ça a été fait

- Instance Vite sur le port 5191, pilotée avec Playwright à 390 px (téléphone) et 1440 px (PC), sur des parties de test (jamais la partie de Nicolas).
- Parcours vus et regardés à l'écran : intro et labo (≈ 30 écrans de dialogue), choix du starter, Route 1 avec le tutoriel jusqu'à la bulle 6 sur 8, combat à 390 et 1440, boss (Sulfura niveau 80, chrono), tiroirs Sac, Radar, Objectifs et Réglage de l'arrêt auto, 60 s d'attaque auto, PC (liste, tri, filtre), fiche Pokémon, évolution (Caninos → Arcanin), Pokédex à 390 et 1440, raccourcis. Aucune erreur JavaScript dans la console sur tous ces parcours.
- Lus dans le code ou les données, non vus à l'écran : capture réussie ou ratée (`src/ui/store-capture.ts:42-43`), éclosion, relâche par lot, chrono du boss sous 10 s, Fauchage en action, notifications empilées (`data/reglages.json:87`, `src/ui/Notifications.tsx`), sons (`src/ui/sons.ts`, `src/core/reglages.ts:8`). Ces entrées sont marquées « lu dans le code ».
- Ce qui est déjà décidé ou livré n'est pas reproposé : tickets A à Z de `backlog-phase-5b.md` (4 dex, zones dans la fiche Pokédex, relâche par lot et relâche auto des doublons, passer les éclosions, fusion Équipe/PC, sac dans le PC, objectif permanent, Fauchage à 1 PV, pitié de capture, Pension dans la barre), tri par DPS, auto-clic lié à l'attaque auto, affichage du % de capture (hors périmètre), plafond 12 clics/s, simulateur et fidélité à la V1 (abandonnés).

Valeur : 1 forte, 2 moyenne, 3 faible. Effort : S (≤ 1 h), M (une demi-journée à une journée), L (plusieurs jours). Dans chaque section, classement par valeur décroissante, puis par effort croissant.

Total : 46 candidats QoL, 50 fonctionnalités.

---

# 1. QoL

### Q-j1-01 — La carte « Objectifs » masque le niveau et les PV de l'ennemi à 390 px
- Où : écran de combat, `EcranCombat.tsx` (carte ennemi et carte objectif permanent).
- Constat : sur les captures `20-390-combat` et `28-390-boss`, la carte « Objectifs : Boss : Sulfura, étape 10 » recouvre la carte de l'ennemi. « Niv. 62 » est caché derrière et « PV 351366 / 351366 » est coupé au milieu. Pour un boss, le nom est déjà écrit dans la carte ennemi (« Sulfura (Géant) »), l'objectif le répète.
- Proposition : sortir l'objectif de la scène et en faire un bandeau d'une ligne sous la barre de zone (« Objectif : boss, étape 10 »), ou le masquer quand l'ennemi est le boss de l'objectif.
- Valeur 1 · Effort S · Dépendances : aucune (touche au ticket W déjà livré).

### Q-j1-02 — La bulle du Prof. Chen cache les boutons dont elle parle
- Où : tutoriel de la Route 1, `src/ui/tuto/Tutoriel.tsx`, bulle de dialogue en bas de l'écran.
- Constat : sur `12-390-tuto-49`, la bulle (« Te voilà devant ton premier boss ! Chaque… », texte écrit lettre par lettre) est posée sur les boutons Capturer, Attaque auto, Arrêt auto, Réglage et Sac, au moment où le texte les explique. Le joueur lit l'explication sans voir l'objet expliqué.
- Proposition : placer la bulle en haut de l'écran quand l'étape désigne un bouton du bas (et inversement), et surligner le bouton concerné d'un cadre.
- Valeur 1 · Effort S · Dépendances : ticket E (tutoriel) déjà livré.

### Q-j1-03 — Niveaux coupés dans « Ton équipe » à 1440 px
- Où : colonne d'équipe du combat PC, `CarteEquipe.tsx`.
- Constat : sur `20-1440-combat`, « Ectoplasma Niv. 1( » et « Dracolosse Niv. 10 » sont tronqués, « Dracaufeu ✦ Niv. 1 » perd deux chiffres. Un niveau à trois chiffres, un nom long et la marque shiny ne tiennent pas sur la même ligne.
- Proposition : le niveau passe sur sa propre ligne, sous le nom, ou dans une pastille à largeur fixe.
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j1-04 — Aucune façon de passer les dialogues d'intro
- Où : intro, labo, choix du starter, dialogues d'après-choix (seul `Credits.tsx` a un bouton « Passer » parmi les écrans de dialogue).
- Constat : entre le premier écran et la Route 1, j'ai produit une trentaine de captures de dialogue (`02-intro-390-00` à `13`, `04-390-b-0` à `7`, `07-390-post-choix-0` à `11`), avec un toucher par écran. Une recherche de « Passer » dans `src/ui` ne trouve que les crédits, l'éclosion, l'évolution et le tutoriel. La vision prévoit le même choix du starter à chaque nouvelle région : ces dialogues reviendront.
- Proposition : bouton « Passer l'intro » après le premier visionnage (et dès la première fois, avec une confirmation), qui saute à l'écran de choix du starter.
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j1-05 — Deux boutons de combat sont des interrupteurs, deux ouvrent un tiroir, tous quatre se ressemblent
- Où : rangée « Attaque auto, Arrêt auto, Réglage, Sac », `ActionsCombat.tsx`.
- Constat : sur `20-390-combat`, la rangée a quatre boutons identiques. « Arrêt auto » porte un point blanc et une teinte (état allumé, `aria-pressed` + `::after`), « Attaque auto » est neutre sur la même capture. Rien n'indique que le premier est un interrupteur, le troisième un tiroir de réglage, le quatrième un sac. Impossible de savoir au coup d'œil si l'attaque auto tourne.
- Proposition : les interrupteurs montrent leur état en toutes lettres (« Attaque auto : oui / non », voyant vert) ; les tiroirs prennent une flèche ou un style de bouton secondaire.
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j1-06 — « Arrêt auto » et « Réglage » : des noms qui ne disent pas ce qu'ils font
- Où : même rangée, tiroir de réglage (`ReglagesCombat.tsx`).
- Constat : « Arrêt auto » est en réalité « arrêter l'attaque auto quand une rareté choisie apparaît » (`23-390-reglage-arret`). « Réglage » seul ressemble au Menu > Réglages. Un nouveau joueur lit « Arrêt auto » comme un bouton stop.
- Proposition : renommer en « Stop si rare » (ou « Pause si rare ») et « Réglage » en « Raretés » ; garder la touche R et T.
- Valeur 1 · Effort S · Dépendances : textes du tutoriel et du guide (`data/guide.json`) à aligner.

### Q-j1-07 — PC sur téléphone : les filtres remplissent un écran avant la liste
- Où : `PagePC.tsx`, vue téléphone.
- Constat : sur `20-390-pc`, le premier écran contient le titre, le compteur, l'équipe en 6 cartes, « Trie par », « Filtre », « Nom ou numéro » et « Relâcher ». La première carte de Pokémon du PC est sous le pli (`21-390-pc-scroll`). Le joueur qui vient chercher un Pokémon doit faire défiler à chaque ouverture.
- Proposition : équipe repliée sur une ligne de six miniatures ; tri, filtre et recherche dans un seul bandeau (recherche visible, tri et filtre derrière un bouton « Filtres ») ; « Relâcher » dans ce bouton.
- Valeur 1 · Effort M · Dépendances : ticket U (fusion Équipe/PC) déjà livré.

### Q-j1-08 — Pokédex sur téléphone : trois blocs avant la première espèce
- Où : `PokedexTelephone.tsx`.
- Constat : sur `22-390-pokedex`, l'écran est pris par les quatre onglets de dex, la carte « 124 / 151 + barre + palier », « Paliers du Pokédex », « Diplôme du Pokédex », la recherche et le filtre « Afficher ». La grille commence après un défilement (`22-390-pokedex-scroll`).
- Proposition : compteur et palier suivant sur une ligne (« 124/151 · prochain palier 130 »), Paliers et Diplôme dans un bouton « Récompenses », grille visible dès le premier écran.
- Valeur 1 · Effort S · Dépendances : ticket H (boutons de dex) déjà livré.

### Q-j1-09 — La fiche Pokémon affiche des libellés qu'on ne peut pas décoder
- Où : `FichePokemon.tsx`, bloc DPS (capture `21-390-fiche`).
- Constat : trois lignes « Base 2240 », « Type × 1 », « Bonheur × 1,1 », puis un anneau « Bonheur : 100/255, +10 % de dégâts » qui répète la ligne précédente. « Type × 1 » ne dit pas contre quoi. « XP : MAX » est une ligne isolée sans barre. Le ticket M traite les bonus qui ne s'appliquent pas, pas les libellés.
- Proposition : réécrire en phrases (« Dégâts de base 2 240 », « Type : ×1 contre ce boss »), n'afficher le bonheur qu'une fois, et dire d'où vient le ×1,1.
- Valeur 1 · Effort S · Dépendances : ticket M.

### Q-j1-10 — Faire évoluer un Pokémon prend trois à quatre touchers
- Où : PC, tuile « prêt à évoluer » (`pret-evoluer`, `PagePC.tsx:282`), `FichePokemon.tsx`, `FenetreEvolution.tsx`.
- Constat : parcours joué : ouvrir le PC, toucher la tuile, toucher « Évoluer » dans la fiche (attendre ~0,9 s l'ouverture), regarder l'animation (`27-1440-evo2-*`), « Fermer ». Avec dix Pokémon prêts, ça fait trente à quarante touchers.
- Proposition : bouton « Évoluer » directement sur la tuile et sur la carte d'équipe, et un bouton « Tout évoluer (N) » quand plusieurs sont prêts, avec l'option « passer l'animation » déjà présente.
- Valeur 1 · Effort M · Dépendances : aucune.

### Q-j1-11 — Le PC ne montre ni ne filtre les types
- Où : `PagePC.tsx:31-32` (tri : DPS, numéro, nom, niveau, favoris, shiny ; filtre : tous, favoris, shiny, œufs, évolution).
- Constat : les tuiles du PC (`20-1440-pc`) montrent nom, sexe, DPS, numéro et niveau, pas le type. Le vision.md fait de la stratégie de type un pilier, et Nicolas a écrit dans `notes-nicolas-phase-5.md` que les types doivent être colorés comme dans le jeu. Avec 41 à 150 Pokémon, trouver « un Eau pour ce boss Feu » demande de les ouvrir un par un.
- Proposition : deux pastilles de type colorées sur chaque tuile et un filtre « Type » (liste des 15 types).
- Valeur 1 · Effort M · Dépendances : aucune (la classe `pastille-type-*` existe déjà dans `Pokedex.tsx:92`).

### Q-j1-12 — Les notifications durent 1,2 s, dans un coin éloigné de l'action sur PC
- Où : `Notifications.tsx`, `pileNotifications.ts:14-15`, `data/reglages.json:87` (`annonceMs` 1200, `notificationsMax` 3).
- Constat : lu dans le code. Un message « Dracolosse est capturé ! » reste 1,2 s, et on n'en garde que trois : en attaque auto rapide, une capture shiny ou « Nouveau » peut disparaître avant d'être lue. Sur PC le calque est en bas à droite (`lg:bottom-4`), loin de la scène et des boutons au centre. Aucun historique.
- Proposition : 3 s pour les événements rares (nouveau, shiny, évolution, boss), 1,2 s pour le reste ; sur PC, au-dessus de la scène ; historique voir F-j1-04.
- Valeur 1 · Effort M · Dépendances : F-j1-04 pour l'historique.

### Q-j1-13 — Échange d'équipe à l'aveugle : aucun écart de DPS affiché
- Où : « Placer dans l'équipe » dans la fiche (`FichePokemon.tsx`), mode échange (`echange`, notification « Choisis le Pokémon à remplacer par X »).
- Constat : le joueur choisit quel membre sortir sans voir ce qu'il gagne ou perd. Il faut mémoriser le DPS du Pokémon qui entre (2 464 pour Leveinard sur `21-390-fiche`) et celui de chaque membre.
- Proposition : pendant l'échange, afficher sur chaque carte d'équipe la variation de DPS (« +1 234 » vert, « −800 » rouge) et le changement de type couvert.
- Valeur 1 · Effort M · Dépendances : aucune.

### Q-j1-14 — Les objets du Sac n'ont aucune description
- Où : tiroir Sac, `23-390-sac` ; `data/objets.json` (32 objets).
- Constat : « Attaque + », « Attaque Spé + », « Calcium », « Protéine », « Pièce Rune », « Jeton Shiny », « Chaussures Sport » apparaissent avec une quantité et « UTILISER » ou « ACTIF », sans effet. Un joueur qui n'a pas vu l'achat au Shop ne sait pas ce qu'il consomme.
- Proposition : une ligne d'effet sous chaque nom (« +5 % DPS, un Pokémon »), tirée d'un champ `description` dans `data/objets.json`.
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j1-15 — Le résultat d'une capture n'est montré que par un message de 1,2 s
- Où : `store-capture.ts:42-43` (« X est capturé ! », « X s'est échappé ! »), `EcranCombat.tsx`.
- Constat : lu dans le code, non vu à l'écran. Le retour d'une capture passe par le même message que tout le reste. Pas de secousse de balle, pas d'éclat visible dans la scène. À 7 captures ratées de suite, rien n'indique la progression de la pitié.
- Proposition : animer la balle sur l'ennemi (3 secousses, puis éclat ou ouverture) et afficher un résultat dans la scène, près du bouton Capturer.
- Valeur 1 · Effort M · Dépendances : ticket L de la phase 5 (retours visuels) à vérifier.

### Q-j1-16 — Relâcher par lot : aucun « tout sélectionner »
- Où : `PagePC.tsx` (`selectionLot`, lignes 81-90, 214, 284).
- Constat : une recherche de « Tout sélectionner » ne trouve rien dans `PagePC.tsx` ; la sélection se fait Pokémon par Pokémon. Pour relâcher 30 Pokémon d'un filtre, 30 touchers.
- Proposition : « Tout sélectionner (filtre en cours) », « Inverser », et un compteur « 12 sélectionnés, favoris et shiny exclus ».
- Valeur 1 · Effort S · Dépendances : ticket J (relâche par lot) déjà livré.

### Q-j1-17 — Le nom de la zone est coupé dans l'en-tête à 390 px
- Où : bandeau « Pokédollars / DPS / Zone ».
- Constat : « Route Victo… » sur `20-390-combat`. Le nom exact de la zone n'est visible nulle part sur cet écran.
- Proposition : nom de la zone sur deux lignes, ou taille réduite, ou nom complet au-dessus de la barre Précédent/Suivant (comme sur PC).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-18 — Le niveau est écrit sur le sprite dans la barre d'équipe
- Où : rangée des six Pokémon sous les boutons, 390 px.
- Constat : sur `20-390-combat`, « 100 » est posé sur le bas de chaque sprite, mal lisible (blanc sur fond clair du sprite). Les cases vides affichent « — ».
- Proposition : pastille de niveau avec fond sombre dans le coin bas-droit, assez grande pour le tactile.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-19 — « Mon compte » est un lien souligné au-dessus de chaque page
- Où : en-tête commun, à 390 et 1440 (combat, PC, Pokédex).
- Constat : sur toutes les captures, une ligne « Mon compte » (lien bleu souligné, style navigateur) prend de la hauteur au-dessus du contenu et ne ressemble à aucun bouton du jeu. À 390 px elle repousse la scène de combat de 30 px.
- Proposition : une icône de profil dans l'en-tête (ou dans le Menu seulement).
- Valeur 2 · Effort S · Dépendances : ticket E/G de la phase 5 (compte).

### Q-j1-20 — Les tiroirs Sac, Radar, Objectifs et Réglage ne se ferment qu'avec « Fermer »
- Où : tiroirs du combat (`23-390-*`).
- Constat : à 390, le tiroir couvre la moitié basse de l'écran ; la seule sortie est le bouton « Fermer » en haut à droite du tiroir, loin du pouce.
- Proposition : toucher la scène ou glisser le tiroir vers le bas le ferme ; « Fermer » en bas.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-21 — À 390 px, on ne voit pas le DPS de chaque Pokémon de l'équipe
- Où : barre d'équipe du combat.
- Constat : à 1440, chaque carte montre « 7 586,9 DPS ». À 390, la barre montre seulement le niveau. Pour savoir qui est faible, il faut ouvrir le PC.
- Proposition : toucher un membre ouvre une mini-fiche (DPS, type, objet) sans quitter le combat ; ou DPS en abrégé sous le sprite (« 7,6 k »).
- Valeur 2 · Effort M · Dépendances : aucune.

### Q-j1-22 — Le réglage « Auto-clic » apparaît avant d'être utilisable
- Où : tiroir « Réglage de l'arrêt auto » (`23-390-reglage-arret`).
- Constat : le bloc « Auto-clic : lié à l'attaque auto » est affiché avec un interrupteur allumé et la phrase « Sans effet tant que tu n'as pas acheté les Restes. » Le joueur règle une chose qu'il n'a pas encore.
- Proposition : masquer le bloc avant l'achat, ou le griser avec le prix et un lien vers le Shop.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-23 — Objectifs : les « Fait » restent en liste, et un seul objectif a « Y aller »
- Où : tiroir Objectifs (`23-390-objectifs`).
- Constat : sur 7 lignes, 5 sont « Fait » (Équipement, Pension, Poké-Radar, CT Fauchage, Auto-clic) et occupent la place des 2 à faire. Seul l'objectif Pokédex a un bouton « Y aller » ; « Boss : Sulfura, étape 10 » n'en a pas.
- Proposition : les « Fait » repliés sous « Terminés (5) » ; « Y aller » sur chaque objectif (étape 10 → zone, Pokédex → Radar ou dex).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-24 — Sur un boss, Capturer est grisé sans raison visible
- Où : boutons Pokéball et Capturer, `28-390-boss`.
- Constat : le texte « Ce Pokémon ne peut pas être capturé. » et « Inutile sur un boss ! » existe dans la page, mais n'est pas visible sur la capture : deux boutons grisés. « (Géant) » après le nom n'est pas expliqué non plus.
- Proposition : afficher « Boss : non capturable » sous le bouton, et une infobulle sur « Géant » (« boss de zone, plus de PV »).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-25 — « Suivant » est grisé sans dire pourquoi
- Où : barre Précédent/Suivant, `28-390-boss`.
- Constat : tant que le boss n'est pas battu, « Suivant » est gris. Aucun texte ne dit « Bats Sulfura pour avancer ».
- Proposition : au toucher d'un « Suivant » grisé, un message de ce qu'il faut (« Bats le boss », « Obtiens le badge Marais »).
- Valeur 2 · Effort S · Dépendances : conditions de passage déjà en données.

### Q-j1-26 — Le chrono du boss ne prévient pas quand il reste peu de temps
- Où : carte ennemi du boss (« Temps 28 secondes » + barre jaune, `28-390-boss`), `data/reglages.json` `minuteurBossMs` 30000.
- Constat : vu à 28 s seulement. Je n'ai pas observé le passage sous 10 s : à vérifier. La barre est jaune d'un bout à l'autre sur la capture.
- Proposition : barre rouge sous 10 s, battement du chiffre et ton `alerte` (voir F-j1-09).
- Valeur 2 · Effort S · Dépendances : à vérifier à l'écran.

### Q-j1-27 — Le tri et le filtre du PC repartent de zéro à chaque ouverture
- Où : `PagePC.tsx:74` (`useState<TriPc>('dps')`).
- Constat : le tri est un état local. Un joueur qui range par numéro ou filtre « Évolution à découvrir » retrouve DPS et « Tous » en revenant du combat.
- Proposition : mémoriser tri et filtre dans la partie (ou la session).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-28 — On ne retrouve pas le Pokémon qu'on vient de capturer dans le PC
- Où : `PagePC.tsx:31` (tris : DPS, numéro, nom, niveau, favoris, shiny).
- Constat : aucun tri « récents d'abord » ni marque « nouveau ». Après une capture, retrouver la recrue parmi 41 à 150 tuiles demande une recherche par nom.
- Proposition : tri « Récents d'abord » et pastille « Nouveau » sur les tuiles jamais ouvertes.
- Valeur 2 · Effort M · Dépendances : date de capture à stocker dans la sauvegarde (vérifier le format).

### Q-j1-29 — La fiche ne permet pas de passer au Pokémon suivant
- Où : `FichePokemon.tsx` (`21-390-fiche`, un seul bouton « Ferme la fiche »).
- Constat : pour comparer ou ranger plusieurs Pokémon, il faut fermer, retoucher une tuile, rouvrir.
- Proposition : flèches « précédent / suivant » dans la fiche, suivant l'ordre du tri en cours.
- Valeur 2 · Effort M · Dépendances : aucune.

### Q-j1-30 — La fenêtre d'évolution ne montre ni l'ancien sprite ni le gain
- Où : `FenetreEvolution.tsx` (`27-1440-evo2-3000`).
- Constat : « Félicitations ! Ton « Caninos » a évolué en « Arcanin » », sprite d'Arcanin dans un cadre bleu, « Fermer ». Pas de DPS avant/après, pas de nouveau type s'il change.
- Proposition : deux sprites avec une flèche, « DPS avant → après », et la mention « Nouvelle entrée Pokédex » quand c'est le cas.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-31 — Le Pokédex demande deux touchers sur téléphone
- Où : barre du bas (Combat, PC, Shop, Carte, Pension, Menu), `22-390-pokedex`.
- Constat : le Pokédex n'est pas dans la barre à 390 : il faut ouvrir Menu puis Pokédex. Sur la capture, le bouton « Menu » est surligné pendant qu'on est dans le Pokédex. À 1440 il a la touche 5.
- Proposition : toucher le compteur « 124/151 » ou un point d'entrée dans le Radar ouvre le Pokédex directement.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-32 — La pastille de type apparaît en texte brut dans la fiche Pokédex PC
- Où : `Pokedex.tsx:92` (`pastille-type pastille-type-*`), `25-1440-pokedex-fiche`.
- Constat : sous « Où le trouver », « Électrik » est écrit en texte simple, sans fond ni couleur, à côté de « Déjà capturé ». « Dégâts de base » et « 80 » sont sur deux lignes séparées. Nicolas veut les types colorés (notes phase 5).
- Proposition : vérifier pourquoi la classe de couleur ne s'applique pas à 1440, et regrouper « Dégâts de base : 80 » sur une ligne.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-33 — « Effets actifs : Aucun » alors que le Sac montre des objets « ACTIF »
- Où : colonne de droite du combat PC (`20-1440-combat`), tiroir Sac (`23-390-sac`).
- Constat : le Sac liste Chaussures Sport, Pièce Rune et Protéine en « ACTIF » ; le panneau « Effets actifs » à 1440 affiche « Aucun effet actif ». À 390 il n'existe aucun panneau équivalent.
- Proposition : un seul endroit, partout : les effets temporaires avec leur temps restant, les objets permanents dans le Sac avec un libellé « permanent ».
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-34 — Changer de balle n'a pas d'écran de choix
- Où : bouton « Pokéball ×99 », touche B (`raccourcis.ts`).
- Constat : le bouton passe d'une balle à la suivante. Avec Pokéball, Superball, Hyperball et Master Ball, il faut cycler. Pas de choix direct ni de « meilleure balle ».
- Proposition : appui long (ou B maintenu) ouvre un petit menu des balles avec leurs quantités.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-35 — À 1440 px, la moitié basse de la colonne centrale du combat est vide
- Où : `20-1440-combat`.
- Constat : la scène s'arrête à 633 px, les boutons à 760 px, et l'écran de 900 px laisse 140 px vides sous les boutons.
- Proposition : agrandir la scène en hauteur jusqu'au pli, ou y placer une ligne de bilan (captures, argent par minute).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-36 — Les quatre onglets du Pokédex s'écrasent sur trois lignes à 390 px
- Où : `PokedexTelephone.tsx`, `22-390-pokedex`.
- Constat : « Pokédex 124 / 151 », « Shiny 5 / 151 », « Œuf 0 / 151 », « Œuf shiny 0 / 151 » passent à trois ou quatre lignes dans des boutons de 80 px.
- Proposition : une icône et le compteur seul (« 124 »), libellé complet en petit dessous, ou onglets défilants.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j1-37 — Le badge « 822 » sur le Sac ne veut rien dire
- Où : bouton Sac, combat (`20-390-combat`) et PC (`20-390-pc`).
- Constat : un chiffre est collé sur l'icône du Sac. C'est le total d'objets (822 sur une partie de test). Le joueur le lit comme « 822 nouveautés ».
- Proposition : le retirer, ou le limiter aux objets utilisables maintenant.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j1-38 — L'onglet « Tout » du Sac mélange consommables et équipements actifs
- Où : tiroir Sac (`23-390-sac`).
- Constat : « Jeton Shiny ×3 UTILISER » est à côté de « Chaussures Sport ×1 ACTIF ». Les équipements permanents se perdent dans la liste.
- Proposition : une section « Actifs » en tête de liste.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j1-39 — Les points verts de la barre de navigation n'ont pas de légende
- Où : Carte et Menu (`20-1440-combat`, `20-390-combat`).
- Constat : une pastille verte à côté de Carte et de Menu, sans texte. Elle ne dit pas ce qu'il y a de nouveau, et on ne sait pas quand elle disparaît.
- Proposition : une infobulle (« Nouvelle zone »), et la pastille s'éteint à la première visite.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j1-40 — « 41 Pokémon » ressemble à un bouton
- Où : tête du PC (`20-390-pc`, `20-1440-pc`).
- Constat : le compteur a un fond et une bordure de bouton à 1440, une couleur de lien à 390, mais ne fait rien au toucher.
- Proposition : le styler comme du texte, ou en faire un raccourci vers le filtre « Tous ».
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j1-41 — Le glisser-déposer du PC n'est pas annoncé
- Où : `PagePC.tsx:217` (`glissable = !telephone && …`), curseur `cursor-grab` au survol.
- Constat : lu dans le code. Sur PC on peut glisser une tuile vers l'équipe, mais rien ne le dit. Sur téléphone la fonction n'existe pas.
- Proposition : une phrase d'aide à la première ouverture du PC (« Glisse un Pokémon dans l'équipe »), puis disparue.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j1-42 — Le PC à 1440 px a deux défilements imbriqués et seulement 12 tuiles visibles
- Où : `20-1440-pc`.
- Constat : la grille est un panneau qui défile à l'intérieur d'une page qui défile (les tuiles « Rondoudou, Nosferapti, Tentacool » sont coupées en bas). Trois colonnes pour 41 Pokémon.
- Proposition : quatre colonnes à 1440 et un seul défilement (la page), ou panneau à hauteur fixe sans défilement de page.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j1-43 — Le DPS s'affiche avec ou sans décimale selon les écrans
- Où : en-tête et cartes (`102 943,9` sur `20-390-combat`, `147 162` sur `22-390-pokedex`, `7 586,9 DPS` sur `20-1440-combat`).
- Constat : même grandeur, deux formats. Le grand nombre prend de la place dans l'en-tête à 390 px.
- Proposition : une règle unique (entier au-dessus de 1 000, abrégé en « k » ou « M » au-dessus de 100 000 dans l'en-tête).
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j1-44 — Le bouton de Fauchage n'a qu'une icône
- Où : cœur brisé à droite de Capturer (`20-390-combat`), touche F.
- Constat : aucun libellé ; un joueur qui n'a pas lu le tutoriel ne devine pas qu'il s'agit de réduire l'ennemi à 1 PV pour capturer. À 1440 la touche F est affichée dans un coin.
- Proposition : légende de deux mots sous l'icône (« Fauchage ») ou infobulle au premier affichage.
- Valeur 3 · Effort S · Dépendances : ticket X déjà livré (l'icône a été refaite).

### Q-j1-45 — Du compteur de palier du Pokédex aux espèces manquantes, il faut chercher
- Où : carte « Prochain palier : 130 (Mythique). Encore 6 espèces. », `22-390-pokedex`.
- Constat : la phrase dit combien il manque, pas lesquelles. Le filtre « Afficher » existe mais n'est pas lié.
- Proposition : un bouton « Voir les 6 manquantes » qui règle le filtre et défile jusqu'à la grille.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j1-46 — « Géant » et « Légendaire » ne sont pas expliqués au joueur
- Où : carte ennemi (« Sulfura (Géant) »), tiroir Radar (rareté « Légendaire », silhouette « ??? »).
- Constat : « Géant » désigne les boss, « Très rare » et « Légendaire » des paliers d'apparition. Le guide (`data/guide.json`) est ancien : à vérifier si ces termes y sont expliqués.
- Proposition : un mot d'explication au premier affichage de chaque terme, ou une page « Raretés » dans le guide avec les taux.
- Valeur 3 · Effort S · Dépendances : table des raretés du guide.

---

# 2. Fonctionnalités

### F-j1-01 — Dix à trente succès de plus, avec leurs mesures
- Où : `data/succes.json` (7 succès : premiers pas, premier badge, collectionneur 25, éclosions 10/50/100/151) ; mesures `pokedex`, `badges`, `eclosions` seulement.
- Idée : le jeu n'a que trois mesures de succès. Ajouter des mesures (clics totaux, boss battus, captures, shiny capturés, évolutions, niveau 100 atteint, argent total, zones finies) et ~25 succès qui paient quelques diamants, pour qu'un objectif de 3 à 5 minutes (pilier 3) existe toute la partie.
- Valeur 1 · Effort M · Dépendances : mesures dans `src/core`, diamants du compte (phase 4 livrée).

### F-j1-02 — Alerte d'arrêt auto : vibration, son et titre d'onglet
- Où : arrêt auto (`ReglagesCombat.tsx`), `sons.ts` (5 tons : `hit`, `coin`, `catch`, `up`, `pc`).
- Idée : quand l'attaque auto s'arrête sur une rareté choisie, le joueur n'est pas forcément à l'écran. Ajouter un ton dédié, `navigator.vibrate` sur téléphone et un titre d'onglet clignotant (« ★ Shiny ! ») sur PC.
- Valeur 1 · Effort S · Dépendances : ticket N (audio) pour le son.

### F-j1-03 — « Pendant ton absence » : bilan de session
- Où : retour sur l'onglet après une pause, `store.ts`, page statistiques existante (`StatistiquesPage.tsx`).
- Idée : au retour (ou toutes les 5 minutes d'attaque auto), un encart d'une ligne résume les captures, les nouveautés Pokédex, l'argent gagné, les œufs éclos. Sur téléphone, on laisse tourner et on revient.
- Valeur 1 · Effort M · Dépendances : compteurs de session.

### F-j1-04 — Journal des événements récents
- Où : nouveau tiroir, lié à `Notifications.tsx` / `pileNotifications.ts`.
- Idée : liste des 30 derniers événements (capture, échec, shiny, évolution, boss, objet gagné), avec l'heure. Résout aussi la disparition des notifications de 1,2 s (Q-j1-12).
- Valeur 1 · Effort M · Dépendances : Q-j1-12.

### F-j1-05 — Avantage de type visible sur l'ennemi
- Où : carte ennemi et cartes d'équipe ; `FichePokemon.tsx` affiche déjà « Type × 1 ».
- Idée : un mot sur l'ennemi (« tes Pokémon font ×1,6 en moyenne ») et un marqueur ×2 / ×0,5 sur chaque membre. Rend la stratégie de type, pilier du vision.md, visible sans calcul.
- Valeur 1 · Effort M · Dépendances : table des types (ticket S) et règle de multiplicateur existante.

### F-j1-06 — Aperçu du boss avant le combat
- Où : zone de boss (étape 10), `EcranCombat.tsx`.
- Idée : au toucher du pion « boss », une fiche : type, niveau, PV, chrono, et une estimation « ton DPS actuel le bat en 41 s » contre le chrono de 30 s. Évite de lancer un boss perdu d'avance, ce qui répond à « les boss sont volontairement durs, il faut économiser ».
- Valeur 1 · Effort M · Dépendances : F-j1-05.

### F-j1-07 — Équipes enregistrées
- Où : PC / équipe (`PagePC.tsx`), sauvegarde de région.
- Idée : trois emplacements « équipe A, B, C » pour changer de composition en un toucher (équipe anti-Eau, équipe de farm). Aujourd'hui chaque changement de boss demande jusqu'à six échanges.
- Valeur 1 · Effort M · Dépendances : aucune.

### F-j1-08 — Liste de chasse
- Où : Pokédex, Radar, Objectifs.
- Idée : épingler jusqu'à 3 espèces à chasser ; elles apparaissent dans le tiroir Objectifs avec leurs zones (déjà dans la fiche Pokédex, ticket I) et une pastille dans la carte ennemi quand l'espèce est la bonne.
- Valeur 1 · Effort M · Dépendances : ticket I (zones d'espèce).

### F-j1-09 — Sons par événement : boss, shiny, évolution, éclosion, légendaire
- Où : `sons.ts`, `src/core/reglages.ts:8` (type `Ton` : `hit`, `coin`, `catch`, `up`, `pc`), `data/musiques.json`.
- Idée : cinq tons seulement ; rien ne marque l'arrivée d'un boss, un shiny, une évolution, une éclosion. Ajouter les tons `boss`, `shiny`, `evolution`, `eclosion`, `alerte`. Le ticket N (audio réel) est `a_faire`.
- Valeur 1 · Effort M · Dépendances : ticket N.

### F-j1-10 — Compteur de rencontres et chasse au shiny
- Où : fiche Pokédex (`Pokedex.tsx`), `data/reglages.json` (`chanceShiny` 1/512).
- Idée : par espèce, « rencontrés 37, capturés 4, depuis le dernier shiny : 211 ». Donne un sens à la chasse au shiny et un sentiment de progression même quand ça ne tombe pas.
- Valeur 1 · Effort M · Dépendances : compteur par espèce dans la sauvegarde.

### F-j1-11 — Coup critique de clic (règle à valider)
- Où : clic d'attaque (`clicBase` 5, plafond 12 clics/s).
- Idée : une chance sur 10 que le clic fasse ×3, avec un nombre doré. Fait « sentir » le clic, pilier 1. Change la règle de dégâts.
- Valeur 1 · Effort M · Dépendances : simulateur d'équilibrage, validation de Nicolas.

### F-j1-12 — Défis du jour (règle à valider)
- Où : tiroir Objectifs.
- Idée : trois défis courts par jour (« capture 5 Pokémon Eau », « bats 2 boss ») qui rapportent balles ou diamants. Garde le rythme de 3 à 5 minutes. Ajoute une source de diamants.
- Valeur 2 · Effort M · Dépendances : F-j1-01, décision sur l'économie des diamants.

### F-j1-13 — Complétion de zone
- Où : barre de zone, fiche Pokédex (zones), Radar.
- Idée : « Route Victoire 4/5 espèces » dans le Radar, et un petit bonus (balles) à la dernière espèce de la zone. Cohérent avec « chaque zone dit ce qu'il reste à faire ».
- Valeur 2 · Effort M · Dépendances : ticket I. Règle à valider si récompense.

### F-j1-14 — Combo de cadence (règle à valider)
- Où : clic d'attaque.
- Idée : un compteur qui monte quand on clique à rythme soutenu (jusqu'au plafond de 12 clics/s) et donne +10 % de dégâts au maximum, retombant en 2 s. Donne un intérêt à cliquer vraiment sans pousser à l'auto-clic.
- Valeur 2 · Effort M · Dépendances : plafond de clics existant ; validation.

### F-j1-15 — Leurre et Encens (règle à valider)
- Où : Sac, Shop (autre session pour l'achat).
- Idée : un consommable de 10 minutes qui augmente l'apparition d'un type choisi. C'est un puits d'argent voulu par le vision.md et un choix stratégique (quel type ?).
- Valeur 2 · Effort M · Dépendances : Shop (autre audit), tables d'apparition.

### F-j1-16 — Sablier de boss (règle à valider)
- Où : chrono du boss (`minuteurBossMs` 30000).
- Idée : objet à usage unique, +10 s au chrono du boss en cours. Puits d'argent et deuxième chance contre un boss raté de peu.
- Valeur 2 · Effort S · Dépendances : validation.

### F-j1-17 — « Suggérer une équipe » contre le boss
- Où : PC / équipe, F-j1-06.
- Idée : un bouton qui propose les six Pokémon du PC au plus fort DPS contre le boss de la zone, à accepter ou refuser. Aide sans jouer à la place.
- Valeur 2 · Effort M · Dépendances : F-j1-05.

### F-j1-18 — Chaînes de capture (règle à valider)
- Où : capture, Radar.
- Idée : capturer la même espèce à la suite augmente un peu la chance de shiny (comme la chaîne du Poké-Radar des jeux). Donne un usage au Radar au-delà de la liste.
- Valeur 2 · Effort M · Dépendances : validation (touche à l'équilibrage R et T).

### F-j1-19 — Pokémon du jour (règle à valider)
- Où : Radar, Objectifs.
- Idée : une espèce choisie par jour dans la zone courante donne le double de bonbons et de récompense. Pousse à varier les zones et les types.
- Valeur 2 · Effort S · Dépendances : validation.

### F-j1-20 — Collection de lignées complètes
- Où : Pokédex (nouvel onglet ou palier).
- Idée : compter les lignées dont on possède les trois stades (Salamèche, Reptincel, Dracaufeu) ; paliers à 10, 25, 50 lignées. Évolution est un geste central et rien ne le célèbre.
- Valeur 2 · Effort M · Dépendances : table d'évolution (données existantes).

### F-j1-21 — Records personnels
- Où : `StatistiquesPage.tsx`.
- Idée : plus haut DPS atteint, meilleur temps de boss, plus long combo, plus de captures en une heure, cadence maximale. Statistiques déjà là ; ajouter les records.
- Valeur 2 · Effort S · Dépendances : compteurs.

### F-j1-22 — Jauge de cadence
- Où : scène de combat (`ActionsCombat.tsx`).
- Idée : afficher discrètement « 9 / 12 clics par seconde » à côté du bouton Attaquer. Le plafond de 12 est le pilier 1 : le joueur n'a aucun moyen de le voir aujourd'hui.
- Valeur 2 · Effort S · Dépendances : mesure de cadence existante dans le cœur.

### F-j1-23 — Carte de dresseur à partager
- Où : Menu / compte.
- Idée : une image générée (équipe, Pokédex, shiny, temps de jeu) à envoyer aux amis, jeu perso et amis. Remplace la capture d'écran.
- Valeur 2 · Effort M · Dépendances : aucune.

### F-j1-24 — Objets tenus selon le type (règle à valider)
- Où : fiche (« Objet tenu : aucun », `21-390-fiche`), `data/objets.json`.
- Idée : une famille d'objets (Charbon, Eau Mystique, Aimant…) qui donne +10 % à un type. La fiche affiche déjà un emplacement d'objet tenu ; rien de comparable aujourd'hui.
- Valeur 2 · Effort M · Dépendances : validation, F-j1-05.

### F-j1-25 — Compagnon à côté du compteur (règle à valider)
- Où : en-tête, fiche.
- Idée : un Pokémon choisi suit le joueur (petit sprite dans l'en-tête) et gagne du bonheur plus vite. Donne un but au bonheur (255 max, +10 % de dégâts) que la fiche affiche sans l'expliquer.
- Valeur 2 · Effort M · Dépendances : `data/reglages.json` (`bonheur`), validation.

### F-j1-26 — Balles à condition (règle à valider)
- Où : Sac / Shop, capture.
- Idée : Rapide Ball (forte au début du combat), Sombre Ball (nuit), Filet Ball (types Eau et Insecte). Choisir sa balle devient une décision ; le ticket T a déjà réglé les balles ×1,5 et ×3.
- Valeur 2 · Effort M · Dépendances : validation, F-j1-27 pour la nuit.

### F-j1-27 — Mode économie de batterie
- Où : réglages ; l'écran se rafraîchit à 10 Hz (`vision.md`).
- Idée : sur téléphone, un mode « veille » : écran sombre, sprites figés, 2 Hz, l'attaque auto continue. Les joueurs de clicker laissent tourner des heures.
- Valeur 2 · Effort M · Dépendances : aucune.

### F-j1-28 — Pokémon de tête qui porte le clic (règle à valider)
- Où : équipe, clic d'attaque.
- Idée : le premier Pokémon de l'équipe est celui qui frappe au clic ; son type s'applique aux dégâts de clic. Place l'ordre de l'équipe et le choix du type au centre du jeu.
- Valeur 2 · Effort M · Dépendances : validation, F-j1-05.

### F-j1-29 — Défis par type (règle à valider)
- Où : modèle de `data/defi-chen.json` (défi de 6 combats avec contre-starter).
- Idée : réutiliser ce format pour des défis « bats les six boss avec une équipe 100 % Eau », avec une récompense unique.
- Valeur 2 · Effort M · Dépendances : validation, format du défi Chen.

### F-j1-30 — Attaque spéciale tous les N clics
- Où : scène de combat.
- Idée : tous les 25 clics, le Pokémon de tête lance une attaque animée à son type (flammes, éclair). Purement visuel dans un premier temps ; devient une règle si elle ajoute des dégâts (alors à valider).
- Valeur 2 · Effort M · Dépendances : F-j1-28.

### F-j1-31 — Boss avec une mécanique propre (règle à valider)
- Où : boss d'arène et Ligue.
- Idée : bouclier de 5 s, soin à 50 %, ou point faible affiché. Casse la répétition « même combat, plus de PV ».
- Valeur 2 · Effort L · Dépendances : validation, F-j1-06, simulateur.

### F-j1-32 — Cycle jour et nuit (règle à valider)
- Où : décors, tables d'apparition.
- Idée : heure réelle, décor teinté, quelques Pokémon exclusifs de nuit (Nosferapti, Ectoplasma).
- Valeur 3 · Effort L · Dépendances : décors régénérés (ticket O), validation.

### F-j1-33 — Compendium des objets
- Où : Sac.
- Idée : une page qui liste tous les objets rencontrés avec description, provenance et effet, y compris ceux dont la quantité est à zéro. Résout aussi Q-j1-14.
- Valeur 3 · Effort M · Dépendances : Q-j1-14.

### F-j1-34 — Collection des deux sexes
- Où : Pokédex (icône ♀ ♂ déjà dans la fiche).
- Idée : un palier pour avoir capturé les deux sexes de chaque espèce (Nidoran, Leveinard, …). Étend la chasse sans changer de règle.
- Valeur 3 · Effort M · Dépendances : sexe stocké dans la sauvegarde.

### F-j1-35 — Collection « un Pokémon niveau 100 par type »
- Où : Pokédex ou succès.
- Idée : 15 types, un niveau 100 de chaque. Récompense la polyvalence, pas la répétition.
- Valeur 3 · Effort S · Dépendances : F-j1-01.

### F-j1-36 — Descriptions du Pokédex
- Où : fiche Pokédex (`Pokedex.tsx`, `PokedexTelephone.tsx`).
- Idée : une phrase de description, taille et poids, tirés de PokeAPI, données en JSON. Rend le Pokédex agréable à lire et pas seulement à remplir.
- Valeur 3 · Effort M · Dépendances : données à générer par script.

### F-j1-37 — Succès cachés pour les easter eggs
- Où : `data/easter-eggs.json`, succès.
- Idée : un succès secret au premier renommage qui déclenche un effet (« Curieux »). Aucun indice avant d'y avoir joué. Les succès ne se gagnent qu'une fois par compte (vision.md).
- Valeur 3 · Effort S · Dépendances : F-j1-01.

### F-j1-38 — Nouveaux effets de renommage (clin d'œil Minecraft)
- Où : `data/easter-eggs.json` (aujourd'hui Dinnerbone/Grumm, Jeb_, Caca, Daran, Bjorn, Gabriel).
- Idée : `herobrine` (yeux blancs sur le sprite), `creeper` (teinte verte et pixelisation). Seulement des effets CSS à ajouter au registre, sans code de jeu.
- Valeur 3 · Effort S · Dépendances : aucune.

### F-j1-39 — Easter egg Missingno
- Où : renommage d'un Pokémon.
- Idée : le nom « Missingno » affiche un sprite déformé (bandes de pixels décalées). Le jeu est un clicker Pokémon de Kanto, la référence est évidente pour ses joueurs.
- Valeur 3 · Effort S · Dépendances : registre des easter eggs.

### F-j1-40 — Code Konami sur PC
- Où : raccourcis clavier (`src/ui/raccourcis.ts`).
- Idée : ↑↑↓↓←→←→ B A déclenche une pluie de Pokéballs ou un cri de Mew, une fois par partie. Touche l'écran de combat seulement.
- Valeur 3 · Effort S · Dépendances : aucune.

### F-j1-41 — Clic secret sur un décor
- Où : décor d'une zone (par exemple le port de Carmin sur Mer).
- Idée : toucher sept fois un élément du décor (un camion) donne un cadeau unique. Clin d'œil à la légende de Kanto ; les positions cliquables existent déjà pour la carte (zones en pourcentages).
- Valeur 3 · Effort M · Dépendances : décors des zones.

### F-j1-42 — Mannequin d'entraînement
- Où : écran de combat, hors progression.
- Idée : un « sac de sable » de 30 s qui mesure le DPS réel de l'équipe et du clic. Aide à comparer deux compositions sans risquer un boss.
- Valeur 3 · Effort M · Dépendances : F-j1-07.

### F-j1-43 — Galerie de cinématiques
- Où : Menu.
- Idée : revoir les animations d'évolution, d'éclosion et du choix du starter déjà débloquées. Utile après le ticket K (« passer les éclosions »).
- Valeur 3 · Effort M · Dépendances : animations déjà là.

### F-j1-44 — Raccourcis personnalisables
- Où : `raccourcis.ts` (12 touches de combat, 12 « partout » : Espace, C, B, A, T, R, S, F, P, flèches, 1 à 7, Échap, Tab, `/`, `?`).
- Idée : un écran qui permet de changer une touche (un joueur de clavier azerty ou gaucher). La liste existe déjà en données dans le fichier.
- Valeur 3 · Effort M · Dépendances : aucune.

### F-j1-45 — Œufs trouvés en route (règle à valider)
- Où : combat, pension.
- Idée : une chance très faible (1 sur 300 victoires) de trouver un œuf dans la zone. Donne un usage à la pension pour qui n'y met pas de parents. Ticket S a déjà rendu la ponte plus rare.
- Valeur 3 · Effort S · Dépendances : validation, ticket S.

### F-j1-46 — Événements du calendrier (règle à valider)
- Où : tables d'apparition, décors.
- Idée : à Halloween, Fantômes plus fréquents ; à Noël, décor neigeux. Aucune monétisation, jeu entre amis.
- Valeur 3 · Effort M · Dépendances : validation.

### F-j1-47 — Échange avec un ami (règle à valider)
- Où : compte en ligne (phase 4), évolutions par échange de Gen 1 (Kadabra, Machoc, Grotadmorv…).
- Idée : un code à partager pour échanger un Pokémon avec un ami et faire évoluer ceux qui évoluent par échange. À vérifier : comment le jeu obtient ces évolutions aujourd'hui.
- Valeur 3 · Effort L · Dépendances : backend en ligne, validation.

### F-j1-48 — Classement entre amis
- Où : compte en ligne.
- Idée : tableau des amis : Pokédex, shiny, DPS, temps de la Ligue. Le jeu est « perso et amis » ; la comparaison motive.
- Valeur 3 · Effort L · Dépendances : backend en ligne (phase 4).

### F-j1-49 — Le Prof. Chen commente les paliers
- Où : paliers du Pokédex (`data/jalons.json`, de 10 à 151), diplôme.
- Idée : à chaque palier, une phrase du professeur dans la bulle de dialogue (déjà utilisée dans le tutoriel). Donne une voix au jeu et donne envie de continuer.
- Valeur 3 · Effort S · Dépendances : textes à écrire par Nicolas.

### F-j1-50 — Connexion quotidienne (règle à valider)
- Où : compte, Menu.
- Idée : un petit bonus par jour de connexion (sept jours, puis reboucle). Va contre l'idée « pas de centaines d'heures » si le bonus pèse, et le jeu n'est pas monétisé : à décider.
- Valeur 3 · Effort S · Dépendances : validation.

---

Vérifications qui restent à faire à l'écran, non couvertes ici : capture réussie et ratée (animation), éclosion, relâche par lot, Fauchage en action, chrono du boss sous 10 s, notifications empilées, intro à 1440 px.
