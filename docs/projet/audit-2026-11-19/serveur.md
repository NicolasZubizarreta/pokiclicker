# Audit serveur et outillage (19/11/2026)

Périmètre : `server/` (src, tests, Dockerfile, compose, `.env.example`, package.json), `scripts/` (39 fichiers), `.github/`, `package.json` et verrou racine, `vite.config.ts`, `index.html`, `eslint.config.js`, `.gitignore`, `.dockerignore`, `README.md`. Côté client, lus pour comprendre les échanges : `src/ui/synchro.ts`, `src/ui/appareil.ts`, `src/ui/compte/api-compte.ts`, `src/ui/compte/session-compte.ts`. Méthode : lecture ligne par ligne, exécution locale de deux commandes (`npm audit --omit=dev`, `Date.parse`), aucune requête vers un serveur distant. Rien n'a été modifié dans le dépôt.

Constats négatifs vérifiés (pas de candidat) :
- `npm audit --omit=dev` : 0 vulnérabilité à la racine et dans `server/`. `npm audit` complet à la racine : 10 modérées, toutes en outils de dev (`glob`, `minimatch` via `@typescript-eslint`).
- Historique git : aucun `.env` réel ni clé jamais commités (`.env.example` seulement) ; recherche de motifs de clés (Resend `re_…`, AWS, GitHub, clé privée) sur toutes les branches : 0 résultat. `debug.log` contient une ligne d'avertissement Chrome, pas de secret. `.partie-test/` est ignoré et absent de l'historique.
- `server/dist/` est ignoré (`.gitignore:20`) : aucun fichier compilé ni doublon `app.js`/`app.ts` n'est commité. Les `dist/*.js` n'existent qu'en local.
- Aucun accès à la sauvegarde d'un autre compte trouvé : toutes les requêtes filtrent sur `compte_id` pris dans la session. Aucune injection SQL trouvée : les fragments dynamiques viennent de constantes.
- Aucun candidat de gravité 1 en sécurité. Un seul en bugs (B-srv-01).

Légende : gravité 1 critique, 2 notable, 3 mineur ; effort S/M/L.

---

## 1. BUGS (26 candidats)

**B-srv-01 — Historique « de rotation » écrit à chaque envoi mais jamais lisible par aucune route**
- `server/src/sauvegarde.ts:467-475`, `:278-281`, `:324-330`
- Preuve : le PUT copie l'ancienne ligne dans `versions` (origine par défaut `rotation`, schéma `schema.ts:24-31`) et n'en garde que 5 par objet (`purgerVersions`, L22-26). `GET …/versions` ne liste que `origine IN ('divergence','restauration')` et `restaurer` exige `origine <> 'rotation'`. Avec un envoi toutes les ≥ 2 s (`synchro.ts:485`) et 45 s d'intervalle, ces 5 copies couvrent quelques dizaines de secondes de jeu. Les divergences du niveau compte passent par `POST /versions` (`synchro.ts:159`), donc en rotation aussi : jamais restaurables.
- Gravité : 1 (un envoi corrompu ou une régression client écrase la partie sans retour possible par l'API ; chaque envoi coûte en plus une copie jsonb jusqu'à 1 Mo)
- Correctif : soit exposer et restaurer la rotation (instantanés espacés dans le temps : un par heure/jour plutôt que les 5 derniers envois), soit supprimer l'écriture de rotation. Archiver les divergences du compte avec un `lot` restaurable.
- Effort : M

**B-srv-02 — Un PUT dont la réponse est perdue fabrique une fausse divergence et peut faire perdre les dernières secondes**
- `src/ui/synchro.ts:266-283` + `server/src/sauvegarde.ts:445-450`
- Preuve : le client abandonne après 8 s (`AbortSignal.timeout(8000)`) ; si le serveur a déjà validé, `memoire` garde l'ancienne `revisionBase`. Le PUT suivant reçoit 409 (`statut = 'divergence'`, L292). `decider` ne ramène à « charger » que si local et serveur sont identiques (L28-37) ; si le joueur a joué entre-temps, le verdict est `diverge` : l'état local est archivé puis remplacé par la version du serveur. Pas de clé d'idempotence. À confirmer (réseau mobile lent, PUT proche de 1 Mo).
- Gravité : 2
- Correctif : renvoyer au client, sur 409, la révision serveur et l'empreinte du contenu ; si l'empreinte du dernier envoi correspond, rattraper sans divergence. Ou clé d'idempotence par envoi.
- Effort : M

**B-srv-03 — `DELETE /parties/:id` sans `revisionBase` : détruit aussi toutes les versions, donc irréversible**
- `server/src/sauvegarde.ts:165-188` (surtout L178-180)
- Preuve : la route supprime `versions` de la partie puis la partie. Un appareil resté hors ligne avec une liste ancienne peut supprimer une progression plus récente écrite ailleurs, sans conflit ni archive. Le client gère le cas « supprimée ailleurs » (`synchro.ts:288-291`) mais pas l'inverse.
- Gravité : 2
- Correctif : exiger `revisionBase` (409 si périmée) ; conserver un lot de restauration de la partie supprimée pendant N jours (suppression logique).
- Effort : M

