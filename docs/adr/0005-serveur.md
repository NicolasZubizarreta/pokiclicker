# ADR 0005 — Serveur du compte et de la sauvegarde en ligne

**Statut : accepté — décidé par Nicolas le 04/11/2026.** Complète l'ADR 0001 (format) et l'ADR 0004 (règles de synchronisation). Ticket A de la phase 4.

## Contexte
- Décisions de Nicolas du 04/11 : serveur à lui sur Coolify ; connexion par e-mail et mot de passe ; compte obligatoire ; pas d'export ni d'import JSON (la sauvegarde vit en base).
- Le serveur gardera des mots de passe et des e-mails (risque R6) et les parties de quelques amis (risque R5 : perte de données, conflit, quotas).
- Besoins : comptes avec réinitialisation du mot de passe par e-mail, une écriture refusée si la `revision` de départ n'est pas la dernière, droits « un compte ne lit que ses données », sauvegardes de la base, déploiement et mises à jour simples.

## Options comparées (faits relevés le 04/11/2026)
| | PocketBase | Supabase auto-hébergé | API maison + Postgres |
|---|---|---|---|
| Comptes, réinitialisation | intégrés (bcrypt) | intégrés | à brancher sur une bibliothèque d'authentification maintenue |
| Refus sur révision | crochet JS à écrire, aucun exemple officiel | règle SQL ou fonction | condition SQL `WHERE revision = $base` |
| Sauvegarde de la base | ZIP intégré, local ou S3 | Postgres, à planifier | sauvegarde planifiée de Coolify pour Postgres |
| Conteneurs / mémoire | 1 conteneur | 15 conteneurs ; 4 Go minimum, 8 Go conseillés | 2 conteneurs |
| Maintenance du projet | **dépôt officiel archivé le 26/10/2026**, dernière version 0.40.6 du 23/10, mainteneur unique, pas de garantie avant la 1.0 | projet actif | notre code, bibliothèques maintenues |
| Limite de tentatives de connexion | intégrée mais désactivée par défaut | à régler | à écrire (ticket C) |

## Décision
**Une petite API TypeScript sur Node, avec Postgres géré par Coolify.** Raison : PocketBase n'est plus maintenu pour un serveur qui garde des mots de passe ; Supabase est disproportionné pour quelques amis ; l'API maison reste petite (une dizaine de routes) et le contrôle de révision est une simple condition SQL.

1. **Authentification** : bibliothèque maintenue, choisie et vérifiée au ticket C (candidat : Better Auth). Aucun hachage de mot de passe écrit à la main. Mot de passe d'au moins 10 caractères ; réinitialisation par lien à usage unique qui expire ; limite des tentatives de connexion côté serveur. Envoi d'e-mails par SMTP (fournisseur à choisir au ticket C).
2. **Données** (Postgres, colonnes `jsonb` pour `donnees`) :
   - `comptes` : géré par la bibliothèque d'authentification (e-mail, mot de passe haché). Seule donnée personnelle conservée.
   - `donnees_compte` : une ligne par compte (enveloppe ADR 0001, niveau `compte`) : diamants, succès, skins, préférences.
   - `parties` : une ligne par partie (enveloppe, niveau `partie`) avec `compte_id`, `nom`, `revision`, `ecritLe`.
   - `regions` : une ligne par région d'une partie (enveloppe, niveau `region`) avec `partie_id`.
   - `appareil_actif` : par partie, identifiant d'appareil et date du dernier battement, datée par le serveur (ticket F).
   - `versions` : les 5 dernières versions remplacées d'une partie (ticket E).
3. **Droits** : toute route filtre sur le compte de la session ; un compte ne lit ni n'écrit les données d'un autre. Les identifiants de partie sont des UUID.
4. **Révision** : le client envoie `revisionBase`. Le serveur exécute `UPDATE … SET revision = revisionBase + 1 WHERE id = … AND revision = revisionBase` ; aucune ligne modifiée → réponse 409 avec un résumé de la version du serveur (ADR 0004 point 4). L'ancienne version va dans `versions` dans la même transaction.
5. **Taille** : refus au-delà de 1 Mo par enveloppe (très au-dessus des quelques ko attendus).
6. **Sauvegardes** : sauvegarde planifiée de Coolify (quotidienne, copie hors du serveur) ; restauration d'essai à faire une fois au ticket B.
7. **Réseau** : HTTPS ; CORS limité à l'adresse du jeu et à `localhost` ; secrets dans les variables de Coolify, jamais dans le dépôt.
8. **Dépôt** : dossier `server/` dans le même dépôt, déployé séparément ; le client ne parle au serveur que par `src/ui/` (rien dans `src/core`).

## Amendements aux ADR précédents (décision du 04/11)
- **ADR 0001, point 6** : l'export/import JSON est abandonné. La partie vit sur le serveur.
- **ADR 0004, point 4** : au lieu d'exporter l'ancienne version en JSON avant d'écraser, le serveur garde les 5 dernières versions de chaque partie.
- **ADR 0004, point 7** : inchangé (le compte ne garde que l'e-mail).

## Conséquences
- On écrit et on entretient l'API : peu de routes, mais l'authentification reste une zone à revue de sécurité humaine (pas d'`agent-ok` sur A, B, C).
- Mises à jour de sécurité de Node, de Postgres et de la bibliothèque d'authentification à suivre (à vérifier à chaque phase).
- Tickets concernés : B (déploiement), C (comptes), D, E, F (synchronisation).
