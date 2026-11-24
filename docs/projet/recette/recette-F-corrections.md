# Recette F : corrections des défauts restants (24/11/2026)

Branche `v2`, rien poussé. Un commit par point. « Vu à l'écran » = page ouverte dans le navigateur de développement, aux tailles indiquées.

| Point | Fait | Commit | Vu à l'écran |
|---|---|---|---|
| 1. Relevé de partie | Retiré de l'interface et du code. Supprimés : le bloc « Avancé » des Réglages, `src/core/journal-zones.ts` et `src/ui/journal-zones.ts` (et leurs tests), la clé `journal` de `data/reglages.json`, son câblage dans le store. Gardés : les scripts d'équilibrage (`scripts/`), le journal serveur (`server/src/journal.ts`), les statistiques stockées (suivi, records). Décision notée dans `docs/projet/decisions-recette-24-11.md`. | 3af3883 | Non applicable (suppression), vérifié par les tests |
| 2. Pluriels | Fonction commune `libelleJetons`/`accorder` : « 0 jeton », « 1 jeton », « +1 niveau ». | 94126f3 | Tests seulement |
| 3. Équipes enregistrées | Le message nomme le Pokémon qui manque. | 6320d9e | 390 et 1024 px |
| 4. Défi du Labo de Chen | Message selon l'état réel (disponible, manque Pokédex, manque Ligue, manque les deux). | 01dbfcb | 390 px |
| 5. PV du boss | `whitespace-nowrap` et `text-sm` sous 1024 px : une ligne. | 65eb830 | 390 et 1440 px |
| 6. Message « Retire d'abord l'objet tenu ! » | Disparaît après `reglages.interface.annonceMs` (1200 ms), comme les autres annonces. | be11374 | 1440 px seulement (disparu en ~1,25 s) |
| 7. Connexion, champs vides | E-mail et mot de passe signalent l'erreur (texte + `aria-invalid`). | e788e59 | 390 et 1440 px |
| 8. Dégâts clic Total | Arrondi à l'entier supérieur à l'affichage (`Math.ceil`, décision de Nicolas) ; `calculerClic` inchangé. Test avec 11,25 → 12. | b55dc6f puis 6af7139 | Tests seulement |
| 9. Objectifs | Code non touché ; entrée au backlog (`docs/projet/backlog-plus-tard.md`), datée du 24/11/2026. | 53be577 | Non applicable |
| 10a. Axe, Statistiques PC | Vrai défaut : région défilante non atteignable au clavier (`scrollable-region-focusable`). `role="group"`, `aria-label`, `tabIndex=0` sur `.stats-grille`. Axe : 0 violation. | e376034 | Oui (axe injecté dans la page) |
| 10b. Réglages défilent | Vrai défaut : enveloppe de la page non contrainte en hauteur. Règles ajoutées dans `MenuPC.css`, 4 colonnes dès 1400 px (3 colonnes en dessous, chaque panneau défile dans son cadre). | 3780aba | 1280×800, 1440×900, 1920×1080 |
| 10c. Pension 1280×800 | Vrai défaut de hauteur : réserve de 19,5 rem trop faible, bas des cartes à 864 px pour une zone de 800. Portée à 26 rem. Bas des cartes : 787 (zone 800), 860 (900), 1040 (1080). Attente de spec aussi fausse (voir ci-dessous). | b146dff | 1280×800, 1440×900, 1920×1080 |
| 10d. Barre latérale / fluidité | Rien à corriger dans `src/` (voir ci-dessous). | aucun | Barre mesurée à 1440 et 1920 px |
| A. Mannequin | Le bouton quitte l'écran de combat (`ActionsCombat`, `OutilsCombat`). Il devient la ligne « Mannequin d'entraînement » du Menu, section « Ton aventure » (icône cible, sous-texte « Mesure tes dégâts pendant 30 s », grisée « Disponible pendant un combat » hors combat). La fenêtre est inchangée. Le combat retrouve 4 boutons sans vide. | 2b1492d | 390 et 1440 px (combat, menu, ouverture, lancement, fermeture) |
| B. Objets tenus (F-j1-24) | L'achat quitte la fiche. Rayon « Objets tenus » dans le Shop (18 cartes à 20 000 ₽, `acheterObjetTenu` débite l'argent et remplit le stock). La fiche garde « Objet tenu : X » avec un petit « Retirer » et un sélecteur « Donner un objet… » listant le stock compatible ; sans stock, une phrase renvoie au Shop. Donner ne coûte plus rien. Règles inchangées (+5 %, un seul objet, pas sur œuf). Fait avec le point 6 (message « Retire d'abord l'objet tenu ! » qui disparaît seul, be11374). | 7eb0b84 | 1440 px : achat au Shop (argent débité, stock), don du Charbon à Dracaufeu (DPS 5 985 → 6 284, +5 %), retrait. 390 px : pas de débordement horizontal, ligne de 44 px (mesuré, pas de capture exploitable) |
| C. Récompenses ×5 | Ligue+ : 125 000 ₽ par rang (rang 1 : 125 000, rang 10 : 1,25 M, total 6,875 M). Défi de Chen rejouable : 125 000 ₽ × (palier − 1) (palier 10 : 1,125 M, total 5,625 M). Nicolas avait cité 100 k et 1 M, qui ne collent pas ; le ×5 appliqué donne ces montants. Aucun test ni texte du jeu ne citait les anciens chiffres (les tests lisent le JSON) ; docs d'audit mises à jour. | 42d0fe8 | Tests seulement |
| D. Backlog succès | Entrée « Revoir les succès en profondeur » (skins, revêtements, icônes, avantages cosmétiques) dans `docs/projet/backlog-plus-tard.md`, 24/11/2026. | e80bb3a | Non applicable |
| E. Décisions de Nicolas | Section « Décisions de Nicolas du 24/11/2026 » ajoutée à `questions-lot-4.md` et `questions-lot-6.md`. | effa253 | Non applicable |

