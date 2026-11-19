# Audit PokiClicker v2 du 19/11/2026 : 250 propositions

Branche `v2`, état du 19/11/2026. Six lectures en parallèle : cœur (`core.md`), interface (`ui-a.md`, `ui-b.md`), serveur et scripts (`serveur.md`), jeu à l'écran (`jeu-1.md`, `jeu-2.md`). Ces six fichiers contiennent les listes complètes (542 entrées) ; ce document en retient 50 par catégorie, sans doublon.

Lecture des fiches : gravité 1 critique, 2 notable, 3 mineur ; valeur 1 forte, 3 faible ; effort S (moins d'une demi-journée), M (jusqu'à 2 jours), L (plus). Les fiches sont classées par gravité ou valeur, puis par ordre de découverte. Les identifiants (B-core-01…) renvoient au fichier source pour le détail.

Limites : les constats marqués « à confirmer » n'ont pas été rejoués. Les sessions de lecture du jeu n'ont pas vu à l'écran les crédits, la scène de Ronflex, le Panthéon ni le compte hors connexion, ni la capture réussie ou ratée, l'éclosion, la relâche par lot, le Fauchage actif et le chrono de boss sous 10 s (lus dans le code seulement). Aucun correctif n'a été appliqué.

Sécurité : `docs/vision.md` accepte la triche par sauvegarde modifiée entre amis. Les failles retenues sont donc celles qui corrompent, bloquent, plantent ou exposent un compte, pas « le joueur peut se donner de l'argent ». Les fiches sécurité qui décrivent la même cause (CSP, jeton en `localStorage`, déconnexion sans révocation, énumération de comptes) ont été fusionnées dans une seule entrée.

Les fonctionnalités et améliorations marquées « règle à valider » changent une règle du jeu : elles ne se codent qu'après ton accord (CLAUDE.md du dépôt).

## Sommaire

### 50 bugs à corriger

1. B-core-01 : Une seule partie corrompue casse toute la liste des parties (gravité 1, effort S)
2. B-core-02 : Une sauvegarde corrompue ne peut plus jamais être réécrite ni réparée (gravité 1, effort M)
3. B-srv-01 : Historique « de rotation » écrit à chaque envoi mais jamais lisible par aucune route (gravité 1, effort M)
4. B-core-03 : Le Repousse fausse la distribution des rencontres (gravité 2, effort S)
5. B-core-04 : Le relâchement automatique peut laisser une équipe composée uniquement d'œufs (gravité 2, effort S)
6. B-core-05 : Un œuf peut être déposé comme parent à la pension (gravité 2, effort S)
7. B-core-06 : Un `starterId` autre que 1, 4 ou 7 fait planter le combat d'événement (gravité 2, effort S)
8. B-core-07 : `reprendreCombat` plante si l'étape dépasse celles de la zone (gravité 2, effort M)
9. B-core-08 : Création, import et installation de version ne sont pas atomiques (gravité 2, effort M)
10. B-core-09 : L'export de secours échoue dès qu'une région est illisible, et n'emporte pas le compte (gravité 2, effort M)
11. B-core-10 : L'argent devient flottant à chaque victoire (gravité 2, effort S)
12. B-core-11 : Boosts et recharge du Fauchage reposent sur l'horloge système (gravité 2, effort M)
13. B-uia-01 : Sélecteur d'objet laissé ouvert à 0 objet (état Zustand périmé) (gravité 2, effort S)
14. B-uia-07 : Date de diplôme invalide : écran blanc (aucun ErrorBoundary) (gravité 2, effort S)
15. B-uib-01 : Sauvegarde de fermeture coupée au-delà de 60 000 octets (gravité 2, effort M)
16. B-uib-02 : Écriture région puis partie non atomique : état local incohérent si la seconde échoue (gravité 2, effort M)
17. B-uib-04 : Après une erreur d'écriture, les réglages son et préférences sont perdus sans message (gravité 2, effort S)
18. B-uib-05 : Réponse 200 dont le JSON est illisible : statut « hors ligne » et révision acceptée non retenue (gravité 2, effort S)
19. B-uib-06 : Une entrée locale corrompue casse toute la liste des parties (gravité 2, effort S)
20. B-uib-07 : Bouton « Salle » actif pendant une animation : message de résultat perdu (gravité 2, effort S)
21. B-uib-08 : Tutoriel : la carte ne prend pas le focus et n'écoute pas Échap (gravité 2, effort M)
22. B-uib-09 : Espace et Entrée liés à « attaquer » : double action possible sur un bouton focalisé (gravité 2, effort S)
23. B-srv-02 : Un PUT dont la réponse est perdue fabrique une fausse divergence et peut faire perdre les dernières secondes (gravité 2, effort M)
24. B-srv-03 : `DELETE /parties/:id` sans `revisionBase` : détruit aussi toutes les versions, donc irréversible (gravité 2, effort M)
25. B-srv-04 : Date impossible silencieusement déplacée (`2024-02-31` devient le 2 mars) (gravité 2, effort S)
26. B-srv-05 : `ecrit_le` est choisi par le client : futur lointain accepté, ordre et comparaisons dépendants de l'horloge de l'appareil (gravité 2, effort M)
27. B-srv-06 : Aucun écouteur `error` sur le pool pg ni `unhandledRejection` : une coupure de connexion inactive plante le processus (gravité 2, effort S)
28. B-srv-08 : Le gestionnaire de tâches de fond avale toutes les erreurs : un e-mail de réinitialisation perdu n'est ni tracé ni signalé (gravité 2, effort M)
29. B-srv-10 : Une divergence de plus de 3 Mo ne peut pas être archivée : le client reste bloqué en « divergence » (gravité 2, effort M)
30. B-core-12 : L'arrêt automatique annonce « shiny » alors que le shiny n'est pas la cause (gravité 3, effort S)
31. B-core-15 : Le sabot de blackjack est reconstruit en pleine main avec des cartes déjà sorties (gravité 3, effort S)
32. B-core-16 : `acheterJetons` n'a pas de plafond : des jetons au-delà de 2^53 rendent la région non sauvegardable (gravité 3, effort S)
33. B-core-17 : `renommerPartie` ne change ni la révision ni la date d'écriture (gravité 3, effort S)
34. B-core-20 : Le message d'achat d'une amélioration affiche toujours « CT Jackpot » (gravité 3, effort S)
35. B-core-21 : Le casino revend sans limite un Pokémon déjà possédé (gravité 3, effort S)
36. B-core-35 : `relacher` isolé ne contrôle pas le favori (gravité 3, effort S)
37. B-core-36 : Le Jeton Shiny serait applicable à un œuf (gravité 3, effort S)
38. B-core-37 : `couplePonte` : l'espèce du parent sert de clé sans filtrer les œufs (gravité 3, effort S)
39. B-core-38 : Un Pokémon de pension éclot avec une chance chromatique non bornée par 1 (gravité 3, effort S)
40. B-uia-02 : Message d'objet identique non ré-annoncé, minuteur non relancé (gravité 3, effort S)
41. B-uia-04 : Gain de casino masqué si le jeu est quitté pendant un tour (gravité 3, effort S)
42. B-uia-09 : Double déclenchement possible sur la carte (clic + fin de pointeur) (gravité 3, effort S)
43. B-uia-12 : « Vol en cours vers undefined… » possible (gravité 3, effort S)
44. B-uia-25 : Bouton d'objectif et carte ennemie se chevauchent possiblement à 390 px (gravité 3, effort S)
45. B-uia-27 : Badge `cache` encore cliquable (gravité 3, effort S)
46. B-uib-12 : Verrou `actif.current` du vol de Pokémon jamais relâché si `allerVers` lève (gravité 3, effort S)
47. B-uib-17 : « Pas assez d'argent. » affiché pour toute raison de non-achat (gravité 3, effort S)
48. B-uib-18 : Quantité non remise à 1 au changement de sélection (gravité 3, effort S)
49. B-srv-14 : Risque d'écrasement sans conflit après suppression puis recréation d'une région (révision 1 réutilisée) (gravité 3, effort M)
50. B-srv-21 : Tout 4xx (hors 408/429) bloque la synchro jusqu'au rechargement du jeu (gravité 3, effort S)

### 50 failles de sécurité à corriger

1. S-core-01 : Validation de région incomplète : une sauvegarde « valide » peut planter le chargement (gravité 1, effort M)
2. S-core-02 : Aucun plafond numérique : `Infinity` et débordements atteignables (gravité 2, effort M)
3. S-core-03 : Niveau, calcium et bonheur au-delà des maxima du jeu (gravité 2, effort S)
4. S-core-04 : Identifiants (`uid`) dupliqués acceptés dans l'équipe, le PC et la pension (gravité 2, effort S)
5. S-core-05 : Listes sans borne ni dédoublonnage (déni de service local) (gravité 2, effort M)
6. S-core-06 : L'import n'a aucune limite de taille ni de coût (gravité 2, effort S)
7. S-core-07 : Import et sauvegarde acceptent des régions que le jeu ne prévoit pas (gravité 2, effort S)
8. S-uia-02 : Aucune CSP dans `index.html` (gravité 2, effort M)
9. S-uia-12 : Aucun ErrorBoundary : une exception de rendu détruit la partie affichée (gravité 2, effort M)
10. S-uib-01 : Jeton Bearer stocké en clair dans `localStorage` (gravité 2, effort L)
11. S-uib-02 : Déconnexion sans réessai : le jeton peut rester valide côté serveur (gravité 2, effort M)
12. S-uib-03 : Les parties locales ne sont pas rattachées au compte : possible mélange entre comptes sur un même appareil (gravité 2, effort M)
13. S-srv-01 : Inscription ouverte, sans vérification d'e-mail, avec un stockage par compte quasi illimité (gravité 2, effort M)
14. S-srv-02 : `PUT /api/sauvegarde` : nombre de régions non borné avant la boucle SQL (amplification) (gravité 2, effort S)
15. S-srv-03 : Énumération de comptes à l'inscription (gravité 2, effort M)
16. S-srv-04 : `TRUSTED_PROXIES` vide en production n'est ni refusé ni signalé (gravité 2, effort S)
17. S-srv-05 : Pas de limite par adresse e-mail pour la réinitialisation : bombardement d'un tiers et épuisement du quota SMTP (gravité 2, effort M)
18. S-srv-07 : Aucune route de suppression ni d'export de compte (droit à l'effacement) (gravité 2, effort M)
19. S-core-12 : `evenementEnCours` contourne `eligible` et `evenementsJoues` (gravité 3, effort M)
20. S-core-15 : Chaînes sans longueur maximale ; `creerPartie` n'applique pas la limite de `renommerPartie` (gravité 3, effort S)
21. S-core-28 : Erreurs de stockage non gérées dans le cœur (gravité 3, effort M)
22. S-core-31 : Un `evenementEnCours.etape`/`file` hors catalogue peut planter la lecture de la commande (gravité 3, effort S)
23. S-core-34 : Messages d'erreur de validation renvoyés tels quels à l'utilisateur (gravité 3, effort S)
24. S-uia-01 : Jeton magique lu dans l'URL, retiré après coup seulement (gravité 3, effort S)
25. S-uia-03 : `?debug=carte` actif en production (gravité 3, effort S)
26. S-uia-04 : Détails d'erreur internes affichés à l'écran (gravité 3, effort S)
27. S-uia-10 : Chemins d'assets construits depuis des surnoms sans liste blanche (gravité 3, effort S)
28. S-uib-05 : Porte dérobée de développement active en production (gravité 3, effort S)
29. S-uib-07 : Partie locale de l'e-mail envoyée comme `name` (gravité 3, effort S)
30. S-uib-08 : URL de l'API construite sans contrôle de `VITE_API_URL` (gravité 3, effort S)
31. S-uib-10 : Message d'erreur technique affiché tel quel à l'utilisateur (gravité 3, effort S)
32. S-uib-11 : Aucune borne de longueur sur e-mail et mot de passe côté client (gravité 3, effort S)
33. S-uib-13 : Toute erreur de validation de session autre que 401 laisse la session « valide » (gravité 3, effort S)
34. S-srv-08 : `bearer()` sans `requireSignature` (gravité 3, effort S)
35. S-srv-09 : Surface `/api/auth/*` non réduite (gravité 3, effort S)
36. S-srv-10 : Pas de révocation des autres sessions au changement de mot de passe, session de 7 jours (gravité 3, effort M)
37. S-srv-12 : SMTP en clair accepté en production ; STARTTLS non exigé (gravité 3, effort S)
38. S-srv-13 : Secrets factices acceptés en production (gravité 3, effort S)
39. S-srv-15 : Pas de contrôle d'origine ni de type de contenu sur `/api/sauvegarde` alors que le cookie de session est accepté (gravité 3, effort S)
40. S-srv-16 : Création de partie : l'identifiant d'un autre compte renvoie 404, un identifiant libre 200 (gravité 3, effort S)
41. S-srv-17 : Images non épinglées et installation avec scripts dans l'étape de build (gravité 3, effort S)
42. S-srv-18 : Conteneur non durci (gravité 3, effort S)
43. S-srv-19 : Pas de TLS configuré vers Postgres (gravité 3, effort S)
44. S-srv-20 : Un seul rôle SQL pour migrer et servir (gravité 3, effort M)
45. S-srv-21 : Pas de Dependabot, d'audit npm en CI, ni de `permissions:` dans les workflows ; actions épinglées par étiquette (gravité 3, effort S)
46. S-srv-22 : Journalisation insuffisante pour détecter une attaque, et PII possible dans les messages d'erreur SMTP (gravité 3, effort M)
47. S-srv-23 : Champs `name`/`image` d'inscription non bornés (jusqu'à 100 Ko) (gravité 3, effort S)
48. S-srv-24 : Racine : `.env` non ignoré par git (gravité 3, effort S)
49. S-srv-25 : `debug.log` versionné (gravité 3, effort S)
50. S-srv-27 : API : CSP et en-têtes d'isolement absents ; HSTS sans `includeSubDomains` (gravité 3, effort S)

### 50 points de qualité du code (doublons, architecture, évolutivité)

1. Q-srv-01 : Le serveur n'est pas dans la CI : ni typecheck, ni tests, ni build (gravité 1, effort M)
2. Q-core-01 : `validerForme` existe en deux variantes divergentes (gravité 2, effort S)
3. Q-core-02 : Validateurs primitifs recopiés dans cinq modules (gravité 2, effort M)
4. Q-core-03 : Constantes de règles dupliquées entre code et données (gravité 2, effort M)
5. Q-core-04 : Clés d'objets en dur dans le code (gravité 2, effort M)
6. Q-core-05 : Singleton `kanto` et `'kanto'` en dur : le cœur ne gère pas plusieurs régions (gravité 2, effort L)
7. Q-core-06 : Le cœur « pur » dépend de Vite (`import.meta.glob`) (gravité 2, effort M)
8. Q-core-07 : Réglages : validation partielle et cast direct (gravité 2, effort L)
9. Q-core-08 : Protocole de clés d'effets implicite (`badge:x`, `jalon:n`, `objet:y`) (gravité 2, effort M)
10. Q-uia-01 : Motif de dialogue modal copié dans ~14 composants (gravité 2, effort M)
11. Q-uia-03 : `EcranCombat.tsx` géant (gravité 2, effort L)
12. Q-uia-04 : `PartieConnectee` : ≈ 250 lignes, 12 états (gravité 2, effort L)
13. Q-uia-05 : Logique métier dans l'UI : `appliquer` un objet (gravité 2, effort M)
14. Q-uia-06 : Identifiants de lieux et noms de zones en dur (gravité 2, effort M)
15. Q-uia-08 : Chemins d'assets `img/...` en dur (gravité 2, effort M)
16. Q-uia-13 : `CarteKanto.tsx` : fichier trop long et mélangeant geste, rendu, a11y (gravité 2, effort L)
17. Q-uib-01 : `store.ts` : 1424 lignes, toutes les responsabilités dans un objet d'actions unique (gravité 2, effort L)
18. Q-uib-02 : Mémoïsation par `JSON.stringify`, ~12 sérialisations par tick (gravité 2, effort M)
19. Q-uib-03 : Ajouter un objet utilisable impose d'éditer une chaîne de ternaires (gravité 2, effort M)
20. Q-uib-04 : `store-capture.ts` décide par comparaison de textes d'erreur (gravité 2, effort S)
21. Q-uib-05 : Erreurs avalées en silence dans la synchro et le store (gravité 2, effort S)
22. Q-uib-08 : Mini-jeux du casino : même squelette dans quatre fichiers (gravité 2, effort M)
23. Q-uib-09 : `Pokedex.tsx` et `PokedexTelephone.tsx` dupliquent filtre et fiche (gravité 2, effort M)
24. Q-uib-10 : Deux arbres de rendu pilotés par JavaScript (`useTelephone`) au lieu du CSS (gravité 2, effort L)
25. Q-uib-11 : `PagePC.tsx` : composant de 419 lignes, ~20 `useState`, fonctions imbriquées, `pokemon` masqué (gravité 2, effort L)
26. Q-uib-12 : PC : sélection en lot en O(n²) et grille non virtualisée (gravité 2, effort M)
27. Q-uib-13 : Constantes de jeu écrites en dur dans l'UI (gravité 2, effort S)
28. Q-srv-02 : 16 scripts `extraire-*-v1` recopient le même chargeur `vm`, sans module partagé (gravité 2, effort M)
29. Q-srv-03 : `sauvegarde.ts` : 500 lignes mélangeant validation, routes et SQL ; sept copies du motif connect/BEGIN/COMMIT/ROLLBACK/release (gravité 2, effort M)
30. Q-srv-04 : Plafonds et durées codés en dur, dispersés dans trois fichiers et quatre requêtes SQL (gravité 2, effort S)
31. Q-srv-05 : Tests absents pour `index.ts`, `migrate.ts`, arrêt, transport SMTP et en-têtes de production ; aucune mesure de couverture (gravité 2, effort M)
32. Q-srv-07 : Stockage : tout en `jsonb` dans Postgres, copies complètes à chaque envoi, aucune stratégie S3 ni compression (gravité 2, effort L)
33. Q-core-09 : Un objet, deux identifiants (`candy` / `bonbon`) (gravité 3, effort S)
34. Q-core-10 : `casino.ts` mélange validation, boutique, jetons, machine, pile ou face et ré-exports ; le reste est dans `jeux-casino.ts` (gravité 3, effort M)
35. Q-core-13 : Fonctions longues dans le cœur (gravité 3, effort M)
36. Q-core-14 : Types faibles : `as`, `!` et `Record<string, unknown>` en cascade (gravité 3, effort L)
37. Q-core-15 : `rattraperEspecesEcloses` et `rattraperDex` refont la logique de `noterObtention` (gravité 3, effort M)
38. Q-core-16 : Champs optionnels hérités de versions anciennes, d'où des `?? []` partout (gravité 3, effort M)
39. Q-core-21 : Logique d'évolution reconstruite dans trois modules (gravité 3, effort S)
40. Q-core-22 : `chargerPokemon()` appelé dans dix modules du cœur (gravité 3, effort S)
41. Q-core-23 : Textes du jeu en dur dans le cœur, dont certains dupliqués (gravité 3, effort M)
42. Q-core-24 : Descriptions de bonus dupliquées en texte libre (gravité 3, effort M)
43. Q-core-35 : Aucune évolutivité pour un type de combat ou une région supplémentaire (gravité 3, effort L)
44. Q-uia-10 : `BarreLaterale` et `Navigation` dupliquées (gravité 3, effort M)
45. Q-uia-11 : `DetailBadge` en deux versions différentes (gravité 3, effort M)
46. Q-uia-18 : Singleton audio créé à l'import (gravité 3, effort M)
47. Q-uib-16 : Logique métier d'éclosion dans l'UI (gravité 3, effort M)
48. Q-srv-12 : Migrations en tableau de chaînes, sans somme de contrôle ni test depuis un état réel N-1 ; SQL documenté en double (gravité 3, effort M)
49. Q-srv-16 : Deux versions de TypeScript et de `@types/node`, plages `^` côté serveur, préversion en devDependency (gravité 3, effort S)
50. Q-srv-17 : Deux dépôts npm séparés, sans espace de travail ; le serveur est invisible depuis la racine (gravité 3, effort S)

### 50 améliorations de confort (QoL)

