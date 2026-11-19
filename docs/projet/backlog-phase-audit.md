# Backlog, correctifs et propositions de l'audit du 19/11/2026

Source : `docs/projet/audit-2026-11-19/decisions.md` (réponses de Nicolas). Chaque case renvoie à une fiche de `synthese.md`. Un lot se coche quand toutes ses cases le sont.

| n | Ticket | Effort |
|---|---|---|
| 1 | A. bugs et validation des sauvegardes | 8 à 14 j |
| 2 | B. bugs, sécurité des comptes, déploiement et CI | 13 à 24 j |
| 3 | C. synchro, compte et persistance côté jeu | 8 à 14 j |
| 4 | D. bugs d'affichage et améliorations de confort | 8 à 14 j |
| 5 | E. qualité du code | 28 à 50 j |
| 6 | F. fonctionnalités validées par l'audit | 17 à 31 j |

## A. `fix(core): bugs et validation des sauvegardes`

`etat:en_cours` `est:8-14` `prio:1` · branche : `v2` · périmètre : src/core · 33 éléments

### Histoire
Cœur : sauvegardes corrompues, import, pension, casino, validation des données. Éléments choisis par Nicolas le 19/11/2026.

### Critères d'acceptation
- [x] `B-core-01` Une seule partie corrompue casse toute la liste des parties (effort S)
- [x] `B-core-02` Une sauvegarde corrompue ne peut plus jamais être réécrite ni réparée (effort M)
- [x] `B-core-03` Le Repousse fausse la distribution des rencontres (effort S)
- [x] `B-core-04` Le relâchement automatique peut laisser une équipe composée uniquement d'œufs (effort S)
- [x] `B-core-05` Un œuf peut être déposé comme parent à la pension (effort S)
- [x] `B-core-06` Un `starterId` autre que 1, 4 ou 7 fait planter le combat d'événement (effort S)
- [x] `B-core-07` `reprendreCombat` plante si l'étape dépasse celles de la zone (effort M)
- [x] `B-core-08` Création, import et installation de version ne sont pas atomiques (effort M)
- [x] `B-core-09` L'export de secours échoue dès qu'une région est illisible, et n'emporte pas le compte (effort M)
- [x] `B-core-10` L'argent devient flottant à chaque victoire (effort S)
- [ ] `B-core-11` Boosts et recharge du Fauchage reposent sur l'horloge système (effort M) — décidé, lot 3 (temps hors ligne ne compte pas)
- [x] `B-core-12` L'arrêt automatique annonce « shiny » alors que le shiny n'est pas la cause (effort S)
- [x] `B-core-15` Le sabot de blackjack est reconstruit en pleine main avec des cartes déjà sorties (effort S)
- [x] `B-core-16` `acheterJetons` n'a pas de plafond : des jetons au-delà de 2^53 rendent la région non sauvegardable (effort S)
- [x] `B-core-17` `renommerPartie` ne change ni la révision ni la date d'écriture (effort S)
- [x] `B-core-20` Le message d'achat d'une amélioration affiche toujours « CT Jackpot » (effort S)
- [x] `B-core-21` Le casino revend sans limite un Pokémon déjà possédé (effort S)
- [x] `B-core-35` `relacher` isolé ne contrôle pas le favori (effort S)
- [x] `B-core-36` Le Jeton Shiny serait applicable à un œuf (effort S)
- [x] `B-core-37` `couplePonte` : l'espèce du parent sert de clé sans filtrer les œufs (effort S)
- [x] `B-core-38` Un Pokémon de pension éclot avec une chance chromatique non bornée par 1 (effort S) — sans objet : `reglages.ts` rejette déjà un réglage qui ferait dépasser 1
- [x] `S-core-01` Validation de région incomplète : une sauvegarde « valide » peut planter le chargement (effort M)
- [x] `S-core-02` Aucun plafond numérique : `Infinity` et débordements atteignables (effort M)
- [x] `S-core-03` Niveau, calcium et bonheur au-delà des maxima du jeu (effort S)
- [x] `S-core-04` Identifiants (`uid`) dupliqués acceptés dans l'équipe, le PC et la pension (effort S)
- [x] `S-core-05` Listes sans borne ni dédoublonnage (déni de service local) (effort M)
- [x] `S-core-06` L'import n'a aucune limite de taille ni de coût (effort S)
- [x] `S-core-07` Import et sauvegarde acceptent des régions que le jeu ne prévoit pas (effort S)
- [x] `S-core-12` `evenementEnCours` contourne `eligible` et `evenementsJoues` (effort M) — fait pour les événements déjà joués ; le catalogue est injecté par le store, son contrôle reste au moteur
- [x] `S-core-15` Chaînes sans longueur maximale ; `creerPartie` n'applique pas la limite de `renommerPartie` (effort S)
- [x] `S-core-28` Erreurs de stockage non gérées dans le cœur (effort M)
- [x] `S-core-31` Un `evenementEnCours.etape`/`file` hors catalogue peut planter la lecture de la commande (effort S) — sans objet : le moteur ignore déjà un état hors catalogue (`commandeCourante`, `avancer`)
- [x] `S-core-34` Messages d'erreur de validation renvoyés tels quels à l'utilisateur (effort S)
- [x] Les vérifications du dépôt passent (tsc, eslint, vitest ciblé) et le diff est relu.

