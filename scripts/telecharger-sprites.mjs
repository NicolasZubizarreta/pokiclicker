import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { planifier, telecharger } from './lib/telechargement.mjs';

const racine = fileURLToPath(new URL('../', import.meta.url));
/** @type {import('./lib/telechargement.mjs').Ressources} */
const ressources = JSON.parse(await readFile(resolve(racine, 'data/ressources-externes.json'), 'utf8'));
console.log(`Hôte unique contacté : ${ressources.hote}`);
/** @type {{ pokemon: { numero: number }[] }} */
const pokemon = JSON.parse(await readFile(resolve(racine, 'data/pokemon.json'), 'utf8'));
const plan = planifier({
  ressources,
  numeros: pokemon.pokemon.map(({ numero }) => numero),
  existe: (destination) => existsSync(resolve(racine, 'assets-src', destination))
    || (destination.startsWith('sprites/') && existsSync(resolve(racine, 'public/img/sprites/pokemon', destination.slice('sprites/'.length))))
    || (destination.startsWith('sprites-shiny/') && existsSync(resolve(racine, 'public/img/sprites/pokemon-shiny', destination.slice('sprites-shiny/'.length)))),
});
const ignores = ressources.fixes.length + pokemon.pokemon.length * 2 - plan.length;

if (process.argv.includes('--essai')) {
  console.log(`Essai : ${['objets', 'artworks', 'animes', 'sprites', 'sprites-shiny'].map((genre) => `${genre} : ${plan.filter(({ destination }) => destination.startsWith(`${genre}/`)).length}`).join(', ')} ; ${plan.length} fichiers à télécharger ; ${ignores} déjà présents ignorés.`);
  for (const { url, destination } of plan) console.log(`${url} → assets-src/${destination}`);
} else {
  let ecrits = 0;
  let refuses = 0;
  try {
    await telecharger({
      plan,
      fetch: (url) => globalThis.fetch(url, { redirect: 'error' }),
      tailleSprite: ressources.sprites.taille,
      mesurer: async (octets) => {
        const { width, height } = await sharp(octets).metadata();
        return { largeur: width, hauteur: height };
      },
      ecrire: async (destination, octets) => {
        const chemin = resolve(racine, 'assets-src', destination);
        await mkdir(dirname(chemin), { recursive: true });
        await writeFile(chemin, octets, { flag: 'wx' });
        ecrits++;
      },
    });
  } catch (erreur) {
    refuses = erreur instanceof AggregateError ? erreur.errors.length : 1;
    console.error(erreur instanceof Error ? erreur.message : String(erreur));
    process.exitCode = 1;
  }
  console.log(`Bilan : ${ecrits} écrits, ${ignores} déjà présents ignorés, ${refuses} refusés.`);
}