1. Q-j1-01 : La carte « Objectifs » masque le niveau et les PV de l'ennemi à 390 px (valeur 1, effort S)
2. Q-j1-02 : La bulle du Prof. Chen cache les boutons dont elle parle (valeur 1, effort S)
3. Q-j1-04 : Aucune façon de passer les dialogues d'intro (valeur 1, effort S)
4. Q-j1-05 : Deux boutons de combat sont des interrupteurs, deux ouvrent un tiroir, tous quatre se ressemblent (valeur 1, effort S)
5. Q-j1-06 : « Arrêt auto » et « Réglage » : des noms qui ne disent pas ce qu'ils font (valeur 1, effort S)
6. Q-j1-07 : PC sur téléphone : les filtres remplissent un écran avant la liste (valeur 1, effort M)
7. Q-j1-09 : La fiche Pokémon affiche des libellés qu'on ne peut pas décoder (valeur 1, effort S)
8. Q-j1-10 : Faire évoluer un Pokémon prend trois à quatre touchers (valeur 1, effort M)
9. Q-j1-11 : Le PC ne montre ni ne filtre les types (valeur 1, effort M)
10. Q-j1-13 : Échange d'équipe à l'aveugle : aucun écart de DPS affiché (valeur 1, effort M)
11. Q-j1-14 : Les objets du Sac n'ont aucune description (valeur 1, effort S)
12. Q-j1-15 : Le résultat d'une capture n'est montré que par un message de 1,2 s (valeur 1, effort M)
13. Q-j1-16 : Relâcher par lot : aucun « tout sélectionner » (valeur 1, effort S)
14. Q-j2-01 : Libellés accessibles qui contredisent le texte visible (valeur 1, effort S)
15. Q-j2-02 : Formater tous les nombres de la même façon (valeur 1, effort S)
16. Q-j2-03 : Clé brute « objet:omniExp (x2) » dans les statistiques (valeur 1, effort S)
17. Q-j2-04 : Carte à 390 px : la liste prend la moitié de l'écran, la carte est minuscule (valeur 1, effort M)
18. Q-j2-05 : Les 21 zones sont toutes listées « fermée » dès le début (valeur 1, effort S)
19. Q-j2-07 : Un bouton « Retour » qui ne revient pas d'où l'on vient (valeur 1, effort S)
20. Q-j2-08 : Pension : la note « Espèce inconnue… » recouvre « Retirer Pikachu » (valeur 1, effort S)
21. Q-j2-09 : Shop : bouton d'achat sans indication quand on ne peut pas payer (valeur 1, effort S)
22. Q-j2-10 : Casino : aucun bilan de session (valeur 1, effort M)
23. Q-j2-11 : Casino : pas de « Rejouer la même mise » (valeur 1, effort S)
24. Q-j2-12 : Réglages : pas de bascule son depuis l'écran de jeu (valeur 1, effort S)
25. Q-j1-17 : Le nom de la zone est coupé dans l'en-tête à 390 px (valeur 2, effort S)
26. Q-j1-20 : Les tiroirs Sac, Radar, Objectifs et Réglage ne se ferment qu'avec « Fermer » (valeur 2, effort S)
27. Q-j1-21 : À 390 px, on ne voit pas le DPS de chaque Pokémon de l'équipe (valeur 2, effort M)
28. Q-j1-24 : Sur un boss, Capturer est grisé sans raison visible (valeur 2, effort S)
29. Q-j1-25 : « Suivant » est grisé sans dire pourquoi (valeur 2, effort S)
30. Q-j1-26 : Le chrono du boss ne prévient pas quand il reste peu de temps (valeur 2, effort S)
31. Q-j1-27 : Le tri et le filtre du PC repartent de zéro à chaque ouverture (valeur 2, effort S)
32. Q-j1-28 : On ne retrouve pas le Pokémon qu'on vient de capturer dans le PC (valeur 2, effort M)
33. Q-j1-30 : La fenêtre d'évolution ne montre ni l'ancien sprite ni le gain (valeur 2, effort S)
34. Q-j1-33 : « Effets actifs : Aucun » alors que le Sac montre des objets « ACTIF » (valeur 2, effort S)
35. Q-j1-34 : Changer de balle n'a pas d'écran de choix (valeur 2, effort S)
36. Q-j2-14 : Shop : le prix après inflation n'est pas expliqué (valeur 2, effort S)
37. Q-j2-18 : Shop : Multi Exp et Œuf Chance donnent le même +50 % d'XP sans le dire (valeur 2, effort S)
38. Q-j2-22 : Pension : la chance de ponte n'apparaît qu'avec le 2e parent (valeur 2, effort S)
39. Q-j2-23 : Pension : liste des parents sans tri par compatibilité (valeur 2, effort M)
40. Q-j2-25 : Casino : bouton rouge sur « Tirer » quel que soit le total (valeur 2, effort S)
41. Q-j2-26 : Casino : pas de plafond de mise ni d'alerte (valeur 2, effort S)
42. Q-j2-28 : Carte : toucher Bourg Palette renvoie à l'écran de combat (valeur 2, effort S)
43. Q-j2-30 : Badges : un badge ne mène pas à son arène (valeur 2, effort M)
44. Q-j2-31 : Réglages : taille du texte et contraste élevé absents (valeur 2, effort M)
45. Q-j2-32 : Réglages : le « Relevé de partie (développement) » est visible (valeur 2, effort S)
46. Q-j2-35 : Pastille sur la Pension quand un œuf est prêt (valeur 2, effort S)
47. Q-j1-38 : L'onglet « Tout » du Sac mélange consommables et équipements actifs (valeur 3, effort S)
48. Q-j2-39 : Casino : le tableau des gains est loin du bouton d'achat (gratter) (valeur 3, effort S)
49. Q-j2-44 : Réglages : confirmation d'achat pour les gros montants (valeur 3, effort S)
50. Q-j2-45 : Raccourcis PC : rien pour le Casino, les Statistiques, les Badges, les Réglages (valeur 3, effort S)

### 50 fonctionnalités

1. F-j1-01 : Dix à trente succès de plus, avec leurs mesures (valeur 1, effort M)
2. F-j1-02 : Alerte d'arrêt auto : vibration, son et titre d'onglet (valeur 1, effort S)
3. F-j1-03 : « Pendant ton absence » : bilan de session (valeur 1, effort M)
4. F-j1-04 : Journal des événements récents (valeur 1, effort M)
5. F-j1-05 : Avantage de type visible sur l'ennemi (valeur 1, effort M)
6. F-j1-06 : Aperçu du boss avant le combat (valeur 1, effort M)
7. F-j1-07 : Équipes enregistrées (valeur 1, effort M)
8. F-j1-08 : Liste de chasse (valeur 1, effort M)
9. F-j1-09 : Sons par événement : boss, shiny, évolution, éclosion, légendaire (valeur 1, effort M)
10. F-j1-10 : Compteur de rencontres et chasse au shiny (valeur 1, effort M)
11. F-j1-11 : Coup critique de clic (règle à valider) (valeur 1, effort M)
12. F-j2-02 : Donner un usage aux diamants : boutique de skins (valeur 1, effort L)
13. F-j2-03 : Quêtes quotidiennes et hebdomadaires (valeur 1, effort M)
14. F-j2-04 : Puits d'argent qui reste utile en fin de partie (valeur 1, effort L)
15. F-j2-05 : Page Statistiques complète (valeur 1, effort M)
16. F-j2-06 : Prestige : « Nouvelle partie+ » après le Panthéon (valeur 1, effort L)
17. F-j1-13 : Complétion de zone (valeur 2, effort M)
18. F-j1-14 : Combo de cadence (règle à valider) (valeur 2, effort M)
19. F-j1-17 : « Suggérer une équipe » contre le boss (valeur 2, effort M)
20. F-j1-18 : Chaînes de capture (règle à valider) (valeur 2, effort M)
21. F-j1-20 : Collection de lignées complètes (valeur 2, effort M)
22. F-j1-21 : Records personnels (valeur 2, effort S)
23. F-j1-22 : Jauge de cadence (valeur 2, effort S)
24. F-j1-23 : Carte de dresseur à partager (valeur 2, effort M)
25. F-j1-24 : Objets tenus selon le type (règle à valider) (valeur 2, effort M)
26. F-j1-31 : Boss avec une mécanique propre (règle à valider) (valeur 2, effort L)
27. F-j2-08 : Chez Maman : un vrai lieu (valeur 2, effort S)
28. F-j2-09 : Chez Blue : revanches du rival (valeur 2, effort L)
29. F-j2-10 : Galerie des arènes et des champions (valeur 2, effort M)
30. F-j2-12 : Journal de bord (valeur 2, effort M)
31. F-j2-14 : Casino : Voltorbe Flip (valeur 2, effort M)
32. F-j2-15 : Casino : tableau des meilleurs scores et séries (valeur 2, effort S)
33. F-j2-16 : Casino : niveau de fidélité (VIP) (valeur 2, effort M)
34. F-j2-19 : Compagnon qui suit le dresseur (valeur 2, effort M)
35. F-j2-22 : Hall des Fameux amélioré (valeur 2, effort M)
36. F-j2-23 : Ligue : mode revanche de plus en plus dur (valeur 2, effort M)
37. F-j2-24 : Tour de Combat (mode infini) (valeur 2, effort L)
38. F-j2-28 : Musique par zone et ambiance du casino (valeur 2, effort M)
39. F-j2-29 : Mode daltonien pour les types (valeur 2, effort S)
40. F-j2-31 : Labo de Chen : défi rejouable et bilan (valeur 2, effort M)
41. F-j2-33 : Parc Safari (valeur 2, effort L)
42. F-j1-33 : Compendium des objets (valeur 3, effort M)
43. F-j1-39 : Easter egg Missingno (valeur 3, effort S)
44. F-j1-40 : Code Konami sur PC (valeur 3, effort S)
45. F-j1-42 : Mannequin d'entraînement (valeur 3, effort M)
46. F-j2-35 : Titres de dresseur (valeur 3, effort S)
47. F-j2-38 : Astuces au chargement (valeur 3, effort S)
48. F-j2-39 : Crédits avec les statistiques du joueur (valeur 3, effort S)
49. F-j2-41 : Installation comme application (PWA) (valeur 3, effort M)
50. F-j2-43 : Loterie gratuite quotidienne (valeur 3, effort S)

## 50 bugs à corriger

#### B.1 B-core-01 : Une seule partie corrompue casse toute la liste des parties
`src/core/sauvegarde.ts:154-160` (et `:161-167`)
Preuve : `listerParties()` fait `chargerPartie(...)` puis `exiger(partie, ...)` sans `try/catch` ; `charger` lève « Cette sauvegarde est illisible » dès qu'une enveloppe échoue à la validation. `partieCourante()` retombe sur `this.listerParties()` quand le pointeur est illisible : l'écran de choix et le démarrage échouent pour toutes les parties à cause d'une seule.
Gravité : 1 · Correctif : isoler chaque partie dans un `try/catch` et renvoyer les parties lisibles plus une liste « illisibles » (id + raison) à exporter ou supprimer. · Effort : S

