import { execFile } from 'node:child_process';
import { mkdtemp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { afterEach, expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/preparer-decors-v1.mjs', import.meta.url));
const { decor } = JSON.parse(await readFile(new URL('../data/images.json', import.meta.url), 'utf8'));
const temporaires: string[] = [];
afterEach(async () => {
  for (const dossier of temporaires.splice(0)) await rm(dossier, { recursive: true, force: true });
});

async function preparer(slugs = ['zone'], lieu?: string) {
  const dossier = await mkdtemp(join(tmpdir(), 'pokiclicker-decors-'));
  temporaires.push(dossier);
  const sources = join(dossier, 'sources');
  const sorties = join(dossier, 'sorties');
  const zones = join(dossier, 'zones.json');
  await mkdir(sources);
  await mkdir(sorties);
  await writeFile(zones, JSON.stringify({
    zones: slugs.map((slug, ancienId) => ({ decor: `kanto/${slug}.webp`, ancienId, sansCombat: ancienId === 0 })),
    lieux: lieu ? [{ lieu, decor: `kanto/${lieu}.webp` }] : [],
  }));
  const creer = (nom: string, width: number, height: number) => sharp({
    create: { width, height, channels: 3, background: '#174e8b' },
  }).png().toFile(join(sources, nom));
  const lancer = (...options: string[]) => new Promise<{ code: number; message: string }>((resoudre) => {
    execFile(process.execPath, [script, '--sources', sources, '--sorties', sorties, '--zones', zones, ...options], (erreur, stdout, stderr) => {
      resoudre({ code: erreur ? 1 : 0, message: stdout + stderr });
    });
  });
  return { sources, sorties, creer, lancer };
}

it('recadre au centre une image large avec une perte de 1,92 %', async () => {
  const essai = await preparer();
  await essai.creer('Zone 0.png', 2784, 1536);
  const resultat = await essai.lancer();
  expect(resultat.code).toBe(0);
  expect(resultat.message).toContain('recadré (1,92 %');
  const { width, height } = await sharp(join(essai.sorties, 'zone.png')).metadata();
  expect(width).toBe(Math.round(height! * decor.ratio[0] / decor.ratio[1]));
});

it('copie une image au bon ratio sans la modifier', async () => {
  const essai = await preparer();
  await essai.creer('Zone 0.png', 3840, 2160);
  const resultat = await essai.lancer();
  expect(resultat.code).toBe(0);
  expect(resultat.message).toContain('inchangé');
  expect(await readFile(join(essai.sorties, 'zone.png'))).toEqual(await readFile(join(essai.sources, 'Zone 0.png')));
});

it.each([[2048, 2048], [2383, 1536], [200, 50]])('refuse une image %i × %i et poursuit les autres images', async (largeur, hauteur) => {
  const essai = await preparer(['refus', 'valide']);
  await essai.creer('Zone 0.png', largeur, hauteur);
  await essai.creer('Zone 1.png', decor.largeur, decor.hauteur);
  const resultat = await essai.lancer();
  expect(resultat.code).toBe(1);
  expect(resultat.message).toContain('Zone 0.png -> REFUSÉ');
  expect(resultat.message).toContain('1 écrits, 0 conservés, 0 agrandis, 1 refusés');
  expect(await readdir(essai.sorties)).toEqual(['valide.png']);
});

it('agrandit une petite zone et le décor de Chez Maman sans les déformer', async () => {
  const essai = await preparer(['zone'], 'chez-maman');
  await essai.creer('Zone 0.png', 1392, 768);
  await essai.creer('Chez Maman.png', 1201, 656);
  const resultat = await essai.lancer();
  expect(resultat.code).toBe(0);
  expect(resultat.message).toContain('2 agrandis');
  for (const slug of ['zone', 'chez-maman']) {
    const { width, height } = await sharp(join(essai.sorties, `${slug}.png`)).metadata();
    expect(width).toBeGreaterThanOrEqual(decor.largeur);
    expect(height).toBeGreaterThanOrEqual(decor.hauteur);
    expect(Math.abs(width! / height! - decor.ratio[0] / decor.ratio[1])).toBeLessThan(decor.tolerance);
  }
});

it('conserve une sortie existante et la remplace avec --forcer', async () => {
  const essai = await preparer();
  const destination = join(essai.sorties, 'zone.png');
  await writeFile(destination, 'ancien décor');
  await essai.creer('Zone 0.png', decor.largeur, decor.hauteur);
  const conserve = await essai.lancer();
  expect(conserve.code).toBe(0);
  expect(conserve.message).toContain('1 conservés');
  expect(await readFile(destination, 'utf8')).toBe('ancien décor');
  const remplace = await essai.lancer('--forcer');
  expect(remplace.code).toBe(0);
  expect(remplace.message).toContain('1 écrits');
  expect(await readFile(destination)).toEqual(await readFile(join(essai.sources, 'Zone 0.png')));
});

it('refuse un slug commun à une zone et un lieu avant toute écriture', async () => {
  const essai = await preparer(['labo'], 'labo');
  const resultat = await essai.lancer();
  expect(resultat.code).toBe(1);
  expect(resultat.message).toContain('Slug en double : labo');
  expect(await readdir(essai.sorties)).toEqual([]);
});
