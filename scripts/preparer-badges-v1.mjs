import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const racine = new URL('../', import.meta.url);
const sources = {
  roche: 'Roche.png',
  cascade: 'Cascade.png',
  foudre: 'Foudre.png',
  prisme: 'Prisme.png',
  ame: 'Âme.png',
  marais: 'Marais.png',
  volcan: 'Volcan.png',
  terre: 'Terre.png',
};

async function preparer() {
  const { badge } = JSON.parse(await readFile(new URL('data/images.json', racine), 'utf8'));
  const manifeste = new URL('public/img/tailles.json', racine);
  const tailles = JSON.parse(await readFile(manifeste, 'utf8'));
  await mkdir(new URL('public/img/badges/', racine), { recursive: true });
  for (const [id, source] of Object.entries(sources)) {
    const chemin = `img/badges/${id}.png`;
    await sharp(fileURLToPath(new URL(`legacy/img/kanto/badges/${source}`, racine)))
      .resize(badge.taille, badge.taille, {
        fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toFile(fileURLToPath(new URL(`public/${chemin}`, racine)));
    tailles[chemin] = { largeur: badge.taille, hauteur: badge.taille };
  }
  await writeFile(manifeste, `${JSON.stringify(tailles, null, 2)}\n`);
  console.log('Badges : 8 PNG préparés et enregistrés.');
}

preparer().catch((erreur) => {
  console.error(erreur);
  process.exitCode = 1;
});
