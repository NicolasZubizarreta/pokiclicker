# Recette C — lot 6 (ticket F) — 23/11/2026

Branche `v2`, rien poussé. Vérifié dans le vrai jeu (serveur de dev, navigateur intégré, sauvegarde de test dans le localStorage de ce navigateur), 1440 px pour le fonctionnel, puis 390 et 768 px pour l'affichage des écrans du menu (défilement horizontal, boutons < 44 px, NaN/undefined : rien trouvé).

## Fonctionnalités (29)

| # | Fonctionnalité | Résultat |
|---|---|---|
| 1 | Succès : déblocage, liste | Vu OK (100 et 1 000 captures, liste de 32). Aucune notification pop-up à l'obtention : voir défauts |
| 2 | Chaînes de capture | Vu OK (« Chaîne de 2 ») |
| 3 | Objets tenus | Vu OK (message « Retire d'abord l'objet tenu ! » reste affiché, mineur) |
| 4 | Voltorbe Flip | Vu OK (partie, encaisser, défaite, reprise après rechargement). Nombres corrigés (b6bce52) |
| 5 | Fidélité VIP | Vu OK (Bronze, remise 2 %) |
| 6 | Ligue+ | Partiel : sélection du rang vue ; Ligue+ gagnée non jouée |
| 7 | Revanches de Blue | Revanche 1 vue de bout en bout (message, dialogue, combat, récompense). Revanches 2 à 4 non jouées |
| 8 | Labo de Chen : bilan | Vu OK |
| 9 | Labo de Chen : défi rejouable | Non testable : demande une 2e victoire de Ligue et le Pokédex complet à rejouer |
| 10 | Skins | Vu OK (achat, équipement, effet) |
| 11 | Parc Safari | Vu OK (entrée, pas, balle, appât, roche, sortie, reprise). Corrigé : be24358, 2bc1f24 |
| 12 | Statistiques | Vu OK |
| 13 | Records | Vu OK |
| 14 | Crédits | Vu OK (« Ta partie ») |
| 15 | Équipes enregistrées | Vu OK (équipe appliquée ; message muet si un Pokémon manque) |
| 16 | Scores du casino | Vu OK |
| 17 | Hall des Fameux | Corrigé : 654c886 (nom de l'espèce absent) |
| 18 | Titres | Vu OK |
| 19 | Carte de dresseur | Génération et lien Télécharger vus ; copie dans le presse-papiers non testable (navigateur intégré), le message de repli s'affiche |
| 20 | Aperçu du boss | Vu OK |
| 21 | Jauge de cadence | Vu OK (contraste du texte sur le décor à surveiller) |
| 22 | Mannequin | Vu OK |
| 23 | Avantage de type | Vu OK |
| 24 | Alerte d'arrêt auto | Vu OK |
| 25 | Rencontres par espèce | Vu OK |
| 26 | Lignées complètes | Vu, mais paliers 25 et 50 inatteignables : voir défauts |
| 27 | Missingno | Vu OK |
| 28 | Code Konami | Corrigé : 453a1e3 (B et A déclenchaient les raccourcis et remettaient le code à zéro) |
| 29 | Astuces au chargement / invitation d'installation | Non testé (invitation PWA non déclenchable ici ; astuces non observées) |

Bilan : 24 vues OK ou corrigées, 2 partielles (6, 7), 3 non testables ou non testées (9, 19 en partie, 29).

## Corrigé (commits locaux, non poussés)

- 453a1e3 code Konami (capture avant les raccourcis).
- b6bce52 messages du casino : « ×1.25 » devient « ×1,25 », gains avec séparateur de milliers. Les nombres à 4 chiffres restent collés (`useGrouping: 'min2'`) pour ne pas casser `PageCasinoJeux.test.tsx` (« ×5000 »), fichier d'une autre session que je n'ai pas modifié.
- be24358 Safari : visite reprise après rechargement sans le message « Paie l'entrée ».
- 2bc1f24 Safari : bilan « Pokémon capturés : N » (test `safari.test.ts` aligné).
- 654c886 Hall des Fameux : nom de l'espèce.
- 41758d0 panneau « Ton équipe » du combat PC : le niveau n'est plus coupé, le nom s'abrège.

Vérifié : `npm run build` passe, 116 tests ciblés passent, `tsc --noEmit` propre. Niveau du panneau d'équipe revu à l'écran (mesure : plus aucun « Niv. » débordant).

## Défauts restants, par gravité

1. Choix de règle : aucune notification pop-up à l'obtention d'un succès (les succès sont attribués à la sauvegarde, sans message). Écart avec la décision « notifs en pop-up » ; la proposition F-j1-01 n'en prévoyait pas.
2. Choix de règle : le jeu compte 16 lignées à 3 stades, donc les paliers 25 et 50 lignées sont inatteignables, ainsi que le succès « Vingt-cinq lignées complètes ». Paliers de lignées sans libellé.
3. Message du défi de Chen (« gagne la Ligue et remplis ton Pokédex ») affiché même quand ces deux conditions sont remplies (le défi dépend d'une 2e victoire de Ligue). À reformuler.
4. `PageCasinoJeux.test.tsx` : après décision sur l'affichage de « ×5 000 », aligner le test (et retirer `min2`).
5. Mineurs : « Équipe A appliquée » ne signale pas un Pokémon manquant ; « Tu encaisses 1 jetons » (pluriel) ; message « Retire d'abord l'objet tenu ! » persistant ; contraste du texte de la jauge de cadence sur certains décors ; `mannequinDpsMax` stocké avec des décimales.

## Non vu

Copie d'image dans le presse-papiers, défi de Chen et son rejeu, Ligue+ gagnée, revanches de Blue 2 à 4, invitation d'installation PWA, astuces au chargement, migration depuis des sauvegardes v5/v6 (fixtures dans `src/core/migrations/__fixtures__`), nombres énormes, double clic hors objet tenu.