---

## B. `fix(serveur): bugs, sécurité des comptes, déploiement et CI`

`etat:fait` `est:13-24` `prio:1` · branche : `v2` · périmètre : server/, scripts/, .github/ · 40 éléments

### Histoire
Serveur : comptes, limites d'envoi, en-têtes, Docker, CI, scripts. Éléments choisis par Nicolas le 19/11/2026.

### Critères d'acceptation
- [x] `B-srv-01` Historique « de rotation » écrit à chaque envoi mais jamais lisible par aucune route (effort M) — décidé : rotation supprimée
- [x] `B-srv-03` `DELETE /parties/:id` sans `revisionBase` : détruit aussi toutes les versions, donc irréversible (effort M) — serveur fait ; le client doit encore envoyer `revisionBase` (questions-lot-2.md, point 7)
- [x] `B-srv-04` Date impossible silencieusement déplacée (`2024-02-31` devient le 2 mars) (effort S)
- [x] `B-srv-05` `ecrit_le` est choisi par le client : futur lointain accepté, ordre et comparaisons dépendants de l'horloge de l'appareil (effort M)
- [x] `B-srv-06` Aucun écouteur `error` sur le pool pg ni `unhandledRejection` : une coupure de connexion inactive plante le processus (effort S)
- [x] `B-srv-08` Le gestionnaire de tâches de fond avale toutes les erreurs : un e-mail de réinitialisation perdu n'est ni tracé ni signalé (effort M)
- [x] `B-srv-10` Une divergence de plus de 3 Mo ne peut pas être archivée : le client reste bloqué en « divergence » (effort M)
- [x] `B-srv-14` Risque d'écrasement sans conflit après suppression puis recréation d'une région (révision 1 réutilisée) (effort M)
- [x] `S-srv-01` Inscription ouverte, sans vérification d'e-mail, avec un stockage par compte quasi illimité (effort M) — sans objet : Nicolas laisse l’inscription ouverte (questions-lot-2.md)
- [x] `S-srv-02` `PUT /api/sauvegarde` : nombre de régions non borné avant la boucle SQL (amplification) (effort S)
- [x] `S-srv-03` Énumération de comptes à l'inscription (effort M) — sans objet : décision identique à S-srv-01
- [x] `S-srv-04` `TRUSTED_PROXIES` vide en production n'est ni refusé ni signalé (effort S) — avertissement au démarrage, pas de refus (questions-lot-2.md, point 8)
- [x] `S-srv-05` Pas de limite par adresse e-mail pour la réinitialisation : bombardement d'un tiers et épuisement du quota SMTP (effort M)
- [x] `S-srv-07` Aucune route de suppression ni d'export de compte (droit à l'effacement) (effort M)
- [x] `S-srv-08` `bearer()` sans `requireSignature` (effort S)
- [x] `S-srv-09` Surface `/api/auth/*` non réduite (effort S)
- [x] `S-srv-10` Pas de révocation des autres sessions au changement de mot de passe, session de 7 jours (effort M) — `change-password` n’est plus exposé ; session de 30 jours glissants
- [x] `S-srv-12` SMTP en clair accepté en production ; STARTTLS non exigé (effort S)
- [x] `S-srv-13` Secrets factices acceptés en production (effort S)
- [x] `S-srv-15` Pas de contrôle d'origine ni de type de contenu sur `/api/sauvegarde` alors que le cookie de session est accepté (effort S)
- [x] `S-srv-16` Création de partie : l'identifiant d'un autre compte renvoie 404, un identifiant libre 200 (effort S)
- [x] `S-srv-17` Images non épinglées et installation avec scripts dans l'étape de build (effort S)
- [x] `S-srv-18` Conteneur non durci (effort S)
- [x] `S-srv-19` Pas de TLS configuré vers Postgres (effort S)
- [x] `S-srv-20` Un seul rôle SQL pour migrer et servir (effort M) — `DATABASE_MIGRATION_URL` supporté ; créer les deux rôles en production (questions-lot-2.md, point 11)
- [x] `S-srv-21` Pas de Dependabot, d'audit npm en CI, ni de `permissions:` dans les workflows ; actions épinglées par étiquette (effort S)
- [x] `S-srv-22` Journalisation insuffisante pour détecter une attaque, et PII possible dans les messages d'erreur SMTP (effort M)
- [x] `S-srv-23` Champs `name`/`image` d'inscription non bornés (jusqu'à 100 Ko) (effort S)
- [x] `S-srv-24` Racine : `.env` non ignoré par git (effort S)
- [x] `S-srv-25` `debug.log` versionné (effort S)
- [x] `S-srv-27` API : CSP et en-têtes d'isolement absents ; HSTS sans `includeSubDomains` (effort S)
- [x] `Q-srv-01` Le serveur n'est pas dans la CI : ni typecheck, ni tests, ni build (effort M)
- [x] `Q-srv-02` 16 scripts `extraire-*-v1` recopient le même chargeur `vm`, sans module partagé (effort M) — scripts supprimés
- [x] `Q-srv-03` `sauvegarde.ts` : 500 lignes mélangeant validation, routes et SQL ; sept copies du motif connect/BEGIN/COMMIT/ROLLBACK/release (effort M)
- [x] `Q-srv-04` Plafonds et durées codés en dur, dispersés dans trois fichiers et quatre requêtes SQL (effort S)
- [x] `Q-srv-05` Tests absents pour `index.ts`, `migrate.ts`, arrêt, transport SMTP et en-têtes de production ; aucune mesure de couverture (effort M)
- [x] `Q-srv-07` Stockage : tout en `jsonb` dans Postgres, copies complètes à chaque envoi, aucune stratégie S3 ni compression (effort L) — reporté par Nicolas (hors de ce lot)
- [x] `Q-srv-12` Migrations en tableau de chaînes, sans somme de contrôle ni test depuis un état réel N-1 ; SQL documenté en double (effort M) — `docs/migrations/0003-versions-origine.sql` laissé en copie documentaire
- [x] `Q-srv-16` Deux versions de TypeScript et de `@types/node`, plages `^` côté serveur, préversion en devDependency (effort S)
- [x] `Q-srv-17` Deux dépôts npm séparés, sans espace de travail ; le serveur est invisible depuis la racine (effort S)
- [x] Les vérifications du dépôt passent (tsc, eslint, vitest ciblé) et le diff est relu.

