# Audit `src/ui` (fichiers P à Z, sous-dossiers, styles) — 2026-11-19

Périmètre : fichiers de `src/ui/` commençant par P, Q, R, S, T, U, V, Z (dont `store.ts`, `store-*.ts`, `Page*`, `Scene*`, `Pokedex*`, `Shop*`), sous-dossiers `tuto/` et `compte/`, `src/styles/index.css`. Lecture seule, aucun test lancé. `PagePC.tsx` et `index.css` lus en diagnostic ciblé (le CSS surtout par recherche de motifs). Les tests (`*.test.ts(x)`) n'ont été parcourus que pour leur taille et leurs noms : aucun défaut de test n'est affirmé sans preuve. Un écart avec la V1 n'est pas retenu.

Gravité : 1 critique, 2 notable, 3 mineur. Effort : S (moins d'une heure), M (une demi-journée), L (plus). « à confirmer » = non vérifié par exécution.

Décompte honnête : 27 bugs, 14 sécurité, 37 qualité. Le code ne contient ni `innerHTML`, ni `eval`, ni `window.open`, ni `postMessage` ; la surface de sécurité est donc plus petite que le quota de 30 demandé, je n'ai pas gonflé la section.

---

## 1. BUGS

**B-uib-01** — Sauvegarde de fermeture coupée au-delà de 60 000 octets
`src/ui/synchro.ts:269`
Preuve : `keepalive` n'est posé que si le corps fait 60 000 octets ou moins ; au-delà, la requête lancée par `pagehide` n'a aucune garantie de partir, sans repli `sendBeacon`. Une partie avancée (PC de plusieurs centaines de Pokémon) dépasse ce seuil.
Gravité 2. Correctif : envoyer un delta ou un corps compressé sous la limite, ou sauvegarder aussi sur `visibilitychange: hidden` pendant que la page vit encore. Effort M.

**B-uib-02** — Écriture région puis partie non atomique : état local incohérent si la seconde échoue
`src/ui/persistance.ts:84-104`
Preuve : `ecrireRegion(...)` puis `ecrirePartie(...)` ; si le quota `localStorage` est atteint entre les deux, la région est en avance sur la partie et `bloquee = true` (L.102) gèle toute écriture ensuite.
Gravité 2. Correctif : écrire une seule enveloppe (région + partie + pokédex) sous une clé, ou écrire la partie d'abord et la révision en dernier. Effort M.

**B-uib-03** — Contrôle de conflit entre onglets : lecture puis écriture, fenêtre de course
`src/ui/persistance.ts:84-104`
Preuve : `actuelle?.revision !== partie.revision` est lu, puis l'écriture suit sans verrou. Deux onglets qui sauvegardent dans la même milliseconde passent tous les deux et le second écrase le premier (à confirmer : dépend de l'ordre d'exécution des intervalles de 2 onglets).
Gravité 2. Correctif : `navigator.locks.request` autour de lecture+écriture, ou événement `storage` pour détecter l'autre onglet. Effort M.

**B-uib-04** — Après une erreur d'écriture, les réglages son et préférences sont perdus sans message
`src/ui/persistance.ts:72,78,87`
Preuve : `if (bloquee) return;` / `if (bloquee || suivantes === dernieresPreferences) return;`. Une fois `bloquee` posée (même par un simple conflit de révision, L.102), changer le volume ou une préférence ne s'enregistre plus et n'avertit pas.
Gravité 2. Correctif : ne bloquer que la partie ; les préférences ont leur propre clé et peuvent continuer. Effort S.

**B-uib-05** — Réponse 200 dont le JSON est illisible : statut « hors ligne » et révision acceptée non retenue
`src/ui/synchro.ts:272-280,302`
Preuve : `await reponse.json()` après un 200, dans le `try` dont le `catch` pose `statut = 'hors-ligne'`. Le serveur a accepté la révision, le client ne l'a pas mémorisée : le prochain envoi part avec une `revisionBase` périmée, donc 409 (à confirmer).
Gravité 2. Correctif : parser dans un `try` séparé et mémoriser la révision connue avant. Effort S.

**B-uib-06** — Une entrée locale corrompue casse toute la liste des parties
`src/ui/synchro.ts:341`
Preuve : `gestionnaire.chargerPartie(p.id)!` hors `try` dans `lister` ; la lecture d'une seule entrée invalide jette et la liste entière échoue.
Gravité 2. Correctif : `try/catch` par partie, partie marquée « illisible ». Effort S.

**B-uib-07** — Bouton « Salle » actif pendant une animation : message de résultat perdu
`src/ui/PageCasino.tsx` (fonction `changer`, appel à partir de L.52) ; `Roulette.tsx`, `PileOuFace.tsx`, `PlusOuMoins.tsx`
Preuve : le gain est crédité au clic (`occuper(resultat.gain)` après l'appel au store) puis animé ; changer de vue pendant l'animation démonte le jeu, les minuteurs sont nettoyés mais `occuper(null)` n'est pas rappelé, et le message du gain ne s'affiche jamais.
Gravité 2. Correctif : désactiver la navigation tant que `occupe`, ou rappeler `occuper(null)` et afficher le résultat au démontage. Effort S.

**B-uib-08** — Tutoriel : la carte ne prend pas le focus et n'écoute pas Échap
`src/ui/tuto/Tutoriel.tsx:156-162`
Preuve : `role="region"` sans gestion de focus ; « Passer le tuto » n'est atteignable qu'après avoir tabulé toute la page. Un utilisateur clavier ou lecteur d'écran ne peut pas fermer le tuto sans traverser la page.
Gravité 2. Correctif : lien d'évitement ou focus sur la carte à chaque étape, Échap pour passer. Effort M.

**B-uib-09** — Espace et Entrée liés à « attaquer » : double action possible sur un bouton focalisé
`src/ui/useRaccourcisPC.ts` (table `actions`, L.17-29)
Preuve : `' '` et `Enter` sont mappés vers `attaquer`, et le garde ignore seulement `defaultPrevented`, `ctrl/meta/alt`, `repeat`. Sur un bouton focalisé, la touche déclenche le clic du bouton ET l'attaque (à confirmer : dépend de la vérification de `event.target` en tête de gestionnaire, non relue).
Gravité 2. Correctif : ignorer les cibles `button, a, input, select, [role]`. Effort S.

**B-uib-10** — `Authorization: Bearer null` envoyé quand il n'y a pas de jeton
`src/ui/synchro.ts:90-96`
Preuve : `Bearer ${options.jeton()}` sans contrôle ; seuls `lister`, `resoudre` et `restaurerVersion` testent `!options.jeton()`. `listerVersions`, `ouvrirPartie`, `lireVersion` envoient la chaîne `Bearer null`.
Gravité 3. Correctif : ne poser l'en-tête que si le jeton existe, sinon sortir sans requête. Effort S.

**B-uib-11** — Temps perdu après une longue veille ignoré, sans information au joueur
`src/ui/store.ts:1389` (`boucle?.tick();`), `src/core/loop.ts`
Preuve : `tick()` renvoie `{ pas, perduMs }` mais l'appelant ignore `perduMs`. Au retour d'une veille longue, le rattrapage est plafonné par `rattrapageMaxMs` et le reste disparaît sans trace (à confirmer : peut être voulu par le ticket de jeu hors ligne).
Gravité 3. Correctif : afficher « tu étais absent X minutes » avec `perduMs`, ou le créditer selon la règle du ticket. Effort S.

**B-uib-12** — Verrou `actif.current` du vol de Pokémon jamais relâché si `allerVers` lève
`src/ui/VolGen1.tsx:22-41`
Preuve : `lancer` pose `actif.current = true` sans `try/finally` ; une exception dans le chemin laisse le vol bloqué jusqu'au rechargement.
Gravité 3. Correctif : `try { … } finally { actif.current = false }`. Effort S.

**B-uib-13** — Mini-jeu de Ronflex sans boucle si les variables CSS de durée manquent
`src/ui/SceneRonflex.tsx:12-15,36`
Preuve : lecture de `--duree-signal` et `--duration-normal` ; `if (!(note > 0 && pas > 0)) return;` sort sans rien lancer. Si un jeton CSS est renommé, la scène reste figée sans erreur (à confirmer).
Gravité 3. Correctif : valeur de repli lue de `reglages`, pas du CSS. Effort S.

**B-uib-14** — Query `matchMedia` du Panthéon lue une seule fois
`src/ui/Pantheon.tsx:24`
Preuve : `window.matchMedia('(min-width: 768px)')` évalué au rendu, sans écouteur ; une rotation ou un redimensionnement ne met pas la mise en page à jour.
Gravité 3. Correctif : `useSyncExternalStore` sur `matchMedia` (déjà fait par `useTelephone`). Effort S.

**B-uib-15** — Mutation directe de `classList` sur un élément géré par React
`src/ui/Pantheon.tsx:93`
Preuve : l'effet ajoute/retire une classe sur un nœud rendu par React ; un re-rendu qui réécrit `className` écrase la classe.
Gravité 3. Correctif : passer la classe par l'état et le rendu. Effort S.

**B-uib-16** — Fermeture du détail Pokédex mobile sur `onPointerDown` du fond
`src/ui/PokedexTelephone.tsx:136`
Preuve : un geste de défilement qui commence sur le fond, ou un toucher qui traverse, ferme la fiche avant le `click`.
Gravité 3. Correctif : fermer sur `click` du fond uniquement si `event.target === event.currentTarget`. Effort S.

**B-uib-17** — « Pas assez d'argent. » affiché pour toute raison de non-achat
`src/ui/PageCentre.tsx:56`
Preuve : le message s'affiche si `!objet.abordable` ; `abordable` vaut `!possede && argent >= prix` (`store-boutique.ts:44`) : pour un objet déjà possédé, le texte est faux (à confirmer : dépend de la catégorie d'objets proposée au Centre).
Gravité 3. Correctif : distinguer « déjà possédé » et « pas assez d'argent ». Effort S.

**B-uib-18** — Quantité non remise à 1 au changement de sélection
`src/ui/PageCentre.tsx` (état `nombre`)
Preuve : `nombre` n'est pas réinitialisé quand l'objet sélectionné change ; une quantité de 9 choisie pour un objet peut s'appliquer à un autre, plafonnée seulement par le maximum de l'objet (à confirmer).
Gravité 3. Correctif : `key={objet.id}` sur le sélecteur ou remise à 1 au changement. Effort S.

**B-uib-19** — Carte du Centre reste montée sous `hidden`
`src/ui/PageCentre.tsx:36-37`
Preuve : le contenu masqué continue de recevoir ses abonnements au store et de se rendre ; ses boutons restent dans l'arbre si `hidden` est surchargé par du CSS `display` (à confirmer).
Gravité 3. Correctif : ne pas monter la carte quand elle est masquée. Effort S.

**B-uib-20** — Tutoriel : `scrollIntoView` pendant 1,5 s contre le défilement du joueur
`src/ui/tuto/Tutoriel.tsx:121-128`
Preuve : tant que `performance.now() - debutDefilement < 1500`, chaque `placer()` (déclenché par chaque mutation DOM ou défilement, L.140-145) recadre la cible ; un joueur qui fait défiler est ramené en arrière.
Gravité 3. Correctif : n'appeler `scrollIntoView` qu'à la première pose de la cible. Effort S.

**B-uib-21** — Piège à Tab fait main concurrent de `<dialog>.showModal()`
`src/ui/useRaccourcisPC.ts:21-29`
Preuve : le hook intercepte `Tab` pour les `<dialog>` alors que `showModal()` confine déjà le focus ; deux mécanismes peuvent se contredire (focus qui saute, premier élément atteint deux fois) (à confirmer).
Gravité 3. Correctif : retirer le piège pour les `<dialog>` natifs. Effort S.

**B-uib-22** — Sac : en utilisation en série, seul le dernier message est annoncé
`src/ui/Sac.tsx:62-75`
Preuve : chaque utilisation remplace le message dans la région `role="status"` ; plusieurs utilisations rapprochées n'annoncent que la dernière.
Gravité 3. Correctif : file de messages ou concaténation courte. Effort S.

**B-uib-23** — Deux `<h2>` « Ton Sac » et deux régions `role="status"`
`src/ui/PanneauSac.tsx:29`, `src/ui/Sac.tsx:35`
Preuve : le même titre est rendu par le panneau et par le composant ; lecteurs d'écran : titre dupliqué, annonces doublées.
Gravité 3. Correctif : un seul titre et une seule région live. Effort S.

**B-uib-24** — Table des types : surbrillance au survol seulement, en-têtes en `<td>`
`src/ui/TableTypes.tsx` (en-tête, L.52 ; `onMouseEnter` sur les cellules)
Preuve : la ligne/colonne n'est mise en évidence qu'à la souris ; au clavier ou au toucher, aucune aide de lecture. Les en-têtes sont des `<td>`, sans `scope`.
Gravité 3. Correctif : `<th scope="col|row">` et surbrillance au `focus`/`tap`. Effort S.

**B-uib-25** — Scène de lieu : boutons absolus qui se chevauchent à 390 px
`src/ui/SceneLieu.tsx:97-103`
Preuve : boutons en `position:absolute` avec `min-h-11 min-w-11` ; sur écran étroit, les zones de toucher se recouvrent (à confirmer par capture à 390 px, non faite).
Gravité 3. Correctif : placement en grille sous 640 px. Effort M.

**B-uib-26** — Annonce `aria-live` à chaque survol d'une zone de scène
`src/ui/SceneLieu.tsx` (`annoncer(texte)`)
Preuve : `annoncer` est appelée au survol ; la région `role="status"` répète le texte à chaque passage de souris, bavard pour un lecteur d'écran.
Gravité 3. Correctif : n'annoncer qu'au focus ou au clic. Effort S.

**B-uib-27** — Intro : message d'erreur jamais effacé, choix du starter sans garde de double clic
`src/ui/PageIntro.tsx:69,72`
Preuve : `choisirStarter` n'est pas verrouillé pendant l'appel ; `erreur` n'est jamais remise à `null`, y compris après un choix réussi (à confirmer pour le double clic : dépend du rendu qui suit).
Gravité 3. Correctif : verrou local et `erreur` réinitialisée à chaque tentative. Effort S.

---

## 2. SÉCURITÉ

**S-uib-01** — Jeton Bearer stocké en clair dans `localStorage`
`src/ui/compte/session-compte.ts:12`
Preuve : `localStorage.setItem(CLE_SESSION, jeton)`. Tout script exécuté dans la page (une dépendance compromise, une future faille XSS) lit le jeton de session. Atténuant : aucun `innerHTML`, `eval` ni `dangerouslySetInnerHTML` dans `src/ui`.
Gravité 2. Correctif : cookie `HttpOnly; Secure; SameSite` posé par le serveur (better-auth le gère), ou jeton court + rafraîchissement. Effort L.

**S-uib-02** — Déconnexion sans réessai : le jeton peut rester valide côté serveur
`src/ui/compte/session-compte.ts:77-83`
Preuve : `memoriser(null)` efface le jeton local, puis `deconnecter(ancien)` est tenté une fois ; en cas d'échec réseau, le jeton, volé ou copié, reste valide jusqu'à son expiration.
Gravité 2. Correctif : conserver le jeton à révoquer dans une file de révocation rejouée au prochain démarrage. Effort M.

**S-uib-03** — Les parties locales ne sont pas rattachées au compte : possible mélange entre comptes sur un même appareil
`src/ui/persistance.ts`, `src/ui/compte/EcranCompte.tsx:112`
Preuve : le texte « ta partie sur cet appareil est conservée » après expiration ; les clés `pokiclicker:*` ne contiennent pas d'identifiant de compte (à confirmer : la gestion d'identité de la partie n'a pas été relue). Un second compte sur le même navigateur pourrait voir ou téléverser la partie du premier.
Gravité 2. Correctif : préfixer les clés par l'identifiant de compte, ou vider/archiver à la déconnexion. Effort M.

**S-uib-04** — Aucune politique CSP trouvée dans le dépôt applicatif
`index.html`, `public/`, `vite.config.*`
Preuve : recherche de `Content-Security-Policy` sans résultat dans ces fichiers (à confirmer : l'en-tête peut être posé par Coolify/le reverse proxy, hors dépôt). Sans CSP, le jeton de `S-uib-01` n'est pas protégé contre un script injecté.
Gravité 2. Correctif : CSP stricte (`default-src 'self'`, `connect-src` vers l'API) au proxy. Effort M.

**S-uib-05** — Porte dérobée de développement active en production
`src/ui/store.ts:1425,1429`
Preuve : `equipeDeDeveloppement()` lit `localStorage.getItem('pokiclicker-dev:equipe-de-depart')` et `armementTutoAutorise` lit `'pokiclicker-dev:tuto'`, sans garde `import.meta.env.DEV`. Un joueur pose la clé et démarre une partie avec l'équipe de départ de développement, synchronisée ensuite sur le serveur.
Gravité 3. Correctif : garde `import.meta.env.DEV || MODE === 'test'`. Effort S.

**S-uib-06** — Message distinguant « le compte existe déjà » : énumération de comptes
`src/ui/compte/api-compte.ts:3-10`
Preuve : `USER_ALREADY_EXISTS` → « Ce compte existe déjà. Connecte-toi. » ; un attaquant teste des adresses. La réinitialisation, elle, renvoie un message neutre (`EcranCompte.tsx:82`).
Gravité 3. Correctif : message neutre à l'inscription et vérification par e-mail. Effort S (côté serveur surtout).

**S-uib-07** — Partie locale de l'e-mail envoyée comme `name`
`src/ui/compte/api-compte.ts:40`
Preuve : `name: email.split('@')[0]` ; données personnelles envoyées comme nom d'affichage, potentiellement visibles ailleurs (classement, partage).
Gravité 3. Correctif : nom neutre généré ou champ saisi par l'utilisateur. Effort S.

**S-uib-08** — URL de l'API construite sans contrôle de `VITE_API_URL`
`src/ui/compte/api-compte.ts:16`
Preuve : `${import.meta.env.VITE_API_URL?.replace(/\/$/, '')}/api/auth/…` produit `undefined/api/auth/…` si la variable est absente (appelé seulement quand elle est définie, `App.tsx:303`, mais rien ne l'impose dans ce module).
Gravité 3. Correctif : une constante validée au chargement, erreur claire sinon. Effort S.

**S-uib-09** — Identifiant d'appareil dans l'URL et dans le chemin
`src/ui/synchro.ts:99-100`, `src/ui/appareil.ts:32`
Preuve : `?appareilId=${encodeURIComponent(appareilId)}` et chemin ; les journaux de proxy et de l'hébergeur le conservent. `referrerPolicy: 'no-referrer'` limite la fuite vers des tiers, pas vers l'hébergeur.
Gravité 3. Correctif : mettre l'identifiant dans un en-tête ou le corps. Effort S.

**S-uib-10** — Message d'erreur technique affiché tel quel à l'utilisateur
`src/ui/persistance.ts:13-21`
Preuve : `detailErreur` renvoie `${erreur.name}: ${erreur.message}` et appelle `console.error(erreur)` ; un message de navigateur (quota, chemin interne) s'affiche dans l'interface.
Gravité 3. Correctif : message de jeu en français, détail technique dans la console seulement. Effort S.

**S-uib-11** — Aucune borne de longueur sur e-mail et mot de passe côté client
`src/ui/compte/EcranCompte.tsx:113-118`
Preuve : pas de `maxLength` sur les champs `email` et `motDePasse` (contrairement à `EcranParties.tsx:97,118`, `maxLength={100}`) ; un mot de passe de plusieurs Mo part au serveur (le hachage coûteux est une charge possible). La borne réelle est côté serveur (à confirmer).
Gravité 3. Correctif : `maxLength` raisonnable (254 / 128) et contrôle côté serveur. Effort S.

**S-uib-12** — Interrogation de session toutes les minutes par onglet
`src/ui/compte/session-compte.ts:55`
Preuve : `setInterval(valider, 60_000)` ; N onglets font N appels `get-session` par minute et risquent d'atteindre une limite de débit (429), après quoi la session est traitée comme valide (L.46-47).
Gravité 3. Correctif : valider au retour de visibilité et à la reprise réseau, ou mutualiser par `BroadcastChannel`. Effort S.

**S-uib-13** — Toute erreur de validation de session autre que 401 laisse la session « valide »
`src/ui/compte/session-compte.ts:46-47`
Preuve : seul le 401 invalide ; 403, 429, 500 appellent `fixerValide(true)`. Voulu pour le hors-ligne, mais un 403 (compte suspendu) laisse jouer et synchroniser.
Gravité 3. Correctif : traiter 403 comme 401. Effort S.

**S-uib-14** — Redirection de réinitialisation fixée sur `window.location.origin`
`src/ui/compte/api-compte.ts:47`
Preuve : `redirectTo: window.location.origin` ; inoffensif tant que le serveur valide la liste d'origines autorisées (à confirmer côté serveur : s'il accepte n'importe quel `redirectTo`, le lien du courriel peut pointer ailleurs).
Gravité 3. Correctif : liste blanche d'origines côté serveur. Effort S.

---

## 3. QUALITÉ

**Q-uib-01** — `store.ts` : 1424 lignes, toutes les responsabilités dans un objet d'actions unique
`src/ui/store.ts` (L.253-1430)
Preuve : boucle, persistance, événements, casino, pension, tuto, journal, évolution, sons, synchronisation, démarrage (`demarrer`, L.1287-1369) dans une fonction `creerStoreJeu`. Les `store-*.ts` existent mais ne portent que des fonctions d'affichage.
Gravité 2. Correctif : découper en tranches (zustand `slices`) par domaine, `demarrer` dans un module. Effort L.

**Q-uib-02** — Mémoïsation par `JSON.stringify`, ~12 sérialisations par tick
`src/ui/store.ts:253,614-655` ; `store-boutique.ts:46,64` ; `store-casino.ts:73` ; `store-capture.ts:28`
Preuve : `JSON.stringify(actifs) !== JSON.stringify(coeur.actifs)` à chaque tick ; `afficher()` compare 12 sous-états de la même façon ; le coût croît avec les objets et le Pokédex.
Gravité 2. Correctif : comparaison structurelle ciblée ou version de révision par sous-état. Effort M.

**Q-uib-03** — Ajouter un objet utilisable impose d'éditer une chaîne de ternaires
`src/ui/store-boutique.ts:59-62`
Preuve : `objet.inventaire === 'bonbon' ... : 'pomegBerry' ? 'baie' : 'everstone' ? 'stase' : 'shinyToken' ? 'jeton' : direct.includes(...)` ; le mode d'utilisation d'un objet est codé en dur dans l'UI plutôt que dans `data/`.
Gravité 2. Correctif : champ `utilisable` dans le JSON des objets, lu par le cœur. Effort M.

**Q-uib-04** — `store-capture.ts` décide par comparaison de textes d'erreur
`src/ui/store-capture.ts:19,26`
Preuve : `transitoires = ['Aucun Pokémon à capturer.', 'Une capture est déjà en cours.']` et `transitoires.includes(condition.raison ?? '')` : reformuler un message du cœur change le comportement de l'affichage.
Gravité 2. Correctif : un code de raison (`'aucun-ennemi' | 'capture-en-cours'`) renvoyé par `verifierLancer`. Effort S.

**Q-uib-05** — Erreurs avalées en silence dans la synchro et le store
`src/ui/store.ts:277-280` ; `src/ui/synchro.ts:302`
Preuve : `try { abonne(fermeture); } catch { /* la synchro ne doit jamais gêner le jeu */ }` et `catch { if (!arrete) statut = 'hors-ligne'; }` : toute exception (bug de code compris) devient « hors ligne » sans trace, ce qui masque les régressions.
Gravité 2. Correctif : journaliser au moins en développement et séparer erreur réseau / erreur de code. Effort S.

**Q-uib-06** — Tutoriel : coût DOM à chaque mise à jour du store
`src/ui/tuto/Tutoriel.tsx:11,49-69` ; `src/ui/tuto/cibles.ts:3-11`
Preuve : `armer` est abonné à `storeJeu.subscribe` (donc à chaque tick) et exécute d'abord `modaleOuverte()` (3 `querySelectorAll`) avant le test « tous les tutos vus » (L.53, malgré le commentaire « Sans DOM d'abord ») ; un `MutationObserver` observe `document.body` en `subtree` (L.67), déclenché par chaque dégât ou barre de PV du combat ; `visible()` appelle `getComputedStyle` sur toute la chaîne d'ancêtres de chaque élément.
Gravité 2. Correctif : tester `tutosVus` en premier et débrancher les observateurs quand tout est vu ; limiter l'observation à `#contenu`. Effort S.

**Q-uib-07** — Assertions `!` sur des `find` qui peuvent échouer
`SceneRonflex.tsx:9-11` ; `ScenesBourgPalette.tsx:42` ; `PageIntro.tsx:52` ; `SceneFin.tsx:21,38-39` ; `Pantheon.tsx:76` ; `PagePension.tsx:93`
Preuve : `.find(...)!`, `commande.scene!`, `tailles[decor]!`, `querySelector(...)!`, `pension.prochainEmplacement!.prix` ; un identifiant manquant dans `data/` plante le rendu entier au lieu d'afficher une erreur localisée. Plusieurs sont évalués à l'import (plantage au chargement de l'appli).
Gravité 2. Correctif : un helper `requis(x, message)` qui nomme la donnée manquante, et une validation au chargement des données. Effort M.

**Q-uib-08** — Mini-jeux du casino : même squelette dans quatre fichiers
`Roulette.tsx`, `PileOuFace.tsx`, `PlusOuMoins.tsx`, `TableBlackjack.tsx` ; `PageCasino.tsx`
Preuve : `lancer` / `terminer` / `actif` / `delais` / `usePluie` recopiés ; chaque nouveau jeu en ajouterait une copie ; `actions = store.getState()` repris dans chaque composant (`PageCasino.tsx:45`).
Gravité 2. Correctif : hook `useTourDeJeu` (verrou, minuteurs, gain différé). Effort M.

**Q-uib-09** — `Pokedex.tsx` et `PokedexTelephone.tsx` dupliquent filtre et fiche
`src/ui/Pokedex.tsx`, `src/ui/PokedexTelephone.tsx`
Preuve : `normaliser`, filtre et `Fiche` / `DetailEspece` presque identiques ; correctif d'un côté oublié de l'autre ; grille de 151 cases non virtualisée.
Gravité 2. Correctif : composants et hook de filtre partagés, deux habillages. Effort M.

**Q-uib-10** — Deux arbres de rendu pilotés par JavaScript (`useTelephone`) au lieu du CSS
`PagePC.tsx` (`telephone ? … : …` partout, L.217,257,298-418) ; `compte/EcranCompte.tsx:54,103-106` (`const Formulaire = telephone ? Fragment : 'div'`)
Preuve : `useTelephone` = `(max-width: 1023px)` ; classes `lg:` de Tailwind ET condition JS pour la même frontière : deux sources de vérité ; le premier rendu avant la mesure peut afficher la mauvaise disposition.
Gravité 2. Correctif : un seul rendu, différences en CSS (`lg:`) ; JS seulement pour le comportement. Effort L.

**Q-uib-11** — `PagePC.tsx` : composant de 419 lignes, ~20 `useState`, fonctions imbriquées, `pokemon` masqué
`src/ui/PagePC.tsx:60-419`
Preuve : le paramètre `pokemon` des fonctions (L.121,153,212,353) et du `.map` (L.347) masque la constante `pokemon` de L.90 ; mode objet, mode échange, tri, filtre, lot, menu contextuel et glisser-déposer sont dans le même composant.
Gravité 2. Correctif : extraire `GrillePc`, `EquipePc`, `useSelectionLot`, `useModeObjet`. Effort L.

**Q-uib-12** — PC : sélection en lot en O(n²) et grille non virtualisée
`src/ui/PagePC.tsx:351,358` (`effectifs.some(p => p.uid === pokemon.uid)` deux fois par case) ; `:79`
Preuve : avec 1000 Pokémon et une sélection, `effectifs.some` est évalué 2 × 1000 × |sélection| par rendu ; `etatObjet(pokemon)` et `dpsPc(pokemon)` sont recalculés pour chaque case à chaque rendu ; `new Set(pokedex)` recréé à chaque `useMemo`.
Gravité 2. Correctif : `Set` des uid sélectionnés, virtualisation (liste fenêtrée) au-delà de ~200 cases. Effort M.

**Q-uib-13** — Constantes de jeu écrites en dur dans l'UI
`src/ui/PagePlus.tsx:116,121,141` (`/ 8`, `/ 151`, alors que L.163 utilise `progression.total`) ; `src/ui/ZoneLigne.tsx:41,46,47` (`length: 10`, `/10`, « sur 10 »)
Preuve : ajouter une région ou changer le nombre d'étapes d'une zone laisse ces affichages faux.
Gravité 2. Correctif : lire `progression.total`, `badgesTotal`, `etapesParZone` depuis le cœur. Effort S.

**Q-uib-14** — Cette mémoïsation est recopiée dans chaque `afficher*`
`src/ui/store-boutique.ts:46,64` ; `store-casino.ts:73` ; `store-capture.ts:28`
Preuve : `return JSON.stringify(x) === JSON.stringify(precedent) ? precedent! : x;` quatre fois, avec un `!` non vérifié sur `precedent` (`store-casino.ts:73`, `store-boutique.ts:46,64`).
Gravité 3. Correctif : un utilitaire `memoiser(precedent, suivant)`. Effort S.

**Q-uib-15** — Évaluation de données au chargement du module
`src/ui/store-boutique.ts:10,22-23` ; `ScenesBourgPalette.tsx:12-14`
Preuve : `chargerEvolutions()`, `chargerObjets()` au niveau module, `kanto.lieu('pension')` à l'import ; l'ordre d'import et les tests qui substituent des données deviennent fragiles, et ajouter une région oblige à toucher ces fichiers.
Gravité 3. Correctif : calcul paresseux (mémoïsé à la première utilisation). Effort S.

**Q-uib-16** — Logique métier d'éclosion dans l'UI
`src/ui/store-pension.ts:41-63`
Preuve : `construireEclosions` calcule espèces écloses, paliers de succès gagnés et diamants à partir de `registreSucces` ; ce calcul est du jeu pur, hors `src/core`, et le fichier s'appelle « pension » pour des éclosions.
Gravité 3. Correctif : déplacer dans `src/core` (pension/succès), l'UI ne garde que le format. Effort M.

**Q-uib-17** — Même crochet « première entrée » écrit deux fois
`src/ui/store-casino.ts:38-51` ; `src/ui/store-pension.ts:22-35`
Preuve : `Set` d'écouteurs, `sur…`, `signaler…` avec le même `try/catch` muet ; ajouter un troisième lieu recopierait le motif.
Gravité 3. Correctif : un petit `creerCrochet<T>()` partagé. Effort S.

**Q-uib-18** — `noterDansPokedex` : triple calcul et écritures en trop
`src/ui/store.ts:297-301`
Preuve : `pokedexDeKanto(...)` évalué trois fois ; `executer({ type: 'palier-pokedex', palier: 151 })` à chaque appel dès 151 (idempotence à confirmer) ; `precedent = numero === undefined ? persistance.pokedex : pokedex` provoque une sauvegarde de plus au démarrage.
Gravité 3. Correctif : calculer une fois, n'exécuter le palier qu'au franchissement. Effort S.

**Q-uib-19** — `synchro.ts` : variable masquée et cast de contournement
`src/ui/synchro.ts:222,284`
Preuve : `(statut as EtatSynchro) === 'hors-ligne'` contourne le rétrécissement de type de TypeScript ; `const corps` (L.284) masque `corps` de L.258.
Gravité 3. Correctif : renommer, typer le statut comme `let statut: EtatSynchro`. Effort S.

**Q-uib-20** — Lecture avec effet de bord
`src/ui/synchro.ts:461-469` (`lireAvis`)
Preuve : la lecture supprime la clé ; sous `StrictMode` (double exécution) ou rendu concurrent, l'avis est perdu à la seconde lecture.
Gravité 3. Correctif : `lireAvis` pure, `effacerAvis` séparée appelée après affichage. Effort S.

**Q-uib-21** — `listerVersions`/`creerPartie` : une requête réseau pour un simple compte
`src/ui/synchro.ts:398`
Preuve : `creerPartie` appelle `lister()` (réseau) pour vérifier la limite de 20 parties ; la création échoue ou ralentit hors ligne.
Gravité 3. Correctif : compter les parties locales, laisser le serveur refuser. Effort S.

**Q-uib-22** — Intervalles qui tournent onglet masqué
`src/ui/synchro.ts:474` ; `src/ui/compte/session-compte.ts:55`
Preuve : `setInterval(enLigne, 45_000)` et `setInterval(valider, 60_000)` sans test de `document.visibilityState` : réveils inutiles, batterie sur mobile (priorité du projet).
Gravité 3. Correctif : suspendre sur `visibilitychange`. Effort S.

**Q-uib-23** — Reflows forcés à chaque placement de la carte du tuto
`src/ui/tuto/Tutoriel.tsx:132` ; `src/ui/tuto/placement.ts:26`
Preuve : `hauteur(largeur)` écrit `style.width` puis lit `offsetHeight`, et `placerTuto` l'appelle 4 fois (2 côtés × haut/bas) : 4 reflows par placement, à chaque mutation.
Gravité 3. Correctif : mesurer une fois par largeur, mettre en cache. Effort S.

**Q-uib-24** — Tutoriel : désactivation du lint, casts et `setState` en rendu
`src/ui/tuto/Tutoriel.tsx:35-38,42,91`
Preuve : `if (cleEtape !== etapeDite) { noterEtape(...); annoncer(...) }` pendant le rendu ; `(rejeu.current as { id?: string } | null)` ; `eslint-disable react-hooks/exhaustive-deps`.
Gravité 3. Correctif : `useEffect` sur `cleEtape`, `useRef<TutoActif | null>` typé, `avancer` stabilisé par `useCallback`. Effort S.

**Q-uib-25** — `mouvementReduit` copié quatre fois
`PageIntro.tsx:12` ; `BoiteDialogue.tsx:5` ; `ScenesBourgPalette.tsx:37` ; `VolGen1.tsx:17`
Preuve : quatre lectures de `prefers-reduced-motion`, certaines évaluées une fois seulement (ne suivent pas un changement du système).
Gravité 3. Correctif : un hook `useMouvementReduit` partagé, réactif. Effort S.

**Q-uib-26** — `StatistiquesPage.tsx` : même JSX écrit pour PC et téléphone
`src/ui/StatistiquesPage.tsx`
Preuve : `cartes` pour le PC, puis le même rendu réécrit pour le téléphone.
Gravité 3. Correctif : un rendu, deux dispositions CSS. Effort S.

**Q-uib-27** — Pension : liste du PC filtrée et triée à chaque frappe
`src/ui/PagePension.tsx` (`trierPc(filtrerPc([...liste]...))`, `couplePonte` par candidat)
Preuve : copie, filtre et tri complets du PC à chaque caractère tapé, sans `useMemo` ni temporisation.
Gravité 3. Correctif : `useMemo` + `useDeferredValue` sur la recherche. Effort S.

**Q-uib-28** — Table des types : ~324 cellules rendues de nouveau à chaque survol
`src/ui/TableTypes.tsx`
Preuve : l'état de survol est dans le composant parent ; chaque `onMouseEnter` re-rend toute la table (18 × 18).
Gravité 3. Correctif : surbrillance en CSS (`:hover` + `:focus-within`), ou cellules mémoïsées. Effort S.

**Q-uib-29** — Mini-jeu de Ronflex : re-rendu à chaque image
`src/ui/SceneRonflex.tsx:59`
Preuve : `mesurer(...)` appelle un `setState` à chaque frame, soit 60 re-rendus par seconde du composant entier.
Gravité 3. Correctif : mettre à jour le style via `ref` dans `requestAnimationFrame`, `setState` seulement aux changements de phase. Effort S.

**Q-uib-30** — `PagePlus.tsx` : types d'union de sous-page dupliqués, page Badges en ligne, `<h2>` dans une grille de tuiles
`src/ui/PagePlus.tsx:72,100,150,168`
Preuve : l'union des sous-pages est déclarée deux fois (L.72 et L.100) ; les `<h2>` sont placés dans le conteneur `menu-pc-tuiles grid-cols-3` (mise en page à confirmer par capture).
Gravité 3. Correctif : un type exporté, la page Badges en composant propre. Effort S.

**Q-uib-31** — `PageReglages.tsx` : bloc « interrupteur + titre + description » répété ~8 fois
`src/ui/PageReglages.tsx`
Preuve : le même balisage copié ; le curseur de volume écrit dans `localStorage` à chaque cran (`PageReglages.tsx:19-21` → `volumes.ts:22`) sans anti-rebond ; volumes et musique non synchronisés entre onglets.
Gravité 3. Correctif : composant `Reglage`, écriture sur `change`/relâchement. Effort S.

**Q-uib-32** — Référence DOM dans un état de store
`src/ui/sacContexte.ts` (`declencheur: HTMLElement`) ; `PanneauSac.tsx:7` redéfinit `ObjetAChoisir` déjà défini en `sacContexte.ts:5`
Preuve : un élément DOM stocké dans zustand (non sérialisable, retient le nœud) et un type recopié.
Gravité 3. Correctif : stocker un identifiant, exporter le type une seule fois. Effort S.

**Q-uib-33** — Breakpoints CSS exprimés de cinq façons
`src/styles/index.css:112,127,310,320,356,502,533,555-558`
Preuve : `theme(--breakpoint-lg)`, `max-width: 63.999rem`, `min-width: 64rem`, `min-width: 1024px`, `min-width: 1200px`, `max-width: 1199px` ; une frontière modifiée à un endroit laisse les autres.
Gravité 3. Correctif : une seule syntaxe (`@media (width >= theme(--breakpoint-lg))`). Effort S.

**Q-uib-34** — `compte.test.tsx` (451 lignes) chevauche les tests par écran
`src/ui/compte/compte.test.tsx`, `EcranCompte.test.tsx` (110), `ZoneCompte.test.tsx` (100)
Preuve : un fichier global de 451 lignes plus un fichier par écran ; recouvrement probable des scénarios de connexion (à confirmer : tests non lus en détail).
Gravité 3. Correctif : répartir les cas dans les fichiers par écran, garder le global pour l'enchaînement. Effort M.

**Q-uib-35** — Tutoriel et casino : singletons globaux importés par plusieurs modules
`src/ui/tuto/store-tuto.ts` (`storeTuto`), `src/ui/store.ts:1414-1430` (`storeJeu` créé à l'import), `sacContexte.ts` (`storeSac`)
Preuve : trois magasins créés à l'import, `Tutoriel.tsx` lit `storeJeu` et `storeSac` directement ; les tests doivent réinitialiser des états globaux et deux instances du jeu ne coexistent pas.
Gravité 3. Correctif : contexte React ou injection du store dans `Tutoriel`. Effort M.

**Q-uib-36** — `PagePC.tsx:200` : écouteur `keydown` global pour Échap sans arrêt de propagation
`src/ui/PagePC.tsx:198-203`
Preuve : `document.addEventListener('keydown', …)` annule le choix d'objet sur toute touche Échap, y compris quand elle sert à fermer une fenêtre ouverte par-dessus (à confirmer : le `<dialog>` natif ferme sur `cancel`, mais l'écouteur document s'exécute aussi).
Gravité 3. Correctif : tester `event.defaultPrevented` et l'absence de modale ouverte. Effort S.

**Q-uib-37** — Vidéo de la télé préchargée même quand elle n'est jamais allumée
`src/ui/SceneLieu.tsx:71`
Preuve : `<video preload="metadata">` est demandée à chaque entrée dans la scène ; requête réseau inutile sur mobile.
Gravité 3. Correctif : `preload="none"` jusqu'à l'allumage. Effort S.
