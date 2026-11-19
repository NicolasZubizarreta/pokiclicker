# Audit du cœur : `src/core/`, `data/`, `src/pwa/` (19/11/2026)

Lecture seule, branche `v2`. Périmètre : les 119 fichiers de `src/core` (sources lues en entier, tests survolés par grep et lecture ciblée, pas relus ligne à ligne), les JSON de `data/` utiles aux règles (`reglages`, `casino`, `casino-jeux`, `sexes`, `evolutions`, `jalons`, `objets`, `zones`, `equilibrage`, `pokemon`), `src/pwa/` (3 fichiers, rien à signaler).

Vérifié par calcul sur les données : aucune évolution ne change de catégorie de sexe, aucun cycle dans `evolutions.json`, chaque zone a des `apparition` qui totalisent 1 (la Ligue n'a pas de sauvages), aucun boss capturable aujourd'hui. Rendements casino calculés depuis les JSON : machine à sous 91,2 %, carte à gratter 92,0 %, roulette 97,3 %, plus ou moins 96 %, pile ou face 100 %. Aucune lecture de `__proto__` dangereuse trouvée dans la validation (les clés propres `__proto__` d'un JSON restent des données).

Rappel de cadre : `docs/vision.md` (ligne 46) accepte la triche par sauvegarde modifiée entre amis. Les entrées de sécurité sont donc classées par risque réel (corruption, blocage, plantage, avantages inattendus), pas par « le joueur peut se donner de l'argent ».

Gravité : 1 critique, 2 notable, 3 mineur. Effort : S, M, L.

---

## 1. BUGS (38)

**B-core-01 — Une seule partie corrompue casse toute la liste des parties**
`src/core/sauvegarde.ts:154-160` (et `:161-167`)
Preuve : `listerParties()` fait `chargerPartie(...)` puis `exiger(partie, ...)` sans `try/catch` ; `charger` lève « Cette sauvegarde est illisible » dès qu'une enveloppe échoue à la validation. `partieCourante()` retombe sur `this.listerParties()` quand le pointeur est illisible : l'écran de choix et le démarrage échouent pour toutes les parties à cause d'une seule.
Gravité : 1 · Correctif : isoler chaque partie dans un `try/catch` et renvoyer les parties lisibles plus une liste « illisibles » (id + raison) à exporter ou supprimer. · Effort : S

**B-core-02 — Une sauvegarde corrompue ne peut plus jamais être réécrite ni réparée**
`src/core/sauvegarde.ts:74-79`
Preuve : `ecrire` commence par `const avant = charger(cle, ...)`, qui lève si l'existant est invalide. Une région dont `zoneId` ou un champ ne valide plus fait échouer chaque sauvegarde automatique, donc aucune écriture, donc aucune réparation possible par le jeu.
Gravité : 1 · Correctif : n'exiger la lecture de `avant` que pour `revisionAttendue` et, en cas d'illisible, repartir de la révision 1 (ou d'une révision de secours) ; garder l'ancienne valeur sous une clé `.corrompue`. · Effort : M

**B-core-03 — Le Repousse fausse la distribution des rencontres**
`src/core/ennemis.ts:22-36`
Preuve : le filtre retire des sauvages, les `apparition` restantes ne totalisent plus 1, et `rencontre` vaut `pool[0]` par défaut. Route 1 avec Repousse (exclut `commun`) : restent 20 (0,10), 17 (0,05), 1 (0,05) ; un tirage au-dessus de 0,20 (80 % des cas) retombe sur `pool[0]`, soit Rattatac 90 % / Rattata… 5 % / Bulbizarre 5 % au lieu de 50 / 25 / 25. Le Super Repousse (exclut commun et peu commun) laisse un seul Pokémon : 100 %.
Gravité : 2 · Correctif : normaliser le tirage sur la somme des `apparition` du pool filtré (`tirage * somme`). · Effort : S

**B-core-04 — Le relâchement automatique peut laisser une équipe composée uniquement d'œufs**
`src/core/relache-auto.ts:23-27`
Preuve : `retirerDeLEquipe` ne garde un membre que si l'équipe devient vide ; il ne vérifie pas `dernierActif` comme `equipe.ts:51`. Équipe `[œuf, doublon éclos]` : on relâche le doublon, l'équipe est `[œuf]`, sans Pokémon capable de combattre. À confirmer par un test ciblé.
Gravité : 2 · Correctif : réutiliser `dernierActif`/`relacher` et garder au moins un Pokémon non œuf. · Effort : S

**B-core-05 — Un œuf peut être déposé comme parent à la pension**
`src/core/pension.ts:23-32`
Preuve : `deposerParent` ne teste pas `pokemon.oeuf`. L'œuf devient parent, `couplePonte` (`:103-113`) lit son `numero` et son `sexe` (espèce censée être cachée) ; la validation de sauvegarde accepte un parent avec `oeuf` (`sauvegarde-validation.ts:147`, aucune interdiction). À confirmer par script.
Gravité : 2 · Correctif : refuser `pokemon.oeuf` dans `deposerParent` et dans la validation de `pension.parents`. · Effort : S

**B-core-06 — Un `starterId` autre que 1, 4 ou 7 fait planter le combat d'événement**
`src/core/combat-evenement.ts:9`, `src/core/starter.ts:21-29`
Preuve : `commande.equipes[(starterId ?? 1) as 1 | 4 | 7]` renvoie `undefined` pour tout autre numéro, puis `.map` lève. `choisirStarter` accepte n'importe quel Pokémon et la validation de sauvegarde n'exige que `positif` (`sauvegarde-validation.ts:142`).
Gravité : 2 · Correctif : valider `starterId ∈ {1,4,7}` (donnée de la région) dans `choisirStarter` et à la validation ; repli explicite dans `equipeDe`. · Effort : S

**B-core-07 — `reprendreCombat` plante si l'étape dépasse celles de la zone**
`src/core/combat.ts:104`
Preuve : `etape > zone.etapes` lève « Étape de reprise invalide ». La validation de région ne compare ni `etape` à `zone.etapes` ni `zoneId` au monde : une sauvegarde « valide » peut donc faire planter le chargement (zone retirée ou raccourcie par une mise à jour, ou édition manuelle). Avec B-core-02, elle reste bloquée.
Gravité : 2 · Correctif : au chargement, ramener `etape` à `[1, zone.etapes]` et `zoneId` inconnu à la zone de départ de la région. · Effort : M

**B-core-08 — Création, import et installation de version ne sont pas atomiques**
`src/core/sauvegarde.ts:135-140`, `:146-147`, `:207-208`
Preuve : les régions sont écrites une à une, puis la partie. Si le stockage se remplit en cours de route (quota `localStorage`), on obtient des régions orphelines sans partie ; `installerVersion` écrit avant de supprimer les régions en trop. Rien ne retire les clés déjà écrites.
Gravité : 2 · Correctif : écrire dans l'ordre inverse (partie en dernier, déjà le cas) et, sur exception, supprimer les clés écrites pendant l'appel ; ou vérifier le quota avant. · Effort : M

**B-core-09 — L'export de secours échoue dès qu'une région est illisible, et n'emporte pas le compte**
`src/core/sauvegarde.ts:86-92`, `:177-182`
Preuve : `exporterPartie` appelle `regionsDe(id)` qui lève sur la première région invalide (`exiger(region, 'Région introuvable')`). Le fichier de secours (vision.md, « Export/import JSON conservé, en secours ») n'est donc pas produit au moment où il servirait. Diamants, succès et skins du compte ne sont jamais exportés.
Gravité : 2 · Correctif : exporter les JSON bruts même invalides (avec un drapeau), et proposer l'export du compte. · Effort : M

**B-core-10 — L'argent devient flottant à chaque victoire**
`src/core/recompenses.ts:33`, `src/core/capture.ts:78`
Preuve : `calculerOr` renvoie `or * 1.6` sans arrondi (niveau 5 commun : 29 × 1,6 = 46,4). `region.argent + or` accumule des flottants, la validation accepte `nombre` fini (`sauvegarde-validation.ts:30`) et `argentTotalGagne` aussi. Dérive d'arrondi, affichages `46.400000000000006` possibles, comparaisons de prix fragiles. À confirmer côté affichage.
Gravité : 2 · Correctif : `Math.floor` (ou `Math.round`) à la fin de `calculerOr`, et `entier` pour `argent`. · Effort : S

**B-core-11 — Boosts et recharge du Fauchage reposent sur l'horloge système**
`src/core/objets-actifs.ts:12-17`, `:58`, `:68` ; `src/core/clock.ts:4`
Preuve : les chronos sont des dates `Date.now()` persistées. Reculer l'horloge du téléphone prolonge Repousse et boosts ; l'avancer d'un jour annule la recharge du Fauchage (`rechargeFauchage - maintenant` devient négatif). Un changement de fuseau ou de synchronisation altère aussi les durées.
Gravité : 2 · Correctif : stocker des durées restantes décrémentées par le tick de jeu (comme `minuteurBossMs`), pas des dates absolues. · Effort : M

**B-core-12 — L'arrêt automatique annonce « shiny » alors que le shiny n'est pas la cause**
`src/core/combat.ts:69-71`
Preuve : l'arrêt peut venir de la rareté (`arret[cle]`) ou de `nouveau` ; la ligne 71 renvoie `'shiny'` dès que `ennemi.shiny`, même si `arret.shiny` est faux. Le motif affiché ne correspond pas au réglage qui a déclenché l'arrêt. À confirmer par test.
Gravité : 3 · Correctif : `if (ennemi.shiny && arret.shiny) return 'shiny'`. · Effort : S

**B-core-13 — Un boss capturé remettrait l'étape à 1 sans « boss vaincu »**
`src/core/combat.ts:132-135`
Preuve : `bossFinal && !capture` pousse `boss-vaincu`, mais `etape = bossFinal ? 1 : ...` s'applique aussi à `capture`. Aucun boss n'est capturable aujourd'hui (`zones.json`, toutes `capture: 0`), donc latent : le premier boss capturable bouclerait sur sa zone.
Gravité : 3 · Correctif : traiter la capture d'un boss comme une victoire (événement `boss-vaincu` aussi), ou interdire `capture > 0` sur un boss à la validation de zone. · Effort : S

**B-core-14 — Arrondis du blackjack qui pénalisent les petites mises**
`src/core/blackjack.ts:80`, `:161-165`
Preuve : `gain = Math.floor(mise * 2.5)` : mise 1 → 2 (un blackjack paie comme une victoire simple), mise 3 → 7 au lieu de 7,5. `coutAssurance = Math.floor(mise * 0.5)` : mise 1 → coût 0 (assurance gratuite sans effet), mise 3 → 1 (au lieu de 1,5). `retourAbandon` idem.
Gravité : 3 · Correctif : exiger des mises paires, ou arrondir par excès côté joueur, ou documenter le choix. · Effort : S

**B-core-15 — Le sabot de blackjack est reconstruit en pleine main avec des cartes déjà sorties**
`src/core/blackjack.ts:101-102`
Preuve : `piocher` fait `b.sabot.push(...construireSabot(b.alea))` quand le sabot est vide, sans retirer les cartes des mains en jeu. Plus de 6 exemplaires d'une carte deviennent possibles, et `compterCartes` (`sauvegarde-validation.ts:95-103`) refuse alors l'écriture : la sauvegarde automatique échoue le temps de la main. Très rare (le remélange se fait sous 25 %), à confirmer.
Gravité : 3 · Correctif : reconstruire le sabot en retirant les cartes des mains et du croupier. · Effort : S

**B-core-16 — `acheterJetons` n'a pas de plafond : des jetons au-delà de 2^53 rendent la région non sauvegardable**
`src/core/casino.ts:128-134`
Preuve : `jetons` est un entier quelconque, `cout = jetons * 20` ; avec un `argent` très grand, `region.jetons + jetons` dépasse `MAX_SAFE_INTEGER`, et la validation `entier` (`sauvegarde-validation.ts:31`) refuse ensuite l'écriture.
Gravité : 3 · Correctif : plafonner les jetons détenus (donnée) et valider côté achat. · Effort : S

**B-core-17 — `renommerPartie` ne change ni la révision ni la date d'écriture**
`src/core/sauvegarde.ts:104-113`
Preuve : l'enveloppe est réécrite avec `{...partie, donnees: {...}}` : `revision` et `ecritLe` identiques. Le tri de `listerParties` (`:159`, par `ecritLe`) ne bouge pas, et un conflit de révision n'est pas détecté si un autre onglet renomme en même temps.
Gravité : 3 · Correctif : passer par `ecrire(...)`. · Effort : S

**B-core-18 — Une sauvegarde en version 0 est acceptée par les validations mais rejetée par la migration**
`src/core/migrations/index.ts:56-69`, `src/core/sauvegarde.ts:190`
Preuve : `migrationsParDefaut` commence à `1`; `importerPartie` accepte `version >= 0` et `migrer` accepte `version >= 0`, puis `table[0]` manque : « Migration manquante : de la version 0 à la version 1 ». À confirmer (un fixture `partie-v0.json` existe peut-être pour un autre cas).
Gravité : 3 · Correctif : refuser `version < 1` avec un message clair, ou ajouter la migration 0→1. · Effort : S

**B-core-19 — `lireMise` lit mal les saisies non numériques**
`src/core/casino.ts:103-106`
Preuve : `parseInt('12abc', 10)` = 12, `parseInt('1e3', 10)` = 1, `parseInt('1.9', 10)` = 1. La mise réellement jouée diffère de ce que le joueur a tapé.
Gravité : 3 · Correctif : `/^\d+$/.test(valeur.trim())` avant conversion. · Effort : S

**B-core-20 — Le message d'achat d'une amélioration affiche toujours « CT Jackpot »**
`src/core/casino.ts:88-91`
Preuve : `message: casino.messages.achat.replace('{nom}', casino.noms.ctJackpot)` pour tout article `type: 'upgrade'`. Le premier autre `upgrade` ajouté à `casino.json` annoncera le mauvais nom.
Gravité : 3 · Correctif : utiliser `article.name`. · Effort : S

**B-core-21 — Le casino revend sans limite un Pokémon déjà possédé**
`src/core/casino.ts:61-66`
Preuve : `raison` ne bloque que `upgrade && possede` ; un Abra à 250 jetons peut être racheté à l'infini (niveau 25 chaque fois). À confirmer : c'est peut-être voulu, mais l'écran affiche `possede` sans l'utiliser.
Gravité : 3 · Correctif : trancher la règle dans `docs/vision.md`, puis la coder ou retirer `possede` pour les Pokémon. · Effort : S

**B-core-22 — Le pile ou face rend 100 % et le change jetons ↔ ₽ est sans écart : aucun puits d'argent**
`data/casino.json:4`, `:19` ; `src/core/casino.ts:183-186`
Preuve : `seuilFace 0,5` et `gain 2` donnent un rendement de 100 % ; acheter 50 jetons coûte 1 000 ₽ et en rendre 50 rapporte 1 000 ₽. Le casino ne coûte rien en espérance sur ce jeu, contre « puits d'argent obligatoires » (`docs/vision.md:24`). Les autres jeux sont à 91-97 %.
Gravité : 3 · Correctif : `gain` à 1,9 (ou une commission au rachat), à valider avec Nicolas. · Effort : S

**B-core-23 — Le palier 50 est décrit « Apparition +20 % » alors que l'effet est un délai ×0,9**
`data/jalons.json` (palier 50), `data/reglages.json:209`
Preuve : `reducteurs: [{cle: 'jalon:50', x: 0.9}]` raccourcit le délai avant l'ennemi suivant de 10 % (cadence ≈ +11 %). La description annonce +20 %. À confirmer (« apparition » peut viser autre chose).
Gravité : 3 · Correctif : aligner le texte ou la valeur. · Effort : S

**B-core-24 — L'entrée `jalon:151 ×2` du chromatique est probablement morte**
`data/reglages.json:141`, `src/core/progression.ts:72-79`, `data/jalons.json` (palier 151)
Preuve : `options.shiny.find(...)` prend la première entrée active dans l'ordre du JSON. Le palier 151 accorde l'amélioration `shinyCharm` (clé `objet:shinyCharm`, listée avant `jalon:151`) en même temps que `jalon:151` : l'entrée `×2` ne peut gagner que si le charme est absent. Le texte du palier parle de « x3 au combat ». À confirmer.
Gravité : 3 · Correctif : supprimer l'entrée ou prévoir le cumul. · Effort : S

**B-core-25 — Le multiplicateur de PV ne croît pas toujours d'une zone à l'autre**
`data/regions/kanto/zones.json` (`multiplicateurPv`)
Preuve : arène de Céladopole 23,5 → Centrale 20,8 → arène de Parmanie 22,8 ; Tour Pokémon 21 > Centrale 20,8. `docs/vision.md:23` demande une difficulté croissante. À confirmer : voulu (zone annexe) ou oubli.
Gravité : 3 · Correctif : documenter ou corriger. · Effort : S

**B-core-26 — Niveau maximum 100 en dur dans les objets d'équipe**
`src/core/objets-equipe.ts:74`, `:85`
Preuve : `pokemon.niveau >= 100` et `100 - pokemon.niveau`, alors que `reglages.recompenses.niveauMax` (100) existe. Changer le plafond casserait le Super Bonbon sans erreur.
Gravité : 3 · Correctif : lire `reglages.recompenses.niveauMax`. · Effort : S

**B-core-27 — Les boosts temporisés s'empilent sans plafond**
`src/core/objets-actifs.ts:33`
Preuve : `Math.max(chrono, maintenant) + dureeMs` : chaque X Attaque ajoute 30 s ; 100 objets donnent 50 minutes de boost, stock limité seulement par l'argent. À confirmer : règle voulue ?
Gravité : 3 · Correctif : plafonner la durée restante (donnée `dureeMaxMs`). · Effort : S

**B-core-28 — Division par zéro dans le clic automatique**
`src/core/clics.ts:4-6`
Preuve : `Math.floor(totalMs / intervalleMs)` et `totalMs % intervalleMs` avec `intervalleMs = 0` → `Infinity`/`NaN`. `reglages.combat.autoClicIntervalleMs` (111) n'est pas validé au chargement (contrairement à `boucle`, `loop.ts:13-14`).
Gravité : 3 · Correctif : valider `> 0` dans `chargerReglages`. · Effort : S

**B-core-29 — Division par zéro et `undefined` dans les crédits**
`src/core/credits.ts:7`, `:31`
Preuve : `index * temps.dureeMs / sections.length` avec `sections` vide → `NaN` ; `images[entier(0, images.length - 1)]!` renvoie `undefined` si `images` est vide, masqué par le `!`.
Gravité : 3 · Correctif : valider les listes non vides au chargement. · Effort : S

**B-core-30 — `objectifAffiche` peut renvoyer `undefined` pour un compteur négatif**
`src/core/objectifs.ts:92-93`
Preuve : `compteur % fonctions.length` est négatif si `compteur < 0` ; `fonctions[-1]!` est `undefined` alors que le type annonce `Objectif`.
Gravité : 3 · Correctif : `((compteur % n) + n) % n`. · Effort : S

**B-core-31 — `findIndex` = -1 transformerait la liste des zones suivantes en « dernière zone seulement »**
`src/core/evenements-kanto.ts:11`
Preuve : `kanto.zones.slice(kanto.zones.findIndex(z => z.id === 'kanto.arene-de-parmanie'))` : si l'id disparaît ou change, `slice(-1)` ne garde que la dernière zone, sans erreur. Latent.
Gravité : 3 · Correctif : lever une erreur si l'index vaut -1. · Effort : S

**B-core-32 — Le sexe n'est pas recalculé à l'évolution**
`src/core/evolution.ts:68-77`
Preuve : `appliquer` ne change que `numero`. Aucune évolution actuelle ne change de catégorie (vérifié sur `sexes.json` et `evolutions.json`), donc latent ; une espèce `sansSexe` évoluant en espèce sexuée (ou l'inverse) laisserait une sauvegarde invalide au rechargement (`sauvegarde-validation.ts:71`).
Gravité : 3 · Correctif : appliquer `tirerSexe`/la règle d'`espèce` après évolution. · Effort : S

**B-core-33 — Récursions sans garde de cycle sur la table d'évolutions**
`src/core/evolution.ts:18-27`, `:45-49` ; `src/core/zones-espece.ts`
Preuve : `formeDeBase`, `lignee`, `stade` rappellent la fonction sur `origines` sans compteur ; un cycle (erreur de donnée) donne un dépassement de pile. Vérifié : aucun cycle aujourd'hui.
Gravité : 3 · Correctif : valider l'absence de cycle dans `chargerEvolutions` (qui ne valide rien : `structuredClone`). · Effort : S

**B-core-34 — Une seule montée de niveau par victoire, même avec un gros surplus d'XP**
`src/core/recompenses.ts:74-79`
Preuve : `if (membre.xp >= maxXpAvant)` : un niveau au plus par victoire, le surplus reste en réserve. Un Pokémon à très haute XP (sauvegarde, bonus) gagne un niveau par ennemi vaincu. À confirmer : choix de conception ?
Gravité : 3 · Correctif : `while` plafonné par `niveauMax`. · Effort : S

**B-core-35 — `relacher` isolé ne contrôle pas le favori**
`src/core/equipe.ts:45-54` (contre `:69`)
Preuve : seul `relacherLot` refuse un favori ; `relacher` supprime sans test. À confirmer selon l'appelant (`relacherPokemon` `:56` vérifie peut-être). Dépôt de pension (`pension.ts:27`) passe par `relacher`.
Gravité : 3 · Correctif : un seul garde-fou dans `relacher`, commun aux deux chemins. · Effort : S

**B-core-36 — Le Jeton Shiny serait applicable à un œuf**
`src/core/objets-equipe.ts:56-66`
Preuve : `utiliserJetonShiny` : pas de test `pokemon.oeuf` repéré (à confirmer par test ciblé) ; un œuf deviendrait chromatique avant éclosion.
Gravité : 3 · Correctif : refuser les œufs. · Effort : S

**B-core-37 — `couplePonte` : l'espèce du parent sert de clé sans filtrer les œufs**
`src/core/pension.ts:103-113`, `:152-161`
Preuve : conséquence de B-core-05 ; avec un Métamorph + un œuf, `numero = second.numero` donne un œuf de l'espèce de l'œuf. À fusionner avec B-core-05 si Nicolas préfère un seul ticket.
Gravité : 3 · Correctif : voir B-core-05. · Effort : S

**B-core-38 — Un Pokémon de pension éclot avec une chance chromatique non bornée par 1**
`src/core/pension.ts:163-166`
Preuve : `(0,0625 + 0,025 × parentsShiny) × bonus.x` : avec `x` = 2 (charme) le maximum est 0,225 aujourd'hui ; aucune borne `Math.min(1, ...)` si les réglages changent (x grand). Latent.
Gravité : 3 · Correctif : `Math.min(1, ...)`. · Effort : S

---

## 2. SÉCURITÉ (34)

**S-core-01 — Validation de région incomplète : une sauvegarde « valide » peut planter le chargement**
`src/core/sauvegarde-validation.ts:136-179`
Preuve : `zoneId: chaine` (jamais comparé au monde), `etape: positif` (jamais comparé à `zone.etapes`, cf. `combat.ts:104`), `starterId: positif`, `regionId: identifiant`, `evenementEnCours.id`/`etape`/`file` (jamais comparés au catalogue) passent. Le plantage au chargement s'ajoute à B-core-02 (impossible de réécrire).
Gravité : 1 · Correctif : une validation sémantique après la validation de forme (zone existante, étape ≤ étapes, événement connu) avec repli sur la zone de départ. · Effort : M

**S-core-02 — Aucun plafond numérique : `Infinity` et débordements atteignables**
`src/core/sauvegarde-validation.ts:30-32`, `:54-56`, `:137-156`
Preuve : `nombre` accepte tout fini ≥ 0 (donc `1.7e308`), `entier` tout entier sûr. `argent: 1.7e308` + un gain → `Infinity`, `JSON.stringify(Infinity)` = `null`, et la validation refuse l'écriture suivante (`isFinite`). `niveau`, `xp`, `bonheur`, `calcium`, `jetons`, `diamants`, `revision`, `chronos.*` sans borne ; `revision + 1` perd sa précision après 2^53.
Gravité : 2 · Correctif : plafonds par champ (données : `niveauMax`, `calciumMax`, `bonheur.max`, plafond d'argent) dans les validateurs. · Effort : M

**S-core-03 — Niveau, calcium et bonheur au-delà des maxima du jeu**
`src/core/sauvegarde-validation.ts:54-55`, `src/core/stats.ts`
Preuve : `niveau: positif` sans `niveauMax`, `calcium: entier` sans `degats.calciumMax` (10), `bonheur: nombre` sans `bonheur.max` (255). Un `calcium: 1000000` multiplie le DPS sans limite (`stats.ts` formule sans plafond).
Gravité : 2 · Correctif : `niveau ≤ niveauMax`, `calcium ≤ calciumMax`, `bonheur ≤ max`. · Effort : S

**S-core-04 — Identifiants (`uid`) dupliqués acceptés dans l'équipe, le PC et la pension**
`src/core/sauvegarde-validation.ts:54`, `src/core/equipe.ts:48`, `:53`, `src/core/evolution.ts:69`
Preuve : `uid: identifiant` sans test d'unicité globale. `find` renvoie le premier exemplaire, `filter` (relâcher) et `map` (évolution) agissent sur tous : évoluer ou relâcher un doublon d'uid modifie ou supprime plusieurs Pokémon.
Gravité : 2 · Correctif : unicité d'`uid` sur `equipe ∪ pc ∪ pension` (et `pcGlobal`) à la validation. · Effort : S

**S-core-05 — Listes sans borne ni dédoublonnage (déni de service local)**
`src/core/sauvegarde-validation.ts:83-85`, `:137-141`
Preuve : `pokedexNational`, `vus`, `jalonsRecus`, `drapeaux`, `quetes`, `badges`, `bossVaincus`, `evenementsJoues`, `pc`, `pcGlobal` : tableaux de taille quelconque. Les accès `includes` (dex, relâchement, migrations `index.ts:52`) sont en O(n) à chaque tick ou chaque Pokémon.
Gravité : 2 · Correctif : longueur maximale par liste (≤ catalogues connus) et unicité. · Effort : M

**S-core-06 — L'import n'a aucune limite de taille ni de coût**
`src/core/sauvegarde.ts:183-209`
Preuve : `importerPartie(texte)` : `JSON.parse` sans limite, puis `validerEnveloppe` (migration par `structuredClone`) sur la partie et chaque région, puis `preparer` revalide tout : environ quatre passes. Un fichier de plusieurs dizaines de Mo gèle l'onglet.
Gravité : 2 · Correctif : taille maximale du texte, nombre maximal de régions et de Pokémon. · Effort : S

**S-core-07 — Import et sauvegarde acceptent des régions que le jeu ne prévoit pas**
`src/core/sauvegarde.ts:196-202`, `src/core/sauvegarde-validation.ts:83`, `data/monde.json`
Preuve : `regionsDebloquees: liste(identifiant)` et `regionCourante: identifiant` sans lien avec la liste des régions du jeu ; `monde.json` marque Johto… comme verrouillées. Une sauvegarde importée peut débloquer ou pointer vers une région inexistante. À confirmer côté interface.
Gravité : 2 · Correctif : valider contre le catalogue de régions. · Effort : S

**S-core-08 — L'état du blackjack (carte cachée et sabot) est stocké et exporté en clair**
`src/core/sauvegarde-types.ts:44-52`, `:80-81` ; `src/core/sauvegarde-validation.ts:168-169`
Preuve : `blackjackEnCours.croupier[1]` (carte cachée) et `sabotBlackjack` (prochaines cartes, ordre inclus) sont lisibles dans `localStorage` ou l'export, et réécrivables (sabot de 6 copies valide). Les jetons se rachètent en ₽ (`casino.ts:137-143`).
Gravité : 2 · Correctif : ne pas persister la carte cachée ni l'ordre du sabot (graine + position), ou accepter le risque par écrit (vision.md:46). · Effort : M

**S-core-09 — Aléa du jeu = `Math.random` côté client**
`src/ui/store.ts:1419` (injecté dans tout le cœur)
Preuve : `alea: Math.random` pour captures, chromatiques, casino ; prévisible et forçable depuis la console ; on peut aussi rejouer un tirage en réimportant la sauvegarde exportée avant la perte. Accepté par la vision pour un jeu entre amis.
Gravité : 3 · Correctif : documenter ; si les jetons devaient compter plus tard, graine persistée côté serveur. · Effort : L

**S-core-10 — `acheter` fait confiance au prix et à l'objet fournis**
`src/core/boutique.ts:69-86`
Preuve : `cout = prix * quantite`, `region.argent < cout` : avec `prix` négatif l'argent augmente, avec `NaN` la comparaison est fausse (achat gratuit, argent `NaN`). Aucune vérification que l'objet est vendu ni ouvert. L'interface recalcule le prix (`src/ui/store-boutique.ts:39`) mais le cœur ne se défend pas.
Gravité : 3 · Correctif : recalculer le prix dans `acheter` et valider `Number.isFinite`. · Effort : S

**S-core-11 — `utiliserSurPokemon` consomme une clé d'inventaire fournie par l'appelant**
`src/core/objets-equipe.ts:90-102`
Preuve : la signature `(region, type, cle, uid, n)` ne lie pas `cle` à `type` ; à confirmer par test ciblé qu'un `cle` autre que celui du type est refusé.
Gravité : 3 · Correctif : déduire `cle` de `type`. · Effort : S

**S-core-12 — `evenementEnCours` contourne `eligible` et `evenementsJoues`**
`src/core/sauvegarde-validation.ts:165-167`, `src/core/evenements.ts`
Preuve : l'état en cours (`id`, `etape`, `file`) est validé en forme seulement ; éditer `evenementEnCours` pour un événement « donner » (récompense) le déclenche sans passer par la condition d'éligibilité ni le drapeau « déjà joué ». À confirmer.
Gravité : 3 · Correctif : refuser un événement inconnu, déjà joué ou inéligible au chargement. · Effort : M

**S-core-13 — Les chronos persistés sont des entiers non bornés**
`src/core/sauvegarde-validation.ts:144-145`
Preuve : `finBoostAttaque: 9007199254740991` → boost permanent (`clesActives` compare `maintenant < chronos[...]`, `objets-actifs.ts:12`).
Gravité : 3 · Correctif : borner `chronos` à `maintenant + durée max`. · Effort : S

**S-core-14 — Inventaire sans clés ni quantités maximales contrôlées**
`src/core/sauvegarde-validation.ts:140`
Preuve : `objet(i); Object.values(i).forEach(entier)` : clés quelconques (objets inexistants, longueur libre) et quantités jusqu'à 2^53. Pas de prototype pollution démontrée : une clé `__proto__` issue de `JSON.parse` est une propriété propre et `{...inventaire}` la recopie comme donnée.
Gravité : 3 · Correctif : clés ∈ catalogue d'objets, quantités ≤ `quantiteMax × palier`. · Effort : S

**S-core-15 — Chaînes sans longueur maximale ; `creerPartie` n'applique pas la limite de `renommerPartie`**
`src/core/sauvegarde.ts:108` contre `:142-144` ; `src/core/sauvegarde-validation.ts:23-28`, `:83`
Preuve : `renommerPartie` borne le nom à 1-100 caractères ; `creerPartie(nom)` et la validation (`nom: chaine`) acceptent la chaîne vide et des longueurs libres. `identifiant` n'a pas de longueur maximale non plus (uid, ids de région).
Gravité : 3 · Correctif : `chaineBornee(min, max)` commune. · Effort : S

**S-core-16 — `balleChoisie` accepte n'importe quelle valeur**
`src/core/sauvegarde-validation.ts:78`
Preuve : `balleChoisie: () => undefined` : un objet de plusieurs Mo est persisté dans le compte et relu/réécrit à chaque sauvegarde.
Gravité : 3 · Correctif : `chaine` bornée, repli sur la balle par défaut à la lecture. · Effort : S

**S-core-17 — Compte : succès, skins et diamants non vérifiés**
`src/core/sauvegarde-validation.ts:75`
Preuve : `succes`/`skins` : `textes` sans existence ni unicité, `diamants: entier` sans borne. Skins exclusifs (Daran, Gabriel, Bjorn) accordables par édition, contre « Un succès ne se gagne qu'une fois par compte » (`docs/vision.md:45`). Accepté par `vision.md:46` pour le cosmétique.
Gravité : 3 · Correctif : valider contre les catalogues si le compte devient serveur. · Effort : M

**S-core-18 — Progression modifiable sans contrôle d'existence (badges, boss, clés, quêtes, améliorations)**
`src/core/sauvegarde-validation.ts:138-141`
Preuve : `textes` libres ; `ameliorations: ['shinyCharm','ctJackpot','protein']` donne les bonus gratuitement, `badges` débloque des zones et lieux (`conditions.ts`). Cohérent avec l'acceptation de `vision.md:46`, mais aucun identifiant inconnu n'est rejeté.
Gravité : 3 · Correctif : au minimum rejeter les ids inconnus pour éviter les états impossibles. · Effort : M

**S-core-19 — `jalonsRecus` modifiable : récompenses rejouables ou perdues**
`src/core/sauvegarde-validation.ts:141`, `src/core/progression.ts`
Preuve : `liste(positif)` sans unicité ni appartenance à `jalons.json` ; retirer un palier de la liste rejoue ses récompenses (argent, Omni Exp, Jeton Shiny).
Gravité : 3 · Correctif : unicité et appartenance. · Effort : S

**S-core-20 — Horloge système et rattrapage**
`src/core/loop.ts:29-33`, `src/core/clock.ts:4`, `data/reglages.json:124-128`
Preuve : le rattrapage est plafonné à `rattrapageMaxMs` (1 h) mais mesuré à `Date.now()` : avancer l'horloge d'une heure puis rouvrir donne une heure de progression d'un coup, répétable. À confirmer le rôle du rattrapage (vs « Jamais de progression hors ligne », `vision.md:39` pour les expéditions).
Gravité : 3 · Correctif : horloge monotone (`performance.now`) pour les durées, ou limiter le rattrapage à l'onglet masqué. · Effort : M

**S-core-21 — Le plafond de 12 clics/s repose sur l'horloge client**
`src/core/clics.ts:19`, `docs/vision.md:10`
Preuve : le limiteur mesure avec `horloge.maintenant()` ; une horloge reculée bloque, un injecteur d'événements contourne si le store n'applique pas le plafond lui-même. À confirmer dans `src/ui/` (hors périmètre).
Gravité : 3 · Correctif : compter dans la boucle de jeu, pas par date. · Effort : M

**S-core-22 — `seuilFace` du pile ou face n'est borné que par le haut**
`src/core/casino.ts:34-44`, `:183`
Preuve : `chargerCasino` refuse `seuilFace >= 1` mais pas `<= 0` : un `seuilFace` ≤ 0 donne toujours « pile » et un gain certain ×2. Intégrité de donnée plutôt qu'attaque.
Gravité : 3 · Correctif : exiger `0 < seuilFace < 1`. · Effort : S

**S-core-23 — Validation du casino tautologique par défaut**
`src/core/casino.ts:18-35`, `src/core/jeux-casino.ts:15`
Preuve : `chargerCasino(source = donnees)` valide `source` contre `donnees` (le même objet) ; la vérification n'a de valeur que pour les tests qui passent une autre source. Deux contrôles seulement sont réellement contraignants (poids = 100, `seuilFace < 1`).
Gravité : 3 · Correctif : un schéma indépendant (types + bornes) plutôt qu'un modèle. · Effort : M

**S-core-24 — `reglages.json` n'est validé que partiellement (cast direct)**
`src/core/reglages.ts` (fin de fichier, `donnees as typeof reglages`)
Preuve : `niveauMax`, `recompenses`, `degats`, `boutique`, `combat.chanceShiny`, `clicsMaxParSeconde` ne sont pas contrôlés (valeurs nulles, négatives, > 1). Une valeur aberrante passe jusqu'au calcul (division, probabilité > 1).
Gravité : 3 · Correctif : valider chaque section comme `boucle` (`loop.ts:13-14`). · Effort : M

**S-core-25 — Accès par clé dynamique sur objets littéraux**
`src/core/guide.ts:32`, `src/core/personnages.ts:14`
Preuve : `cle in valeur` (guide) et `personnages[locuteur]` : une clé comme `constructor` ou `__proto__` (issue d'un marqueur ou d'une donnée d'événement) ne renvoie pas `undefined` ; elle atteint le prototype d'`Object`. Données de jeu seulement aujourd'hui. À confirmer.
Gravité : 3 · Correctif : `Object.hasOwn` ou `Map`. · Effort : S

**S-core-26 — `distribuer` expose un paramètre `sabotImpose`**
`src/core/blackjack.ts:202-210`
Preuve : fonction exportée via `casino.ts:189-191` qui accepte un sabot choisi (utile aux tests). Si une action du store la relie à l'interface, la main est jouée sur un sabot fourni par l'appelant. À confirmer que seul le test l'appelle.
Gravité : 3 · Correctif : séparer l'API de test de l'API de jeu. · Effort : S

**S-core-27 — Identifiants générés par un repli `Math.random` sans `crypto`**
`src/ui/identifiants.ts:6` (hors périmètre, affecte `genererId` du cœur)
Preuve : sans `crypto.getRandomValues`, les uid viennent de `Math.random` : collisions et prédictibilité, avec S-core-04 des effets sur équipe/PC.
Gravité : 3 · Correctif : exiger `crypto.randomUUID` ou ajouter un compteur. · Effort : S

**S-core-28 — Erreurs de stockage non gérées dans le cœur**
`src/core/sauvegarde.ts:81`, `:111`, `:135-137`
Preuve : `stockage.ecrire` peut lever (quota plein, navigation privée) ; l'exception remonte sans état de repli, et l'état en mémoire peut avancer devant le disque. À confirmer côté interface.
Gravité : 3 · Correctif : renvoyer un résultat d'écriture que l'interface signale. · Effort : M

**S-core-29 — `compterCartes` valide sabot et main séparément**
`src/core/sauvegarde-validation.ts:105-108`, `:134`
Preuve : le sabot et la main sont comptés chacun à part contre 6 exemplaires par carte ; la somme sabot + main peut dépasser 6 exemplaires par carte et n'est pas contrôlée.
Gravité : 3 · Correctif : compter l'union. · Effort : S

**S-core-30 — `statistiques.victoires`, `eliminations`, `tempsJeuMs` libres**
`src/core/sauvegarde-validation.ts:85`, `:143`
Preuve : entiers sans borne ni cohérence (éliminations ≥ somme des boss…). Faible enjeu, mais ces compteurs alimentent des succès → diamants.
Gravité : 3 · Correctif : plafonner ; recalculer les succès à partir d'événements plutôt que de compteurs libres. · Effort : M

**S-core-31 — Un `evenementEnCours.etape`/`file` hors catalogue peut planter la lecture de la commande**
`src/core/sauvegarde-validation.ts:165-167`, `src/core/evenements.ts` (`commandeCourante`)
Preuve : `etape` entier ≥ 0 sans borne, `file` d'identifiants libres. À confirmer : `commandeCourante` renvoie-t-elle `undefined` ou lève-t-elle ?
Gravité : 3 · Correctif : vérifier au chargement (cf. S-core-01). · Effort : S

**S-core-32 — L'export n'est pas signé ni versionné par donnée**
`src/core/sauvegarde.ts:180-181`
Preuve : le fichier porte `version` globale ; chaque enveloppe a sa propre `version` ; un fichier mixte (partie en v4, région en v2) est migré enveloppe par enveloppe sans contrôle de cohérence avec `fichier.version`.
Gravité : 3 · Correctif : exiger la même version, ou ignorer la version globale. · Effort : S

**S-core-33 — `lireMise` autorise une borne `Infinity` par défaut**
`src/core/casino.ts:103`
Preuve : `jetons = Infinity` en paramètre par défaut : un appelant qui oublie l'argument accepte une mise supérieure aux jetons détenus (le contrôle est refait dans `debiter`, donc sans conséquence aujourd'hui).
Gravité : 3 · Correctif : paramètre obligatoire. · Effort : S

**S-core-34 — Messages d'erreur de validation renvoyés tels quels à l'utilisateur**
`src/core/sauvegarde.ts:51-54`
Preuve : `erreurSure` reprend `erreur.message` interne (« Champ inconnu », « Sexe incompatible avec l'espèce »…) dans « Cette sauvegarde est illisible : … ». Aucun secret, mais le texte dévoile la structure de validation.
Gravité : 3 · Correctif : code d'erreur + libellé de l'interface. · Effort : S

---

## 3. QUALITÉ (35)

**Q-core-01 — `validerForme` existe en deux variantes divergentes**
`src/core/casino.ts:18-32`, `src/core/jeux-casino.ts:15-48`
Preuve : le même nom et le même rôle (valider un JSON contre un modèle) ; la variante du casino accepte les flottants, celle des jeux exige des entiers sûrs.
Gravité : 2 · Correctif : un module `validation-donnees.ts` partagé. · Effort : S

**Q-core-02 — Validateurs primitifs recopiés dans cinq modules**
`src/core/sauvegarde-validation.ts:30-33`, `src/core/evenements.ts:195-200`, `src/core/objectifs.ts:17-27`, `src/core/tutoriels.ts:16`, `src/core/scenes.ts:37-74`
Preuve : `entier`/`positif`/`booleen`/`objet`/`texte`/`fraction`/`ratio` réécrits avec des messages différents. Un correctif (plafond, bornes) doit être répété.
Gravité : 2 · Correctif : bibliothèque de validation unique du cœur. · Effort : M

**Q-core-03 — Constantes de règles dupliquées entre code et données**
`src/core/pokedex.ts:28`, `src/core/easter-eggs.ts:41`, `src/core/defi-chen.ts:20`, `:28`, `:45`, `src/core/pension.ts:134` (151) ; `src/core/objets-equipe.ts:74`, `:85`, `src/core/defi-chen.ts:20` (100) ; `src/core/ligue.ts:37`, `src/core/combat-evenement.ts:9` (starters 1/4/7) ; `src/core/ligue.ts:18`, `:21`, `:94`, `src/core/defi-chen.ts:53` (10 combats, 9 adversaires, étape 5)
Preuve : `reglages.pension.especesTirees` (151) et `recompenses.niveauMax` (100) existent déjà.
Gravité : 2 · Correctif : tout lire des réglages ou du catalogue ; test qui interdit les nombres magiques. · Effort : M

**Q-core-04 — Clés d'objets en dur dans le code**
`src/core/objets-equipe.ts:28`, `:36`, `:50`, `:58-66` (`everstone`, `shinyToken`), `src/core/objets-actifs.ts:41-49` (`pokeDoll`), `src/core/progression.ts:77` (`omniExp`), `src/core/objets-equipe.ts:102` (`+${2 * n} %` contre `degats.calciumParBoost`)
Preuve : ajouter ou renommer un objet exige de modifier le code ; texte « +2 % » indépendant de la donnée (0,02).
Gravité : 2 · Correctif : table `effet` dans `objets.json`, lue par un seul moteur d'objets. · Effort : M

**Q-core-05 — Singleton `kanto` et `'kanto'` en dur : le cœur ne gère pas plusieurs régions**
`src/core/regions.ts`, `src/core/sauvegarde.ts:17`, `:145`, `src/core/pension.ts:170`, `src/core/statistiques.ts:23`, `src/core/ligue.ts`, `src/core/pc.ts`
Preuve : `accesPension(kanto, ...)`, `regionInitiale('kanto', ...)`, `regionCourante: 'kanto'`. `docs/vision.md:31` demande une aventure et une équipe par région, jusqu'à Paldea.
Gravité : 2 · Correctif : passer `regionId`/`monde` en paramètre, tester avec une région factice. · Effort : L

**Q-core-06 — Le cœur « pur » dépend de Vite (`import.meta.glob`)**
`src/core/evenements-kanto.ts:38`
Preuve : le chargement des cinq fichiers d'événements est codé en dur et utilise `import.meta.glob`, contre « Cœur de jeu en TypeScript pur » (`CLAUDE.md`). Une région ajoutée exige de modifier ce fichier, qui porte aussi une migration ad hoc (`normaliserRonflex`, ids en dur).
Gravité : 2 · Correctif : charger la liste de fichiers par région depuis une donnée injectée à la couture. · Effort : M

**Q-core-07 — Réglages : validation partielle et cast direct**
`src/core/reglages.ts` (types et fin de fichier)
Preuve : 247 lignes de types écrits à la main et `donnees as typeof reglages` ; seules quelques sections sont validées. Une faute de frappe dans `reglages.json` n'est pas détectée (cf. S-core-24).
Gravité : 2 · Correctif : générer types et validation depuis un schéma (comme `data/schemas/zone.schema.json`). · Effort : L

**Q-core-08 — Protocole de clés d'effets implicite (`badge:x`, `jalon:n`, `objet:y`)**
`src/core/progression.ts:72-79`, `data/reglages.json:141`, `:162-185`, `:193-209`
Preuve : les JSON référencent des chaînes (`"jalon:151"`, `"badge:marais"`) fabriquées par concaténation dans `actifsDe` ; une clé inconnue n'applique rien et ne lève rien (B-core-24).
Gravité : 2 · Correctif : valider chaque `cle` de réglages contre les sources possibles (badges, jalons, objets). · Effort : M

**Q-core-09 — Un objet, deux identifiants (`candy` / `bonbon`)**
`data/objets.json:45`, `:53`, `data/casino.json:22`, `data/jalons.json`, `data/reglages.json:202`
Preuve : `id: 'candy'`, `inventaire: 'bonbon'` ; le casino référence `itemKey: 'candy'`, les jalons et le chromatique `bonbon`. Le casino passe par `objets.find(...).inventaire` (`casino.ts:92`), pas les jalons : deux conventions.
Gravité : 3 · Correctif : un seul identifiant, ou référencer toujours par `id` puis résoudre. · Effort : S

**Q-core-10 — `casino.ts` mélange validation, boutique, jetons, machine, pile ou face et ré-exports ; le reste est dans `jeux-casino.ts`**
`src/core/casino.ts:189-191`, `src/core/jeux-casino.ts`
Preuve : `Alea`, `Resultat`, `debiter` et `RegionJetons`/`RegionCasino` existent en double (`casino.ts:12-14`, `:162`, `jeux-casino.ts:11-13`, `:50`) ; le découpage entre les deux fichiers ne suit pas une logique de jeu.
Gravité : 3 · Correctif : un dossier `casino/` (`types`, `jetons`, `machine`, `blackjack`…). · Effort : M

**Q-core-11 — `creerGestionnaire` : 150 lignes de fermeture, `this` dans un objet retourné**
`src/core/sauvegarde.ts:56-209`, `:166`
Preuve : `partieCourante()` appelle `this.listerParties()` ; `const { partieCourante } = gestionnaire` donnerait un `TypeError`.
Gravité : 3 · Correctif : fonctions nommées, pas de `this`. · Effort : S

**Q-core-12 — `validerDonneesRegion` : une fonction de 45 lignes avec validateurs en ligne**
`src/core/sauvegarde-validation.ts:136-180`
Preuve : les sous-structures (pension, évènement, blackjack…) sont des lambdas dans l'appel ; non testables séparément.
Gravité : 3 · Correctif : un validateur nommé par sous-structure. · Effort : S

**Q-core-13 — Fonctions longues dans le cœur**
`src/core/objectifs.ts:15-52` (`chargerObjectifs`, 38 lignes imbriquées), `:56-86` (`calculerObjectifs`), `src/core/evenements.ts` (338 lignes), `src/core/blackjack.ts` (308 lignes), `src/core/migrations/index.ts:84-122`
Preuve : mesuré par `wc -l`; les fonctions de chargement mélangent validation, texte et construction.
Gravité : 3 · Correctif : découper par responsabilité. · Effort : M

**Q-core-14 — Types faibles : `as`, `!` et `Record<string, unknown>` en cascade**
`src/core/migrations/index.ts` (une trentaine de `as Record<string, unknown>`), `src/core/ennemis.ts:16` (`zone.adversaires![etape - 1]!`), `src/core/boutique.ts:80` (`objet.inventaire!`), `src/core/casino.ts:92-94`, `src/core/equipe.ts:48`
Preuve : environ 100 `as` hors tests (grep ` as [A-Za-z\[]`). Aucun `any`, `@ts-ignore` ni `eslint-disable` dans le cœur (bon point).
Gravité : 3 · Correctif : unions discriminées pour `Objet` (consommable / amélioration), garde de type pour les migrations. · Effort : L

**Q-core-15 — `rattraperEspecesEcloses` et `rattraperDex` refont la logique de `noterObtention`**
`src/core/migrations/index.ts:84-122`, `src/core/dex.ts:13`
Preuve : deux copies de la règle « espèce atteinte par évolution entre dans la liste » ; elles s'exécutent à chaque `migrer`, même en version courante (`index.ts:78-79`).
Gravité : 3 · Correctif : une migration V4→V5 qui rattrape une fois, puis retrait. · Effort : M

**Q-core-16 — Champs optionnels hérités de versions anciennes, d'où des `?? []` partout**
`src/core/sauvegarde-types.ts:54-94` (onze champs `?`), `src/core/pension.ts:77-79`, `src/core/tutoriels.ts:62`, `:71`
Preuve : `annoncesVues`, `tutosVus`, `casinoVu`, `pensionVue`, `zonesAtteintes`, `especesEcloses`, `especesShiny`… sont optionnels et lus avec un repli.
Gravité : 3 · Correctif : migration vers une version qui les rend requis. · Effort : M

**Q-core-17 — `statsDeCombat` : recherche linéaire des surcharges à chaque appel**
`src/core/stats.ts:19`
Preuve : `surcharges.find(...)` sur 151 entrées à chaque calcul de PV, d'or, d'XP et de DPS (tick de 100 ms).
Gravité : 3 · Correctif : `Map` construite au chargement. · Effort : S

**Q-core-18 — `modifierJournal` clone le journal entier à chaque action**
`src/core/journal-zones.ts:49-50`, `:130`
Preuve : `structuredClone(journal)` par pas ; coût croissant avec la durée de la zone. Le journal est désactivé par défaut (`reglages.json:2`), le commentaire d'en-tête parle d'un « simulateur » abandonné (`:8`) : code actif ou mort, à trancher.
Gravité : 3 · Correctif : mutation contrôlée ou suppression si inutilisé. · Effort : S

**Q-core-19 — Recalculs répétés du monde**
`src/core/monde.ts` (`zonesOuvertes` rappelle `parcourir`), `src/core/deblocages.ts` (appel par entrée du catalogue)
Preuve : parcours du graphe refait à chaque appel, donc O(n²) par rafraîchissement (10 Hz). Le graphe de Kanto est petit (23 zones), le coût grandit avec les régions.
Gravité : 3 · Correctif : mémoïser par état. · Effort : M

**Q-core-20 — `includes` sur tableaux là où un `Set` suffit**
`src/core/dex.ts`, `src/core/pokedex.ts`, `src/core/relache-auto.ts:24`, `src/core/migrations/index.ts:52`
Preuve : O(n) par vérification ; avec S-core-05 (listes non bornées) c'est un risque de lenteur.
Gravité : 3 · Correctif : `Set` locaux dans les boucles. · Effort : S

**Q-core-21 — Logique d'évolution reconstruite dans trois modules**
`src/core/evolution.ts:16`, `src/core/zones-espece.ts`, `src/core/easter-eggs.ts` (`stadeEvolution`)
Preuve : la table `origines` et le calcul de stade sont refaits ; `zones-espece.ts` boucle aussi sans garde de cycle.
Gravité : 3 · Correctif : n'exposer que les fonctions d'`evolution.ts`. · Effort : S

**Q-core-22 — `chargerPokemon()` appelé dans dix modules du cœur**
`src/core/combat-evenement.ts`, `combat.ts`, `ennemis.ts`, `evenements.ts`, `monde.ts`, `pension.ts`, `recompenses.ts`, `sexe.ts`, `statistiques.ts`, `stats.ts`
Preuve : chaque module charge et valide le catalogue (44 Ko). `guide.ts` recharge en plus `pokemon.json`.
Gravité : 3 · Correctif : un singleton partagé dans `pokemon.ts`. · Effort : S

**Q-core-23 — Textes du jeu en dur dans le cœur, dont certains dupliqués**
`src/core/evolution.ts:81-95` (« Pokémon invalide ! », « Évolution bloquée ! »), `src/core/boutique.ts:78` et `src/core/pension.ts:60` (« Pas assez d'argent. »), `src/core/objets-equipe.ts:74`, `:102`, `src/core/statistiques.ts:38` (« Base (5+0.2% DPS) »)
Preuve : `CLAUDE.md` demande des données de contenu en JSON ; `casino.json` le fait déjà.
Gravité : 3 · Correctif : `data/messages.json` par thème. · Effort : M

**Q-core-24 — Descriptions de bonus dupliquées en texte libre**
`data/jalons.json` (« DPS Équipe +50% », « Boutique -15% »), `data/reglages.json:168-185`
Preuve : valeurs écrites deux fois (nombre et texte) ; B-core-23 en est un exemple.
Gravité : 3 · Correctif : générer la description depuis les multiplicateurs. · Effort : M

**Q-core-25 — `arretAuto` décrit à deux endroits avec des formes différentes**
`data/reglages.json:101-103`, `:118-121` ; `src/core/sauvegarde-types.ts:16-19`, `:90-93`
Preuve : `ReglagesArret` (compte, avec `actif`) et `arretAuto` (région, sans `actif`) ; recopies à synchroniser à la main.
Gravité : 3 · Correctif : un type, une source. · Effort : S

**Q-core-26 — Liste des écrans et des cibles d'objectifs recopiée dans le cœur**
`src/core/objectifs.ts:44`, `src/core/tutoriels.ts:13`, `:21`
Preuve : `['Combat','PC','Shop','Carte',…]` côté objectifs, `'Combat'|'Carte'|'PC'|'Casino'|'Pension'` côté tutoriels ; le cœur nomme des écrans de l'interface.
Gravité : 3 · Correctif : table partagée des écrans, ou ids neutres. · Effort : S

**Q-core-27 — Tutoriels : ids et événements codés dans la logique**
`src/core/tutoriels.ts:56-61`, `:75`
Preuve : `id === 'route-1'`, `'pc'`, `'pension'`, `'casino'`, `evenementsJoues.includes('kanto.intro')` : un tutoriel ajouté demande du code, pas seulement une entrée JSON.
Gravité : 3 · Correctif : champ `dejaDepasse` (condition) dans les données. · Effort : M

**Q-core-28 — Défi de Chen et Ligue : règles codées en dur**
`src/core/defi-chen.ts:20-55`, `src/core/ligue.ts:18-37`, `:94`
Preuve : 151, 100, 6, 4, étape 5, drapeaux `defi-chen-actif`/`defi-chen-gagne`, 10 combats, 9 adversaires, starters `[1,4,7]` : un deuxième combat de type Ligue ou un autre défi demande de copier ces fichiers.
Gravité : 3 · Correctif : paramètres dans `ligue.json`/`defi-chen.json`. · Effort : M

**Q-core-29 — Noms trompeurs et alias**
`src/core/pokedex.ts` (`vusDeKanto` renvoie des captures, `ajouterAuxVus` alias de `ajouterAuPokedex`), `src/core/dex.ts`, `src/core/combat.ts:76` (`apparaitre` gère l'arrêt auto)
Preuve : `vus` (liste des Pokémon vus) et pokédex (capturés) se confondent dans les noms, source d'erreurs de logique.
Gravité : 3 · Correctif : renommer (`captures`, `vus`) et supprimer l'alias. · Effort : S

**Q-core-30 — Trois pas de quantité existent en deux familles de fonctions**
`src/core/boutique.ts:59-61`, `src/core/quantite.ts:7-15`
Preuve : `quantiteMoins/Plus/PlusDix(quantite)` (boutique, avec retour à la boucle sur `quantiteMax`) et `quantiteMoinsPlafond/PlusPlafond/PlusDixPlafond(quantite, max)` (quantite.ts, avec plafond) ; deux jeux d'opérations de même nom pour deux comportements (boucle ou borne), sans raison écrite.
Gravité : 3 · Correctif : un seul module avec un paramètre `mode` ou deux noms explicites. · Effort : S

**Q-core-31 — `lancerCapture` reçoit une chance calculée ailleurs**
`src/core/combat.ts:91-94`, `src/core/capture.ts:17-30`
Preuve : le combat ne sait pas calculer la chance ; l'appelant (interface) combine `chanceCapture` et `lancerCapture`. Un oubli donne une capture automatique ou impossible sans erreur.
Gravité : 3 · Correctif : `lancerCapture(etat, cleBalle)` qui appelle `chanceCapture`. · Effort : S

**Q-core-32 — Aléa consommé dans un ordre figé par la compatibilité V1**
`src/core/ennemis.ts:17-39`
Preuve : le shiny est tiré avant l'espèce et le niveau (« La V1 tire le shiny avant… ») alors que `CLAUDE.md` dit que la V1 n'est plus une référence ; les tests à séquences d'aléa fixes cassent au moindre réordonnancement. À confirmer dans `ennemis.test.ts`.
Gravité : 3 · Correctif : assertions sur propriétés (distribution) plutôt que sur séquences. · Effort : M

**Q-core-33 — Fichiers de tests très longs**
`src/core/sauvegarde.test.ts` (699 lignes), `casino-blackjack.test.ts` (476), `jeux-casino.test.ts` (346)
Preuve : `wc -l`. Contenu non relu ligne à ligne dans cet audit ; un fichier de 700 lignes mêle création, import, conflit, migration.
Gravité : 3 · Correctif : un fichier par comportement (`sauvegarde-import.test.ts`…). · Effort : M

**Q-core-34 — `equilibrage.json` : statut « propose » et cibles non tenues**
`data/equilibrage.json:3-4`, `:16-26`
Preuve : `valide: false`; arène de Carmin 18,7 min, Îles Écume 28,2 min contre une Ligue visée à 60-90 min au total ; utilisé par `tests/equilibrage-*.test.ts` et deux scripts. Le mémo « plus de simulateur par ticket » rend la fraîcheur de ce fichier incertaine.
Gravité : 3 · Correctif : le déclarer obsolète ou le remettre à jour. · Effort : S

**Q-core-35 — Aucune évolutivité pour un type de combat ou une région supplémentaire**
`src/core/combat.ts:132` (`zone.type !== 'ligue'`), `src/core/ennemis.ts:14-16`, `src/core/combat-evenement.ts:16`
Preuve : le type de zone `'ligue'` pilote le boss final, les adversaires multiples, la capture, la rareté ; un combat « tournoi » ou « expédition » exigerait des `if` supplémentaires dans trois fichiers.
Gravité : 3 · Correctif : stratégie par type de zone (`TypeCombat`) déclarée en données. · Effort : L

---

Notes de périmètre : les tests n'ont pas été relus un par un ; aucune commande lancée sur la suite complète. Les points marqués « à confirmer » demandent un test ciblé avant ticket. `src/pwa/` : trois fichiers (`nettoyer-caches.ts`, son test, `registre-double.ts`) sans défaut relevé. Rien n'a été modifié dans le dépôt en dehors de ce fichier.
