import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';
import { graine } from './lib/graine.mjs';

const racine = new URL('../', import.meta.url);
const sansEffet = () => {};
const contexte = createContext({
  window: {}, bossTimer: null,
  document: { getElementById: () => ({ classList: { add: sansEffet, remove: sansEffet } }) },
  playTone: sansEffet, renderTeam: sansEffet, renderShop: sansEffet,
  updateUI: sansEffet, updateZone: sansEffet,
  resumeAutoBattle: sansEffet, checkBadges: sansEffet, checkMilestones: sansEffet,
  getActiveRegion: () => ({ zones: [] }),
  getSprite: () => 'sprite-fixe', setTimeout: sansEffet,
});
for (const fichier of ['data/constants', 'game/stats', 'game/team', 'game/combat', 'game/daycare']) {
  runInContext((await readFile(new URL(`legacy/js/${fichier}.js`, racine), 'utf8')).replace(/^\uFEFF/, ''), contexte);
}
for (const nom of Object.keys(contexte).filter((nom) => nom.startsWith('render'))) contexte[nom] = sansEffet;
contexte.renderPC = sansEffet;
runInContext('Date.now = () => 1700000000000', contexte);
const ajouterPokedex = runInContext('addToPokedex', contexte);
/** @type {number[]} */
let appelsPokedex = [];
/** @type {Array<[string, string]>} */
let messages = [];
contexte.addToPokedex = (/** @type {number} */ numero) => {
  appelsPokedex.push(numero);
  ajouterPokedex(numero);
};
contexte.showFeedback = (/** @type {string} */ texte, /** @type {string} */ couleur) => { messages.push([texte, couleur]); };
let tirages = 0;
const valeurGraine = 20261025;
function reinitialiser() {
  appelsPokedex = [];
  messages = [];
  tirages = 0;
  const suivant = graine(valeurGraine);
  contexte.tirer = () => { tirages++; return suivant(); };
  runInContext('Math.random = tirer', contexte);
  return runInContext(`state = {
    team: [], pc: [], pokedex: [], badges: [], milestones: [], upgrades: {},
    inv: { candy: 0, omniExp: 0 }, stats: { kills: 0, totalMoney: 0 }, money: 0,
    daycare: { unlocked: true, parents: [null, null], eggs: [], slots: 1 },
    daycareMode: { active: true, slotIdx: 0 }, zoneIdx: 1, unlockedZone: 5, subStage: 1
  }`, contexte);
}
/** @param {number} id @param {string} [gender] */
const membre = (id, gender = 'female') => ({
  id, gender, name: 'Référence', level: 1, xp: 0, maxXp: 1e9,
  happiness: 0, isEgg: false, isShiny: false,
});
/** @param {number} taille */
const equipe = (taille) => Array.from({ length: taille }, () => membre(1));
const oeuf = () => ({ ...membre(25), name: 'Oeuf', isEgg: true, isShiny: true, hatchSteps: 0, maxSteps: 25 });
/** @param {string} code */
const executer = (code) => runInContext(code, contexte);
/** @param {unknown[]} parents */
function chance(parents) {
  const etat = reinitialiser();
  etat.daycare.parents = parents;
  return executer('checkDaycareCompatibility()');
}

const formesDeBase = Array.from({ length: 151 }, (_, i) => executer(`getBaseForm(${i + 1})`));
const compatibilite = Array.from({ length: 151 }, (_, i) =>
  Array.from({ length: 151 }, (_, j) => Math.round(chance([membre(i + 1), membre(j + 1, 'male')]) * 100)).join(''));
const cas = [
  { nom: 'metamorphs', parents: [membre(132, 'genderless'), membre(132, 'genderless')] },
  { nom: 'metamorph-sans-sexe', parents: [membre(132, 'genderless'), membre(81, 'genderless')] },
  { nom: 'sans-sexe-metamorph', parents: [membre(81, 'genderless'), membre(132, 'genderless')] },
  { nom: 'males', parents: [membre(25, 'male'), membre(26, 'male')] },
  { nom: 'femelles', parents: [membre(25), membre(26)] },
  { nom: 'sans-sexe', parents: [membre(81, 'genderless'), membre(81, 'genderless')] },
  { nom: 'seul', parents: [membre(25), null] },
].map((cas) => ({ ...cas, chance: chance(cas.parents) }));

