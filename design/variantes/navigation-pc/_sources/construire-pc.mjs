// Assemble pc-app.html (la maquette navigable) et index.html (la liste numérotée des écrans).
// Usage : node _sources/construire-pc.mjs   (depuis design/variantes/navigation-pc)
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const src = dirname(fileURLToPath(import.meta.url));
const racine = join(src, "..");
const design = join(racine, "..", "..");
const lire = (p) => readFileSync(p, "utf8");

const tokens = lire(join(design, "tokens.css"));
const regions = lire(join(design, "regions.css")).split("\n").slice(0, 24).join("\n");
const police = (f, poids, ext) => `@font-face { font-family: "Atkinson Hyperlegible Next"; font-weight: ${poids}; font-display: swap; ${ext ? "unicode-range: U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF; " : ""}src: url(data:font/woff2;base64,${readFileSync(join(racine, "fonts", f)).toString("base64")}) format("woff2"); }`;
const fontes = [
  police("atkinson-hyperlegible-next-latin-400-normal-FfmJh7DR.woff2", 400),
  police("atkinson-hyperlegible-next-latin-600-normal-BBuhw47K.woff2", 600),
  police("atkinson-hyperlegible-next-latin-700-normal-Dpiyiu63.woff2", 700),
  police("atkinson-hyperlegible-next-latin-ext-400-normal.woff2", 400, true),
  police("atkinson-hyperlegible-next-latin-ext-700-normal.woff2", 700, true),
].join("\n");
const base = `${tokens}\n${regions}\n${fontes}`;

/* ---------- app ---------- */
const js = ["donnees-pokedex.js", "donnees-guide.js", "pc-donnees.js", "pc-ecrans.js", "pc-compte.js", "pc-app.js"].map((f) => lire(join(src, f))).join("\n;\n");
const css = lire(join(src, "pc.css"));
writeFileSync(join(racine, "pc-app.html"), `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PokiClicker · maquette PC</title>
<style>
${base}
${css}
</style>
</head>
<body>
<div id="racine"></div>
<script>
${js}
</script>
</body>
</html>
`);

