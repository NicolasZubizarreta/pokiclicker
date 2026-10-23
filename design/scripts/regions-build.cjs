// Génère design/regions.css depuis design/regions.json et contrôle les contrastes (WCAG 2.2).
const fs=require('fs'),path=require('path');
const d=path.join(__dirname,'..');const R=JSON.parse(fs.readFileSync(path.join(d,'regions.json'),'utf8'));
const lin=c=>{c/=255;return c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4)};
const lum=h=>0.2126*lin(parseInt(h.slice(1,3),16))+0.7152*lin(parseInt(h.slice(3,5),16))+0.0722*lin(parseInt(h.slice(5,7),16));
const cr=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
const CHECKS=[['texte','fond',4.5],['texte','surface',4.5],['texte','surface-2',4.5],['texte-doux','surface',4.5],['action-texte','action',4.5],['action-texte','action-survol',4.5],['lien','surface',4.5],['focus','surface',3],['region-accent','surface',3]];
let css='/* GÉNÉRÉ par scripts/regions-build.cjs depuis regions.json : ne pas éditer à la main.\n   Usage : <html data-region="johto" data-theme="dark">. Kanto = tokens.css (aucun attribut). */\n';
let fails=0;
const decl=o=>Object.entries(o).map(([k,v])=>`  --${k}: ${v};`).join('\n');
for(const [n,t] of Object.entries(R)){if(n.startsWith('_'))continue;
 const isK=n==='kanto';
 for(const th of isK?[]:['clair','sombre'])for(const [a,b,min] of CHECKS){const r=cr(t[th][a],t[th][b]);if(r<min){fails++;console.log(`ÉCHEC ${n} ${th} ${a}/${b} ${r.toFixed(2)} < ${min}`)}}
 const extra=t.typo?`\n  --font-titre: ${t.typo.titre};\n  --font-texte: ${t.typo.texte};`:'';
 css+=`\n/* ${n} : ${t.jeu} */\n[data-region="${n}"] {\n${decl(t.clair)}${extra}\n}\n@media (prefers-color-scheme: dark) {\n  [data-region="${n}"]:not([data-theme="light"]) {\n${decl(t.sombre).replace(/^/gm,'  ')}\n  }\n}\n[data-region="${n}"][data-theme="dark"] {\n${decl(t.sombre)}\n}\n`;}
// Kanto est le thème par défaut : les rôles de région s'appliquent aussi sans attribut data-region
css=css.replace('[data-region="kanto"] {\n  --region-accent','[data-region="kanto"] {\n  --region-accent'.replace('[data-region="kanto"]',':root, [data-region="kanto"]'))
  .replace('  [data-region="kanto"]:not([data-theme="light"]) {','  :root:not([data-theme="light"]), [data-region="kanto"]:not([data-theme="light"]) {')
  .replace('[data-region="kanto"][data-theme="dark"] {',':root[data-theme="dark"], [data-region="kanto"][data-theme="dark"] {');
fs.writeFileSync(path.join(d,'regions.css'),css);console.log('regions.css écrit ;',fails,'échec(s) de contraste');
