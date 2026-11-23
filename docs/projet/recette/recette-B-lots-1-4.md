# Recette B : parcours à l'écran des lots 1 à 4 (23/11/2026)

Parcours fait dans le navigateur du dépôt (branche `v2`, serveur de dev local, aucune API) avec une partie neuve puis une partie avancée fabriquée par `scripts/partie-test.mjs` (Kanto, 8 badges, 124/151 au Pokédex, 6 Pokémon niveau 100). Tailles regardées : 390 px (toutes les pages), 768 px et 1440 px (audit automatique de chaque page : défilement horizontal, NaN/undefined, cibles trop petites, texte coupé, chevauchements, puis capture).

Ce rapport couvre ce qui se voit à l'écran. Le serveur n'était pas lancé : les écrans connectés (liste des parties, Mon compte connecté, restauration, suppression, déconnexion) n'ont pas pu être vus ; seuls l'écran de connexion/inscription et son message d'erreur réseau l'ont été (serveur volontairement injoignable).

Légende : OK = vu à l'écran, conforme. Corrigé = défaut trouvé, corrigé et revérifié (commit). Non corrigé = défaut ou question laissé, raison donnée. Non vu = pas testé, raison donnée.

## Commits de cette recette (rien n'est poussé)

| Commit | Sujet |
|---|---|
| e78f20d | Bandeau du haut : les chiffres ne sont plus coupés à 390 px, la zone passe sur deux lignes |
| ac0aa09 | Carte d'équipe téléphone : la pastille d'avantage de type ne recouvre plus le sprite ni le niveau |
| 284e857 | Sac : les descriptions d'objets ne sont plus coupées à deux lignes |
| 1334432 | Casino : « 1 partie · 1 gagnée » (le pluriel commence à 2) |
| 4f7048a | Statistiques : DPS maximal arrondi comme le bandeau, libellé « 5 + 0,2 % du DPS » |
| 9daf3f5 | PC à 1440 × 900 : le panneau « Ton équipe » ne coupe plus le niveau, il défile quand il manque de place |

Avant chaque commit : `npm run build` et le test ciblé du fichier (BandeauHaut, Coquille, CarteEquipe, Sac, PageCasino*, Statistiques*, PagePC : tous verts).

## Lot A, cœur

| Élément | Résultat |
|---|---|
| Partie neuve : intro, choix du starter, premier combat, première capture | OK à 390 px |
| Partie avancée : argent, DPS, zone, étapes, Pokédex 124/151, 8 badges | OK, aucun NaN ni undefined sur aucune page |
| Argent et jetons entiers, séparateurs de milliers | OK partout (bandeau, Shop, casino, Statistiques) |
| Casino : mise, résultat, bilan de session (B-core casino) | Corrigé 1334432 (accord singulier/pluriel) ; pile ou face joué (+1 jeton, bilan mis à jour) |
| Pension et œufs : parents, nids 1 à 5, destination de l'œuf, collection d'éclosions | OK à 390, 768 et 1440 px |
| Boss : « non capturable », Capturer et Suivant grisés, chrono qui passe au rouge sous le tiers du temps, échec = retour à l'étape 9 | OK |
| Sauvegarde corrompue (entrée de région illisible) | OK : message « Les données de cette partie ne peuvent pas être lues. », la partie est gardée (voir défauts restants) |
| Import et export de sauvegarde, évolution, éclosion à l'écran | Non vu : demandent un parcours long ou des actions destructives sur la sauvegarde de test |

## Lot B, serveur (ce que l'interface en montre)

| Élément | Résultat |
|---|---|
| Connexion : champs, œil du mot de passe, message d'erreur de champ vide (« Entre ton adresse e-mail. ») | OK à 390 px, cibles ≥ 48 px |
| Connexion avec serveur injoignable | OK : « Serveur injoignable. Vérifie ta connexion et réessaie. » dans un bloc d'alerte lisible |
| Inscription (« Au moins 10 caractères. », retour à la connexion) | OK à 390 px |
| Connexion à 1440 px (illustration à gauche, formulaire à droite) | OK |
| Mot de passe oublié, e-mail de confirmation | Non vu : demande le serveur et l'envoi d'e-mails |
| Tout le reste du lot B (routes, validation, sauvegardes S3) | Non observable à l'écran |

## Lot C, synchronisation, compte, persistance

