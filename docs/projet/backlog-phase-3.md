# Backlog — phase 3 « Équilibrage outillé »

Jalon : Kanto en 60 à 90 minutes à 7 clics par seconde. Brouillon du 02/11/2026, branche `v2` ; tous les tickets restent à l'état d'idée.

## Lecture du lot

- Décision de Nicolas du 02/11/2026 : il a terminé Kanto et trouve le jeu équilibré. Il n'a pas ressenti les blocages longs du simulateur. Le simulateur ne fait pas autorité : aucun réglage ne change avant qu'il ait vu la mesure et dit oui.
- Priorité demandée : mesurer les zones 1 et 2, puis les blocages longs. Sans clic, le boss de la Route 1 tombe en 7 s et celui de la Forêt de Jade en 11 à 13 s ; le critère 2 du ticket AB, « début de partie tendu », n'est pas atteint.
- Aucune règle de jeu ne change sans ticket validé. Chaque valeur de jeu modifiée vit dans `data/`, jamais en dur, et chaque changement de valeur se défait en changeant une ligne. Une proposition chiffrée n'autorise pas son application.
- Point de départ : `scripts/simuler-parcours.mjs`, rapport `docs/projet/equilibrage-28-10.md` (AB), test `tests/equilibrage-ab.test.ts`. Avec le Pokédex « theorique », la Ligue est gagnée en 70,8 min. Temps passés après échec : Pont Pépite 4,8 min, Arène de Carmin 19,0 min, Tour Pokémon 13,2 min, Arène de Céladopole 14,4 min.
- Le simulateur n'est pas un joueur : il reste bloqué plus longtemps lorsqu'il faut revenir acheter ou attendre un Pokémon précis. Ses temps absolus ne prédisent pas une partie ; ils servent à comparer deux jeux de données à protocole identique.
- Les fichiers cités dans les tickets sont les fichiers concernés par leur future réalisation. Ce backlog ne livre ni instrumentation, ni nouvelle règle, ni réglage.

## A. `test(equilibrage): mesurer les boss des deux premières zones`

Labels : `type:test`, `etat:fait`, `est:1-2`, `prio:1` · branche : `v2` · `agent-ok` : oui (mesure ; application après accord de Nicolas) (03/11 : 12 références, 60 mesures reproductibles, données inchangées)

### Histoire
En tant que Nicolas, je veux comparer les durées des premiers boss pour choisir un réglage sur des résultats reproductibles.

### Contexte
Le début de partie ne satisfait pas le critère 2 d'AB. Mesurer Route 1 et Forêt de Jade avec chacun des trois starters, à 0 et à 7 clics/s. Fixer et publier l'état de départ de chaque scénario, l'équipe, les achats, la graine et la cadence des clics ; distinguer le temps de combat du boss du temps pour atteindre ce boss.

Fichiers concernés : `scripts/simuler-parcours.mjs`, `tests/equilibrage-ab.test.ts`, rapport à créer `docs/projet/equilibrage-debut-de-partie.md` ; lecture de `data/reglages.json` et `data/regions/kanto/zones.json`. Les multiplicateurs candidats sont des variantes de mesure, sans écriture des données de jeu.

### Critères d'acceptation
- [x] Étant donné une sauvegarde neuve et le protocole publié, quand les trois starters suivent chaque cadence, alors le rapport fournit les 12 durées de boss, les victoires et les échecs, avec les mêmes résultats à graine identique.
- [x] Étant donné les valeurs actuelles, quand la référence est mesurée sans clic, alors le rapport confronte les résultats aux 7 s de Route 1 et aux 11 à 13 s de Forêt de Jade et explique tout écart.
- [x] Étant donné plusieurs multiplicateurs de PV candidats dont ×1 comme témoin, quand chaque variante est simulée, alors un tableau donne pour chaque zone, starter et cadence le multiplicateur et la durée obtenue, ou l'échec avec sa limite de temps.
- [x] Étant donné ce tableau, quand Nicolas le consulte, alors aucune valeur de jeu n'a changé ; il peut choisir une ligne ou conserver les valeurs actuelles. L'application éventuelle vient dans un second temps, dans un ticket validé avec la valeur exacte et son retour arrière dans `data/`.

