// Capture les maquettes de design/variantes/<page>/ à 390 et 1440 px et relève les défauts mesurables.
// Usage : node design/scripts/capturer-variantes.mjs [page ...]   (sans argument : toutes les pages sauf combat)
// Sortie : design/captures/b/<page>-<variante>-<largeur>.png et design/captures/b/rapport.json
import { spawn } from 'node:child_process';
import { mkdirSync, readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const racine = process.cwd();
const dossierVariantes = join(racine, 'design', 'variantes');
const sortie = join(racine, 'design', 'captures', 'b');
mkdirSync(sortie, { recursive: true });
const demandees = process.argv.slice(2);
const pages = readdirSync(dossierVariantes).filter(nom => !nom.startsWith('_') && nom !== 'combat'
  && statSync(join(dossierVariantes, nom)).isDirectory() && (demandees.length === 0 || demandees.includes(nom)));
const tailles = [{ largeur: 390, hauteur: 844 }, { largeur: 1440, hauteur: 900 }];
const port = 5199;

const serveur = spawn(process.execPath, [join(racine, 'node_modules', 'vite', 'bin', 'vite.js'), '--port', String(port), '--strictPort'],
  { cwd: racine, stdio: 'ignore' });
const attendre = async () => {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(`http://localhost:${port}/`)).ok) return; } catch { /* pas encore prêt */ }
    await new Promise(r => setTimeout(r, 500));
  }
  throw new Error('Le serveur Vite ne répond pas.');
};

const rapport = [];
try {
  await attendre();
  const navigateur = await chromium.launch();
  for (const page of pages) {
    const fichiers = readdirSync(join(dossierVariantes, page)).filter(f => /^[abc]-.*\.html$/.test(f)).sort();
    for (const fichier of fichiers) {
      for (const { largeur, hauteur } of tailles) {
        const contexte = await navigateur.newContext({ viewport: { width: largeur, height: hauteur }, reducedMotion: 'reduce' });
        const onglet = await contexte.newPage();
        const erreurs = [];
        const externes = [];
        onglet.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
        onglet.on('pageerror', e => erreurs.push(String(e)));
        onglet.on('requestfailed', r => erreurs.push(`échec : ${r.url()}`));
        onglet.on('request', r => { if (!r.url().startsWith(`http://localhost:${port}`) && !r.url().startsWith('data:')) externes.push(r.url()); });
        await onglet.goto(`http://localhost:${port}/design/variantes/${page}/${fichier}`, { waitUntil: 'networkidle' });
        await onglet.evaluate(() => document.querySelectorAll('details').forEach(d => d.removeAttribute('open')));
        const mesures = await onglet.evaluate(() => {
          const visible = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el);
            return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
          const cibles = [...document.querySelectorAll('button, a[href], input, select, summary, [role="button"], [tabindex="0"]')]
            .filter(visible).map(el => ({ el, r: el.getBoundingClientRect() }))
            .filter(({ r }) => r.width < 44 || r.height < 44)
            .map(({ el, r }) => `${el.tagName.toLowerCase()} « ${(el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30)} » ${Math.round(r.width)}×${Math.round(r.height)}`);
          const petits = [...document.querySelectorAll('body *')].filter(el => visible(el)
            && [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())
            && parseFloat(getComputedStyle(el).fontSize) < 16 && !el.closest('svg'))
            .map(el => `${el.tagName.toLowerCase()} « ${el.textContent.trim().slice(0, 30)} » ${getComputedStyle(el).fontSize}`);
          const images = [...document.images].filter(visible).filter(img => {
            if (!img.naturalWidth) return false;
            const ratio = img.getBoundingClientRect().width / img.naturalWidth;
            return /pokemon\//.test(img.src) && !Number.isInteger(Math.round(ratio * 100) / 100);
          }).map(img => `${img.src.split('/').pop()} ×${(img.getBoundingClientRect().width / img.naturalWidth).toFixed(2)}`);
          const anglais = (document.body.innerText.match(/\b(Team|Shop now|Buy|Back|Close|Attack|Bag|Items?|Level|Next|Cancel)\b/g) || []);
          const boutonsAction = [...document.querySelectorAll('button')].filter(visible)
            .filter(b => getComputedStyle(b).backgroundColor === getComputedStyle(document.documentElement).getPropertyValue('--action')).length;
          return { debordementX: document.documentElement.scrollWidth > window.innerWidth + 1,
            scrollWidth: document.documentElement.scrollWidth, cibles, petits: petits.slice(0, 8), images, anglais, boutonsAction };
        });
        const nom = `${page}-${fichier.replace('.html', '')}-${largeur}`;
        await onglet.screenshot({ path: join(sortie, `${nom}.png`), fullPage: true });
        rapport.push({ nom, erreurs, externes, ...mesures,
          petits: largeur === 390 ? mesures.petits : [] });
        await contexte.close();
      }
    }
  }
  await navigateur.close();
} finally {
  serveur.kill();
}
// Contrôle statique : couleurs hexadécimales écrites dans les maquettes (interdit hors jetons).
for (const page of pages) {
  for (const f of readdirSync(join(dossierVariantes, page))) {
    if (!/\.(css|html|js)$/.test(f)) continue;
    const texte = readFileSync(join(dossierVariantes, page, f), 'utf8');
    const hex = texte.match(/#[0-9a-fA-F]{3,8}\b/g);
    if (hex) rapport.push({ nom: `${page}/${f}`, erreurs: [`couleurs en dur : ${[...new Set(hex)].slice(0, 5).join(' ')}`] });
  }
}
writeFileSync(join(sortie, 'rapport.json'), JSON.stringify(rapport, null, 2));
const defauts = rapport.filter(r => r.erreurs?.length || r.externes?.length || r.debordementX || r.cibles?.length || r.petits?.length || r.images?.length || r.anglais?.length);
console.log(`${rapport.length} captures/contrôles, ${defauts.length} avec défauts`);
for (const d of defauts) console.log(JSON.stringify({ nom: d.nom, erreurs: d.erreurs, externes: d.externes, debordementX: d.debordementX, cibles: d.cibles?.slice(0, 4), petits: d.petits?.slice(0, 3), images: d.images, anglais: d.anglais }));