| Élément | Résultat |
|---|---|
| Menu : « Partie en cours », « La partie se sauvegarde toute seule », « Sauvegarder maintenant » | OK à 390 px |
| Mon compte local : diamants, succès (32 sur 32), boutique d'objets de personnalisation | OK, aucun débordement horizontal |
| Réglages : Son, Combat, Collection, Affichage, bloc « Avancé » (Relevé de partie replié, Q-j2-32) | OK, tous les contrôles ≥ 48 px |
| Écran des parties, restauration d'une sauvegarde précédente, suppression, déconnexion confirmée | Non vu : n'existent qu'avec un compte et un serveur |
| Notifications en pop-up, tuto qui se réarme à chaque ouverture, bouton « Passer le tuto » | OK (le tuto s'ouvre sur Casino et PC, se ferme proprement) |
| Rechargement de la page : la partie reprend à la même zone, même argent | OK |

## Lot D, interface et confort

| Élément | Résultat |
|---|---|
| Q-j1-17 / Q-j2-12 : bandeau 390 px, zone sur deux lignes, bouton « Son » dans le bandeau | Corrigé e78f20d : « 5 009 568 ₽ » et le DPS étaient tronqués avec « Route Victoire » sur deux lignes ; les colonnes chiffrées prennent maintenant leur largeur |
| Avantage de type sur la carte d'équipe (téléphone) | Corrigé ac0aa09 : la pastille bas-droite chevauchait le niveau « 100 » et le sprite ; elle est en haut à droite, sans fond |
| Q-j1-14 : description des objets du Sac | Corrigé 284e857 : descriptions présentes mais coupées à deux lignes (CT Fauchage perdait « Recharge 20 s ») ; elles s'affichent en entier |
| Q-j1-38 : onglet « Tout » du Sac avec « Actifs » et « Autres objets » séparés ; onglets Balles, Soins, Équipement | OK |
| Q-j1-33 : panneau « Effets actifs » du combat sans permanents ni équipe | OK à 1440 px (« Aucun effet actif ») |
| Q-j1-24, 25, 26 : boss non capturable, Suivant grisé, chrono rouge | OK |
| Statistiques : toutes les cartes lisibles, aucune clé brute (Q-j2-03) | Corrigé 4f7048a : « DPS maximal 177 813,5 » (décimale parasite) et « 5+0.2% DPS » (point décimal anglais) |
| Fiche Pokémon : libellés (« Type contre Gravalanch × 4 », « Dégâts de base », bonheur, objet tenu), boutons Favori, Renommer | OK ; cibles de 28 et 32 px agrandies à 44 px par leur zone cliquable |
| PC à 390 px : recherche, bouton « Filtres », tri, type, filtre, grille à 2 colonnes | OK, Q-j1-07 et Q-j1-11 conformes |
| PC à 1440 × 900 : panneau « Ton équipe » | Corrigé 9daf3f5 : six lignes de 38 px, le niveau sortait de la carte |
| Shop, Carte, Pokédex, Menu à 390, 768, 1440 px | OK : pas de défilement horizontal, pas de texte coupé, pas de chevauchement réel (les « overlap » de l'audit sont des boîtes de texte parent/enfant) |
| Navigation : barre du bas à 390 et 768 px (60 × 56), barre latérale à 1440 px avec touches 1 à 7 | OK |
| Q-j2-26 : alerte de perte du casino | Non vu : bilan toujours positif pendant la recette |
| Q-j2-08, Q-j2-23 (note de pension, tri par compatibilité), Q-j1-27 (préférences du PC mémorisées), Q-j1-16 (« tout sélectionner » avant relâche), Q-j1-13 (écart de DPS à l'échange), B-uia-07 (date de diplôme) | Non vu : demandent des manipulations longues (échange, relâche en lot, diplôme) que je n'ai pas faites |
| Q-j1-04 (« Passer » une réplique) | Non vu |

## Défauts restants, par gravité

1. Moyenne. Sauvegarde locale illisible : l'écran affiche « Une erreur est survenue. Recharge la page ; ta partie est gardée. Les données de cette partie ne peuvent pas être lues. » avec un bandeau à 0 et la navigation active. Recharger ne change rien, et en mode local il n'y a aucune sortie (pas d'écran des parties). Le texte devrait dire autre chose que « Recharge la page » quand l'erreur vient des données (`src/ui/persistance.ts:11` et `:23`). Choix de texte et de parcours : à décider par Nicolas.
2. Moyenne. Panneau « Ton équipe » du PC à 1440 × 900 : les trois cartes « Équipe A / B / C » (lot 6) prennent la moitié de la hauteur, le panneau n'a plus que 357 px et affiche quatre Pokémon sur six sans défiler. À regarder avec la session du lot 6 (même zone de page). À 390 px les trois cartes précèdent aussi la liste et la repoussent vers le bas.
3. Basse. Le panneau « Relevé de partie » parle toujours d'un « simulateur » (« Les clics et le hasard diffèrent du simulateur ») alors que Nicolas a abandonné le simulateur par ticket. Texte seulement.
4. Basse. Carte « Objectifs » du combat à 390 px : « Pokédex : 124/130 pour u… » est tronquée avec points de suspension (le texte complet est dans le tiroir Objectifs).
5. Basse. Boss à 390 px : « PV 2 237 440 / 2 237 440 » passe à la ligne après la barre oblique.
6. Basse. Connexion avec les deux champs vides : seul le champ e-mail signale l'erreur, pas le mot de passe.
7. Basse. Statistiques : « Dégâts clic Total 3 106,5 » garde une décimale, alors que les autres dégâts sont entiers. Je n'y ai pas touché : c'est la valeur calculée par le cœur (`calculerClic`), pas un format.
8. Information. « Restes » (Shop, Sylphe SARL) fait de l'auto-clic (« Auto-click 9 clics/sec »), lié à Attaque auto par un réglage dédié. Nicolas a décidé « pas d'autoclic » : c'est une règle de jeu, je n'y ai pas touché ; à confirmer que l'objet doit rester.

## Fichiers modifiés par d'autres sessions (non touchés)

`data/safari.json`, `src/core/jeux-casino.ts`, `src/ui/HallDesFameux.tsx`, `src/ui/PageSafari.tsx`, `src/ui/useCodeKonami.ts` étaient modifiés dans l'arbre de travail pendant la recette. Le Vite de dev recharge la page entière à chaque enregistrement, ce qui a coupé plusieurs de mes scripts.

## Ce qui n'a pas pu être vu

Écrans connectés (parties, restauration, suppression, déconnexion, mot de passe oublié), import/export de sauvegarde, évolution et éclosion à l'écran, alerte de perte du casino, échange et relâche en lot au PC, diplôme, « Passer » une réplique du tutoriel, 2560 px. Les boss s'obtiennent en modifiant l'étape dans le `localStorage` de ma propre sauvegarde de test (jamais la production ni un vrai compte).