---

## C. `fix(synchro): synchro, compte et persistance côté jeu`

`etat:a_faire` `est:8-14` `prio:1` · branche : `v2` · périmètre : src/ui synchro, compte, persistance · 28 éléments

### Histoire
Jeton, déconnexion, conflits entre onglets, erreurs d'écriture, ErrorBoundary, CSP. Éléments choisis par Nicolas le 19/11/2026.

### Critères d'acceptation
- [ ] `B-uib-01` Sauvegarde de fermeture coupée au-delà de 60 000 octets (effort M)
- [ ] `B-uib-02` Écriture région puis partie non atomique : état local incohérent si la seconde échoue (effort M)
- [ ] `B-uib-04` Après une erreur d'écriture, les réglages son et préférences sont perdus sans message (effort S)
- [ ] `B-uib-05` Réponse 200 dont le JSON est illisible : statut « hors ligne » et révision acceptée non retenue (effort S)
- [ ] `B-uib-06` Une entrée locale corrompue casse toute la liste des parties (effort S)
- [ ] `B-uib-07` Bouton « Salle » actif pendant une animation : message de résultat perdu (effort S)
- [ ] `B-uib-08` Tutoriel : la carte ne prend pas le focus et n'écoute pas Échap (effort M)
- [ ] `B-uib-09` Espace et Entrée liés à « attaquer » : double action possible sur un bouton focalisé (effort S)
- [ ] `B-srv-02` Un PUT dont la réponse est perdue fabrique une fausse divergence et peut faire perdre les dernières secondes (effort M)
- [ ] `B-uib-12` Verrou `actif.current` du vol de Pokémon jamais relâché si `allerVers` lève (effort S)
- [ ] `B-uib-17` « Pas assez d'argent. » affiché pour toute raison de non-achat (effort S)
- [ ] `B-uib-18` Quantité non remise à 1 au changement de sélection (effort S)
- [ ] `B-srv-21` Tout 4xx (hors 408/429) bloque la synchro jusqu'au rechargement du jeu (effort S)
- [ ] `S-uia-02` Aucune CSP dans `index.html` (effort M)
- [ ] `S-uia-12` Aucun ErrorBoundary : une exception de rendu détruit la partie affichée (effort M)
- [ ] `S-uib-01` Jeton Bearer stocké en clair dans `localStorage` (effort L)
- [ ] `S-uib-02` Déconnexion sans réessai : le jeton peut rester valide côté serveur (effort M)
- [ ] `S-uib-03` Les parties locales ne sont pas rattachées au compte : possible mélange entre comptes sur un même appareil (effort M)
- [ ] `S-uia-01` Jeton magique lu dans l'URL, retiré après coup seulement (effort S)
- [ ] `S-uia-03` `?debug=carte` actif en production (effort S)
- [ ] `S-uia-04` Détails d'erreur internes affichés à l'écran (effort S)
- [ ] `S-uia-10` Chemins d'assets construits depuis des surnoms sans liste blanche (effort S)
- [ ] `S-uib-05` Porte dérobée de développement active en production (effort S)
- [ ] `S-uib-07` Partie locale de l'e-mail envoyée comme `name` (effort S)
- [ ] `S-uib-08` URL de l'API construite sans contrôle de `VITE_API_URL` (effort S)
- [ ] `S-uib-10` Message d'erreur technique affiché tel quel à l'utilisateur (effort S)
- [ ] `S-uib-11` Aucune borne de longueur sur e-mail et mot de passe côté client (effort S)
- [ ] `S-uib-13` Toute erreur de validation de session autre que 401 laisse la session « valide » (effort S)
- [ ] Les vérifications du dépôt passent (tsc, eslint, vitest ciblé) et le diff est relu.

