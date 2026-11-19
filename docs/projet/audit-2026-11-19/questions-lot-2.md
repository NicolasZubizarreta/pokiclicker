# Questions du lot 2 (ticket B, côté serveur)

Ces éléments n'ont pas été codés : ils changent une règle ou un comportement visible, demandent une décision, ou touchent `src/`. Les 40 autres éléments du ticket B sont faits ou sans objet (voir `docs/projet/backlog-phase-audit.md`).

## À décider avant de coder

1. **B-srv-01 : historique de rotation.** Le serveur écrit les 5 dernières versions à chaque envoi, mais aucune route ne les lit. Deux choix : (a) exposer et restaurer des instantanés espacés (un par heure ou par jour) ; (b) arrêter d'écrire la rotation. Elle coûte du stockage pour rien tant que (a) n'existe pas. Je n'ai rien changé.
2. **S-srv-01 : inscription ouverte.** Faut-il vérifier l'e-mail à l'inscription ou limiter les inscriptions (invitation, liste d'amis) ? Cela change le parcours d'inscription visible dans le jeu.
3. **S-srv-03 : énumération de comptes à l'inscription.** Répondre pareil que l'e-mail existe ou non oblige à passer par une confirmation par e-mail (message « vérifiez votre boîte »). Même décision que S-srv-01.
4. **Q-srv-07 : stockage.** Compression, instantanés espacés et copie des archives vers S3 : chantier L qui dépend de la décision 1 et du budget S3 (ticket de sauvegardes S3 déjà prévu).
5. **Q-srv-02 : 16 scripts `extraire-*-v1`.** `CLAUDE.md` dit que la V1 n'est plus une référence. Lesquels garder ? Mutualiser les 16 chargeurs dans `scripts/lib/legacy.mjs` avant ce tri risquerait de changer en silence les données extraites. Rien n'a été touché.
6. **Durée de session (S-srv-10).** `change-password` n'est plus exposé (liste blanche `/api/auth/*`) et la réinitialisation révoque les autres sessions. Reste la durée de 7 jours de Better Auth : la réduire déconnecte les joueurs plus souvent.

## Demande un changement dans `src/` (non fait)

7. **B-srv-03 : suppression de partie.** Le serveur accepte maintenant `revisionBase` sur `DELETE /parties/:id` (409 si périmée) mais le client ne l'envoie pas encore : tant qu'il ne le fait pas, la suppression reste inconditionnelle (elle est en revanche archivée 30 jours côté serveur). À faire dans `src/ui` ou `src/core` (lot client).

## Choix de prudence à confirmer

8. **S-srv-04 : `TRUSTED_PROXIES` vide en production.** Le serveur journalise un avertissement mais ne refuse pas de démarrer (un refus bloquerait un déploiement qui marche). Voulez-vous un refus net ? `server/.env.example` donne aussi une plage de proxys large en exemple : à resserrer sur le réseau réel de Coolify/Traefik.
9. **S-srv-12 : SMTP.** `smtp:` (sans TLS) reste accepté, mais avec `requireTLS` (STARTTLS obligatoire) ; `smtps:` et le port 465 passent en TLS direct. Un relais sans TLS du tout ne marchera plus en production.
10. **S-srv-19 : TLS vers Postgres.** Le démarrage en production avertit quand `sslmode` n'est pas `require`, `verify-ca` ou `verify-full` sur une base distante, sans refuser (la base Coolify est sur le réseau interne).
11. **S-srv-20 : deux rôles SQL.** Le code accepte `DATABASE_MIGRATION_URL` (migrations) distinct de `DATABASE_URL` (API). Créer les deux rôles sur la base de production est à faire à la main.

## Limites de ce lot

- **Docker non testé** : pas de Docker sur ce poste. Le `docker-compose.yml` durci (`read_only`, `cap_drop`, `tmpfs`, limites mémoire) et le build du Dockerfile sont à essayer avant le prochain déploiement.
- **Trivy / scan d'image** non ajouté en CI (outil de plus à maintenir) ; `npm audit` l'est.
- **`docs/migrations/0003-versions-origine.sql`** : copie documentaire de `server/migrations/0003-versions-origine.sql`, laissée en place (à supprimer ou à garder comme doc, à vous de voir).
- **Test `deux-appareils` « migre côté client … format v1 »** : échoue (le client répond « hors-ligne » au chargement). La cause probable est la validation client de `src/core/sauvegarde-validation.ts`, modifiée par l’autre lot ; je ne l’ai pas rejoué sur l’ancien code. À relancer quand ce lot est fusionné.
