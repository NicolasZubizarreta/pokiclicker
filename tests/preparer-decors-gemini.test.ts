import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { afterEach, expect, it } from 'vitest';
import { fenetre } from '../scripts/preparer-decors-gemini.mjs';

const script = fileURLToPath(new URL('../scripts/preparer-decors-gemini.mjs', import.meta.url));
const temporaires: string[] = [];
afterEach(async () => { for (const d of temporaires.splice(0)) await rm(d, { recursive: true, force: true }); });

it('retire le logo : fenêtre 16:9 ancrée en haut à gauche, sans la marge de droite ni du bas', () => {
  const f = fenetre(2816, 1536, 0.105) as { left: number; top: number; width: number; height: number };
  expect(f.top).toBe(0);
  expect(f.left + f.width).toBeLessThanOrEqual(Math.floor(2816 * 0.895));
  expect(f.top + f.height).toBeLessThanOrEqual(Math.floor(1536 * 0.895));
  expect(Math.abs(f.width / f.height - 16 / 9)).toBeLessThan(0.002);
  expect(fenetre(4000, 1600, 0)).toEqual({ left: 578, top: 0, width: 2844, height: 1600 });
  expect(fenetre(1600, 1600, 0)).toEqual({ left: 0, top: 0, width: 1600, height: 900 });
});

async function lancer(images: Record<string, [number, number]>) {
  const dossier = await mkdtemp(join(tmpdir(), 'pokiclicker-decors-'));
  temporaires.push(dossier);
  const sources = join(dossier, 'sources');
  const sorties = join(dossier, 'sorties');
  await mkdir(sources);
  await mkdir(sorties);
  await writeFile(join(sorties, 'tailles.json'), JSON.stringify({ 'img/existant.png': { largeur: 1, hauteur: 2 } }));
  for (const [nom, [width, height]] of Object.entries(images)) {
    await sharp({ create: { width, height, channels: 3, background: '#2a6' } }).png().toFile(join(sources, nom));
  }
  const resultat = await new Promise<{ code: number; message: string }>((resoudre) => {
    execFile(process.execPath, [script, '--sources', sources, '--sorties', sorties], (erreur, stdout, stderr) => resoudre({ code: erreur ? 1 : 0, message: stdout + stderr }));
  });
  return { ...resultat, sorties };
}

it('écrit un WebP 1920 × 1080 par image et complète tailles.json sans toucher au reste', async () => {
  const { code, sorties } = await lancer({ 'route-1.png': [2816, 1536], 'route-de-ronflex.png': [2816, 1536] });
  expect(code).toBe(0);
  for (const nom of ['route-1', 'route-de-ronflex']) {
    expect(await sharp(await readFile(join(sorties, `decors/${nom}.webp`))).metadata()).toMatchObject({ width: 1920, height: 1080, format: 'webp' });
  }
  expect(JSON.parse(await readFile(join(sorties, 'tailles.json'), 'utf8'))).toMatchObject({
    'img/existant.png': { largeur: 1, hauteur: 2 }, 'img/decors/route-1.webp': { largeur: 1920, hauteur: 1080 },
  });
}, 30_000);

it('refuse un nom inconnu et une image trop petite, sans rien écrire', async () => {
  const { code, message, sorties } = await lancer({ 'nimporte-quoi.png': [2816, 1536], 'route-1.png': [1600, 900] });
  expect(code).toBe(1);
  expect(message).toContain('nimporte-quoi.png : nom inconnu');
  expect(message).toContain('route-1.png');
  expect(JSON.parse(await readFile(join(sorties, 'tailles.json'), 'utf8'))).toEqual({ 'img/existant.png': { largeur: 1, hauteur: 2 } });
}, 30_000);
