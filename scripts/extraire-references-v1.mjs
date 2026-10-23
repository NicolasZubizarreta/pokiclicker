import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { runInContext, createContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const contexte = createContext({
  Date,
  state: { team: [], badges: [], milestones: [], upgrades: {}, dpsBoostEndTime: 0, attackBoostEndTime: 0, cheat: false },
  enemy: { id: 1 },
});
for (const fichier of ['legacy/js/data/constants.js', 'legacy/js/game/stats.js']) {
  runInContext((await readFile(new URL(fichier, racine), 'utf8')).replace(/^\uFEFF/, ''), contexte);
}
const efficacite = runInContext(`Object.fromEntries(Object.entries(TYPE_CHART)
  .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
  .map(([type, valeurs]) => [type.toLowerCase(), Object.fromEntries(Object.entries(valeurs)
    .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([cle, x]) => [cle.toLowerCase(), x]))]))`, contexte);
const matrice = runInContext('Array.from({length: 151}, (_, a) => Array.from({length: 151}, (_, d) => getMultiplier(a + 1, d + 1)))', contexte);

/** @param {number} numero @param {number} [niveau] */
const membre = (numero, niveau = 5) => ({ numero, niveau, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0 });
/** @param {string} nom @param {ReturnType<typeof membre>[]} equipe @param {number} cible
 * @param {{jalons?: number[], badges?: string[], objets?: string[], boosts?: string[]}} [bonus] */
const scenario = (nom, equipe, cible, bonus = {}) => ({ nom, equipe, cible, jalons: [], badges: [], objets: [], boosts: [], ...bonus });
const simple = [membre(19)];
const scenarios = [
  scenario('Équipe de un', simple, 19),
  scenario('Équipe de six', [1, 4, 7, 25, 129, 151].map((n) => membre(n, 23)), 95),
  scenario('Avantage', [membre(7)], 4),
  scenario('Désavantage', [membre(4)], 7),
  scenario('Immunité', simple, 92),
  scenario('Shiny', [{ ...membre(1), shiny: true }], 19),
  scenario('Bonheur', [{ ...membre(1), bonheur: 173 }], 19),
  scenario('Pierre éternelle', [{ ...membre(1), pierreEternelle: true }], 19),
  scenario('Calcium', [{ ...membre(1), calcium: 7 }], 19),
  ...[10, 30, 90].map((n) => scenario(`Jalon ${n}`, simple, 19, { jalons: [n] })),
  ...['roche', 'cascade', 'foudre', 'volcan'].map((b) => scenario(`Badge ${b}`, simple, 19, { badges: [b] })),
  ...['protein', 'hardStone'].map((o) => scenario(`Objet ${o}`, simple, 19, { objets: [o] })),
  ...['dps', 'attaque'].map((b) => scenario(`Boost ${b}`, simple, 19, { boosts: [b] })),
  scenario('Arrondis successifs', simple, 19, { objets: ['protein', 'hardStone'], badges: ['roche', 'foudre'] }),
  scenario('Tous les bonus cumulés', [1, 6, 9, 25, 130, 151].map((n) => ({ ...membre(n, 67), shiny: true, bonheur: 255, pierreEternelle: true, calcium: 9 })), 149,
    { jalons: [10, 30, 90], badges: ['roche', 'cascade', 'foudre', 'volcan'], objets: ['protein', 'hardStone'], boosts: ['dps', 'attaque'] }),
];
const combats = scenarios.map((s) => {
  contexte.state = {
    team: s.equipe.map((p) => ({ id: p.numero, level: p.niveau, isShiny: p.shiny, happiness: p.bonheur,
      everstone: p.pierreEternelle, calciumBoosts: p.calcium, name: 'Référence', isEgg: false })),
    badges: s.badges.map((b) => b.charAt(0).toUpperCase() + b.slice(1)), milestones: s.jalons,
    upgrades: Object.fromEntries(s.objets.map((o) => [o, true])),
    dpsBoostEndTime: s.boosts.includes('dps') ? Infinity : 0,
    attackBoostEndTime: s.boosts.includes('attaque') ? Infinity : 0, cheat: false,
  };
  contexte.enemy = { id: s.cible };
  return { ...s, dpsV1: runInContext('getDPS(enemy.id)', contexte), clicV1: runInContext('getClick()', contexte) };
});
await mkdir(new URL('tests/fixtures/', racine), { recursive: true });
for (const [fichier, donnees] of [
  ['data/types.json', { version: 1, efficacite }],
  ['tests/fixtures/v1-multiplicateurs.json', matrice],
  ['tests/fixtures/v1-combat.json', combats],
]) {
  await writeFile(new URL(/** @type {string} */ (fichier), racine), JSON.stringify(donnees, null, 2) + '\n');
}
