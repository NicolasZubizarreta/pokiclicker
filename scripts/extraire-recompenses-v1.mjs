import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';

/** @typedef {{ id: number, level: number, xp: number, maxXp: number, happiness: number, isEgg: boolean, name: string, hatchSteps?: number, maxSteps?: number }} Membre */
/** @typedef {{ numero: number, niveau: number, rarete: string | null, boss: boolean, shiny: boolean }} Ennemi */
/** @typedef {{ team: Membre[], badges: string[], milestones: number[], upgrades: Record<string, boolean>, inv: { candy: number, omniExp: number }, stats: { kills: number, totalMoney: number }, money: number, daycare: object, zoneIdx: number, unlockedZone: number, subStage: number }} Etat */

const racine = new URL('../', import.meta.url);
let delaiMs = 0;
/** Bouchon des effets visuels et sonores. */
const sansEffet = () => {};
const contexte = createContext({
  bossTimer: null,
  document: { getElementById: () => ({ classList: { add: sansEffet, remove: sansEffet } }) },
  showFeedback: sansEffet, playTone: sansEffet, processDaycare: sansEffet,
  renderTeam: sansEffet, renderShop: sansEffet, renderPC: sansEffet,
  updateUI: sansEffet, updateZone: sansEffet, resumeAutoBattle: sansEffet,
  checkBadges: sansEffet, getSprite: sansEffet, addToPokedex: sansEffet,
  getActiveRegion: () => ({ zones: [] }),
  /** @param {unknown} rappel @param {number} delai */
  setTimeout: (rappel, delai) => { delaiMs = delai; },
});
for (const fichier of ['legacy/js/data/constants.js', 'legacy/js/game/stats.js', 'legacy/js/game/combat.js']) {
  runInContext((await readFile(new URL(fichier, racine), 'utf8')).replace(/^\uFEFF/, ''), contexte);
}

/** @type {(numero: number, niveau: number) => number} */
const calcMaxXp = runInContext('calcMaxXp', contexte);
/** Table explicite des équivalences V2 vers V1.
 * @type {Record<string, (etat: Etat) => void>} */
const bonus = {
  'objet:amuletCoin': (e) => { e.upgrades.amuletCoin = true; },
  'objet:ctJackpot': (e) => { e.upgrades.ctJackpot = true; },
  'objet:expShare': (e) => { e.upgrades.expShare = true; },
  'objet:luckyEgg': (e) => { e.upgrades.luckyEgg = true; },
  'objet:omniExp': (e) => { e.inv.omniExp = 1; },
  'badge:prisme': (e) => { e.badges.push('Prisme'); },
  'badge:ame': (e) => { e.badges.push('Âme'); },
  'badge:terre': (e) => { e.badges.push('Terre'); },
  'jalon:50': (e) => { e.milestones.push(50); },
  'objet:bicycle': (e) => { e.upgrades.bicycle = true; },
  'objet:runningShoes': (e) => { e.upgrades.runningShoes = true; },
};

/** @param {number} numero @param {number} [niveau] @param {Partial<Membre>} [options] @returns {Membre} */
const membre = (numero, niveau = 10, options = {}) => ({
  id: numero, level: niveau, xp: 0, maxXp: calcMaxXp(numero, niveau),
  happiness: 0, isEgg: false, name: 'Référence', ...options,
});
/** @param {number} niveau @param {string | null} [rarete] @param {boolean} [boss] @param {boolean} [shiny] @param {number} [numero] @returns {Ennemi} */
const ennemi = (niveau, rarete = 'Commun', boss = false, shiny = false, numero = 19) => ({ numero, niveau, rarete, boss, shiny });

/** Chaque combat reçoit un état neuf ; la sonde est hors de l'équipe publiée.
 * killEnemy parcourt toute l'équipe sans limite de taille : les six membres restent tous exercés.
 * @param {Ennemi} cible @param {string[]} actifs @param {Membre[]} equipe */
function combattre(cible, actifs, equipe) {
  const sonde = membre(1, 1, { maxXp: Infinity });
  /** @type {Etat} */
  const etat = {
    team: [...equipe.map((p) => ({ ...p })), sonde], badges: [], milestones: [], upgrades: {},
    inv: { candy: 0, omniExp: 0 }, stats: { kills: 0, totalMoney: 0 },
    money: 0, daycare: {}, zoneIdx: 1, unlockedZone: 5, subStage: 1,
  };
  for (const actif of actifs) {
    const appliquer = bonus[actif];
    if (!appliquer) throw new Error(`Bonus inconnu : ${actif}`);
    appliquer(etat);
  }
  contexte.state = etat;
  contexte.enemy = { id: cible.numero, level: cible.niveau, rarity: cible.rarete,
    isBoss: cible.boss, isShiny: cible.shiny, dead: false };
  delaiMs = 0;
  runInContext('killEnemy()', contexte);
  return { etat, sonde, delaiMs };
}

