// Prépare les décors générés par IA (Gemini) : retire le logo de génération en bas à droite, met au format 16:9,
// écrit le WebP dans public/img/decors/ et enregistre sa taille dans tailles.json.
// Usage : déposer les images dans assets-src/decors-gemini/ sous le nom du lieu (ex. route-1.png), puis
//   node scripts/preparer-decors-gemini.mjs [--marge 0.105] [--sources <dossier>] [--sorties <dossier>]
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises';
import { basename, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import sharp from 'sharp';

const racine = fileURLToPath(new URL('../', import.meta.url));
/** Lieux sans décor livré avec la V1 (Route de Ronflex : fond dédié, voir docs/projet/decors-a-regenerer.md). */
const EN_PLUS = ['route-de-ronflex'];

/**
 * Fenêtre 16:9 ancrée en haut à gauche, après retrait d'une marge `marge` (part de la largeur et de la hauteur) à droite et en bas,
 * là où Gemini place son logo. Garde le plus grand 16:9 possible, centré dans la largeur restante.
 * @param {number} largeur @param {number} hauteur @param {number} marge
 */
export function fenetre(largeur, hauteur, marge) {
  const dispoL = Math.floor(largeur * (1 - marge));
  const dispoH = Math.floor(hauteur * (1 - marge));
  if (dispoL / dispoH >= 16 / 9) {
    const h = dispoH;
    const l = Math.round(h * 16 / 9);
    return { left: Math.floor((dispoL - l) / 2), top: 0, width: l, height: h };
  }
  return { left: 0, top: 0, width: dispoL, height: Math.round(dispoL * 9 / 16) };
}

async function preparer() {
  const { values } = parseArgs({ options: {
    sources: { type: 'string' }, sorties: { type: 'string' }, marge: { type: 'string', default: '0.105' },
  } });
  const marge = Number(values.marge);
  if (!(marge >= 0 && marge < 0.3)) throw new Error('--marge doit être entre 0 et 0,3.');
  const { decor, dossiers } = JSON.parse(await readFile(join(racine, 'data/images.json'), 'utf8'));
  const sources = resolve(racine, values.sources ?? 'assets-src/decors-gemini');
  const sorties = resolve(racine, values.sorties ?? dossiers.sorties);
  const tailles = join(sorties, 'tailles.json');
  const zones = JSON.parse(await readFile(join(racine, 'data/regions/kanto/zones.json'), 'utf8'));
  const connus = new Set([...zones.zones, ...zones.lieux].map((l) => basename(l.decor, '.webp')).concat(EN_PLUS));
  const fichiers = (await readdir(sources)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort();
  if (!fichiers.length) throw new Error(`Aucune image dans ${sources}.`);
  const erreurs = [];
  const prets = [];
  for (const fichier of fichiers) {
    const slug = basename(fichier, extname(fichier));
    if (!connus.has(slug)) { erreurs.push(`${fichier} : nom inconnu (attendu : ${[...connus].sort().join(', ')}).`); continue; }
    const source = sharp(await readFile(join(sources, fichier)));
    const { width, height } = await source.metadata();
    const zone = fenetre(width, height, marge);
    if (zone.width < decor.largeur) { erreurs.push(`${fichier} : ${width} × ${height}, trop petite (il faut au moins ${decor.largeur} px de large après recadrage, ici ${zone.width}).`); continue; }
    prets.push({ slug, contenu: await source.extract(zone).resize(decor.largeur, decor.hauteur).webp({ quality: decor.qualiteWebp }).toBuffer() });
  }
  if (erreurs.length) throw new Error(erreurs.join('\n'));
  await mkdir(join(sorties, 'decors'), { recursive: true });
  const manifeste = JSON.parse(await readFile(tailles, 'utf8'));
  for (const { slug, contenu } of prets) {
    await writeFile(join(sorties, 'decors', `${slug}.webp`), contenu);
    manifeste[`img/decors/${slug}.webp`] = { largeur: decor.largeur, hauteur: decor.hauteur };
    console.log(`${slug}.webp écrit`);
  }
  await writeFile(tailles, `${JSON.stringify(manifeste, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  preparer().catch((erreur) => { console.error(`Préparation impossible :\n${erreur.message}`); process.exitCode = 1; });
}
