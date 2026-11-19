# Job sauvegarde — 19 novembre 2026

CORRIGÉ B-core-01 : sauvegarde.ts, listes isolées, diagnostic court et repli de partieCourante.
CORRIGÉ B-core-02 : sauvegarde.ts, quarantaine du brut hors préfixes actifs, reprise de révision et suppression associée ; les versions futures restent protégées.
CORRIGÉ B-core-08 : sauvegarde.ts, aide commune avec instantané des seules clés touchées et restauration au mieux, sans masquer la cause.
CORRIGÉ B-core-09 : sauvegarde.ts, régions illisibles exportées comme valeurs JSON brutes (chaîne si JSON tronqué), ids signalés, export du compte absent ou illisible.
CORRIGÉ B-core-17 : sauvegarde.ts, renommage via ecrire avec révision attendue facultative.
CORRIGÉ S-core-06 : sauvegarde.ts, limite de caractères avant parsing et nombre de régions avant validation des enveloppes, selon le catalogue.
CORRIGÉ S-core-15 : sauvegarde.ts, constantes communes et trim du nom ; recherche des appelants dans src sans nom vide littéral trouvé, UI inchangée.
CORRIGÉ S-core-28 : sauvegarde.ts, ErreurStockage conserve la cause et distingue quota et indisponibilité. src/ui doit attraper ErreurStockage (ticket C/D).
CORRIGÉ S-core-34 : sauvegarde.ts, ErreurSauvegarde sépare code, détail interne et message générique ; ERREUR_VERSION conservée.
CORRIGÉ S-core-04 : sauvegarde.ts, unicité transversale pcGlobal et toutes les collections des régions à l'import et à l'installation.
SANS OBJET S-core-07 : le validateur du job précédent vérifie déjà les régions du catalogue.

## Tests et limites

Huit tests de reproduction ont été exécutés avant correction : 8 failed (8). Les tests de limites et d'unicité transversale ainsi que les deux autres scénarios atomiques ont été ajoutés après correction : leur échec avant correction n'a pas été exécuté.

Tests existants adaptés pour les nouvelles révision/date, messages génériques et erreur de stockage propagée ; attentes du validateur précédent adaptées pour événement inconnu abandonné et libellé de longueur. Fixtures locales corrigées : uid distincts entre PC global, équipe et pension ; champ futur retiré avant import ; Johto non disponible remplacé par une clé brute pour tester le nettoyage, export limité à Kanto validable.

Vérification ciblée finale : 110 passed, 2 failed (112). Les deux échecs préservés concernent le blackjack : les cartes répétées du sabot sont dédoublonnées lors du passage dans la validation. Le fichier sauvegarde-validation.ts est interdit de modification dans ce job ; les attentes de conservation du sabot restent intactes. Critère « tous les tests existants passent » non satisfait pour cette raison.

TypeScript : commande npx.cmd tsc --noEmit -p tsconfig.app.json filtrée sur les fichiers du job, aucun diagnostic. Aucun formateur lancé.
