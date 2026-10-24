import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
/** @type {Map<number, () => void>} */
const callbacks = new Map();
/** @type {number[]} */
const appels = [];
/** @type {string[]} */
const messages = [];
const styles = {};
const sansEffet = () => {};
const elements = new Map();
/** @param {string} id */
const element = id => {
  if (!elements.has(id)) elements.set(id, {
    style: styles,
    classList: { add: sansEffet, remove: sansEffet },
  });
  return elements.get(id);
};
const contexte = createContext({
  Date: { now: () => 0 },
  document: { getElementById: element },
  showFeedback: (/** @type {string} */ texte) => messages.push(texte),
  updateZone: sansEffet, updateUI: sansEffet, updateEnemyUI: sansEffet,
  checkBadges: sansEffet, enterHallOfFame: sansEffet,
  setInterval: (/** @type {() => void} */ rappel) => { callbacks.set(1, rappel); return 1; },
  clearInterval: (/** @type {number} */ id) => callbacks.delete(id),
});
for (const fichier of ['legacy/js/data/constants.js', 'legacy/js/regions/kanto.js', 'legacy/js/game/combat.js']) {
  runInContext((await readFile(new URL(fichier, racine), 'utf8')).replace(/^\uFEFF/, ''), contexte);
}
runInContext('function getActiveRegion() { return { zones: ZONES }; }', contexte);
runInContext('function hasMilestone() { return false; }', contexte);
// Compte les appels à spawnEnemy (appelé par name au moment de l'échec) sans changer son comportement.
contexte.compterSpawn = () => appels.push(1);
runInContext('{ const origine = spawnEnemy; spawnEnemy = function () { compterSpawn(); return origine.apply(this, arguments); }; }', contexte);

/** Vérifie qu'une dépendance globale V1 existe avant de l'utiliser. @param {string} nom */
function exiger(nom) {
  if (runInContext(`typeof ${nom} !== 'undefined'`, contexte) !== true) {
    throw new Error(`Variable globale V1 manquante dans le contexte vm : ${nom}`);
  }
}
for (const nom of ['spawnEnemy', 'startBossTimer', 'getActiveRegion', 'ZONES']) exiger(nom);

const periodeMs = 1000;
const cas = [];
for (const zoneIdx of [5, 20, 21]) {
  runInContext(`state = { zoneIdx: ${zoneIdx}, subStage: 10, starterId: null, upgrades: {}, milestones: [], pokedex: [], currentRegion: 'kanto' }`, contexte);
  runInContext('enemy = { dead: false }', contexte);
  appels.length = 0;
  messages.length = 0;
  callbacks.clear();
  runInContext('startBossTimer()', contexte);
  const rappel = callbacks.get(1);
  if (typeof rappel !== 'function') throw new Error('Le minuteur V1 n’a pas fourni de rappel à setInterval.');
  let topsAvantExpiration = 0;
  // Expiration = le message d'échec est affiché ; on ne continue pas au-delà (spawnEnemy peut relancer un minuteur).
  while (messages.length === 0 && topsAvantExpiration < 31) { rappel(); topsAvantExpiration++; }
  cas.push({ zoneIdx, subStageFinal: runInContext('state.subStage', contexte), message: messages.at(-1) ?? null, appelsSpawn: appels.length });
  if (topsAvantExpiration !== 30) throw new Error(`Expiration V1 inattendue pour la zone ${zoneIdx} : ${topsAvantExpiration} tops.`);
}

const ligue = [];
const suiteAleatoire = [0.5];
for (let etape = 1; etape <= 10; etape++) {
  runInContext(`state = { zoneIdx: 21, subStage: ${etape}, starterId: null, upgrades: {}, milestones: [], pokedex: [], currentRegion: 'kanto' }`, contexte);
  runInContext('enemy = {}', contexte);
  contexte.Math = Object.create(Math);
  contexte.Math.random = () => suiteAleatoire[0];
  runInContext('spawnEnemy()', contexte);
  const ennemi = runInContext('enemy', contexte);
  if (ennemi.id === undefined || ennemi.level === undefined || ennemi.maxHp === undefined || ennemi.isBoss === undefined || ennemi.catchRate === undefined) {
    throw new Error(`spawnEnemy V1 n’a pas renseigné tous les champs pour l’étape ${etape}.`);
  }
  ligue.push({ etape, id: ennemi.id, niveau: ennemi.level, pvMax: ennemi.maxHp, boss: ennemi.isBoss, tauxCapture: ennemi.catchRate });
}

const donnees = {
  source: 'legacy/js/game/combat.js',
  minuteur: { periodeMs, topsAvantExpiration: 30, cas },
  ligue,
  commentaire: 'La pénalité V1 remet la zone 20 à l’étape 1, tandis que la zone 21 revient à l’étape 9. La suite Math.random déterministe utilisée pour la Ligue est [0.5].',
};
const texte = JSON.stringify(donnees, null, 2) + '\n';
if (process.argv.includes('--verifier')) {
  if ((await readFile(new URL('tests/fixtures/v1-boss.json', racine), 'utf8')) !== texte) {
    throw new Error('tests/fixtures/v1-boss.json diffère de la V1 : relancer node scripts/extraire-boss-v1.mjs');
  }
  const { createHash } = await import('node:crypto');
  console.log(`Empreinte SHA-256 : ${createHash('sha256').update(texte).digest('hex')}`);
} else {
  await mkdir(new URL('tests/fixtures/', racine), { recursive: true });
  await writeFile(new URL('tests/fixtures/v1-boss.json', racine), texte);
  const { createHash } = await import('node:crypto');
  console.log(`Empreinte SHA-256 : ${createHash('sha256').update(texte).digest('hex')}`);
}
