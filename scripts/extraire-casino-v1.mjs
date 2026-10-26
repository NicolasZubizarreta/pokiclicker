import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';
import { graine } from './lib/graine.mjs';

const racine = new URL('../', import.meta.url);
/** @param {string | Buffer} contenu */
const sha256 = (contenu) => createHash('sha256').update(contenu).digest('hex');
/** @type {Record<string, string>} */
const sources = {};
/** @param {string} fichier */
async function lire(fichier) {
  const contenu = await readFile(new URL(fichier, racine));
  sources[fichier] = sha256(contenu);
  return contenu.toString('utf8').replace(/^\uFEFF/, '');
}
const sansEffet = () => {};
const elements = new Map();
/** @param {string} id */
const element = (id) => {
  if (!elements.has(id)) elements.set(id, {
    value: '1', innerText: '', style: {}, classList: {
      add: sansEffet, remove: sansEffet, toggle: sansEffet,
    }, addEventListener: sansEffet, querySelectorAll: () => [],
  });
  return elements.get(id);
};
/** @type {Array<[string, string]>} */
let messages = [];
/** @type {number[]} */
let pokedex = [];
let tirages = 0;
/** @type {string[]} */
let rouleaux = [];
const valeurGraine = 20261025;
const contexte = createContext({
  window: {}, document: { getElementById: element, addEventListener: sansEffet },
  addEventListener: sansEffet, setTimeout: (/** @type {() => void} */ action) => action(),
  setInterval: sansEffet, clearInterval: sansEffet,
  showFeedback: (/** @type {string} */ texte, /** @type {string} */ couleur) => messages.push([texte, couleur]),
  updateUI: sansEffet, renderTeam: sansEffet, renderPC: sansEffet,
  renderBag: sansEffet, checkMilestones: sansEffet, getSprite: () => 'sprite-fixe',
});
/** @param {string} code */
const executer = (code) => runInContext(code, contexte);
let casino = '';
for (const nom of ['data/constants', 'game/stats', 'game/team', 'game/casino']) {
  const code = await lire(`legacy/js/${nom}.js`);
  if (nom === 'game/casino') casino = code;
  executer(code);
}
for (const nom of Object.keys(contexte).filter((nom) => nom.startsWith('render'))) contexte[nom] = sansEffet;
contexte.updateCasinoUI = sansEffet;
contexte.setSlotReelImage = (/** @type {number} */ i, /** @type {string} */ symbole) => { rouleaux[i - 1] = symbole; };
executer('Date.now = () => 1700000000000');
const ajouterPokedex = executer('addToPokedex');
contexte.addToPokedex = (/** @type {number} */ id) => { pokedex.push(id); ajouterPokedex(id); };
function reinitialiser(seed = valeurGraine) {
  messages = [];
  pokedex = [];
  tirages = 0;
  rouleaux = [];
  elements.clear();
  const suivant = graine(seed);
  contexte.alea = () => { tirages++; return suivant(); };
  executer('Math.random = alea; slotsSpinning = false; blackjackState.active = false');
  return executer(`state = { money: 0, casinoTokens: 1000000, team: [], pc: [],
    pokedex: [], inv: {}, upgrades: {}, stats: { totalMoney: 0 } }`);
}
/** @param {unknown} objet */
const copier = (objet) => JSON.parse(JSON.stringify(objet));
/** @param {string} texte @param {RegExp} regex */
function capturer(texte, regex) {
  const resultat = texte.match(regex);
  if (!resultat?.[1]) throw new Error(`Source V1 inattendue : ${regex}`);
  return resultat[1];
}
const constantes = copier(executer(`({ lot: CASINO_TOKEN_BUNDLE, rachat: CASINO_CASHOUT_RATE,
  symboles: SLOT_SYMBOLS, poids: SLOT_WEIGHTS, images: SLOT_SPRITES,
  boutique: CASINO_SHOP_ITEMS, noms: Object.fromEntries(CASINO_SHOP_ITEMS
    .filter(i => i.itemKey).map(i => [i.itemKey, ITEMS[i.itemKey].name])) })`));