**B-srv-04 — Date impossible silencieusement déplacée (`2024-02-31` devient le 2 mars)**
- `server/src/sauvegarde.ts:59-60`, `:474`, `:381`
- Preuve : `Date.parse('2024-02-31T00:00:00Z')` vaut `1709337600000` (vérifié en local) et `new Date(...).toISOString()` donne `2024-03-02T00:00:00.000Z`. `valider` accepte ; la date stockée n'est pas celle envoyée. `Date.parse('2024-13-01T00:00:00Z')` vaut NaN (refusé). Le test censé couvrir ce cas ne vérifie que `< 500` (B-srv-22).
- Gravité : 2 (dates d'écriture faussées, comparaisons `identiques()` du client fausses)
- Correctif : vérifier l'aller-retour (`new Date(s).toISOString()` doit correspondre à `s` normalisé) ou refuser les jours hors mois ; tester le 400.
- Effort : S

**B-srv-05 — `ecrit_le` est choisi par le client : futur lointain accepté, ordre et comparaisons dépendants de l'horloge de l'appareil**
- `server/src/sauvegarde.ts:59`, `:114`, `:474`, `:299`, `:305`
- Preuve : la regex accepte `9999-12-31T23:59:59Z`. Cette valeur trie la liste (`ORDER BY ecrit_le DESC`, L114), alors que `restaurer` écrit `now()` côté serveur (L299). Un téléphone dont l'horloge est en avance passe toujours en tête et peut faire charger la mauvaise « dernière partie » (`lireServeur(null)` prend `parties[0]`, `synchro.ts:115`).
- Gravité : 2
- Correctif : ignorer la date client pour le tri et utiliser `now()` serveur (colonne `ecrit_serveur_le`), ou borner `ecritLe` à `now() + 5 min`.
- Effort : M

**B-srv-06 — Aucun écouteur `error` sur le pool pg ni `unhandledRejection` : une coupure de connexion inactive plante le processus**
- `server/src/index.ts:7`, `:8`, `:10`
- Preuve : un `Pool` émet `error` quand un client inactif perd sa connexion (redémarrage Postgres, bascule Coolify) ; sans écouteur, c'est une exception non interceptée. `await pool.query('select 1')` au démarrage échoue aussi sans nouvelle tentative si la base démarre plus lentement.
- Gravité : 2
- Correctif : `pool.on('error', …)` qui journalise ; `process.on('unhandledRejection')` ; nouvelle tentative au démarrage.
- Effort : S

**B-srv-07 — Pas de délai maximal SQL ni de verrou, et `/health` partage le pool des requêtes métier**
- `server/src/index.ts:7`, `server/src/app.ts:70-73`, `server/src/sauvegarde.ts:418`, `:444`
- Preuve : le pool par défaut a 10 connexions, sans `statement_timeout`, `lock_timeout` ni `idle_in_transaction_session_timeout`. Chaque PUT garde une connexion pendant toute la transaction (`SELECT … FOR UPDATE` en série). Quelques PUT lents ou bloqués sur la même partie épuisent le pool ; `select 1` de `/health` attend alors une connexion, le HEALTHCHECK Docker (`Dockerfile:17`) échoue et l'orchestrateur redémarre le conteneur. À confirmer sous charge.
- Gravité : 2
- Correctif : `statement_timeout`, `lock_timeout` et `idle_in_transaction_session_timeout` via `options` du pool ; `connectionTimeoutMillis` ; pool dédié ou requête avec délai court pour `/health`.
- Effort : S

**B-srv-08 — Le gestionnaire de tâches de fond avale toutes les erreurs : un e-mail de réinitialisation perdu n'est ni tracé ni signalé**
- `server/src/app.ts:36-38`, `:28-29`
- Preuve : `backgroundTasks: { handler: promise => { promise.catch(() => undefined); } }`. L'erreur d'envoi SMTP est journalisée une fois (L28) mais jamais réessayée ; dans tous les autres cas (autre tâche de fond de Better Auth) elle disparaît. L'utilisateur reçoit « Si ce compte existe, un lien… a été envoyé » (L79) même si rien n'est parti.
- Gravité : 2
- Correctif : journaliser dans le gestionnaire (sans PII), file d'attente avec nouvelle tentative, métrique d'échecs d'envoi.
- Effort : M

**B-srv-09 — Le test e2e de nuit est planifié par un fichier qui n'existe que sur `v2`, branche non par défaut**
- `.github/workflows/e2e-nuit.yml:3-6`, branche par défaut locale `refs/remotes/origin/HEAD → origin/main`
- Preuve : GitHub ne déclenche les `schedule` que depuis le fichier de la branche par défaut. `git ls-tree -r origin/main` ne contient aucun `.github`. Le `ref: v2` du checkout (L18) ne change pas cela. À confirmer sur GitHub (l'état local de `origin/main` peut être ancien).
- Gravité : 2 (les e2e « de nuit » ne tournent peut-être jamais)
- Correctif : déclencher par `push` sur `v2` avec filtre de fichiers, ou porter le workflow sur la branche par défaut, ou faire de `v2` la branche par défaut.
- Effort : S

**B-srv-10 — Une divergence de plus de 3 Mo ne peut pas être archivée : le client reste bloqué en « divergence »**
- `server/src/sauvegarde.ts:222-223` (limite 3 Mo) contre `:53` (1 Mo par enveloppe, 20 régions) ; `src/ui/synchro.ts:160-164`
- Preuve : le PUT et l'archive de lot acceptent le même contenu (partie + 20 régions, jusqu'à 21 Mo en théorie) mais le corps d'archive est plafonné à 3 Mo. Si `archives` répond 413, `appliquer` lève « Archivage impossible » et, `bloque` valant `true`, plus rien ne part tant que le jeu n'est pas rechargé. À confirmer : les parties réelles pèsent sans doute bien moins de 3 Mo.
- Gravité : 2
- Correctif : cohérence des plafonds (même limite pour PUT et archives) ou archivage région par région ; sortie du blocage côté client.
- Effort : M

**B-srv-11 — Renommage sans changement de révision : les autres appareils ne le voient que par la liste**
- `server/src/sauvegarde.ts:155-156`, `server/tests/renommer.test.ts:19`, `src/ui/synchro.ts:20-22`, `:335`
- Preuve : `PATCH` met à jour `nom` et `donnees.nom` sans toucher `revision` ni `ecrit_le`. `decider` ne compare que les révisions, donc un second appareil garde l'ancien nom dans sa copie jusqu'à l'ouverture de la liste, qui le réaligne (`synchro.ts:335`). Mitigé par ce rattrapage ; à confirmer côté interface.
- Gravité : 3
- Correctif : incrémenter `revision` au renommage, ou documenter que le nom est une métadonnée hors synchro.
- Effort : S

**B-srv-12 — Le plafond « 200 versions par compte » ne s'applique qu'à `POST /versions`**
- `server/src/sauvegarde.ts:383-384` contre `:467-475`
- Preuve : le PUT n'applique que la règle de 5 par objet ; un compte avec 20 parties × 21 objets peut garder jusqu'à 2 100 lignes de rotation. Le README (L40) annonce 200 au plus. Après un `POST /versions`, la purge globale supprime au contraire des versions d'autres parties.
- Gravité : 3
- Correctif : appliquer un plafond unique et documenté (rotation par objet, plafond global dans une seule fonction).
- Effort : S

**B-srv-13 — Faux positif sur le caractère nul : un texte contenant littéralement `\u0000` est refusé**
- `server/src/sauvegarde.ts:55`
- Preuve : `json.includes('\\u0000')` teste la chaîne sérialisée. Un surnom saisi `\u0000` (6 caractères) devient `\\u0000` dans le JSON, qui contient la sous-chaîne testée : 400 « Sauvegarde invalide ».
- Gravité : 3
- Correctif : parcourir l'objet parsé et chercher `'\u0000'` dans les chaînes (clés comprises).
- Effort : S

**B-srv-14 — Risque d'écrasement sans conflit après suppression puis recréation d'une région (révision 1 réutilisée)**
- `server/src/sauvegarde.ts:303-308`, `:479`
- Preuve : `restaurer` supprime les régions absentes de l'archive ; une région recréée repart à `revision = 1`. Un appareil qui avait mémorisé `serveur: 1` pour l'ancienne région et dont le verrou d'appareil a expiré (120 s) envoie `revisionBase: 1` : égal à la révision de la nouvelle ligne, donc accepté. À confirmer (chemin étroit).
- Gravité : 3
- Correctif : révision issue d'une séquence ou d'un identifiant de génération par ligne (« epoch »).
- Effort : M

**B-srv-15 — `restaurer` prend la main de force sur l'appareil actif sans contrôle**
- `server/src/sauvegarde.ts:289-291`
- Preuve : l'upsert dans `appareil_actif` n'a pas la clause `WHERE` de `/appareil` (L211-212) : la restauration écrase l'appareil actif même s'il bat encore ; l'autre appareil reçoit 409 `ailleurs` à son prochain envoi et perd sa session de jeu en cours. Voulu en partie (l'utilisateur confirme), mais rien n'est exigé côté serveur.
- Gravité : 3
- Correctif : exiger `reprendre: true` explicite ou un 409 `ailleurs` si un autre appareil bat depuis moins de 120 s.
- Effort : S

