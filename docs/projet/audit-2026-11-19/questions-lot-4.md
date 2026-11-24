# Questions du lot 4

- Q-j1-28 : aucune date ni séquence d’acquisition dans PokemonPossede ; les UID sont opaques. L’ordre du PC change lors des échanges, donc l’inverser ne restitue pas les captures récentes. Une observation limitée à la session ne retrouve pas les captures antérieures au chargement et ne distingue pas une capture d’un retour de pension ou d’équipe. Tri « Récents d’abord » et badge « Nouveau » reportés : valider une métadonnée d’acquisition ou accepter explicitement un suivi limité à la session, sans changement du format actuel.
- Q-j1-04 (partiel) : « Passer » saute la réplique affichée, pas tout le bloc de dialogue. Sauter un bloc entier pourrait faire manquer une étape qui donne une récompense, un choix de starter ou une règle ; à cadrer avec toi avant d'aller plus loin.
- Q-j1-20 (partiel) : les tiroirs (Sac, Radar, Objectifs, Réglage) se ferment maintenant au toucher du fond. Je n'ai pas ajouté de second bouton « Fermer » en bas : deux boutons de même nom accessible dans un même dialogue prêtent à confusion pour un lecteur d'écran. À toi de dire si le toucher du fond suffit.
- Q-j1-26 : la barre du chrono du boss passe en `erreur-base` (rouge) sous le tiers du temps, avec le chiffre en gras qui pulse. Le journal DESIGN du 25/10 la gardait en `alerte-base` ; j'ai pris le rouge pour que l'urgence se voie. À valider.
- Q-j1-24 : « Boss : non capturable » est écrit dans la carte de l'ennemi (sous le nom), pas sous le bouton Capturer, faute de place à 390 px. (Géant) a une infobulle « Boss de zone : il a plus de PV. ».
- Q-j2-26 : l'alerte de session du casino (« Attention : tu as perdu X jetons… ») s'affiche dès que le bilan de la session est négatif. Aucun plafond ni seuil n'est ajouté, comme demandé. Choisir un seuil d'alerte (par exemple à partir de N jetons perdus) serait une valeur nouvelle : à décider par Nicolas.
- Q-j1-17 : le nom de la zone passe sur deux lignes dans le bandeau à 390 px au lieu d'être coupé ; le bouton « Son » partage la ligne du bandeau (Q-j2-12).
- Q-j2-32 : le Relevé de partie n'est pas supprimé malgré le commentaire de decisions.md (« tu peux le supprimer on s'en sert plus ») : le brief de la synthèse dit de le ranger. Il est sous un bloc « Avancé » replié. Dis-moi si tu veux le retirer pour de bon.
- Non vérifié à l'écran : Casino, Pension et Réglages > Avancé (verrouillés dans la sauvegarde de test). Couverts par les tests unitaires seulement.

## Décisions de Nicolas du 24/11/2026
- Q-j1-28 : reporté à la refonte de la sauvegarde.
- Q-j1-04, Q-j1-20, Q-j1-24, Q-j2-26 : laissés tels quels.
- Q-j1-26 (chrono du boss en rouge sous le tiers du temps) : validé.
- Q-j2-32 (Relevé de partie) : retiré de l'interface et du code, voir `docs/projet/decisions-recette-24-11.md`.
