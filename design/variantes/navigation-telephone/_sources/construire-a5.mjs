// Assemble a5-app.html (toutes les pages A5 dans un seul fichier) et a5-index.html (accueil A5).
// Usage : node design/variantes/navigation-telephone/_sources/construire-a5.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const sortie = join(ici, "..");
const lire = (f) => readFileSync(join(ici, f), "utf8");
const tokens = readFileSync(join(ici, "../../../tokens.css"), "utf8");
/* Polices : seulement Atkinson Hyperlegible Next (A5 n'embarque plus Rubik ni Nunito) */
const polices = lire("polices.css").split("\n").filter((l) => !/"Rubik"|"Nunito"/.test(l)).join("\n");

const app = `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PokiClicker : A5</title>
<style>
${tokens}
${lire("commun.css")}
${lire("variante-a.css")}
${polices}
${lire("a2.css")}
${lire("a4.css")}
${lire("a4-ecrans.css")}
${lire("a5.css")}
</style>
</head>
<body>
<div class="tel" id="tel"><header id="cles"></header><main class="ecran" id="ecran"></main><nav class="barre" id="barre" aria-label="Navigation principale"></nav><div id="couches"></div></div>
<script>
${lire("commun.js")}
${lire("donnees-pokedex.js")}
${lire("donnees-guide.js")}
${lire("a5-ecrans.js")}
${lire("a4-compte.js")}
${lire("a5.js")}
</script>
</body>
</html>
`;
writeFileSync(join(sortie, "a5-app.html"), app);
console.log("a5-app.html", app.length);