**B-srv-16 — Une variable d'environnement vide fait planter le démarrage ; plage de `AUTH_RATE_WINDOW` bornée à 65 535**
- `server/src/config.ts:25-29`, `:41-42`
- Preuve : `Number('')` vaut 0, `integer` répond « invalide » pour `AUTH_RATE_MAX=` ou `SMTP_PORT=` (cas fréquent quand Coolify transmet une variable déclarée mais vide). La fenêtre en secondes est limitée à 65 535 (18 h) comme un port.
- Gravité : 3
- Correctif : traiter la chaîne vide comme absente ; bornes distinctes par variable.
- Effort : S

**B-srv-17 — La migration peut masquer son erreur réelle et ne libère pas la connexion**
- `server/src/migrate.ts:17-20`
- Preuve : `finally { await client.query('select pg_advisory_unlock(7241)'); client.release(); }` : si la connexion est coupée pendant la migration, le `unlock` lève à son tour, remplace l'erreur d'origine, et `release()` n'est pas appelé.
- Gravité : 3
- Correctif : `unlock` dans un `try/catch` interne, `release(error)` en cas d'échec.
- Effort : S

**B-srv-18 — Arrêt sans délai maximal ni fermeture des connexions keep-alive**
- `server/src/index.ts:11-13`
- Preuve : `server.close(callback)` n'achève pas tant que des connexions keep-alive restent ouvertes ; l'orchestrateur envoie ensuite SIGKILL au milieu d'une transaction (rollback côté Postgres, mais le client reçoit une erreur réseau). Pas de `closeIdleConnections`/`closeAllConnections`.
- Gravité : 3
- Correctif : `server.closeIdleConnections()`, délai de sécurité, puis `pool.end()`.
- Effort : S

**B-srv-19 — Le débit par compte est en mémoire, par processus, sans `Retry-After`**
- `server/src/sauvegarde.ts:85-96`
- Preuve : le compteur disparaît au redémarrage et n'est pas partagé entre instances ; 60 requêtes par minute et par compte pour synchro (toutes les 45 s + sur changement), battement (60 s) et listes : deux onglets du même compte approchent le plafond. La réponse 429 ne donne aucune indication d'attente. À confirmer en usage réel.
- Gravité : 3
- Correctif : stockage partagé (table ou Redis) ; en-tête `Retry-After` ; compter par appareil.
- Effort : M

**B-srv-20 — Envoi à la fermeture ignoré au-delà de 60 Ko**
- `src/ui/synchro.ts:269`
- Preuve : `keepalive: true` seulement si le corps fait au plus 60 000 octets (limite navigateur ≈ 64 Ko). Une région volumineuse part en `fetch` normal, souvent annulé à la fermeture de l'onglet : les dernières secondes de jeu ne sont pas envoyées.
- Gravité : 3
- Correctif : envoyer seulement les différences, ou compresser avant d'envoyer.
- Effort : M

**B-srv-21 — Tout 4xx (hors 408/429) bloque la synchro jusqu'au rechargement du jeu**
- `src/ui/synchro.ts:300`
- Preuve : un 401 (session expirée pendant la partie) ou 413 passe `statut = 'refuse'; bloque = true`. Le hook de session (`session-compte.ts:46`) traite le 401 séparément, mais la synchro ne repart que par `ouvrir()`. À confirmer dans l'interface.
- Gravité : 3
- Correctif : repasser en `hors-ligne` pour 401, redémarrer la synchro à la reconnexion.
- Effort : S

**B-srv-22 — Test « date impossible » qui ne vérifie pas ce qu'il annonce**
- `server/tests/sauvegarde.test.ts:466-472`
- Preuve : titre « refuse en 400 ce que Postgres refuserait (…, date impossible), jamais 500 » ; l'assertion est `expect(jour.status).toBeLessThan(500)`, satisfaite par un 200 (c'est le cas : voir B-srv-04).
- Gravité : 3
- Correctif : attendre 400 et corriger `valider`.
- Effort : S

**B-srv-23 — Test 4 annonce « sans divulgation de compte » alors que l'inscription la divulgue**
- `server/tests/auth.test.ts:37-45`
- Preuve : seul le cas de connexion est comparé ; l'inscription d'un doublon vérifie seulement `ok === false` et le code `USER_ALREADY_EXISTS` reste dans le corps (`app.ts:79-83`).
- Gravité : 3
- Correctif : comparer aussi statut et corps pour l'inscription (voir S-srv-03).
- Effort : S

**B-srv-24 — Téléchargement de sprites sans délai ni limite de taille**
- `scripts/lib/telechargement.mjs:43-45`, `scripts/telecharger-sprites.mjs:32`
- Preuve : `fetch(url)` sans `AbortSignal.timeout` ; `arrayBuffer()` sans plafond ; téléchargement séquentiel de plus de 300 fichiers. Une réponse qui ne se termine pas bloque le script indéfiniment ; un fichier énorme est lu en mémoire avant le contrôle des dimensions.
- Gravité : 3
- Correctif : délai par requête, taille maximale (en-tête `content-length` puis lecture bornée).
- Effort : S

**B-srv-25 — `generer-pokemon` masque la cause des échecs réseau**
- `scripts/generer-pokemon.mjs:34-36`
- Preuve : `catch {}` jette l'erreur (HTTP 429, timeout, JSON invalide) et ne rapporte que « après 3 essais » ; pause fixe de 250 ms sans attente croissante.
- Gravité : 3
- Correctif : conserver la dernière erreur dans le message ; attente exponentielle ; respecter `Retry-After`.
- Effort : S

**B-srv-26 — Le HEALTHCHECK attend 15 s alors que la migration tourne avant le serveur**
- `server/Dockerfile:17-18`
- Preuve : `CMD ["sh","-c","node dist/migrate.js && exec node dist/index.js"]` : pendant la migration (première installation des tables Better Auth, ou migration lourde plus tard) le serveur n'écoute pas ; `--start-period=15s` peut être dépassé. À confirmer sur une grosse base.
- Gravité : 3
- Correctif : `--start-period` plus large ou étape de migration séparée du démarrage.
- Effort : S

---

## 2. SÉCURITÉ (29 candidats)

