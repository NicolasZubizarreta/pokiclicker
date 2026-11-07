# Maquettes PC de PokiClicker v2

Version ordinateur (1024 px et plus, souris et clavier), développée à partir de la maquette téléphone (`../navigation-telephone/`). Une seule proposition de style : la charte actuelle (`design/tokens.css`, bloc Kanto de `design/regions.css`), thème sombre.

## Ouvrir

- `index.html` : liste numérotée des 97 écrans, en 10 groupes. Pour chaque écran : l'écran équivalent sur téléphone et ce qui change sur PC. Un clic ouvre l'écran dans l'application.
- `pc-app.html` : l'application navigable (données de Kanto plausibles). Le fragment d'URL choisit l'écran de départ (`pc-app.html#combat-radar`). Un double-clic suffit, rien n'est chargé depuis l'extérieur.

## Coquille

- Barre latérale gauche de 15 rem : Combat, Équipe, Shop, Carte, Menu (touches 1 à 5), nom et état de synchro de la partie en bas.
- Bandeau haut fixe : Pokédollars, DPS, zone ; à droite, synchro et bouton Raccourcis.
- Légende des raccourcis en pied de page (courte ; liste complète sur `?`).
- Combat : scène à gauche (cliquable, Espace ou Entrée), équipe et effets actifs à droite. Sous 1400 px, les quatre boutons passent en 2 × 2.
- Notifications : pop-ups fixes en bas à droite, qui ne déplacent jamais la page.
- De 1024 à 2560 px : la scène et les colonnes s'étirent, les listes défilent dans leur cadre, la page ne défile jamais.

## Raccourcis (à valider)

Espace / Entrée attaquer · C capturer · B balle · A attaque auto · T arrêt auto · R réglage · S sac · F fauchage · P Poké-Radar · flèches gauche/droite zone · 1 à 5 onglets · `/` recherche (PC, Pokédex) · `?` liste · Échap ferme · Tab reste dans les fenêtres. Ignorés dans les champs de saisie. Le focus est visible partout (cadre jaune). Rien n'est imposé au téléphone.

## Reconstruire

```
node design/variantes/navigation-pc/_sources/construire-pc.mjs
node design/variantes/navigation-pc/_sources/controle-pc.mjs <dossier> [1280x800,1440x900,...] [ids]
```

`controle-pc.mjs` ouvre chaque écran à chaque taille, capture et signale les débordements, textes coupés, images hors cadre, requêtes externes. Sources dans `_sources/` (`pc-donnees.js`, `pc-ecrans.js`, `pc-compte.js`, `pc-app.js`, `pc.css`).

## Choix à trancher par Nicolas

1. Navigation : barre latérale gauche (proposée) ou barre du haut.
2. Centre Pokémon : absent des données du jeu, écran proposé (équipe soignée en un bouton). À garder ou retirer.
3. Pension et lieux (Maman, Blue) : accessibles depuis Bourg Palette sur la carte.
4. Liste des raccourcis ci-dessus.
5. Fiche Pokémon : fenêtre (proposée) ou panneau latéral.
6. Notifications : bas droite sur PC (proposé) ; sur téléphone elles restent en haut.

Hors périmètre : casino (carte « à venir », ticket U), tout code de jeu, `src/`.
