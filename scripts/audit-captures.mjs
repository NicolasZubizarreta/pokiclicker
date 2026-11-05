import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { setTimeout as attendre } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { ecrans } from './audit/ecrans.mjs';
import { genererPlanche } from './audit/planche.mjs';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const argumentsCli = process.argv.slice(2);
const indiceFiltre = argumentsCli.indexOf('--seulement');
if (indiceFiltre !== -1 && (!argumentsCli[indiceFiltre + 1] || argumentsCli[indiceFiltre + 1]?.startsWith('--'))) {
  throw new Error('--seulement attend une sous-chaîne.');
}
const filtre = indiceFiltre === -1 ? '' : argumentsCli[indiceFiltre + 1] ?? '';
const selection = ecrans.filter(e => `${e.groupe}-${e.slug}`.includes(filtre));
if (!selection.length) throw new Error(`Aucun écran pour « ${filtre} ».`);
const configurations = { jeu: { dossier: 'dist-audit', port: 4175, api: '' }, compte: { dossier: 'dist-audit-compte', port: 4176, api: 'http://api.test' } };
/** @typedef {{dossier: string, port: number, api: string}} Configuration */
/** @typedef {import('node:child_process').ChildProcess & {termine: Promise<void>}} Enfant */
/** @type {Set<Enfant>} */
const enfants = new Set();
/** @type {import('@playwright/test').Browser|undefined} */
let navigateur;
let interruption = false;
/** @param {string[]} args @param {string} api */
function lancer(args, api) {
  const env = { ...process.env, VITE_API_URL: api };
  const enfant = /** @type {Enfant} */ (spawn(process.execPath, ['node_modules/vite/bin/vite.js', ...args], { env, shell: false, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] }));
  enfants.add(enfant);
  let journal = '';
  enfant.stdout?.on('data', sortie => { journal = (journal + sortie).slice(-6000); });
  enfant.stderr?.on('data', sortie => { journal = (journal + sortie).slice(-6000); });
  enfant.termine = new Promise((resolve, reject) => {
    enfant.on('error', reject);
    enfant.on('exit', code => { enfants.delete(enfant); if (code === 0) resolve(); else reject(new Error(`Vite (${code}) : ${journal}`)); });
  });
  // Les erreurs des serveurs sont aussi consultées pendant l'attente du port.
  enfant.termine.catch(() => {});
  return enfant;
}
async function arreter() {
  await navigateur?.close().catch(() => {});
  await Promise.all([...enfants].map(async enfant => {
    enfant.kill('SIGTERM');
    await Promise.race([enfant.termine.catch(() => {}), attendre(3000)]);
    if (enfants.has(enfant)) enfant.kill('SIGKILL');
  }));
}
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => {
  interruption = true;
  void arreter().finally(() => process.exit(signal === 'SIGINT' ? 130 : 143));
});
/** @param {Configuration} config */
async function servir(config) {
  if (!argumentsCli.includes('--sans-build')) await lancer(['build', '--outDir', config.dossier, '--emptyOutDir'], config.api).termine;
  // Un port déjà utilisé ne doit jamais conduire à photographier une autre application.
  const { createServer } = await import('node:net');
  await new Promise((resolve, reject) => {
    const sonde = createServer();
    sonde.once('error', reject);
    sonde.listen(config.port, 'localhost', () => sonde.close(erreur => erreur ? reject(erreur) : resolve(undefined)));
  });
  const serveur = lancer(['preview', '--outDir', config.dossier, '--host', 'localhost', '--port', String(config.port), '--strictPort'], config.api);
  const limite = Date.now() + 120_000;
  while (Date.now() < limite && !interruption) {
    if (!enfants.has(serveur)) await serveur.termine;
    try {
      const reponse = await fetch(`http://localhost:${config.port}`, { signal: AbortSignal.timeout(1000) });
      if (reponse.ok) return;
    } catch { /* Le serveur démarre. */ }
    await attendre(250);
  }
  throw new Error(`Le port ${config.port} ne répond pas après 120 s.`);
}

