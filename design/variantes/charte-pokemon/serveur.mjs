// Serveur de comparaison des habillages (ticket A). Sert le jeu construit (dist/) tel quel et ajoute,
// à la volée et sans toucher au code de l'application, la feuille de l'habillage choisi + un petit sélecteur.
// Usage : npm run build && node design/variantes/charte-pokemon/serveur.mjs  →  http://localhost:4180/
// Touches 0 à 7 (0 = rendu actuel), ou ?skin=2. Chaque variante est une partie neuve avec l'équipe de départ.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ici = fileURLToPath(new URL('.', import.meta.url));
const dist = fileURLToPath(new URL('../../../dist/', import.meta.url));
const SKINS = [
  [0, 'Actuel', null],
  [1, 'Poké Ball', 'skin-1-poke-ball.css'],
  [2, 'Écarlate', 'skin-2-ecarlate.css'],
  [3, 'Aventure', 'skin-3-aventure.css'],
  [4, 'Home', 'skin-4-home.css'],
  [5, 'Showdown', 'skin-5-showdown.css'],
  [6, 'Pokédex', 'skin-6-pokedex.css'],
  [7, 'Menu de jeu', 'skin-7-menu-jeu.css'],
  [8, 'Logo nuit', 'skin-8-logo-nuit.css'],
  [9, 'Pokédex rouge', 'skin-9-pokedex-rouge.css'],
  [10, 'Violet nuit', 'skin-10-violet-nuit.css'],
];
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg' };

const selecteur = `<script>(function(){
  var K='charte-skin',NOMS=${JSON.stringify(SKINS.map(s => s[1]))};
  try{ if(localStorage.getItem('pokiclicker-dev:equipe-de-depart')===null) localStorage.setItem('pokiclicker-dev:equipe-de-depart','1'); }catch(e){}
  var q=new URLSearchParams(location.search).get('skin');
  var n=q!==null?+q:+(sessionStorage.getItem(K)||1);
  if(!(n>=0&&n<=10)) n=1;
  var lien=document.createElement('link');lien.rel='stylesheet';lien.id='charte-skin';
  function appliquer(i){ n=i; try{sessionStorage.setItem(K,String(i));}catch(e){}
    if(i===0){lien.remove();}else{lien.href='/__skin/'+i+'.css?'+Date.now();document.head.appendChild(lien);}
    var b=document.getElementById('charte-choix'); if(b) for(var j=0;j<b.children.length;j++) b.children[j].style.opacity=(j===i)?'1':'.55';
    var t=document.getElementById('charte-nom'); if(t) t.textContent=NOMS[i]; }
  document.addEventListener('DOMContentLoaded',function(){
    var b=document.createElement('div');b.id='charte-choix';
    b.setAttribute('style','position:fixed;top:0;left:50%;transform:translateX(-50%);z-index:2147483647;display:flex;gap:2px;font:600 11px/1 system-ui;background:#000c;color:#fff;border-radius:0 0 8px 8px;padding:2px 4px');
    for(var i=0;i<NOMS.length;i++){(function(i){var x=document.createElement('button');x.type='button';x.textContent=i;x.title=NOMS[i];
      x.setAttribute('style','all:unset;cursor:pointer;padding:3px 7px;color:#fff;border-radius:4px');x.onclick=function(){appliquer(i)};b.appendChild(x);})(i);}
    var t=document.createElement('span');t.id='charte-nom';t.setAttribute('style','padding:3px 6px;opacity:.8');b.appendChild(t);
    document.body.appendChild(b);appliquer(n);
    document.addEventListener('keydown',function(e){if(/^[0-9]$/.test(e.key)&&!/INPUT|TEXTAREA|SELECT/.test((e.target||{}).tagName||'')&&!e.ctrlKey&&!e.metaKey)appliquer(+e.key);});
  });
})();</script>`;

async function skinCss(i) {
  const s = SKINS[i];
  if (!s || !s[2]) return null;
  const [commun, peau] = await Promise.all([readFile(join(ici, 'commun.css'), 'utf8'), readFile(join(ici, s[2]), 'utf8')]);
  return `${commun}\n${peau}`;
}

createServer(async (req, rep) => {
  try {
    const url = new URL(req.url, 'http://x');
    const m = /^\/__skin\/(\d+)\.css$/.exec(url.pathname);
    if (m) {
      const css = await skinCss(+m[1]);
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
}).listen(4180, () => console.log('Habillages : http://localhost:4180/  (touches 0 à 9)'));
