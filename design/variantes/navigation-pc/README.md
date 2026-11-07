# Maquettes PC de PokiClicker v2

Version ordinateur (1024 px et plus, souris et clavier), dÃ©veloppÃ©e Ã  partir de la maquette tÃ©lÃ©phone (`../navigation-telephone/`). Une seule proposition de style : la charte actuelle (`design/tokens.css`, bloc Kanto de `design/regions.css`), thÃ¨me sombre.

## Ouvrir

- `index.html` : liste numÃ©rotÃ©e des 96 Ã©crans, en 10 groupes. Pour chaque Ã©cran : l'Ã©cran Ã©quivalent sur tÃ©lÃ©phone et ce qui change sur PC. Un clic ouvre l'Ã©cran dans l'application.
- `pc-app.html` : l'application navigable (donnÃ©es de Kanto plausibles). Le fragment d'URL choisit l'Ã©cran de dÃ©part (`pc-app.html#combat-radar`). Un double-clic suffit, rien n'est chargÃ© depuis l'extÃ©rieur.

## Coquille

- Barre latÃ©rale gauche de 15 rem : Combat, Ã‰quipe, PC, Shop, Carte, Menu (touches 1 Ã  6) ; en bas, nom et Ã©tat de synchro de la partie, puis le bouton Â« Menu principal Â» (sauvegarde, retour Ã  Mes parties).
- Bandeau haut fixe : PokÃ©dollars, DPS, zone ; Ã  droite, synchro et bouton Raccourcis.
- LÃ©gende des raccourcis en pied de page (courte ; liste complÃ¨te sur `?`).
- Combat : scÃ¨ne Ã  gauche (cliquable, Espace ou EntrÃ©e), Ã©quipe et effets actifs Ã  droite. Sous 1400 px, les quatre boutons passent en 2 Ã— 2.
- Ã‰quipe : toujours 3 colonnes Ã— 2 lignes, de 1024 Ã  2560 px.
- Sprites : aucun fond ni cadre carrÃ©, easter eggs compris.
- Carte : la zone actuelle clignote en vert, le sprite du personnage n'apparaÃ®t que pendant le vol.
- Bourg Palette, Chez Maman, labo du Prof. Chen, choix du starter : **inchangÃ©s**, affichÃ©s par des captures du jeu actuel (`img/jeu-actuel/`) ; seuls les boutons Â« Maquette Â» servent Ã  naviguer.
- Notifications : pop-ups fixes en bas Ã  droite, qui ne dÃ©placent jamais la page.
- De 1024 Ã  2560 px : la scÃ¨ne et les colonnes s'Ã©tirent, les listes dÃ©filent dans leur cadre, la page ne dÃ©file jamais.

## Raccourcis (Ã  valider)

Espace / EntrÃ©e attaquer Â· C capturer Â· B balle Â· A attaque auto Â· T arrÃªt auto Â· R rÃ©glage Â· S sac Â· F fauchage Â· P PokÃ©-Radar Â· flÃ¨ches gauche/droite zone Â· 1 Ã  6 onglets Â· `/` recherche (PC, PokÃ©dex) Â· `?` liste Â· Ã‰chap ferme Â· Tab reste dans les fenÃªtres. IgnorÃ©s dans les champs de saisie. Le focus est visible partout (cadre jaune). Rien n'est imposÃ© au tÃ©lÃ©phone.

## Reconstruire

```
node design/variantes/navigation-pc/_sources/construire-pc.mjs
node design/variantes/navigation-pc/_sources/controle-pc.mjs <dossier> [1280x800,1440x900,...] [ids]
```

`controle-pc.mjs` ouvre chaque Ã©cran Ã  chaque taille, capture et signale les dÃ©bordements, textes coupÃ©s, images hors cadre, requÃªtes externes. Sources dans `_sources/` (`pc-donnees.js`, `pc-ecrans.js`, `pc-compte.js`, `pc-app.js`, `pc.css`).

## DÃ©cisions de Nicolas (07/11)
1. Barre latÃ©rale gauche : gardÃ©e, avec l'entrÃ©e PC et le bouton Menu principal.
2. Centre PokÃ©mon : retirÃ© (pas de PV dans le jeu).
3. Pension, Maman, Blue, labo : accessibles depuis Bourg Palette par l'image mapping actuel, rien ne change.
4. Raccourcis : validÃ©s (6 onglets au clavier).
5. Fiche PokÃ©mon : fenÃªtre.
6. Notifications : bas droite sur PC.

Rien de bloquant Ã  trancher. Ã€ l'implÃ©mentation : le bouton Menu principal sauvegarde et synchronise avant de quitter la partie.

Hors pÃ©rimÃ¨tre : casino (carte Â« Ã  venir Â», ticket U), tout code de jeu, `src/`.