**S-srv-01 — Inscription ouverte, sans vérification d'e-mail, avec un stockage par compte quasi illimité**
- `server/src/app.ts:40`, `:45-48` ; `server/src/sauvegarde.ts:16-17`, `:53`, `:383`
- Preuve : `requireEmailVerification: false` ; limite d'inscription 5 par minute et par IP. Un compte peut stocker 20 parties × (1 + 20 régions) × 1 Mo, soit 420 Mo, plus jusqu'à 5 copies de rotation par objet : environ 2,5 Go par compte. Rien ne plafonne le total ni le nombre de comptes (une centaine d'IP suffisent à remplir un disque de 250 Go en quelques heures).
- Gravité : 2
- Correctif : plafond d'octets par compte (somme des `pg_column_size`), vérification d'e-mail avant la première écriture, quota global et alerte disque.
- Effort : M

**S-srv-02 — `PUT /api/sauvegarde` : nombre de régions non borné avant la boucle SQL (amplification)**
- `server/src/sauvegarde.ts:439-449` contre `:457` et `:231`
- Preuve : l'enveloppe de région minimale pèse environ 170 octets ; un corps de 3 Mo en contient une quinzaine de milliers. La boucle exécute un `SELECT … FOR UPDATE` par entrée avant que le plafond de 20 régions ne soit contrôlé (L457). Une seule requête monopolise une connexion et le verrou de la partie ; 60 requêtes par minute sont permises. La route `archives` borne tôt (L231), pas le PUT.
- Gravité : 2
- Correctif : `regions.length > MAX_REGIONS` dans `valider`, avant toute requête SQL.
- Effort : S

**S-srv-03 — Énumération de comptes à l'inscription**
- `server/src/app.ts:76-83` ; `src/ui/compte/api-compte.ts:5`
- Preuve : la réécriture remplace `message` mais conserve `code`. Un doublon répond 422 avec `USER_ALREADY_EXISTS`, un compte neuf 200 : n'importe qui teste si une adresse a un compte. Le client affiche « Ce compte existe déjà. Connecte-toi. ». La réinitialisation et la connexion sont, elles, uniformes.
- Gravité : 2
- Correctif : répondre pareil dans les deux cas (réponse neutre + e-mail « compte existant » / « bienvenue »), ou assumer le choix et supprimer le commentaire de test.
- Effort : M

**S-srv-04 — `TRUSTED_PROXIES` vide en production n'est ni refusé ni signalé**
- `server/src/config.ts:40` ; `README.md:28`, `:48`
- Preuve : sans valeur, Better Auth lit `X-Forwarded-For` tel quel (valeur de gauche forgeable, donc limite contournable avec un en-tête aléatoire, une ligne de `rateLimit` créée par valeur) ou, si aucune adresse n'est reconnue, utilise un compteur partagé par route : 5 connexions par minute pour tous les joueurs. Le README demande de le « vérifier avant ouverture publique » mais le code ne l'exige pas.
- Gravité : 2
- Correctif : exiger `TRUSTED_PROXIES` en production (ou un drapeau explicite `TRUSTED_PROXIES=none`) ; journaliser un avertissement au démarrage.
- Effort : S

**S-srv-05 — Pas de limite par adresse e-mail pour la réinitialisation : bombardement d'un tiers et épuisement du quota SMTP**
- `server/src/app.ts:45-48`
- Preuve : seule règle : 5 par fenêtre et par IP pour `/request-password-reset`. Un attaquant avec plusieurs IP peut envoyer des centaines de courriels à une même adresse (aucune vérification que l'appelant possède l'adresse) et consommer le quota d'envoi du fournisseur (Resend) : les vraies réinitialisations échouent alors.
- Gravité : 2
- Correctif : limite par destinataire (par exemple 3 par heure) en plus de la limite par IP ; ne rien envoyer si un lien valide existe déjà.
- Effort : M

**S-srv-06 — Jeton de session en `localStorage`, sans CSP versionnée**
- `src/ui/compte/session-compte.ts:12` ; `index.html` ; `vite.config.ts`
- Preuve : le jeton Bearer est lisible par tout script de la page ; aucun en-tête CSP n'existe dans le dépôt (ni meta, ni `_headers`, ni configuration serveur). Durée de session : défaut Better Auth, 7 jours glissants (à confirmer dans la version installée). Un XSS (même via une dépendance) vole la session pour une semaine.
- Gravité : 2
- Correctif : CSP stricte côté hébergeur du front ; cookie `HttpOnly; Secure; SameSite=Lax` (le front `pokiclicker.fr` et l'API `api.pokiclicker.fr` sont du même site), jeton en mémoire.
- Effort : M

**S-srv-07 — Aucune route de suppression ni d'export de compte (droit à l'effacement)**
- `server/src/app.ts:39-48` (pas de `user.deleteUser`) ; liste des routes `server/src/sauvegarde.ts`
- Preuve : e-mail et parties sont stockés ; ni l'utilisateur ni le serveur n'ont de route pour effacer le compte (les `ON DELETE CASCADE` de `schema.ts` existent mais rien ne les déclenche). À confirmer côté produit : le jeu s'adresse à des amis, mais les comptes sont publics sur `pokiclicker.fr`.
- Gravité : 2
- Correctif : activer `deleteUser` avec confirmation par mot de passe ; route d'export JSON.
- Effort : M

**S-srv-08 — `bearer()` sans `requireSignature`**
- `server/src/app.ts:44`
- Preuve : dans Better Auth 1.7.16, `requireSignature` vaut faux par défaut (`plugins/bearer/index.mjs:36`) : un jeton brut (valeur de la table `session`) est accepté sans connaître le secret. Une fuite de la base (copie de sauvegarde, accès SQL) donne alors des sessions utilisables.
- Gravité : 3
- Correctif : `bearer({ requireSignature: true })` ; le client envoie déjà le jeton signé reçu dans `set-auth-token` (à confirmer par un test).
- Effort : S

**S-srv-09 — Surface `/api/auth/*` non réduite**
- `server/src/app.ts:74`, `README.md:24`
- Preuve : le serveur transmet tout à Better Auth (`update-user`, `change-email`, `change-password`, `list-sessions`, `revoke-session`, etc.) alors que le jeu n'utilise que six routes. Chaque route inutile est une surface de plus, sans la limite de débit spécifique (seules trois routes ont une règle).
- Gravité : 3
- Correctif : liste blanche des six routes utilisées (404 pour le reste) ou désactivation par options.
- Effort : S

**S-srv-10 — Pas de révocation des autres sessions au changement de mot de passe, session de 7 jours**
- `server/src/app.ts:39-43`
- Preuve : `revokeSessionsOnPasswordReset: true` ne couvre que la réinitialisation par lien. `change-password` (exposé, voir S-srv-09) ne révoque les autres sessions que si le client le demande. Aucune interface ne liste les appareils connectés. À confirmer dans le code client.
- Gravité : 3
- Correctif : option serveur forçant la révocation ; liste « mes appareils » + révocation.
- Effort : M

**S-srv-11 — Déconnexion : le jeton reste valide côté serveur si l'appel réseau échoue**
- `src/ui/compte/session-compte.ts:77-83`
- Preuve : `memoriser(null)` efface le jeton local avant `deconnecter(ancien)`, dont l'échec est ignoré (`catch {}`) sans nouvelle tentative : sur réseau coupé, la session volée ou prêtée reste valide jusqu'à son expiration.
- Gravité : 3
- Correctif : file d'attente de révocation (jeton à révoquer rejouée au retour du réseau).
- Effort : S

**S-srv-12 — SMTP en clair accepté en production ; STARTTLS non exigé**
- `server/src/config.ts:30` ; `server/src/app.ts:15-17`
- Preuve : `SMTP_URL` accepte `smtp:` (sans TLS) en production ; pour `SMTP_HOST`, seul le port 465 active `secure`, le port 587 négocie STARTTLS opportuniste (pas de `requireTLS`) : un attaquant réseau peut forcer le texte clair et lire le lien de réinitialisation et les identifiants.
- Gravité : 3
- Correctif : refuser `smtp:` en production, `requireTLS: true`, `tls.rejectUnauthorized` par défaut.
- Effort : S

**S-srv-13 — Secrets factices acceptés en production**
- `server/.env.example:4`, `server/docker-compose.yml:22`, `server/src/config.ts:8-9`
- Preuve : les deux valeurs d'exemple (valeurs masquées ici) dépassent 32 caractères ; `readConfig` n'impose que la longueur. Un copier-coller de `.env.example` en production donne un secret public : toutes les sessions Better Auth deviennent forgeables.
- Gravité : 3
- Correctif : refuser en production les valeurs de la liste connue et celles qui contiennent « factice »/« exemple » ; imposer 43 caractères base64 aléatoires.
- Effort : S

**S-srv-14 — `.env.example` fixe `NODE_ENV=development`**
- `server/.env.example:1` ; `server/src/config.ts:5-7` ; `server/src/app.ts:21`, `:55`
- Preuve : copié en production sans correction, le mode développement désactive HSTS, journalise le lien de réinitialisation (avec jeton) en console et dispense du SMTP.
- Gravité : 3
- Correctif : retirer `NODE_ENV` de l'exemple (le Dockerfile le fixe déjà à `production`), échouer si `development` avec une base distante.
- Effort : S

**S-srv-15 — Pas de contrôle d'origine ni de type de contenu sur `/api/sauvegarde` alors que le cookie de session est accepté**
- `server/src/sauvegarde.ts:87`, `server/src/app.ts:59-61`
- Preuve : `getSession({ headers })` lit aussi le cookie de session Better Auth ; `c.req.json()` ignore `Content-Type`. Le client n'utilise que Bearer et `credentials: 'omit'`, mais un navigateur qui possède aussi le cookie (inscription directe sur l'API) l'enverrait sur une requête same-site. Le risque dépend de l'attribut SameSite du cookie (défaut Lax, à confirmer).
- Gravité : 3
- Correctif : n'accepter que `Authorization: Bearer` sur `/api/sauvegarde` et exiger `application/json`.
- Effort : S