### Hors périmètre
Application des candidats, modification des dégâts ou des règles de clic, rééquilibrage des zones suivantes.

### Vérification
Rejouer la matrice avec les mêmes paramètres ; comparer les résultats et vérifier que les données de jeu sont inchangées. Consigner la commande, la révision et les paramètres dans le rapport.

### Effort et risques
Fourchette : 1 à 2 jours. Dépend de : AB livré. Risque : un état de départ trop favorable masque la difficulté ; documenter les achats et l'équipe évite cette ambiguïté. Mesure uniquement ; choix et changement de règle soumis à Nicolas.

## B. `feat(equilibrage): relever le temps réel passé par zone`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui (En développement, ouvre Plus → Relevé de partie (développement), active le relevé, joue puis clique sur Exporter le relevé.)

### Histoire
En tant que Nicolas, je veux exporter le déroulé de ma partie pour comparer mon parcours aux attentes du simulateur.

### Contexte
Un journal local optionnel doit relever les entrées dans chaque zone, les essais de boss et le temps passé. Un réglage de développement le désactive par défaut. Les relevés restent sur l'appareil et ne sont jamais envoyés.

Fichiers concernés : `src/core/reglages.ts`, `data/reglages.json`, `src/ui/PagePlus.tsx`, points de transition de zone et de lancement des boss à identifier ; tests ciblés du journal. L'export JSON est accessible depuis la page Plus en développement ou depuis la console. Il contient la version du format, la révision des données et les paramètres utiles à la comparaison.

### Critères d'acceptation
- [x] Étant donné le réglage désactivé par défaut, quand une partie se déroule, alors aucun relevé n'est collecté et aucune requête réseau n'est ajoutée.
- [x] Étant donné le journal activé, quand le joueur entre ou revient dans une zone et tente un boss, alors le journal conserve l'heure d'entrée, les visites, le nombre d'essais et leur issue, ainsi que le temps par visite et par zone.
- [x] Étant donné un onglet masqué, une pause ou un rechargement, quand le relevé reprend, alors les temps actifs et les interruptions sont distingués selon une convention documentée, sans compter deux fois une visite ou un essai.
- [x] Étant donné un relevé, quand Nicolas exporte le JSON, alors il peut retrouver Carmin, Tour Pokémon, Céladopole et Îles Écume, avec les paramètres et les limites de comparaison au simulateur ; l'export reste local et un effacement est possible.
- [x] Étant donné le même parcours avec et sans journal, quand les combats et récompenses sont comparés, alors les règles et leurs résultats restent identiques.

### Hors périmètre
Télémétrie distante, compte utilisateur, collecte automatique en production, modification des combats ou récompenses.

### Vérification
Tests ciblés des entrées, retours, essais, interruptions, export et effacement ; essai manuel d'un export depuis l'accès retenu. Vérifier l'absence de collecte par défaut et d'envoi réseau.

### Effort et risques
Fourchette : 2 à 3 jours. Dépend de : aucune dépendance bloquante ; peut suivre A. Risque : confondre temps de jeu et temps d'attente hors onglet. Instrumentation seulement ; aucune règle de jeu à changer. Nicolas devra fournir une partie enregistrée pour C et F.

## C. `docs(equilibrage): expliquer les blocages longs par zone`

Labels : `type:docs`, `etat:fait`, `est:1-2`, `prio:1` · branche : `v2` · `agent-ok` : oui (diagnostic et options) · rapport : `equilibrage-blocages.md` (03/11) · décision de Nicolas du 03/11 : option 1 (le jeu reste tel quel), options 2 et 3 lancées dans les tickets I et H

### Histoire
En tant que Nicolas, je veux comprendre les écarts entre ma partie et le simulateur avant d'envisager un réglage.

### Contexte
Comparer le relevé B au simulateur sur Pont Pépite, Carmin, Tour Pokémon, Céladopole et Îles Écume. Les quatre premiers blocages mesurés après échec valent respectivement 4,8, 19,0, 13,2 et 14,4 min ; Îles Écume reste à mesurer sans lui attribuer un blocage acquis.