## Les quatre défauts de la recette A, tranchés

- **(a) `accessibilite.spec.ts:90`** : vrai défaut, corrigé (10a).
- **(b) Réglages qui défilent** : vrai défaut, corrigé (10b).
- **(c) `pension-visibilite.spec.ts:139`** : les deux. Vrai défaut de hauteur corrigé (10c). La spec compare aussi le bas des cartes à `decorBas` (bas du décor) alors que les cartes sont sous le décor par construction ; elle doit comparer à `zoneBas`. Message envoyé à la session `recette-e2e`.
- **(d) `coquille-pc.spec.ts:20` et `fluidite.spec.ts:4`** :
  - Barre latérale : la largeur est bonne (240 px = 15 rem, mesurée à 1440 et 1920). L'échec vient de `count()).toBe(8)` : DESIGN.md fixe 7 entrées sur PC (Équipe fusionnée dans le PC), et la constante `ONGLETS` du fichier en a déjà 7. Attente de spec périmée, à passer à 7 (message envoyé à `recette-e2e`).
  - Fluidité mobile : mesure de 60 s avec processeur ×4, seuils de fps ; ce n'est pas un défaut de mise en page et DESIGN.md n'en fixe aucune. Non rejouée : le port 4173 était occupé par l'exécution des e2e de `recette-e2e`. À relancer seule, machine au repos.

## Vérifications finales

- `npx tsc -b` : sans erreur.
- `npx vitest run` (relancé après les points A à E) : 294 fichiers, 3404 réussis, 1 ignoré, 0 échec. Un premier passage avait eu 2 timeouts de 30 s dus à la charge machine (les e2e d'une autre session tournaient), tous deux réussis seuls.
- Aucun e2e relancé (hors périmètre, `tests-e2e/` non modifié).

## À savoir

- Le dossier `dist/` est partagé entre sessions : un `npm run build` pendant qu'une autre session lance les e2e peut perturber leurs mesures.