/** @param {string} nom @param {ReturnType<typeof membre>[]} parents @param {boolean} [plein] @param {boolean} [verrouille] */
function ponte(nom, parents, plein = false, verrouille = false) {
  const etat = reinitialiser();
  etat.daycare.parents = parents;
  etat.daycare.slots = 1000;
  etat.daycare.unlocked = !verrouille;
  if (plein) etat.daycare.eggs = Array.from({ length: 1000 }, () => ({ speciesId: 25 }));
  const oeufs = [];
  for (let appel = 1; appel <= 1000; appel++) {
    const avant = etat.daycare.eggs.length;
    executer('processDaycare()');
    if (etat.daycare.eggs.length > avant) {
      const brut = etat.daycare.eggs.at(-1);
      oeufs.push({ appel, numero: brut.speciesId, shiny: brut.isShiny });
    }
  }
  return { nom, parents, appels: 1000, slots: 1000, oeufs, tirages };
}
const paires = [
  ponte('metamorphs', [membre(132, 'genderless'), membre(132, 'genderless')]),
  ponte('metamorph-25', [membre(132, 'genderless'), membre(25)]),
  ponte('meme-forme', [membre(25), membre(26, 'male')]),
  ponte('type-partage', [membre(1), membre(43, 'male')]),
  ponte('incompatible', [membre(1), membre(4, 'male')]),
];
const parentsCompatibles = [membre(25), membre(26, 'male')];
const ponteFixture = {
  graine: valeurGraine, paires,
  plein: ponte('plein', parentsCompatibles, true),
  verrouille: ponte('verrouille', parentsCompatibles, false, true),
};
const emplacements = [1, 2, 3, 4, 5, 1].map((slots, index) => {
  const etat = reinitialiser();
  etat.daycare.slots = slots;
  const argent = index === 5 ? 4999 : 100000;
  etat.money = argent;
  executer('buyEggSlot()');
  return { avant: slots, argent, apres: etat.daycare.slots, cout: argent - etat.money, messages };
});
const retraitOeuf = [5, 6].map((taille) => {
  const etat = reinitialiser();
  etat.team = equipe(taille);
  etat.daycare.eggs = [{ speciesId: 25, isShiny: true, ticks: 0, maxTicks: 25, hatched: false }];
  executer('withdrawEgg(0)');
  const destination = taille === 5 ? 'equipe' : 'pc';
  return { tailleEquipe: taille, destination, oeuf: (taille === 5 ? etat.team : etat.pc).at(-1),
    oeufsRestants: etat.daycare.eggs, pokedex: etat.pokedex, appelsPokedex, messages, tirages };
});
/** @param {string} source @param {ReturnType<typeof membre>[]} team @param {ReturnType<typeof membre>[]} [pc] */
function deposer(source, team, pc = []) {
  const etat = reinitialiser();
  etat.team = team;
  etat.pc = pc;
  executer(`depositToDaycare('${source}', 0)`);
  return { equipe: etat.team, pc: etat.pc, parents: etat.daycare.parents, messages };
}
const parents = {
  dernier: deposer('team', [membre(25)]),
  actif: deposer('team', [membre(25), oeuf()]),
  depuisPC: deposer('pc', [membre(1)], [membre(25)]),
  oeuf: deposer('team', [oeuf(), membre(1)]),
  retraits: [5, 6].map((taille) => {
    const etat = reinitialiser();
    etat.team = equipe(taille);
    etat.daycare.parents = [membre(25), null];
    executer('selectDaycareParent(0)');
    return { tailleEquipe: taille, destination: taille === 5 ? 'equipe' : 'pc',
      equipe: etat.team, pc: etat.pc, parents: etat.daycare.parents, messages };
  }),
};
const etat = reinitialiser();
etat.team = [oeuf()];
etat.pc = [oeuf()];
const etapes = [];
for (let victoire = 1; victoire <= 25; victoire++) {
  contexte.enemy = { id: 19, level: 1, rarity: 'Commun', isBoss: false, isShiny: false, dead: false };
  executer('killEnemy()');
  etapes.push({ victoire, equipe: { ...etat.team[0] }, pc: { ...etat.pc[0] } });
}
const eclosion = { etapes, appelsPokedex, pokedex: etat.pokedex, messages, tirages };
const fixture = {
  sources: ['constants.js', 'stats.js', 'team.js', 'combat.js', 'daycare.js'].map((nom) => `legacy/js/${nom === 'constants.js' ? 'data' : 'game'}/${nom}`),
  formesDeBase, compatibilite, cas, ponte: ponteFixture, emplacements, retraitOeuf, parents, eclosion,
};
const chemin = new URL('tests/fixtures/v1-pension.json', racine);
const texte = JSON.stringify(fixture, null, 2) + '\n';
if (process.argv.includes('--verifier')) {
  if (await readFile(chemin, 'utf8') !== texte) {
    throw new Error('tests/fixtures/v1-pension.json diffère de la V1 : relancer node scripts/extraire-pension-v1.mjs');
  }
} else {
  await writeFile(chemin, texte);
}
console.log(`Empreinte SHA-256 : ${createHash('sha256').update(texte).digest('hex')}`);
