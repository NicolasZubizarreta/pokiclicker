// Génère design/variantes/index.html : la liste des maquettes à parcourir pour choisir une variante par page.
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const racine = join(process.cwd(), 'design', 'variantes');
const pages = [['equipe', 'Équipe'], ['fiche-pokemon', 'Fiche Pokémon'], ['pc', 'PC'], ['sac', 'Sac'], ['shop', 'Shop'],
  ['plus', 'Plus (menu et Pokédex)'], ['carte', 'Carte de Kanto'], ['evenement', 'Dialogue de Chen, starter, Chez Maman']];
const lignes = pages.map(([dossier, titre]) => {
  const fichiers = readdirSync(join(racine, dossier)).filter(f => /^[abc]-.*\.html$/.test(f)).sort();
  const liens = fichiers.map(f => `<li><a href="${dossier}/${f}">${f[0].toUpperCase()} — ${f.slice(2, -5).replace(/-/g, ' ')}</a></li>`).join('');
  return `<h2>${titre}</h2><ul>${liens}</ul>`;
}).join('');
const style = 'main{max-width:48rem;margin-inline:auto}ul{padding:0;list-style:none;display:grid;gap:calc(var(--spacing) * 2)}'
  + 'a{display:flex;align-items:center;min-height:calc(var(--spacing) * 11);padding:calc(var(--spacing) * 2) calc(var(--spacing) * 4);background:var(--surface);color:var(--lien)}'
  + 'h2{margin-top:calc(var(--spacing) * 6);margin-bottom:calc(var(--spacing) * 2)}body{padding-bottom:calc(var(--spacing) * 8)}';
writeFileSync(join(racine, 'index.html'), `<!doctype html><html lang="fr" data-theme="dark"><head><meta charset="utf-8">`
  + `<meta name="viewport" content="width=device-width, initial-scale=1"><title>Variantes des pages</title>`
  + `<link rel="stylesheet" href="_base/base.css"><style>${style}</style></head><body><main><h1>Variantes des pages</h1>`
  + `<p>Choisis une variante (A, B ou C) par page. Ouvre-les sur ton téléphone et sur ton PC.</p>${lignes}</main></body></html>`);
console.log('index.html écrit');
