# Retour testeur du 17/11 : décisions de Nicolas

Source : retour d'un testeur qui a fini le jeu à 100 % et tenté le shiny dex avec les seuls œufs. Numéros du testeur conservés (8, 11 et 12 n'existent pas). Les tickets F à Q sont proposés, pas encore écrits dans le backlog.

## Décisions prises (mot de Nicolas)

- On fait tous les points sauf le 5 (PC de Léo sur mobile : non).
- Tout ce qui change une valeur ou une règle passe par un ticket validé avant d'être appliqué.
- Pt 6 et 18, relâche par lot : bouton « Relâcher » dans le PC, sélection de plusieurs Pokémon, les favoris portent un verrou et ne se sélectionnent pas. Même règle pour la relâche automatique.
- Pt 9, relâche automatique (réglage, désactivé par défaut) : si l'espèce est déjà enregistrée dans le Pokédex, un Pokémon capturé en combat est relâché automatiquement ; un Pokémon éclos dont l'espèce est déjà dans l'œuf dex est relâché automatiquement. Les shiny ne sont jamais relâchés. But : spammer les œufs pour compléter l'œuf shiny dex sans relâcher un par un.
- Pt 22, retrait d'objet : l'objet retiré revient dans le sac.
- Pt 20, fusion Équipe/PC : en dernier. Les touches 1 à 7 ne sont pas supprimées, elles se décalent d'un cran.
- Shiny (pt 2) : dégâts `degats.shiny` 1.5 → 1.25 ; `combat.chanceShiny` 1/256 → 1/512 ; `pension.chanceShiny` 1/8 → 1/16 ; Jeton Shiny prix de base 250 000 → 1 000 000 (sans inflation, comme aujourd'hui).
- Pt 15, bonbons : augmenter l'inflation par badge, et réduire les bonbons par shiny (kill ou capture) de 5 à 2.
- Pt 16, balles : Super Ball ×2 → ×1.5, Hyper Ball ×4 → ×3 (voir le piège de la pitié à trancher).
- Pt 14 (jeu austère) : le testeur saute le tuto dès qu'une fenêtre s'ouvre ; pas de solution trouvée, à chercher ensemble.
## Décisions du second message (17/11)

- Pension : chances `metamorph` et `memeEspece` 0.04 → 0.02 ; `typePartage` 0.02 → 0.01 ; éclosion 25 → 50 victoires (`pasEclosion`) ; pas de limite de tentatives par seconde ; `prixParEmplacement` 5 000 → 50 000 (emplacements à 50k, 100k, 150k, 200k).
- Métamorph + Métamorph : les légendaires restent dans le tirage mais deviennent bien plus rares (aujourd'hui 5 sur 151, environ 1 sur 30). Poids proposé : 1/10 d'une espèce normale (environ 1 sur 290), à valider.
- Taux d'apparition : Mew 1 % → 0,5 % ; Mewtwo 5 % → 1 % ; Articuno 5 % → 2 % ; Sulfura 5 % → 2 % ; Zapdos déjà à 2 %. Le total de chaque zone reste à 100 % : les points libérés vont aux autres Pokémon de la zone.
- Pitié de capture : inchangée (« on ne réduit pas la pitié »). Multiplicateurs de balles ×1.5 et ×3.
- Objet « Bonbon » renommé « Super Bonbon » (premier changement).
- Inflation par badge : 0.10 proposé, tableau de prix montré à Nicolas pour validation.
- Pt 4, 13, 17 : traités par les décisions ci-dessus.

## Validé le 17/11 (troisième message)

- Pension, poids des légendaires dans Métamorph + Métamorph (1/10) et tables de taux d'apparition : validés tels que proposés.
- Inflation par badge : 0.20 (choisi après tableau avec et sans la remise de 15 % du palier Pokédex 70).
- Tickets F à V écrits dans `backlog-phase-5b.md` (17/11), en attente du go de Nicolas pour coder. Questions ouvertes : un éclos shiny remplit-il les quatre dex (hypothèse oui, ticket G) ; où mettre l'accès pension (ticket O) ; point 14 (jeu austère) sans décision.

## Réponses du 17/11 (après F, R, S, T)

- Un Pokémon éclos shiny remplit les quatre listes (Pokédex, shiny, œuf, œuf shiny).
- Accès à la pension : un bouton dans la barre de navigation, entre Pokédex et Menu (ticket O).
- Point 14 (jeu austère) : ticket W, à traiter en dernier, quand il ne restera que lui.
- Plus de simulateur par ticket, la V1 ne fait plus foi.
