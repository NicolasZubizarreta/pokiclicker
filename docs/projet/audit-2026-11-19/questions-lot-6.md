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

---

# Vague 2 (ticket F, 23/11/2026) : décisions de règle à valider

Chaque valeur citée vit dans un fichier de `data/` et se change là sans toucher au code. Rien n'a été validé par Nicolas : ce sont les valeurs les plus prudentes choisies pour ne pas bloquer. Aucune ne rend le jeu plus facile, sauf là où c'est écrit.

## F-j1-01 Succès (25 de plus, 32 au total)
- Mesures nouvelles lues dans le suivi : captures, captures chromatiques, évolutions, zones finies (boss vaincus), argent total gagné, jetons gagnés, niveau maximal, victoires à la Ligue, meilleure série de victoires, parties de casino, lignées complètes. Tout est dans `data/succes.json` (seuil et diamants de chaque succès).
- Diamants versés : de 5 à 100 par succès, 25 nouveaux succès pour 770 diamants. Les diamants n'achètent que des cosmétiques (boutique de skins, F-j2-02) : aucun effet sur le rythme du jeu.
- Pas de succès sur les « clics totaux » : compter chaque clic obligerait à réécrire la sauvegarde à chaque clic. À décider avec la refonte de la sauvegarde.
- Les compteurs de suivi démarrent à zéro pour les parties existantes (déjà noté en vague 1) : les succès « captures », « évolutions », « jetons », « victoires de Ligue » s'obtiennent depuis la vague 1, pas depuis le début de la partie. « Zones finies », « argent total », « niveau max » et « lignées » se lisent sur la partie telle qu'elle est et peuvent tomber d'un coup.
- Question : ces seuils et ces diamants te conviennent-ils ?

## F-j1-18 Chaînes de capture
- Règle choisie : la chaîne compte les Pokémon sauvages de la même espèce vaincus ou capturés à la suite. Une autre espèce la remet à 1, un boss ne la touche pas, un chromatique la clôt. Elle ne vaut que pour la chance chromatique de l'espèce de la chaîne (pas pour les autres) et se garde dans la sauvegarde (pas de gain d'argent, de XP ni de capture).
- Paliers dans `data/reglages.json` (`combat.chaines`) : 5 de suite = ×1,25, 10 = ×1,5, 20 = ×2 (plafond). Ils se multiplient avec le Charme Chroma et le palier 151 du Pokédex.
- Pourquoi prudent : la chance de base est 1/512 ; avec une chaîne de 20 elle devient 1/256 au mieux. Dans une zone qui mélange 5 espèces, une chaîne de 5 est déjà rare.
- Effet sur l'équilibrage : chasser un chromatique devient un peu plus rapide dans les zones à une espèce dominante. C'est la seule accélération de la fonctionnalité.
- Affichage : une ligne « Chaîne de N » sous le nom de l'ennemi dès 2, et le record dans Statistiques.

## F-j1-24 Objets tenus selon le type
- Règle choisie : un objet par type de Pokémon (18 objets : Charbon, Eau Mystique, Graine Miracle, Aimant, Glaçon Éternel, Ceinture Noire, Pic Venin, Sable Doux, Bec Pointu, Cuillère Tordue, Poudre Argentée, Pierre Dure, Rune Sort, Écaille Draco, Lunettes Noires, Peau Métal, Plume Fée, Mouchoir Soie). Il donne +5 % de dégâts propres au porteur, seulement si le porteur a ce type (un double type profite des deux objets). Un seul objet par Pokémon, jamais avec la Pierre Stase, jamais sur un œuf.
- Valeurs dans `data/objets-tenus.json` : `bonus` 0,05 (la proposition disait 10 %), `prix` 20 000 ₽, la liste des objets et leur type. Pour changer : modifier ces deux nombres.
- Obtention : achat direct depuis la fiche du Pokémon (« Acheter et donner »), 20 000 ₽, sans condition de badge. Retirer l'objet le rend à l'inventaire (pas de remboursement, pas de perte) ; relâcher un Pokémon rend aussi son objet. L'achat compte dans « Argent dépensé > Boutique ».
- Pourquoi prudent : 5 % ne change presque rien à un jeu où le niveau fait x100 ; le prix de 20 000 ₽ est une dépense de milieu de partie. Un Pokémon qui évolue vers un autre type garde son objet, mais sans effet (la fiche le dit) ; il faut le retirer et en reprendre un.
- Effet sur l'équilibrage : le DPS de toute l'équipe peut monter jusqu'à +5 % contre de l'argent. C'est un gain de puissance, il rend le jeu un peu plus facile.
- Pas de nouvelle version de sauvegarde : le champ `objetTenu` est facultatif, un id illisible est retiré à la lecture. Les objets en stock se rangent dans l'inventaire sous `tenu-<id>`.
- Question : 5 % et 20 000 ₽ te conviennent-ils ? Faut-il un objet vendu en boutique plutôt que sur la fiche ?

