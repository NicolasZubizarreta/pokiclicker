// PROVISOIRE : à remplacer par les décors régénérés de la phase 5.
import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const racine = fileURLToPath(new URL('../', import.meta.url));
/** @type {Record<string, string>} */
const lieux = {
  pension: 'Pension.png',
  labo: 'LaboPokemon.png',
  'chez-blue': 'Chez Blue.png',
  'chez-maman': 'Chez Maman.png',
  pantheon: 'Pantheon.png',
  'centre-commercial': 'CentreCommercial.png',
  casino: 'Casino.png',
};

/** @param {string} chemin */
async function existe(chemin) {
  try {
    await access(chemin);
    return true;
  } catch (erreur) {
    if (erreur instanceof Error && 'code' in erreur && erreur.code === 'ENOENT') return false;
    throw erreur;
  }
}

async function preparer() {
  const { values } = parseArgs({ options: {
    sources: { type: 'string' }, sorties: { type: 'string' },
    zones: { type: 'string' }, forcer: { type: 'boolean', default: false },
  } });
  const sources = resolve(racine, values.sources ?? 'legacy/img/kanto/background');
  const sorties = resolve(racine, values.sorties ?? 'assets-src/decors');
  const { decor } = JSON.parse(await readFile(join(racine, 'data/images.json'), 'utf8'));
  /** @type {{ zones: { decor: string, ancienId: number }[], lieux: { decor: string, lieu: string }[] }} */
  const donnees = JSON.parse(await readFile(resolve(racine, values.zones ?? 'data/regions/kanto/zones.json'), 'utf8'));
  const images = [
    ...donnees.zones.map((zone) => ({ slug: basename(zone.decor, '.webp'), source: `Zone ${zone.ancienId}.png` })),
    ...donnees.lieux.map((lieu) => ({ slug: basename(lieu.decor, '.webp'), source: lieux[lieu.lieu] })),
  ];
  const slugs = new Set();
  for (const { slug } of images) {
    if (slugs.has(slug)) throw new Error(`Slug en double : ${slug}`);
    slugs.add(slug);
  }
  await mkdir(sorties, { recursive: true });
  const ratio = decor.ratio[0] / decor.ratio[1];
  let ecrits = 0;
  let conserves = 0;
  let agrandis = 0;
  const refuses = [];
  for (const { slug, source } of images) {
    try {
      if (!source) throw new Error('Correspondance V1 inconnue');
      const destination = join(sorties, `${slug}.png`);
      if (!values.forcer && await existe(destination)) {
        console.log(`${slug} : ${source} -> conservé`);
        conserves++;
        continue;
      }
      const chemin = join(sources, source);
      const { width: largeur, height: hauteur } = await sharp(chemin).metadata();
      if (!largeur || !hauteur) throw new Error('Dimensions introuvables');
      let nouvelleLargeur = largeur;
      let perte = 0;
      if (Math.abs(largeur / hauteur - ratio) > decor.tolerance) {
        if (largeur / hauteur < ratio) throw new Error('Image trop étroite ou carrée, recadrage vertical interdit');
        nouvelleLargeur = Math.round(hauteur * ratio);
        perte = 1 - nouvelleLargeur / largeur;
        if (perte > decor.perteMax) throw new Error('Perte de bord supérieure au maximum autorisé');
      }
      let traitement = sharp(chemin);
      if (perte > 0) traitement = traitement.extract({
        left: Math.floor((largeur - nouvelleLargeur) / 2), top: 0,
        width: nouvelleLargeur, height: hauteur,
      });
      const agrandi = nouvelleLargeur < decor.largeur || hauteur < decor.hauteur;
      if (agrandi) traitement = traitement.resize({
        width: decor.largeur, height: decor.hauteur, fit: 'outside', kernel: sharp.kernel.lanczos3,
      });
      if (!agrandi && perte === 0) {
        await copyFile(chemin, destination, values.forcer ? 0 : constants.COPYFILE_EXCL);
      } else {
        await writeFile(destination, await traitement.png().toBuffer(), { flag: values.forcer ? 'w' : 'wx' });
      }
      ecrits++;
      if (agrandi) agrandis++;
      // Affichage avant arrondi au pixel ; le seuil utilise la perte réelle.
      const perteAffichee = 1 - hauteur * ratio / largeur;
      const action = perte > 0
        ? `recadré (${(perteAffichee * 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} % de bord perdus)`
        : 'inchangé (0,00 % de bord perdus)';
      console.log(`${slug} : ${source} ${largeur} × ${hauteur} -> ${action}${agrandi ? ', agrandi' : ''}`);
    } catch (erreur) {
      const refus = `${slug} : ${source ?? slug} -> REFUSÉ : ${erreur instanceof Error ? erreur.message : String(erreur)}`;
      refuses.push(refus);
      console.error(refus);
    }
  }
  console.log(`Bilan : ${ecrits} écrits, ${conserves} conservés, ${agrandis} agrandis, ${refuses.length} refusés.`);
  if (refuses.length) {
    console.error(`Liste des refusés :\n${refuses.join('\n')}`);
    process.exitCode = 1;
  }
}

preparer().catch((erreur) => {
  console.error(`REFUSÉ : ${erreur instanceof Error ? erreur.message : String(erreur)}`);
  process.exitCode = 1;
});
