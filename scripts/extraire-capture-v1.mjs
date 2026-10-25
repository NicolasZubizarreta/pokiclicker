import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const sansEffet = () => {};
const element = { style: {}, classList: { add: sansEffet, remove: sansEffet }, firstElementChild: { innerHTML: '' } };
const math = Object.create(Math);
math.random = () => 0.5;
/** @type {string | null} */
let destination = null;
/** @type {string | null} */
let nom = null;
/** @type {number | null} */
let niveau = null;
/** @param {string} cible */
const enregistrer = cible => (/** @type {number} */ _id, /** @type {string} */ name, /** @type {number} */ level) => { destination = cible; nom = name; niveau = level; };
const contexte = createContext({
  Math: math, Date: { now: () => 0 },
  bossTimer: null, resumeAutoBattle: sansEffet,
  document: { getElementById: () => element },
  setTimeout: (/** @type {() => void} */ rappel) => rappel(), setInterval: () => 1, clearInterval: sansEffet,
  showFeedback: sansEffet, updateUI: sansEffet, renderBag: sansEffet,
  updateZone: sansEffet, updateEnemyUI: sansEffet, playTone: sansEffet,
  addToPokedex: sansEffet, addToTeam: enregistrer('equipe'), addToPC: enregistrer('pc'),
  updateAutoBtn: sansEffet, updateAutoClickerBtn: sansEffet,
});
for (const fichier of ['legacy/js/data/constants.js', 'legacy/js/game/stats.js', 'legacy/js/game/combat.js', 'legacy/js/game/capture.js']) {
  runInContext((await readFile(new URL(fichier, racine), 'utf8')).replace(/^\uFEFF/, ''), contexte);
}
runInContext(`
  var marais = false;
  function hasBadge(nom) { return nom === 'Marais' && marais; }
  function hasMilestone() { return false; }
  var zone = { minLevel: 2, maxLevel: 2,
    pokemons: [{ id: 19, name: 'Rattata', rarity: 'Commun', catchRate: 255, spawnRate: 1 }],
    boss: { id: 19, name: 'Rattata', level: 2, catchRate: 0 } };
  function getActiveRegion() { return { zones: [zone] }; }
`, contexte);
const executer = (/** @type {string} */ code) => runInContext(code, contexte);
/** @type {[string, string, string][]} */
const balles = [['poke', 'pokeball', 'balls'], ['super', 'superball', 'superballs'],
  ['hyper', 'hyperball', 'hyperballs'], ['master', 'masterball', 'masterball']];
const chances = [];
for (const capture of [3, 45, 120, 190, 255]) {
  for (let i = 0; i < 6; i++) {
    const index = (capture + i) % 4;
    const ennemi = { capture, pv: [100, 50, 1][i % 3], pvMax: 100, niveau: [2, 30, 70][i % 3] };
    const [type, cle] = balles[index] ?? ['poke', 'pokeball'];
    const marais = i >= 3;
    executer(`enemy = ${JSON.stringify({ catchRate: capture, hp: ennemi.pv, maxHp: 100, level: ennemi.niveau, dead: false })}; marais = ${marais}`);
    chances.push({ ennemi, cle, marais, chance: executer(`getCatchChance('${type}')`) });
  }
}

