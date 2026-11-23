# Questions ouvertes, ticket F vague 1 (23/11/2026)

Rien de ce qui suit ne change une rÃ¨gle de jeu. Ce sont des points oÃ¹ le code a dÃ» choisir quelque chose que la proposition retenue ne disait pas.

## Titres de dresseur (F-j2-35) : seuils Ã  valider
Les titres sont cosmÃ©tiques (aucun avantage). Les seuils viennent de `data/titres.json` et se changent lÃ  sans toucher au code.

| Titre | Condition choisie |
|---|---|
| Dresseur | toujours disponible |
| Collectionneur | 50 espÃ¨ces capturÃ©es |
| PokÃ©dex complet | 151 espÃ¨ces |
| MaÃ®tre des Å“ufs | 25 Å“ufs Ã©clos |
| Ã‰volutionniste | 25 Ã©volutions |
| Chasseur de chromatiques | 1 capture shiny |
| Champion de la Ligue | 1 victoire Ã  la Ligue |
| Roi du casino | 10 000 jetons gagnÃ©s |
| Marathonien | 20 h de jeu |
| Dompteur de boss | 8 boss vaincus |

Question : ces dix titres et ces seuils te conviennent-ils, ou en veux-tu d'autres ?

## Cas non couverts
- Les compteurs (captures, Ã©volutions, dÃ©penses, records, rencontres par espÃ¨ce) dÃ©marrent Ã  zÃ©ro pour les parties existantes : la sauvegarde passe en version 6 sans reconstituer le passÃ©. Un joueur dÃ©jÃ  avancÃ© verra Â« 0 Â» partout au dÃ©but, sauf le PokÃ©dex et le temps de jeu qui existaient dÃ©jÃ .
- Hall des Fameux : seules les victoires Ã  la Ligue obtenues aprÃ¨s cette version y apparaissent. Les victoires anciennes ne sont pas retrouvables. Le menu Â« Hall des Fameux Â» n'apparaÃ®t qu'aprÃ¨s la premiÃ¨re nouvelle victoire.
- Ã‰quipes enregistrÃ©es : un PokÃ©mon enregistrÃ© puis relÃ¢chÃ© ou envoyÃ© Ã  la Pension est ignorÃ© Ã  l'application, avec un message. Les Å“ufs de l'Ã©quipe restent Ã  leur place. Pas de rÃ¨gle pour Â« Ã©quipe qui dÃ©passe 6 Â» : les PokÃ©mon en trop vont au PC.
- Plus ou moins (casino) : une Â« partie Â» compte une carte jouÃ©e, pas une sÃ©rie complÃ¨te. Si tu prÃ©fÃ¨res une sÃ©rie entiÃ¨re, c'est un changement de suivi Ã  demander.
- Mannequin : le combat est en pause pendant les 30 s et rien ne compte pour la progression. Le DPS affichÃ© ne compte que les dÃ©gÃ¢ts automatiques de l'Ã©quipe et tes clics, sans bonus de zone.
- AperÃ§u du boss : le temps estimÃ© pour vaincre le boss utilise le DPS automatique seul, sans les clics ; il peut donc Ãªtre pessimiste pour un joueur qui clique beaucoup.
- Cadence maximale : mesurÃ©e sur la fenÃªtre glissante du limiteur de clics existant, donc plafonnÃ©e par ce limiteur.

## RÃ¨gles refusÃ©es ou laissÃ©es de cÃ´tÃ©
- Aucun gain n'est donnÃ© par le code Konami, Missingno, les titres ni la carte de dresseur (pur cosmÃ©tique).
- Pas de classement en ligne ni de partage automatique : la carte de dresseur se copie ou se tÃ©lÃ©charge en image, rien n'est envoyÃ©.
- Les 14 autres fonctionnalitÃ©s du ticket F (succÃ¨s, quÃªtes, prestige, Safari, Voltorbe Flip, etc.) sont pour la vague 2.

## Ã€ vÃ©rifier Ã  l'Ã©cran par Nicolas
Scores du casino, page CrÃ©dits (section Â« Ta partie Â»), Hall des Fameux (aprÃ¨s une victoire Ã  la Ligue), astuces sous le rond de chargement, invitation d'installation (Chrome et Safari iPhone), Missingno (renommer un PokÃ©mon), code Konami sur l'Ã©cran de combat, vibration et titre d'onglet Ã  l'arrÃªt auto.

---

# Vague 2 (ticket F, 23/11/2026) : dÃ©cisions de rÃ¨gle Ã  valider

Chaque valeur citÃ©e vit dans un fichier de `data/` et se change lÃ  sans toucher au code. Rien n'a Ã©tÃ© validÃ© par Nicolas : ce sont les valeurs les plus prudentes choisies pour ne pas bloquer. Aucune ne rend le jeu plus facile, sauf lÃ  oÃ¹ c'est Ã©crit.

## F-j1-01 SuccÃ¨s (25 de plus, 32 au total)
- Mesures nouvelles lues dans le suivi : captures, captures chromatiques, Ã©volutions, zones finies (boss vaincus), argent total gagnÃ©, jetons gagnÃ©s, niveau maximal, victoires Ã  la Ligue, meilleure sÃ©rie de victoires, parties de casino, lignÃ©es complÃ¨tes. Tout est dans `data/succes.json` (seuil et diamants de chaque succÃ¨s).
- Diamants versÃ©s : de 5 Ã  100 par succÃ¨s, 25 nouveaux succÃ¨s pour 770 diamants. Les diamants n'achÃ¨tent que des cosmÃ©tiques (boutique de skins, F-j2-02) : aucun effet sur le rythme du jeu.
- Pas de succÃ¨s sur les Â« clics totaux Â» : compter chaque clic obligerait Ã  rÃ©Ã©crire la sauvegarde Ã  chaque clic. Ã€ dÃ©cider avec la refonte de la sauvegarde.
- Les compteurs de suivi dÃ©marrent Ã  zÃ©ro pour les parties existantes (dÃ©jÃ  notÃ© en vague 1) : les succÃ¨s Â« captures Â», Â« Ã©volutions Â», Â« jetons Â», Â« victoires de Ligue Â» s'obtiennent depuis la vague 1, pas depuis le dÃ©but de la partie. Â« Zones finies Â», Â« argent total Â», Â« niveau max Â» et Â« lignÃ©es Â» se lisent sur la partie telle qu'elle est et peuvent tomber d'un coup.
- Question : ces seuils et ces diamants te conviennent-ils ?