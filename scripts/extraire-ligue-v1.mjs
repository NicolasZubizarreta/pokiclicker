import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const sansEffet = () => {};
const elements = new Map();
/** @type {Map<number, () => void>} */
const callbacks = new Map();
/** @type {{ texte: string, largeur: string }[]} */
const messages = [];
let periodeMs = 0;
/** @param {string} id */
const element = id => {
  if (!elements.has(id)) elements.set(id, {
    style: { width: '' }, classList: { add: sansEffet, remove: sansEffet },
  });
  return elements.get(id);
};
const contexte = createContext({
  bossTimer: null,
  Date: { now: () => 0 },
  document: { getElementById: element },
  showFeedback: (/** @type {string} */ texte) => messages.push({ texte, largeur: element('boss-timer-bar').style.width }),
  updateZone: sansEffet, updateUI: sansEffet, updateEnemyUI: sansEffet,
  checkBadges: sansEffet, enterHallOfFame: sansEffet,
  setInterval: (/** @type {() => void} */ rappel, /** @type {number} */ periode) => { periodeMs = periode; callbacks.set(1, rappel); return 1; },
  clearInterval: (/** @type {number} */ id) => callbacks.delete(id),
});
for (const fichier of ['legacy/js/data/constants.js', 'legacy/js/regions/kanto.js', 'legacy/js/game/combat.js']) {
  runInContext((await readFile(new URL(fichier, racine), 'utf8')).replace(/^\uFEFF/, ''), contexte);
}
runInContext(`
  function getActiveRegion() { return { zones: ZONES }; }
  function hasMilestone() { return false; }
  Math.random = () => 0.5;
`, contexte);
for (const nom of ['spawnEnemy', 'startBossTimer', 'getActiveRegion', 'ZONES']) {
  if (!runInContext(`typeof ${nom} !== 'undefined'`, contexte)) {
    throw new Error(`Variable globale V1 manquante dans le contexte vm : ${nom}`);
  }
}

/** @param {number} etape @param {number | null} starterId */
function relever(etape, starterId) {
  callbacks.clear();
  messages.length = 0;
  runInContext(`
    state = { zoneIdx: 21, subStage: ${etape}, starterId: ${starterId}, upgrades: {}, milestones: [], pokedex: [], currentRegion: 'kanto' };
    enemy = {};
    spawnEnemy();
  `, contexte);
  /** @type {{ name: string, id: number, level: number, maxHp: number, isBoss: boolean, catchRate: number }} */
  const { name, id, level, maxHp, isBoss, catchRate } = runInContext('enemy', contexte);
  if (typeof name !== 'string' || ![id, level, maxHp, catchRate].every(Number.isFinite) || maxHp <= 0 || isBoss !== true) {
    throw new Error(`spawnEnemy V1 n’a pas renseigné les champs attendus à l’étape ${etape}.`);
  }
  const rappel = callbacks.get(1);
  if (typeof rappel !== 'function') throw new Error('Le minuteur V1 n’a pas fourni de rappel.');
  const periode = periodeMs;
  const tops = [];
  for (let top = 0; top < 30; top++) {
    rappel();
    tops.push({ largeur: messages.at(-1)?.largeur ?? element('boss-timer-bar').style.width, expire: messages.length > 0 });
  }
  if (periode !== 1000 || tops.slice(0, 29).some(top => top.expire) || !tops[29]?.expire) {
    throw new Error(`Expiration V1 inattendue à l’étape ${etape}.`);
  }
  return { etape, starterId, name, id, level, maxHp, isBoss, catchRate, minuteur: { periodeMs: periode, tops } };
}

const combats = Array.from({ length: 10 }, (_, index) => relever(index + 1, null));
const counter = [1, 4, 7, null].map(starter => relever(10, starter));
const noms = combats.filter((_, index) => index % 2 === 0).map(combat => combat.name.split(' (')[0] ?? combat.name);
const dresseurs = noms.map(nom => ({
  id: nom.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replaceAll(' ', '-'), nom,
}));
const zone = 'kanto.ligue-pokemon';
const zones = JSON.parse(await readFile(new URL('data/regions/kanto/zones.json', racine), 'utf8'));
const reference = zones.zones.find((/** @type {{ id: string }} */ candidate) => candidate.id === zone);
if (!reference || reference.adversaires.length !== 9) throw new Error('Zone de Ligue invalide.');
for (const [index, combat] of combats.entries()) {
  const adversaire = index === 9 ? reference.boss : reference.adversaires[index];
  if (adversaire.pokemon !== combat.id || adversaire.nom !== combat.name || adversaire.niveau !== combat.level || adversaire.capture !== combat.catchRate || !combat.isBoss) {
    throw new Error(`L’étape ${index + 1} diffère de la V1 dans zones.json.`);
  }
}
const donnees = {
  version: 1, zone,
  combats: combats.map((combat, index) => {
    const dresseur = dresseurs[Math.floor(index / 2)];
    if (!dresseur) throw new Error(`Dresseur manquant à l’étape ${combat.etape}.`);
    return {
      etape: combat.etape, dresseur: dresseur.id,
      nom: combat.name, pokemon: combat.id, niveau: combat.level,
      minuteurMs: combat.minuteur.periodeMs * combat.minuteur.tops.length,
    };
  }),
  dresseurs,
  counter: counter.filter(combat => combat.starterId !== null).map(combat => ({
    starter: combat.starterId, pokemon: combat.id, nom: combat.name,
  })),
  messages: {
    enchainement: 'Victoire contre {dresseur} ! {suivant} entre en scène.',
    victoire: 'Victoire contre {dresseur} !',
    defaite: 'Temps écoulé ! Retour au premier Pokémon de {dresseur}.',
  },
};
/** @type {Array<[string, unknown]>} */
const sorties = [
  ['data/ligue.json', donnees],
  ['tests/fixtures/v1-ligue.json', {
    source: 'legacy/js/game/combat.js', aleatoire: [0.5], combats, counter,
  }],
];
const empreinte = createHash('sha256');
for (const [chemin, contenu] of sorties) {
  const texte = JSON.stringify(contenu, null, 2) + '\n';
  if (process.argv.includes('--verifier')) {
    if (await readFile(new URL(chemin, racine), 'utf8') !== texte) {
      throw new Error(`${chemin} diffère de la V1 : relancer node scripts/extraire-ligue-v1.mjs`);
    }
  } else {
    await writeFile(new URL(chemin, racine), texte);
  }
  empreinte.update(texte);
}
console.log(`Empreinte SHA-256 : ${empreinte.digest('hex')}`);
