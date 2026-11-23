# Questions ouvertes, ticket F vague 1 (23/11/2026)

Rien de ce qui suit ne change une règle de jeu. Ce sont des points où le code a dû choisir quelque chose que la proposition retenue ne disait pas.

## Titres de dresseur (F-j2-35) : seuils à valider
Les titres sont cosmétiques (aucun avantage). Les seuils viennent de `data/titres.json` et se changent là sans toucher au code.

| Titre | Condition choisie |
|---|---|
| Dresseur | toujours disponible |
| Collectionneur | 50 espèces capturées |
| Pokédex complet | 151 espèces |
| Maître des œufs | 25 œufs éclos |
| Évolutionniste | 25 évolutions |
| Chasseur de chromatiques | 1 capture shiny |
| Champion de la Ligue | 1 victoire à la Ligue |
| Roi du casino | 10 000 jetons gagnés |
| Marathonien | 20 h de jeu |
| Dompteur de boss | 8 boss vaincus |

Question : ces dix titres et ces seuils te conviennent-ils, ou en veux-tu d'autres ?

## Cas non couverts
- Les compteurs (captures, évolutions, dépenses, records, rencontres par espèce) démarrent à zéro pour les parties existantes : la sauvegarde passe en version 6 sans reconstituer le passé. Un joueur déjà avancé verra « 0 » partout au début, sauf le Pokédex et le temps de jeu qui existaient déjà.
- Hall des Fameux : seules les victoires à la Ligue obtenues après cette version y apparaissent. Les victoires anciennes ne sont pas retrouvables. Le menu « Hall des Fameux » n'apparaît qu'après la première nouvelle victoire.
- Équipes enregistrées : un Pokémon enregistré puis relâché ou envoyé à la Pension est ignoré à l'application, avec un message. Les œufs de l'équipe restent à leur place. Pas de règle pour « équipe qui dépasse 6 » : les Pokémon en trop vont au PC.
- Plus ou moins (casino) : une « partie » compte une carte jouée, pas une série complète. Si tu préfères une série entière, c'est un changement de suivi à demander.
- Mannequin : le combat est en pause pendant les 30 s et rien ne compte pour la progression. Le DPS affiché ne compte que les dégâts automatiques de l'équipe et tes clics, sans bonus de zone.
- Aperçu du boss : le temps estimé pour vaincre le boss utilise le DPS automatique seul, sans les clics ; il peut donc être pessimiste pour un joueur qui clique beaucoup.
- Cadence maximale : mesurée sur la fenêtre glissante du limiteur de clics existant, donc plafonnée par ce limiteur.

## Règles refusées ou laissées de côté
- Aucun gain n'est donné par le code Konami, Missingno, les titres ni la carte de dresseur (pur cosmétique).
- Pas de classement en ligne ni de partage automatique : la carte de dresseur se copie ou se télécharge en image, rien n'est envoyé.
- Les 14 autres fonctionnalités du ticket F (succès, quêtes, prestige, Safari, Voltorbe Flip, etc.) sont pour la vague 2.

## À vérifier à l'écran par Nicolas
Scores du casino, page Crédits (section « Ta partie »), Hall des Fameux (après une victoire à la Ligue), astuces sous le rond de chargement, invitation d'installation (Chrome et Safari iPhone), Missingno (renommer un Pokémon), code Konami sur l'écran de combat, vibration et titre d'onglet à l'arrêt auto.