Fichiers concernés : export local B, `scripts/simuler-parcours.mjs`, `docs/projet/equilibrage-28-10.md`, rapport à créer `docs/projet/equilibrage-blocages.md` ; lecture de `data/reglages.json` et `data/regions/kanto/zones.json`. Définir séparément temps total de zone et temps après échec.

### Critères d'acceptation
- [ ] Étant donné une partie enregistrée et une simulation documentée, quand les cinq zones sont comparées, alors le rapport donne leurs temps, essais et écarts avec les différences d'équipe, d'achats et de protocole ; une donnée absente est signalée.
- [ ] Étant donné chaque attente longue, quand sa cause est recherchée, alors le rapport distingue argent, niveau, Pokémon précis et marge de boss, avec des chiffres et la part imputable au comportement du simulateur.
- [ ] Étant donné chaque cause étayée, quand les options sont simulées, alors un tableau compare le témoin, les variantes et leurs effets sur la zone et la durée totale ; conserver le jeu actuel reste une option.
- [ ] Étant donné une option proposée, quand Nicolas la lit, alors la valeur, le fichier de données, les effets attendus et le retour arrière sont explicites ; aucune option n'est appliquée sans sa décision et un ticket validé.

### Hors périmètre
Application des options, changement implicite des règles, ajustement du jeu pour compenser une limite du simulateur.

### Vérification
Rejouer les comparaisons à paramètres identiques ; rattacher chaque chiffre à un export ou à une commande. Vérifier que les données de jeu restent inchangées.

### Effort et risques
Fourchette : 1 à 2 jours, hors attente de la partie de Nicolas. Dépend de : B et son relevé réel ; A apporte le protocole reproductible. Risque : attribuer au jeu une attente créée par le simulateur. Mesure et propositions uniquement ; toute règle attend Nicolas.

## D. `feat(equilibrage): comparer les mesures à une courbe cible par zone`

Labels : `type:feat`, `etat:idee`, `est:1.5-2.5`, `prio:2` · branche : `v2` · `agent-ok` : oui (outil ; cibles à valider)

### Histoire
En tant que Nicolas, je veux lire un seul tableau des durées et marges pour décider où un réglage mérite d'être étudié.

### Contexte
Créer `data/equilibrage.json` comme source unique des cibles par identifiant de zone : temps visé, unité, marge visée du boss et convention de calcul. Définir la marge comme le rapport entre les dégâts infligeables pendant le combat et les PV du boss, moins 1 ; préciser les hypothèses de clics et d'équipe. Ce fichier décrit des cibles d'analyse et ne pilote pas les combats.

Fichiers concernés : `data/equilibrage.json`, `scripts/simuler-parcours.mjs`, commande à créer `node scripts/comparer-equilibrage.mjs`, rapports A et C. Les valeurs effectives du jeu restent dans leurs fichiers `data/` existants ; le tableau désigne leur chemin et leur clé lorsqu'un réglage est proposé, sans les recopier dans une seconde source.

### Critères d'acceptation
- [ ] Étant donné toutes les zones de Kanto, quand le JSON est validé, alors chaque zone possède un temps et une marge visés avec des unités explicites ; identifiants absents, doublons et valeurs invalides sont signalés.
- [ ] Étant donné les conclusions A et C, quand les cibles sont proposées à Nicolas, alors leur somme et la convention de temps sont compatibles avec le jalon de 60 à 90 min à 7 clics/s ; son choix est consigné avant leur usage comme seuils CI.
- [ ] Étant donné un protocole fixe, quand `node scripts/comparer-equilibrage.mjs` est exécuté, alors un tableau Markdown affiche par zone les temps et marges « mesuré / visé / écart », le total, la révision, le starter, le mode Pokédex et la graine.
- [ ] Étant donné des cibles modifiées, quand la commande est relancée, alors seules les comparaisons changent ; aucune règle du jeu n'est appliquée par cette commande ou par le JSON.

