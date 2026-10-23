# Vision du jeu (nom de travail : PokiClicker v2)

Source de vérité du jeu. Décisions de Nicolas au 23/10/2026. Ce qui est marqué **À trancher** n'est pas décidé.

## Concept
Clicker/idle Pokémon : on avance zone par zone, étape par étape, en battant des Pokémon et des boss par le clic et par le DPS de son équipe. Kanto d'abord, puis toutes les régions, jusqu'à Paldea.
Jeu **perso et amis**, ni public ni monétisé. Plateforme : **PC et mobile**, le mobile est prioritaire.

## Piliers
1. **Le clic compte toute la partie**, même à 6-7 clics/s sur téléphone. Plafond de **12 clics/s** (décidé) : auto-clic et macros ne font pas rouler sur le jeu.
2. **La stratégie bat le farm.** Choix de Pokémon (types, niveau, bonheur, shiny), quoi acheter et quand. Si le seul moyen d'avancer est de répéter le même combat une heure, c'est un défaut de conception.
3. **Une progression constante.** Un déblocage ou un objectif atteignable toutes les 3-5 minutes. Pas de centaines d'heures.
4. **Mobile d'abord.** Écrans conçus en portrait et au tactile, puis adaptés au PC.
5. **Tout est donnée.** Régions, zones, boss, objets, événements en JSON ; le code est générique.

## Rythme
- Kanto : **60 à 90 minutes** (validé le 23/10) pour un joueur à 7 cps qui fait les bons choix (V1 : 1 h-1 h 30, bon délai, mais seulement atteignable en auto-clic). Environ 3-4 min par zone en moyenne, les arènes plus longues.
- Chaque région suivante est un peu plus longue que la précédente.
- Le simulateur (phase 3) tient ce budget et le vérifie à chaque changement d'équilibrage.

## Équilibrage : principes
- Les boss de zone sont **volontairement durs** : il faut badges, items du shop et bons Pokémon (haut niveau, bonheur, shiny, calcium, pierre Stase) pour passer. Le but est de forcer à économiser.
- Le shiny doit avoir un vrai intérêt (bonus de dégâts).
- Puits d'argent obligatoires : en V1 l'argent coule en fin de jeu (estimation : environ 130 k$/h en zone 3 à 1,1 M$/h en zone 20 pour un joueur sur-niveau). Règle de départ : le prix d'un objet clé vaut 3 à 5 minutes de revenu dans la zone où il se débloque.
- La difficulté des boss doit croître d'une zone à l'autre (V1 : zone 16 plus dure que 17 à 19).
- Les Pokémon du PC ne gagnent pas d'XP au repos (voulu). Seules les expéditions leur en donnent.

## Monde
- **Carte du monde** : l'océan (`Ocean.png`) avec une île par région. Formes des régions fidèles aux cartes officielles des jeux ; positions relatives fixées une fois dans un fichier `world-layout`.
- Les régions se débloquent une par une (Kanto d'abord) : devenir Maître de la région ouvre la suivante.
- **Par région** : une aventure propre (zones, boss, badges, Ligue, dialogues) et **une équipe neuve** : chaque région repart de zéro, avec **le choix du starter de la région et son animation**, comme à Kanto (décidé le 23/10). Les Pokémon du PC global ne rejoignent pas l'équipe d'une région (confirmé) ; le PC global sert au Pokédex national, aux expéditions et au Tournoi du Maître. La pension, le centre commercial et le casino sont conservés.
- **Global** : Pokédex national (petits bonus globaux, comme les Pokédex régionaux), PC global, **Tournoi du Maître** (équipe de Pokémon de toutes les régions).
- Les zones forment un **graphe** avec des conditions de passage (badge, boss vaincu, objet-clé, quête), pas une liste linéaire. Exemple : **Ronflex** bloque le passage entre deux zones, la **Pokéflûte** le réveille.
- **Événements scriptés en données** : dialogues et séquences du Prof. Chen, **combats de rival** entre certaines zones, Ronflex, Panthéon.

## Expéditions (progression hors ligne)
- On envoie des Pokémon du PC en expédition de 15 minutes à 8 heures.
- Récompenses plafonnées (bonbons, balles, pierres, œufs, un peu d'argent) **et de l'XP**, pour former une équipe de secours sans changer d'équipe en permanence.
- Jamais de progression de zone ni de boss. XP inférieure au rythme du combat actif. Taux et plafonds réglés au simulateur.

## Comptes et sauvegardes
- **Compte en ligne** : plusieurs parties par compte ; on lance celle qu'on veut et on peut en supprimer.
- **Export/import JSON conservé**, en secours.
- Trois niveaux de données : **compte** (diamants, skins, succès), **partie** (monde, Pokédex national, PC global, argent), **région** (équipe, zone, badges).
- **Succès → diamants** (monnaie du compte) → **skins** (cosmétiques uniquement). Un succès ne se gagne qu'une fois par compte.
- Triche : le jeu tourne côté client, une sauvegarde modifiée reste possible. Accepté entre amis ; les skins sont cosmétiques, donc l'enjeu est faible.

## Easter eggs (à conserver tous)
Renommer un Pokémon change son apparence : `dinnerbone`/`grumm` (inversé), `jeb_` (arc-en-ciel), `caca` (filtre), `Daran` (skin exclusif). **À ajouter : `Bjorn` et `Gabriel`.** Registre en données : nom, effet. **À trancher par Nicolas** : l'apparence de Bjorn et de Gabriel (aucune idée ni image pour l'instant).

## Direction artistique
- **Trois couches** (décidé le 23/10) : (1) un **squelette** d'interface commun (structure, composants, comportements) ; (2) un **thème par région**, qui reprend l'esprit visuel du jeu officiel de la région, en pixel mais moderne : Kanto = Rouge Feu / Vert Feuille, Johto = HeartGold / SoulSilver, les autres régions à définir une par une ; (3) la **carte du monde** (hub) dans un style propre, neutre, illustré : l'atlas, pas le style Rouge Feu. « L'esprit Rouge Feu » ne vaut que pour Kanto.
- **Il n'existe aucune charte écrite** (elle était dans la tête de Nicolas) : à créer avec `/charte` avant les écrans, dans `design/`.
- **Un seul ratio par type d'image** (décors 16:9, 1920x1080), jamais de recadrage à la main : fin des bandes noires et des décalages d'image mapping.
- Cartes : zones cliquables stockées en pourcentages dans les données, mode debug pour les placer, carte déplaçable et zoomable sur mobile.
- Images générées par IA, régénérées proprement : même ratio, pas de filigrane, ramenées sur une grille de pixels et une palette communes par script.
- La carte du monde n'est pas obligée de rester en pixel : le style illustré de `RessourcesPokiClicker` est permis (décidé le 23/10).

## Technique (recommandation validée)
Vite + React + TypeScript + Zustand + Tailwind compilé + Vitest + PWA. Cœur de jeu en TypeScript pur (`src/core`), sans React ; l'écran se rafraîchit à 10 Hz au maximum. Sprites hébergés localement, images en WebP. Backend du compte à choisir à la phase 4 (piste : Supabase).
