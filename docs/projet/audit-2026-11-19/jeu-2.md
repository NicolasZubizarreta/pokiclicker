# Audit du jeu, partie 2 (19/11/2026)

Périmètre : Shop, Centre commercial, Casino, Pension et œufs, Carte et zones, lieux de Bourg Palette, Ligue et Panthéon, badges, Menu et Plus, Réglages, Statistiques, Compte, Objectifs, accessibilité, performance.
Méthode : partie de test injectée (jamais la sauvegarde de Nicolas), Chromium headless à 390×844 et 1440×900, captures regardées, axe-core sur 10 écrans, lecture des fichiers `data/` et `src/ui/`. Rien n'est codé.
Hors périmètre ou déjà fait : intro, combat, équipe, PC, Pokédex, fiche, tutoriels (autre session) ; tout ce qui est livré ou refusé dans `backlog-phase-5b.md` ; les bugs déjà dans `ui-a.md` (B-uia-12, 18, 24, 26, 30, S-uia-12).

Lecture : valeur 1 = forte, 3 = faible. Effort S (moins d'une demi-journée), M (1 à 2 jours), L (plus). « Règle à valider » = la proposition change une règle de jeu, donc rien sans ticket validé par Nicolas.

Limites de l'audit (non vus ou non terminés) : scène Route de Ronflex et écran du Panthéon (vus seulement comme écran de combat), crédits (lus dans le code : bouton « Passer »), compte hors connexion et synchronisation en erreur, notifications en situation, axe sur Statistiques, Badges, Casino et Guide à 1440 px (aucune violation sur les 3 premiers à 390). Mesure de performance à 390 px : 460 nœuds DOM au Combat, 336 au Shop, 373 à la Carte, 857 à la Pension (166 images), 205 au Menu ; tâches longues de 55 à 60 ms au changement d'onglet, 153 ms à l'ouverture de la Pension ; tas JS 31 Mo ; 250 ressources pour 0,1 Mo transférés (serveur local).

Artefacts de ma partie de test, non rapportés comme bugs : Route 1 « fermée », annonce de paliers Pokédex en haut du Shop au chargement, collection de la Pension « Obtenu » avec 0/151.

---

# 1. QoL (47 candidats)

## Valeur 1

### Q-j2-01 — Libellés accessibles qui contredisent le texte visible
- Où : Combat (`.zone-nav-precedente`, aria-label « Zone précédente : X », texte « Précédent »), Shop (boutons de quantité de chaque carte, `aria-label="Quantité de Pokéball"`), Carte (« Route 1 (Zone 1) »), Menu (6 boutons).
- Constat : axe signale `label-content-name-mismatch` (grave) à 390 et à 1440 sur ces 4 écrans (3 à 25 éléments par écran). Un lecteur d'écran ou la commande vocale « clique sur Précédent » ne trouve pas le bouton. Pension, Réglages, Statistiques, Badges, Casino, Guide : aucune violation à 390.
- Proposition : faire commencer chaque aria-label par le texte visible (« Précédent, zone Route 2 »), ou retirer l'aria-label quand le texte suffit.
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j2-02 — Formater tous les nombres de la même façon
- Où : en-tête du Combat (PV, DPS), page Statistiques, Shop.
- Constat : l'argent est formaté (« 331 500 ₽ ») mais les PV ennemis s'affichent « PV 349747 / 349747 » et « 2342896 », les statistiques « 3106.5 » et « 15920.0 », le multiplicateur « x1.5 » à l'anglaise alors que le reste du jeu écrit « ×1,5 ». Le DPS de l'en-tête affiche des décimales (« 102 943,9 »).
- Proposition : un seul formateur (séparateur de milliers fin, virgule décimale, notation abrégée « 2,3 M » au-delà de 1 million) utilisé partout, y compris PV et statistiques.
- Valeur 1 · Effort S · Dépendances : B-uia-26 (argent tronqué à 390) touche le même formateur.

### Q-j2-03 — Clé brute « objet:omniExp (x2) » dans les statistiques
- Où : Statistiques, liste des bonus actifs.
- Constat : une ligne affiche l'identifiant interne « objet:omniExp (x2) » au lieu d'un nom lisible.
- Proposition : table identifiant → libellé français (« Multi Exp, ×2 »), avec une erreur de test si un identifiant n'a pas de libellé.
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j2-04 — Carte à 390 px : la liste prend la moitié de l'écran, la carte est minuscule
- Où : onglet Carte (`CarteKanto.tsx`), téléphone.
- Constat : la carte illustrée est réduite à un timbre au-dessus d'une liste de 21 zones. Le joueur lit une liste là où il pourrait toucher une carte.
- Proposition : carte pleine largeur (zoom et déplacement au doigt), liste repliée sous un bouton « Liste des zones », zone actuelle centrée.
- Valeur 1 · Effort M · Dépendances : Q-j2-05, Q-j2-06, F-j2-11.

### Q-j2-05 — Les 21 zones sont toutes listées « fermée » dès le début
- Où : Carte, début de partie.
- Constat : le joueur voit tout le parcours (spoil) et aucune des zones fermées n'indique comment l'ouvrir.
- Proposition : n'afficher que les zones ouvertes plus la suivante, avec sa condition (« Bats Pierre à Argenta »), le reste en silhouettes « ? ».
- Valeur 1 · Effort S · Dépendances : Q-j2-04.

### Q-j2-06 — Le vol de 2,5 s entre zones ne se passe pas
- Où : Carte, `useVol`, `vol.ms = 2500` dans `data/reglages.json`.
- Constat : chaque changement de zone depuis la carte déclenche une animation de 2,5 s qu'on ne peut pas passer ; seul le réglage « mouvement réduit » de l'OS la remplace. Pendant ce temps le joueur ne peut ni cliquer ni combattre.
- Proposition : toucher l'écran pendant le vol l'interrompt ; option Réglages « Vol rapide / sans animation » (voir Q-j2-38).
- Valeur 1 · Effort S · Dépendances : Q-j2-13 ; B-uia-12 (« Vol en cours vers undefined ») dans la même zone de code.

### Q-j2-07 — Un bouton « Retour » qui ne revient pas d'où l'on vient
- Où : Pension (« Retour au menu » même quand on arrive par la barre), Casino (« Retour à la Carte » même quand on arrive par le Menu).
- Constat : le joueur atterrit sur un écran qu'il n'a pas ouvert.
- Proposition : retour vers l'écran précédent (mémoriser l'origine à l'ouverture), libellé « Retour » tout court.
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j2-08 — Pension : la note « Espèce inconnue… » recouvre « Retirer Pikachu »
- Où : `PagePension.tsx`, 1440×900, premier parent déposé.
- Constat : la note passe par-dessus le bouton du premier parent, qu'on ne peut plus cliquer sans déplacer la fenêtre.
- Proposition : note en flux normal sous la carte du parent plutôt qu'en position absolue.
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j2-09 — Shop : bouton d'achat sans indication quand on ne peut pas payer
- Où : `PageShop.tsx`, carte de consommable.
- Constat : chaque carte aligne −, +, +10, Max et « Acheter ×1 » ; rien ne dit si l'achat est possible ni combien manque. Le joueur essaie, puis lit une annonce.
- Proposition : bouton grisé avec « Il te manque 1 240 ₽ » ; total en ₽ au bouton (« Acheter ×5 : 2 210 ₽ »).
- Valeur 1 · Effort S · Dépendances : aucune.

### Q-j2-10 — Casino : aucun bilan de session
- Où : `PageCasino.tsx` et les 6 jeux.
- Constat : après 20 parties on ignore si on est en gain ou en perte. Le seul repère est le solde de jetons.
- Proposition : bandeau « Session : +340 jetons (12 parties, 7 gagnées) » avec remise à zéro à la sortie ; bilan par jeu en statistiques.
- Valeur 1 · Effort M · Dépendances : F-j2-05 (statistiques) réutilise les compteurs.

### Q-j2-11 — Casino : pas de « Rejouer la même mise »
- Où : roulette, plus ou moins, gratter, blackjack.
- Constat : chaque partie redemande de choisir la mise ; en rafale, c'est la plus grosse perte de temps de l'écran.
- Proposition : bouton « Rejouer (mise 10) » après chaque résultat, et touche Entrée sur PC.
- Valeur 1 · Effort S · Dépendances : Q-j2-26 (plafond) si on ajoute des garde-fous.

### Q-j2-12 — Réglages : pas de bascule son depuis l'écran de jeu
- Où : en-tête du Combat, Réglages > Son.
- Constat : couper la musique oblige à ouvrir Menu > Réglages > curseurs, puis revenir.
- Proposition : icône haut-parleur dans l'en-tête (appui = muet / son, appui long = curseurs) ; touche M sur PC.
- Valeur 1 · Effort S · Dépendances : B-uia-30 (musique sans reprise au retour en ligne).

### Q-j2-13 — Réduire les animations seulement via l'OS
- Où : Réglages ; animations de vol, d'éclosion, du casino.
- Constat : le mouvement réduit n'est pris en compte que si l'OS le demande ; aucun réglage dans le jeu.
- Proposition : bascule « Animations réduites » (vol, éclosion, roulette) dans Réglages, qui s'ajoute à la préférence de l'OS.
- Valeur 1 · Effort S · Dépendances : Q-j2-06.

## Valeur 2

### Q-j2-14 — Shop : le prix après inflation n'est pas expliqué
- Où : Shop (Pokéball 200 ₽ devient 442 ₽ à 8 badges, Master Ball 331 500 ₽), `inflation 0,20 par badge`.
- Constat : le prix change à chaque badge sans que le jeu le dise ; le joueur peut croire à un bug.
- Proposition : petite ligne « prix de base 200 ₽ · +20 % par badge » au toucher du prix (bulle).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j2-15 — Shop : quatre boutons de quantité par carte
- Où : cartes de consommables.
- Constat : −, +, +10, Max, puis « Acheter ×1 » : 5 cibles par carte, 14 cartes ; à 390 px c'est une rangée dense et petite.
- Proposition : un stepper (− quantité +) et un seul bouton « Acheter » ; Max en appui long.
- Valeur 2 · Effort M · Dépendances : Q-j2-01 (libellés).

### Q-j2-16 — Shop : les équipements possédés restent en tête de liste
- Où : onglet Équipement.
- Constat : une fois achetés (Chaussures Sport, CT), ils gardent leur carte en haut et poussent ce qui reste à acheter.
- Proposition : section « Possédés » repliée en bas, ou carte réduite à une ligne avec ✔.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j2-17 — Shop : trois objets sans image
- Où : Chaussures Sport, CT Fauchage, CT Jackpot (`image: null` dans `data/objets.json`, listés dans `tests/objets-images.test.ts`).
- Constat : une icône générique « boîte » représente les trois.
- Proposition : trois icônes dans le style des autres (chaussure, disque CT, trèfle).
- Valeur 2 · Effort S · Dépendances : un fichier image par objet (à fournir).

### Q-j2-18 — Shop : Multi Exp et Œuf Chance donnent le même +50 % d'XP sans le dire
- Où : cartes de ces deux objets.
- Constat : deux objets au même effet visible ; le joueur ne sait pas s'ils se cumulent ni lequel acheter.
- Proposition : ligne « se cumule avec / ne se cumule pas avec X » sur chaque carte.
- Valeur 2 · Effort S · Dépendances : lire la règle de cumul dans le cœur avant de rédiger le texte.

### Q-j2-19 — Shop sur PC : défilement dans un cadre interne
- Où : Shop à 1440 px.
- Constat : la liste défile dans un cadre à part (Master Ball coupée en bas) et « Tu as … ₽ » répète l'argent déjà visible en haut.
- Proposition : la page entière défile, la ligne « Tu as » disparaît (ou devient « Après achat : … »).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j2-20 — Shop verrouillé : une page vide et une phrase
- Où : Shop avant la Forêt de Jade (« Le Shop s'ouvre à la Forêt de Jade. »).
- Constat : écran vide, aucune envie de continuer.
- Proposition : aperçu grisé de 4 ou 5 articles à venir, avec une silhouette de la boutique.
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j2-21 — Shop : catégories qui défilent à l'horizontale sans indice
- Où : barre de catégories à 390 px.
- Constat : la dernière catégorie est coupée, rien n'indique qu'on peut faire défiler.
- Proposition : fondu sur le bord droit ou deux lignes de puces.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j2-22 — Pension : la chance de ponte n'apparaît qu'avec le 2e parent
- Où : `PagePension.tsx`.
- Constat : avec un seul parent déposé, rien n'indique qu'il en faut deux ni la chance (2 % par victoire, 1 % sans compatibilité, `reglages.json`).
- Proposition : ligne dès le 1er parent : « Ajoute un second parent : 2 % d'œuf par victoire ».
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j2-23 — Pension : liste des parents sans tri par compatibilité
- Où : sélecteur de parent.
- Constat : tous les Pokémon du PC sont listés dans l'ordre du PC ; le joueur teste au hasard.
- Proposition : tri « compatibles d'abord » et pastille « ✔ compatible avec Pikachu ».
- Valeur 2 · Effort M · Dépendances : lecture des groupes d'œufs dans les données.

### Q-j2-24 — Pension : la collection est 151 cases « ? »
- Où : collection de la Pension.
- Constat : une case grise ne dit pas comment l'obtenir. Une fois dans la collection, elle ne montre rien d'autre que le nom.
- Proposition : toucher une case donne « bébé de : X, obtenu en déposant X et Y » ; progression « 37 / 151 » en tête.
- Valeur 2 · Effort M · Dépendances : F-j2-25 (collections).

### Q-j2-25 — Casino : bouton rouge sur « Tirer » quel que soit le total
- Où : blackjack.
- Constat : le bouton primaire est rouge (couleur de danger) y compris à 19 ; le joueur hésite à cliquer.
- Proposition : « Tirer » et « Rester » de même poids, rouge réservé à « Abandonner » ; option « conseil » (stratégie de base) affichée en discret.
- Valeur 2 · Effort S · Dépendances : charte (couleurs franches).

### Q-j2-26 — Casino : pas de plafond de mise ni d'alerte
- Où : tous les jeux.
- Constat : on peut miser tous ses jetons d'un clic ; aucun garde-fou, aucune pause après une série de pertes.
- Proposition : réglage optionnel « limite de perte de session » et confirmation au-delà de 50 % du solde.
- Valeur 2 · Effort S · Dépendances : Q-j2-10.

### Q-j2-27 — Bourg Palette : scène 16:9 minuscule à 390 px, grand vide dessous
- Où : `SceneLieu.tsx`, Bourg Palette.
- Constat : la scène occupe le tiers de la hauteur, le reste est vide.
- Proposition : agrandir/recadrer comme les lieux déjà recadrés (ticket R) et placer sous la scène la liste des lieux (maman, Blue, labo, bateau).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j2-28 — Carte : toucher Bourg Palette renvoie à l'écran de combat
- Où : Carte, ligne Bourg Palette.
- Constat : le joueur arrive dans l'écran de combat vide (DPS 0) au lieu de voir le lieu.
- Proposition : ouvrir directement la scène du lieu, avec ses sous-lieux.
- Valeur 2 · Effort S · Dépendances : Q-j2-27.

### Q-j2-29 — Menu mobile : doublon Pension et Pokédex caché
- Où : Menu, barre du bas.
- Constat : la Pension est dans la barre et dans le Menu ; le Pokédex n'est accessible que par le Menu.
- Proposition : retirer le doublon du Menu ; épingler le Pokédex dans la barre ou en première ligne du Menu.
- Valeur 2 · Effort S · Dépendances : backlog X (bouton Pension dans la barre).

### Q-j2-30 — Badges : un badge ne mène pas à son arène
- Où : Menu > Badges.
- Constat : le joueur voit le nom et l'effet mais pas le champion ni l'arène ; pour un badge manquant, aucune piste.
- Proposition : au toucher, fiche « Arène de Roche, Pierre » avec bouton « Y aller » (carte) et état (battu / à battre).
- Valeur 2 · Effort M · Dépendances : F-j2-10.

### Q-j2-31 — Réglages : taille du texte et contraste élevé absents
- Où : Réglages.
- Constat : aucune option d'accessibilité visuelle ; le texte secondaire des cartes est petit à 390 px.
- Proposition : trois tailles de texte (normal, grand, très grand) et un thème à contraste renforcé dans les jetons.
- Valeur 2 · Effort M · Dépendances : `design/tokens.css`.

### Q-j2-32 — Réglages : le « Relevé de partie (développement) » est visible
- Où : bas de Réglages.
- Constat : une section de développeur est visible par tous les joueurs.
- Proposition : la ranger sous « Avancé » replié (Nicolas s'en sert pour ses tests, donc ne pas la supprimer).
- Valeur 2 · Effort S · Dépendances : aucune.

### Q-j2-33 — Objectifs : pas de barre de progression ni de « Y aller »
- Où : fenêtre Objectifs.
- Constat : « Pokédex 37 / 151 » est écrit en texte ; le boss à battre n'a pas de bouton pour s'y rendre.
- Proposition : barre de progression sur chaque objectif chiffré, bouton « Y aller » (zone du boss, Pension, Shop…).
- Valeur 2 · Effort S · Dépendances : B-uia-24 (objectif qui alterne sans pause).

### Q-j2-34 — DPS d'en-tête qui change à chaque apparition
- Où : en-tête du Combat.
- Constat : 102 943,9 puis 147 162 puis 177 813,5 d'un spawn à l'autre sans cause visible (probablement les bonus de type). Le joueur croit à une erreur.
- Proposition : afficher un DPS moyen sur 10 s arrondi ; détail « ×1,5 contre Eau » dans une bulle.
- Valeur 2 · Effort M · Dépendances : Q-j2-02.

### Q-j2-35 — Pastille sur la Pension quand un œuf est prêt
- Où : barre du bas, bouton Pension.
- Constat : je n'ai vu aucune pastille ; avec 50 victoires par éclosion, le joueur peut passer à côté d'un œuf prêt.
- Proposition : point de couleur et compteur « 2 » sur le bouton Pension ; message de l'ouverture « Ton œuf est prêt ».
- Valeur 2 · Effort S · Dépendances : calque de notifications (ticket R).

## Valeur 3

### Q-j2-36 — Pension : « Prendre l'œuf » dès 35/50
- Où : carte de l'œuf.
- Constat : le bouton est proposé avant la fin de la couvaison et envoie l'œuf au PC ; rien n'explique la conséquence.
- Proposition : une ligne « Tu pourras le faire éclore plus tard depuis le PC » (ou masquer le bouton avant 50/50).
- Valeur 3 · Effort S · Dépendances : lire la règle exacte dans `src/core` avant le texte.

### Q-j2-37 — Pension : 857 nœuds et 166 images à l'ouverture
- Où : collection de la Pension.
- Constat : mesuré à 390 px, tâche longue de 153 ms à l'ouverture (contre 55 à 60 ms ailleurs).
- Proposition : afficher la collection par pages de 30 ou en `content-visibility: auto` ; images en `loading="lazy"`.
- Valeur 3 · Effort M · Dépendances : aucune.

### Q-j2-38 — Casino : « Rend 1 jetons »
- Où : texte de gain, jeu « plus ou moins ».
- Constat : accord manquant.
- Proposition : gabarit avec pluriel (« 1 jeton » / « 2 jetons »).
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j2-39 — Casino : le tableau des gains est loin du bouton d'achat (gratter)
- Où : jeu Gratter.
- Constat : pour savoir ce qu'on peut gagner il faut défiler sous le bouton.
- Proposition : tableau dans un panneau « Gains » replié au-dessus du bouton.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j2-40 — Casino : prix en jetons sans équivalent en ₽
- Où : boutique du casino.
- Constat : une Master Ball coûte 40 000 jetons soit 800 000 ₽ (20 ₽ le jeton), contre 331 500 ₽ au Shop ; le joueur ne peut pas le deviner.
- Proposition : afficher « ≈ 800 000 ₽ » en petit à côté du prix.
- Valeur 3 · Effort S · Dépendances : F-j2-04 si le prix est revu.

### Q-j2-41 — Menu : une longue liste sans regroupement
- Où : Menu et page Plus.
- Constat : une quinzaine d'entrées à la suite.
- Proposition : trois blocs « Jouer », « Ma collection », « Compte et aide ».
- Valeur 3 · Effort S · Dépendances : Q-j2-29.

### Q-j2-42 — Badges : phrase « Touche un badge pour voir son effet » inutile
- Où : Badges.
- Constat : l'effet est déjà écrit sous le nom du badge.
- Proposition : retirer la phrase, ou faire du toucher la fiche d'arène (Q-j2-30).
- Valeur 3 · Effort S · Dépendances : Q-j2-30.

### Q-j2-43 — Réglages : curseurs « 30 / 40 » sans unité
- Où : Réglages > Son.
- Constat : on ne sait pas si c'est un pourcentage.
- Proposition : « 30 % » et pas de /40 si le maximum est interne.
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j2-44 — Réglages : confirmation d'achat pour les gros montants
- Où : Shop, boutique du casino.
- Constat : un clic sur « Acheter » ou « Max » peut vider 330 000 ₽ sans second contrôle.
- Proposition : réglage « Confirmer les achats de plus de X » (désactivé par défaut) ; annulation pendant 5 s après l'achat.
- Valeur 3 · Effort S · Dépendances : Q-j2-15.

### Q-j2-45 — Raccourcis PC : rien pour le Casino, les Statistiques, les Badges, les Réglages
- Où : fenêtre « Raccourcis » (1–7, C/B/A/T/R/S/F/P, flèches, `/`).
- Constat : les écrans secondaires ne s'atteignent qu'à la souris. À vérifier : la liste exacte dans la fenêtre « Raccourcis » avant d'attribuer des touches.
- Proposition : touches libres pour ces 4 écrans, affichées dans la fenêtre Raccourcis.
- Valeur 3 · Effort S · Dépendances : conflits avec les touches existantes.

### Q-j2-46 — DPS « 0 » en ville
- Où : en-tête dans les lieux de Bourg Palette.
- Constat : « 0 » laisse croire à un jeu cassé ; en ville il n'y a pas de combat.
- Proposition : afficher « — » ou « En pause ».
- Valeur 3 · Effort S · Dépendances : aucune.

### Q-j2-47 — Bateau « Johto : Bientôt disponible »
- Où : Bourg Palette.
- Constat : un élément cliquable qui ne mène nulle part.
- Proposition : au toucher, un petit dialogue du marin (« Reviens quand tu seras Maître de la Ligue ») qui annonce la condition de déblocage ; masquer tant que la région n'existe pas.
- Valeur 3 · Effort S · Dépendances : `docs/vision.md` (une région s'ouvre à la fin de la précédente).

---

# 2. FONCTIONNALITÉS (47 candidats)

## Valeur 1

### F-j2-01 — Succès élargis : de 7 à une quarantaine
- Où : `data/succes.json`, Compte > Succès.
- Constat : il n'y a que 7 succès (Pokédex 1 et 25, 1 badge, éclosions 10/50/100/151). Aucun pour le casino, l'argent, les badges au-delà du 1er, la Ligue, le Panthéon, le shiny, les évolutions, le Centre commercial.
- Proposition : 5 familles de 8 succès à paliers (argent cumulé, casino, captures/shiny, combat/boss, collection) ; chaque succès verse des diamants (vision.md : succès → diamants → skins). Succès cachés pour les easter eggs.
- Valeur 1 · Effort M · Dépendances : F-j2-02 (usage des diamants), F-j2-05 (compteurs).

### F-j2-02 — Donner un usage aux diamants : boutique de skins
- Où : Compte > Diamants et Skins (« Aucun skin débloqué pour l'instant »).
- Constat : 500 diamants dans ma partie de test n'ont aucun usage, aucun catalogue de skins n'existe. Prévu dans vision.md (cosmétiques uniquement).
- Proposition : boutique de diamants avec cosmétiques : cadre de balle, effet de capture, fond d'écran de scène, sprite de dresseur, cadre de profil. Aperçu avant achat. Rien qui touche au gameplay.
- Valeur 1 · Effort L · Dépendances : F-j2-01 ; choix du premier lot de 8 à 10 skins par Nicolas.

### F-j2-03 — Quêtes quotidiennes et hebdomadaires
- Où : fenêtre Objectifs, nouvel onglet.
- Constat : les objectifs actuels sont des jalons uniques ; une fois faits, aucune raison de revenir demain.
- Proposition : 3 quêtes par jour (« Gagne 200 combats », « Fais éclore 1 œuf », « Joue 5 parties de casino ») et 1 défi hebdomadaire ; récompenses en jetons, balles ou diamants.
- Valeur 1 · Effort M · Dépendances : F-j2-05. **Règle à valider** (nouvelle source de récompenses).

### F-j2-04 — Puits d'argent qui reste utile en fin de partie
- Où : Shop, Centre commercial, économie générale.
- Constat : en fin de partie ma partie de test avait 5 M ₽ sans rien à acheter ; le seul puits répétable est le casino (rendement de 96 %).
- Proposition : « Fondation de Kanto » : investir des ₽ par paliers croissants (100 k, 500 k, 2 M…) pour des bonus permanents modestes (chance de shiny +0,1 %, +1 % d'XP, 1 emplacement de Pension) ; ou boutique premium à prix fixes élevés (Master Ball à 331 500 ₽ déjà là).
- Valeur 1 · Effort L · Dépendances : simulateur d'économie. **Règle à valider.**

### F-j2-05 — Page Statistiques complète
- Où : `StatistiquesPage.tsx`.
- Constat : la page n'a que deux statistiques générales (Pokémon vaincus, argent total) plus une liste de bonus.
- Proposition : temps de jeu, captures (dont shiny), évolutions, œufs éclos, argent dépensé par catégorie, jetons gagnés/perdus, parties de casino par jeu, record de dégâts, meilleure série de victoires, plus un graphique d'argent sur 7 jours.
- Valeur 1 · Effort M · Dépendances : compteurs dans le cœur (les sauvegardes existantes démarrent à zéro).

### F-j2-06 — Prestige : « Nouvelle partie+ » après le Panthéon
- Où : Panthéon, Compte.
- Constat : le Panthéon clôt la région ; ensuite il ne reste plus d'objectif. Standard des clickers.
- Proposition : recommencer la région avec des bonus permanents (points de prestige selon le temps de Ligue), l'équipe et le Pokédex conservés.
- Valeur 1 · Effort L · Dépendances : ADR région (une région repart déjà de zéro), simulateur. **Règle à valider.**

### F-j2-07 — Objectifs étendus avec barres de progression
- Où : fenêtre Objectifs.
- Constat : seulement le boss, l'Équipement, le Pokédex, la Pension, Radar/Fauchage/Auto-clic ; rien pour Casino, Centre commercial, badges, Ligue, Panthéon, shiny, évolutions, collections.
- Proposition : 12 objectifs de plus en trois étages (court, moyen, long) avec récompense, par exemple « 8 badges », « 1er shiny », « 100 000 jetons gagnés ».
- Valeur 1 · Effort M · Dépendances : Q-j2-33, F-j2-01 (mêmes compteurs).

## Valeur 2

### F-j2-08 — Chez Maman : un vrai lieu
- Où : `data/regions/kanto/scenes.json`, Chez Maman (bulle « Il n'y a rien à faire ici, sortons. », téléviseur Daran).
- Constat : le lieu est vide à chaque visite.
- Proposition : Maman donne une récompense du jour (3 Pokéballs ou un Rappel), soigne l'équipe en animation, commente le dernier badge ; la télé diffuse un résumé des stats.
- Valeur 2 · Effort S · Dépendances : F-j2-03. Cadeau quotidien : **règle à valider**.

### F-j2-09 — Chez Blue : revanches du rival
- Où : scène Chez Blue ; vision.md prévoit des combats de rival entre certaines zones.
- Constat : le lieu est vide ; aucune raison d'y retourner.
- Proposition : Blue défie le joueur à chaque tranche de 2 badges avec une équipe adaptée ; victoire = objet rare ou diamants ; dialogue qui change selon l'équipe.
- Valeur 2 · Effort L · Dépendances : événements scriptés en données. **Règle à valider.**

### F-j2-10 — Galerie des arènes et des champions
- Où : Menu > Badges.
- Constat : les badges sont une grille d'icônes.
- Proposition : une page par arène (portrait du champion, type, équipe, date de la victoire, meilleur temps), avec « Revoir le combat » en défi optionnel.
- Valeur 2 · Effort M · Dépendances : Q-j2-30.

### F-j2-11 — Carte illustrée avec statut de chaque zone
- Où : Carte.
- Constat : la carte indique ouverte / fermée seulement.
- Proposition : pour chaque zone, boss battu ✔, Pokémon vus/capturés X/Y, shiny trouvé ⭐, œufs obtenus ; filtre « zones où il me manque quelque chose ».
- Valeur 2 · Effort M · Dépendances : Q-j2-04.

### F-j2-12 — Journal de bord
- Où : nouvelle entrée du Menu.
- Constat : le joueur n'a aucune trace des événements marquants (éclosion, shiny, évolution, badge).
- Proposition : fil chronologique daté (« 14:32 – Ton Pikachu a évolué »), filtrable, avec 200 entrées gardées.
- Valeur 2 · Effort M · Dépendances : calque de notifications.

### F-j2-13 — Bilan au retour de l'absence
- Où : à l'ouverture du jeu.
- Constat : après une longue pause rien ne résume ce qui a changé (œufs prêts, expéditions revenues, quêtes expirées).
- Proposition : fenêtre « Pendant ton absence » (œufs prêts, retours d'expédition de la vision, quêtes du jour).
- Valeur 2 · Effort S · Dépendances : expéditions (prévues dans vision.md, non vues dans le menu au 19/11).

### F-j2-14 — Casino : Voltorbe Flip
- Où : Casino, nouveau jeu (comme dans HeartGold / SoulSilver).
- Constat : les 6 jeux actuels sont du hasard pur ou du blackjack ; aucun jeu de déduction.
- Proposition : grille 5×5 de cartes à retourner avec chiffres de somme par ligne/colonne ; gains en jetons par niveau.
- Valeur 2 · Effort M · Dépendances : `data/casino-jeux.json`, rendement réglé au simulateur.

### F-j2-15 — Casino : tableau des meilleurs scores et séries
- Où : Casino.
- Constat : aucun but à long terme au casino.
- Proposition : record par jeu (plus grosse mise doublée, série la plus longue au plus ou moins, meilleur blackjack) avec succès liés.
- Valeur 2 · Effort S · Dépendances : F-j2-05.

### F-j2-16 — Casino : niveau de fidélité (VIP)
- Où : Casino.
- Constat : jetons offerts une seule fois (100) ; aucune progression.
- Proposition : le total joué fait monter des niveaux (Bronze à Platine) : remise sur la boutique à jetons, jeu exclusif, cadre de profil.
- Valeur 2 · Effort M · Dépendances : F-j2-02. **Règle à valider.**

### F-j2-17 — Événements saisonniers
- Où : Carte, scènes, Pokédex.
- Constat : aucun contenu daté.
- Proposition : Halloween (Fantominus et Ectoplasma en bonus), Noël, Pâques (œufs spéciaux), anniversaire du jeu ; décor, spawns boostés, récompense cosmétique.
- Valeur 2 · Effort L · Dépendances : calendrier en données. **Règle à valider.**

### F-j2-18 — Cycle jour / nuit dans les scènes
- Où : scènes de lieux, zones.
- Constat : les décors sont fixes.
- Proposition : teinte selon l'heure locale, quelques Pokémon nocturnes (Nosferapti, Hoothoot…) ; option pour la couper.
- Valeur 2 · Effort M · Dépendances : jeu de teintes dans `design/`. **Règle à valider** (spawns).

### F-j2-19 — Compagnon qui suit le dresseur
- Où : scènes de lieux, Combat.
- Constat : l'équipe n'apparaît qu'en combat.
- Proposition : un Pokémon au choix marche à côté du dresseur dans Bourg Palette, réagit au toucher (cri, cœur) et donne un petit bonus d'amitié.
- Valeur 2 · Effort M · Dépendances : sprites de marche (à créer). **Règle à valider** pour le bonus.

### F-j2-20 — Carte de dresseur partageable
- Où : Compte.
- Constat : aucun moyen de montrer sa progression aux amis (public visé).
- Proposition : carte PNG générée (nom, badges, Pokédex X/151, équipe, temps de Ligue) à enregistrer ou à copier.
- Valeur 2 · Effort M · Dépendances : F-j2-05.

### F-j2-21 — Collections thématiques
- Où : Pokédex / Pension / Objectifs.
- Constat : une seule collection (Pension : bébés) ; aucune autre façon de regrouper.
- Proposition : collections à compléter : starters, fossiles, Évoli et ses évolutions, légendaires, oiseaux, Pokémon par type ; récompense à chaque collection.
- Valeur 2 · Effort M · Dépendances : Q-j2-24, F-j2-01.

### F-j2-22 — Hall des Fameux amélioré
- Où : Panthéon.
- Constat : le Panthéon est un écran de fin sans trace durable.
- Proposition : chaque victoire enregistre l'équipe, la date et le temps ; galerie consultable ; classement entre amis si le compte le permet.
- Valeur 2 · Effort M · Dépendances : compte en ligne.

### F-j2-23 — Ligue : mode revanche de plus en plus dur
- Où : Ligue.
- Constat : une fois la Ligue battue, rejouer ne rapporte rien (simulateur : 87 min).
- Proposition : Ligue+ (niveaux +10, +20…) avec récompenses croissantes, record de niveau atteint.
- Valeur 2 · Effort M · Dépendances : simulateur. **Règle à valider.**

### F-j2-24 — Tour de Combat (mode infini)
- Où : Ligue ou Carte.
- Constat : pas de contenu de fin de partie hors prestige.
- Proposition : étages successifs avec champion toutes les 10 manches, sauvegarde du meilleur étage, récompenses en diamants.
- Valeur 2 · Effort L · Dépendances : F-j2-06. **Règle à valider.**

### F-j2-25 — Chaînes au Poké-Radar
- Où : Poké-Radar (objet, icône dans la scène).
- Constat : le Radar est un interrupteur ; aucune mécanique de chaîne.
- Proposition : chaque capture de la même espèce augmente la chance shiny par palier (comme dans Pokémon X/Y) ; compteur visible.
- Valeur 2 · Effort M · Dépendances : `reglages.json` (shiny 6,25 %). **Règle à valider.**

### F-j2-26 — Consommables de Pension
- Où : Shop, Pension.
- Constat : la ponte est de 2 % par victoire et l'éclosion de 50 victoires ; aucun objet ne l'influence.
- Proposition : Encens Pension (+50 % de ponte pendant 30 min), Pile Éclosion (−10 victoires), Œuf Chance (déjà vu au Shop pour l'XP) selon le catalogue.
- Valeur 2 · Effort M · Dépendances : Q-j2-22. **Règle à valider.**

### F-j2-27 — Boutique tournante du Centre commercial
- Où : Centre commercial.
- Constat : le stock est fixe.
- Proposition : 3 articles spéciaux par jour (CT rares, objets cosmétiques, lots), annoncés à l'ouverture, avec minuteur.
- Valeur 2 · Effort M · Dépendances : F-j2-03. **Règle à valider.**

### F-j2-28 — Musique par zone et ambiance du casino
- Où : réglage Son, zones, Casino.
- Constat : une seule musique ; B-uia-30 montre que sa reprise est déjà fragile.
- Proposition : une piste par type de lieu (route, grotte, ville, arène, casino), jingle de victoire d'arène.
- Valeur 2 · Effort M · Dépendances : sources audio libres de droit. Voir B-uia-30.

### F-j2-29 — Mode daltonien pour les types
- Où : badges de types dans le Combat, le Pokédex, le Shop.
- Constat : les types ne se distinguent que par la couleur dans plusieurs écrans.
- Proposition : réglage qui ajoute une icône ou une lettre à chaque type.
- Valeur 2 · Effort S · Dépendances : Q-j2-31.

### F-j2-30 — Défi du jour de la Ligue
- Où : Ligue.
- Constat : aucun contenu quotidien en combat.
- Proposition : un boss du jour avec équipe fixe et récompense bonus (jetons, diamants).
- Valeur 2 · Effort M · Dépendances : F-j2-03. **Règle à valider.**

### F-j2-31 — Labo de Chen : défi rejouable et bilan
- Où : scène Labo (vide aujourd'hui), `data/defi-chen.json`.
- Constat : le Labo ne propose rien après l'intro.
- Proposition : le Prof. Chen commente le Pokédex (étape suivante, espèces manquantes par route) et relance le défi de Chen avec une variante à chaque palier.
- Valeur 2 · Effort M · Dépendances : `defi-chen.json`.

### F-j2-32 — Pêche aux Pokémon d'eau
- Où : zones d'eau, scène de lieu.
- Constat : aucun mini-jeu actif, tout est automatique.
- Proposition : mini-jeu de timing de 5 s pour sortir un Pokémon aquatique rare (Magicarpe, Léviator) ; limite de 10 par heure.
- Valeur 2 · Effort M · Dépendances : Canne (objet à ajouter). **Règle à valider.**

### F-j2-33 — Parc Safari
- Où : Carte, ville Parmanie.
- Constat : le Parc Safari n'existe pas dans le jeu.
- Proposition : entrée payante, 30 pas, spawns exclusifs (Kangourex, Scarabrute…), capture avec appât/roche.
- Valeur 2 · Effort L · Dépendances : données de zones. **Règle à valider.**

## Valeur 3

### F-j2-34 — Succès cachés et easter eggs bonus
- Où : `data/easter-eggs.json` (Dinnerbone/Grumm, Jeb_, Caca, Daran, Gabriel, Bjorn).
- Constat : les easter eggs de nom existent mais ne rapportent rien et ne sont pas notés.
- Proposition : chaque easter egg déclenché débloque un succès caché (« ? ») ; nouveaux : code Konami sur PC, 10 touchers sur Ronflex, 3 touchers sur la télé de Maman.
- Valeur 3 · Effort S · Dépendances : F-j2-01.

### F-j2-35 — Titres de dresseur
- Où : Compte, carte de dresseur.
- Constat : le nom du joueur est seul.
- Proposition : titre à choisir selon les succès (« Maître des œufs », « Roi du casino »).
- Valeur 3 · Effort S · Dépendances : F-j2-01, F-j2-20.

### F-j2-36 — Cadres et avatars de profil
- Où : Compte.
- Constat : aucun avatar.
- Proposition : choix parmi 20 sprites de dresseurs, débloqués par badges et succès.
- Valeur 3 · Effort M · Dépendances : F-j2-02.

### F-j2-37 — Vibration sur capture, éclosion, victoire d'arène
- Où : mobile, Réglages.
- Constat : aucun retour haptique.
- Proposition : vibrations courtes (Vibration API), désactivables.
- Valeur 3 · Effort S · Dépendances : Q-j2-44 (même section Réglages).

### F-j2-38 — Astuces au chargement
- Où : écran de démarrage, Guide du jeu.
- Constat : le Guide est une page à part que peu ouvriront.
- Proposition : une astuce (« La Pension donne une chance de ponte à chaque victoire ») sous le chargement, tirée d'une liste de 40.
- Valeur 3 · Effort S · Dépendances : liste de textes.

### F-j2-39 — Crédits avec les statistiques du joueur
- Où : `Credits.tsx` (bouton « Passer » présent).
- Constat : crédits non vus à l'écran ; le code montre un défilement standard.
- Proposition : fin de crédits avec temps de jeu, nombre de Pokémon, shiny, badges.
- Valeur 3 · Effort S · Dépendances : F-j2-05.

### F-j2-40 — Textes de découverte de lieu
- Où : première visite d'une zone.
- Constat : les zones n'ont aucun texte d'ambiance.
- Proposition : une phrase de découverte à la première arrivée (« L'air sent le soufre ici ») ; collection de 21 phrases consultables dans le journal.
- Valeur 3 · Effort S · Dépendances : F-j2-12.

### F-j2-41 — Installation comme application (PWA)
- Où : vision.md liste « PWA » parmi les technologies ; aucune occurrence de manifest ou de service worker dans `src`, `data`, `docs` (à vérifier dans `vite.config`).
- Constat : sur iPhone le jeu se lance dans Safari avec la barre du navigateur.
- Proposition : manifeste, icônes, mode plein écran ; invitation « Ajouter à l'écran d'accueil » une fois.
- Valeur 3 · Effort M · Dépendances : vérifier l'existant (valeur à relever si rien n'est en place).

### F-j2-42 — Échange de Pokémon entre amis par code
- Où : PC, Compte.
- Constat : les amis jouent chacun dans leur compte, sans lien.
- Proposition : proposer un échange via un code court à partager ; validation des deux côtés ; évolution par échange (Kadabra, Gravalanch).
- Valeur 3 · Effort L · Dépendances : compte en ligne, back-end. **Règle à valider.**

### F-j2-43 — Loterie gratuite quotidienne
- Où : Centre commercial.
- Constat : aucune gratification de connexion.
- Proposition : un ticket gratuit par jour qui donne de petits lots (balles, jetons, rarement un diamant).
- Valeur 3 · Effort S · Dépendances : F-j2-03. **Règle à valider.**

### F-j2-44 — Course de Pokémon (paris)
- Où : Casino, nouveau jeu.
- Constat : tous les jeux sont à tour unique.
- Proposition : 4 Pokémon courent 10 s, le joueur parie sur un ; cotes différentes selon la vitesse.
- Valeur 3 · Effort M · Dépendances : `casino-jeux.json`.

### F-j2-45 — Arbre de talents du dresseur
- Où : Menu.
- Constat : les badges donnent des effets fixes, sans choix.
- Proposition : un point par badge à placer (clic, XP, capture, Pension) avec remise à zéro payante.
- Valeur 3 · Effort L · Dépendances : simulateur. **Règle à valider.**

### F-j2-46 — Fêtes de la Pension : lots d'œufs
- Où : Pension.
- Constat : une éclosion à la fois, sur 50 victoires.
- Proposition : « Œufs jumeaux » (rare, 2 œufs en un), œufs de zone (type lié à la route où on les obtient), œuf doré.
- Valeur 3 · Effort M · Dépendances : Q-j2-22. **Règle à valider.**

### F-j2-47 — Défi « sans soin » et défis volontaires
- Où : Objectifs.
- Constat : aucun défi qui change la façon de jouer.
- Proposition : défis à accepter (une zone sans objet, 100 combats sans changer d'équipe) avec récompense cosmétique.
- Valeur 3 · Effort M · Dépendances : F-j2-07.
