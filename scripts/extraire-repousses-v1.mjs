import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const sansEffet = () => {};
const element = { classList: { add: sansEffet, remove: sansEffet }, style: {}, innerHTML: '' };
const math = Object.create(Math);
/** @type {number[]} */
let tirages = [];
math.random = () => {
  const valeur = tirages.shift();
  if (valeur === undefined) throw new Error('Tirage V1 inattendu.');
  return valeur;
};
const contexte = createContext({
  Math: math, Date: { now: () => 0 },
  document: { getElementById: () => element },
  stopBossTimer: sansEffet, startBossTimer: sansEffet,
  updateUI: sansEffet, updateZone: sansEffet, updateEnemyUI: sansEffet,
  updateAutoBtn: sansEffet, updateAutoClickerBtn: sansEffet,
  hasMilestone: () => false,
});
for (const fichier of ['legacy/js/data/constants.js', 'legacy/js/regions/kanto.js', 'legacy/js/game/combat.js']) {
  runInContext((await readFile(new URL(fichier, racine), 'utf8')).replace(/^\uFEFF/, ''), contexte);
}
contexte.stopBossTimer = sansEffet;
contexte.startBossTimer = sansEffet;
runInContext('var enemy = {}; var state; function getActiveRegion() { return { zones: ZONES }; }', contexte);
const zones = [...(await readFile(new URL('data/regions/kanto/zones.json', racine), 'utf8')).matchAll(/"id":\s*"([^"]+)"/g)].map(match => match[1]);
if (zones.length !== 22 || zones[2] !== 'kanto.foret-de-jade' || runInContext('ZONES.length', contexte) !== zones.length) {
  throw new Error('Ordre des zones Kanto inattendu.');
}
const valeurs = [...Array.from({ length: 100 }, (_, i) => i / 100), 0.999];
const apparitions = [];
for (const [zoneIdx, zone] of zones.entries()) {
  if (!runInContext(`ZONES[${zoneIdx}].pokemons.length > 0`, contexte)) continue;
  for (const objet of ['aucune', 'repel', 'superRepel']) {
    for (const r of valeurs) {
      contexte.state = { zoneIdx, subStage: 1, upgrades: {}, pokedex: [], stopOnRare: false,
        repelEndTime: objet === 'repel' ? 1 : 0, superRepelEndTime: objet === 'superRepel' ? 1 : 0 };
      tirages = [0.99, r, 0.5, 0.5];
      runInContext('spawnEnemy()', contexte);
      apparitions.push({ zone, objet, r, id: runInContext('enemy.id', contexte) });
    }
  }
}
const contenu = JSON.stringify({ apparitions }, null, 2) + '\n';
const empreinte = createHash('sha256').update(contenu).digest('hex');
const cible = new URL('tests/fixtures/v1-repousses.json', racine);
if (process.argv.includes('--verifier')) {
  if (await readFile(cible, 'utf8') !== contenu) throw new Error('Fixture des repousses V1 différente.');
} else {
  await writeFile(cible, contenu);
}
console.log(`${apparitions.length} apparitions ; SHA-256 ${empreinte}`);
