import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { afterEach, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/preparer-scenes-v1.mjs', import.meta.url));
const fichiers = [
  ['background/Zone 0.png', 'scenes/bourg-palette.webp', 1080, 1080],
  ['background/LaboPokemon.png', 'scenes/labo.webp', 1080, 1080],
  ['background/Chez Blue.png', 'decors/chez-blue.webp', 1920, 1080],
  ...[1, 2, 3].map((n) => [`sprites/SpriteChen${n}.png`, `sprites/chen/chen-${n}.png`, 120, 120] as const),
] as const;
const temporaires: string[] = [];
afterEach(async () => {
  for (const dossier of temporaires.splice(0)) await rm(dossier, { recursive: true, force: true });
});

async function preparer(absent?: string) {
  const dossier = await mkdtemp(join(tmpdir(), 'pokiclicker-scenes-'));
  temporaires.push(dossier);
  const sources = join(dossier, 'sources');
  const sorties = join(dossier, 'sorties');
  await mkdir(join(sources, 'background'), { recursive: true });
  await mkdir(join(sources, 'sprites'));
  await mkdir(sorties);
  await writeFile(join(sorties, 'tailles.json'), JSON.stringify({ 'img/existant.png': { largeur: 1, hauteur: 2 } }));
  for (const [source] of fichiers) {
    if (source === absent) continue;
    const [width, height] = source.includes('Blue') ? [1053, 692] : source.includes('Sprite') ? [40, 100] : [200, 200];
    await sharp({ create: { width, height, channels: 4, background: '#174e8b' } }).png().toFile(join(sources, source));
  }
  const lancer = () => new Promise<{ code: number; message: string }>((resoudre) => {
    execFile(process.execPath, [script, '--sources', sources, '--sorties', sorties], (erreur, stdout, stderr) => {
      resoudre({ code: erreur ? 1 : 0, message: stdout + stderr });
    });
  });
  return { sorties, lancer };
}

it('prépare les six images aux dimensions exactes et conserve le manifeste existant', async () => {
  const essai = await preparer();
  expect(await essai.lancer()).toMatchObject({ code: 0 });
  const tailles = JSON.parse(await readFile(join(essai.sorties, 'tailles.json'), 'utf8'));
  expect(tailles['img/existant.png']).toEqual({ largeur: 1, hauteur: 2 });
  for (const [, chemin, width, height] of fichiers) {
    expect(await sharp(await readFile(join(essai.sorties, chemin))).metadata()).toMatchObject({ width, height, format: chemin.endsWith('.webp') ? 'webp' : 'png' });
    expect(tailles[`img/${chemin}`]).toEqual({ largeur: width, hauteur: height });
  }
});

it('garde les bandes de Blue transparentes et centre Chen en bas sans le déformer', async () => {
  const essai = await preparer();
  expect((await essai.lancer()).code).toBe(0);
  const blue = await sharp(await readFile(join(essai.sorties, 'decors/chez-blue.webp'))).ensureAlpha().raw().toBuffer();
  for (let y = 0; y < 1080; y++) {
    expect(blue[(y * 1920) * 4 + 3]).toBe(0);
    expect(blue[(y * 1920 + 1919) * 4 + 3]).toBe(0);
  }
  expect(blue[(540 * 1920 + 960) * 4 + 3]).toBe(255);
  for (const n of [1, 2, 3]) {
    const chen = await sharp(await readFile(join(essai.sorties, `sprites/chen/chen-${n}.png`))).ensureAlpha().raw().toBuffer();
    const alpha = (x: number, y: number) => chen[(y * 120 + x) * 4 + 3];
    expect(alpha(60, 0)).toBe(0);
    expect(alpha(60, 119)).toBe(255);
    expect(alpha(39, 119)).toBe(0);
    expect(alpha(40, 119)).toBe(255);
    expect(alpha(79, 119)).toBe(255);
    expect(alpha(80, 119)).toBe(0);
  }
});

it('signale clairement une source absente et traite les cinq autres images', async () => {
  const essai = await preparer('background/Zone 0.png');
  const resultat = await essai.lancer();
  expect(resultat.code).toBe(1);
  expect(resultat.message).toContain('Zone 0.png -> REFUSÉ : source absente');
  const tailles = JSON.parse(await readFile(join(essai.sorties, 'tailles.json'), 'utf8'));
  expect(tailles['img/scenes/bourg-palette.webp']).toBeUndefined();
  for (const [, chemin, width, height] of fichiers.slice(1)) {
    expect(await sharp(await readFile(join(essai.sorties, chemin))).metadata()).toMatchObject({ width, height });
    expect(tailles[`img/${chemin}`]).toEqual({ largeur: width, hauteur: height });
  }
});

it('livre les six fichiers publics aux dimensions annoncées dans tailles.json', async () => {
  const publicImages = new URL('../public/img/', import.meta.url);
  const tailles = JSON.parse(await readFile(new URL('tailles.json', publicImages), 'utf8'));
  for (const [, chemin, width, height] of fichiers) {
    expect(await sharp(await readFile(new URL(chemin, publicImages))).metadata()).toMatchObject({ width, height });
    expect(tailles[`img/${chemin}`]).toEqual({ largeur: width, hauteur: height });
  }
});
