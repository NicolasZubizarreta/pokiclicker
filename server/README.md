# API des comptes

Node 22, TypeScript strict, Hono, Postgres et Better Auth, plus la sauvegarde en ligne d'une partie par compte (section « Sauvegarde »).

## Développement

Les dépendances sont déjà installées. Copier `.env.example` vers `.env` et remplacer les valeurs factices. Les scripts `dev`, `start` et `migrate` chargent ce fichier s’il existe ; les variables du processus restent prioritaires. PowerShell permet aussi `$env:DATABASE_URL='postgresql://…'`.

```powershell
npm.cmd run migrate
npm.cmd run dev
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd start
```

`DATABASE_URL`, `BETTER_AUTH_URL` et `CORS_ORIGINS` sont obligatoires. Les origines sont séparées par des virgules, sans chemin ni barre finale. Le secret doit avoir au moins 32 caractères ; en développement seulement, son absence génère un secret éphémère (les sessions cessent de fonctionner au redémarrage). En production, secret explicite, URL HTTPS, SMTP et `MAIL_FROM` sont obligatoires. SMTP accepte `SMTP_URL` ou les quatre variables `SMTP_HOST/PORT/USER/PASS`. `AUTH_RATE_MAX=5` et `AUTH_RATE_WINDOW=60` règlent les trois routes sensibles ; la limite générale de Better Auth reste inchangée.

Pour un environnement Docker local : `docker compose up --build` dans ce dossier. Les identifiants du compose sont factices et réservés au développement. Docker n’est pas nécessaire aux tests : sans `DATABASE_URL`, ils démarrent les vrais binaires d’embedded-postgres dans un dossier temporaire sur un port libre. Avec `DATABASE_URL`, ils créent puis suppriment un schéma isolé ; utiliser une base de test et un rôle autorisé à créer des schémas. Aucun remplacement de Postgres par une simulation.

## Authentification

La surface publique est limitée à POST `sign-up/email`, `sign-in/email`, `sign-out`, `request-password-reset`, `reset-password`, `delete-user`, et GET `get-session`, `reset-password/:token`, `error`. Toute autre route d’authentification renvoie 404. Les jetons Bearer doivent être signés. À l’inscription, le nom est tronqué à 50 caractères et une image dépassant 2048 caractères est retirée.

Les demandes de réinitialisation sont limitées à trois envois par destinataire et par heure, indépendamment de l’IP, avec une réponse neutre inchangée. Seule une empreinte HMAC de l’adresse est conservée dans le compteur ; les entrées de plus de 24 heures sont purgées lors des demandes suivantes.

`POST /api/auth/delete-user` accepte `{ password }` et supprime le compte et ses sauvegardes par cascade. Better Auth exige un mot de passe valide ou, en son absence, une session fraîche. `GET /api/compte/export` exige un Bearer et renvoie `{ exporteLe, compte, parties: [{ partie, regions }] }`, avec les enveloppes de sauvegarde et `compte: null` en l’absence de données. L’export exclut les autres comptes et l’historique des versions ; sa réponse porte `Cache-Control: no-store` et la limite de corps est de 100 Ko.

Les routes Better Auth sont sous `/api/auth/` : `sign-up/email`, `sign-in/email`, `get-session`, `sign-out`, `request-password-reset`, `reset-password`. Les inscriptions utilisent les champs `name`, `email`, `password` ; `name` est requis par Better Auth et peut être la valeur générique « Joueur ». Le mot de passe doit compter au moins dix caractères ; le maximum par défaut est conservé. Aucune vérification d’e-mail à l’inscription.

Le client lit `set-auth-token` après inscription/connexion puis transmet `Authorization: Bearer <jeton>`. Il n’a pas besoin de cookies entre domaines. Ne jamais mettre ces jetons dans des URL ou journaux. Pour demander un lien, envoyer `email` et `redirectTo` (une URL du jeu autorisée), puis transmettre `token` et `newPassword` à `reset-password`. Le lien expire après une heure ; sa consommation et la révocation des sessions sont assurées par Better Auth. Le mailer est injectable dans les tests. Sans SMTP en développement, le lien est affiché dans la console (jamais en production). Better Auth conserve son niveau de journalisation `warn`. Les journaux applicatifs sont des lignes JSON : refus HTTP et actions d’authentification avec identifiant `X-Request-Id`, sans corps, paramètres de requête ni jetons. Les erreurs SMTP et de tâches de fond masquent les adresses électroniques. L’envoi SMTP fait trois tentatives (attentes de 1 puis 3 secondes) ; le mailer injecté reste appelé une seule fois. Les erreurs HTTP d’authentification ont un message français ; les codes machine restent ceux de Better Auth.