### Hors périmètre
Correction automatique des données, nouvelle formule de combat, interface de réglage dans le jeu.

### Vérification
Valider le JSON et la couverture des zones ; vérifier les écarts sur un petit exemple connu, puis produire le tableau complet avec le simulateur existant.

### Effort et risques
Fourchette : 1,5 à 2,5 jours. Dépend de : A et C pour étayer les cibles. Risque : transformer une durée simulée en promesse de durée réelle ; afficher le protocole et les limites dans le tableau. Outil de mesure ; validation des cibles par Nicolas, changements de règles dans des tickets distincts.

## E. `test(equilibrage): surveiller les durées du parcours dans la CI`

Labels : `type:test`, `etat:idee`, `est:1-2`, `prio:2` · branche : `v2` · `agent-ok` : oui (seuils après validation de Nicolas)

### Histoire
En tant que mainteneur, je veux détecter une dérive du parcours simulé avant de livrer des données modifiées.

### Contexte
Ajouter un test Vitest du simulateur avec un réglage rapide déterministe : simulation accélérée sans attente réelle, à 7 clics/s simulés, sans modifier les formules. Proposer X = 25 % au-dessus du temps cible d'une zone : cette tolérance absorbe un faible décalage de parcours tout en détectant un allongement d'un quart. C'est une proposition à confronter aux mesures D et à faire valider par Nicolas, pas un seuil déjà acquis.

Fichiers concernés : `scripts/simuler-parcours.mjs`, `tests/equilibrage-ab.test.ts` (extension ou test Vitest voisin), `data/equilibrage.json` pour la tolérance validée, configuration CI existante si nécessaire. Le scénario de référence fixe starter, graine, achats et Pokédex « theorique » ; il ne représente pas une partie humaine.

### Critères d'acceptation
- [ ] Étant donné les cibles et la tolérance validées, quand la CI lance le scénario rapide, alors le test échoue si la victoire de la Ligue est hors de 60 à 90 min simulées ou si une zone dépasse son temps cible de plus de 25 %, sous réserve du X finalement validé.
- [ ] Étant donné le scénario courant, quand les cibles sont évaluées avant activation, alors tout dépassement initial est présenté à Nicolas ; aucun réglage de jeu ni assouplissement de seuil n'est appliqué pour faire passer le test sans son accord.
- [ ] Étant donné un dépassement, quand le test échoue, alors le diagnostic nomme la zone, le temps mesuré, la cible, la tolérance et le protocole ; les bornes exactes de la fourchette restent acceptées.
- [ ] Étant donné l'environnement CI de référence, quand le test complet du parcours est chronométré, alors il reste sous environ 30 s réelles et produit les mêmes résultats sur des exécutions répétées.

### Hors périmètre
Garantie de durée d'une partie réelle, correction automatique de l'équilibrage, réduction de précision qui change le résultat des combats.

### Vérification
Chronométrer le test en CI ; vérifier les bornes et provoquer un dépassement dans des données temporaires de test pour constater l'échec, sans modifier les données livrées.

### Effort et risques
Fourchette : 1 à 2 jours. Dépend de : D et validation par Nicolas des cibles et de X. Risques : coût CI et seuils trop sensibles au parcours. Régression de mesure seulement ; une alerte ne vaut pas autorisation de changer le jeu.

## F. `docs(equilibrage): mesurer l'argent disponible et proposer des puits`

Labels : `type:docs`, `etat:idee`, `est:1-2`, `prio:2` · branche : `v2` · `agent-ok` : oui (mesure et propositions)

### Histoire
En tant que Nicolas, je veux savoir où l'argent reste inutilisé pour décider si des achats supplémentaires ont un intérêt.

### Contexte
La simulation rapporte 831 k gagnés pour 600 k dépensés ; Route Victoire et Ligue apportent 286 k de gains. Vérifier ces totaux et localiser l'accumulation selon le parcours d'un joueur qui achète tout. Définir précisément « tout » : achats finis disponibles dès qu'ils sont abordables ; pour les consommables répétables, quantités et fréquence fixées dans le protocole, car un achat illimité n'a pas de fin.

