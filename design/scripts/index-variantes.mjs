// Prépare les trois « sites » de variantes (A, B, C) :
//  - design/variantes/_base/fichiers.js : le fichier de chaque variante pour chaque page (lu par site.js) ;
//  - design/variantes/index.html : le choix des trois sites ;
//  - ajoute site.js à chaque maquette qui ne l'a pas encore.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const racine = join(process.cwd(), 'design', 'variantes');
const pages = ['equipe', 'fiche-pokemon', 'pc', 'sac', 'shop', 'plus', 'carte', 'evenement'];
const fichiers = {};
for (const dossier of pages) {
  const liste = readdirSync(join(racine, dossier)).filter(f => /^[abc]-.*\.html$/.test(f)).sort();
  fichiers[dossier] = Object.fromEntries(liste.map(f => [f[0], f]));
}
// Le combat est déjà décidé (on touche la scène) : les trois sites utilisent la maquette tactile.
fichiers.combat = { a: 'b-scene-tactile.html', b: 'b-scene-tactile.html', c: 'b-scene-tactile.html' };
writeFileSync(join(racine, '_base', 'fichiers.js'), `window.FICHIERS = ${JSON.stringify(fichiers, null, 2)};\n`);

const balises = '<script src="../_base/fichiers.js"></script><script src="../_base/site.js"></script>';
for (const dossier of [...pages, 'combat']) {
  for (const f of readdirSync(join(racine, dossier)).filter(x => /^[abc]-.*\.html$/.test(x))) {
    const chemin = join(racine, dossier, f);
    const texte = readFileSync(chemin, 'utf8');
    if (!texte.includes('site.js')) writeFileSync(chemin, texte.replace('</body>', `${balises}</body>`));
  }
}

const sites = [
  ['a', 'Listes et pages complètes', 'Des lignes lisibles, une page entière par fiche, la carte en plein cadre, le Shop en étagères.'],
  ['b', 'Grilles et cartes', 'De grandes cartes et des grilles à regarder, une fiche qui se superpose, le Shop en cartes produit, un carrousel pour le starter.'],
  ['c', 'Panneaux et onglets', 'Des cases compactes avec un panneau de détail, des onglets, le Shop en rayons avec panier, un tableau de bord dans Plus.'],
];
const cartes = sites.map(([l, titre, texte]) => `<li><a class="site" href="equipe/${fichiers.equipe[l]}"><strong>Site ${l.toUpperCase()} · ${titre}</strong><span>${texte}</span><span class="aller">Ouvrir le site ${l.toUpperCase()}</span></a></li>`).join('');
const style = 'main{max-width:48rem;margin-inline:auto;display:grid;gap:calc(var(--spacing) * 4)}ul{padding:0;margin:0;list-style:none;display:grid;gap:calc(var(--spacing) * 4)}'
  + 'a.site{display:grid;gap:calc(var(--spacing) * 2);padding:calc(var(--spacing) * 4);background:var(--surface);color:var(--texte);text-decoration:none;border:calc(var(--spacing) / 2) solid var(--region-accent)}'
  + 'a.site strong{font-family:var(--font-titre);font-size:var(--text-xl)}.aller{display:inline-flex;align-items:center;justify-content:center;min-height:calc(var(--spacing) * 11);background:var(--action);color:var(--action-texte);font-weight:700}'
  + 'a.lien{display:inline-flex;align-items:center;min-height:calc(var(--spacing) * 11);padding:calc(var(--spacing) * 2) calc(var(--spacing) * 4);background:var(--surface-2);color:var(--lien)}body{padding-bottom:calc(var(--spacing) * 8)}';
writeFileSync(join(racine, 'index.html'), `<!doctype html><html lang="fr" data-theme="dark"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>Trois sites à tester</title>`
  + `<link rel="stylesheet" href="_base/base.css"><style>${style}</style></head><body><main><h1>Trois sites à tester</h1>`
  + `<p>Chaque site est un jeu complet : tu navigues avec la barre du bas (ou de gauche sur PC) et tu passes d'un écran à l'autre. `
  + `Sur chaque page, ouvre « Autres écrans et ton avis » en haut : tu notes « Je garde », « Bof » ou « Je jette ».</p>`
  + `<ul>${cartes}</ul><a class="lien" href="bilan.html">Voir mon bilan</a></main></body></html>`);
console.log('Trois sites prêts.');
