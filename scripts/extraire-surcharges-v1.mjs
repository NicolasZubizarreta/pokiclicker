import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const source = await readFile(new URL('legacy/js/data/constants.js', racine), 'utf8');
const { BASE_STATS, BASE_HP } = runInNewContext(`${source}\n;({ BASE_STATS, BASE_HP })`, {});
const exceptions = new Set([49, 51, 83, 84, 101, 103, 117, 129]);
const surcharges = [];
/** @type {Record<string, { puissance: number, pv: number }>} */
const reference = {};
for (let numero = 1; numero <= 151; numero++) {
  const puissance = BASE_STATS[numero];
  const pv = BASE_HP[numero];
  if (!Number.isInteger(puissance) || !Number.isInteger(pv)) {
    throw new Error(`Stats V1 invalides pour le Pokémon n°${numero}`);
  }
  surcharges.push({
    pokemon: numero,
    pv,
    ...(exceptions.has(numero) ? { puissance } : {}),
    raison: exceptions.has(numero)
      ? 'Puissance et PV repris de la V1 (réglage à la main)'
      : 'PV repris de la V1 (réglage à la main)',
  });
  reference[numero] = { puissance, pv };
}
await mkdir(new URL('tests/fixtures/', racine), { recursive: true });
await writeFile(new URL('data/surcharges-stats.json', racine), JSON.stringify(surcharges, null, 2) + '\n');
await writeFile(new URL('tests/fixtures/v1-stats.json', racine), JSON.stringify(reference, null, 2) + '\n');
