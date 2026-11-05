// a3-polices.html : trois polices lisibles comparées sur les vrais chiffres du jeu.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
const ici = dirname(fileURLToPath(import.meta.url));
const lire = (f) => readFileSync(join(ici, f), "utf8");
const tokens = readFileSync(join(ici, "../../../tokens.css"), "utf8");
const NB = " ";
const polices = [
  ["Pixelify Sans", "Actuelle : Pixelify Sans", "Police pixel du jeu, jugée illisible pour les chiffres."],
  ["Atkinson Hyperlegible Next", "1. Atkinson Hyperlegible Next, gras", "Déjà celle du texte courant. Dessinée pour la lisibilité : chaque chiffre a une forme à lui (1, 7, 0). Sobre."],
  ["Rubik", "2. Rubik, gras", "Arrondie et large, un peu jeu vidéo, chiffres bien ouverts. Plus de caractère que la 1."],
  ["Nunito", "3. Nunito, extra-gras", "Très arrondie, douce, proche d'un jeu pour tous. Chiffres ronds, un peu moins nets en petit."],
];
const poids = { "Pixelify Sans": 600, "Atkinson Hyperlegible Next": 700, "Rubik": 700, "Nunito": 800 };
const bloc = ([fam, titre, texte]) => `<section class="essai cadre" style="--f:'${fam}'; --w:${poids[fam]}">
  <h2>${titre}</h2><p class="doux">${texte}</p>
  <div class="cles-essai">
    <div><small>Pokédollars</small><b>280${NB}000${NB}₽</b></div><div><small>DPS</small><b>40${NB}368</b></div><div><small>Zone</small><b>Route 1</b></div>
  </div>
  <p class="ligne"><span class="t">Zone 1/10</span><span class="t">×50</span><span class="t">82</span><span class="t">Niv. 100</span><span class="t">PV 152 / 152</span><span class="t">−412</span></p>
  <p class="ligne"><span class="t">200${NB}₽</span><span class="t">1${NB}200${NB}₽</span><span class="t">25${NB}000${NB}₽</span></p>
  <p class="titres"><span class="t">Bourg Palette</span> <span class="t">Arène de Céladopole</span> <span class="t">Monde Pokémon</span></p>
  <p class="petit"><span class="t">0123456789 · 47/151 · 12 h 34 · 100 %</span></p>
</section>`;
const html = `<!doctype html>
<html lang="fr" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>PokiClicker : polices A3</title>
<style>
${tokens}
${lire("commun.css")}
${lire("polices.css")}
body { background: var(--fond); }
.page { max-width: calc(var(--u) * 120); margin: 0 auto; padding: calc(var(--u) * 4); display: grid; gap: calc(var(--u) * 3); }
.page h1 { font-family: var(--font-texte); font-weight: 700; font-size: var(--text-2xl); line-height: var(--text-2xl--line-height); }
.essai { padding: calc(var(--u) * 4); display: grid; gap: calc(var(--u) * 2); }
.essai h2 { font-family: var(--font-texte); font-weight: 700; font-size: var(--text-lg); color: var(--region-accent); }
.essai .t, .essai b { font-family: var(--f), sans-serif; font-weight: var(--w); font-variant-numeric: tabular-nums; }
.cles-essai { display: grid; grid-template-columns: 1.3fr 1fr 1.3fr; gap: var(--ecart); padding: calc(var(--u) * 2) 0; border-block: var(--trait) solid var(--bordure); }
.cles-essai small { display: block; color: var(--texte-doux); font-size: var(--text-sm); line-height: var(--text-sm--line-height); }
.cles-essai b { display: block; font-size: var(--text-xl); line-height: var(--text-xl--line-height); color: var(--region-accent); white-space: nowrap; }
.ligne { display: flex; flex-wrap: wrap; gap: calc(var(--u) * 3); font-size: var(--text-lg); }
.titres { font-size: var(--text-xl); display: flex; flex-wrap: wrap; gap: calc(var(--u) * 3); }
.petit { font-size: var(--text-base); }
</style>
</head>
<body>
<div class="page">
  <h1>A3 : trois polices pour les chiffres et les titres</h1>
  <p class="doux">Mêmes chiffres du jeu dans chaque police, à la taille réelle du téléphone. Les trois sont libres (licence OFL) et rangées dans le dépôt, rien n'est chargé depuis internet.</p>
${polices.map(bloc).join("\n")}
</div>
</body>
</html>
`;
writeFileSync(join(ici, "..", "a3-polices.html"), html);
console.log("a3-polices.html", html.length);
