import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { genererIcones } from '../scripts/generer-icones.mjs';

it('livre cinq PNG aux bonnes tailles, opaques et reproductibles', async () => {
  const dossier = await mkdtemp(join(tmpdir(), 'pokiclicker-icones-'));
  try {
    await genererIcones(dossier);
    const tailles = { 'icon-192.png': 192, 'icon-512.png': 512, 'icon-maskable-512.png': 512,
      'apple-touch-icon.png': 180, 'favicon.png': 32 };
    const premiere = new Map<string, Buffer>();
    for (const [nom, taille] of Object.entries(tailles)) {
      const livree = await readFile(join('public/icons', nom));
      const meta = await sharp(livree).metadata();
      expect(meta).toMatchObject({ format: 'png', width: taille, height: taille, hasAlpha: false });
      premiere.set(nom, await readFile(join(dossier, nom)));
      expect(premiere.get(nom)!.equals(livree), nom).toBe(true);
    }
    await genererIcones(dossier);
    for (const nom of Object.keys(tailles)) {
      expect((await readFile(join(dossier, nom))).equals(premiere.get(nom)!), nom).toBe(true);
    }
  } finally { await rm(dossier, { recursive: true, force: true }); }
});
