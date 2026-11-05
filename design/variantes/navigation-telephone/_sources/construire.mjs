// Assemble variante-a.html … variante-d.html : tokens.css + commun.css + CSS de la variante + corps + scripts, en un seul fichier.
// Usage : node design/variantes/navigation-telephone/_sources/construire.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ici = dirname(fileURLToPath(import.meta.url));
const sortie = join(ici, "..");
const lire = (f) => readFileSync(join(ici, f), "utf8");
const tokens = readFileSync(join(ici, "../../../tokens.css"), "utf8");

const variantes = {
  a: { titre: "Barre à cinq", corps: `<header id="cles"></header><main class="ecran" id="ecran"></main><nav class="barre" id="barre" aria-label="Navigation principale"></nav>` },
  b: { titre: "Barre dévoilée", corps: `<header id="cles"></header><main class="ecran" id="ecran"></main><nav class="barre" id="barre" aria-label="Navigation principale"></nav>` },
  c: { titre: "Fenêtres", corps: `<header id="cles"></header><main class="ecran" id="ecran"></main><div class="bas" id="bas"></div>` },
  d: { titre: "Bouton du pouce", corps: `<header id="cles"></header><main class="ecran" id="ecran"></main><div class="bas" id="bas"></div>` },
};

for (const [k, v] of Object.entries(variantes)) {
  const css = lire("commun.css") + "\n" + lire(`variante-${k}.css`).replace(/^/, "");
  const html = `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>PokiClicker : ${v.titre}</title>
<style>
${tokens}
${css}
</style>
</head>
<body>
<div class="tel" id="tel">${v.corps}<div id="couches"></div></div>
<script>
${lire("commun.js")}
${lire(`variante-${k}.js`)}
</script>
</body>
</html>
`;
  writeFileSync(join(sortie, `variante-${k}.html`), html);
  console.log(`variante-${k}.html`, html.length);
}

// Page d'accueil : liste des variantes (une phrase chacune) ; sur grand écran, aperçu dans un cadre de 390 px.
const cartes = [
  ["a", "Barre à cinq", "Barre du bas à 5 entrées (Combat, Équipe, Shop, Carte, Plus). PC, Pokédex, Badges et réglages sont dans une feuille du bas. PC grisé avec cadenas, puis point vert au déblocage."],
  ["b", "Barre dévoilée", "4 entrées au départ ; le PC rejoint la barre quand le joueur bat l'arène d'Argenta. Le reste est dans une fenêtre « Menu » ouverte depuis les chiffres clés."],
  ["c", "Fenêtres", "Pas de barre : le combat prend tout l'écran. Un bouton « Menu » ouvre six tuiles ; chaque tuile ouvre une fenêtre par-dessus le jeu, comme dans Egg Inc."],
  ["d", "Bouton du pouce", "Pas de barre : une bande d'actions sous le pouce (Capturer, Auto, Sac, Menu). « Menu » déplie la liste des destinations, qui s'ouvrent en pages."],
];
const css = lire("commun.css") + `
.accueil { max-width: calc(var(--u) * 240); margin: 0 auto; padding: calc(var(--u) * 4); display: grid; gap: calc(var(--u) * 4); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 48rem) { .accueil { grid-template-columns: minmax(0, 1fr) var(--breakpoint-sm); align-items: start; } }
.accueil h1 { font-family: var(--font-titre); font-weight: 600; font-size: var(--text-2xl); line-height: var(--text-2xl--line-height); }
.accueil .liste { gap: calc(var(--u) * 3); }
.carte-v { padding: calc(var(--u) * 4); display: grid; gap: var(--ecart); }
.carte-v h2 { font-family: var(--font-titre); font-weight: 600; font-size: var(--text-xl); line-height: var(--text-xl--line-height); color: var(--region-accent); }
.carte-v a { text-decoration: none; }
.apercu { display: none; }
@media (min-width: 48rem) { .apercu { display: block; position: sticky; top: calc(var(--u) * 4); width: var(--breakpoint-sm); height: calc(100dvh - var(--u) * 8); border: var(--trait) solid var(--bordure); background: var(--fond); } }
`;
const index = `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PokiClicker : variantes de navigation</title>
<style>
${tokens}
${css}
body { background: var(--fond); }
</style>
</head>
<body>
<div class="accueil">
  <div class="liste">
    <h1>Navigation sur téléphone</h1>
    <section class="carte-v cadre"><h2>A4 : A3 corrigée, plus PC, Pokédex, Badges</h2><p>Police Atkinson gras, auto-clic dans les réglages du menu, reprise exacte d'une partie ouverte ailleurs, une seule sauvegarde par partie, déconnexion avec page de sauvegarde, Guide et Statistiques, PC, Pokédex et Badges.</p><a class="plaque action" href="a4-index.html" target="_top">Ouvrir A4</a></section>
    <section class="carte-v cadre"><h2>A3 : toute l'interface téléphone</h2><p>Dernière version : A2 corrigée (combat à quatre boutons, Pokédollars, police lisible, mise en page fluide, animation de vol du jeu) et zone compte complète (connexion, parties, compte).</p><a class="plaque action" href="a3-index.html" target="_top">Ouvrir A3</a></section>
    <section class="carte-v cadre"><h2>A2 : la variante A corrigée</h2><p>Choisie par Nicolas, avec tous les écrans maquettés (combat en deux dispositions, sac, équipe, shop, carte, menu, parties, monde).</p><a class="plaque action" href="a2-index.html" target="_top">Ouvrir A2</a></section>
    <p class="doux">Quatre façons de ranger les six destinations (Combat, Équipe, PC, Shop, Carte, Plus). Chaque variante montre le combat, l'ouverture d'un menu, et le PC verrouillé puis débloqué (bouton en pointillés « Maquette »). Contenu fictif.</p>
${cartes.map(([k, t, p]) => `    <section class="carte-v cadre"><h2>${t}</h2><p>${p}</p><a class="plaque" href="variante-${k}.html" target="_top" data-apercu="variante-${k}.html">Ouvrir la variante ${t}</a></section>`).join("\n")}
  </div>
  <iframe class="apercu" name="apercu" title="Aperçu de la variante" src="variante-a.html"></iframe>
</div>
<script>
if (matchMedia("(min-width: 48rem)").matches) document.querySelectorAll("[data-apercu]").forEach((a) => { a.target = "apercu"; });
</script>
</body>
</html>
`;
writeFileSync(join(sortie, "index.html"), index);
console.log("index.html", index.length);