Fichiers concernés : `scripts/simuler-parcours.mjs`, export B, rapport à créer `docs/projet/equilibrage-argent.md`, `data/reglages.json` et fichiers de prix et d'objets dans `data/` à identifier. Ajouter au besoin des mesures locales de solde et d'achats au protocole B, sans changer les prix.

### Critères d'acceptation
- [ ] Étant donné le parcours actuel et le parcours « achète tout » documenté, quand les deux sont simulés, alors le rapport donne par zone solde d'entrée et de sortie, gains, dépenses, achats possibles et différés ; il vérifie les 831 k, 600 k et 286 k ou explique les écarts.
- [ ] Étant donné le relevé de Nicolas, quand les soldes et achats sont rapprochés du simulateur, alors les zones où l'argent dort et les différences de comportement sont chiffrées ; les informations absentes restent signalées.
- [ ] Étant donné cette mesure, quand des puits sont proposés, alors un tableau indique objets ou prix candidats, coût cumulé, solde restant et effet sur le parcours et la durée, avec une option de conservation des réglages actuels.
- [ ] Étant donné ces options, quand Nicolas décide, alors son choix est consigné avant tout changement ; une application éventuelle a son ticket validé, ses valeurs exactes dans `data/` et un retour arrière d'une ligne par valeur.

### Hors périmètre
Ajout immédiat d'objets, hausse de prix, baisse des récompenses, nouvelle règle économique sans ticket validé.

### Vérification
Vérifier par zone l'identité solde final = solde initial + gains − dépenses, puis rejouer les variantes à protocole identique. Comparer au relevé réel et vérifier que les données de jeu sont inchangées.

### Effort et risques
Fourchette : 1 à 2 jours, hors attente du relevé. Dépend de : B et sa partie enregistrée ; C apporte l'analyse des attentes liées à l'argent. Risque : un puits d'argent peut ralentir un joueur qui achète déjà tout. Mesure avant proposition ; décision de Nicolas avant toute règle ou valeur modifiée.

## G. `feat(centre): vendre la baie Grena (+2 de bonheur)`

Labels : `type:feat`, `etat:fait`, `est:1`, `prio:3` · branche : `v2` · `agent-ok` : oui · décision de Nicolas du 03/11 (nouvel objet, absent de la V1)

### Histoire
En tant que joueur, je veux acheter au Centre commercial une baie qui augmente le bonheur d'un Pokémon pour monter son bonus de dégâts sans attendre les victoires.

### Contexte
Le bonheur ne monte aujourd'hui que de +1 par victoire (équipe, écart de niveau ≤ 25, max 255) et donne jusqu'à +25,5 % de dégâts (`bonheurParPoint` 0,001). Dans les jeux, la Baie Grena (Pomeg) est l'une des six baies qui donnent du bonheur ; Nicolas a choisi celle-là le 03/11. Elle suit le même parcours que le Calcium et les bonbons : objet du Centre commercial utilisé sur un Pokémon de l'équipe (`src/core/objets-equipe.ts`, type à ajouter à côté de `bonbon` et `calcium`).

Fichiers concernés : `data/objets.json` (nouvel objet, `boutique: "mall"`), `data/reglages.json` (`centre.objets`, valeur du gain, plafond de bonheur déjà présent), `src/core/objets-equipe.ts`, `src/ui/EcranCombat.tsx` (ligne 222, objets répétables), `src/ui/PageCentre.tsx`, `data/ressources-externes.json` et `data/credits-images.json` (icône `sprites/items/pomeg-berry.png`, même banque que la Baie Cheri), `data/guide.json` (phrase sur le bonheur).

