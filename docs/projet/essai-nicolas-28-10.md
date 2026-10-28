# Essai de Nicolas, patch 1 (28/10/2026) : de l'écran titre à la Route 1

Notes brutes de Nicolas (écran large, jeu complet), à ne pas réduire :

- Les cases vertes de sortie sont trop grandes : elles doivent faire la taille du tapis (son image mapping), être transparentes, avec un curseur main. Agrandir l'image, la zone est trop petite, trop de vide autour.
- Kanto : pareil. L'image mapping des portes et du pont vers Johto est bien (réduire un peu la transparence, on ne voit pas assez). La case verte du labo est énorme, mal placée, pas transparente.
- Labo : le sprite de Chen est trop petit et trop collé au texte, il passe sous la notification « +5 Pokéballs ». Le mettre plus au centre de l'écran.
- Choix du partenaire : Chen est au centre, c'est bien, mais plus gros. Au survol d'un Pokémon on voit la Poké Ball dessous : elle doit disparaître.
- Sortie du labo : même défaut (case verte trop grosse, pas transparente, mal placée).
- Pas de son sur toute la première partie à Kanto, il commence à la sortie du labo : ajouter une bande son de début.
- Zone de Kanto un peu petite (peut-être l'écran), trop de vide autour.
- Carte : parfait. Le modal de zone reste au clic sur « Y aller » et l'animation passe dessous : il doit se fermer.

## Traitement

| Point | Fait | Où |
|---|---|---|
| Zones de sortie à la taille du tapis, transparentes, curseur main | oui | `SceneLieu.tsx`, `forme-scene` dans `index.css` (cause : contour de 1 unité du viewBox, soit ~50 px, et remplissage opaque dans le clignotement) |
| Zones des portes et du pont moins transparentes | oui | gris 70 %, rouge et bleu 45 % |
| Scènes plus grandes | oui | chez Maman et chez Blue (16/9) limitées par la hauteur de l'écran ; Bourg Palette dans le jeu passe de 398 à 495 px à 915 px de haut. Les scènes carrées (labo, Bourg Palette de l'intro) restent bornées par la hauteur de l'écran |
| Chen plus gros, centré, sous l'annonce | oui | `DialogueIntro.tsx`, `PageIntro.tsx` |
| Balle effacée au survol | oui | `ChoixStarter.tsx` |
| Modal de zone fermé au clic sur « Y aller » | oui | `CarteKanto.tsx` (le bouton Centre commercial garde la fiche : le focus y revient au retour) |
| Bande son d'intro | provisoire | `data/musiques.json` : scène `intro` = piste `carte` (Stage Select). À remplacer si Nicolas veut une autre piste |