## F-j2-14 Casino : Voltorbe Flip
- Règle choisie : grille de 25 cartes cachées (×1, ×2, ×3 ou Voltorbe). La mise est débitée au départ. Chaque ×2 retourné ajoute 25 % de la mise au gain, chaque ×3 en ajoute 50 % (addition, pas multiplication). Un Voltorbe fait tout perdre. « Encaisser » est possible à tout moment mais retient 20 % du gain (on touche 80 %). Retourner toutes les cartes ×2 et ×3 termine la grille et paie sans retenue. Chaque ligne et chaque colonne contient au moins un Voltorbe. Les chiffres de ligne et de colonne (total des cartes, nombre de Voltorbes) servent à déduire où sont les bombes, comme dans le jeu d'origine.
- Trois niveaux dans `data/casino-jeux.json` (`voltorbe.niveaux`) : Facile 8 Voltorbes, Moyen 10, Difficile 12 (toujours 4 cartes ×2 ; 2 cartes ×3, 3 au niveau Difficile). Les trois nombres `encaissementPourCent` (80), `bonusDoublePourCent` (25), `bonusTriplePourCent` (50) sont dans le même fichier.
- Pourquoi prudent : un premier essai (cartes qui se multiplient) rendait plus de 200 % à un joueur prudent, ce qui aurait fabriqué des jetons. Avec les valeurs finales, un bot qui retourne la carte la moins risquée et s'arrête à un seuil de risque (20, 30 ou 40 %) rend entre 25 % et 91 % de sa mise (maximum 91 %, niveau Moyen/Difficile) : il perd en moyenne. Le test `voltorbe.test.ts` vérifie ce rendement inférieur à 100 %.
- Limite connue : un joueur parfait, qui exploite les chiffres de ligne et de colonne pour déduire les bombes, fait mieux que ce bot ; je n'ai pas simulé ce niveau d'habileté. Pour durcir : baisser `encaissementPourCent` ou les deux bonus. Les jetons s'achètent en ₽ à un prix qui ne se rachète pas à parité, donc le casino ne crée pas d'argent par cette voie.
- Effet sur l'équilibrage : aucun gain garanti, un jeu de plus qui dépense des jetons. La grille est sauvegardée dans la région : fermer la page ne perd pas la mise, on retrouve la grille avec ses cartes retournées.
- Question : le niveau de risque te convient-il (retenue de 20 %, bonus 25/50 %) ? Faut-il un plafond de mise propre à ce jeu ?

## F-j2-16 Casino : niveau de fidélité (VIP)
- Règle choisie : le total de jetons misés au casino (tous jeux confondus, gagnés ou perdus, compté dans le suivi) fait monter quatre niveaux : Bronze à 2 000 jetons misés, Argent à 20 000, Or à 100 000, Platine à 500 000. Chaque niveau donne une remise sur les prix de la boutique de jetons : 2 %, 4 %, 6 %, 10 %. Le prix remisé est arrondi au jeton supérieur (jamais sous 1). Seuils et remises dans `data/casino-vip.json`.
- Ce qui n'est pas fait, faute de règle dans la proposition : le « jeu exclusif » (je n'invente pas de jeu de plus) et le « cadre de profil » (il dépend de la boutique de skins F-j2-02 ; il sera proposé là, voir sa section).
- Pourquoi prudent : la remise maximale est de 10 %, elle ne touche que la boutique de jetons (pas les gains des jeux), et le seuil Platine demande 500 000 jetons misés, soit des milliers de parties. Les mises comptent même quand elles sont perdues : on ne gagne pas de niveau sans dépenser.
- Effet sur l'équilibrage : un peu plus facile pour les joueurs assidus (Porygon à 5 000 jetons passe à 4 500 en Platine). C'est le seul effet.
- Sauvegarde : champ facultatif `suivi.jetons.mises` (0 pour les anciennes parties, donc elles repartent de zéro au niveau VIP, sans version 7). Le niveau s'affiche dans la salle (carte « Fidélité ») et la boutique rappelle la remise.
- Question : les seuils et remises te conviennent-ils ? Faut-il compter les mises passées d'une partie existante (impossible : elles n'étaient pas enregistrées) ?

## F-j2-23 Ligue+ (mode revanche de plus en plus dur)
- Règle choisie : une fois la Ligue gagnée, la page « Hall des Fameux » propose un rang de Ligue+, de 1 à 10 (« Ligue normale » reste possible). On choisit un rang, puis on refait la Ligue normalement. Chaque rang ajoute 15 % de PV à tous les adversaires, boss compris (rang 10 : 2,5 fois les PV). Les niveaux restent ceux de la Ligue (ils sont déjà au plafond de 100, la proposition parlait de niveaux +10, +20 : impossible sans dépasser 100).
- Un rang n'est proposé que si le précédent a été réussi (rang 1 d'abord, puis le suivant du meilleur rang réussi). Le rang choisi reste actif jusqu'à ce qu'on en choisisse un autre. Changer de rang est refusé pendant qu'on est dans la Ligue.
- Récompense : la première réussite d'un rang rapporte 25 000 ₽ × le rang (25 000 au rang 1, 250 000 au rang 10) ; rejouer un rang déjà réussi ne rapporte rien. Le meilleur rang est un record, affiché dans Statistiques.
- Une victoire en Ligue+ ne passe pas par le Panthéon et ne compte pas comme victoire de Ligue (pas d'entrée au Hall, pas de pas vers le Défi de Chen) ; on revient à Bourg-Palette.
- Valeurs dans `data/ligue-plus.json` : `rangMax` 10, `pvParRangPourCent` 15, `recompenseArgentParRang` 25 000. Pour changer : modifier ces trois nombres.
- Pourquoi prudent : opt-in (la Ligue normale n'est jamais plus dure), récompense en argent une seule fois par rang, au total 1,375 M ₽ sur les 10 rangs. Je n'ai pas simulé la difficulté réelle d'un rang 10 : à tester à la main.
- Effet sur l'équilibrage : un peu plus d'argent au total (1,375 M ₽ au maximum, une fois). Rien d'autre.
- Sauvegarde : champ facultatif `liguePlus` (rang choisi) et record `suivi.records.liguePlusMax`, sans version 7.
- Question : 15 % de PV par rang et 25 000 ₽ par rang te conviennent-ils ? Faut-il aussi des adversaires de niveau plus haut (impossible au-delà de 100) ou de nouveaux Pokémon au rang élevé ?