/* ---------- index ---------- */
// [id, titre, n° téléphone (ou null), différences avec le téléphone]
const G = [
  ["Coquille et combat", [
    ["combat", "Combat", 1, "Barre latérale à gauche (Combat, Équipe, PC, Shop, Carte, Menu, touches 1 à 6) avec « Menu principal » en bas, au lieu de la barre du bas ; l'équipe passe en colonne à droite de la scène ; légende des raccourcis en pied."],
    ["combat-debloque", "Combat : Fauchage et Poké-Radar débloqués", 2, "Le Fauchage (carré) et le Poké-Radar (rond, bas à droite de la scène) apparaissent ; touches F et P."],
    ["combat-capture", "Combat : capture en cours", null, "Écran propre au PC : même animation de la balle que sur téléphone, plus la touche C."],
    ["combat-capture-reussie", "Combat : capture réussie (pop-up)", null, "Pop-up fixe en haut, centré ; il ne décale jamais la page."],
    ["combat-radar", "Poké-Radar : liste de la zone", null, "Fenêtre centrée au lieu d'une feuille plein écran."],
    ["combat-fauchage", "Combat : Fauchage utilisé", null, "Même effet que sur téléphone, avec la touche F."],
    ["combat-evolution", "Combat : un Pokémon peut évoluer", null, "Cadre jaune clignotant sur sa ligne et pastille sur l'entrée Équipe."],
    ["combat-boss", "Combat : boss avec limite de temps", null, "Barre de temps en bas de la scène, comme sur téléphone."],
    ["combat-fin-zone", "Combat : zone terminée", null, "Annonce centrée en haut de la page, sans décaler le reste."],
    ["combat-arret-auto", "Combat : arrêt auto déclenché", null, "Bandeau dans le bas de la scène avec le bouton Reprendre."],
    ["reglage-auto", "Réglage de l'arrêt auto", 3, "Fenêtre centrée, touche R."],
    ["sac", "Sac", 5, "Fenêtre centrée, touche S ; « Utiliser » ouvre l'Équipe en mode choix."],
    ["dialogue", "Dialogue du Prof. Chen", 4, "Bandeau en bas, Chen à gauche ; bouton Compris au clavier."],
  ]],
  ["Équipe et fiche", [
    ["equipe", "Équipe", 6, "Toujours 3 colonnes sur 2 lignes, de 1024 à 2560 px, portrait à gauche ; pas de défilement vertical pour 6 Pokémon. Plus de ligne PC (le PC a sa propre entrée)."],
    ["equipe-choix", "Équipe : choisir qui reçoit l'objet", 7, "Bandeau Annuler en haut ; Échap annule aussi."],
    ["equipe-fiche", "Fiche d'un Pokémon", 25, "Fenêtre centrée sur 2 colonnes (portrait, détail) au lieu d'une page unique."],
    ["equipe-fiche-evolution", "Fiche : bouton Évoluer", null, "Cadre clignotant sur la fiche puis bouton « Évoluer en … »."],
    ["pc-fiche-dernier", "Fiche du dernier Pokémon de l'équipe", 26, "Envoi au PC et relâcher grisés avec la raison sous les boutons."],
  ]],
  ["PC", [
    ["pc-verrouille", "PC verrouillé", 14, "Même message, affiché par l'entrée PC de la barre."],
    ["pc", "PC (tri par DPS)", 15, "Entrée « PC » de la barre latérale (touche 3). Grille de 6 à 10 colonnes selon la largeur ; recherche au clavier avec /."],
    ["pc-vide", "PC vide", 16, "Même état vide, centré dans la zone."],
    ["pc-recherche", "PC : recherche", 17, "Filtre en direct pendant la frappe."],
    ["pc-sans-resultat", "PC : aucun résultat", 18, "Bouton pour effacer les filtres."],
    ["pc-fiche", "PC : fiche d'un Pokémon", 19, "Même fenêtre que depuis l'Équipe."],
    ["pc-fiche-shiny", "PC : fiche d'un shiny", 20, "Étincelle près du nom et sprite shiny."],
    ["pc-fiche-oeuf", "PC : fiche d'un œuf", 21, "Pas de niveau ni d'XP, pas d'évolution."],
    ["pc-renommer", "PC : renommer", 22, "Champ dans la fiche, validation par Entrée."],
    ["pc-relacher", "PC : relâcher", 23, "Confirmation par-dessus la fiche, Annuler a le focus."],
    ["pc-echange", "PC : échange avec une équipe pleine", 24, "On clique le Pokémon de l'équipe à remplacer."],
  ]],
  ["Shop", [
    ["shop", "Shop : Poké Ball", 8, "Produits en grille de 2 colonnes ; onglets 1-3 au clavier."],
    ["shop-objets", "Shop : Objets", 8, "Idem."],
    ["shop-accessoires", "Shop : Accessoires", 8, "Idem."],
  ]],
  ["Carte", [
    ["carte", "Carte", 9, "Mini-carte à gauche, liste à droite. La zone actuelle clignote en vert (bordure verte fixe si animations réduites) ; aucun sprite sur la carte hors vol. Survoler une ligne allume le cercle, et inversement."],
    ["celadopole", "Céladopole : 3 choix", null, "Fenêtre : Arène, Centre commercial, Casino (« à venir »)."],
    ["vol", "Vol vers une zone (animation)", 10, "Même animation : pose 0,8 s, ouverture, vol 2,5 s, fermeture 0,5 s ; le sprite n'apparaît que pendant ce vol ; sans animation si réduite."],
  ]],
  ["Lieux", [
    ["lieu-bourg", "Bourg Palette", null, "Inchangé : capture du jeu actuel (image mapping, bâtiments cliquables) ; rien n'est redessiné."],
    ["lieu-maman", "Chez Maman (télé : easter egg)", null, "Inchangé : capture du jeu actuel ; la télé (easter egg Daran) reste cliquable."],
    ["lieu-blue", "Chez Blue", null, "Inchangé : voir le jeu actuel (pas de capture, même gabarit que chez Maman)."],
    ["pension", "Pension", null, "Deux emplacements, œuf et reprise."],
    ["commercial", "Centre commercial de Céladopole", null, "Rayons en onglets."],
    ["casino", "Casino : à venir", null, "Carte « à venir » (ticket U)."],
  ]],
  ["Menu et pages", [
    ["menu", "Menu", 11, "8 entrées en grille de 2 colonnes."],
    ["monde", "Monde", null, "Régions : Kanto ouvert, les autres verrouillées."],
    ["reglages", "Réglages", 12, "Deux colonnes : son, jeu."],
    ["pokedex", "Pokédex", 27, "Grille de 151 espèces à gauche, panneau de détail à droite."],
    ["pokedex-recherche", "Pokédex : recherche", 29, "Touche / pour chercher."],
    ["pokedex-a-trouver", "Pokédex : à trouver", 30, "Filtre sur les espèces manquantes."],
    ["pokedex-detail", "Pokédex : fiche d'une espèce", 31, "S'ouvre dans le panneau de droite, sans quitter la grille."],
    ["pokedex-inconnu", "Pokédex : espèce inconnue", 32, "Silhouette et « ??? »."],
    ["pokedex-complet", "Pokédex complet", 33, "Bandeau et accès au diplôme."],
    ["pokedex-diplome", "Diplôme du Pokédex", 34, "Fenêtre large."],
    ["badges", "Badges", 35, "8 badges sur une ligne."],
    ["badges-detail", "Badge obtenu", 36, "Fenêtre centrée."],
    ["badges-detail-manque", "Badge manquant", 37, "Même fenêtre, texte « à obtenir »."],
    ["badges-aucun", "Aucun badge", 38, "Tous grisés."],
    ["badges-tous", "Tous les badges", 39, "Tous en couleur."],
    ["stats", "Statistiques", 40, "Cartes sur 3 colonnes."],
    ["guide", "Guide", 41, "Sommaire à gauche, texte à droite."],
    ["guide-pc", "Guide : section PC", 42, "Même disposition."],
  ]],
  ["Zone compte (hors partie)", [
    ["c-connexion", "Connexion", 43, "Deux colonnes : visuel à gauche, formulaire à droite."],
    ["c-connexion-erreur", "Connexion : erreur", null, "Message d'erreur sous le champ, focus sur le champ."],
    ["c-connexion-session", "Connexion : session expirée", null, "Bandeau d'information."],
    ["c-inscription", "Inscription", 44, "Même disposition que la connexion."],
    ["c-inscription-erreur", "Inscription : erreur", null, "Règles du mot de passe affichées en direct."],
    ["c-oubli", "Mot de passe oublié", 45, "Un seul champ."],
    ["c-oubli-envoye", "Mot de passe oublié : envoyé", null, "Confirmation."],
    ["c-nouveau", "Nouveau mot de passe", null, "Deux champs."],
    ["c-parties", "Mes parties", 46, "Cartes sur 2 à 3 colonnes."],
    ["c-parties-vide", "Mes parties : aucune", 47, "Appel à créer une partie."],
    ["c-parties-hors-ligne", "Mes parties : hors connexion", 48, "Actions réseau grisées."],
    ["c-nouvelle", "Nouvelle partie", null, "Champ nom, validation par Entrée."],
    ["c-renommer", "Renommer une partie", null, "Fenêtre."],
    ["c-supprimer", "Supprimer une partie", null, "Confirmation avec Annuler au focus."],
    ["c-restaurer", "Restaurer une sauvegarde", null, "Choix puis confirmation (2 temps)."],
    ["c-restaurer-confirmer", "Restaurer : confirmation", null, "Avertissement : les autres appareils sont fermés."],
    ["c-ailleurs", "Partie ouverte ailleurs", 49, "Fenêtre : Annuler ou Reprendre ici."],
    ["c-reprise-ailleurs", "Reprise ailleurs : message", 50, "Pop-up fixe."],
    ["c-supprimee", "Partie supprimée ailleurs", 51, "Fenêtre."],
    ["c-compte", "Compte", 52, "Deux colonnes : infos, sécurité."],
    ["c-deconnexion", "Déconnexion avec synchro en cours", 53, "Bouton « Sauvegarder et se déconnecter »."],
    ["c-deconnexion-chargement", "Déconnexion : chargement", 54, "Page de chargement pleine."],
    ["c-deconnexion-echec", "Déconnexion : échec", 55, "Réessayer ou Rester connecté, jamais « se déconnecter quand même »."],
    ["c-reglages", "Réglages depuis le compte", 56, "Même page que les réglages du jeu."],
  ]],
  ["Début de partie", [
    ["titre", "Écran titre", null, "Écran propre au PC."],
    ["intro-maman", "Intro : Maman", null, "Inchangé : capture du jeu actuel."],
    ["intro-bourg", "Intro : Bourg Palette", null, "Inchangé : capture du jeu actuel (image mapping)."],
    ["intro-labo", "Intro : labo du Prof. Chen", null, "Inchangé : capture du jeu actuel (dialogues de Chen)."],
    ["intro-starter", "Intro : choix du starter", null, "Inchangé : capture du jeu actuel (trois balles, choix du starter)."],
  ]],
  ["Transverses", [
    ["notifications", "Notifications (pop-ups)", null, "Empilées en haut, centrées, 3 au plus ; elles ne décalent jamais la page."],
    ["chargement", "Chargement", null, "Page pleine avec barre."],
    ["erreur-reseau", "Erreur réseau", null, "Fenêtre : Réessayer ou continuer hors connexion."],
    ["hors-ligne", "Hors connexion", null, "Point de synchro orange et pop-up."],
    ["easter-daran", "Easter egg : Daran", null, "Un Pokémon surnommé Daran affiche une photo dans le cadre de sa fiche selon son stade."],
    ["easter-gabriel", "Easter egg : Gabriel", null, "Idem, avec Gabriel."],
    ["raccourcis", "Liste des raccourcis clavier", null, "Touche ? ; n'existe pas sur téléphone."],
    ["focus", "Focus clavier visible", null, "Contour jaune de 3 px sur tout élément atteint par Tab."],
  ]],
];
let n = 0;
const items = G.flatMap(([g, l]) => l.map(([id, t, tel, note]) => ({ n: ++n, g, id, t, tel, note })));
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const liste = G.map(([g, l]) => `<section><h2>${esc(g)}</h2><ol>${items.filter((i) => i.g === g).map((i) => `<li><button type="button" data-id="${i.id}"><span class="num">${i.n}</span><span class="txt"><b>${esc(i.t)}</b><small>${i.tel ? `Téléphone : écran n° ${i.tel}` : "Pas d'équivalent téléphone"}</small></span></button></li>`).join("")}</ol></section>`).join("");
const donnees = JSON.stringify(Object.fromEntries(items.map((i) => [i.id, i])));
const idxCss = `
body { margin: 0; display: grid; grid-template-columns: 24rem minmax(0, 1fr); height: 100dvh; background: var(--fond); color: var(--texte); font-family: var(--font-texte); font-size: var(--text-base); line-height: var(--text-base--line-height); }
nav { overflow-y: auto; border-right: var(--trait) solid var(--bordure); padding: calc(var(--u) * 4); background: var(--surface); }
nav h1 { font-size: var(--text-xl); margin: 0 0 var(--u); }
nav p { margin: 0 0 calc(var(--u) * 4); color: var(--texte-doux); font-size: var(--text-sm); }
nav h2 { font-size: var(--text-sm); color: var(--texte-doux); text-transform: uppercase; letter-spacing: .04em; margin: calc(var(--u) * 5) 0 var(--u); }
ol { list-style: none; margin: 0; padding: 0; display: grid; gap: var(--u); }
li button { display: flex; gap: calc(var(--u) * 3); width: 100%; text-align: left; padding: calc(var(--u) * 2) calc(var(--u) * 3); background: var(--surface-2); color: inherit; border: var(--trait) solid var(--bordure); border-radius: 0; font: inherit; cursor: pointer; min-height: 44px; }
li button:hover { border-color: var(--action); }
li button[aria-current="true"] { border-color: var(--region-accent); background: var(--selection); }
.num { flex: none; min-width: 2ch; font-weight: 700; color: var(--region-accent); }
.txt { display: grid; } .txt small { color: var(--texte-doux); font-size: var(--text-sm); }
:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
main { display: flex; flex-direction: column; min-width: 0; min-height: 0; padding: calc(var(--u) * 4); gap: calc(var(--u) * 3); }
header { display: flex; flex-wrap: wrap; align-items: center; gap: calc(var(--u) * 3); }
header h2 { margin: 0; font-size: var(--text-xl); flex: 1; min-width: 12rem; }
.tailles { display: flex; gap: var(--u); }
.tailles button, header a { padding: calc(var(--u) * 2) calc(var(--u) * 3); background: var(--surface-2); color: var(--texte); border: var(--trait) solid var(--bordure); border-radius: 0; font: inherit; cursor: pointer; text-decoration: none; min-height: 40px; display: inline-flex; align-items: center; }
.tailles button[aria-pressed="true"] { border-color: var(--region-accent); background: var(--selection); }
#note { margin: 0; padding: calc(var(--u) * 3) calc(var(--u) * 4); background: var(--surface); border: var(--trait) solid var(--bordure); }
#note b { color: var(--region-accent); }
#cadre { flex: 1; min-height: 0; overflow: hidden; position: relative; border: var(--trait) solid var(--bordure); background: var(--surface-2); }
#cadre iframe { position: absolute; left: 0; top: 0; border: 0; transform-origin: 0 0; background: var(--fond); }
@media (max-width: 900px) { body { grid-template-columns: 1fr; height: auto; } nav { max-height: 40vh; } main { min-height: 70vh; } }
`;
writeFileSync(join(racine, "index.html"), `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PokiClicker · maquettes PC</title>
<style>
${base}
${idxCss}
</style>
</head>
<body>
<nav aria-label="Écrans"><h1>Maquettes PC</h1><p>${n} écrans. Clique un écran, ou utilise les flèches haut et bas. « Équivalent téléphone » renvoie aux numéros de la liste de navigation-telephone/a5-index.html.</p>${liste}</nav>
<main>
<header><h2 id="titre"></h2><div class="tailles" role="group" aria-label="Largeur de la fenêtre simulée"></div><a id="ouvrir" href="pc-app.html" target="_blank" rel="noopener">Ouvrir seul</a></header>
<p id="note"></p>
<div id="cadre"><iframe id="vue" title="Aperçu de la maquette" src="about:blank"></iframe></div>
</main>
<script>
const ECR = ${donnees};
const TAILLES = [[1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440]];
let taille = 2, courant = "combat";
const $ = (s) => document.querySelector(s);
$(".tailles").innerHTML = TAILLES.map((t, i) => '<button type="button" data-t="' + i + '" aria-pressed="false">' + t[0] + ' × ' + t[1] + '</button>').join("");
function ajuster() {
  const [w, h] = TAILLES[taille], c = $("#cadre"), v = $("#vue"), k = Math.min(c.clientWidth / w, c.clientHeight / h, 1);
  v.style.width = w + "px"; v.style.height = h + "px"; v.style.transform = "scale(" + k + ")";
  document.querySelectorAll(".tailles button").forEach((b, i) => b.setAttribute("aria-pressed", String(i === taille)));
}
function montrer(id) {
  const e = ECR[id]; if (!e) return; courant = id;
  $("#titre").textContent = e.n + ". " + e.t;
  $("#note").innerHTML = "<b>Équivalent téléphone :</b> " + (e.tel ? "écran n° " + e.tel : "aucun") + "<br><b>Différences avec le téléphone :</b> " + e.note;
  $("#ouvrir").href = "pc-app.html#" + id;
  $("#vue").src = "pc-app.html#" + id;
  document.querySelectorAll("li button").forEach((b) => b.setAttribute("aria-current", String(b.dataset.id === id)));
  history.replaceState(null, "", "#" + id);
  const b = document.querySelector('li button[data-id="' + id + '"]'); if (b) b.scrollIntoView({ block: "nearest" });
}
document.addEventListener("click", (e) => {
  const b = e.target.closest("li button"); if (b) montrer(b.dataset.id);
  const t = e.target.closest(".tailles button"); if (t) { taille = Number(t.dataset.t); ajuster(); }
});
document.addEventListener("keydown", (e) => {
  if (e.target.closest && e.target.closest("iframe")) return;
  if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
  const ids = Object.keys(ECR), i = ids.indexOf(courant) + (e.key === "ArrowDown" ? 1 : -1);
  if (ids[i]) { e.preventDefault(); montrer(ids[i]); }
});
addEventListener("resize", ajuster);
ajuster(); montrer(ECR[location.hash.slice(1)] ? location.hash.slice(1) : "combat");
</script>
</body>
</html>
`);
console.log(`ok : ${n} écrans`);