En production, générer le secret avec `openssl rand -base64 48` ; les valeurs d’exemple sont refusées. `TRUSTED_PROXIES` vide produit un avertissement ; `TRUSTED_PROXIES=none` indique explicitement aucun proxy. SMTP impose TLS avec validation du certificat, par TLS direct sur 465 / `smtps:` ou STARTTLS sur les autres transports, y compris `smtp:`.

`DATABASE_MIGRATION_URL` est optionnelle et vaut `DATABASE_URL` par défaut. Pour séparer les droits, utiliser un rôle propriétaire des tables pour les migrations et un rôle DML pour l’API (`DATABASE_URL`). Après migration, accorder au rôle API, dans le schéma utilisé :

```sql
GRANT USAGE ON SCHEMA public TO pokiclicker_api;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pokiclicker_api;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO pokiclicker_api;
ALTER DEFAULT PRIVILEGES FOR ROLE pokiclicker_proprietaire IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO pokiclicker_api;
ALTER DEFAULT PRIVILEGES FOR ROLE pokiclicker_proprietaire IN SCHEMA public
  GRANT USAGE ON SEQUENCES TO pokiclicker_api;
```

Les deux URL exigent un paramètre `sslmode` (préférer `require` ou `verify-full`) ou `ssl` pour un hôte public contenant un point. `sslmode=disable` reste accepté avec avertissement. Le démarrage retente dix fois la connexion avant de quitter avec le code 1 ; les erreurs du pool et rejets de promesses sont journalisés. Toutes les réponses portent CSP, CORP, Permissions-Policy et COOP ; en production HSTS inclut les sous-domaines.

La limite est persistée en base et active dans tous les environnements. Le proxy HTTPS doit supprimer les en-têtes IP fournis par le client et écrire une adresse client unique fiable dans `X-Forwarded-For`. Ne pas exposer directement le port de l’application sur Internet : un client direct pourrait forger cet en-tête. Sans adresse reconnue, Better Auth utilise un compteur partagé par route. Configurer et vérifier ce point sur le proxy Coolify avant ouverture publique. Ne pas ajouter d’origines génériques ou de joker CORS.

`GET /health` fait `select 1` et retourne `{ "ok": true }`, ou 503 si la base est indisponible. Corps limité à 100 ko, réponses d’authentification non mises en cache, en-têtes `nosniff` et `no-referrer`.

## Sauvegarde (ticket D)

Migration SQL versionnée dans `src/schema.ts` (table `migrations_sauvegarde`), lancée par `migrate.ts` sous le même verrou que Better Auth : `donnees_compte`, `parties`, `regions`, `versions` (5 dernières versions remplacées de chaque objet). Routes, toutes avec `Authorization: Bearer <jeton>`, le compte venant uniquement de la session :