/** @type {object[]} */
const lancers = [];
function extraireLancers() {
// La réapparition n'appartient pas à l'observation du lancer ; spawnEnemy reste réel pour les arrêts.
executer('var spawnOriginal = spawnEnemy;');
for (const [index, [type, cle]] of balles.entries()) {
  const taille = index === 1 ? 6 : 5;
  const alea = index === 2 ? 0.99 : index === 3 ? 0.999 : 0;
  const ennemi = { capture: index === 3 ? 3 : 255, pv: 100, pvMax: 100, niveau: 2 };
  math.random = () => alea;
  destination = nom = niveau = null;
  executer(`spawnEnemy = function () {}; marais = false;
    state = { inv: { balls: 2, superballs: 2, hyperballs: 2, masterball: 2, candy: 0 },
      team: Array(${taille}).fill({}), money: 100, subStage: 1, upgrades: {} };
    enemy = { uid: 1, id: 19, name: 'Rattata (sauvage)', level: 2, catchRate: ${ennemi.capture},
      hp: 100, maxHp: 100, dead: false, isShiny: false, isBoss: false, rarity: 'Commun' };
    attemptCatch('${type}');`);
  const stocks = Object.fromEntries(balles.map(([, cleStock, v1]) => [cleStock, executer(`state.inv.${v1}`)]));
  lancers.push({ ennemi, cle, taille, alea, succes: destination !== null, stocks,
    or: executer('state.money - 100'), destination, nom, niveau });
}
executer('spawnEnemy = spawnOriginal;');
}

const raretes = ['Commun', 'Peu Commun', 'Rare', 'Très Rare', 'Légendaire'];
const cles = ['commun', 'peuCommun', 'rare', 'tresRare', 'legendaire', 'shiny', 'nouveau'];
const valeurs = ['commun', 'peu-commun', 'rare', 'tres-rare', 'legendaire'];
/** @type {{cle: string, rarete: number, shiny?: boolean, nouveau?: boolean, actif?: boolean, auto?: boolean, boss?: boolean, coche?: boolean}[]} */
const scenarios = cles.map((cle, i) => ({ cle, rarete: Math.min(i, 4), shiny: i === 5, nouveau: i === 6 }));
scenarios.push(
  { cle: 'rare', rarete: 2, actif: false },
  { cle: 'rare', rarete: 2, auto: false },
  { cle: 'nouveau', rarete: 0, boss: true, nouveau: true },
  { cle: 'shiny', rarete: 0, shiny: true, coche: false },
  { cle: 'rare', rarete: 2, shiny: true },
  { cle: 'rare', rarete: 0, nouveau: true },
  { cle: 'nouveau', rarete: 0, nouveau: true, coche: false },
  { cle: 'nouveau', rarete: 0, nouveau: true, shiny: true },
);
const arrets = [];
for (const cas of scenarios) {
  const reglages = Object.fromEntries(cles.map(cle => [cle, cle === cas.cle && cas.coche !== false]));
  reglages.actif = cas.actif !== false;
  const auto = cas.auto !== false;
  const shiny = cas.shiny === true;
  const nouveau = cas.nouveau === true;
  const boss = cas.boss === true;
  math.random = () => shiny ? 0 : 0.5;
  element.firstElementChild.innerHTML = '';
  const settings = Object.fromEntries([...raretes, 'Shiny', 'Nouveau'].map((label, i) => [label, reglages[cles[i] ?? '']]));
  executer(`zone.pokemons[0].rarity = ${JSON.stringify(raretes[cas.rarete])};
    state = { zoneIdx: 0, subStage: ${boss ? 10 : 1}, upgrades: {},
      pokedex: ${nouveau ? '[]' : '[19]'}, stopOnRare: ${reglages.actif}, auto: ${auto},
      autoClicker: false, autoStopSettings: ${JSON.stringify(settings)} };
    enemy = {}; spawnEnemy();`);
  const html = element.firstElementChild.innerHTML;
  arrets.push({ reglages, auto, shiny, nouveau, boss, rarete: valeurs[cas.rarete],
    arret: auto && !executer('state.auto'), message: html ? html.replace(/^.*<\/span> /, '') : null });
}
extraireLancers();
const texte = JSON.stringify({ chances, lancers, arrets }, null, 2) + '\n';
const cible = new URL('tests/fixtures/v1-capture.json', racine);
if (process.argv.includes('--verifier')) {
  if (await readFile(cible, 'utf8') !== texte) throw new Error('Fixture capture différente de la V1.');
} else {
  await writeFile(cible, texte);
}
console.log(`Empreinte SHA-256 : ${createHash('sha256').update(texte).digest('hex')}`);
