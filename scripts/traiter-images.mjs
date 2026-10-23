import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve, relative, join, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const racine = fileURLToPath(new URL('../', import.meta.url));
const reglages = JSON.parse(await readFile(join(racine, 'data/images.json'), 'utf8'));

async function traiter() {
  const { values } = parseArgs({ options: { sources: { type: 'string' }, sorties: { type: 'string' } } });
  const sources = resolve(racine, values.sources ?? reglages.dossiers.sources);
  const sorties = resolve(racine, values.sorties ?? reglages.dossiers.sorties);
  const manifeste = join(sorties, relative(resolve(racine, reglages.dossiers.sorties),
    resolve(racine, reglages.dossiers.tailles)));
  const erreurs = [];
  const fichiers = [];
  const destinations = new Set();
  for (const genre of ['decors', 'sprites']) {
    const dossier = join(sources, genre);
    const entrees = await readdir(dossier, { withFileTypes: true }).catch((erreur) => {
      if (erreur.code === 'ENOENT') return [];
      throw erreur;
    });
    for (const entree of entrees.sort((a, b) => a.name.localeCompare(b.name))) {
      if (!entree.isFile() || !(genre === 'decors' ? /\.(png|jpe?g|webp)$/i : /\.png$/i).test(entree.name)) continue;
      const nom = entree.name;
      try {
        const source = await readFile(join(dossier, nom));
        const image = sharp(source);
        const { width: largeur, height: hauteur } = await image.metadata();
        if (!largeur || !hauteur) throw new Error('Dimensions illisibles.');
        const decor = genre === 'decors';
        if (decor) {
          const { ratio, tolerance, largeur: cibleL, hauteur: cibleH } = reglages.decor;
          if (Math.abs(largeur / hauteur - ratio[0] / ratio[1]) > tolerance) {
            erreurs.push(`Décor refusé : ${nom} a le ratio ${(Math.round(largeur / hauteur * 10000) / 10000).toString().replace('.', ',')} (attendu ${ratio.join(':')}). Il n'est pas recadré.`);
          }
          if (largeur < cibleL || hauteur < cibleH) {
            erreurs.push(`Décor refusé : ${nom} mesure ${largeur} × ${hauteur}, trop petit pour ${cibleL} × ${cibleH}.`);
          }
        } else if (largeur !== reglages.sprite.taille || hauteur !== reglages.sprite.taille) {
          erreurs.push(`Sprite refusé : ${nom} mesure ${largeur} × ${hauteur} (attendu ${reglages.sprite.taille} × ${reglages.sprite.taille}).`);
        }
        const normalise = basename(nom, extname(nom)).normalize('NFD').replace(/\p{M}/gu, '')
          .toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
        if (!normalise) throw new Error('Nom de fichier inutilisable.');
        const chemin = `${genre === 'sprites' ? 'sprites/pokemon' : genre}/${normalise}.${decor ? 'webp' : 'png'}`;
        if (destinations.has(chemin)) throw new Error(`Nom de sortie en double : ${chemin}.`);
        destinations.add(chemin);
        fichiers.push({ chemin, source, decor, largeur, hauteur });
      } catch (erreur) {
        erreurs.push(`Image refusée : ${nom}. ${erreur instanceof Error ? erreur.message : String(erreur)}`);
      }
    }
  }
  if (erreurs.length) throw new Error(erreurs.join('\n'));
  // Tout encoder avant d'écrire : une source illisible ne laisse aucune sortie partielle.
  const contenus = await Promise.all(fichiers.map(async (fichier) => ({ ...fichier,
    // Le ratio est déjà validé à la tolérance près : 'fill' ne déforme qu'au plus cette tolérance, sans bande ni recadrage.
    contenu: fichier.decor ? await sharp(fichier.source).resize(reglages.decor.largeur, reglages.decor.hauteur,
      { fit: 'fill' })
      .webp({ quality: reglages.decor.qualiteWebp }).toBuffer() : fichier.source,
  })));
  /** @type {Record<string, {largeur: number, hauteur: number}>} */
  const tailles = {};
  for (const fichier of contenus.sort((a, b) => a.chemin < b.chemin ? -1 : a.chemin > b.chemin ? 1 : 0)) {
    const destination = join(sorties, fichier.chemin);
    await mkdir(dirname(destination), { recursive: true });
    await writeFile(destination, fichier.contenu);
    tailles[`img/${fichier.chemin}`] = fichier.decor
      ? { largeur: reglages.decor.largeur, hauteur: reglages.decor.hauteur }
      : { largeur: fichier.largeur, hauteur: fichier.hauteur };
  }
  await mkdir(dirname(manifeste), { recursive: true });
  await writeFile(manifeste, `${JSON.stringify(tailles, null, 2)}\n`);
}

traiter().catch((erreur) => {
  console.error(`Traitement des images impossible : ${erreur.message}`);
  process.exitCode = 1;
});
