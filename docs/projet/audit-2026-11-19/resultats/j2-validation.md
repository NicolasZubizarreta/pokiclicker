# Job validation — 19 novembre 2026

CORRIGÉ S-core-01 : `sauvegarde-validation.ts`, validation sémantique après la forme ; les réparations portent sur les données retournées par `validerEnveloppe`, donc reçues par `charger`.
CORRIGÉ S-core-02 : tous les validateurs numériques limitent à MAX_SAFE_INTEGER ; révision limitée à MAX_SAFE_INTEGER − 1, sans plafond monétaire de jeu.
CORRIGÉ S-core-03 : maxima niveau, calcium et bonheur lus dans `reglages`, sans recopier les valeurs.
CORRIGÉ S-core-04 : rejet des uid dupliqués sur équipe ∪ pc ∪ parents ∪ œufs et dans pcGlobal de la partie ; DonneesCompte ne contient pas de pcGlobal.
CORRIGÉ S-core-05 : listes bornées par les catalogues disponibles ou par LISTE_MAX (10 000, plafond technique documenté dans `plafonds.ts`) ; listes d'identifiants dédoublonnées silencieusement après contrôle de longueur.
CORRIGÉ S-core-07 : régions des métadonnées de partie limitées à Kanto et au catalogue des régions verrouillées de monde.json ; région courante obligatoirement débloquée ; données de région limitées au monde disponible (Kanto).
CORRIGÉ S-core-12 : événement inconnu ou déjà joué abandonné par suppression du champ facultatif.
CORRIGÉ S-core-31 : événement hors catalogue, étape inexistante ou file contenant un id inconnu abandonné ; `commandeCourante` était déjà sûre hors catalogue (test conservé), aucune modification de cette fonction.
CORRIGÉ S-core-15 : validateur de chaîne bornée, constantes NOM_PARTIE_MIN/MAX = 1/100 confirmées dans renommerPartie ; identifiants ≤ 64, autres textes ≤ 200, aucune exception nécessaire.
CORRIGÉ B-core-06 : starterId limité à null, 1, 4, 7 conformément à starter.ts.
CORRIGÉ B-core-07 : zone inconnue remplacée par le départ ; étapes entières ramenées à [1, zone.etapes], ou 1 pour une zone sans combat.
CORRIGÉ B-core-10 : argent et argentTotalGagne arrondis vers le bas après validation numérique ; réparation idempotente au chargement choisie pour couvrir aussi les flottants déjà enregistrés sous la version actuelle, sans nouvelle version de schéma.

## Limite d'intégration pour le job sauvegarde

Les validateurs reçoivent une seule enveloppe : ils ne peuvent comparer les uid du pcGlobal de la partie avec ceux des régions chargées séparément. Ce contrôle transversal reste à brancher dans le job autorisé à modifier sauvegarde.ts ; aucun état global mémorisé ajouté au cœur pur.

`eligible` n'est pas réévalué : les étapes `poser-drapeau`, `donner`, `deplacer` modifient les conditions pendant l'événement, donc l'état n'est pas stable. Les files sont contrôlées contre le catalogue réellement chargé par evenements-kanto.ts.

## Vérifications

- Avant correction : 10 failed (10), fichier ciblé uniquement.
- Après correction : 13 passed (13), `npx.cmd vitest run src/core/sauvegarde-validation.test.ts` ; comprend les six fixtures v1/v2, avec suppression du champ volontairement invalide `futur` comme dans sauvegarde.test.ts.
- `npx.cmd` utilisé car PowerShell bloque npx.ps1 par sa politique d'exécution.
- `npx.cmd tsc --noEmit -p tsconfig.app.json` filtré sur sauvegarde-validation et plafonds : aucun diagnostic sur les fichiers du job.
- Tests existants laissés intacts et non exécutés conformément à la restriction : incompatibilité attendue du test « conserve les drapeaux, les evenements joues et la reprise apres export et import » (kanto.essai hors catalogue, désormais abandonné) ; « exporte et importe toutes les régions sous un nouvel identifiant sans information de compte » contient un uid partagé entre équipe et pension, désormais rejeté. Le job sauvegarde doit adapter ses données de test.