await mkdir('design/audit', { recursive: true });
/** @type {{ecrans: import('./audit/planche.mjs').Resultat[]}} */
let precedent = { ecrans: [] };
try { precedent = JSON.parse(await readFile('design/audit/captures.json', 'utf8')); }
catch (erreur) { if (!(erreur instanceof Error && 'code' in erreur && erreur.code === 'ENOENT')) throw erreur; }
const resultats = new Map(precedent.ecrans.map(e => [`${e.groupe}-${e.slug}`, e]));
async function enregistrer() {
  const ordre = ecrans.map(e => `${e.groupe}-${e.slug}`);
  const manifeste = { genereLe: new Date().toISOString(), ecrans: [...resultats.values()].sort((a, b) => ordre.indexOf(`${a.groupe}-${a.slug}`) - ordre.indexOf(`${b.groupe}-${b.slug}`)) };
  await writeFile('design/audit/captures.json', JSON.stringify(manifeste, null, 2) + '\n');
  await writeFile('design/audit/index.html', genererPlanche(manifeste));
}
try {
  for (const config of Object.values(configurations)) await servir(config);
  navigateur = await chromium.launch();
  for (const ecran of selection) {
    const { atteindre, inatteignable, ...metadata } = ecran;
    /** @type {import('./audit/planche.mjs').Resultat & {largeurs: NonNullable<import('./audit/planche.mjs').Resultat['largeurs']>}} */
    const resultat = { ...metadata, statut: inatteignable ? 'inatteignable' : 'ok', raison: inatteignable ?? '', captures: {}, erreursJS: [], largeurs: {}, captureLe: new Date().toISOString() };
    if (!inatteignable) for (const largeur of [390, 1440]) {
      let contexte;
      /** @type {string[]} */
      const erreursJS = [];
      try {
        contexte = await navigateur.newContext({ viewport: { width: largeur, height: largeur === 390 ? 844 : 900 }, isMobile: largeur === 390, hasTouch: largeur === 390, serviceWorkers: 'block', reducedMotion: 'reduce', deviceScaleFactor: 1, locale: 'fr-FR', timezoneId: 'Europe/Paris' });
        const url = `http://localhost:${configurations[ecran.build].port}`;
        // Toute ressource qui n'est ni locale ni l'API fictive est refusée.
        await contexte.route('**/*', route => ['http://localhost:4175', 'http://localhost:4176'].includes(new URL(route.request().url()).origin) ? route.continue() : route.abort());
        const page = await contexte.newPage();
        page.setDefaultTimeout(12_000);
        page.on('pageerror', erreur => erreursJS.push(erreur.message));
        await page.clock.install({ time: new Date('2026-11-05T12:00:00Z') });
        await page.clock.pauseAt(new Date('2026-11-05T12:00:00Z'));
        await page.addInitScript(() => { Math.random = () => 0.1; });
        if (!atteindre) throw new Error('Accès manquant pour cet écran.');
        await atteindre(page, { contexte, url, largeur });
        await page.evaluate(async () => {
          await document.fonts.ready;
          await Promise.all(Array.from(document.images, image => image.decode()));
        });
        if (erreursJS.length) throw new Error(erreursJS.join(' ; '));
        const fichier = `${ecran.groupe}-${ecran.slug}-${largeur}.png`;
        // Page entière : on agrandit la fenêtre à la hauteur du document pour que la barre fixe reste en bas et que les panneaux à défilement interne se montrent en entier.
        const hauteurFenetre = largeur === 390 ? 844 : 900;
        const hauteurPage = await page.evaluate(() => document.documentElement.scrollHeight);
        if (hauteurPage > hauteurFenetre) await page.setViewportSize({ width: largeur, height: Math.min(hauteurPage, 8000) });
        await page.screenshot({ path: `design/audit/${fichier}`, fullPage: true, animations: 'disabled' });
        if (erreursJS.length) throw new Error(erreursJS.join(' ; '));
        resultat.captures[largeur] = fichier;
        resultat.largeurs[largeur] = { statut: 'ok' };
      } catch (erreur) {
        const message = erreur instanceof Error ? erreur.message : String(erreur);
        resultat.statut = 'erreur';
        resultat.raison += `${largeur} px : ${message}\n`;
        resultat.largeurs[largeur] = { statut: 'erreur', raison: message };
        process.exitCode = 1;
      } finally {
        resultat.erreursJS.push(...erreursJS.map(message => ({ largeur, message })));
        await contexte?.close();
      }
    }
    resultats.set(`${ecran.groupe}-${ecran.slug}`, resultat);
    await enregistrer();
    console.log(`${ecran.groupe}-${ecran.slug} : ${resultat.statut}`);
  }
} catch (erreur) {
  const message = erreur instanceof Error ? erreur.message : String(erreur);
  console.error(message);
  process.exitCode = 1;
  for (const ecran of selection) if (!resultats.has(`${ecran.groupe}-${ecran.slug}`)) {
    const { atteindre: _atteindre, ...metadata } = ecran;
    void _atteindre;
    resultats.set(`${ecran.groupe}-${ecran.slug}`, { ...metadata, statut: 'erreur', raison: `Préparation impossible : ${message}`, captures: {}, erreursJS: [] });
  }
} finally {
  await arreter();
  await enregistrer();
}
