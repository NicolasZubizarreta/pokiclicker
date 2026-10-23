# Poki-Clicker: Kanto Origins

## Présentation
Poki-Clicker est un clicker Pokémon solo en HTML/CSS/JS sans build. Le jeu tourne directement dans le navigateur et conserve une architecture modulaire.

## Fonctionnalités
- Combat automatique / clic, captures, équipe/PC, évolution
- 21 zones avec boss + zones spéciales (Labo, Panthéon, Pension)
- Systèmes : badges, milestones, objets, shop, radar, daycare
- Sauvegarde locale + export/import JSON
- Easter eggs et mode cheat (pour tests)

## Lancer le jeu
1. Ouvrir `index.html` dans un navigateur moderne.
2. La sauvegarde est stockée en `localStorage`.

> Astuce : si ton navigateur bloque certains assets/audio en local, ouvre un petit serveur local.

## Sauvegarde
- Export : bouton « SAUVER » (JSON)
- Import : « Importer une sauvegarde » depuis l’écran de démarrage

## Arborescence
```
css/
  styles.css
img/
  kanto/
    background/
    badges/
    sprites/
    icones/
js/
  app/
    main.js
  data/
    constants.js
  regions/
    kanto.js
    johto.js
  game/
    combat.js
    capture.js
    cheats.js
    daycare.js
    evolution.js
    items.js
    loop.js
    save.js
    shop.js
    sprites.js
    stats.js
    team.js
  ui/
    controls.js
    item-info.js
    johto.js
    mobile.js
    pantheon.js
    render.js
    summary.js
    update.js
    victory.js
index.html
```

## Régions
- Kanto est complète dans `js/regions/kanto.js`.
- Johto est prévue (structure en place) mais vide pour l’instant.

## Notes techniques
- Pas de bundler : scripts chargés dans `index.html`.
- Les textes et ressources sont en UTF-8.
- Les images ont été regroupées par région `img/kanto/`.

## Contribution rapide
- Les données (items, stats, dialogues) : `js/data/constants.js`
- Les zones et spawns : `js/regions/kanto.js`
- Le jeu (combat/capture/équipe) : `js/game/*`
- L’UI (rendu et contrôles) : `js/ui/*`
