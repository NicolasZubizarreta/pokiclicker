# Questions du lot 2 (ticket B, côté serveur)

Ces éléments n'ont pas été codés : ils changent une règle ou un comportement visible, demandent une décision, ou touchent `src/`. Les 40 autres éléments du ticket B sont faits ou sans objet (voir `docs/projet/backlog-phase-audit.md`).

## Décisions de Nicolas (transmises le 19/11/2026)

1. **B-srv-01** : la rotation des 5 dernières versions n’est plus écrite (PUT et `POST /versions`). Les archives de divergence, de restauration et de suppression restent. La migration 0005 efface les anciennes lignes de rotation, que nulle route ne lisait.
2. **S-srv-10** : session de 30 jours, glissante (`updateAge` 1 jour : chaque visite espacée de plus d’un jour repousse l’expiration). Un joueur actif n’est jamais déconnecté ; l’inactif l’est après 30 jours. La révocation des autres sessions à la réinitialisation est conservée.
3. **Q-srv-02** : les 16 scripts `extraire-*-v1`, les 7 tests `*-fraicheur` qui les exécutaient et les 6 commandes `extraire:*` de `package.json` sont supprimés. Les données déjà extraites (`data/`, `tests/fixtures/v1-*.json`, utilisées par des tests de `src/`) ne bougent pas. Aucun script restant n’en dépend.
4. **S-srv-01 et S-srv-03** : inscription laissée ouverte, e-mail non vérifié, rien à coder. **S-srv-04** : avertissement seul. **S-srv-12, S-srv-19, S-srv-20, Q-srv-07** : rien maintenant. **B-srv-03** : la part client revient au lot 3.

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