---

## D. `feat(ui): bugs d'affichage et améliorations de confort`

`etat:a_faire` `est:8-14` `prio:1` · branche : `v2` · périmètre : src/ui écrans · 46 éléments

### Histoire
Écrans de combat, PC, Pokédex, Shop, Pension, Casino, Réglages. Éléments choisis par Nicolas le 19/11/2026.

### Critères d'acceptation
- [ ] `B-uia-01` Sélecteur d'objet laissé ouvert à 0 objet (état Zustand périmé) (effort S)
- [ ] `B-uia-07` Date de diplôme invalide : écran blanc (aucun ErrorBoundary) (effort S)
- [ ] `B-uia-02` Message d'objet identique non ré-annoncé, minuteur non relancé (effort S)
- [ ] `B-uia-04` Gain de casino masqué si le jeu est quitté pendant un tour (effort S)
- [ ] `B-uia-09` Double déclenchement possible sur la carte (clic + fin de pointeur) (effort S)
- [ ] `B-uia-12` « Vol en cours vers undefined… » possible (effort S)
- [ ] `B-uia-25` Bouton d'objectif et carte ennemie se chevauchent possiblement à 390 px (effort S)
- [ ] `B-uia-27` Badge `cache` encore cliquable (effort S)
- [ ] `Q-j1-01` La carte « Objectifs » masque le niveau et les PV de l'ennemi à 390 px (effort S)
- [ ] `Q-j1-02` La bulle du Prof. Chen cache les boutons dont elle parle (effort S)
- [ ] `Q-j1-04` Aucune façon de passer les dialogues d'intro (effort S)
- [ ] `Q-j1-05` Deux boutons de combat sont des interrupteurs, deux ouvrent un tiroir, tous quatre se ressemblent (effort S)
- [ ] `Q-j1-07` PC sur téléphone : les filtres remplissent un écran avant la liste (effort M)
- [ ] `Q-j1-09` La fiche Pokémon affiche des libellés qu'on ne peut pas décoder (effort S)
- [ ] `Q-j1-11` Le PC ne montre ni ne filtre les types (effort M)
- [ ] `Q-j1-13` Échange d'équipe à l'aveugle : aucun écart de DPS affiché (effort M)
- [ ] `Q-j1-14` Les objets du Sac n'ont aucune description (effort S)
- [ ] `Q-j1-16` Relâcher par lot : aucun « tout sélectionner » (effort S)
- [ ] `Q-j2-01` Libellés accessibles qui contredisent le texte visible (effort S)
- [ ] `Q-j2-02` Formater tous les nombres de la même façon (effort S)
- [ ] `Q-j2-03` Clé brute « objet:omniExp (x2) » dans les statistiques (effort S)
- [ ] `Q-j2-05` Les 21 zones sont toutes listées « fermée » dès le début (effort S)
- [ ] `Q-j2-07` Un bouton « Retour » qui ne revient pas d'où l'on vient (effort S)
- [ ] `Q-j2-08` Pension : la note « Espèce inconnue… » recouvre « Retirer Pikachu » (effort S)
- [ ] `Q-j2-09` Shop : bouton d'achat sans indication quand on ne peut pas payer (effort S)
- [ ] `Q-j2-10` Casino : aucun bilan de session (effort M)
- [ ] `Q-j2-11` Casino : pas de « Rejouer la même mise » (effort S)
- [ ] `Q-j2-12` Réglages : pas de bascule son depuis l'écran de jeu (effort S)
- [ ] `Q-j1-17` Le nom de la zone est coupé dans l'en-tête à 390 px (effort S)
- [ ] `Q-j1-20` Les tiroirs Sac, Radar, Objectifs et Réglage ne se ferment qu'avec « Fermer » (effort S)
- [ ] `Q-j1-24` Sur un boss, Capturer est grisé sans raison visible (effort S)
- [ ] `Q-j1-25` « Suivant » est grisé sans dire pourquoi (effort S)
- [ ] `Q-j1-26` Le chrono du boss ne prévient pas quand il reste peu de temps (effort S)
- [ ] `Q-j1-27` Le tri et le filtre du PC repartent de zéro à chaque ouverture (effort S)
- [ ] `Q-j1-28` On ne retrouve pas le Pokémon qu'on vient de capturer dans le PC (effort M)
- [ ] `Q-j1-33` « Effets actifs : Aucun » alors que le Sac montre des objets « ACTIF » (effort S)
- [ ] `Q-j1-34` Changer de balle n'a pas d'écran de choix (effort S)
- [ ] `Q-j2-14` Shop : le prix après inflation n'est pas expliqué (effort S)
- [ ] `Q-j2-23` Pension : liste des parents sans tri par compatibilité (effort M)
- [ ] `Q-j2-25` Casino : bouton rouge sur « Tirer » quel que soit le total (effort S)
- [ ] `Q-j2-26` Casino : pas de plafond de mise ni d'alerte (effort S)
- [ ] `Q-j2-28` Carte : toucher Bourg Palette renvoie à l'écran de combat (effort S)
- [ ] `Q-j2-32` Réglages : le « Relevé de partie (développement) » est visible (effort S)
- [ ] `Q-j2-35` Pastille sur la Pension quand un œuf est prêt (effort S)
- [ ] `Q-j1-38` L'onglet « Tout » du Sac mélange consommables et équipements actifs (effort S)
- [ ] `Q-j2-39` Casino : le tableau des gains est loin du bouton d'achat (gratter) (effort S)
- [ ] Les vérifications du dépôt passent (tsc, eslint, vitest ciblé) et le diff est relu.

