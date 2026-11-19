CORRIGÉ B-core-03 : ennemis.ts et ennemis.test.ts, normalisation par le poids total restant ; balayage de 10 000 tirages par Repousse sur la route 1 de Kanto.
CORRIGÉ B-core-04 : relache-auto.ts et relache-auto.test.ts, retrait via relacher pour conserver le dernier non-œuf.
CORRIGÉ B-core-05 : pension.ts et pension.test.ts, refus des œufs au dépôt ; le test existant qui autorisait les œufs vérifie désormais le dépôt des favoris depuis l’équipe et le PC.
CORRIGÉ B-core-06 : starter.ts, combat-evenement.ts et starter.test.ts, refus des numéros hors 1/4/7 sans modifier la région et repli explicite sur l’équipe du starter 1.
CORRIGÉ B-core-35 : equipe.ts, pension.ts et equipe.test.ts, garde-fou favori partagé entre relacher et relacherLot ; le dépôt passe par envoyerAuPc pour conserver le dépôt des favoris et les protections du dernier actif.
CORRIGÉ B-core-36 : objets-equipe.ts et objets-equipe.test.ts, refus du Jeton Shiny sur les œufs ; adaptation du test existant qui autorisait ce comportement.
CORRIGÉ B-core-37 : pension.ts et pension.test.ts, couple incomplet si un parent est un œuf, avant toute lecture de son espèce dans le catalogue.
SANS OBJET B-core-38 : reglages.ts rejette déjà les réglages dont (chanceShiny + 2 × bonusParentShiny) × bonus.x dépasse 1, donc aucun réglage valide ne permet le dépassement signalé.

Vérification : première exécution ciblée avant correction, 7 failed / 102 passed (6 fichiers), couvrant les sept défauts ; le premier test B-core-06 échouait sur une fixture sans drapeaux, complétée ensuite.
Vérification finale : npx.cmd vitest run sur les sept fichiers autorisés, 126 passed / 1 failed (127), 6 fichiers passent ; échec dans pension-eclosion.test.ts:161 sur validerDonneesRegion et especesEcloses, hors des fonctions modifiées, laissé intact.
PowerShell refuse npx.ps1 (politique d’exécution) ; commandes exécutées via npx.cmd.
Vérification TypeScript : npx.cmd tsc --noEmit -p tsconfig.app.json, sortie filtrée sur les fichiers du job : aucune erreur.