- `PUT /api/sauvegarde` : `{ partieId?, compte?, partie?, regions? }`, chacun `{ revisionBase, enveloppe }` (enveloppe de l'ADR 0001). Une transaction ; si une `revisionBase` n'est pas la révision du serveur : 409 avec `conflits` (niveau, id, revisionServeur, ecritLe, résumé), rien n'est modifié. 200 : les nouvelles révisions. Limites : 1 Mo par enveloppe, 3 Mo par requête.
- `GET /api/sauvegarde/compte` et `GET /api/sauvegarde/parties/:id` (partie + régions). 404 pour une partie d'un autre compte.
- `GET /api/sauvegarde/parties` : liste des parties du compte, de la plus récemment écrite à la plus ancienne (20 au plus), avec `id`, `nom`, `revision`, `ecritLe`, `regionCourante`, `zoneId` et `tempsJeuMs` (ces trois derniers valent `null` si absents ou invalides).
- `DELETE /api/sauvegarde/parties/:id` : supprime la partie, ses régions, son appareil actif et ses versions archivées ; le compte reste.
- `POST /api/sauvegarde/versions` : `{ niveau, objetId, enveloppe }`, archive une version écartée ; conserve les 5 dernières insertions par objet et 200 versions au plus par compte, limites de 1 Mo par enveloppe et 3 Mo par requête.
- `POST /api/sauvegarde/parties/:id/appareil` : `{ appareilId: uuid, reprendre?: boolean }` → `{ actif: boolean }` ; battement toutes les 60 s côté client, appareil considéré parti après 120 s sans battement.

## Coolify

1. Créer un service Postgres géré par Coolify, un utilisateur dédié et une base. Garder Postgres sur le réseau privé.
2. Créer l’application depuis cette branche avec contexte de construction `server/`, Dockerfile `Dockerfile`. Ajouter les variables de `.env.example` dans Coolify avec un secret aléatoire réel et les paramètres SMTP. Affecter un domaine HTTPS à l’API et renseigner cette URL dans `BETTER_AUTH_URL`.
3. La migration se lance toute seule à chaque démarrage du conteneur (`node dist/migrate.js` avant le serveur, sous verrou Postgres : une seule à la fois). Sauvegarder avant une mise à jour du schéma.
   `TRUSTED_PROXIES` liste les réseaux des proxys de confiance (Traefik de Coolify), séparés par des virgules. Sans elle, l’adresse du client est illisible derrière le proxy et la limite de tentatives porte sur le proxy entier.
4. Vérifier `/health`, inscription, e-mail reçu et proxy IP. Garder le port interne privé. Le Dockerfile utilise Node 22 slim, une construction séparée et l’utilisateur `node`.
5. Planifier une sauvegarde quotidienne de Postgres dans Coolify avec copie hors de l’hôte et rétention adaptée. Surveiller les échecs et les mises à jour de sécurité.

## Restauration d’essai

Depuis un poste disposant des outils Postgres de même version majeure (18), avec les URL dans les variables du processus, produire une archive hors dépôt :

```powershell
pg_dump --format=custom --file=sauvegarde.dump --dbname=$env:DATABASE_URL
# RESTORE_DATABASE_URL désigne une nouvelle base VIDE et isolée, jamais la production.
pg_restore --no-owner --no-privileges --exit-on-error --dbname=$env:RESTORE_DATABASE_URL sauvegarde.dump
psql --dbname=$env:RESTORE_DATABASE_URL --command='SELECT count(*) FROM "user"; SELECT count(*) FROM session;'
```

Lancer une instance isolée de l’API avec cette base et un domaine de test autorisé ; vérifier santé, connexion d’un compte de test et réinitialisation avec SMTP de test. Comparer les comptes et les dates avec l’archive, noter date, durée et résultat de la restauration. Supprimer ensuite l’instance et la base d’essai. Effectuer cet exercice avant mise en production, puis régulièrement. La procédure est documentée ici ; aucun déploiement ni exercice sur Coolify n’a été exécuté sur ce poste.

## Déploiement du lot 8 (06/11/2026)

Le PUT de sauvegarde accepte `appareilId` optionnel (UUID). Si un autre appareil a envoyé un battement dans les 120 dernières secondes, il refuse l’écriture avec 409 et `code: 'ailleurs'`, avant le contrôle des révisions. Aucune migration SQL.

**DÉPLOYER LE SERVEUR AVANT LE CLIENT** : un ancien serveur répond 400 à un nouveau client qui envoie `appareilId`, car `valider` refuse les champs inconnus. Sans `appareilId`, rien ne change pour un ancien client.

## CI à ajouter

Ajouter ultérieurement un job `server` avec Node 22 et un service Postgres 18 : `npm ci` dans `server`, puis `npm run typecheck`, `npm test`, `npm run build`, avec `DATABASE_URL` de test. Le lint reste celui de la racine (`npx eslint server`). Aucun changement de `.github/` n’est nécessaire à cette livraison.

L’API de migration de Better Auth 1.7.16 est exportée par `better-auth/db/migration`, et non `better-auth/db`. Sous Windows, le nettoyage des tests utilise le `pg_ctl` du paquet embarqué : son arrêt par `taskkill` reste bloqué dans ce bac à sable. Les mises à jour doivent conserver les tests d’usage unique, d’expiration, de révocation et de limite par route. Une revue humaine de sécurité reste prévue par l’ADR 0005.

## Suites du lot 8 (07/11/2026)

Routes ajoutées (même authentification, même isolation par compte) :
- `PATCH /api/sauvegarde/parties/:id` : `{ nom }` (1 à 100 caractères), renomme sans changer la révision.
- `GET /api/sauvegarde/parties?appareilId=<uuid>` : chaque partie gagne `appareilActif` (`'cet-appareil'`, `'autre'`, `null`) ; champ absent sans `appareilId`.
- `POST /api/sauvegarde/parties/:id/archives` : `{ partie, regions }`, archive un lot complet (3 Mo au plus).
- `GET /api/sauvegarde/parties/:id/versions` : au plus 5 lots restaurables.
- `POST /api/sauvegarde/parties/:id/restaurer` : `{ appareilId, lot }`.

**Migration SQL n°3** (`docs/migrations/0003-versions-origine.sql`, colonnes `versions.origine` et `versions.lot`) : additive, appliquée toute seule au démarrage du nouveau serveur. Sauvegarder la base avant le déploiement ; aucune commande n'a été lancée en ligne. Retour en arrière : redéployer l’ancien serveur ; il ignore les colonnes mais sa rotation (5 par objet) peut effacer les lots archivés.

**Ordre de déploiement** : 1. serveur (migration 3 incluse) ; 2. client du lot 8 et de ces suites (un nouveau client contre un ancien serveur échoue à archiver : 404 sur `/archives`) ; 3. enfin le commit « appareil obligatoire » (le PUT sans `appareilId` répond alors 400 `appareil-requis`), seulement quand plus aucun client sans `appareilId` n'est en ligne.