---

## E. `refactor: qualité du code`

`etat:a_faire` `est:28-50` `prio:1` · branche : `v2` · périmètre : tout le dépôt, à faire en dernier · 41 éléments

### Histoire
Doublons, découpage de store.ts, EcranCombat, CarteKanto, PagePC, serveur. Éléments choisis par Nicolas le 19/11/2026.

### Critères d'acceptation
- [ ] `Q-core-01` `validerForme` existe en deux variantes divergentes (effort S)
- [ ] `Q-core-02` Validateurs primitifs recopiés dans cinq modules (effort M)
- [ ] `Q-core-03` Constantes de règles dupliquées entre code et données (effort M)
- [ ] `Q-core-04` Clés d'objets en dur dans le code (effort M)
- [ ] `Q-core-05` Singleton `kanto` et `'kanto'` en dur : le cœur ne gère pas plusieurs régions (effort L)
- [ ] `Q-core-06` Le cœur « pur » dépend de Vite (`import.meta.glob`) (effort M)
- [ ] `Q-core-07` Réglages : validation partielle et cast direct (effort L)
- [ ] `Q-core-08` Protocole de clés d'effets implicite (`badge:x`, `jalon:n`, `objet:y`) (effort M)
- [ ] `Q-uia-01` Motif de dialogue modal copié dans ~14 composants (effort M)
- [ ] `Q-uia-03` `EcranCombat.tsx` géant (effort L)
- [ ] `Q-uia-04` `PartieConnectee` : ≈ 250 lignes, 12 états (effort L)
- [ ] `Q-uia-05` Logique métier dans l'UI : `appliquer` un objet (effort M)
- [ ] `Q-uia-06` Identifiants de lieux et noms de zones en dur (effort M)
- [ ] `Q-uia-08` Chemins d'assets `img/...` en dur (effort M)
- [ ] `Q-uia-13` `CarteKanto.tsx` : fichier trop long et mélangeant geste, rendu, a11y (effort L)
- [ ] `Q-uib-01` `store.ts` : 1424 lignes, toutes les responsabilités dans un objet d'actions unique (effort L)
- [ ] `Q-uib-02` Mémoïsation par `JSON.stringify`, ~12 sérialisations par tick (effort M)
- [ ] `Q-uib-03` Ajouter un objet utilisable impose d'éditer une chaîne de ternaires (effort M)
- [ ] `Q-uib-04` `store-capture.ts` décide par comparaison de textes d'erreur (effort S)
- [ ] `Q-uib-05` Erreurs avalées en silence dans la synchro et le store (effort S)
- [ ] `Q-uib-08` Mini-jeux du casino : même squelette dans quatre fichiers (effort M)
- [ ] `Q-uib-09` `Pokedex.tsx` et `PokedexTelephone.tsx` dupliquent filtre et fiche (effort M)
- [ ] `Q-uib-10` Deux arbres de rendu pilotés par JavaScript (`useTelephone`) au lieu du CSS (effort L)
- [ ] `Q-uib-11` `PagePC.tsx` : composant de 419 lignes, ~20 `useState`, fonctions imbriquées, `pokemon` masqué (effort L)
- [ ] `Q-uib-12` PC : sélection en lot en O(n²) et grille non virtualisée (effort M)
- [ ] `Q-uib-13` Constantes de jeu écrites en dur dans l'UI (effort S)
- [ ] `Q-core-09` Un objet, deux identifiants (`candy` / `bonbon`) (effort S)
- [ ] `Q-core-10` `casino.ts` mélange validation, boutique, jetons, machine, pile ou face et ré-exports ; le reste est dans `jeux-casino.ts` (effort M)
- [ ] `Q-core-13` Fonctions longues dans le cœur (effort M)
- [ ] `Q-core-14` Types faibles : `as`, `!` et `Record<string, unknown>` en cascade (effort L)
- [ ] `Q-core-15` `rattraperEspecesEcloses` et `rattraperDex` refont la logique de `noterObtention` (effort M)
- [ ] `Q-core-16` Champs optionnels hérités de versions anciennes, d'où des `?? []` partout (effort M)
- [ ] `Q-core-21` Logique d'évolution reconstruite dans trois modules (effort S)
- [ ] `Q-core-22` `chargerPokemon()` appelé dans dix modules du cœur (effort S)
- [ ] `Q-core-23` Textes du jeu en dur dans le cœur, dont certains dupliqués (effort M)
- [ ] `Q-core-24` Descriptions de bonus dupliquées en texte libre (effort M)
- [ ] `Q-core-35` Aucune évolutivité pour un type de combat ou une région supplémentaire (effort L)
- [ ] `Q-uia-10` `BarreLaterale` et `Navigation` dupliquées (effort M)
- [ ] `Q-uia-11` `DetailBadge` en deux versions différentes (effort M)
- [ ] `Q-uia-18` Singleton audio créé à l'import (effort M)
- [ ] `Q-uib-16` Logique métier d'éclosion dans l'UI (effort M)
- [ ] Les vérifications du dépôt passent (tsc, eslint, vitest ciblé) et le diff est relu.