const jeu = [
  ["Combat", "combat", "Seul écran qui garde la ligne précédent / suivant, points et 1/10 (navigation entre zones)."],
  ["Combat, Fauchage et Poké-Radar débloqués", "combat-debloque", "Inchangé."],
  ["Fenêtre de réglage de l'arrêt auto", "reglage-auto", "Il ne reste que les sept raisons d'arrêt. L'interrupteur de l'auto-clic est parti dans Menu, Réglages."],
  ["Fenêtre de dialogue", "dialogue", "Inchangée."],
  ["Sac", "sac", "Inchangé."],
  ["Équipe", "equipe", "Bandeau du haut réduit à Pokédollars, DPS, Zone. Les Pokémon s'ouvrent sur leur fiche."],
  ["Équipe, choix d'un Pokémon", "equipe-choix", "Inchangée."],
  ["Shop", "shop", "Inchangé."],
  ["Carte", "carte", "Inchangée."],
  ["Carte, vol vers une zone", "vol", "Inchangé."],
  ["Menu de jeu", "menu", "Pokédex, Badges, Statistiques, Guide du jeu, Réglages, Menu principal. Un bouton Maquette montre l'écran vu sur l'autre appareil quand on reprend la partie."],
  ["Réglages", "reglages", "Musique, effets sonores, auto-clic lié à l'attaque auto (activé de base), thème."],
];
const pc = [
  ["Équipe, PC débloqué", "equipe-pc", "La ligne « PC de Léo » (compteur de Pokémon rangés) sous les six Pokémon : c'est l'accès."],
  ["PC verrouillé", "pc-verrouille", "Cadenas et texte du jeu : « Le PC de Léo s'ouvre à l'Arène d'Argenta. » Un bouton Maquette le débloque."],
  ["PC", "pc", "12 Pokémon : recherche, liste de tri (DPS du plus grand au plus petit par défaut, le DPS s'affiche sur chaque carte), trois filtres, grille de deux colonnes."],
  ["PC vide", "pc-vide", "« Ton PC est vide. Capture des Pokémon pour les ranger ici. »"],
  ["PC, recherche", "pc-recherche", "Recherche « ra » : le surnom et le nom d'espèce comptent."],
  ["PC, aucun résultat", "pc-sans-resultat", "Message du jeu et bouton pour effacer."],
  ["Fiche d'un Pokémon du PC", "pc-fiche", "Pastilles de même hauteur (sexe plus grand, Favori, types aux couleurs du jeu), XP, DPS et son détail, évolution, bonheur, calcium. Placer dans l'équipe, Relâcher."],
  ["Fiche d'un Pokémon shiny", "pc-fiche-shiny", "Halo et étiquette Shiny, multiplicateur ×2 dans le DPS."],
  ["Fiche d'un œuf", "pc-fiche-oeuf", "Éclosion 4/10, pas de niveau, d'XP ni de surnom."],
  ["Renommer", "pc-renommer", "Surnom de 1 à 12 caractères, compteur, Valider et Annuler."],
  ["Relâcher, confirmation", "pc-relacher", "« Veux-tu vraiment relâcher … ? » Annuler (par défaut) et Relâche définitivement."],
  ["Échange avec l'équipe pleine", "pc-echange", "Équipe de six : « Choisis le Pokémon à remplacer par … ». Toucher un Pokémon fait l'échange."],
  ["Fiche d'un Pokémon de l'équipe", "equipe-fiche", "Même fiche, bouton « Envoyer au PC »."],
  ["Dernier Pokémon de l'équipe", "pc-fiche-dernier", "Envoi et relâchement désactivés avec la raison écrite."],
];
const dex = [
  ["Pokédex", "pokedex", "47 sur 151, barre de progression, prochain palier, paliers repliés, recherche, trois filtres, grille de 151 cases (silhouette pour les inconnus)."],
  ["Pokédex, paliers ouverts", "pokedex-paliers", "Les dix paliers du jeu, reçus ou à venir."],
  ["Pokédex, recherche", "pokedex-recherche", "Recherche « pi » : seules les espèces capturées se trouvent par leur nom."],
  ["Pokédex, à trouver", "pokedex-a-trouver", "Filtre sur les espèces non capturées."],
  ["Détail d'une espèce capturée", "pokedex-detail", "Sprite, types, « Déjà capturé », où elle se trouve."],
  ["Détail d'une espèce inconnue", "pokedex-inconnu", "Silhouette et invitation à la capturer."],
  ["Pokédex complet", "pokedex-complet", "« Pokédex complet ! » et ligne « Diplôme du Pokédex »."],
  ["Diplôme du Pokédex", "pokedex-diplome", "Image du diplôme du jeu, nom du joueur, date, Imprimer."],
];
const bad = [
  ["Badges", "badges", "Huit badges en deux colonnes : obtenu (couleur, effet) ou silhouette avec l'arène à battre."],
  ["Détail d'un badge obtenu", "badges-detail", "Effet, arène, champion."],
  ["Détail d'un badge à gagner", "badges-detail-manque", "Silhouette, « Pas encore obtenu », où le gagner."],
  ["Aucun badge", "badges-aucun", "« Aucun badge obtenu. Bats les champions d'arène ! »"],
  ["Huit badges", "badges-tous", "Collection complète."],
];
const aide = [
  ["Statistiques", "stats", "Les sept statistiques du jeu : vaincus, argent total, dégâts clic, DPS équipe, gains d'argent, gains d'XP, taux de capture."],
  ["Guide du jeu", "guide", "Les onze sections du guide du jeu, une seule ouverte à la fois."],
  ["Guide, section PC", "guide-pc", "Texte du guide sur le PC."],
];
const compte = [
  ["Connexion", "c-connexion", "Inchangée."],
  ["Créer un compte", "c-inscription", "Inchangé."],
  ["Mot de passe oublié", "c-oubli", "Inchangé."],
  ["Mes parties", "c-parties", "Une carte par partie : à jour, ouverte ailleurs, supprimée ailleurs. Plus aucune mention de version."],
  ["Mes parties, première partie", "c-parties-vide", "Inchangé."],
  ["Mes parties, hors connexion", "c-parties-hors-ligne", "Inchangé."],
  ["Partie ouverte ailleurs", "c-ailleurs", "Dit clairement : la partie se ferme sur l'autre appareil, et on repart exactement là où elle en était."],
  ["Notification sur l'autre appareil", "c-reprise-ailleurs", "Ce que voit l'appareil qu'on a fermé : « Partie reprise ailleurs »."],
  ["Partie supprimée ailleurs", "c-supprimee", "La garder ou l'abandonner."],
  ["Mon compte", "c-compte", "Inchangé."],
  ["Déconnexion avec synchro en attente", "c-deconnexion", "« Sauvegarder et se déconnecter » (principal) et « Rester connecté »."],
  ["Déconnexion, sauvegarde en cours", "c-deconnexion-chargement", "Page de chargement plein écran, puis déconnexion à la fin (2,6 s en maquette)."],
  ["Déconnexion, échec de la sauvegarde", "c-deconnexion-echec", "Réessayer ou rester connecté. Pas de « se déconnecter quand même »."],
  ["Réglages du compte", "c-reglages", "Mêmes réglages que dans le jeu, auto-clic compris."],
];
const css = lire("commun.css") + `
.accueil { max-width: calc(var(--u) * 240); margin: 0 auto; padding: calc(var(--u) * 4); display: grid; gap: calc(var(--u) * 4); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 48rem) { .accueil { grid-template-columns: minmax(0, 1fr) var(--breakpoint-sm); align-items: start; } }
.accueil h1 { font-family: var(--font-titre); font-weight: 700; font-size: var(--text-2xl); line-height: var(--text-2xl--line-height); }
.accueil h2.groupe { font-family: var(--font-titre); font-weight: 700; font-size: var(--text-xl); line-height: var(--text-xl--line-height); margin-top: calc(var(--u) * 3); }
.accueil .liste { gap: calc(var(--u) * 3); }
.carte-v { padding: calc(var(--u) * 3) calc(var(--u) * 4); display: grid; gap: var(--u); text-decoration: none; color: var(--texte); }
.carte-v h3 { font-family: var(--font-titre); font-weight: 700; font-size: var(--text-lg); line-height: var(--text-lg--line-height); color: var(--region-accent); }
.apercu { display: none; }
@media (min-width: 48rem) { .apercu { display: block; position: sticky; top: calc(var(--u) * 4); width: var(--breakpoint-sm); height: calc(100dvh - var(--u) * 8); border: var(--trait) solid var(--bordure); background: var(--fond); } }
:root { --font-titre: "Atkinson Hyperlegible Next", "Atkinson Hyperlegible", system-ui, sans-serif; }
`;
const bloc = (liste) => liste.map(([t, h, p]) => `    <a class="carte-v cadre" href="a5-app.html#${h}" target="_top" data-apercu="a5-app.html#${h}"><h3>${t}</h3><span>${p}</span></a>`).join("\n");
const index = `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PokiClicker : A5</title>
<style>
${tokens}
${css}
${polices}
body { background: var(--fond); }
</style>
</head>
<body>
<div class="accueil">
  <div class="liste">
    <h1>A5 : A4 corrigée (bandeau, tri DPS, fiche)</h1>
    <p class="doux">Les corrections du retour de Nicolas sur A3, puis les nouveaux écrans. Chaque entrée ouvre l'écran de départ, ensuite on navigue librement. Contenu fictif ; les textes viennent du jeu actuel (src/ui, data/).</p>
    <h2 class="groupe">Le jeu, corrigé</h2>
${bloc(jeu)}
    <h2 class="groupe">PC (stockage des Pokémon) et fiche d'un Pokémon</h2>
${bloc(pc)}
    <h2 class="groupe">Pokédex</h2>
${bloc(dex)}
    <h2 class="groupe">Badges</h2>
${bloc(bad)}
    <h2 class="groupe">Statistiques et Guide</h2>
${bloc(aide)}
    <h2 class="groupe">La zone compte</h2>
${bloc(compte)}
  </div>
  <iframe class="apercu" name="apercu" title="Aperçu de A5" src="a5-app.html#combat"></iframe>
</div>
<script>
if (matchMedia("(min-width: 48rem)").matches) document.querySelectorAll("[data-apercu]").forEach((a) => { a.target = "apercu"; });
</script>
</body>
</html>
`;
writeFileSync(join(sortie, "a5-index.html"), index);
console.log("a5-index.html", index.length);