**S-srv-16 — Création de partie : l'identifiant d'un autre compte renvoie 404, un identifiant libre 200**
- `server/src/sauvegarde.ts:418-423`
- Preuve : `SELECT * FROM parties WHERE id = $1 FOR UPDATE` sans filtre de compte : l'existence d'un UUID chez un autre compte est visible (404 « Partie introuvable » contre création) et la ligne étrangère est verrouillée. UUID aléatoire, donc non exploitable en pratique sans fuite de l'identifiant.
- Gravité : 3
- Correctif : filtrer par `compte_id` dans le verrou et gérer le conflit d'insertion par un 409 neutre.
- Effort : S

**S-srv-17 — Images non épinglées et installation avec scripts dans l'étape de build**
- `server/Dockerfile:1`, `:4`, `:9` ; `server/docker-compose.yml:3`
- Preuve : `node:22-slim` et `postgres:18` sans digest ; `RUN npm ci` de l'étape de build exécute les scripts d'installation de toutes les dépendances de dev (le runtime utilise bien `--ignore-scripts`, L13).
- Gravité : 3
- Correctif : digest SHA256 des images, `npm ci --ignore-scripts` aussi au build, scan d'image (Trivy) en CI.
- Effort : S

**S-srv-18 — Conteneur non durci**
- `server/docker-compose.yml:17-26`, `server/Dockerfile:15-16`
- Preuve : pas de `read_only`, `cap_drop: [ALL]`, `security_opt: no-new-privileges`, limites mémoire/CPU ni `restart` dans le compose ; Postgres publie 5432 sur 127.0.0.1 avec un mot de passe constant (L7-9, local uniquement). L'utilisateur `node` est bien utilisé en production.
- Gravité : 3
- Correctif : durcissement du compose et des paramètres Coolify.
- Effort : S

**S-srv-19 — Pas de TLS configuré vers Postgres**
- `server/src/index.ts:7`, `server/src/migrate.ts:8`, `README.md:45`
- Preuve : `new Pool({ connectionString })` sans option `ssl` ; rien dans la validation de `DATABASE_URL` n'exige `sslmode=require`. Acceptable si la base est sur le réseau privé de Coolify, comme l'indique le README ; à confirmer.
- Gravité : 3
- Correctif : exiger `sslmode` en production quand l'hôte n'est pas un nom interne.
- Effort : S

**S-srv-20 — Un seul rôle SQL pour migrer et servir**
- `server/Dockerfile:18`, `server/src/migrate.ts`
- Preuve : le même `DATABASE_URL` sert aux migrations (DDL) et à l'API : une injection ou une faille d'exécution a les droits `CREATE/DROP`. Les requêtes actuelles sont paramétrées ; c'est de la défense en profondeur.
- Gravité : 3
- Correctif : deux rôles (propriétaire des tables, rôle applicatif DML seul).
- Effort : M

**S-srv-21 — Pas de Dependabot, d'audit npm en CI, ni de `permissions:` dans les workflows ; actions épinglées par étiquette**
- `.github/workflows/ci.yml`, `.github/workflows/e2e-nuit.yml`
- Preuve : aucun `dependabot.yml`, aucun `npm audit`, actions en `@v4` (étiquette modifiable), pas de bloc `permissions:` (le jeton reçoit les droits par défaut du dépôt). Audit local du 19/11 : 0 vulnérabilité en production.
- Gravité : 3
- Correctif : `dependabot.yml` (npm + actions), `permissions: contents: read`, SHA complets des actions, `npm audit --omit=dev --audit-level=high` en CI.
- Effort : S

**S-srv-22 — Journalisation insuffisante pour détecter une attaque, et PII possible dans les messages d'erreur SMTP**
- `server/src/app.ts:28`, `:34`, `:67`
- Preuve : le niveau Better Auth est `warn` ; aucun événement d'authentification (échec de connexion, réinitialisation demandée/consommée, 429) n'est journalisé de façon structurée. `onError` n'écrit que le message, sans identifiant de requête ni route. Le message d'erreur nodemailer peut contenir l'adresse du destinataire (L28). Le README (L26) annonce « journaux Better Auth désactivés » : écart avec le code.
- Gravité : 3
- Correctif : journal JSON avec identifiant de requête, événements d'auth (sans e-mail en clair : empreinte), alerte sur pics de 401/429.
- Effort : M

**S-srv-23 — Champs `name`/`image` d'inscription non bornés (jusqu'à 100 Ko)**
- `server/src/app.ts:62`, `:50` (corps limité à 100 Ko ; Better Auth ne limite pas `name`)
- Preuve : un compte peut stocker 100 Ko de texte dans `user.name`. À confirmer dans la version installée.
- Gravité : 3
- Correctif : valider `name` (≤ 50 caractères) et `image` côté serveur (hook `before`).
- Effort : S

**S-srv-24 — Racine : `.env` non ignoré par git**
- `.gitignore` (aucune ligne `.env*` pour la racine ; seul `server/.env*` est ignoré, L21-22)
- Preuve : `.env.example` racine (`VITE_API_URL`) existe ; un `.env` ou `.env.local` créé à la racine serait proposé au commit.
- Gravité : 3
- Correctif : `.env`, `.env.*`, `!.env.example` et `*.log` dans `.gitignore`.
- Effort : S