### Critères d'acceptation
- [x] Étant donné le Centre commercial ouvert, quand j'ouvre la liste, alors la Baie Grena est vendue avec son icône (pomeg-berry), sa description et un prix de base de 500 pièces l'unité.
- [x] Étant donné les badges obtenus, quand je regarde le prix, alors il suit l'inflation du Centre comme les autres objets (`sansInflation: false`, +5 % par badge) et prend la remise de −15 % au palier de Pokédex déjà prévu (`palierRemise` 70, `remise` 0,85) ; le prix est le même dans la liste, au clic et à l'achat.
- [x] Étant donné une baie dans le sac et un Pokémon de l'équipe, quand je l'utilise, alors son bonheur gagne +2 (valeur dans `data/reglages.json`), sans dépasser 255, et son bonus de dégâts suit (`equipe.ts`).
- [x] Étant donné un Pokémon à 254, quand j'utilise la baie, alors il passe à 255 ; à 255, la baie n'est pas consommée et le message « Limite atteinte ! » s'affiche, comme pour le Calcium.
- [x] Étant donné plusieurs baies, quand j'utilise l'objet en série, alors le geste est répétable comme le Calcium et le bonbon, jusqu'à la limite ; la fiche Pokémon montre le nouveau bonheur.
- [x] Étant donné l'objet ajouté, quand je recharge une partie existante, alors aucune migration n'est nécessaire (inventaire vide pour cette clé) et les tests de sauvegarde passent.

### Hors périmètre
Les cinq autres baies, une baie par Pokémon du PC, un autre effet (EV, évolution), tout changement du gain de +1 par victoire.

### Vérification
Tests Vitest du cœur (gain, plafond, prix avec inflation et remise), test de l'interface du Centre, `npm.cmd run ci`, captures 390 et 1440 px de la liste du Centre et de la fiche Pokémon regardées.

### Effort et risques
Fourchette : 0,5 à 1 jour. Risque : la baie sert de puits d'argent (500 × 1,4 × 0,85 ≈ 595 en fin de partie, bonheur max en ~128 baies par Pokémon, soit environ 76 000 pièces) ; l'effet sur l'équilibrage est à relire avec le ticket F, sans changer d'autres prix.

## H. `feat(equilibrage): enrichir le relevé de partie (équipe, argent, achats, Pokédex, marge de boss)`

