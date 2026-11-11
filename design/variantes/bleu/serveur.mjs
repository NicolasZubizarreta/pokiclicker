// Comparaison des usages du bleu (ticket A, 11/11). Sert dist/ tel quel (charte Pokédex sombre actuelle) et ajoute
// à la volée la feuille de la variante choisie. Aucun code de l'application n'est touché.
// Usage : npm run build && node design/variantes/bleu/serveur.mjs  →  http://localhost:4181/  (touches 0 à 6, ou ?v=3)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = fileURLToPath(new URL('.', import.meta.url));
const dist = fileURLToPath(new URL('../../../dist/', import.meta.url));
const VARIANTES = [
  [0, 'Sans bleu (actuel)', null],
  [1, 'Contours bleus', 'bleu-1-contours.css'],
  [2, 'Boutons bleus', 'bleu-2-boutons.css'],
  [3, 'Cadres bleu nuit', 'bleu-3-nuit.css'],
  [4, 'Barre latérale bleue', 'bleu-4-barre.css'],
  [5, 'Chiffres et accents bleus', 'bleu-5-accents.css'],
  [6, 'Mélange', 'bleu-6-melange.css'],
];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };

const selecteur = `<script>(function(){
  var K='bleu-variante',NOMS=${JSON.stringify(VARIANTES.map(s => s[1]))};
  try{ if(localStorage.getItem('pokiclicker-dev:equipe-de-depart')===null) localStorage.setItem('pokiclicker-dev:equipe-de-depart','1'); }catch(e){}
  var q=new URLSearchParams(location.search).get('v');
  var n=q!==null?+q:+(sessionStorage.getItem(K)||0);
  if(!(n>=0&&n<${VARIANTES.length})) n=0;
  var lien=document.createElement('link');lien.rel='stylesheet';lien.id='bleu-feuille';
  function appliquer(i){ n=i; try{sessionStorage.setItem(K,String(i));}catch(e){}
    if(i===0){lien.remove();}else{lien.href='/__bleu/'+i+'.css?'+Date.now();document.head.appendChild(lien);}
    var b=document.getElementById('bleu-choix'); if(b) for(var j=0;j<b.children.length-1;j++) b.children[j].style.opacity=(j===i)?'1':'.55';
    var t=document.getElementById('bleu-nom'); if(t) t.textContent=NOMS[i]; }
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.createElement('div');b.id='bleu-choix';
    b.setAttribute('style','position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:2147483647;display:flex;gap:2px;font:600 11px/1 system-ui;background:#000c;color:#fff;border-radius:0 0 8px 8px;padding:2px 4px');
    for(var i=0;i<NOMS.length;i++){(function(i){var x=document.createElement('button');x.type='button';x.textContent=i;x.title=NOMS[i];
      x.setAttribute('style','all:unset;cursor:pointer;padding:3px 7px;color:#fff;border-radius:4px');x.onclick=function(){appliquer(i)};b.appendChild(x);})(i);}
    var t=document.createElement('span');t.id='bleu-nom';t.setAttribute('style','padding:3px 6px;opacity:.8');b.appendChild(t);
    document.body.appendChild(b);appliquer(n);
    document.addEventListener('keydown',function(e){if(/^[0-6]$/.test(e.key)&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')&&!e.ctrlKey&&!e.metaKey)appliquer(+e.key);});
  });
})();</script>`;

createServer(async (req, rep) => {
  try {
    const url = new URL(req.url, 'http://x');
    const m = /^\/__bleu\/(\d+)\.css$/.exec(url.pathname);
    if (m) {
      const v = VARIANTES[+m[1]];
      const css = v?.[2] ? await readFile(join(ici, v[2]), 'utf8') : null;
      rep.writeHead(css ? 200 : 404, { 'content-type': 'text/css; charset=utf-8', 'cache-control': 'no-store' });
      return rep.end(css ?? '');
    }
    let chemin = normalize(join(dist, decodeURIComponent(url.pathname)));
    if (!chemin.startsWith(dist)) { rep.writeHead(403); return rep.end(); }
    let info = await stat(chemin).catch(() => null);
    if (info?.isDirectory()) { chemin = join(chemin, 'index.html'); info = await stat(chemin).catch(() => null); }
    if (!info) chemin = join(dist, 'index.html');
    let corps = await readFile(chemin);
    const type = types[extname(chemin)] ?? 'application/octet-stream';
    if (extname(chemin) === '.html') corps = Buffer.from(corps.toString('utf8').replace('</head>', `${selecteur}</head>`));
    rep.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
    rep.end(corps);
  } catch (e) { rep.writeHead(500); rep.end(String(e)); }
}).listen(4181, () => console.log('Bleu : http://localhost:4181/  (touches 0 à 6)'));