**S-srv-25 — `debug.log` versionné**
- `debug.log:1` (trois commits l'ont touché : `25892cb`, `147ba2e`, `dd512b4`)
- Preuve : journal Chrome local (message audio), sans secret. Signale surtout l'absence de règle d'ignorance (S-srv-24).
- Gravité : 3
- Correctif : `git rm --cached debug.log`, règle `*.log`.
- Effort : S

**S-srv-26 — En-têtes de sécurité du front non vérifiables, absents du dépôt**
- dépôt entier (aucun `_headers`, `nginx.conf`, `Caddyfile`), `index.html`
- Preuve : le front `pokiclicker.fr` est servi par une configuration qui n'est pas dans le dépôt ; CSP, HSTS, `X-Content-Type-Options`, `Permissions-Policy` ne peuvent pas être revus. À confirmer sur l'hébergeur.
- Gravité : 3
- Correctif : versionner la configuration d'hébergement (ou un fichier `_headers`) avec CSP stricte.
- Effort : S

**S-srv-27 — API : CSP et en-têtes d'isolement absents ; HSTS sans `includeSubDomains`**
- `server/src/app.ts:51-58`
- Preuve : seuls `nosniff`, `no-referrer`, `DENY` et HSTS (production) sont posés. Les réponses sont du JSON, donc l'impact est faible ; mais `/api/auth/error` et les redirections peuvent rendre du HTML.
- Gravité : 3
- Correctif : `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'`, `Cross-Origin-Resource-Policy: same-site`, `Permissions-Policy`, `includeSubDomains`.
- Effort : S

**S-srv-28 — Le serveur ne valide pas le contenu de jeu : toute progression est forgeable**
- `server/src/sauvegarde.ts:36-67`
- Preuve : `donnees` est un objet quelconque de ≤ 1 Mo ; un client modifié écrit n'importe quels diamants, succès ou argent. Sans importance tant qu'aucun classement ni boutique réelle n'existe, mais une future fonction partagée (classement, échange) hériterait du problème.
- Gravité : 3
- Correctif : schéma de validation (bornes plausibles) pour les champs lus par le serveur ; à documenter dans les risques.
- Effort : L

**S-srv-29 — `TRUSTED_PROXIES` d'exemple : tout le réseau privé est de confiance**
- `server/.env.example:19`
- Preuve : `10.0.0.0/8,172.16.0.0/12,192.168.0.0/16` : un conteneur compromis sur le même réseau Docker peut forger l'adresse cliente et contourner la limite de débit. Plus étroit à fixer sur le réseau réel de Traefik.
- Gravité : 3
- Correctif : restreindre au sous-réseau de Traefik/Coolify.
- Effort : S

---

## 3. QUALITÉ (31 candidats)

**Q-srv-01 — Le serveur n'est pas dans la CI : ni typecheck, ni tests, ni build**
- `.github/workflows/ci.yml` ; `package.json:14`, `:16`, `:24` ; `vite.config.ts:63` ; `server/README.md:71-73`
- Preuve : le job racine lance `typecheck` (tsconfig app/node/e2e), `lint`, `test` (include `src/**`, `tests/**`) et `build` (front). `server/tests/**` n'est jamais exécuté, ni le typecheck, ni le build, ni le Dockerfile. Le README dit « CI à ajouter ». Toute l'authentification et la synchronisation (≈ 2 000 lignes dont 4 000 de tests) ne sont protégées que par l'exécution locale.
- Gravité : 1
- Correctif : job `server` (Node 22, service Postgres 18, `npm ci`, typecheck, tests, build, build Docker) ; `npm audit`.
- Effort : M

**Q-srv-02 — 16 scripts `extraire-*-v1` recopient le même chargeur `vm`, sans module partagé**
- `scripts/extraire-*.mjs` (98 occurrences de `createContext`/`runInContext`), `scripts/lib/` (3 fichiers seulement)
- Preuve : chaque script redéfinit `executer`, `exiger`, `copier`, lecture de `legacy/js/...` (par exemple `extraire-casino-v1.mjs:45,71`, `extraire-pension-v1.mjs:58`, `extraire-centre-v1.mjs:48`, `extraire-boss-v1.mjs:31-32`). `package.json` n'expose que 5 des 16 (`extraire:*`).
- Gravité : 2
- Correctif : `scripts/lib/legacy.mjs` (chargement de contexte, utilitaires) ; décider quels scripts restent utiles : `CLAUDE.md:7` dit que la V1 n'est plus une référence.
- Effort : M

**Q-srv-03 — `sauvegarde.ts` : 500 lignes mélangeant validation, routes et SQL ; sept copies du motif connect/BEGIN/COMMIT/ROLLBACK/release**
- `server/src/sauvegarde.ts:135-164`, `:165-188`, `:189-221`, `:222-259`, `:260-317`, `:346-392`, `:393-498`
- Preuve : chaque transaction répète `pool.connect()`, `let echec`, `try/catch/finally` identiques (≈ 15 lignes) ; le PUT fait 105 lignes. Les oublis de `ROLLBACK`/`release(echec)` sont à un copier-coller de distance.
- Gravité : 2
- Correctif : helper `transaction(pool, async db => …)` ; fichiers `validation.ts`, `parties.ts`, `versions.ts`, `appareil.ts`.
- Effort : M

**Q-srv-04 — Plafonds et durées codés en dur, dispersés dans trois fichiers et quatre requêtes SQL**
- `server/src/sauvegarde.ts:16-19` (20, 20, 60, 200), `:53` (1 Mo), `:222`, `:346`, `:393` (3 Mo), `:111`, `:212`, `:412`, `:426` (120 s), `:24`, `:30` (5 versions), `server/src/app.ts:62` (100 Ko)
- Preuve : la fenêtre de 120 s existe dans quatre requêtes ; le battement client vaut 60 s (`appareil.ts:62`) ; le README cite les valeurs en cinq endroits.
- Gravité : 2
- Correctif : un objet `LIMITES` exporté et injecté dans les requêtes (paramètre SQL), lu par `config.ts`.
- Effort : S

**Q-srv-05 — Tests absents pour `index.ts`, `migrate.ts`, arrêt, transport SMTP et en-têtes de production ; aucune mesure de couverture**
- `server/tests/*.ts`, `server/vitest.config.ts`
- Preuve : aucun test n'importe `index.ts` ni `migrate.ts` ; HSTS n'est jamais vérifié (`NODE_ENV: 'test'` dans `support.ts:58`) ; le chemin `transport.sendMail` n'est pas couvert (mailer injecté) ; pas de bloc `coverage` dans `vitest.config.ts`.
- Gravité : 2
- Correctif : tests de démarrage/migration (base vide, base N-1), de l'en-tête HSTS en production, du transport SMTP avec un faux serveur ; activer la couverture.
- Effort : M

**Q-srv-06 — Dette d'évolutivité : un seul processus supposé (plusieurs serveurs, plusieurs régions)**
- `server/src/sauvegarde.ts:85` (débit en mémoire), `server/src/app.ts` (aucun cache partagé), `server/src/index.ts`
- Preuve : le compteur de débit est local au processus ; `appareil_actif` et la limite d'authentification sont en base, donc corrects en multi-instances. Avec plusieurs instances derrière Traefik, la limite de 60/min devient 60 × N. Aucune notion de réplique de lecture, de région d'hébergement ni de latence (tous les envois vont à une base unique).
- Gravité : 2
- Correctif : stockage partagé pour le débit ; documenter la topologie cible ; séparer lecture/écriture si la base est répliquée.
- Effort : M

**Q-srv-07 — Stockage : tout en `jsonb` dans Postgres, copies complètes à chaque envoi, aucune stratégie S3 ni compression**
- `server/src/schema.ts:3-26`, `server/src/sauvegarde.ts:467-468`
- Preuve : chaque PUT copie la ligne précédente en entier dans `versions` (jusqu'à 1 Mo par objet, 5 copies) ; pas de compression applicative, de delta, de rétention par date, ni d'export vers un stockage d'objets. La croissance suit les joueurs × la fréquence d'envoi (toutes les ≥ 2 s en cas de jeu actif).
- Gravité : 2
- Correctif : instantanés espacés (voir B-srv-01), compression, delta, copie des archives vers S3 avec rétention.
- Effort : L

**Q-srv-08 — Aucune purge des tables Better Auth (`session`, `verification`, `rateLimit`)**
- `server/src/migrate.ts`, `server/src/app.ts:45`
- Preuve : aucune tâche de nettoyage dans le dépôt ; `rateLimit` en base crée une ligne par IP et route, les liens de réinitialisation expirés restent. À confirmer : Better Auth supprime les sessions expirées à l'accès, pas en masse.
- Gravité : 3
- Correctif : tâche planifiée (`DELETE … WHERE expiresAt < now() - interval '7 days'`).
- Effort : S

**Q-srv-09 — Validation écrite à la main (≈ 30 lignes de conditions), types contournés par des conversions**
- `server/src/sauvegarde.ts:36-67`, `:6`, `:132`, `:400`, `:354`, `:366`
- Preuve : `valider` renvoie une erreur ou `undefined` sans garde de type ; ensuite `brut as Corps`, `brut.enveloppe as Enveloppe`, `rows[0]` non typé, `Auth` réduit à un type ad hoc (L6) plutôt que `typeof auth`. Les messages d'erreur sont tous « Sauvegarde invalide. » : on ne sait pas quel champ échoue.
- Gravité : 3
- Correctif : bibliothèque de schéma (Valibot/Zod) qui produit le type et le chemin de l'erreur ; type d'`auth` réel.
- Effort : M

**Q-srv-10 — SQL dynamique par fragments (`${o.table}`, `${o.cle}`, `$${n + 1}`) difficile à relire**
- `server/src/sauvegarde.ts:444`, `:470-473`, `:477-481`
- Preuve : sûr aujourd'hui (constantes du fichier, valeurs paramétrées) mais l'arithmétique d'index de paramètres (`$${n + 4}`) et le mélange de trois tables dans une boucle cachent la logique ; une modification future risque l'injection ou une requête décalée.
- Gravité : 3
- Correctif : trois fonctions explicites (`ecrireCompte`, `ecrirePartie`, `ecrireRegion`).
- Effort : M

**Q-srv-11 — Messages d'erreur uniformes, sans code machine ni identifiant de requête**
- `server/src/sauvegarde.ts` (`'Sauvegarde invalide.'` : 25 occurrences) ; `server/src/app.ts:66-69`
- Preuve : un 400 ne dit pas le champ fautif ; les codes (`appareil-requis`, `ailleurs`) sont rares ; aucun `x-request-id` pour relier un incident joueur à un journal.
- Gravité : 3
- Correctif : `{ code, champ }` systématique ; identifiant de requête renvoyé et journalisé.
- Effort : S

**Q-srv-12 — Migrations en tableau de chaînes, sans somme de contrôle ni test depuis un état réel N-1 ; SQL documenté en double**
- `server/src/schema.ts:3-34`, `docs/migrations/0003-versions-origine.sql`, `server/tests/archives.test.ts:26`
- Preuve : une migration déjà appliquée peut être modifiée dans le code sans alerte (la table ne stocke que le numéro). Seule la 3ᵉ a son fichier SQL séparé, qui duplique `schema.ts:29-33`. Le test vérifie l'idempotence, pas le passage d'une base à l'état 2 vers 3 avec des données.
- Gravité : 3
- Correctif : fichiers `server/migrations/000N-*.sql` lus par `migrate.ts`, colonne `checksum`, test depuis un instantané.
- Effort : M

**Q-srv-13 — Migration lancée à chaque démarrage de conteneur, sans étape distincte ni retour arrière**
- `server/Dockerfile:18`, `server/README.md:47`, `:86`
- Preuve : `migrate.js && index.js` couple déploiement et schéma ; en cas d'échec, boucle de redémarrage ; le retour arrière est « redéployer l'ancien serveur » (README:86), qui peut effacer des lots archivés. Aucun test automatique de compatibilité N/N-1 malgré l'ordre de déploiement imposé (README:65-88).
- Gravité : 3
- Correctif : tâche de migration séparée (pré-déploiement), migrations rétro-compatibles testées.
- Effort : M

**Q-srv-14 — Tests serveur couplés au code client**
- `server/tests/deux-appareils.test.ts:4-8`, `:195`, `server/tsconfig.json` (`rootDir: ".."`)
- Preuve : le test importe `../../src/core/*` et `../../src/ui/*` ; son cas « migre côté client une partie et une région au format v1 » teste le client. Le typecheck serveur dépend donc des chemins du front.
- Gravité : 3
- Correctif : déplacer ces tests d'intégration côté racine (`tests/`) ; garder le serveur autonome.
- Effort : S

**Q-srv-15 — Utilitaires de test dupliqués entre fichiers**
- `server/tests/sauvegarde.test.ts:10`, `:13`, `:18`, `archives.test.ts:9`, `:11`, `restaurer.test.ts:7`
- Preuve : `objet`, `corps`, `put` redéfinis (avec des signatures différentes) dans trois fichiers ; `support.ts` ne les fournit pas.
- Gravité : 3
- Correctif : les déplacer dans `support.ts`.
- Effort : S

**Q-srv-16 — Deux versions de TypeScript et de `@types/node`, plages `^` côté serveur, préversion en devDependency**
- `server/package.json` (`typescript ^7.0.2`, `@types/node ^26.6.6`, `embedded-postgres ^18.6.0-beta.19`) contre `package.json` racine (`typescript 5.9.3`, `@types/node 22.20.5`, versions exactes)
- Preuve : `engines.node >= 22` et image `node:22-slim`, mais les types Node 26 laissent passer des API absentes de Node 22 ; le serveur utilise `^` alors que la racine épingle ; `embedded-postgres` est en bêta.
- Gravité : 3
- Correctif : aligner `@types/node` sur 22, épingler les versions, remonter TypeScript au même rythme.
- Effort : S

**Q-srv-17 — Deux dépôts npm séparés, sans espace de travail ; le serveur est invisible depuis la racine**
- `package.json` racine, `server/package.json`, deux `package-lock.json`
- Preuve : `npm run ci` ne couvre pas le serveur ; le README racine (529 octets) ne mentionne ni `server/` ni les 39 scripts ; « `npm run dev` lance le serveur local » désigne Vite, ambigu avec l'API.
- Gravité : 3
- Correctif : espaces de travail npm ou script racine `ci:serveur` ; README racine avec la carte du dépôt.
- Effort : S

**Q-srv-18 — Configuration éparpillée entre `config.ts`, README, `.env.example`, compose et Dockerfile**
- `server/src/config.ts`, `server/.env.example`, `server/docker-compose.yml:19-24`, `server/README.md:18`, `:48`
- Preuve : les variables sont décrites quatre fois, avec des écarts (le compose fixe `NODE_ENV: development`, le Dockerfile `production`) ; l'objet `config` plat transporte les secrets (SMTP, secret d'auth) jusque dans `createApp`.
- Gravité : 3
- Correctif : source unique (schéma de configuration documenté et généré), objet `config` séparant secrets et réglages.
- Effort : S

**Q-srv-19 — `app.ts` mélange assemblage, transport SMTP, en-têtes, CORS et réécriture des réponses d'authentification**
- `server/src/app.ts:14-89`
- Preuve : `createApp` construit le transport e-mail, l'instance Better Auth, quatre middlewares et la réécriture de réponse dans une seule fonction de 75 lignes ; le mailer ne peut pas être testé sans reconstruire tout l'app.
- Gravité : 3
- Correctif : `mail.ts`, `auth.ts`, `securite.ts` (middlewares).
- Effort : S

**Q-srv-20 — La réécriture des réponses d'auth reconstruit un `Response` en réutilisant les en-têtes d'origine**
- `server/src/app.ts:76-83`
- Preuve : `new Response(JSON.stringify(body), { status, headers: response.headers })` reprend tous les en-têtes, dont éventuellement `content-length` et `content-encoding` du corps d'origine. Pas de test qui passe par le serveur HTTP réel (les tests appellent `app.request`). À confirmer : si Better Auth pose `content-length`, le corps réécrit (de longueur différente) serait tronqué.
- Gravité : 3
- Correctif : copier les en-têtes sans `content-length`/`content-encoding`; ajouter un test via `serve`.
- Effort : S

**Q-srv-21 — Aucun test d'intégration sur un vrai serveur HTTP**
- `server/tests/support.ts:81`
- Preuve : tous les tests utilisent `runtime.app.request(...)` (appel direct à Hono) ; l'adaptateur `@hono/node-server`, le comportement des en-têtes réels (IP via socket, `Content-Length`, keep-alive, arrêt) n'est jamais exercé.
- Gravité : 3
- Correctif : un test de fumée qui démarre `serve` sur un port libre.
- Effort : S

**Q-srv-22 — `vite.config.ts` lit et hache 22,7 Mo d'images à chaque chargement de la configuration**
- `vite.config.ts:17-24`
- Preuve : `readFileSync` de tous les fichiers des dossiers lourds, au chargement de la configuration, donc aussi pour `vitest`, le dev server et chaque `playwright` : lenteur et mémoire inutiles (22,7 Mo mesurés dans `public/img`).
- Gravité : 3
- Correctif : calculer l'empreinte au build seulement, ou à partir des tailles/dates des fichiers.
- Effort : S

**Q-srv-23 — ESLint ne connaît pas `server/`**
- `eslint.config.js:5-24`
- Preuve : aucun bloc `files: ['server/**']` (globals Node, règles propres) ; `server/dist/**` n'est pas dans `ignores` : après un build local, `eslint .` analyse le JavaScript compilé. À confirmer en lançant le lint après un build.
- Gravité : 3
- Correctif : ajouter `server/dist/**` à `ignores` et un bloc serveur.
- Effort : S

**Q-srv-24 — `tsconfig` serveur ajoute `DOM` aux bibliothèques**
- `server/tsconfig.json` (`lib: ["ES2022","DOM"]`)
- Preuve : `window`, `document`, `localStorage` compilent dans le code serveur sans erreur ; nécessaire aux tests qui importent `src/ui` (Q-srv-14), nuisible au code de production.
- Gravité : 3
- Correctif : retirer DOM de `src` (config de build NodeNext l'ignore déjà, mais pas le typecheck).
- Effort : S

**Q-srv-25 — Ports et origines de développement répétés en dur dans les scripts**
- `scripts/audit-captures.mjs:18`, `:104` ; `scripts/audit/ecrans.mjs:141`, `:110` ; `scripts/partie-test.mjs:17`
- Preuve : `4175` et `4176` apparaissent dans `configurations` et dans la liste d'origines autorisées (L104) ; `ecrans.mjs:141` code `http://localhost:4175` ; `5199` est fixé pour `partie-test`.
- Gravité : 3
- Correctif : tirer les URL de `configurations`.
- Effort : S

**Q-srv-26 — Analyse d'arguments recopiée à la main dans les scripts, sans aide en ligne**
- `scripts/generer-pokemon.mjs:5-23`, `scripts/audit-captures.mjs:10-17`, `scripts/partie-test.mjs:15`, `:135`
- Preuve : chaque script parse `process.argv` autrement ; `node:util.parseArgs` n'est pas utilisé ; pas de `--help`.
- Gravité : 3
- Correctif : `parseArgs` et un module d'options partagé.
- Effort : S

**Q-srv-27 — Deux clients HTTP différents pour les scripts de téléchargement**
- `scripts/generer-pokemon.mjs:26-39` (délai, 3 essais) ; `scripts/lib/telechargement.mjs:43` (aucun délai ni essai)
- Preuve : comportements réseau incohérents (voir B-srv-24 et B-srv-25).
- Gravité : 3
- Correctif : un `lib/http.mjs` avec délai, essais, limite de taille.
- Effort : S

**Q-srv-28 — `npm run ci` et `ci.yml` répètent les mêmes étapes**
- `package.json:24`, `.github/workflows/ci.yml` (typecheck, lint, test, build écrits deux fois)
- Preuve : ajouter une étape oblige à modifier deux fichiers ; le serveur est déjà oublié de l'un et de l'autre.
- Gravité : 3
- Correctif : le workflow appelle `npm run ci`.
- Effort : S

**Q-srv-29 — Le workflow e2e de nuit installe deux navigateurs à chaque exécution, avec un délai de 180 minutes, 1 worker et 0 nouvelle tentative**
- `.github/workflows/e2e-nuit.yml:13`, `:33` ; `playwright.config.ts:7-9`
- Preuve : pas de cache des navigateurs ; `workers: 1`, `retries: 0`, `timeout: 120_000` par test : un échec ponctuel de réseau fait échouer toute la nuit et masque les vrais échecs.
- Gravité : 3
- Correctif : cache `~/.cache/ms-playwright`, `retries: 1` en CI, répartition en `shard`.
- Effort : S

**Q-srv-30 — Commentaire corrompu dans `.gitignore` (caractères de remplacement U+FFFD)**
- `.gitignore:16`
- Preuve : « G�n�rique des cr�dits : droits r�serv�s, usage priv� » : l'encodage d'origine est perdu (octets `EF BF BD`).
- Gravité : 3
- Correctif : réécrire le commentaire en UTF-8.
- Effort : S

**Q-srv-31 — Hack de plateforme dans le support de test partagé**
- `server/tests/support.ts:40-50`
- Preuve : sous Windows, `embedded.stop` est remplacé par un appel direct à `pg_ctl` du paquet `@embedded-postgres/windows-x64` ; ce contournement local (arrêt bloqué dans le bac à sable) vit dans l'aide commune à tous les tests et rend la CI Linux dépendante d'un chemin non testé.
- Gravité : 3
- Correctif : isoler dans un fichier `support-windows.ts` chargé conditionnellement.
- Effort : S

---

Total : 26 bugs, 29 sécurité, 31 qualité. Les bugs restent sous 30 : au-delà, les candidats seraient des variantes de ceux ci-dessus ou non vérifiables dans le code lu.