/** @param {string} nom @param {Ennemi} cible @param {string[]} [actifs] @param {Membre[]} [equipe] */
function scenario(nom, cible, actifs = [], equipe = [membre(19)]) {
  const { etat, sonde } = combattre(cible, actifs, equipe);
  return {
    nom, ennemi: { ...cible, rarete: cible.boss ? null : cible.rarete }, actifs,
    equipeAvant: equipe.map((p) => ({ numero: p.id, niveau: p.level, xp: p.xp, bonheur: p.happiness, oeuf: p.isEgg })),
    or: etat.money, xpMembre: sonde.xp,
    equipeApres: etat.team.slice(0, -1).map((p) => ({ niveau: p.level, xp: p.xp, bonheur: p.happiness })),
    bonbons: etat.inv.candy, eliminations: etat.stats.kills, argentTotalGagne: etat.stats.totalMoney,
  };
}

const scenarios = [
  scenario('Commun niveau 2', ennemi(2)),
  scenario('Peu commun niveau 5', ennemi(5, 'Peu Commun', false, false, 25)),
  scenario('Rare niveau 12', ennemi(12, 'Rare', false, false, 63)),
  scenario('Très rare niveau 20', ennemi(20, 'Très Rare', false, false, 147)),
  scenario('Légendaire niveau 50', ennemi(50, 'Légendaire', false, false, 144)),
  scenario('Boss niveau 6', ennemi(6, null, true)),
  scenario('Boss légendaire niveau 70', ennemi(70, 'Légendaire', true, false, 150)),
  scenario('Shiny commun niveau 3', ennemi(3, 'Commun', false, true)),
  scenario('Shiny rare et Prisme', ennemi(15, 'Rare', false, true, 63), ['badge:prisme']),
  scenario('Pièce Rune', ennemi(7), ['objet:amuletCoin']),
  scenario('CT Jackpot', ennemi(7), ['objet:ctJackpot']),
  scenario('Pièce Rune et CT Jackpot', ennemi(33), ['objet:amuletCoin', 'objet:ctJackpot']),
  scenario('Prisme', ennemi(9), ['badge:prisme']),
  scenario('Multi Exp', ennemi(11), ['objet:expShare']),
  scenario('Œuf Chance', ennemi(11), ['objet:luckyEgg']),
  scenario('Omni Exp', ennemi(11), ['objet:omniExp']),
  scenario('Badge Âme', ennemi(11), ['badge:ame']),
  scenario('Bonus XP sur boss', ennemi(40, null, true), ['objet:expShare', 'objet:luckyEgg', 'objet:omniExp', 'badge:ame']),
  scenario('Tous les bonus or et XP', ennemi(45, 'Rare', false, true, 63),
    ['objet:amuletCoin', 'objet:ctJackpot', 'objet:expShare', 'objet:luckyEgg', 'objet:omniExp', 'badge:prisme', 'badge:ame']),
  scenario('Équipe de six', ennemi(50, null, true), [], [
    membre(19, 2), membre(25, 99, { xp: calcMaxXp(25, 99) - 1 }), membre(6, 100),
    membre(1, 1, { isEgg: true, name: 'Oeuf', hatchSteps: 0, maxSteps: 10 }),
    membre(7, 10, { xp: calcMaxXp(7, 10) - 1 }), membre(151, 10, { happiness: 255 }),
  ]),
  scenario('Bonheur aux limites', ennemi(5), [], [
    membre(19, 30), membre(19, 31), membre(19, 30, { xp: calcMaxXp(19, 30) - 1 }),
  ]),
  scenario('Équipe de un', ennemi(1)),
];

const maxXp = Object.fromEntries(Array.from({ length: 151 }, (_, i) => [
  i + 1, Array.from({ length: 99 }, (_, n) => calcMaxXp(i + 1, n + 1)),
]));
/** @type {{ nom: string, actifs: string[] }[]} */
const casDelais = [
  { nom: 'Base', actifs: [] },
  { nom: 'Chaussures', actifs: ['objet:runningShoes'] },
  { nom: 'Bicyclette', actifs: ['objet:bicycle'] },
  { nom: 'Bicyclette et Chaussures', actifs: ['objet:bicycle', 'objet:runningShoes'] },
  { nom: 'Terre', actifs: ['badge:terre'] },
  { nom: 'Bicyclette, Terre et jalon 50', actifs: ['objet:bicycle', 'badge:terre', 'jalon:50'] },
];
const delais = casDelais.map(({ nom, actifs }) => ({
  nom, actifs, delaiMs: combattre(ennemi(1), actifs, [membre(19)]).delaiMs,
}));
await mkdir(new URL('tests/fixtures/', racine), { recursive: true });
await writeFile(new URL('tests/fixtures/v1-recompenses.json', racine), JSON.stringify({ scenarios, maxXp, delais }, null, 2) + '\n');