#### B.2 B-core-02 : Une sauvegarde corrompue ne peut plus jamais être réécrite ni réparée
`src/core/sauvegarde.ts:74-79`
Preuve : `ecrire` commence par `const avant = charger(cle, ...)`, qui lève si l'existant est invalide. Une région dont `zoneId` ou un champ ne valide plus fait échouer chaque sauvegarde automatique, donc aucune écriture, donc aucune réparation possible par le jeu.
Gravité : 1 · Correctif : n'exiger la lecture de `avant` que pour `revisionAttendue` et, en cas d'illisible, repartir de la révision 1 (ou d'une révision de secours) ; garder l'ancienne valeur sous une clé `.corrompue`. · Effort : M

#### B.3 B-srv-01 : Historique « de rotation » écrit à chaque envoi mais jamais lisible par aucune route
- `server/src/sauvegarde.ts:467-475`, `:278-281`, `:324-330`
- Preuve : le PUT copie l'ancienne ligne dans `versions` (origine par défaut `rotation`, schéma `schema.ts:24-31`) et n'en garde que 5 par objet (`purgerVersions`, L22-26). `GET …/versions` ne liste que `origine IN ('divergence','restauration')` et `restaurer` exige `origine <> 'rotation'`. Avec un envoi toutes les ≥ 2 s (`synchro.ts:485`) et 45 s d'intervalle, ces 5 copies couvrent quelques dizaines de secondes de jeu. Les divergences du niveau compte passent par `POST /versions` (`synchro.ts:159`), donc en rotation aussi : jamais restaurables.
- Gravité : 1 (un envoi corrompu ou une régression client écrase la partie sans retour possible par l'API ; chaque envoi coûte en plus une copie jsonb jusqu'à 1 Mo)
- Correctif : soit exposer et restaurer la rotation (instantanés espacés dans le temps : un par heure/jour plutôt que les 5 derniers envois), soit supprimer l'écriture de rotation. Archiver les divergences du compte avec un `lot` restaurable.
- Effort : M

#### B.4 B-core-03 : Le Repousse fausse la distribution des rencontres
`src/core/ennemis.ts:22-36`
Preuve : le filtre retire des sauvages, les `apparition` restantes ne totalisent plus 1, et `rencontre` vaut `pool[0]` par défaut. Route 1 avec Repousse (exclut `commun`) : restent 20 (0,10), 17 (0,05), 1 (0,05) ; un tirage au-dessus de 0,20 (80 % des cas) retombe sur `pool[0]`, soit Rattatac 90 % / Rattata… 5 % / Bulbizarre 5 % au lieu de 50 / 25 / 25. Le Super Repousse (exclut commun et peu commun) laisse un seul Pokémon : 100 %.
Gravité : 2 · Correctif : normaliser le tirage sur la somme des `apparition` du pool filtré (`tirage * somme`). · Effort : S

#### B.5 B-core-04 : Le relâchement automatique peut laisser une équipe composée uniquement d'œufs
`src/core/relache-auto.ts:23-27`
Preuve : `retirerDeLEquipe` ne garde un membre que si l'équipe devient vide ; il ne vérifie pas `dernierActif` comme `equipe.ts:51`. Équipe `[œuf, doublon éclos]` : on relâche le doublon, l'équipe est `[œuf]`, sans Pokémon capable de combattre. À confirmer par un test ciblé.
Gravité : 2 · Correctif : réutiliser `dernierActif`/`relacher` et garder au moins un Pokémon non œuf. · Effort : S

#### B.6 B-core-05 : Un œuf peut être déposé comme parent à la pension
`src/core/pension.ts:23-32`
Preuve : `deposerParent` ne teste pas `pokemon.oeuf`. L'œuf devient parent, `couplePonte` (`:103-113`) lit son `numero` et son `sexe` (espèce censée être cachée) ; la validation de sauvegarde accepte un parent avec `oeuf` (`sauvegarde-validation.ts:147`, aucune interdiction). À confirmer par script.
Gravité : 2 · Correctif : refuser `pokemon.oeuf` dans `deposerParent` et dans la validation de `pension.parents`. · Effort : S

#### B.7 B-core-06 : Un `starterId` autre que 1, 4 ou 7 fait planter le combat d'événement
`src/core/combat-evenement.ts:9`, `src/core/starter.ts:21-29`
Preuve : `commande.equipes[(starterId ?? 1) as 1 | 4 | 7]` renvoie `undefined` pour tout autre numéro, puis `.map` lève. `choisirStarter` accepte n'importe quel Pokémon et la validation de sauvegarde n'exige que `positif` (`sauvegarde-validation.ts:142`).
Gravité : 2 · Correctif : valider `starterId ∈ {1,4,7}` (donnée de la région) dans `choisirStarter` et à la validation ; repli explicite dans `equipeDe`. · Effort : S

#### B.8 B-core-07 : `reprendreCombat` plante si l'étape dépasse celles de la zone
`src/core/combat.ts:104`
Preuve : `etape > zone.etapes` lève « Étape de reprise invalide ». La validation de région ne compare ni `etape` à `zone.etapes` ni `zoneId` au monde : une sauvegarde « valide » peut donc faire planter le chargement (zone retirée ou raccourcie par une mise à jour, ou édition manuelle). Avec B-core-02, elle reste bloquée.
Gravité : 2 · Correctif : au chargement, ramener `etape` à `[1, zone.etapes]` et `zoneId` inconnu à la zone de départ de la région. · Effort : M

#### B.9 B-core-08 : Création, import et installation de version ne sont pas atomiques
`src/core/sauvegarde.ts:135-140`, `:146-147`, `:207-208`
Preuve : les régions sont écrites une à une, puis la partie. Si le stockage se remplit en cours de route (quota `localStorage`), on obtient des régions orphelines sans partie ; `installerVersion` écrit avant de supprimer les régions en trop. Rien ne retire les clés déjà écrites.
Gravité : 2 · Correctif : écrire dans l'ordre inverse (partie en dernier, déjà le cas) et, sur exception, supprimer les clés écrites pendant l'appel ; ou vérifier le quota avant. · Effort : M

#### B.10 B-core-09 : L'export de secours échoue dès qu'une région est illisible, et n'emporte pas le compte
`src/core/sauvegarde.ts:86-92`, `:177-182`
Preuve : `exporterPartie` appelle `regionsDe(id)` qui lève sur la première région invalide (`exiger(region, 'Région introuvable')`). Le fichier de secours (vision.md, « Export/import JSON conservé, en secours ») n'est donc pas produit au moment où il servirait. Diamants, succès et skins du compte ne sont jamais exportés.
Gravité : 2 · Correctif : exporter les JSON bruts même invalides (avec un drapeau), et proposer l'export du compte. · Effort : M

#### B.11 B-core-10 : L'argent devient flottant à chaque victoire
`src/core/recompenses.ts:33`, `src/core/capture.ts:78`
Preuve : `calculerOr` renvoie `or * 1.6` sans arrondi (niveau 5 commun : 29 × 1,6 = 46,4). `region.argent + or` accumule des flottants, la validation accepte `nombre` fini (`sauvegarde-validation.ts:30`) et `argentTotalGagne` aussi. Dérive d'arrondi, affichages `46.400000000000006` possibles, comparaisons de prix fragiles. À confirmer côté affichage.
Gravité : 2 · Correctif : `Math.floor` (ou `Math.round`) à la fin de `calculerOr`, et `entier` pour `argent`. · Effort : S

#### B.12 B-core-11 : Boosts et recharge du Fauchage reposent sur l'horloge système
`src/core/objets-actifs.ts:12-17`, `:58`, `:68` ; `src/core/clock.ts:4`
Preuve : les chronos sont des dates `Date.now()` persistées. Reculer l'horloge du téléphone prolonge Repousse et boosts ; l'avancer d'un jour annule la recharge du Fauchage (`rechargeFauchage - maintenant` devient négatif). Un changement de fuseau ou de synchronisation altère aussi les durées.
Gravité : 2 · Correctif : stocker des durées restantes décrémentées par le tick de jeu (comme `minuteurBossMs`), pas des dates absolues. · Effort : M

#### B.13 B-uia-01 : Sélecteur d'objet laissé ouvert à 0 objet (état Zustand périmé)
- `src/ui/EcranCombat.tsx:255-262`
- Preuve : `const etat = store.getState()` est pris avant l'action ; `etat.utiliserObjet(...)` remplace `sac` dans le store, mais `reste = etat.sac.entrees.find(...)` relit l'ancien objet `etat`.
  Avec 1 bonbon en stock : `reste` vaut 1 après l'usage (devrait être 0), donc `reste <= 0` est faux et `choisirObjet(null)` n'est pas appelé. Le sélecteur « Choisis un Pokémon » reste affiché alors que `stockObjet` (l.245) est à 0 et que plus aucun Pokémon n'est éligible. Seul Annuler ou Échap le ferme.
- Gravité : 2
- Correctif : relire `store.getState().sac` après l'appel (ou fermer quand `stockObjet` tombe à 0 dans un effet).
- Effort : S

#### B.14 B-uia-07 : Date de diplôme invalide : écran blanc (aucun ErrorBoundary)
- `src/ui/Diplome.tsx:42-44`
- Preuve : `new Intl.DateTimeFormat(...).format(new Date(diplome.date))` lève `RangeError: Invalid time value` si `diplome.date` n'est pas une date valide. `grep ErrorBoundary|componentDidCatch` ne trouve rien dans `src` : l'exception remonte et démonte tout l'arbre React. Provenance de `diplome.date` : sauvegarde locale ou serveur, éditable (à confirmer côté core si la date est validée au chargement).
- Gravité : 2
- Correctif : valider la date au chargement de la sauvegarde ; ajouter un ErrorBoundary racine dans `main.tsx`.
- Effort : S (validation) / M (boundary)

#### B.15 B-uib-01 : Sauvegarde de fermeture coupée au-delà de 60 000 octets
`src/ui/synchro.ts:269`
Preuve : `keepalive` n'est posé que si le corps fait 60 000 octets ou moins ; au-delà, la requête lancée par `pagehide` n'a aucune garantie de partir, sans repli `sendBeacon`. Une partie avancée (PC de plusieurs centaines de Pokémon) dépasse ce seuil.
Gravité 2. Correctif : envoyer un delta ou un corps compressé sous la limite, ou sauvegarder aussi sur `visibilitychange: hidden` pendant que la page vit encore. Effort M.

#### B.16 B-uib-02 : Écriture région puis partie non atomique : état local incohérent si la seconde échoue
`src/ui/persistance.ts:84-104`
Preuve : `ecrireRegion(...)` puis `ecrirePartie(...)` ; si le quota `localStorage` est atteint entre les deux, la région est en avance sur la partie et `bloquee = true` (L.102) gèle toute écriture ensuite.
Gravité 2. Correctif : écrire une seule enveloppe (région + partie + pokédex) sous une clé, ou écrire la partie d'abord et la révision en dernier. Effort M.

#### B.17 B-uib-04 : Après une erreur d'écriture, les réglages son et préférences sont perdus sans message
`src/ui/persistance.ts:72,78,87`
Preuve : `if (bloquee) return;` / `if (bloquee || suivantes === dernieresPreferences) return;`. Une fois `bloquee` posée (même par un simple conflit de révision, L.102), changer le volume ou une préférence ne s'enregistre plus et n'avertit pas.
Gravité 2. Correctif : ne bloquer que la partie ; les préférences ont leur propre clé et peuvent continuer. Effort S.

#### B.18 B-uib-05 : Réponse 200 dont le JSON est illisible : statut « hors ligne » et révision acceptée non retenue
`src/ui/synchro.ts:272-280,302`
Preuve : `await reponse.json()` après un 200, dans le `try` dont le `catch` pose `statut = 'hors-ligne'`. Le serveur a accepté la révision, le client ne l'a pas mémorisée : le prochain envoi part avec une `revisionBase` périmée, donc 409 (à confirmer).
Gravité 2. Correctif : parser dans un `try` séparé et mémoriser la révision connue avant. Effort S.

#### B.19 B-uib-06 : Une entrée locale corrompue casse toute la liste des parties
`src/ui/synchro.ts:341`
Preuve : `gestionnaire.chargerPartie(p.id)!` hors `try` dans `lister` ; la lecture d'une seule entrée invalide jette et la liste entière échoue.
Gravité 2. Correctif : `try/catch` par partie, partie marquée « illisible ». Effort S.

#### B.20 B-uib-07 : Bouton « Salle » actif pendant une animation : message de résultat perdu
`src/ui/PageCasino.tsx` (fonction `changer`, appel à partir de L.52) ; `Roulette.tsx`, `PileOuFace.tsx`, `PlusOuMoins.tsx`
Preuve : le gain est crédité au clic (`occuper(resultat.gain)` après l'appel au store) puis animé ; changer de vue pendant l'animation démonte le jeu, les minuteurs sont nettoyés mais `occuper(null)` n'est pas rappelé, et le message du gain ne s'affiche jamais.
Gravité 2. Correctif : désactiver la navigation tant que `occupe`, ou rappeler `occuper(null)` et afficher le résultat au démontage. Effort S.

#### B.21 B-uib-08 : Tutoriel : la carte ne prend pas le focus et n'écoute pas Échap
`src/ui/tuto/Tutoriel.tsx:156-162`
Preuve : `role="region"` sans gestion de focus ; « Passer le tuto » n'est atteignable qu'après avoir tabulé toute la page. Un utilisateur clavier ou lecteur d'écran ne peut pas fermer le tuto sans traverser la page.
Gravité 2. Correctif : lien d'évitement ou focus sur la carte à chaque étape, Échap pour passer. Effort M.

#### B.22 B-uib-09 : Espace et Entrée liés à « attaquer » : double action possible sur un bouton focalisé
`src/ui/useRaccourcisPC.ts` (table `actions`, L.17-29)
Preuve : `' '` et `Enter` sont mappés vers `attaquer`, et le garde ignore seulement `defaultPrevented`, `ctrl/meta/alt`, `repeat`. Sur un bouton focalisé, la touche déclenche le clic du bouton ET l'attaque (à confirmer : dépend de la vérification de `event.target` en tête de gestionnaire, non relue).
Gravité 2. Correctif : ignorer les cibles `button, a, input, select, [role]`. Effort S.

#### B.23 B-srv-02 : Un PUT dont la réponse est perdue fabrique une fausse divergence et peut faire perdre les dernières secondes
- `src/ui/synchro.ts:266-283` + `server/src/sauvegarde.ts:445-450`
- Preuve : le client abandonne après 8 s (`AbortSignal.timeout(8000)`) ; si le serveur a déjà validé, `memoire` garde l'ancienne `revisionBase`. Le PUT suivant reçoit 409 (`statut = 'divergence'`, L292). `decider` ne ramène à « charger » que si local et serveur sont identiques (L28-37) ; si le joueur a joué entre-temps, le verdict est `diverge` : l'état local est archivé puis remplacé par la version du serveur. Pas de clé d'idempotence. À confirmer (réseau mobile lent, PUT proche de 1 Mo).
- Gravité : 2
- Correctif : renvoyer au client, sur 409, la révision serveur et l'empreinte du contenu ; si l'empreinte du dernier envoi correspond, rattraper sans divergence. Ou clé d'idempotence par envoi.
- Effort : M

#### B.24 B-srv-03 : `DELETE /parties/:id` sans `revisionBase` : détruit aussi toutes les versions, donc irréversible
- `server/src/sauvegarde.ts:165-188` (surtout L178-180)
- Preuve : la route supprime `versions` de la partie puis la partie. Un appareil resté hors ligne avec une liste ancienne peut supprimer une progression plus récente écrite ailleurs, sans conflit ni archive. Le client gère le cas « supprimée ailleurs » (`synchro.ts:288-291`) mais pas l'inverse.
- Gravité : 2
- Correctif : exiger `revisionBase` (409 si périmée) ; conserver un lot de restauration de la partie supprimée pendant N jours (suppression logique).
- Effort : M

#### B.25 B-srv-04 : Date impossible silencieusement déplacée (`2024-02-31` devient le 2 mars)
- `server/src/sauvegarde.ts:59-60`, `:474`, `:381`
- Preuve : `Date.parse('2024-02-31T00:00:00Z')` vaut `1709337600000` (vérifié en local) et `new Date(...).toISOString()` donne `2024-03-02T00:00:00.000Z`. `valider` accepte ; la date stockée n'est pas celle envoyée. `Date.parse('2024-13-01T00:00:00Z')` vaut NaN (refusé). Le test censé couvrir ce cas ne vérifie que `< 500` (B-srv-22).
- Gravité : 2 (dates d'écriture faussées, comparaisons `identiques()` du client fausses)
- Correctif : vérifier l'aller-retour (`new Date(s).toISOString()` doit correspondre à `s` normalisé) ou refuser les jours hors mois ; tester le 400.
- Effort : S

#### B.26 B-srv-05 : `ecrit_le` est choisi par le client : futur lointain accepté, ordre et comparaisons dépendants de l'horloge de l'appareil
- `server/src/sauvegarde.ts:59`, `:114`, `:474`, `:299`, `:305`
- Preuve : la regex accepte `9999-12-31T23:59:59Z`. Cette valeur trie la liste (`ORDER BY ecrit_le DESC`, L114), alors que `restaurer` écrit `now()` côté serveur (L299). Un téléphone dont l'horloge est en avance passe toujours en tête et peut faire charger la mauvaise « dernière partie » (`lireServeur(null)` prend `parties[0]`, `synchro.ts:115`).
- Gravité : 2
- Correctif : ignorer la date client pour le tri et utiliser `now()` serveur (colonne `ecrit_serveur_le`), ou borner `ecritLe` à `now() + 5 min`.
- Effort : M

#### B.27 B-srv-06 : Aucun écouteur `error` sur le pool pg ni `unhandledRejection` : une coupure de connexion inactive plante le processus
- `server/src/index.ts:7`, `:8`, `:10`
- Preuve : un `Pool` émet `error` quand un client inactif perd sa connexion (redémarrage Postgres, bascule Coolify) ; sans écouteur, c'est une exception non interceptée. `await pool.query('select 1')` au démarrage échoue aussi sans nouvelle tentative si la base démarre plus lentement.
- Gravité : 2
- Correctif : `pool.on('error', …)` qui journalise ; `process.on('unhandledRejection')` ; nouvelle tentative au démarrage.
- Effort : S

#### B.28 B-srv-08 : Le gestionnaire de tâches de fond avale toutes les erreurs : un e-mail de réinitialisation perdu n'est ni tracé ni signalé
- `server/src/app.ts:36-38`, `:28-29`
- Preuve : `backgroundTasks: { handler: promise => { promise.catch(() => undefined); } }`. L'erreur d'envoi SMTP est journalisée une fois (L28) mais jamais réessayée ; dans tous les autres cas (autre tâche de fond de Better Auth) elle disparaît. L'utilisateur reçoit « Si ce compte existe, un lien… a été envoyé » (L79) même si rien n'est parti.
- Gravité : 2
- Correctif : journaliser dans le gestionnaire (sans PII), file d'attente avec nouvelle tentative, métrique d'échecs d'envoi.
- Effort : M

#### B.29 B-srv-10 : Une divergence de plus de 3 Mo ne peut pas être archivée : le client reste bloqué en « divergence »
- `server/src/sauvegarde.ts:222-223` (limite 3 Mo) contre `:53` (1 Mo par enveloppe, 20 régions) ; `src/ui/synchro.ts:160-164`
- Preuve : le PUT et l'archive de lot acceptent le même contenu (partie + 20 régions, jusqu'à 21 Mo en théorie) mais le corps d'archive est plafonné à 3 Mo. Si `archives` répond 413, `appliquer` lève « Archivage impossible » et, `bloque` valant `true`, plus rien ne part tant que le jeu n'est pas rechargé. À confirmer : les parties réelles pèsent sans doute bien moins de 3 Mo.
- Gravité : 2
- Correctif : cohérence des plafonds (même limite pour PUT et archives) ou archivage région par région ; sortie du blocage côté client.
- Effort : M

#### B.30 B-core-12 : L'arrêt automatique annonce « shiny » alors que le shiny n'est pas la cause
`src/core/combat.ts:69-71`
Preuve : l'arrêt peut venir de la rareté (`arret[cle]`) ou de `nouveau` ; la ligne 71 renvoie `'shiny'` dès que `ennemi.shiny`, même si `arret.shiny` est faux. Le motif affiché ne correspond pas au réglage qui a déclenché l'arrêt. À confirmer par test.
Gravité : 3 · Correctif : `if (ennemi.shiny && arret.shiny) return 'shiny'`. · Effort : S

#### B.31 B-core-15 : Le sabot de blackjack est reconstruit en pleine main avec des cartes déjà sorties
`src/core/blackjack.ts:101-102`
Preuve : `piocher` fait `b.sabot.push(...construireSabot(b.alea))` quand le sabot est vide, sans retirer les cartes des mains en jeu. Plus de 6 exemplaires d'une carte deviennent possibles, et `compterCartes` (`sauvegarde-validation.ts:95-103`) refuse alors l'écriture : la sauvegarde automatique échoue le temps de la main. Très rare (le remélange se fait sous 25 %), à confirmer.
Gravité : 3 · Correctif : reconstruire le sabot en retirant les cartes des mains et du croupier. · Effort : S

#### B.32 B-core-16 : `acheterJetons` n'a pas de plafond : des jetons au-delà de 2^53 rendent la région non sauvegardable
`src/core/casino.ts:128-134`
Preuve : `jetons` est un entier quelconque, `cout = jetons * 20` ; avec un `argent` très grand, `region.jetons + jetons` dépasse `MAX_SAFE_INTEGER`, et la validation `entier` (`sauvegarde-validation.ts:31`) refuse ensuite l'écriture.
Gravité : 3 · Correctif : plafonner les jetons détenus (donnée) et valider côté achat. · Effort : S

#### B.33 B-core-17 : `renommerPartie` ne change ni la révision ni la date d'écriture
`src/core/sauvegarde.ts:104-113`
Preuve : l'enveloppe est réécrite avec `{...partie, donnees: {...}}` : `revision` et `ecritLe` identiques. Le tri de `listerParties` (`:159`, par `ecritLe`) ne bouge pas, et un conflit de révision n'est pas détecté si un autre onglet renomme en même temps.
Gravité : 3 · Correctif : passer par `ecrire(...)`. · Effort : S

#### B.34 B-core-20 : Le message d'achat d'une amélioration affiche toujours « CT Jackpot »
`src/core/casino.ts:88-91`
Preuve : `message: casino.messages.achat.replace('{nom}', casino.noms.ctJackpot)` pour tout article `type: 'upgrade'`. Le premier autre `upgrade` ajouté à `casino.json` annoncera le mauvais nom.
Gravité : 3 · Correctif : utiliser `article.name`. · Effort : S

#### B.35 B-core-21 : Le casino revend sans limite un Pokémon déjà possédé
`src/core/casino.ts:61-66`
Preuve : `raison` ne bloque que `upgrade && possede` ; un Abra à 250 jetons peut être racheté à l'infini (niveau 25 chaque fois). À confirmer : c'est peut-être voulu, mais l'écran affiche `possede` sans l'utiliser.
Gravité : 3 · Correctif : trancher la règle dans `docs/vision.md`, puis la coder ou retirer `possede` pour les Pokémon. · Effort : S

#### B.36 B-core-35 : `relacher` isolé ne contrôle pas le favori
`src/core/equipe.ts:45-54` (contre `:69`)
Preuve : seul `relacherLot` refuse un favori ; `relacher` supprime sans test. À confirmer selon l'appelant (`relacherPokemon` `:56` vérifie peut-être). Dépôt de pension (`pension.ts:27`) passe par `relacher`.
Gravité : 3 · Correctif : un seul garde-fou dans `relacher`, commun aux deux chemins. · Effort : S

#### B.37 B-core-36 : Le Jeton Shiny serait applicable à un œuf
`src/core/objets-equipe.ts:56-66`
Preuve : `utiliserJetonShiny` : pas de test `pokemon.oeuf` repéré (à confirmer par test ciblé) ; un œuf deviendrait chromatique avant éclosion.
Gravité : 3 · Correctif : refuser les œufs. · Effort : S

#### B.38 B-core-37 : `couplePonte` : l'espèce du parent sert de clé sans filtrer les œufs
`src/core/pension.ts:103-113`, `:152-161`
Preuve : conséquence de B-core-05 ; avec un Métamorph + un œuf, `numero = second.numero` donne un œuf de l'espèce de l'œuf. À fusionner avec B-core-05 si Nicolas préfère un seul ticket.
Gravité : 3 · Correctif : voir B-core-05. · Effort : S

#### B.39 B-core-38 : Un Pokémon de pension éclot avec une chance chromatique non bornée par 1
`src/core/pension.ts:163-166`
Preuve : `(0,0625 + 0,025 × parentsShiny) × bonus.x` : avec `x` = 2 (charme) le maximum est 0,225 aujourd'hui ; aucune borne `Math.min(1, ...)` si les réglages changent (x grand). Latent.
Gravité : 3 · Correctif : `Math.min(1, ...)`. · Effort : S

#### B.40 B-uia-02 : Message d'objet identique non ré-annoncé, minuteur non relancé
- `src/ui/EcranCombat.tsx:240-244, 259`
- Preuve : l'effet dépend de `[retour]`. Deux usages successifs qui produisent la même chaîne (`« Bonbon utilisé. »`) ne changent pas `retour` : le minuteur de `annonceMs` n'est pas réarmé, le message disparaît au bout du premier délai et le second usage n'est pas ré-annoncé.
- Gravité : 3
- Correctif : stocker `{ texte, id }` (compteur) dans l'état pour que chaque annonce redémarre le minuteur.
- Effort : S

#### B.41 B-uia-04 : Gain de casino masqué si le jeu est quitté pendant un tour
- `src/ui/MachineASous.tsx:31-41`, `src/ui/CarteAGratter.tsx:39`, `src/ui/PageCasino.tsx:49-56`
- Preuve : `occuper(gain)` cache le gain affiché (`cache` dans PageCasino). `occuper(null)` est appelé à la fin du tour. Si on change de jeu (`PageCasino.tsx:56`, `cacher(null)` est appelé lors du changement de vue) c'est remis à zéro, mais `nettoyage.current` du composant démonté n'annule pas forcément les minuteurs ; si le retour sur l'ancien jeu intervient avant la fin, `occuper(null)` d'un composant démonté peut revenir après coup et effacer l'état du nouveau jeu (à confirmer).
- Gravité : 3
- Correctif : annuler les minuteurs au démontage et ignorer `occuper` d'un composant démonté.
- Effort : S

#### B.42 B-uia-09 : Double déclenchement possible sur la carte (clic + fin de pointeur)
- `src/ui/CarteKanto.tsx:199-201, 291-292, 309`
- Preuve : sur PC, `onPointerUp={terminer}` appelle `choisirRepere(zoneTouchee.current)` et le halo/cercle a aussi `onClick={() => { if (!glissement.current) choisirRepere(f.zone); }}`. Un même geste peut déclencher les deux ; le second appel réécrit `origineFocus` avec `activeElement`. À confirmer dans un navigateur (capture de pointeur).
- Gravité : 3
- Correctif : n'ouvrir que depuis `onClick`, ou que depuis `terminer`.
- Effort : S

#### B.43 B-uia-12 : « Vol en cours vers undefined… » possible
- `src/ui/CarteKanto.tsx:397`
- Preuve : `carte.formes.find(f => f.zone === vol.cible)?.nom` renvoie `undefined` si la cible n'est pas dans `carte.formes` (zone supprimée, donnée de sauvegarde ancienne) ; le texte annoncé devient « Vol en cours vers … » avec « undefined » rendu en texte vide (React n'affiche pas `undefined`, donc phrase tronquée « Vol en cours vers … »). À confirmer.
- Gravité : 3
- Correctif : repli sur « la destination ».
- Effort : S

#### B.44 B-uia-25 : Bouton d'objectif et carte ennemie se chevauchent possiblement à 390 px
- `src/ui/ObjectifPermanent.tsx:36`
- Preuve : bouton `absolute top-4 right-4 max-w-1/2` (195 px à 390 px) alors que la carte ennemie occupe `w-3/5` en haut de la scène : 195 + 234 > 390. À confirmer par capture.
- Gravité : 3
- Correctif : vérifier la capture 390 px et réserver l'espace.
- Effort : S

#### B.45 B-uia-27 : Badge `cache` encore cliquable
- `src/ui/BoiteBadges.tsx:32`
- Preuve : le badge masqué n'est rendu qu'avec `opacity-0`, il reste focalisable et cliquable (ouvre le détail d'un badge non découvert, à confirmer).
- Gravité : 3
- Correctif : `disabled`/`tabIndex={-1}`/`aria-hidden`.
- Effort : S

#### B.46 B-uib-12 : Verrou `actif.current` du vol de Pokémon jamais relâché si `allerVers` lève
`src/ui/VolGen1.tsx:22-41`
Preuve : `lancer` pose `actif.current = true` sans `try/finally` ; une exception dans le chemin laisse le vol bloqué jusqu'au rechargement.
Gravité 3. Correctif : `try { … } finally { actif.current = false }`. Effort S.

#### B.47 B-uib-17 : « Pas assez d'argent. » affiché pour toute raison de non-achat
`src/ui/PageCentre.tsx:56`
Preuve : le message s'affiche si `!objet.abordable` ; `abordable` vaut `!possede && argent >= prix` (`store-boutique.ts:44`) : pour un objet déjà possédé, le texte est faux (à confirmer : dépend de la catégorie d'objets proposée au Centre).
Gravité 3. Correctif : distinguer « déjà possédé » et « pas assez d'argent ». Effort S.

#### B.48 B-uib-18 : Quantité non remise à 1 au changement de sélection
`src/ui/PageCentre.tsx` (état `nombre`)
Preuve : `nombre` n'est pas réinitialisé quand l'objet sélectionné change ; une quantité de 9 choisie pour un objet peut s'appliquer à un autre, plafonnée seulement par le maximum de l'objet (à confirmer).
Gravité 3. Correctif : `key={objet.id}` sur le sélecteur ou remise à 1 au changement. Effort S.

#### B.49 B-srv-14 : Risque d'écrasement sans conflit après suppression puis recréation d'une région (révision 1 réutilisée)
- `server/src/sauvegarde.ts:303-308`, `:479`
- Preuve : `restaurer` supprime les régions absentes de l'archive ; une région recréée repart à `revision = 1`. Un appareil qui avait mémorisé `serveur: 1` pour l'ancienne région et dont le verrou d'appareil a expiré (120 s) envoie `revisionBase: 1` : égal à la révision de la nouvelle ligne, donc accepté. À confirmer (chemin étroit).
- Gravité : 3
- Correctif : révision issue d'une séquence ou d'un identifiant de génération par ligne (« epoch »).
- Effort : M

#### B.50 B-srv-21 : Tout 4xx (hors 408/429) bloque la synchro jusqu'au rechargement du jeu
- `src/ui/synchro.ts:300`
- Preuve : un 401 (session expirée pendant la partie) ou 413 passe `statut = 'refuse'; bloque = true`. Le hook de session (`session-compte.ts:46`) traite le 401 séparément, mais la synchro ne repart que par `ouvrir()`. À confirmer dans l'interface.
- Gravité : 3
- Correctif : repasser en `hors-ligne` pour 401, redémarrer la synchro à la reconnexion.
- Effort : S

## 50 failles de sécurité à corriger

#### S.1 S-core-01 : Validation de région incomplète : une sauvegarde « valide » peut planter le chargement
`src/core/sauvegarde-validation.ts:136-179`
Preuve : `zoneId: chaine` (jamais comparé au monde), `etape: positif` (jamais comparé à `zone.etapes`, cf. `combat.ts:104`), `starterId: positif`, `regionId: identifiant`, `evenementEnCours.id`/`etape`/`file` (jamais comparés au catalogue) passent. Le plantage au chargement s'ajoute à B-core-02 (impossible de réécrire).
Gravité : 1 · Correctif : une validation sémantique après la validation de forme (zone existante, étape ≤ étapes, événement connu) avec repli sur la zone de départ. · Effort : M

#### S.2 S-core-02 : Aucun plafond numérique : `Infinity` et débordements atteignables
`src/core/sauvegarde-validation.ts:30-32`, `:54-56`, `:137-156`
Preuve : `nombre` accepte tout fini ≥ 0 (donc `1.7e308`), `entier` tout entier sûr. `argent: 1.7e308` + un gain → `Infinity`, `JSON.stringify(Infinity)` = `null`, et la validation refuse l'écriture suivante (`isFinite`). `niveau`, `xp`, `bonheur`, `calcium`, `jetons`, `diamants`, `revision`, `chronos.*` sans borne ; `revision + 1` perd sa précision après 2^53.
Gravité : 2 · Correctif : plafonds par champ (données : `niveauMax`, `calciumMax`, `bonheur.max`, plafond d'argent) dans les validateurs. · Effort : M

#### S.3 S-core-03 : Niveau, calcium et bonheur au-delà des maxima du jeu
`src/core/sauvegarde-validation.ts:54-55`, `src/core/stats.ts`
Preuve : `niveau: positif` sans `niveauMax`, `calcium: entier` sans `degats.calciumMax` (10), `bonheur: nombre` sans `bonheur.max` (255). Un `calcium: 1000000` multiplie le DPS sans limite (`stats.ts` formule sans plafond).
Gravité : 2 · Correctif : `niveau ≤ niveauMax`, `calcium ≤ calciumMax`, `bonheur ≤ max`. · Effort : S

#### S.4 S-core-04 : Identifiants (`uid`) dupliqués acceptés dans l'équipe, le PC et la pension
`src/core/sauvegarde-validation.ts:54`, `src/core/equipe.ts:48`, `:53`, `src/core/evolution.ts:69`
Preuve : `uid: identifiant` sans test d'unicité globale. `find` renvoie le premier exemplaire, `filter` (relâcher) et `map` (évolution) agissent sur tous : évoluer ou relâcher un doublon d'uid modifie ou supprime plusieurs Pokémon.
Gravité : 2 · Correctif : unicité d'`uid` sur `equipe ∪ pc ∪ pension` (et `pcGlobal`) à la validation. · Effort : S

#### S.5 S-core-05 : Listes sans borne ni dédoublonnage (déni de service local)
`src/core/sauvegarde-validation.ts:83-85`, `:137-141`
Preuve : `pokedexNational`, `vus`, `jalonsRecus`, `drapeaux`, `quetes`, `badges`, `bossVaincus`, `evenementsJoues`, `pc`, `pcGlobal` : tableaux de taille quelconque. Les accès `includes` (dex, relâchement, migrations `index.ts:52`) sont en O(n) à chaque tick ou chaque Pokémon.
Gravité : 2 · Correctif : longueur maximale par liste (≤ catalogues connus) et unicité. · Effort : M

#### S.6 S-core-06 : L'import n'a aucune limite de taille ni de coût
`src/core/sauvegarde.ts:183-209`
Preuve : `importerPartie(texte)` : `JSON.parse` sans limite, puis `validerEnveloppe` (migration par `structuredClone`) sur la partie et chaque région, puis `preparer` revalide tout : environ quatre passes. Un fichier de plusieurs dizaines de Mo gèle l'onglet.
Gravité : 2 · Correctif : taille maximale du texte, nombre maximal de régions et de Pokémon. · Effort : S

#### S.7 S-core-07 : Import et sauvegarde acceptent des régions que le jeu ne prévoit pas
`src/core/sauvegarde.ts:196-202`, `src/core/sauvegarde-validation.ts:83`, `data/monde.json`
Preuve : `regionsDebloquees: liste(identifiant)` et `regionCourante: identifiant` sans lien avec la liste des régions du jeu ; `monde.json` marque Johto… comme verrouillées. Une sauvegarde importée peut débloquer ou pointer vers une région inexistante. À confirmer côté interface.
Gravité : 2 · Correctif : valider contre le catalogue de régions. · Effort : S

#### S.8 S-uia-02 : Aucune CSP dans `index.html`
- `index.html:1-16` (pas de balise `Content-Security-Policy`) ; en-têtes du serveur de prod non lus (hors périmètre, à confirmer côté Coolify/Caddy)
- Preuve : Grep `Content-Security-Policy|script-src` sur `index.html`, `vite.config.*`, `public/` : aucun résultat. Sans CSP, une XSS dans une autre couche (ou une dépendance) n'est pas contenue.
- Gravité : 2
- Correctif : CSP en en-tête (`default-src 'self'; img-src 'self' data:; connect-src 'self' <api>`), vérifier la compatibilité avec le service worker de la PWA et `%NOM_JEU%`.
- Effort : M

#### S.9 S-uia-12 : Aucun ErrorBoundary : une exception de rendu détruit la partie affichée
- `src/ui/main.tsx` (aucun résultat de Grep pour `ErrorBoundary`)
- Preuve : tout `throw` pendant un rendu (cf. B-uia-07, `facteurEntier` qui lève si largeur ≤ 0, `Image.tsx`) démonte l'application. La sauvegarde en cours n'est pas perdue mais l'utilisateur voit un écran blanc sans message ni moyen de récupérer.
- Gravité : 2
- Correctif : ErrorBoundary racine avec message et bouton « Recharger ».
- Effort : M

#### S.10 S-uib-01 : Jeton Bearer stocké en clair dans `localStorage`
`src/ui/compte/session-compte.ts:12`
Preuve : `localStorage.setItem(CLE_SESSION, jeton)`. Tout script exécuté dans la page (une dépendance compromise, une future faille XSS) lit le jeton de session. Atténuant : aucun `innerHTML`, `eval` ni `dangerouslySetInnerHTML` dans `src/ui`.
Gravité 2. Correctif : cookie `HttpOnly; Secure; SameSite` posé par le serveur (better-auth le gère), ou jeton court + rafraîchissement. Effort L.

#### S.11 S-uib-02 : Déconnexion sans réessai : le jeton peut rester valide côté serveur
`src/ui/compte/session-compte.ts:77-83`
Preuve : `memoriser(null)` efface le jeton local, puis `deconnecter(ancien)` est tenté une fois ; en cas d'échec réseau, le jeton, volé ou copié, reste valide jusqu'à son expiration.
Gravité 2. Correctif : conserver le jeton à révoquer dans une file de révocation rejouée au prochain démarrage. Effort M.

#### S.12 S-uib-03 : Les parties locales ne sont pas rattachées au compte : possible mélange entre comptes sur un même appareil
`src/ui/persistance.ts`, `src/ui/compte/EcranCompte.tsx:112`
Preuve : le texte « ta partie sur cet appareil est conservée » après expiration ; les clés `pokiclicker:*` ne contiennent pas d'identifiant de compte (à confirmer : la gestion d'identité de la partie n'a pas été relue). Un second compte sur le même navigateur pourrait voir ou téléverser la partie du premier.
Gravité 2. Correctif : préfixer les clés par l'identifiant de compte, ou vider/archiver à la déconnexion. Effort M.

#### S.13 S-srv-01 : Inscription ouverte, sans vérification d'e-mail, avec un stockage par compte quasi illimité
- `server/src/app.ts:40`, `:45-48` ; `server/src/sauvegarde.ts:16-17`, `:53`, `:383`
- Preuve : `requireEmailVerification: false` ; limite d'inscription 5 par minute et par IP. Un compte peut stocker 20 parties × (1 + 20 régions) × 1 Mo, soit 420 Mo, plus jusqu'à 5 copies de rotation par objet : environ 2,5 Go par compte. Rien ne plafonne le total ni le nombre de comptes (une centaine d'IP suffisent à remplir un disque de 250 Go en quelques heures).
- Gravité : 2
- Correctif : plafond d'octets par compte (somme des `pg_column_size`), vérification d'e-mail avant la première écriture, quota global et alerte disque.
- Effort : M

#### S.14 S-srv-02 : `PUT /api/sauvegarde` : nombre de régions non borné avant la boucle SQL (amplification)
- `server/src/sauvegarde.ts:439-449` contre `:457` et `:231`
- Preuve : l'enveloppe de région minimale pèse environ 170 octets ; un corps de 3 Mo en contient une quinzaine de milliers. La boucle exécute un `SELECT … FOR UPDATE` par entrée avant que le plafond de 20 régions ne soit contrôlé (L457). Une seule requête monopolise une connexion et le verrou de la partie ; 60 requêtes par minute sont permises. La route `archives` borne tôt (L231), pas le PUT.
- Gravité : 2
- Correctif : `regions.length > MAX_REGIONS` dans `valider`, avant toute requête SQL.
- Effort : S

#### S.15 S-srv-03 : Énumération de comptes à l'inscription
- `server/src/app.ts:76-83` ; `src/ui/compte/api-compte.ts:5`
- Preuve : la réécriture remplace `message` mais conserve `code`. Un doublon répond 422 avec `USER_ALREADY_EXISTS`, un compte neuf 200 : n'importe qui teste si une adresse a un compte. Le client affiche « Ce compte existe déjà. Connecte-toi. ». La réinitialisation et la connexion sont, elles, uniformes.
- Gravité : 2
- Correctif : répondre pareil dans les deux cas (réponse neutre + e-mail « compte existant » / « bienvenue »), ou assumer le choix et supprimer le commentaire de test.
- Effort : M

#### S.16 S-srv-04 : `TRUSTED_PROXIES` vide en production n'est ni refusé ni signalé
- `server/src/config.ts:40` ; `README.md:28`, `:48`
- Preuve : sans valeur, Better Auth lit `X-Forwarded-For` tel quel (valeur de gauche forgeable, donc limite contournable avec un en-tête aléatoire, une ligne de `rateLimit` créée par valeur) ou, si aucune adresse n'est reconnue, utilise un compteur partagé par route : 5 connexions par minute pour tous les joueurs. Le README demande de le « vérifier avant ouverture publique » mais le code ne l'exige pas.
- Gravité : 2
- Correctif : exiger `TRUSTED_PROXIES` en production (ou un drapeau explicite `TRUSTED_PROXIES=none`) ; journaliser un avertissement au démarrage.
- Effort : S

#### S.17 S-srv-05 : Pas de limite par adresse e-mail pour la réinitialisation : bombardement d'un tiers et épuisement du quota SMTP
- `server/src/app.ts:45-48`
- Preuve : seule règle : 5 par fenêtre et par IP pour `/request-password-reset`. Un attaquant avec plusieurs IP peut envoyer des centaines de courriels à une même adresse (aucune vérification que l'appelant possède l'adresse) et consommer le quota d'envoi du fournisseur (Resend) : les vraies réinitialisations échouent alors.
- Gravité : 2
- Correctif : limite par destinataire (par exemple 3 par heure) en plus de la limite par IP ; ne rien envoyer si un lien valide existe déjà.
- Effort : M

#### S.18 S-srv-07 : Aucune route de suppression ni d'export de compte (droit à l'effacement)
- `server/src/app.ts:39-48` (pas de `user.deleteUser`) ; liste des routes `server/src/sauvegarde.ts`
- Preuve : e-mail et parties sont stockés ; ni l'utilisateur ni le serveur n'ont de route pour effacer le compte (les `ON DELETE CASCADE` de `schema.ts` existent mais rien ne les déclenche). À confirmer côté produit : le jeu s'adresse à des amis, mais les comptes sont publics sur `pokiclicker.fr`.
- Gravité : 2
- Correctif : activer `deleteUser` avec confirmation par mot de passe ; route d'export JSON.
- Effort : M

#### S.19 S-core-12 : `evenementEnCours` contourne `eligible` et `evenementsJoues`
`src/core/sauvegarde-validation.ts:165-167`, `src/core/evenements.ts`
Preuve : l'état en cours (`id`, `etape`, `file`) est validé en forme seulement ; éditer `evenementEnCours` pour un événement « donner » (récompense) le déclenche sans passer par la condition d'éligibilité ni le drapeau « déjà joué ». À confirmer.
Gravité : 3 · Correctif : refuser un événement inconnu, déjà joué ou inéligible au chargement. · Effort : M

#### S.20 S-core-15 : Chaînes sans longueur maximale ; `creerPartie` n'applique pas la limite de `renommerPartie`
`src/core/sauvegarde.ts:108` contre `:142-144` ; `src/core/sauvegarde-validation.ts:23-28`, `:83`
Preuve : `renommerPartie` borne le nom à 1-100 caractères ; `creerPartie(nom)` et la validation (`nom: chaine`) acceptent la chaîne vide et des longueurs libres. `identifiant` n'a pas de longueur maximale non plus (uid, ids de région).
Gravité : 3 · Correctif : `chaineBornee(min, max)` commune. · Effort : S

#### S.21 S-core-28 : Erreurs de stockage non gérées dans le cœur
`src/core/sauvegarde.ts:81`, `:111`, `:135-137`
Preuve : `stockage.ecrire` peut lever (quota plein, navigation privée) ; l'exception remonte sans état de repli, et l'état en mémoire peut avancer devant le disque. À confirmer côté interface.
Gravité : 3 · Correctif : renvoyer un résultat d'écriture que l'interface signale. · Effort : M

#### S.22 S-core-31 : Un `evenementEnCours.etape`/`file` hors catalogue peut planter la lecture de la commande
`src/core/sauvegarde-validation.ts:165-167`, `src/core/evenements.ts` (`commandeCourante`)
Preuve : `etape` entier ≥ 0 sans borne, `file` d'identifiants libres. À confirmer : `commandeCourante` renvoie-t-elle `undefined` ou lève-t-elle ?
Gravité : 3 · Correctif : vérifier au chargement (cf. S-core-01). · Effort : S

#### S.23 S-core-34 : Messages d'erreur de validation renvoyés tels quels à l'utilisateur
`src/core/sauvegarde.ts:51-54`
Preuve : `erreurSure` reprend `erreur.message` interne (« Champ inconnu », « Sexe incompatible avec l'espèce »…) dans « Cette sauvegarde est illisible : … ». Aucun secret, mais le texte dévoile la structure de validation.
Gravité : 3 · Correctif : code d'erreur + libellé de l'interface. · Effort : S

#### S.24 S-uia-01 : Jeton magique lu dans l'URL, retiré après coup seulement
- `src/ui/App.tsx:280-290`
- Preuve : `parametres.get('token')` lu à l'initialisation, `history.replaceState` après le premier rendu. Entre le chargement et l'effet, le jeton peut partir dans l'en-tête `Referer` d'une ressource tierce (aucune n'est chargée aujourd'hui) et reste dans l'historique de navigation d'avant remplacement (la page d'arrivée est enregistrée avec la requête).
- Gravité : 3
- Correctif : lire et retirer le jeton avant le premier rendu (script inline ou `main.tsx`), jeton à usage unique et court côté serveur.
- Effort : S

#### S.25 S-uia-03 : `?debug=carte` actif en production
- `src/ui/CarteKanto.tsx:62`
- Preuve : `new URLSearchParams(window.location.search).get('debug') === 'carte'` sans garde `import.meta.env.DEV` (contrairement à `Coquille.tsx:48` pour `?onglet=carte`). Il suffit d'ajouter le paramètre pour révéler les zones (noms de zones verrouillées, spoil du contenu).
- Gravité : 3
- Correctif : `import.meta.env.DEV &&`.
- Effort : S

#### S.26 S-uia-04 : Détails d'erreur internes affichés à l'écran
- `src/ui/EcranCombat.tsx:377`
- Preuve : le message d'erreur est affiché après un `\n` (partie « détail » de l'erreur remontée). Si ce détail vient de la couche synchro/serveur, il peut contenir un chemin, un identifiant ou un code interne (à confirmer sur les erreurs réelles).
- Gravité : 3
- Correctif : message utilisateur fixe ; détails dans la console.
- Effort : S

#### S.27 S-uia-10 : Chemins d'assets construits depuis des surnoms sans liste blanche
- `src/ui/easter-eggs.ts:11-17`, `src/ui/affichage-pokemon.ts`
- Preuve : `photosDe(pokemon.surnom)` renvoie une URL d'image d'après le surnom saisi par le joueur. La liste vient de `core/easter-eggs` (table fixe, pas d'injection de chemin tant que `photosDe` fait une recherche exacte — à confirmer dans le core, hors périmètre).
- Gravité : 3
- Effort : S

#### S.28 S-uib-05 : Porte dérobée de développement active en production
`src/ui/store.ts:1425,1429`
Preuve : `equipeDeDeveloppement()` lit `localStorage.getItem('pokiclicker-dev:equipe-de-depart')` et `armementTutoAutorise` lit `'pokiclicker-dev:tuto'`, sans garde `import.meta.env.DEV`. Un joueur pose la clé et démarre une partie avec l'équipe de départ de développement, synchronisée ensuite sur le serveur.
Gravité 3. Correctif : garde `import.meta.env.DEV || MODE === 'test'`. Effort S.

#### S.29 S-uib-07 : Partie locale de l'e-mail envoyée comme `name`
`src/ui/compte/api-compte.ts:40`
Preuve : `name: email.split('@')[0]` ; données personnelles envoyées comme nom d'affichage, potentiellement visibles ailleurs (classement, partage).
Gravité 3. Correctif : nom neutre généré ou champ saisi par l'utilisateur. Effort S.

#### S.30 S-uib-08 : URL de l'API construite sans contrôle de `VITE_API_URL`
`src/ui/compte/api-compte.ts:16`
Preuve : `${import.meta.env.VITE_API_URL?.replace(/\/$/, '')}/api/auth/…` produit `undefined/api/auth/…` si la variable est absente (appelé seulement quand elle est définie, `App.tsx:303`, mais rien ne l'impose dans ce module).
Gravité 3. Correctif : une constante validée au chargement, erreur claire sinon. Effort S.

#### S.31 S-uib-10 : Message d'erreur technique affiché tel quel à l'utilisateur
`src/ui/persistance.ts:13-21`
Preuve : `detailErreur` renvoie `${erreur.name}: ${erreur.message}` et appelle `console.error(erreur)` ; un message de navigateur (quota, chemin interne) s'affiche dans l'interface.
Gravité 3. Correctif : message de jeu en français, détail technique dans la console seulement. Effort S.

#### S.32 S-uib-11 : Aucune borne de longueur sur e-mail et mot de passe côté client
`src/ui/compte/EcranCompte.tsx:113-118`
Preuve : pas de `maxLength` sur les champs `email` et `motDePasse` (contrairement à `EcranParties.tsx:97,118`, `maxLength={100}`) ; un mot de passe de plusieurs Mo part au serveur (le hachage coûteux est une charge possible). La borne réelle est côté serveur (à confirmer).
Gravité 3. Correctif : `maxLength` raisonnable (254 / 128) et contrôle côté serveur. Effort S.

#### S.33 S-uib-13 : Toute erreur de validation de session autre que 401 laisse la session « valide »
`src/ui/compte/session-compte.ts:46-47`
Preuve : seul le 401 invalide ; 403, 429, 500 appellent `fixerValide(true)`. Voulu pour le hors-ligne, mais un 403 (compte suspendu) laisse jouer et synchroniser.
Gravité 3. Correctif : traiter 403 comme 401. Effort S.

#### S.34 S-srv-08 : `bearer()` sans `requireSignature`
- `server/src/app.ts:44`
- Preuve : dans Better Auth 1.7.16, `requireSignature` vaut faux par défaut (`plugins/bearer/index.mjs:36`) : un jeton brut (valeur de la table `session`) est accepté sans connaître le secret. Une fuite de la base (copie de sauvegarde, accès SQL) donne alors des sessions utilisables.
- Gravité : 3
- Correctif : `bearer({ requireSignature: true })` ; le client envoie déjà le jeton signé reçu dans `set-auth-token` (à confirmer par un test).
- Effort : S

#### S.35 S-srv-09 : Surface `/api/auth/*` non réduite
- `server/src/app.ts:74`, `README.md:24`
- Preuve : le serveur transmet tout à Better Auth (`update-user`, `change-email`, `change-password`, `list-sessions`, `revoke-session`, etc.) alors que le jeu n'utilise que six routes. Chaque route inutile est une surface de plus, sans la limite de débit spécifique (seules trois routes ont une règle).
- Gravité : 3
- Correctif : liste blanche des six routes utilisées (404 pour le reste) ou désactivation par options.
- Effort : S

#### S.36 S-srv-10 : Pas de révocation des autres sessions au changement de mot de passe, session de 7 jours
- `server/src/app.ts:39-43`
- Preuve : `revokeSessionsOnPasswordReset: true` ne couvre que la réinitialisation par lien. `change-password` (exposé, voir S-srv-09) ne révoque les autres sessions que si le client le demande. Aucune interface ne liste les appareils connectés. À confirmer dans le code client.
- Gravité : 3
- Correctif : option serveur forçant la révocation ; liste « mes appareils » + révocation.
- Effort : M

#### S.37 S-srv-12 : SMTP en clair accepté en production ; STARTTLS non exigé
- `server/src/config.ts:30` ; `server/src/app.ts:15-17`
- Preuve : `SMTP_URL` accepte `smtp:` (sans TLS) en production ; pour `SMTP_HOST`, seul le port 465 active `secure`, le port 587 négocie STARTTLS opportuniste (pas de `requireTLS`) : un attaquant réseau peut forcer le texte clair et lire le lien de réinitialisation et les identifiants.
- Gravité : 3
- Correctif : refuser `smtp:` en production, `requireTLS: true`, `tls.rejectUnauthorized` par défaut.
- Effort : S

#### S.38 S-srv-13 : Secrets factices acceptés en production
- `server/.env.example:4`, `server/docker-compose.yml:22`, `server/src/config.ts:8-9`
- Preuve : les deux valeurs d'exemple (valeurs masquées ici) dépassent 32 caractères ; `readConfig` n'impose que la longueur. Un copier-coller de `.env.example` en production donne un secret public : toutes les sessions Better Auth deviennent forgeables.
- Gravité : 3
- Correctif : refuser en production les valeurs de la liste connue et celles qui contiennent « factice »/« exemple » ; imposer 43 caractères base64 aléatoires.
- Effort : S

#### S.39 S-srv-15 : Pas de contrôle d'origine ni de type de contenu sur `/api/sauvegarde` alors que le cookie de session est accepté
- `server/src/sauvegarde.ts:87`, `server/src/app.ts:59-61`
- Preuve : `getSession({ headers })` lit aussi le cookie de session Better Auth ; `c.req.json()` ignore `Content-Type`. Le client n'utilise que Bearer et `credentials: 'omit'`, mais un navigateur qui possède aussi le cookie (inscription directe sur l'API) l'enverrait sur une requête same-site. Le risque dépend de l'attribut SameSite du cookie (défaut Lax, à confirmer).
- Gravité : 3
- Correctif : n'accepter que `Authorization: Bearer` sur `/api/sauvegarde` et exiger `application/json`.
- Effort : S

#### S.40 S-srv-16 : Création de partie : l'identifiant d'un autre compte renvoie 404, un identifiant libre 200
- `server/src/sauvegarde.ts:418-423`
- Preuve : `SELECT * FROM parties WHERE id = $1 FOR UPDATE` sans filtre de compte : l'existence d'un UUID chez un autre compte est visible (404 « Partie introuvable » contre création) et la ligne étrangère est verrouillée. UUID aléatoire, donc non exploitable en pratique sans fuite de l'identifiant.
- Gravité : 3
- Correctif : filtrer par `compte_id` dans le verrou et gérer le conflit d'insertion par un 409 neutre.
- Effort : S

#### S.41 S-srv-17 : Images non épinglées et installation avec scripts dans l'étape de build
- `server/Dockerfile:1`, `:4`, `:9` ; `server/docker-compose.yml:3`
- Preuve : `node:22-slim` et `postgres:18` sans digest ; `RUN npm ci` de l'étape de build exécute les scripts d'installation de toutes les dépendances de dev (le runtime utilise bien `--ignore-scripts`, L13).
- Gravité : 3
- Correctif : digest SHA256 des images, `npm ci --ignore-scripts` aussi au build, scan d'image (Trivy) en CI.
- Effort : S

#### S.42 S-srv-18 : Conteneur non durci
- `server/docker-compose.yml:17-26`, `server/Dockerfile:15-16`
- Preuve : pas de `read_only`, `cap_drop: [ALL]`, `security_opt: no-new-privileges`, limites mémoire/CPU ni `restart` dans le compose ; Postgres publie 5432 sur 127.0.0.1 avec un mot de passe constant (L7-9, local uniquement). L'utilisateur `node` est bien utilisé en production.
- Gravité : 3
- Correctif : durcissement du compose et des paramètres Coolify.
- Effort : S

#### S.43 S-srv-19 : Pas de TLS configuré vers Postgres
- `server/src/index.ts:7`, `server/src/migrate.ts:8`, `README.md:45`
- Preuve : `new Pool({ connectionString })` sans option `ssl` ; rien dans la validation de `DATABASE_URL` n'exige `sslmode=require`. Acceptable si la base est sur le réseau privé de Coolify, comme l'indique le README ; à confirmer.
- Gravité : 3
- Correctif : exiger `sslmode` en production quand l'hôte n'est pas un nom interne.
- Effort : S

#### S.44 S-srv-20 : Un seul rôle SQL pour migrer et servir
- `server/Dockerfile:18`, `server/src/migrate.ts`
- Preuve : le même `DATABASE_URL` sert aux migrations (DDL) et à l'API : une injection ou une faille d'exécution a les droits `CREATE/DROP`. Les requêtes actuelles sont paramétrées ; c'est de la défense en profondeur.
- Gravité : 3
- Correctif : deux rôles (propriétaire des tables, rôle applicatif DML seul).
- Effort : M

#### S.45 S-srv-21 : Pas de Dependabot, d'audit npm en CI, ni de `permissions:` dans les workflows ; actions épinglées par étiquette
- `.github/workflows/ci.yml`, `.github/workflows/e2e-nuit.yml`
- Preuve : aucun `dependabot.yml`, aucun `npm audit`, actions en `@v4` (étiquette modifiable), pas de bloc `permissions:` (le jeton reçoit les droits par défaut du dépôt). Audit local du 19/11 : 0 vulnérabilité en production.
- Gravité : 3
- Correctif : `dependabot.yml` (npm + actions), `permissions: contents: read`, SHA complets des actions, `npm audit --omit=dev --audit-level=high` en CI.
- Effort : S

#### S.46 S-srv-22 : Journalisation insuffisante pour détecter une attaque, et PII possible dans les messages d'erreur SMTP
- `server/src/app.ts:28`, `:34`, `:67`
- Preuve : le niveau Better Auth est `warn` ; aucun événement d'authentification (échec de connexion, réinitialisation demandée/consommée, 429) n'est journalisé de façon structurée. `onError` n'écrit que le message, sans identifiant de requête ni route. Le message d'erreur nodemailer peut contenir l'adresse du destinataire (L28). Le README (L26) annonce « journaux Better Auth désactivés » : écart avec le code.
- Gravité : 3
- Correctif : journal JSON avec identifiant de requête, événements d'auth (sans e-mail en clair : empreinte), alerte sur pics de 401/429.
- Effort : M

#### S.47 S-srv-23 : Champs `name`/`image` d'inscription non bornés (jusqu'à 100 Ko)
- `server/src/app.ts:62`, `:50` (corps limité à 100 Ko ; Better Auth ne limite pas `name`)
- Preuve : un compte peut stocker 100 Ko de texte dans `user.name`. À confirmer dans la version installée.
- Gravité : 3
- Correctif : valider `name` (≤ 50 caractères) et `image` côté serveur (hook `before`).
- Effort : S

#### S.48 S-srv-24 : Racine : `.env` non ignoré par git
- `.gitignore` (aucune ligne `.env*` pour la racine ; seul `server/.env*` est ignoré, L21-22)
- Preuve : `.env.example` racine (`VITE_API_URL`) existe ; un `.env` ou `.env.local` créé à la racine serait proposé au commit.
- Gravité : 3
- Correctif : `.env`, `.env.*`, `!.env.example` et `*.log` dans `.gitignore`.
- Effort : S

#### S.49 S-srv-25 : `debug.log` versionné
- `debug.log:1` (trois commits l'ont touché : `25892cb`, `147ba2e`, `dd512b4`)
- Preuve : journal Chrome local (message audio), sans secret. Signale surtout l'absence de règle d'ignorance (S-srv-24).
- Gravité : 3
- Correctif : `git rm --cached debug.log`, règle `*.log`.
- Effort : S

#### S.50 S-srv-27 : API : CSP et en-têtes d'isolement absents ; HSTS sans `includeSubDomains`
- `server/src/app.ts:51-58`
- Preuve : seuls `nosniff`, `no-referrer`, `DENY` et HSTS (production) sont posés. Les réponses sont du JSON, donc l'impact est faible ; mais `/api/auth/error` et les redirections peuvent rendre du HTML.
- Gravité : 3
- Correctif : `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Cross-Origin-Resource-Policy: same-site`, `Permissions-Policy`, `includeSubDomains`.
- Effort : S

## 50 points de qualité du code (doublons, architecture, évolutivité)

#### Q.1 Q-srv-01 : Le serveur n'est pas dans la CI : ni typecheck, ni tests, ni build
- `.github/workflows/ci.yml` ; `package.json:14`, `:16`, `:24` ; `vite.config.ts:63` ; `server/README.md:71-73`
- Preuve : le job racine lance `typecheck` (tsconfig app/node/e2e), `lint`, `test` (include `src/**`, `tests/**`) et `build` (front). `server/tests/**` n'est jamais exécuté, ni le typecheck, ni le build, ni le Dockerfile. Le README dit « CI à ajouter ». Toute l'authentification et la synchronisation (≈ 2 000 lignes dont 4 000 de tests) ne sont protégées que par l'exécution locale.
- Gravité : 1
- Correctif : job `server` (Node 22, service Postgres 18, `npm ci`, typecheck, tests, build, build Docker) ; `npm audit`.
- Effort : M

#### Q.2 Q-core-01 : `validerForme` existe en deux variantes divergentes
`src/core/casino.ts:18-32`, `src/core/jeux-casino.ts:15-48`
Preuve : le même nom et le même rôle (valider un JSON contre un modèle) ; la variante du casino accepte les flottants, celle des jeux exige des entiers sûrs.
Gravité : 2 · Correctif : un module `validation-donnees.ts` partagé. · Effort : S

#### Q.3 Q-core-02 : Validateurs primitifs recopiés dans cinq modules
`src/core/sauvegarde-validation.ts:30-33`, `src/core/evenements.ts:195-200`, `src/core/objectifs.ts:17-27`, `src/core/tutoriels.ts:16`, `src/core/scenes.ts:37-74`
Preuve : `entier`/`positif`/`booleen`/`objet`/`texte`/`fraction`/`ratio` réécrits avec des messages différents. Un correctif (plafond, bornes) doit être répété.
Gravité : 2 · Correctif : bibliothèque de validation unique du cœur. · Effort : M

#### Q.4 Q-core-03 : Constantes de règles dupliquées entre code et données
`src/core/pokedex.ts:28`, `src/core/easter-eggs.ts:41`, `src/core/defi-chen.ts:20`, `:28`, `:45`, `src/core/pension.ts:134` (151) ; `src/core/objets-equipe.ts:74`, `:85`, `src/core/defi-chen.ts:20` (100) ; `src/core/ligue.ts:37`, `src/core/combat-evenement.ts:9` (starters 1/4/7) ; `src/core/ligue.ts:18`, `:21`, `:94`, `src/core/defi-chen.ts:53` (10 combats, 9 adversaires, étape 5)
Preuve : `reglages.pension.especesTirees` (151) et `recompenses.niveauMax` (100) existent déjà.
Gravité : 2 · Correctif : tout lire des réglages ou du catalogue ; test qui interdit les nombres magiques. · Effort : M

#### Q.5 Q-core-04 : Clés d'objets en dur dans le code
`src/core/objets-equipe.ts:28`, `:36`, `:50`, `:58-66` (`everstone`, `shinyToken`), `src/core/objets-actifs.ts:41-49` (`pokeDoll`), `src/core/progression.ts:77` (`omniExp`), `src/core/objets-equipe.ts:102` (`+${2 * n} %` contre `degats.calciumParBoost`)
Preuve : ajouter ou renommer un objet exige de modifier le code ; texte « +2 % » indépendant de la donnée (0,02).
Gravité : 2 · Correctif : table `effet` dans `objets.json`, lue par un seul moteur d'objets. · Effort : M

#### Q.6 Q-core-05 : Singleton `kanto` et `'kanto'` en dur : le cœur ne gère pas plusieurs régions
`src/core/regions.ts`, `src/core/sauvegarde.ts:17`, `:145`, `src/core/pension.ts:170`, `src/core/statistiques.ts:23`, `src/core/ligue.ts`, `src/core/pc.ts`
Preuve : `accesPension(kanto, ...)`, `regionInitiale('kanto', ...)`, `regionCourante: 'kanto'`. `docs/vision.md:31` demande une aventure et une équipe par région, jusqu'à Paldea.
Gravité : 2 · Correctif : passer `regionId`/`monde` en paramètre, tester avec une région factice. · Effort : L

#### Q.7 Q-core-06 : Le cœur « pur » dépend de Vite (`import.meta.glob`)
`src/core/evenements-kanto.ts:38`
Preuve : le chargement des cinq fichiers d'événements est codé en dur et utilise `import.meta.glob`, contre « Cœur de jeu en TypeScript pur » (`CLAUDE.md`). Une région ajoutée exige de modifier ce fichier, qui porte aussi une migration ad hoc (`normaliserRonflex`, ids en dur).
Gravité : 2 · Correctif : charger la liste de fichiers par région depuis une donnée injectée à la couture. · Effort : M

#### Q.8 Q-core-07 : Réglages : validation partielle et cast direct
`src/core/reglages.ts` (types et fin de fichier)
Preuve : 247 lignes de types écrits à la main et `donnees as typeof reglages` ; seules quelques sections sont validées. Une faute de frappe dans `reglages.json` n'est pas détectée (cf. S-core-24).
Gravité : 2 · Correctif : générer types et validation depuis un schéma (comme `data/schemas/zone.schema.json`). · Effort : L

#### Q.9 Q-core-08 : Protocole de clés d'effets implicite (`badge:x`, `jalon:n`, `objet:y`)
`src/core/progression.ts:72-79`, `data/reglages.json:141`, `:162-185`, `:193-209`
Preuve : les JSON référencent des chaînes (`"jalon:151"`, `"badge:marais"`) fabriquées par concaténation dans `actifsDe` ; une clé inconnue n'applique rien et ne lève rien (B-core-24).
Gravité : 2 · Correctif : valider chaque `cle` de réglages contre les sources possibles (badges, jalons, objets). · Effort : M

#### Q.10 Q-uia-01 : Motif de dialogue modal copié dans ~14 composants
- `ActionsCombat`, `BadgesTelephone`, `BoiteBadges`, `CarteKanto`, `Credits`, `DialogueScene`, `Diplome`, `FenetreEclosion`, `FenetreEvolution`, `FenetreRadar`, `FenetreRaccourcis`, `FenetreSac`, `FichePokemon` (3×), `ObjectifPermanent`, `ObtentionBadge` (`showModal(` : 29 occurrences dans 25 fichiers de `src/ui`)
- Preuve : même séquence recopiée : `ref` + `showModal()` + `onCancel={e => { e.preventDefault(); fermer(); }}` + `onClose` qui ramène le focus. Les divergences (B-uia-14, B-uia-15) viennent de là.
- Gravité : 2
- Correctif : hook `useDialogueModal()` ou composant `<Fenetre>` unique.
- Effort : M

#### Q.11 Q-uia-03 : `EcranCombat.tsx` géant
- `src/ui/EcranCombat.tsx` (≈ 380 lignes, 5 composants)
- Preuve : le composant `Equipe` appelle ~25 `useStore`, mélange sélection d'objet, fiche, annonces et mise en page ; `ActionsTelephone` est utilisé aussi sur PC (nom trompeur) ; l'état de la fiche est dupliqué entre `Equipe` et `CombatPC`.
- Gravité : 2
- Correctif : un fichier par composant, un hook `useObjetEnMain`.
- Effort : L

#### Q.12 Q-uia-04 : `PartieConnectee` : ≈ 250 lignes, 12 états
- `src/ui/App.tsx`
- Preuve : phases de vérification / création / reprise / suppression / déconnexion toutes dans un seul composant, avec `jeuDejaMonte` variable de module (l.65) et `jouer()` qui ne met pas `jeuArrete.current` à jour.
- Gravité : 2
- Correctif : machine d'états (reducer) + sous-composants par écran.
- Effort : L

#### Q.13 Q-uia-05 : Logique métier dans l'UI : `appliquer` un objet
- `src/ui/EcranCombat.tsx:253-263`
- Preuve : le choix de l'action selon le type d'objet (`stase`/`pierre`/`jeton`/`utiliserObjet`) et la règle « répétable » (bonbon, calcium, baie) sont codés dans le composant, ce qui a produit B-uia-01.
- Gravité : 2
- Correctif : `store.appliquerObjet(objet, uid)` dans `src/core`, qui renvoie le stock restant.
- Effort : M

#### Q.14 Q-uia-06 : Identifiants de lieux et noms de zones en dur
- `src/ui/Coquille.tsx:99-105` (`'kanto.route-de-ronflex'`), `src/ui/EcranCombat.tsx:54` (`sousTitres` : `'kanto.route-1': 'Jadielle'`), `src/ui/CarteKanto.tsx` (« Céladopole »)
- Preuve : noms de lieux dans le code alors que `CLAUDE.md` impose les données de contenu en JSON dans `data/`.
- Gravité : 2
- Correctif : déplacer dans `data/regions/kanto/*.json`.
- Effort : M

#### Q.15 Q-uia-08 : Chemins d'assets `img/...` en dur
- `FenetreEclosion.tsx:46-48`, `CollectionEclosions.tsx:34`, `ChoixStarter`, `DialogueIntro.tsx:44`, `casino-interface.tsx:30`, `EcranCombat.tsx:177`, `easter-eggs.ts:12`
- Preuve : chemins relatifs construits à la main, alors que `cheminSprite` (`precharger.ts`) et `import.meta.env.BASE_URL` (utilisé dans `Diplome.tsx:37`) existent. Un changement de `base` casse silencieusement ces images.
- Gravité : 2
- Correctif : une fonction `cheminImage(chemin)` unique.
- Effort : M

#### Q.16 Q-uia-13 : `CarteKanto.tsx` : fichier trop long et mélangeant geste, rendu, a11y
- `src/ui/CarteKanto.tsx` (≈ 400 lignes)
- Preuve : pointeurs, zoom, fiche, vol, Célodopole et debug dans un composant.
- Gravité : 2
- Correctif : extraire `useGestesCarte`, `FicheZone`, `AccesDirects`.
- Effort : L

#### Q.17 Q-uib-01 : `store.ts` : 1424 lignes, toutes les responsabilités dans un objet d'actions unique
`src/ui/store.ts` (L.253-1430)
Preuve : boucle, persistance, événements, casino, pension, tuto, journal, évolution, sons, synchronisation, démarrage (`demarrer`, L.1287-1369) dans une fonction `creerStoreJeu`. Les `store-*.ts` existent mais ne portent que des fonctions d'affichage.
Gravité 2. Correctif : découper en tranches (zustand `slices`) par domaine, `demarrer` dans un module. Effort L.

#### Q.18 Q-uib-02 : Mémoïsation par `JSON.stringify`, ~12 sérialisations par tick
`src/ui/store.ts:253,614-655` ; `store-boutique.ts:46,64` ; `store-casino.ts:73` ; `store-capture.ts:28`
Preuve : `JSON.stringify(actifs) !== JSON.stringify(coeur.actifs)` à chaque tick ; `afficher()` compare 12 sous-états de la même façon ; le coût croît avec les objets et le Pokédex.
Gravité 2. Correctif : comparaison structurelle ciblée ou version de révision par sous-état. Effort M.

#### Q.19 Q-uib-03 : Ajouter un objet utilisable impose d'éditer une chaîne de ternaires
`src/ui/store-boutique.ts:59-62`
Preuve : `objet.inventaire === 'bonbon' ... : 'pomegBerry' ? 'baie' : 'everstone' ? 'stase' : 'shinyToken' ? 'jeton' : direct.includes(...)` ; le mode d'utilisation d'un objet est codé en dur dans l'UI plutôt que dans `data/`.
Gravité 2. Correctif : champ `utilisable` dans le JSON des objets, lu par le cœur. Effort M.

#### Q.20 Q-uib-04 : `store-capture.ts` décide par comparaison de textes d'erreur
`src/ui/store-capture.ts:19,26`
Preuve : `transitoires = ['Aucun Pokémon à capturer.', 'Une capture est déjà en cours.']` et `transitoires.includes(condition.raison ?? '')` : reformuler un message du cœur change le comportement de l'affichage.
Gravité 2. Correctif : un code de raison (`'aucun-ennemi' | 'capture-en-cours'`) renvoyé par `verifierLancer`. Effort S.

#### Q.21 Q-uib-05 : Erreurs avalées en silence dans la synchro et le store
`src/ui/store.ts:277-280` ; `src/ui/synchro.ts:302`
Preuve : `try { abonne(fermeture); } catch { /* la synchro ne doit jamais gêner le jeu */ }` et `catch { if (!arrete) statut = 'hors-ligne'; }` : toute exception (bug de code compris) devient « hors ligne » sans trace, ce qui masque les régressions.
Gravité 2. Correctif : journaliser au moins en développement et séparer erreur réseau / erreur de code. Effort S.

#### Q.22 Q-uib-08 : Mini-jeux du casino : même squelette dans quatre fichiers
`Roulette.tsx`, `PileOuFace.tsx`, `PlusOuMoins.tsx`, `TableBlackjack.tsx` ; `PageCasino.tsx`
Preuve : `lancer` / `terminer` / `actif` / `delais` / `usePluie` recopiés ; chaque nouveau jeu en ajouterait une copie ; `actions = store.getState()` repris dans chaque composant (`PageCasino.tsx:45`).
Gravité 2. Correctif : hook `useTourDeJeu` (verrou, minuteurs, gain différé). Effort M.

#### Q.23 Q-uib-09 : `Pokedex.tsx` et `PokedexTelephone.tsx` dupliquent filtre et fiche
`src/ui/Pokedex.tsx`, `src/ui/PokedexTelephone.tsx`
Preuve : `normaliser`, filtre et `Fiche` / `DetailEspece` presque identiques ; correctif d'un côté oublié de l'autre ; grille de 151 cases non virtualisée.
Gravité 2. Correctif : composants et hook de filtre partagés, deux habillages. Effort M.

#### Q.24 Q-uib-10 : Deux arbres de rendu pilotés par JavaScript (`useTelephone`) au lieu du CSS
`PagePC.tsx` (`telephone ? … : …` partout, L.217,257,298-418) ; `compte/EcranCompte.tsx:54,103-106` (`const Formulaire = telephone ? Fragment : 'div'`)
Preuve : `useTelephone` = `(max-width: 1023px)` ; classes `lg:` de Tailwind ET condition JS pour la même frontière : deux sources de vérité ; le premier rendu avant la mesure peut afficher la mauvaise disposition.
Gravité 2. Correctif : un seul rendu, différences en CSS (`lg:`) ; JS seulement pour le comportement. Effort L.

#### Q.25 Q-uib-11 : `PagePC.tsx` : composant de 419 lignes, ~20 `useState`, fonctions imbriquées, `pokemon` masqué
`src/ui/PagePC.tsx:60-419`
Preuve : le paramètre `pokemon` des fonctions (L.121,153,212,353) et du `.map` (L.347) masque la constante `pokemon` de L.90 ; mode objet, mode échange, tri, filtre, lot, menu contextuel et glisser-déposer sont dans le même composant.
Gravité 2. Correctif : extraire `GrillePc`, `EquipePc`, `useSelectionLot`, `useModeObjet`. Effort L.

#### Q.26 Q-uib-12 : PC : sélection en lot en O(n²) et grille non virtualisée
`src/ui/PagePC.tsx:351,358` (`effectifs.some(p => p.uid === pokemon.uid)` deux fois par case) ; `:79`
Preuve : avec 1000 Pokémon et une sélection, `effectifs.some` est évalué 2 × 1000 × |sélection| par rendu ; `etatObjet(pokemon)` et `dpsPc(pokemon)` sont recalculés pour chaque case à chaque rendu ; `new Set(pokedex)` recréé à chaque `useMemo`.
Gravité 2. Correctif : `Set` des uid sélectionnés, virtualisation (liste fenêtrée) au-delà de ~200 cases. Effort M.

#### Q.27 Q-uib-13 : Constantes de jeu écrites en dur dans l'UI
`src/ui/PagePlus.tsx:116,121,141` (`/ 8`, `/ 151`, alors que L.163 utilise `progression.total`) ; `src/ui/ZoneLigne.tsx:41,46,47` (`length: 10`, `/10`, « sur 10 »)
Preuve : ajouter une région ou changer le nombre d'étapes d'une zone laisse ces affichages faux.
Gravité 2. Correctif : lire `progression.total`, `badgesTotal`, `etapesParZone` depuis le cœur. Effort S.

#### Q.28 Q-srv-02 : 16 scripts `extraire-*-v1` recopient le même chargeur `vm`, sans module partagé
- `scripts/extraire-*.mjs` (98 occurrences de `createContext`/`runInContext`), `scripts/lib/` (3 fichiers seulement)
- Preuve : chaque script redéfinit `executer`, `exiger`, `copier`, lecture de `legacy/js/...` (par exemple `extraire-casino-v1.mjs:45,71`, `extraire-pension-v1.mjs:58`, `extraire-centre-v1.mjs:48`, `extraire-boss-v1.mjs:31-32`). `package.json` n'expose que 5 des 16 (`extraire:*`).
- Gravité : 2
- Correctif : `scripts/lib/legacy.mjs` (chargement de contexte, utilitaires) ; décider quels scripts restent utiles : `CLAUDE.md:7` dit que la V1 n'est plus une référence.
- Effort : M

#### Q.29 Q-srv-03 : `sauvegarde.ts` : 500 lignes mélangeant validation, routes et SQL ; sept copies du motif connect/BEGIN/COMMIT/ROLLBACK/release
- `server/src/sauvegarde.ts:135-164`, `:165-188`, `:189-221`, `:222-259`, `:260-317`, `:346-392`, `:393-498`
- Preuve : chaque transaction répète `pool.connect()`, `let echec`, `try/catch/finally` identiques (≈ 15 lignes) ; le PUT fait 105 lignes. Les oublis de `ROLLBACK`/`release(echec)` sont à un copier-coller de distance.
- Gravité : 2
- Correctif : helper `transaction(pool, async db => …)` ; fichiers `validation.ts`, `parties.ts`, `versions.ts`, `appareil.ts`.
- Effort : M

#### Q.30 Q-srv-04 : Plafonds et durées codés en dur, dispersés dans trois fichiers et quatre requêtes SQL
- `server/src/sauvegarde.ts:16-19` (20, 20, 60, 200), `:53` (1 Mo), `:222`, `:346`, `:393` (3 Mo), `:111`, `:212`, `:412`, `:426` (120 s), `:24`, `:30` (5 versions), `server/src/app.ts:62` (100 Ko)
- Preuve : la fenêtre de 120 s existe dans quatre requêtes ; le battement client vaut 60 s (`appareil.ts:62`) ; le README cite les valeurs en cinq endroits.
- Gravité : 2
- Correctif : un objet `LIMITES` exporté et injecté dans les requêtes (paramètre SQL), lu par `config.ts`.
- Effort : S

#### Q.31 Q-srv-05 : Tests absents pour `index.ts`, `migrate.ts`, arrêt, transport SMTP et en-têtes de production ; aucune mesure de couverture
- `server/tests/*.ts`, `server/vitest.config.ts`
- Preuve : aucun test n'importe `index.ts` ni `migrate.ts` ; HSTS n'est jamais vérifié (`NODE_ENV: 'test'` dans `support.ts:58`) ; le chemin `transport.sendMail` n'est pas couvert (mailer injecté) ; pas de bloc `coverage` dans `vitest.config.ts`.
- Gravité : 2
- Correctif : tests de démarrage/migration (base vide, base N-1), de l'en-tête HSTS en production, du transport SMTP avec un faux serveur ; activer la couverture.
- Effort : M

#### Q.32 Q-srv-07 : Stockage : tout en `jsonb` dans Postgres, copies complètes à chaque envoi, aucune stratégie S3 ni compression
- `server/src/schema.ts:3-26`, `server/src/sauvegarde.ts:467-468`
- Preuve : chaque PUT copie la ligne précédente en entier dans `versions` (jusqu'à 1 Mo par objet, 5 copies) ; pas de compression applicative, de delta, de rétention par date, ni d'export vers un stockage d'objets. La croissance suit les joueurs × la fréquence d'envoi (toutes les ≥ 2 s en cas de jeu actif).
- Gravité : 2
- Correctif : instantanés espacés (voir B-srv-01), compression, delta, copie des archives vers S3 avec rétention.
- Effort : L

#### Q.33 Q-core-09 : Un objet, deux identifiants (`candy` / `bonbon`)
`data/objets.json:45`, `:53`, `data/casino.json:22`, `data/jalons.json`, `data/reglages.json:202`
Preuve : `id: 'candy'`, `inventaire: 'bonbon'` ; le casino référence `itemKey: 'candy'`, les jalons et le chromatique `bonbon`. Le casino passe par `objets.find(...).inventaire` (`casino.ts:92`), pas les jalons : deux conventions.
Gravité : 3 · Correctif : un seul identifiant, ou référencer toujours par `id` puis résoudre. · Effort : S

#### Q.34 Q-core-10 : `casino.ts` mélange validation, boutique, jetons, machine, pile ou face et ré-exports ; le reste est dans `jeux-casino.ts`
`src/core/casino.ts:189-191`, `src/core/jeux-casino.ts`
Preuve : `Alea`, `Resultat`, `debiter` et `RegionJetons`/`RegionCasino` existent en double (`casino.ts:12-14`, `:162`, `jeux-casino.ts:11-13`, `:50`) ; le découpage entre les deux fichiers ne suit pas une logique de jeu.
Gravité : 3 · Correctif : un dossier `casino/` (`types`, `jetons`, `machine`, `blackjack`…). · Effort : M

#### Q.35 Q-core-13 : Fonctions longues dans le cœur
`src/core/objectifs.ts:15-52` (`chargerObjectifs`, 38 lignes imbriquées), `:56-86` (`calculerObjectifs`), `src/core/evenements.ts` (338 lignes), `src/core/blackjack.ts` (308 lignes), `src/core/migrations/index.ts:84-122`
Preuve : mesuré par `wc -l`; les fonctions de chargement mélangent validation, texte et construction.
Gravité : 3 · Correctif : découper par responsabilité. · Effort : M

#### Q.36 Q-core-14 : Types faibles : `as`, `!` et `Record<string, unknown>` en cascade
`src/core/migrations/index.ts` (une trentaine de `as Record<string, unknown>`), `src/core/ennemis.ts:16` (`zone.adversaires![etape - 1]!`), `src/core/boutique.ts:80` (`objet.inventaire!`), `src/core/casino.ts:92-94`, `src/core/equipe.ts:48`
Preuve : environ 100 `as` hors tests (grep ` as [A-Za-z\[]`). Aucun `any`, `@ts-ignore` ni `eslint-disable` dans le cœur (bon point).
Gravité : 3 · Correctif : unions discriminées pour `Objet` (consommable / amélioration), garde de type pour les migrations. · Effort : L

#### Q.37 Q-core-15 : `rattraperEspecesEcloses` et `rattraperDex` refont la logique de `noterObtention`
`src/core/migrations/index.ts:84-122`, `src/core/dex.ts:13`
Preuve : deux copies de la règle « espèce atteinte par évolution entre dans la liste » ; elles s'exécutent à chaque `migrer`, même en version courante (`index.ts:78-79`).
Gravité : 3 · Correctif : une migration V4→V5 qui rattrape une fois, puis retrait. · Effort : M

#### Q.38 Q-core-16 : Champs optionnels hérités de versions anciennes, d'où des `?? []` partout
`src/core/sauvegarde-types.ts:54-94` (onze champs `?`), `src/core/pension.ts:77-79`, `src/core/tutoriels.ts:62`, `:71`
Preuve : `annoncesVues`, `tutosVus`, `casinoVu`, `pensionVue`, `zonesAtteintes`, `especesEcloses`, `especesShiny`… sont optionnels et lus avec un repli.
Gravité : 3 · Correctif : migration vers une version qui les rend requis. · Effort : M

#### Q.39 Q-core-21 : Logique d'évolution reconstruite dans trois modules
`src/core/evolution.ts:16`, `src/core/zones-espece.ts`, `src/core/easter-eggs.ts` (`stadeEvolution`)
Preuve : la table `origines` et le calcul de stade sont refaits ; `zones-espece.ts` boucle aussi sans garde de cycle.
Gravité : 3 · Correctif : n'exposer que les fonctions d'`evolution.ts`. · Effort : S

#### Q.40 Q-core-22 : `chargerPokemon()` appelé dans dix modules du cœur
`src/core/combat-evenement.ts`, `combat.ts`, `ennemis.ts`, `evenements.ts`, `monde.ts`, `pension.ts`, `recompenses.ts`, `sexe.ts`, `statistiques.ts`, `stats.ts`
Preuve : chaque module charge et valide le catalogue (44 Ko). `guide.ts` recharge en plus `pokemon.json`.
Gravité : 3 · Correctif : un singleton partagé dans `pokemon.ts`. · Effort : S

#### Q.41 Q-core-23 : Textes du jeu en dur dans le cœur, dont certains dupliqués
`src/core/evolution.ts:81-95` (« Pokémon invalide ! », « Évolution bloquée ! »), `src/core/boutique.ts:78` et `src/core/pension.ts:60` (« Pas assez d'argent. »), `src/core/objets-equipe.ts:74`, `:102`, `src/core/statistiques.ts:38` (« Base (5+0.2% DPS) »)
Preuve : `CLAUDE.md` demande des données de contenu en JSON ; `casino.json` le fait déjà.
Gravité : 3 · Correctif : `data/messages.json` par thème. · Effort : M

#### Q.42 Q-core-24 : Descriptions de bonus dupliquées en texte libre
`data/jalons.json` (« DPS Équipe +50% », « Boutique -15% »), `data/reglages.json:168-185`
Preuve : valeurs écrites deux fois (nombre et texte) ; B-core-23 en est un exemple.
Gravité : 3 · Correctif : générer la description depuis les multiplicateurs. · Effort : M

#### Q.43 Q-core-35 : Aucune évolutivité pour un type de combat ou une région supplémentaire
`src/core/combat.ts:132` (`zone.type !== 'ligue'`), `src/core/ennemis.ts:14-16`, `src/core/combat-evenement.ts:16`
Preuve : le type de zone `'ligue'` pilote le boss final, les adversaires multiples, la capture, la rareté ; un combat « tournoi » ou « expédition » exigerait des `if` supplémentaires dans trois fichiers.
Gravité : 3 · Correctif : stratégie par type de zone (`TypeCombat`) déclarée en données. · Effort : L

#### Q.44 Q-uia-10 : `BarreLaterale` et `Navigation` dupliquées
- `src/ui/Navigation.tsx`, `src/ui/BarreLaterale.tsx`
- Preuve : entrées et logique Pension dupliquées ; classes `lg:` mortes dans Navigation (la version PC est dans BarreLaterale).
- Gravité : 3
- Correctif : une liste d'entrées commune.
- Effort : M

#### Q.45 Q-uia-11 : `DetailBadge` en deux versions différentes
- `src/ui/BoiteBadges.tsx`, `src/ui/BadgesTelephone.tsx`
- Preuve : deux rendus du détail d'un badge, avec des états et structures différents (cf. B-uia-27 à B-uia-29).
- Gravité : 3
- Effort : M

#### Q.46 Q-uia-18 : Singleton audio créé à l'import
- `src/ui/musique.ts:20`
- Preuve : `creerLecteur = fichier => new Audio(fichier)` sert de valeur par défaut, et le module garde un état global à l'import ; les tests doivent le réinitialiser et un second montage partage l'état.
- Gravité : 3
- Effort : M

#### Q.47 Q-uib-16 : Logique métier d'éclosion dans l'UI
`src/ui/store-pension.ts:41-63`
Preuve : `construireEclosions` calcule espèces écloses, paliers de succès gagnés et diamants à partir de `registreSucces` ; ce calcul est du jeu pur, hors `src/core`, et le fichier s'appelle « pension » pour des éclosions.
Gravité 3. Correctif : déplacer dans `src/core` (pension/succès), l'UI ne garde que le format. Effort M.

#### Q.48 Q-srv-12 : Migrations en tableau de chaînes, sans somme de contrôle ni test depuis un état réel N-1 ; SQL documenté en double
- `server/src/schema.ts:3-34`, `docs/migrations/0003-versions-origine.sql`, `server/tests/archives.test.ts:26`
- Preuve : une migration déjà appliquée peut être modifiée dans le code sans alerte (la table ne stocke que le numéro). Seule la 3ᵉ a son fichier SQL séparé, qui duplique `schema.ts:29-33`. Le test vérifie l'idempotence, pas le passage d'une base à l'état 2 vers 3 avec des données.
- Gravité : 3
- Correctif : fichiers `server/migrations/000N-*.sql` lus par `migrate.ts`, colonne `checksum`, test depuis un instantané.
- Effort : M

#### Q.49 Q-srv-16 : Deux versions de TypeScript et de `@types/node`, plages `^` côté serveur, préversion en devDependency
- `server/package.json` (`typescript ^7.0.2`, `@types/node ^26.6.6`, `embedded-postgres ^18.6.0-beta.19`) contre `package.json` racine (`typescript 5.9.3`, `@types/node 22.20.5`, versions exactes)
- Preuve : `engines.node >= 22` et image `node:22-slim`, mais les types Node 26 laissent passer des API absentes de Node 22 ; le serveur utilise `^` alors que la racine épingle ; `embedded-postgres` est en bêta.
- Gravité : 3
- Correctif : aligner `@types/node` sur 22, épingler les versions, remonter TypeScript au même rythme.
- Effort : S

#### Q.50 Q-srv-17 : Deux dépôts npm séparés, sans espace de travail ; le serveur est invisible depuis la racine
- `package.json` racine, `server/package.json`, deux `package-lock.json`
- Preuve : `npm run ci` ne couvre pas le serveur ; le README racine (529 octets) ne mentionne ni `server/` ni les 39 scripts ; « `npm run dev` lance le serveur local » désigne Vite, ambigu avec l'API.
- Gravité : 3
- Correctif : espaces de travail npm ou script racine `ci:serveur` ; README racine avec la carte du dépôt.
- Effort : S

## 50 améliorations de confort (QoL)

#### Q.1 Q-j1-01 : La carte « Objectifs » masque le niveau et les PV de l'ennemi à 390 px
- Où : écran de combat, `EcranCombat.tsx` (carte ennemi et carte objectif permanent).
- Constat : sur les captures `20-390-combat` et `28-390-boss`, la carte « Objectifs : Boss : Sulfura, étape 10 » recouvre la carte de l'ennemi. « Niv. 62 » est caché derrière et « PV 351366 / 351366 » est coupé au milieu. Pour un boss, le nom est déjà écrit dans la carte ennemi (« Sulfura (Géant) »), l'objectif le répète.
- Proposition : sortir l'objectif de la scène et en faire un bandeau d'une ligne sous la barre de zone (« Objectif : boss, étape 10 »), ou le masquer quand l'ennemi est le boss de l'objectif.
- Valeur 1 · Effort S · Dépendances : aucune (touche au ticket W déjà livré).

#### Q.2 Q-j1-02 : La bulle du Prof. Chen cache les boutons dont elle parle
- Où : tutoriel de la Route 1, `src/ui/tuto/Tutoriel.tsx`, bulle de dialogue en bas de l'écran.
- Constat : sur `12-390-tuto-49`, la bulle (« Te voilà devant ton premier boss ! Chaque… », texte écrit lettre par lettre) est posée sur les boutons Capturer, Attaque auto, Arrêt auto, Réglage et Sac, au moment où le texte les explique. Le joueur lit l'explication sans voir l'objet expliqué.
- Proposition : placer la bulle en haut de l'écran quand l'étape désigne un bouton du bas (et inversement), et surligner le bouton concerné d'un cadre.
- Valeur 1 · Effort S · Dépendances : ticket E (tutoriel) déjà livré.

#### Q.3 Q-j1-04 : Aucune façon de passer les dialogues d'intro
- Où : intro, labo, choix du starter, dialogues d'après-choix (seul `Credits.tsx` a un bouton « Passer » parmi les écrans de dialogue).
- Constat : entre le premier écran et la Route 1, j'ai produit une trentaine de captures de dialogue (`02-intro-390-00` à `13`, `04-390-b-0` à `7`, `07-390-post-choix-0` à `11`), avec un toucher par écran. Une recherche de « Passer » dans `src/ui` ne trouve que les crédits, l'éclosion, l'évolution et le tutoriel. La vision prévoit le même choix du starter à chaque nouvelle région : ces dialogues reviendront.
- Proposition : bouton « Passer l'intro » après le premier visionnage (et dès la première fois, avec une confirmation), qui saute à l'écran de choix du starter.
- Valeur 1 · Effort S · Dépendances : aucune.

#### Q.4 Q-j1-05 : Deux boutons de combat sont des interrupteurs, deux ouvrent un tiroir, tous quatre se ressemblent
- Où : rangée « Attaque auto, Arrêt auto, Réglage, Sac », `ActionsCombat.tsx`.
- Constat : sur `20-390-combat`, la rangée a quatre boutons identiques. « Arrêt auto » porte un point blanc et une teinte (état allumé, `aria-pressed` + `::after`), « Attaque auto » est neutre sur la même capture. Rien n'indique que le premier est un interrupteur, le troisième un tiroir de réglage, le quatrième un sac. Impossible de savoir au coup d'œil si l'attaque auto tourne.
- Proposition : les interrupteurs montrent leur état en toutes lettres (« Attaque auto : oui / non », voyant vert) ; les tiroirs prennent une flèche ou un style de bouton secondaire.
- Valeur 1 · Effort S · Dépendances : aucune.

#### Q.5 Q-j1-06 : « Arrêt auto » et « Réglage » : des noms qui ne disent pas ce qu'ils font
- Où : même rangée, tiroir de réglage (`ReglagesCombat.tsx`).
- Constat : « Arrêt auto » est en réalité « arrêter l'attaque auto quand une rareté choisie apparaît » (`23-390-reglage-arret`). « Réglage » seul ressemble au Menu > Réglages. Un nouveau joueur lit « Arrêt auto » comme un bouton stop.
- Proposition : renommer en « Stop si rare » (ou « Pause si rare ») et « Réglage » en « Raretés » ; garder la touche R et T.
- Valeur 1 · Effort S · Dépendances : textes du tutoriel et du guide (`data/guide.json`) à aligner.

#### Q.6 Q-j1-07 : PC sur téléphone : les filtres remplissent un écran avant la liste
- Où : `PagePC.tsx`, vue téléphone.
- Constat : sur `20-390-pc`, le premier écran contient le titre, le compteur, l'équipe en 6 cartes, « Trie par », « Filtre », « Nom ou numéro » et « Relâcher ». La première carte de Pokémon du PC est sous le pli (`21-390-pc-scroll`). Le joueur qui vient chercher un Pokémon doit faire défiler à chaque ouverture.
- Proposition : équipe repliée sur une ligne de six miniatures ; tri, filtre et recherche dans un seul bandeau (recherche visible, tri et filtre derrière un bouton « Filtres ») ; « Relâcher » dans ce bouton.
- Valeur 1 · Effort M · Dépendances : ticket U (fusion Équipe/PC) déjà livré.

#### Q.7 Q-j1-09 : La fiche Pokémon affiche des libellés qu'on ne peut pas décoder
- Où : `FichePokemon.tsx`, bloc DPS (capture `21-390-fiche`).
- Constat : trois lignes « Base 2240 », « Type × 1 », « Bonheur × 1,1 », puis un anneau « Bonheur : 100/255, +10 % de dégâts » qui répète la ligne précédente. « Type × 1 » ne dit pas contre quoi. « XP : MAX » est une ligne isolée sans barre. Le ticket M traite les bonus qui ne s'appliquent pas, pas les libellés.
- Proposition : réécrire en phrases (« Dégâts de base 2 240 », « Type : ×1 contre ce boss »), n'afficher le bonheur qu'une fois, et dire d'où vient le ×1,1.
- Valeur 1 · Effort S · Dépendances : ticket M.

#### Q.8 Q-j1-10 : Faire évoluer un Pokémon prend trois à quatre touchers
- Où : PC, tuile « prêt à évoluer » (`pret-evoluer`, `PagePC.tsx:282`), `FichePokemon.tsx`, `FenetreEvolution.tsx`.
- Constat : parcours joué : ouvrir le PC, toucher la tuile, toucher « Évoluer » dans la fiche (attendre ~0,9 s l'ouverture), regarder l'animation (`27-1440-evo2-*`), « Fermer ». Avec dix Pokémon prêts, ça fait trente à quarante touchers.
- Proposition : bouton « Évoluer » directement sur la tuile et sur la carte d'équipe, et un bouton « Tout évoluer (N) » quand plusieurs sont prêts, avec l'option « passer l'animation » déjà présente.
- Valeur 1 · Effort M · Dépendances : aucune.

#### Q.9 Q-j1-11 : Le PC ne montre ni ne filtre les types
- Où : `PagePC.tsx:31-32` (tri : DPS, numéro, nom, niveau, favoris, shiny ; filtre : tous, favoris, shiny, œufs, évolution).
- Constat : les tuiles du PC (`20-1440-pc`) montrent nom, sexe, DPS, numéro et niveau, pas le type. Le vision.md fait de la stratégie de type un pilier, et Nicolas a écrit dans `notes-nicolas-phase-5.md` que les types doivent être colorés comme dans le jeu. Avec 41 à 150 Pokémon, trouver « un Eau pour ce boss Feu » demande de les ouvrir un par un.
- Proposition : deux pastilles de type colorées sur chaque tuile et un filtre « Type » (liste des 15 types).
- Valeur 1 · Effort M · Dépendances : aucune (la classe `pastille-type-*` existe déjà dans `Pokedex.tsx:92`).

#### Q.10 Q-j1-13 : Échange d'équipe à l'aveugle : aucun écart de DPS affiché
- Où : « Placer dans l'équipe » dans la fiche (`FichePokemon.tsx`), mode échange (`echange`, notification « Choisis le Pokémon à remplacer par X »).
- Constat : le joueur choisit quel membre sortir sans voir ce qu'il gagne ou perd. Il faut mémoriser le DPS du Pokémon qui entre (2 464 pour Leveinard sur `21-390-fiche`) et celui de chaque membre.
- Proposition : pendant l'échange, afficher sur chaque carte d'équipe la variation de DPS (« +1 234 » vert, « −800 » rouge) et le changement de type couvert.
- Valeur 1 · Effort M · Dépendances : aucune.

#### Q.11 Q-j1-14 : Les objets du Sac n'ont aucune description
- Où : tiroir Sac, `23-390-sac` ; `data/objets.json` (32 objets).
- Constat : « Attaque + », « Attaque Spé + », « Calcium », « Protéine », « Pièce Rune », « Jeton Shiny », « Chaussures Sport » apparaissent avec une quantité et « UTILISER » ou « ACTIF », sans effet. Un joueur qui n'a pas vu l'achat au Shop ne sait pas ce qu'il consomme.
- Proposition : une ligne d'effet sous chaque nom (« +5 % DPS, un Pokémon »), tirée d'un champ `description` dans `data/objets.json`.
- Valeur 1 · Effort S · Dépendances : aucune.

#### Q.12 Q-j1-15 : Le résultat d'une capture n'est montré que par un message de 1,2 s
- Où : `store-capture.ts:42-43` (« X est capturé ! », « X s'est échappé ! »), `EcranCombat.tsx`.
- Constat : lu dans le code, non vu à l'écran. Le retour d'une capture passe par le même message que tout le reste. Pas de secousse de balle, pas d'éclat visible dans la scène. À 7 captures ratées de suite, rien n'indique la progression de la pitié.
- Proposition : animer la balle sur l'ennemi (3 secousses, puis éclat ou ouverture) et afficher un résultat dans la scène, près du bouton Capturer.
- Valeur 1 · Effort M · Dépendances : ticket L de la phase 5 (retours visuels) à vérifier.

#### Q.13 Q-j1-16 : Relâcher par lot : aucun « tout sélectionner »
- Où : `PagePC.tsx` (`selectionLot`, lignes 81-90, 214, 284).
- Constat : une recherche de « Tout sélectionner » ne trouve rien dans `PagePC.tsx` ; la sélection se fait Pokémon par Pokémon. Pour relâcher 30 Pokémon d'un filtre, 30 touchers.
- Proposition : « Tout sélectionner (filtre en cours) », « Inverser », et un compteur « 12 sélectionnés, favoris et shiny exclus ».
- Valeur 1 · Effort S · Dépendances : ticket J (relâche par lot) déjà livré.

#### Q.14 Q-j2-01 : Libellés accessibles qui contredisent le texte visible
- Où : Combat (`.zone-nav-precedente`, aria-label « Zone précédente : X », texte « Précédent »), Shop (boutons de quantité de chaque carte, `aria-label="Quantité de Pokéball"`), Carte (« Route 1 (Zone 1) »), Menu (6 boutons).
- Constat : axe signale `label-content-name-mismatch` (grave) à 390 et à 1440 sur ces 4 écrans (3 à 25 éléments par écran). Un lecteur d'écran ou la commande vocale « clique sur Précédent » ne trouve pas le bouton. Pension, Réglages, Statistiques, Badges, Casino, Guide : aucune violation à 390.
- Proposition : faire commencer chaque aria-label par le texte visible (« Précédent, zone Route 2 »), ou retirer l'aria-label quand le texte suffit.
- Valeur 1 · Effort S · Dépendances : aucune.

#### Q.15 Q-j2-02 : Formater tous les nombres de la même façon
- Où : en-tête du Combat (PV, DPS), page Statistiques, Shop.
- Constat : l'argent est formaté (« 331 500 ₽ ») mais les PV ennemis s'affichent « PV 349747 / 349747 » et « 2342896 », les statistiques « 3106.5 » et « 15920.0 », le multiplicateur « x1.5 » à l'anglaise alors que le reste du jeu écrit « ×1,5 ». Le DPS de l'en-tête affiche des décimales (« 102 943,9 »).
- Proposition : un seul formateur (séparateur de milliers fin, virgule décimale, notation abrégée « 2,3 M » au-delà de 1 million) utilisé partout, y compris PV et statistiques.
- Valeur 1 · Effort S · Dépendances : B-uia-26 (argent tronqué à 390) touche le même formateur.

#### Q.16 Q-j2-03 : Clé brute « objet:omniExp (x2) » dans les statistiques
- Où : Statistiques, liste des bonus actifs.
- Constat : une ligne affiche l'identifiant interne « objet:omniExp (x2) » au lieu d'un nom lisible.
- Proposition : table identifiant → libellé français (« Multi Exp, ×2 »), avec une erreur de test si un identifiant n'a pas de libellé.
- Valeur 1 · Effort S · Dépendances : aucune.

#### Q.17 Q-j2-04 : Carte à 390 px : la liste prend la moitié de l'écran, la carte est minuscule
- Où : onglet Carte (`CarteKanto.tsx`), téléphone.
- Constat : la carte illustrée est réduite à un timbre au-dessus d'une liste de 21 zones. Le joueur lit une liste là où il pourrait toucher une carte.
- Proposition : carte pleine largeur (zoom et déplacement au doigt), liste repliée sous un bouton « Liste des zones », zone actuelle centrée.
- Valeur 1 · Effort M · Dépendances : Q-j2-05, Q-j2-06, F-j2-11.

#### Q.18 Q-j2-05 : Les 21 zones sont toutes listées « fermée » dès le début
- Où : Carte, début de partie.
- Constat : le joueur voit tout le parcours (spoil) et aucune des zones fermées n'indique comment l'ouvrir.
- Proposition : n'afficher que les zones ouvertes plus la suivante, avec sa condition (« Bats Pierre à Argenta »), le reste en silhouettes « ? ».
- Valeur 1 · Effort S · Dépendances : Q-j2-04.

#### Q.19 Q-j2-07 : Un bouton « Retour » qui ne revient pas d'où l'on vient
- Où : Pension (« Retour au menu » même quand on arrive par la barre), Casino (« Retour à la Carte » même quand on arrive par le Menu).
- Constat : le joueur atterrit sur un écran qu'il n'a pas ouvert.
- Proposition : retour vers l'écran précédent (mémoriser l'origine à l'ouverture), libellé « Retour » tout court.
- Valeur 1 · Effort S · Dépendances : aucune.

#### Q.20 Q-j2-08 : Pension : la note « Espèce inconnue… » recouvre « Retirer Pikachu »
- Où : `PagePension.tsx`, 1440×900, premier parent déposé.
- Constat : la note passe par-dessus le bouton du premier parent, qu'on ne peut plus cliquer sans déplacer la fenêtre.
- Proposition : note en flux normal sous la carte du parent plutôt qu'en position absolue.
- Valeur 1 · Effort S · Dépendances : aucune.

#### Q.21 Q-j2-09 : Shop : bouton d'achat sans indication quand on ne peut pas payer
- Où : `PageShop.tsx`, carte de consommable.
- Constat : chaque carte aligne −, +, +10, Max et « Acheter ×1 » ; rien ne dit si l'achat est possible ni combien manque. Le joueur essaie, puis lit une annonce.
- Proposition : bouton grisé avec « Il te manque 1 240 ₽ » ; total en ₽ au bouton (« Acheter ×5 : 2 210 ₽ »).
- Valeur 1 · Effort S · Dépendances : aucune.

#### Q.22 Q-j2-10 : Casino : aucun bilan de session
- Où : `PageCasino.tsx` et les 6 jeux.
- Constat : après 20 parties on ignore si on est en gain ou en perte. Le seul repère est le solde de jetons.
- Proposition : bandeau « Session : +340 jetons (12 parties, 7 gagnées) » avec remise à zéro à la sortie ; bilan par jeu en statistiques.
- Valeur 1 · Effort M · Dépendances : F-j2-05 (statistiques) réutilise les compteurs.

#### Q.23 Q-j2-11 : Casino : pas de « Rejouer la même mise »
- Où : roulette, plus ou moins, gratter, blackjack.
- Constat : chaque partie redemande de choisir la mise ; en rafale, c'est la plus grosse perte de temps de l'écran.
- Proposition : bouton « Rejouer (mise 10) » après chaque résultat, et touche Entrée sur PC.
- Valeur 1 · Effort S · Dépendances : Q-j2-26 (plafond) si on ajoute des garde-fous.

#### Q.24 Q-j2-12 : Réglages : pas de bascule son depuis l'écran de jeu
- Où : en-tête du Combat, Réglages > Son.
- Constat : couper la musique oblige à ouvrir Menu > Réglages > curseurs, puis revenir.
- Proposition : icône haut-parleur dans l'en-tête (appui = muet / son, appui long = curseurs) ; touche M sur PC.
- Valeur 1 · Effort S · Dépendances : B-uia-30 (musique sans reprise au retour en ligne).

#### Q.25 Q-j1-17 : Le nom de la zone est coupé dans l'en-tête à 390 px
- Où : bandeau « Pokédollars / DPS / Zone ».
- Constat : « Route Victo… » sur `20-390-combat`. Le nom exact de la zone n'est visible nulle part sur cet écran.
- Proposition : nom de la zone sur deux lignes, ou taille réduite, ou nom complet au-dessus de la barre Précédent/Suivant (comme sur PC).
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.26 Q-j1-20 : Les tiroirs Sac, Radar, Objectifs et Réglage ne se ferment qu'avec « Fermer »
- Où : tiroirs du combat (`23-390-*`).
- Constat : à 390, le tiroir couvre la moitié basse de l'écran ; la seule sortie est le bouton « Fermer » en haut à droite du tiroir, loin du pouce.
- Proposition : toucher la scène ou glisser le tiroir vers le bas le ferme ; « Fermer » en bas.
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.27 Q-j1-21 : À 390 px, on ne voit pas le DPS de chaque Pokémon de l'équipe
- Où : barre d'équipe du combat.
- Constat : à 1440, chaque carte montre « 7 586,9 DPS ». À 390, la barre montre seulement le niveau. Pour savoir qui est faible, il faut ouvrir le PC.
- Proposition : toucher un membre ouvre une mini-fiche (DPS, type, objet) sans quitter le combat ; ou DPS en abrégé sous le sprite (« 7,6 k »).
- Valeur 2 · Effort M · Dépendances : aucune.

#### Q.28 Q-j1-24 : Sur un boss, Capturer est grisé sans raison visible
- Où : boutons Pokéball et Capturer, `28-390-boss`.
- Constat : le texte « Ce Pokémon ne peut pas être capturé. » et « Inutile sur un boss ! » existe dans la page, mais n'est pas visible sur la capture : deux boutons grisés. « (Géant) » après le nom n'est pas expliqué non plus.
- Proposition : afficher « Boss : non capturable » sous le bouton, et une infobulle sur « Géant » (« boss de zone, plus de PV »).
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.29 Q-j1-25 : « Suivant » est grisé sans dire pourquoi
- Où : barre Précédent/Suivant, `28-390-boss`.
- Constat : tant que le boss n'est pas battu, « Suivant » est gris. Aucun texte ne dit « Bats Sulfura pour avancer ».
- Proposition : au toucher d'un « Suivant » grisé, un message de ce qu'il faut (« Bats le boss », « Obtiens le badge Marais »).
- Valeur 2 · Effort S · Dépendances : conditions de passage déjà en données.

#### Q.30 Q-j1-26 : Le chrono du boss ne prévient pas quand il reste peu de temps
- Où : carte ennemi du boss (« Temps 28 secondes » + barre jaune, `28-390-boss`), `data/reglages.json` `minuteurBossMs` 30000.
- Constat : vu à 28 s seulement. Je n'ai pas observé le passage sous 10 s : à vérifier. La barre est jaune d'un bout à l'autre sur la capture.
- Proposition : barre rouge sous 10 s, battement du chiffre et ton `alerte` (voir F-j1-09).
- Valeur 2 · Effort S · Dépendances : à vérifier à l'écran.

#### Q.31 Q-j1-27 : Le tri et le filtre du PC repartent de zéro à chaque ouverture
- Où : `PagePC.tsx:74` (`useState<TriPc>('dps')`).
- Constat : le tri est un état local. Un joueur qui range par numéro ou filtre « Évolution à découvrir » retrouve DPS et « Tous » en revenant du combat.
- Proposition : mémoriser tri et filtre dans la partie (ou la session).
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.32 Q-j1-28 : On ne retrouve pas le Pokémon qu'on vient de capturer dans le PC
- Où : `PagePC.tsx:31` (tris : DPS, numéro, nom, niveau, favoris, shiny).
- Constat : aucun tri « récents d'abord » ni marque « nouveau ». Après une capture, retrouver la recrue parmi 41 à 150 tuiles demande une recherche par nom.
- Proposition : tri « Récents d'abord » et pastille « Nouveau » sur les tuiles jamais ouvertes.
- Valeur 2 · Effort M · Dépendances : date de capture à stocker dans la sauvegarde (vérifier le format).

#### Q.33 Q-j1-30 : La fenêtre d'évolution ne montre ni l'ancien sprite ni le gain
- Où : `FenetreEvolution.tsx` (`27-1440-evo2-3000`).
- Constat : « Félicitations ! Ton « Caninos » a évolué en « Arcanin » », sprite d'Arcanin dans un cadre bleu, « Fermer ». Pas de DPS avant/après, pas de nouveau type s'il change.
- Proposition : deux sprites avec une flèche, « DPS avant → après », et la mention « Nouvelle entrée Pokédex » quand c'est le cas.
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.34 Q-j1-33 : « Effets actifs : Aucun » alors que le Sac montre des objets « ACTIF »
- Où : colonne de droite du combat PC (`20-1440-combat`), tiroir Sac (`23-390-sac`).
- Constat : le Sac liste Chaussures Sport, Pièce Rune et Protéine en « ACTIF » ; le panneau « Effets actifs » à 1440 affiche « Aucun effet actif ». À 390 il n'existe aucun panneau équivalent.
- Proposition : un seul endroit, partout : les effets temporaires avec leur temps restant, les objets permanents dans le Sac avec un libellé « permanent ».
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.35 Q-j1-34 : Changer de balle n'a pas d'écran de choix
- Où : bouton « Pokéball ×99 », touche B (`raccourcis.ts`).
- Constat : le bouton passe d'une balle à la suivante. Avec Pokéball, Superball, Hyperball et Master Ball, il faut cycler. Pas de choix direct ni de « meilleure balle ».
- Proposition : appui long (ou B maintenu) ouvre un petit menu des balles avec leurs quantités.
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.36 Q-j2-14 : Shop : le prix après inflation n'est pas expliqué
- Où : Shop (Pokéball 200 ₽ devient 442 ₽ à 8 badges, Master Ball 331 500 ₽), `inflation 0,20 par badge`.
- Constat : le prix change à chaque badge sans que le jeu le dise ; le joueur peut croire à un bug.
- Proposition : petite ligne « prix de base 200 ₽ · +20 % par badge » au toucher du prix (bulle).
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.37 Q-j2-18 : Shop : Multi Exp et Œuf Chance donnent le même +50 % d'XP sans le dire
- Où : cartes de ces deux objets.
- Constat : deux objets au même effet visible ; le joueur ne sait pas s'ils se cumulent ni lequel acheter.
- Proposition : ligne « se cumule avec / ne se cumule pas avec X » sur chaque carte.
- Valeur 2 · Effort S · Dépendances : lire la règle de cumul dans le cœur avant de rédiger le texte.

#### Q.38 Q-j2-22 : Pension : la chance de ponte n'apparaît qu'avec le 2e parent
- Où : `PagePension.tsx`.
- Constat : avec un seul parent déposé, rien n'indique qu'il en faut deux ni la chance (2 % par victoire, 1 % sans compatibilité, `reglages.json`).
- Proposition : ligne dès le 1er parent : « Ajoute un second parent : 2 % d'œuf par victoire ».
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.39 Q-j2-23 : Pension : liste des parents sans tri par compatibilité
- Où : sélecteur de parent.
- Constat : tous les Pokémon du PC sont listés dans l'ordre du PC ; le joueur teste au hasard.
- Proposition : tri « compatibles d'abord » et pastille « ✔ compatible avec Pikachu ».
- Valeur 2 · Effort M · Dépendances : lecture des groupes d'œufs dans les données.

#### Q.40 Q-j2-25 : Casino : bouton rouge sur « Tirer » quel que soit le total
- Où : blackjack.
- Constat : le bouton primaire est rouge (couleur de danger) y compris à 19 ; le joueur hésite à cliquer.
- Proposition : « Tirer » et « Rester » de même poids, rouge réservé à « Abandonner » ; option « conseil » (stratégie de base) affichée en discret.
- Valeur 2 · Effort S · Dépendances : charte (couleurs franches).

#### Q.41 Q-j2-26 : Casino : pas de plafond de mise ni d'alerte
- Où : tous les jeux.
- Constat : on peut miser tous ses jetons d'un clic ; aucun garde-fou, aucune pause après une série de pertes.
- Proposition : réglage optionnel « limite de perte de session » et confirmation au-delà de 50 % du solde.
- Valeur 2 · Effort S · Dépendances : Q-j2-10.

#### Q.42 Q-j2-28 : Carte : toucher Bourg Palette renvoie à l'écran de combat
- Où : Carte, ligne Bourg Palette.
- Constat : le joueur arrive dans l'écran de combat vide (DPS 0) au lieu de voir le lieu.
- Proposition : ouvrir directement la scène du lieu, avec ses sous-lieux.
- Valeur 2 · Effort S · Dépendances : Q-j2-27.

#### Q.43 Q-j2-30 : Badges : un badge ne mène pas à son arène
- Où : Menu > Badges.
- Constat : le joueur voit le nom et l'effet mais pas le champion ni l'arène ; pour un badge manquant, aucune piste.
- Proposition : au toucher, fiche « Arène de Roche, Pierre » avec bouton « Y aller » (carte) et état (battu / à battre).
- Valeur 2 · Effort M · Dépendances : F-j2-10.

#### Q.44 Q-j2-31 : Réglages : taille du texte et contraste élevé absents
- Où : Réglages.
- Constat : aucune option d'accessibilité visuelle ; le texte secondaire des cartes est petit à 390 px.
- Proposition : trois tailles de texte (normal, grand, très grand) et un thème à contraste renforcé dans les jetons.
- Valeur 2 · Effort M · Dépendances : `design/tokens.css`.

#### Q.45 Q-j2-32 : Réglages : le « Relevé de partie (développement) » est visible
- Où : bas de Réglages.
- Constat : une section de développeur est visible par tous les joueurs.
- Proposition : la ranger sous « Avancé » replié (Nicolas s'en sert pour ses tests, donc ne pas la supprimer).
- Valeur 2 · Effort S · Dépendances : aucune.

#### Q.46 Q-j2-35 : Pastille sur la Pension quand un œuf est prêt
- Où : barre du bas, bouton Pension.
- Constat : je n'ai vu aucune pastille ; avec 50 victoires par éclosion, le joueur peut passer à côté d'un œuf prêt.
- Proposition : point de couleur et compteur « 2 » sur le bouton Pension ; message de l'ouverture « Ton œuf est prêt ».
- Valeur 2 · Effort S · Dépendances : calque de notifications (ticket R).

#### Q.47 Q-j1-38 : L'onglet « Tout » du Sac mélange consommables et équipements actifs
- Où : tiroir Sac (`23-390-sac`).
- Constat : « Jeton Shiny ×3 UTILISER » est à côté de « Chaussures Sport ×1 ACTIF ». Les équipements permanents se perdent dans la liste.
- Proposition : une section « Actifs » en tête de liste.
- Valeur 3 · Effort S · Dépendances : aucune.

#### Q.48 Q-j2-39 : Casino : le tableau des gains est loin du bouton d'achat (gratter)
- Où : jeu Gratter.
- Constat : pour savoir ce qu'on peut gagner il faut défiler sous le bouton.
- Proposition : tableau dans un panneau « Gains » replié au-dessus du bouton.
- Valeur 3 · Effort S · Dépendances : aucune.

#### Q.49 Q-j2-44 : Réglages : confirmation d'achat pour les gros montants
- Où : Shop, boutique du casino.
- Constat : un clic sur « Acheter » ou « Max » peut vider 330 000 ₽ sans second contrôle.
- Proposition : réglage « Confirmer les achats de plus de X » (désactivé par défaut) ; annulation pendant 5 s après l'achat.
- Valeur 3 · Effort S · Dépendances : Q-j2-15.

#### Q.50 Q-j2-45 : Raccourcis PC : rien pour le Casino, les Statistiques, les Badges, les Réglages
- Où : fenêtre « Raccourcis » (1–7, C/B/A/T/R/S/F/P, flèches, `/`).
- Constat : les écrans secondaires ne s'atteignent qu'à la souris. À vérifier : la liste exacte dans la fenêtre « Raccourcis » avant d'attribuer des touches.
- Proposition : touches libres pour ces 4 écrans, affichées dans la fenêtre Raccourcis.
- Valeur 3 · Effort S · Dépendances : conflits avec les touches existantes.

## 50 fonctionnalités

#### F.1 F-j1-01 : Dix à trente succès de plus, avec leurs mesures
- Où : `data/succes.json` (7 succès : premiers pas, premier badge, collectionneur 25, éclosions 10/50/100/151) ; mesures `pokedex`, `badges`, `eclosions` seulement.
- Idée : le jeu n'a que trois mesures de succès. Ajouter des mesures (clics totaux, boss battus, captures, shiny capturés, évolutions, niveau 100 atteint, argent total, zones finies) et ~25 succès qui paient quelques diamants, pour qu'un objectif de 3 à 5 minutes (pilier 3) existe toute la partie.
- Valeur 1 · Effort M · Dépendances : mesures dans `src/core`, diamants du compte (phase 4 livrée).

#### F.2 F-j1-02 : Alerte d'arrêt auto : vibration, son et titre d'onglet
- Où : arrêt auto (`ReglagesCombat.tsx`), `sons.ts` (5 tons : `hit`, `coin`, `catch`, `up`, `pc`).
- Idée : quand l'attaque auto s'arrête sur une rareté choisie, le joueur n'est pas forcément à l'écran. Ajouter un ton dédié, `navigator.vibrate` sur téléphone et un titre d'onglet clignotant (« ★ Shiny ! ») sur PC.
- Valeur 1 · Effort S · Dépendances : ticket N (audio) pour le son.

#### F.3 F-j1-03 : « Pendant ton absence » : bilan de session
- Où : retour sur l'onglet après une pause, `store.ts`, page statistiques existante (`StatistiquesPage.tsx`).
- Idée : au retour (ou toutes les 5 minutes d'attaque auto), un encart d'une ligne résume les captures, les nouveautés Pokédex, l'argent gagné, les œufs éclos. Sur téléphone, on laisse tourner et on revient.
- Valeur 1 · Effort M · Dépendances : compteurs de session.

#### F.4 F-j1-04 : Journal des événements récents
- Où : nouveau tiroir, lié à `Notifications.tsx` / `pileNotifications.ts`.
- Idée : liste des 30 derniers événements (capture, échec, shiny, évolution, boss, objet gagné), avec l'heure. Résout aussi la disparition des notifications de 1,2 s (Q-j1-12).
- Valeur 1 · Effort M · Dépendances : Q-j1-12.

#### F.5 F-j1-05 : Avantage de type visible sur l'ennemi
- Où : carte ennemi et cartes d'équipe ; `FichePokemon.tsx` affiche déjà « Type × 1 ».
- Idée : un mot sur l'ennemi (« tes Pokémon font ×1,6 en moyenne ») et un marqueur ×2 / ×0,5 sur chaque membre. Rend la stratégie de type, pilier du vision.md, visible sans calcul.
- Valeur 1 · Effort M · Dépendances : table des types (ticket S) et règle de multiplicateur existante.

#### F.6 F-j1-06 : Aperçu du boss avant le combat
- Où : zone de boss (étape 10), `EcranCombat.tsx`.
- Idée : au toucher du pion « boss », une fiche : type, niveau, PV, chrono, et une estimation « ton DPS actuel le bat en 41 s » contre le chrono de 30 s. Évite de lancer un boss perdu d'avance, ce qui répond à « les boss sont volontairement durs, il faut économiser ».
- Valeur 1 · Effort M · Dépendances : F-j1-05.

#### F.7 F-j1-07 : Équipes enregistrées
- Où : PC / équipe (`PagePC.tsx`), sauvegarde de région.
- Idée : trois emplacements « équipe A, B, C » pour changer de composition en un toucher (équipe anti-Eau, équipe de farm). Aujourd'hui chaque changement de boss demande jusqu'à six échanges.
- Valeur 1 · Effort M · Dépendances : aucune.

#### F.8 F-j1-08 : Liste de chasse
- Où : Pokédex, Radar, Objectifs.
- Idée : épingler jusqu'à 3 espèces à chasser ; elles apparaissent dans le tiroir Objectifs avec leurs zones (déjà dans la fiche Pokédex, ticket I) et une pastille dans la carte ennemi quand l'espèce est la bonne.
- Valeur 1 · Effort M · Dépendances : ticket I (zones d'espèce).

#### F.9 F-j1-09 : Sons par événement : boss, shiny, évolution, éclosion, légendaire
- Où : `sons.ts`, `src/core/reglages.ts:8` (type `Ton` : `hit`, `coin`, `catch`, `up`, `pc`), `data/musiques.json`.
- Idée : cinq tons seulement ; rien ne marque l'arrivée d'un boss, un shiny, une évolution, une éclosion. Ajouter les tons `boss`, `shiny`, `evolution`, `eclosion`, `alerte`. Le ticket N (audio réel) est `a_faire`.
- Valeur 1 · Effort M · Dépendances : ticket N.

#### F.10 F-j1-10 : Compteur de rencontres et chasse au shiny
- Où : fiche Pokédex (`Pokedex.tsx`), `data/reglages.json` (`chanceShiny` 1/512).
- Idée : par espèce, « rencontrés 37, capturés 4, depuis le dernier shiny : 211 ». Donne un sens à la chasse au shiny et un sentiment de progression même quand ça ne tombe pas.
- Valeur 1 · Effort M · Dépendances : compteur par espèce dans la sauvegarde.

#### F.11 F-j1-11 : Coup critique de clic (règle à valider)
- Où : clic d'attaque (`clicBase` 5, plafond 12 clics/s).
- Idée : une chance sur 10 que le clic fasse ×3, avec un nombre doré. Fait « sentir » le clic, pilier 1. Change la règle de dégâts.
- Valeur 1 · Effort M · Dépendances : simulateur d'équilibrage, validation de Nicolas.

#### F.12 F-j2-02 : Donner un usage aux diamants : boutique de skins
- Où : Compte > Diamants et Skins (« Aucun skin débloqué pour l'instant »).
- Constat : 500 diamants dans ma partie de test n'ont aucun usage, aucun catalogue de skins n'existe. Prévu dans vision.md (cosmétiques uniquement).
- Proposition : boutique de diamants avec cosmétiques : cadre de balle, effet de capture, fond d'écran de scène, sprite de dresseur, cadre de profil. Aperçu avant achat. Rien qui touche au gameplay.
- Valeur 1 · Effort L · Dépendances : F-j2-01 ; choix du premier lot de 8 à 10 skins par Nicolas.

#### F.13 F-j2-03 : Quêtes quotidiennes et hebdomadaires
- Où : fenêtre Objectifs, nouvel onglet.
- Constat : les objectifs actuels sont des jalons uniques ; une fois faits, aucune raison de revenir demain.
- Proposition : 3 quêtes par jour (« Gagne 200 combats », « Fais éclore 1 œuf », « Joue 5 parties de casino ») et 1 défi hebdomadaire ; récompenses en jetons, balles ou diamants.
- Valeur 1 · Effort M · Dépendances : F-j2-05. **Règle à valider** (nouvelle source de récompenses).

#### F.14 F-j2-04 : Puits d'argent qui reste utile en fin de partie
- Où : Shop, Centre commercial, économie générale.
- Constat : en fin de partie ma partie de test avait 5 M ₽ sans rien à acheter ; le seul puits répétable est le casino (rendement de 96 %).
- Proposition : « Fondation de Kanto » : investir des ₽ par paliers croissants (100 k, 500 k, 2 M…) pour des bonus permanents modestes (chance de shiny +0,1 %, +1 % d'XP, 1 emplacement de Pension) ; ou boutique premium à prix fixes élevés (Master Ball à 331 500 ₽ déjà là).
- Valeur 1 · Effort L · Dépendances : simulateur d'économie. **Règle à valider.**

#### F.15 F-j2-05 : Page Statistiques complète
- Où : `StatistiquesPage.tsx`.
- Constat : la page n'a que deux statistiques générales (Pokémon vaincus, argent total) plus une liste de bonus.
- Proposition : temps de jeu, captures (dont shiny), évolutions, œufs éclos, argent dépensé par catégorie, jetons gagnés/perdus, parties de casino par jeu, record de dégâts, meilleure série de victoires, plus un graphique d'argent sur 7 jours.
- Valeur 1 · Effort M · Dépendances : compteurs dans le cœur (les sauvegardes existantes démarrent à zéro).

#### F.16 F-j2-06 : Prestige : « Nouvelle partie+ » après le Panthéon
- Où : Panthéon, Compte.
- Constat : le Panthéon clôt la région ; ensuite il ne reste plus d'objectif. Standard des clickers.
- Proposition : recommencer la région avec des bonus permanents (points de prestige selon le temps de Ligue), l'équipe et le Pokédex conservés.
- Valeur 1 · Effort L · Dépendances : ADR région (une région repart déjà de zéro), simulateur. **Règle à valider.**

#### F.17 F-j1-13 : Complétion de zone
- Où : barre de zone, fiche Pokédex (zones), Radar.
- Idée : « Route Victoire 4/5 espèces » dans le Radar, et un petit bonus (balles) à la dernière espèce de la zone. Cohérent avec « chaque zone dit ce qu'il reste à faire ».
- Valeur 2 · Effort M · Dépendances : ticket I. Règle à valider si récompense.

#### F.18 F-j1-14 : Combo de cadence (règle à valider)
- Où : clic d'attaque.
- Idée : un compteur qui monte quand on clique à rythme soutenu (jusqu'au plafond de 12 clics/s) et donne +10 % de dégâts au maximum, retombant en 2 s. Donne un intérêt à cliquer vraiment sans pousser à l'auto-clic.
- Valeur 2 · Effort M · Dépendances : plafond de clics existant ; validation.

#### F.19 F-j1-17 : « Suggérer une équipe » contre le boss
- Où : PC / équipe, F-j1-06.
- Idée : un bouton qui propose les six Pokémon du PC au plus fort DPS contre le boss de la zone, à accepter ou refuser. Aide sans jouer à la place.
- Valeur 2 · Effort M · Dépendances : F-j1-05.

#### F.20 F-j1-18 : Chaînes de capture (règle à valider)
- Où : capture, Radar.
- Idée : capturer la même espèce à la suite augmente un peu la chance de shiny (comme la chaîne du Poké-Radar des jeux). Donne un usage au Radar au-delà de la liste.
- Valeur 2 · Effort M · Dépendances : validation (touche à l'équilibrage R et T).

#### F.21 F-j1-20 : Collection de lignées complètes
- Où : Pokédex (nouvel onglet ou palier).
- Idée : compter les lignées dont on possède les trois stades (Salamèche, Reptincel, Dracaufeu) ; paliers à 10, 25, 50 lignées. Évolution est un geste central et rien ne le célèbre.
- Valeur 2 · Effort M · Dépendances : table d'évolution (données existantes).

#### F.22 F-j1-21 : Records personnels
- Où : `StatistiquesPage.tsx`.
- Idée : plus haut DPS atteint, meilleur temps de boss, plus long combo, plus de captures en une heure, cadence maximale. Statistiques déjà là ; ajouter les records.
- Valeur 2 · Effort S · Dépendances : compteurs.

#### F.23 F-j1-22 : Jauge de cadence
- Où : scène de combat (`ActionsCombat.tsx`).
- Idée : afficher discrètement « 9 / 12 clics par seconde » à côté du bouton Attaquer. Le plafond de 12 est le pilier 1 : le joueur n'a aucun moyen de le voir aujourd'hui.
- Valeur 2 · Effort S · Dépendances : mesure de cadence existante dans le cœur.

#### F.24 F-j1-23 : Carte de dresseur à partager
- Où : Menu / compte.
- Idée : une image générée (équipe, Pokédex, shiny, temps de jeu) à envoyer aux amis, jeu perso et amis. Remplace la capture d'écran.
- Valeur 2 · Effort M · Dépendances : aucune.

#### F.25 F-j1-24 : Objets tenus selon le type (règle à valider)
- Où : fiche (« Objet tenu : aucun », `21-390-fiche`), `data/objets.json`.
- Idée : une famille d'objets (Charbon, Eau Mystique, Aimant…) qui donne +10 % à un type. La fiche affiche déjà un emplacement d'objet tenu ; rien de comparable aujourd'hui.
- Valeur 2 · Effort M · Dépendances : validation, F-j1-05.

#### F.26 F-j1-31 : Boss avec une mécanique propre (règle à valider)
- Où : boss d'arène et Ligue.
- Idée : bouclier de 5 s, soin à 50 %, ou point faible affiché. Casse la répétition « même combat, plus de PV ».
- Valeur 2 · Effort L · Dépendances : validation, F-j1-06, simulateur.

#### F.27 F-j2-08 : Chez Maman : un vrai lieu
- Où : `data/regions/kanto/scenes.json`, Chez Maman (bulle « Il n'y a rien à faire ici, sortons. », téléviseur Daran).
- Constat : le lieu est vide à chaque visite.
- Proposition : Maman donne une récompense du jour (3 Pokéballs ou un Rappel), soigne l'équipe en animation, commente le dernier badge ; la télé diffuse un résumé des stats.
- Valeur 2 · Effort S · Dépendances : F-j2-03. Cadeau quotidien : **règle à valider**.

#### F.28 F-j2-09 : Chez Blue : revanches du rival
- Où : scène Chez Blue ; vision.md prévoit des combats de rival entre certaines zones.
- Constat : le lieu est vide ; aucune raison d'y retourner.
- Proposition : Blue défie le joueur à chaque tranche de 2 badges avec une équipe adaptée ; victoire = objet rare ou diamants ; dialogue qui change selon l'équipe.
- Valeur 2 · Effort L · Dépendances : événements scriptés en données. **Règle à valider.**

#### F.29 F-j2-10 : Galerie des arènes et des champions
- Où : Menu > Badges.
- Constat : les badges sont une grille d'icônes.
- Proposition : une page par arène (portrait du champion, type, équipe, date de la victoire, meilleur temps), avec « Revoir le combat » en défi optionnel.
- Valeur 2 · Effort M · Dépendances : Q-j2-30.

#### F.30 F-j2-12 : Journal de bord
- Où : nouvelle entrée du Menu.
- Constat : le joueur n'a aucune trace des événements marquants (éclosion, shiny, évolution, badge).
- Proposition : fil chronologique daté (« 14:32 – Ton Pikachu a évolué »), filtrable, avec 200 entrées gardées.
- Valeur 2 · Effort M · Dépendances : calque de notifications.

#### F.31 F-j2-14 : Casino : Voltorbe Flip
- Où : Casino, nouveau jeu (comme dans HeartGold / SoulSilver).
- Constat : les 6 jeux actuels sont du hasard pur ou du blackjack ; aucun jeu de déduction.
- Proposition : grille 5×5 de cartes à retourner avec chiffres de somme par ligne/colonne ; gains en jetons par niveau.
- Valeur 2 · Effort M · Dépendances : `data/casino-jeux.json`, rendement réglé au simulateur.

#### F.32 F-j2-15 : Casino : tableau des meilleurs scores et séries
- Où : Casino.
- Constat : aucun but à long terme au casino.
- Proposition : record par jeu (plus grosse mise doublée, série la plus longue au plus ou moins, meilleur blackjack) avec succès liés.
- Valeur 2 · Effort S · Dépendances : F-j2-05.

#### F.33 F-j2-16 : Casino : niveau de fidélité (VIP)
- Où : Casino.
- Constat : jetons offerts une seule fois (100) ; aucune progression.
- Proposition : le total joué fait monter des niveaux (Bronze à Platine) : remise sur la boutique à jetons, jeu exclusif, cadre de profil.
- Valeur 2 · Effort M · Dépendances : F-j2-02. **Règle à valider.**

#### F.34 F-j2-19 : Compagnon qui suit le dresseur
- Où : scènes de lieux, Combat.
- Constat : l'équipe n'apparaît qu'en combat.
- Proposition : un Pokémon au choix marche à côté du dresseur dans Bourg Palette, réagit au toucher (cri, cœur) et donne un petit bonus d'amitié.
- Valeur 2 · Effort M · Dépendances : sprites de marche (à créer). **Règle à valider** pour le bonus.

#### F.35 F-j2-22 : Hall des Fameux amélioré
- Où : Panthéon.
- Constat : le Panthéon est un écran de fin sans trace durable.
- Proposition : chaque victoire enregistre l'équipe, la date et le temps ; galerie consultable ; classement entre amis si le compte le permet.
- Valeur 2 · Effort M · Dépendances : compte en ligne.

#### F.36 F-j2-23 : Ligue : mode revanche de plus en plus dur
- Où : Ligue.
- Constat : une fois la Ligue battue, rejouer ne rapporte rien (simulateur : 87 min).
- Proposition : Ligue+ (niveaux +10, +20…) avec récompenses croissantes, record de niveau atteint.
- Valeur 2 · Effort M · Dépendances : simulateur. **Règle à valider.**

#### F.37 F-j2-24 : Tour de Combat (mode infini)
- Où : Ligue ou Carte.
- Constat : pas de contenu de fin de partie hors prestige.
- Proposition : étages successifs avec champion toutes les 10 manches, sauvegarde du meilleur étage, récompenses en diamants.
- Valeur 2 · Effort L · Dépendances : F-j2-06. **Règle à valider.**

#### F.38 F-j2-28 : Musique par zone et ambiance du casino
- Où : réglage Son, zones, Casino.
- Constat : une seule musique ; B-uia-30 montre que sa reprise est déjà fragile.
- Proposition : une piste par type de lieu (route, grotte, ville, arène, casino), jingle de victoire d'arène.
- Valeur 2 · Effort M · Dépendances : sources audio libres de droit. Voir B-uia-30.

#### F.39 F-j2-29 : Mode daltonien pour les types
- Où : badges de types dans le Combat, le Pokédex, le Shop.
- Constat : les types ne se distinguent que par la couleur dans plusieurs écrans.
- Proposition : réglage qui ajoute une icône ou une lettre à chaque type.
- Valeur 2 · Effort S · Dépendances : Q-j2-31.

#### F.40 F-j2-31 : Labo de Chen : défi rejouable et bilan
- Où : scène Labo (vide aujourd'hui), `data/defi-chen.json`.
- Constat : le Labo ne propose rien après l'intro.
- Proposition : le Prof. Chen commente le Pokédex (étape suivante, espèces manquantes par route) et relance le défi de Chen avec une variante à chaque palier.
- Valeur 2 · Effort M · Dépendances : `defi-chen.json`.

#### F.41 F-j2-33 : Parc Safari
- Où : Carte, ville Parmanie.
- Constat : le Parc Safari n'existe pas dans le jeu.
- Proposition : entrée payante, 30 pas, spawns exclusifs (Kangourex, Scarabrute…), capture avec appât/roche.
- Valeur 2 · Effort L · Dépendances : données de zones. **Règle à valider.**

#### F.42 F-j1-33 : Compendium des objets
- Où : Sac.
- Idée : une page qui liste tous les objets rencontrés avec description, provenance et effet, y compris ceux dont la quantité est à zéro. Résout aussi Q-j1-14.
- Valeur 3 · Effort M · Dépendances : Q-j1-14.

#### F.43 F-j1-39 : Easter egg Missingno
- Où : renommage d'un Pokémon.
- Idée : le nom « Missingno » affiche un sprite déformé (bandes de pixels décalées). Le jeu est un clicker Pokémon de Kanto, la référence est évidente pour ses joueurs.
- Valeur 3 · Effort S · Dépendances : registre des easter eggs.

#### F.44 F-j1-40 : Code Konami sur PC
- Où : raccourcis clavier (`src/ui/raccourcis.ts`).
- Idée : ↑↑↓↓←→←→ B A déclenche une pluie de Pokéballs ou un cri de Mew, une fois par partie. Touche l'écran de combat seulement.
- Valeur 3 · Effort S · Dépendances : aucune.

#### F.45 F-j1-42 : Mannequin d'entraînement
- Où : écran de combat, hors progression.
- Idée : un « sac de sable » de 30 s qui mesure le DPS réel de l'équipe et du clic. Aide à comparer deux compositions sans risquer un boss.
- Valeur 3 · Effort M · Dépendances : F-j1-07.

#### F.46 F-j2-35 : Titres de dresseur
- Où : Compte, carte de dresseur.
- Constat : le nom du joueur est seul.
- Proposition : titre à choisir selon les succès (« Maître des œufs », « Roi du casino »).
- Valeur 3 · Effort S · Dépendances : F-j2-01, F-j2-20.

#### F.47 F-j2-38 : Astuces au chargement
- Où : écran de démarrage, Guide du jeu.
- Constat : le Guide est une page à part que peu ouvriront.
- Proposition : une astuce (« La Pension donne une chance de ponte à chaque victoire ») sous le chargement, tirée d'une liste de 40.
- Valeur 3 · Effort S · Dépendances : liste de textes.

#### F.48 F-j2-39 : Crédits avec les statistiques du joueur
- Où : `Credits.tsx` (bouton « Passer » présent).
- Constat : crédits non vus à l'écran ; le code montre un défilement standard.
- Proposition : fin de crédits avec temps de jeu, nombre de Pokémon, shiny, badges.
- Valeur 3 · Effort S · Dépendances : F-j2-05.

#### F.49 F-j2-41 : Installation comme application (PWA)
- Où : vision.md liste « PWA » parmi les technologies ; aucune occurrence de manifest ou de service worker dans `src`, `data`, `docs` (à vérifier dans `vite.config`).
- Constat : sur iPhone le jeu se lance dans Safari avec la barre du navigateur.
- Proposition : manifeste, icônes, mode plein écran ; invitation « Ajouter à l'écran d'accueil » une fois.
- Valeur 3 · Effort M · Dépendances : vérifier l'existant (valeur à relever si rien n'est en place).

#### F.50 F-j2-43 : Loterie gratuite quotidienne
- Où : Centre commercial.
- Constat : aucune gratification de connexion.
- Proposition : un ticket gratuit par jour qui donne de petits lots (balles, jetons, rarement un diamant).
- Valeur 3 · Effort S · Dépendances : F-j2-03. **Règle à valider.**