Labels : `type:feat`, `etat:fait`, `est:2-3`, `prio:1` · branche : `v2` · `agent-ok` : oui · décision de Nicolas du 03/11 (« mets tous les chiffres possibles dans le relevé »), option 3 du ticket C (03/11 : livré, CI verte ; reste à jouer une partie avec le relevé actif pour vérifier l'export)

### Histoire
En tant que Nicolas, je veux que le relevé garde tout ce qui explique un blocage (équipe, niveaux, argent, achats, Pokédex, marge du boss) pour savoir pourquoi je reste coincé et pas seulement combien de temps.

### Contexte
Le relevé B (`src/core/journal-zones.ts`, branché par `src/ui/journal-zones.ts` et `src/ui/store.ts`) ne garde que les temps, les essais et leur issue. Le rapport C n'a pas pu chiffrer l'argent, le niveau ni la marge de boss. Le relevé reste réservé au développement, désactivé par défaut, local, sans réseau ; il ne change aucune règle.

Fichiers concernés : `src/core/journal-zones.ts` (types, `version` passe à 2), `src/ui/journal-zones.ts` (instantané pris à l'entrée de zone, au début et à la fin de chaque essai), `src/ui/store.ts` (branchement, achats), tests `src/core/journal-zones.test.ts` et `src/ui/journal-zones.test.ts`, `docs/projet/equilibrage-blocages.md` (champs du nouvel export).

### Critères d'acceptation
- [x] Étant donné une visite de zone, quand le joueur entre, alors un instantané est conservé : argent, argent total gagné, badges, nombre de Pokémon capturés et vus, palier de Pokédex atteint, bonus de Pokédex actifs, objets et améliorations possédés (dont Attaque + et Attaque spé +, objets de boutique à bonus de dégâts), équipe complète (numéro, niveau, bonheur, calcium, shiny, objet porté).
- [x] Étant donné un essai de boss, quand il commence puis finit, alors l'instantané est repris (argent, équipe, niveaux) avec les PV du boss, les dégâts par seconde de l'équipe, la marge (temps nécessaire pour abattre le boss contre le temps accordé), les clics par seconde et l'issue.
- [x] Étant donné un achat, une amélioration, une utilisation d'objet (bonbon, Calcium, Baie Grena, Attaque +) ou un retour en arrière vers une zone déjà vaincue, quand l'action se produit, alors une ligne datée est ajoutée à la visite (type, objet, quantité, prix, solde après).
- [x] Étant donné du temps de jeu simulé en arrière-plan (onglet masqué), quand le relevé le mesure, alors ce temps est rangé à part du temps joué visible (champ distinct), et la somme reste cohérente avec la durée de montre.
- [x] Étant donné un ancien relevé de version 1 en stockage, quand le jeu démarre, alors il est écarté sans erreur et un nouveau relevé commence ; l'export version 2 est documenté et reste local, avec effacement possible.
- [x] Étant donné le même parcours avec et sans relevé, quand combats, récompenses et sauvegardes sont comparés, alors les résultats sont identiques ; les instantanés ne dépassent pas une taille raisonnable (un parcours complet de Kanto exporté tient en quelques Mo au plus).

### Hors périmètre
Tout changement de règle ou de valeur du jeu, envoi du relevé sur le réseau, affichage du relevé pour le joueur en production.

### Vérification
Tests Vitest du cœur et de l'adaptateur, `npm.cmd run ci`, une courte partie jouée avec le relevé actif puis export : lire le JSON et retrouver équipe, argent, achats et marge sur Carmin ou la Tour Pokémon.

### Effort et risques
Fourchette : 2 à 3 jours. Risque : un instantané trop gros ralentit la boucle ; on ne le prend qu'aux transitions, jamais à chaque pas.

## I. `feat(equilibrage): un simulateur qui joue comme Nicolas quand un boss bloque`

Labels : `type:feat`, `etat:idee`, `est:2-3`, `prio:2` · branche : `v2` · `agent-ok` : oui (outil de mesure, aucune règle de jeu modifiée) · décision de Nicolas du 03/11 (option 2 du ticket C, pour les tests des prochaines régions)

### Histoire
En tant que Nicolas, je veux que le simulateur réagisse à un blocage comme je le fais, pour que ses durées de parcours se comparent à une vraie partie, y compris sur les prochaines régions.

### Contexte
Quand je bloque sur un boss, je ne retente pas en boucle. Dans l'ordre : 1) viser le palier de Pokédex suivant (ses bonus sont souvent des bonus de dégâts) en retournant capturer ; 2) acheter les objets de boutique à bonus de dégâts que je n'ai pas encore, en mettant l'argent de côté ; 3) monter les niveaux de l'équipe ; 4) en dernier recours, acheter Attaque + et Attaque spé + au Centre commercial (c'est ce qui a passé Ronflex). À Carmin et à Céladopole le simulateur annonce 19,0 et 14,4 min de blocage alors que la partie réelle n'a eu aucun échec, parce qu'il ne revient jamais en arrière (rapport C, `docs/projet/equilibrage-blocages.md`).

Fichiers concernés : `scripts/simuler-parcours.mjs`, `docs/projet/equilibrage-28-10.md` (protocole), un rapport comparatif nouveau ; lecture de `data/`. **Panne constatée le 03/11, réparée le 04/11** (la route est sautée en comptant `ronflex.souffle.dureeCumuleeS`, 3 s, borne basse ; baseline ×2 retrouvée : Ligue en 70,8 min, 831 316 gagnés) : le simulateur s'arrêtait à l'entrée de `kanto.route-de-ronflex` (« Zone sans combat », `src/core/monde.ts:22`, la route est devenue un mini-jeu) ; il ne va donc plus jusqu'à la Ligue. À réparer en premier dans ce ticket.

### Critères d'acceptation
- [ ] Étant donné un boss que l'équipe ne bat pas dans le temps imparti, quand le simulateur est bloqué, alors il applique les quatre réactions dans l'ordre ci-dessus, chacune réglable par option de ligne de commande et consignée dans le rapport (action, durée, solde).
- [ ] Étant donné le palier de Pokédex suivant, quand le simulateur retourne capturer, alors le déplacement, le temps de capture et les bonus obtenus sont comptés ; le retour en arrière est borné par un plafond documenté.
- [ ] Étant donné le parcours de Kanto, quand le simulateur est relancé, alors le tableau donne par zone le temps, les échecs et les réactions, à confronter aux deux exports du 03/11 (Ligue en environ 107 min jouées) ; l'écart restant est expliqué.
- [ ] Étant donné les données du jeu, quand le script tourne, alors aucune valeur de `data/` n'est modifiée et le mode précédent (sans réaction) reste disponible comme témoin.

### Hors périmètre
Changement de règle ou de valeur du jeu, équilibrage des prochaines régions (le simulateur sert ensuite à les tester).

### Vérification
Même graine, mêmes résultats ; comparer aux chiffres du rapport C ; `npm.cmd run ci`.

### Effort et risques
Fourchette : 2 à 3 jours. Dépend de : H pour calibrer sur les nouveaux relevés (non bloquant). Risque : un simulateur trop malin devient irréaliste ; réglages visibles et témoin conservé.

## J. `feat(economie): baisser de 20 % les gains d'argent`

Labels : `type:feat`, `etat:fait`, `est:0.5`, `prio:2` · branche : `v2` · `agent-ok` : oui · demande de Nicolas du 03/11, portée confirmée : −20 % partout (×1,6), appliqué le 03/11

### Histoire
En tant que Nicolas, je veux un peu moins d'argent surtout en fin de partie, pour que les achats comptent davantage.

### Contexte
« Je baisserais le gain d'argent de 20 %, surtout à la fin ; on n'en a pas beaucoup trop non plus, mais un peu moins ne ferait pas de mal. » Le multiplicateur global est `recompenses.or.multiplicateur` = 2 dans `data/reglages.json` (ligne 170) ; −20 % donne 1,6. Il s'applique à tous les gains (ennemi, boss, capture, chromatique). Portée tranchée par Nicolas le 03/11 : −20 % partout. Retour arrière : remettre `multiplicateur` à 2. Les tests qui restataient ×2 en dur lisent maintenant le réglage. Mesure avant/après faite le 04/11 (voir le critère) : la Ligue passe de 70,8 à 87,0 min, soit près du haut de la fourchette de 60 à 90 min ; à relire avec le ticket F et la Baie Grena (puits d'environ 76 000 pièces).

### Critères d'acceptation
- [x] Étant donné la portée confirmée par Nicolas, quand la valeur est appliquée, alors seule la valeur de `data/reglages.json` change, avec retour arrière d'une ligne.
- [x] (04/11, simulateur réparé : `node scripts/simuler-parcours.mjs --clics 7 --pokedex theorique`, ×2 → ×1,6 : Ligue gagnée en 70,8 → 87,0 min ; argent gagné 831 316 → 767 762, dépensé 601 939 → 683 900, en caisse à la Ligue 229 377 → 83 862 ; Carmin 19,0 → 18,7 min, Céladopole 14,4 → 1,3 min, Pont Pépite 4,8 → 3,4 min) Étant donné la simulation avant et après, quand les deux sont comparées, alors le rapport donne l'argent gagné, dépensé et restant à la Ligue, et l'effet sur la durée du parcours.

### Hors périmètre
Prix des objets, autres récompenses (niveau, XP).

### Effort et risques
Fourchette : 0,5 jour. Risque : un joueur qui achète déjà tout est ralenti ; décision de Nicolas avant application.

## Dépendances et décisions attendues

- Ordre de lecture et de priorité : A, B, C, D, E, F. B peut être préparé indépendamment d'A ; F n'attend pas E.
- Chaîne de mesures : AB → A ; B et sa partie réelle → C ; A + C → D ; D et validation des seuils → E ; B et sa partie réelle + C → F.
- Nicolas choisit une ligne du tableau A ou conserve l'existant ; l'application attend un ticket validé distinct.
- Nicolas réalise une partie avec le journal B activé et partage volontairement son export local pour C et F.
- Nicolas tranche les options C, valide les cibles D et la tolérance E proposée à 25 %, puis décide des éventuels puits F. Aucun de ces accords n'est présumé par l'ouverture de la phase 3.