---

## F. `feat: fonctionnalités validées par l'audit`

`etat:a_faire` `est:17-31` `prio:1` · branche : `v2` · périmètre : selon la fonctionnalité · 33 éléments

### Histoire
33 fonctionnalités, une à la fois avec feu vert de Nicolas avant chaque début. Éléments choisis par Nicolas le 19/11/2026.

### Critères d'acceptation
- [ ] `F-j1-01` Dix à trente succès de plus, avec leurs mesures (effort M)
- [ ] `F-j1-02` Alerte d'arrêt auto : vibration, son et titre d'onglet (effort S)
- [ ] `F-j1-05` Avantage de type visible sur l'ennemi (effort M)
- [ ] `F-j1-06` Aperçu du boss avant le combat (effort M)
- [ ] `F-j1-07` Équipes enregistrées (effort M)
- [ ] `F-j1-10` Compteur de rencontres et chasse au shiny (effort M)
- [ ] `F-j2-02` Donner un usage aux diamants : boutique de skins (effort L)
- [ ] `F-j2-03` Quêtes quotidiennes et hebdomadaires (effort M)
- [ ] `F-j2-05` Page Statistiques complète (effort M)
- [ ] `F-j2-06` Prestige : « Nouvelle partie+ » après le Panthéon (effort L)
- [ ] `F-j1-13` Complétion de zone (effort M)
- [ ] `F-j1-18` Chaînes de capture (règle à valider) (effort M)
- [ ] `F-j1-20` Collection de lignées complètes (effort M)
- [ ] `F-j1-21` Records personnels (effort S)
- [ ] `F-j1-22` Jauge de cadence (effort S)
- [ ] `F-j1-23` Carte de dresseur à partager (effort M)
- [ ] `F-j1-24` Objets tenus selon le type (règle à valider) (effort M)
- [ ] `F-j2-09` Chez Blue : revanches du rival (effort L)
- [ ] `F-j2-14` Casino : Voltorbe Flip (effort M)
- [ ] `F-j2-15` Casino : tableau des meilleurs scores et séries (effort S)
- [ ] `F-j2-16` Casino : niveau de fidélité (VIP) (effort M)
- [ ] `F-j2-22` Hall des Fameux amélioré (effort M)
- [ ] `F-j2-23` Ligue : mode revanche de plus en plus dur (effort M)
- [ ] `F-j2-28` Musique par zone et ambiance du casino (effort M)
- [ ] `F-j2-31` Labo de Chen : défi rejouable et bilan (effort M)
- [ ] `F-j2-33` Parc Safari (effort L)
- [ ] `F-j1-39` Easter egg Missingno (effort S)
- [ ] `F-j1-40` Code Konami sur PC (effort S)
- [ ] `F-j1-42` Mannequin d'entraînement (effort M)
- [ ] `F-j2-35` Titres de dresseur (effort S)
- [ ] `F-j2-38` Astuces au chargement (effort S)
- [ ] `F-j2-39` Crédits avec les statistiques du joueur (effort S)
- [ ] `F-j2-41` Installation comme application (PWA) (effort M)
- [ ] Les vérifications du dépôt passent (tsc, eslint, vitest ciblé) et le diff est relu.

---

