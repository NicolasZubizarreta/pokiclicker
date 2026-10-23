import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { afterEach, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/traiter-images.mjs', import.meta.url));
const temporaires: string[] = [];
afterEach(async () => { await Promise.all(temporaires.splice(0).map((dossier) => rm(dossier, { recursive: true, force: true }))); });

async function preparer() {
  const dossier = await mkdtemp(join(tmpdir(), 'pokiclicker-images-'));
  temporaires.push(dossier);
  const sources = join(dossier, 'sources');
  const sorties = join(dossier, 'sorties');
  await Promise.all(['decors', 'sprites'].map((genre) => mkdir(join(sources, genre), { recursive: true })));
  const creer = (chemin: string, width: number, height: number) => sharp({
    create: { width, height, channels: 4, background: { r: 23, g: 78, b: 139, alpha: 0.7 } },
  }).png().toFile(join(sources, chemin));
  const lancer = () => new Promise<{ code: number; message: string }>((resoudre) => {
    execFile(process.execPath, [script, '--sources', sources, '--sorties', sorties], (erreur, stdout, stderr) => {
      resoudre({ code: erreur ? 1 : 0, message: stdout + stderr });
    });
  });
  return { sources, sorties, creer, lancer };
}

it('produit un décor WebP aux dimensions attendues et un manifeste reproductible', async () => {
  const { sorties, creer, lancer } = await preparer();
  await creer('decors/Été Route 1.png', 3840, 2160);
  expect(await lancer()).toEqual({ code: 0, message: '' });
  const image = await sharp(await readFile(join(sorties, 'decors/ete-route-1.webp'))).metadata();
  expect([image.format, image.width, image.height]).toEqual(['webp', 1920, 1080]);
  const premier = await readFile(join(sorties, 'tailles.json'));
  expect(JSON.parse(premier.toString())).toEqual({ 'img/decors/ete-route-1.webp': { largeur: 1920, hauteur: 1080 } });
  expect((await lancer()).code).toBe(0);
  expect(await readFile(join(sorties, 'tailles.json'))).toEqual(premier);
});

it('refuse le ratio 1,8125 sans écrire ni recadrer', async () => {
  const { sorties, creer, lancer } = await preparer();
  await creer('decors/Zone 1.png', 2784, 1536);
  const resultat = await lancer();
  expect(resultat.code).toBe(1);
  expect(resultat.message).toContain('Zone 1.png');
  expect(resultat.message).toContain('1,8125');
  expect(resultat.message).toContain("Il n'est pas recadré");
  await expect(readdir(sorties)).rejects.toMatchObject({ code: 'ENOENT' });
});

it('liste toutes les erreurs et ne produit rien même avec un décor valide', async () => {
  const { sorties, creer, lancer } = await preparer();
  await creer('decors/valide.png', 3840, 2160);
  await creer('decors/petit.png', 960, 540);
  await creer('decors/ratio.png', 2784, 1536);
  await creer('sprites/petit.png', 64, 64);
  const resultat = await lancer();
  expect(resultat.code).toBe(1);
  for (const fragment of ['petit.png', '960 × 540', 'ratio.png', '1,8125', '64 × 64']) {
    expect(resultat.message).toContain(fragment);
  }
  await expect(readdir(sorties)).rejects.toMatchObject({ code: 'ENOENT' });
});

it('copie les sprites sans modifier les octets ni les pixels', async () => {
  const { sources, sorties, creer, lancer } = await preparer();
  await creer('sprites/19.png', 96, 96);
  expect((await lancer()).code).toBe(0);
  const source = await readFile(join(sources, 'sprites/19.png'));
  const sortie = await readFile(join(sorties, 'sprites/pokemon/19.png'));
  expect(sortie).toEqual(source);
  expect(await sharp(sortie).raw().toBuffer()).toEqual(await sharp(source).raw().toBuffer());
  expect(JSON.parse(await readFile(join(sorties, 'tailles.json'), 'utf8'))).toEqual({
    'img/sprites/pokemon/19.png': { largeur: 96, hauteur: 96 },
  });
});

it('refuse un sprite de taille incorrecte seul', async () => {
  const { sorties, creer, lancer } = await preparer();
  await creer('sprites/64.png', 64, 64);
  const resultat = await lancer();
  expect(resultat.code).toBe(1);
  expect(resultat.message).toContain('64.png mesure 64 × 64');
  await expect(readdir(sorties)).rejects.toMatchObject({ code: 'ENOENT' });
});

it('lit les réglages depuis les données', async () => {
  const contenu = await readFile(script, 'utf8');
  expect(contenu).not.toMatch(/\b(?:1920|1080|82|96)\b/);
  expect(contenu).toContain('data/images.json');
});