const animation = {
  rouleaux: JSON.parse(capturer(casino, /const stopDelays = (\[[\d,\s]+\])/)),
  defilement: Number(capturer(casino, /},\s*(\d+)\);\s*}\s*let stopped/)),
  piece: Number(capturer(casino.slice(casino.indexOf('function playCoinFlip(')), /},\s*(\d+)\);/)),
};
const table = [];
for (const a of constantes.symboles) for (const b of constantes.symboles) for (const c of constantes.symboles) {
  const etat = reinitialiser();
  const symboles = [a, b, c];
  const valeurs = symboles.map((symbole) => {
    const i = constantes.symboles.indexOf(symbole);
    return (constantes.poids.slice(0, i).reduce((/** @type {number} */ s, /** @type {number} */ p) => s + p, 0) + constantes.poids[i] / 2) / 100;
  });
  contexte.alea = () => { tirages++; return valeurs.shift(); };
  executer('spinSlots(1)');
  table.push({ symboles, gain: etat.casinoTokens - 999999 });
}
/** @param {number} nombre @param {number} mise @param {string} jouer
 * @param {() => object} resultat @param {number} limite */
function serie(nombre, mise, jouer, resultat, limite) {
  const etat = reinitialiser();
  /** @type {Record<number, number>} */
  const histogramme = {};
  /** @type {Record<number, number>} */
  const tiragesParTour = {};
  const premiers = [];
  let total = 0;
  for (let i = 0; i < nombre; i++) {
    const avant = etat.casinoTokens;
    const tiragesAvant = tirages;
    executer(jouer);
    const gain = etat.casinoTokens - avant + mise;
    const ligne = { ...resultat(), gain, tirages: tirages - tiragesAvant };
    tiragesParTour[ligne.tirages] = (tiragesParTour[ligne.tirages] || 0) + 1;
    total += gain;
    histogramme[gain] = (histogramme[gain] || 0) + 1;
    if (i < limite) premiers.push(ligne);
  }
  return { graine: valeurGraine, nombre, mise, total, histogramme, tirages, tiragesParTour, premiers };
}
const machine = { table, serie: serie(100000, 1, 'spinSlots(1)', () => ({
  symboles: rouleaux.slice(),
  message: element('slots-result').innerText,
}), 50) };
const pileOuFace = { serie: serie(10000, 1, "playCoinFlip(1, 'face')", () => ({
  choix: 'face', resultat: element('coin-img').alt,
}), 50) };
const construirePaquet = executer('buildBlackjackDeck');
/** @param {string} label */
const carte = (label) => {
  const [rank, suit] = label.split('-');
  if (!rank || !suit) throw new Error(`Carte invalide : ${label}`);
  return { rank, suit, label, value: rank === 'A' ? 11 : ['J', 'Q', 'K'].includes(rank) ? 10 : Number(rank) };
};
function main() {
  return copier(executer(`({ joueur: blackjackState.player.map(c => c.label),
    croupier: blackjackState.dealer.map(c => c.label),
    valeurJoueur: getHandValue(blackjackState.player), valeurCroupier: getHandValue(blackjackState.dealer),
    paquetRestant: blackjackState.deck.map(c => c.label), active: blackjackState.active })`));
}
/** @type {Array<[string, number, string[], string[]]>} */
const definitions = [
  ['naturel', 3, ['A-S', 'K-H', '2-D'], []],
  ['egalite', 2, ['10-S', '8-H', '10-D', '8-C'], ['rester']],
  ['bust', 2, ['10-S', '9-H', '2-D', '5-C'], ['tirer']],
  ['croupier-jusqua-17', 2, ['10-S', '8-H', '2-D', '5-C', '10-H'], ['rester']],
  ['soft-17', 2, ['10-S', '8-H', 'A-D', '6-C'], ['rester']],
  ['depassement', 2, ['10-S', '8-H', '6-D', '10-C', 'K-S'], ['rester']],
  ['as-compte-1', 2, ['A-S', '5-H', '10-D', '9-C', '7-S'], ['tirer', 'rester']],
  ['paquet-vide-reconstruit', 2, ['10-S', '6-H', '10-D'], ['tirer', 'rester']],
];
const scenarios = definitions.map(([nom, mise, cartes, actions]) => {
  const etat = reinitialiser();
  const paquet = cartes.map(carte).reverse();
  contexte.buildBlackjackDeck = () => paquet.slice();
  executer(`startBlackjack(${mise})`);
  contexte.buildBlackjackDeck = construirePaquet;
  const donne = main();
  for (const action of actions) executer(action === 'tirer' ? 'blackjackHit()' : 'blackjackStand()');
  return { nom, mise, cartes, actions, donne, ...main(), gain: etat.casinoTokens - 1000000 + mise,
    tirages, message: element('blackjack-result').innerText };
});
const blackjack = { scenarios, serie: {
  strategie: 'tire sous 17',
  ...serie(10000, 2, `startBlackjack(2);
    while (blackjackState.active && getHandValue(blackjackState.player) < 17) blackjackHit();
    if (blackjackState.active) blackjackStand()`, () => ({
    ...main(), message: element('blackjack-result').innerText,
  }), 20),
} };
const jetons = [];
/** @type {Array<[string, string, number]>} */
const echanges = [
  ['buyCasinoTokens', 'money', 999], ['buyCasinoTokens', 'money', 1000],
  ['cashOutCasinoTokens', 'casinoTokens', 49], ['cashOutCasinoTokens', 'casinoTokens', 50],
];
for (const [action, champ, valeur] of echanges) {
  const etat = reinitialiser();
  etat.casinoTokens = 0;
  etat[champ] = valeur;
  const avant = copier(etat);
  executer(`${action}()`);
  jetons.push({ action, avant, apres: copier(etat), messages: copier(messages), tirages });
}
const mise = ['0', '-1', 'abc', '1.5'].map((valeur) => {
  reinitialiser();
  element('mise').value = valeur;
  return { valeur, resultat: executer("getBetFromInput('mise')"), messages: copier(messages) };
});
const achats = [];
for (const taille of [5, 6]) for (const item of constantes.boutique) {
  const etat = reinitialiser();
  etat.team = Array.from({ length: taille }, () => ({ id: 1 }));
  executer(`buyCasinoShopItem('${item.key}')`);
  achats.push({ cle: item.key, equipeAvant: taille, etat: copier(etat),
    addToPokedex: copier(pokedex), messages: copier(messages), tirages });
}
const refus = ['jetons-insuffisants', 'ct-deja-acquise'].map((nom) => {
  const etat = reinitialiser();
  if (nom === 'jetons-insuffisants') etat.casinoTokens = 249;
  else etat.upgrades.ctJackpot = true;
  const avant = copier(etat);
  executer(`buyCasinoShopItem('${nom === 'jetons-insuffisants' ? 'abra' : 'ctJackpot'}')`);
  return { nom, avant, apres: copier(etat), tirages, messages: copier(messages), addToPokedex: copier(pokedex) };
});
const sexes = [];
for (const seed of [valeurGraine, 1, 42]) for (const numero of [63, 123, 147, 137]) {
  reinitialiser(seed);
  const valeurs = Array.from({ length: 100 }, () => executer(`getCasinoPokemonGender(${numero})`));
  sexes.push({ numero, graine: seed, valeurs, tirages });
}
const save = await lire('legacy/js/game/save.js');
const zone = Number(capturer(save, /const isCeladopole = zoneId === (\d+)/));
const donneesZones = JSON.parse(await lire('data/regions/kanto/zones.json'));
const entrees = Object.values(donneesZones).flat();
const precedente = entrees.find((entree) => entree?.ancienId === zone - 1);
const lieu = entrees.find((entree) => entree?.lieu === 'casino');
if (!precedente || lieu?.si?.zone !== precedente.id) throw new Error('Accès casino incohérent');
const acces = { zone, nom: 'Céladopole',
  condition: capturer(save, /const isUnlocked = ([^;]+);\s*const isCeladopole/),
  zonePrecedente: { ancienId: precedente.ancienId, id: precedente.id, nom: precedente.nom },
  conditionV2: lieu.si };
await lire('scripts/extraire-casino-v1.mjs');
await lire('scripts/lib/graine.mjs');
const fixture = { sources, constantes, animation, acces, machine, pileOuFace, blackjack,
  jetons, mise, boutique: { achats, refus, sexes } };
const contenu = `${JSON.stringify(fixture, null, 2)}\n`;
const destination = new URL('tests/fixtures/v1-casino.json', racine);
if (process.argv.includes('--verifier')) {
  if (await readFile(destination, 'utf8') !== contenu) throw new Error('Fixture casino périmée : relancer scripts/extraire-casino-v1.mjs');
} else await writeFile(destination, contenu, 'utf8');
console.log(`Empreinte SHA-256 : ${sha256(contenu)}`);
