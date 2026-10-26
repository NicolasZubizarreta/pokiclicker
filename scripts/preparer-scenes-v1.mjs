import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const racine = fileURLToPath(new URL('../', import.meta.url));
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

async function preparer() {
  const { values } = parseArgs({ options: {
    sources: { type: 'string' }, sorties: { type: 'string' },
  } });
  const sources = resolve(racine, values.sources ?? 'legacy/img/kanto');
  const reglages = JSON.parse(await readFile(join(racine, 'data/images.json'), 'utf8'));
  const sorties = resolve(racine, values.sorties ?? reglages.dossiers.sorties);
  const manifeste = join(sorties, 'tailles.json');
  /** @type {Record<string, { largeur: number, hauteur: number }>} */
  let tailles = {};
  try {
    tailles = JSON.parse(await readFile(manifeste, 'utf8'));
  } catch (erreur) {
    if (!(erreur instanceof Error && 'code' in erreur && erreur.code === 'ENOENT')) throw erreur;
  }
  const images = [
    { source: 'background/Zone 0.png', destination: 'scenes/bourg-palette.webp', type: 'scene' },
    { source: 'background/LaboPokemon.png', destination: 'scenes/labo.webp', type: 'scene' },
    { source: 'background/Pantheon.png', destination: 'scenes/pantheon.webp', type: 'scene' },
    { source: 'background/Chez Blue.png', destination: 'decors/chez-blue.webp', type: 'decor' },
    ...[1, 2, 3].map((n) => ({ source: `sprites/SpriteChen${n}.png`, destination: `sprites/chen/chen-${n}.png`, type: 'personnage' })),
  ];
  let ecrits = 0;
  let refuses = 0;
  for (const { source, destination, type } of images) {
    try {
      const chemin = join(sources, source);
      try {
        await access(chemin);
      } catch (erreur) {
        if (erreur instanceof Error && 'code' in erreur && erreur.code === 'ENOENT') throw new Error('source absente');
        throw erreur;
      }
      let traitement = sharp(chemin);
      if (type === 'personnage') {
        const taille = reglages.personnage.taille;
        const { data, info } = await traitement.resize({
          width: taille, height: taille, fit: 'inside', withoutEnlargement: true,
        }).png().toBuffer({ resolveWithObject: true });
        const gauche = Math.floor((taille - info.width) / 2);
        traitement = sharp(data).extend({
          left: gauche, right: taille - info.width - gauche,
          top: taille - info.height, bottom: 0, background: transparent,
        }).png();
      } else {
        const dimensions = reglages[type];
        if (type === 'decor') {
          // Coordonnées V1 : 88 px transparents de chaque côté avant conversion.
          traitement = traitement.extend({ left: 88, right: 88, top: 0, bottom: 0, background: transparent });
          // Matérialiser les bandes avant le redimensionnement de sharp.
          traitement = sharp(await traitement.png().toBuffer());
        }
        traitement = traitement.resize(dimensions.largeur, dimensions.hauteur, { fit: 'fill' })
          .webp({ quality: dimensions.qualiteWebp });
      }
      await mkdir(dirname(join(sorties, destination)), { recursive: true });
      const { data, info } = await traitement.toBuffer({ resolveWithObject: true });
      await writeFile(join(sorties, destination), data);
      tailles[`img/${destination}`] = { largeur: info.width, hauteur: info.height };
      console.log(`${source} -> ${destination}`);
      ecrits++;
    } catch (erreur) {
      console.error(`${source} -> REFUSÉ : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
      refuses++;
    }
  }
  await mkdir(sorties, { recursive: true });
  await writeFile(manifeste, `${JSON.stringify(tailles, null, 2)}\n`);
  console.log(`${ecrits} écrits, ${refuses} refusés`);
  if (refuses) process.exitCode = 1;
}

preparer().catch((erreur) => {
  console.error(erreur.message);
  process.exitCode = 1;
});
