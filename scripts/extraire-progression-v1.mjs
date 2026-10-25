import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';
import assert from 'node:assert/strict';

const racine = new URL('../', import.meta.url);
/** @param {string} fichier */
const lire = async (fichier) => (await readFile(new URL(fichier, racine), 'utf8')).replace(/^\uFEFF/, '');
const sansEffet = () => {};
let delai = 0;
const contexte = createContext({
  Math: Object.assign(Object.create(Math), { random: () => 0.5 }),
  bossTimer: null,
  document: { getElementById: () => ({ classList: { add: sansEffet, remove: sansEffet } }) },
  showFeedback: sansEffet, playTone: sansEffet, processDaycare: sansEffet,
  renderTeam: sansEffet, renderShop: sansEffet, renderPC: sansEffet,
  updateUI: sansEffet, updateZone: sansEffet, resumeAutoBattle: sansEffet,
  getSprite: sansEffet, addToPokedex: sansEffet, renderBag: sansEffet,
  startEndingSequence: sansEffet,
  /** @param {unknown} rappel @param {number} ms */
  setTimeout: (rappel, ms) => { delai = ms; },
});
for (const fichier of ['data/constants', 'regions/kanto', 'game/stats', 'game/combat', 'game/capture', 'game/shop']) {
  runInContext(await lire(`legacy/js/${fichier}.js`), contexte);
}
const save = await lire('legacy/js/game/save.js');
for (const nom of ['checkBadges', 'checkMilestones']) {
  const fonction = save.match(new RegExp(`^function ${nom}\\(\\) \\{[\\s\\S]*?^\\}`, 'm'));
  assert.ok(fonction, `${nom} introuvable`);
  runInContext(fonction[0], contexte);
}
/** @param {string} code */
const executer = (code) => runInContext(code, contexte);
/** @type {{ id: number, zoneIdx: number, name: string, desc: string }[]} */
const BADGES = executer('BADGES');
/** @type {{ count: number, title: string, desc: string }[]} */
const MILESTONES = executer('MILESTONES');
contexte.getActiveRegion = () => ({ badges: BADGES, zones: [] });
const ids = ['roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan', 'terre'];
const donneesZones = JSON.parse(await lire('data/regions/kanto/zones.json'));
/** @type {{id: string, ancienId: number, type?: string}[]} */
const zones = Array.isArray(donneesZones) ? donneesZones : donneesZones.zones;
/** @type {Record<string, string>} */
const corrections = {
  'Vitesse de spawn +20%': "Vitesse d'apparition +20%",
  'Spawn +20%': 'Apparition +20%', '+2,500 $P': '+2 500 pièces',
  'Jeton Brillant': 'Jeton Shiny', 'Kanto Master': 'Maître de Kanto',
  'Shop -15%': 'Boutique -15%',
};
/** @param {string} texte */
const corriger = (texte) => corrections[texte] ?? texte;
const badges = BADGES.map((b, i) => {
  const zone = zones.find((z) => z.ancienId === b.zoneIdx);
  assert.equal(zone?.type, 'arene', `Zone du badge ${b.name}`);
  return { id: ids[i], nom: b.name, zone: zone.id, description: corriger(b.desc), image: `img/badges/${ids[i]}.png`, ordre: i + 1 };
});
/** @type {Record<number, {argent?: number, inventaire?: Record<string, number>, ameliorations?: string[]}>} */
const recompenses = {
  20: { argent: 2500 }, 40: { inventaire: { omniExp: 1 } },
  110: { inventaire: { shinyToken: 1 } },
  130: { inventaire: { masterball: 1, bonbon: 10 } },
  151: { ameliorations: ['shinyCharm'] },
};
const jalons = {
  paliers: MILESTONES.map((m) => ({ palier: m.count, titre: corriger(m.title), description: corriger(m.desc), recompense: recompenses[m.count] ?? {} })),
  objetsRecompense: [{ id: 'omniExp', nom: 'Omni Exp', description: 'XP +100%', prix: 0, type: 'consommable', zone: null, boutique: null, sansInflation: true, inventaire: 'omniExp', image: null, categorie: 'equipement', sac: null }],
};
const membre = { id: 19, level: 10, xp: 0, maxXp: 1e9, happiness: 0, isEgg: false, name: 'Référence' };
const equipe = [membre];
const cible = { id: 19, level: 10, rarity: 'Commun', isShiny: false, catchRate: 127, maxHp: 100, hp: 50 };
const etatNeuf = () => ({
  team: equipe.map((p) => ({ ...p })), badges: [], milestones: [], upgrades: {},
  inv: /** @type {Record<string, number>} */ ({ candy: 0, omniExp: 0, shinyToken: 0, masterball: 0 }),
  stats: { kills: 0, totalMoney: 0 }, money: 0, daycare: {},
  zoneIdx: 1, unlockedZone: 5, subStage: 1, pokedex: /** @type {number[]} */ ([]), cheat: false,
});
const attribution = Array.from({ length: 22 }, (_, zoneIdx) => {
  contexte.state = { ...etatNeuf(), zoneIdx };
  executer('checkBadges()');
  const recus = [...contexte.state.badges];
  executer('checkBadges()');
  assert.deepEqual(contexte.state.badges, recus);
  return { zoneIdx, badges: recus };
});
const jeux = [...BADGES.map((b, i) => ({ badges: [ids[i]], noms: [b.name], paliers: [] })),
  { badges: ids, noms: BADGES.map((b) => b.name), paliers: [10, 30, 50, 70, 90] }].map(({ badges: actifs, noms, paliers }) => {
  const preparer = (boss = false) => {
    contexte.state = { ...etatNeuf(), badges: [...noms], milestones: [...paliers] };
    contexte.enemy = { ...cible, isBoss: boss, dead: false };
  };
  preparer();
  const dps = executer('getDPS()');
  const clic = executer('getClick()');
  const chance = executer("getCatchChance('poke')");
  const prix = executer("getPrice(getItemPrice('pokeball'))");
  /** @param {boolean} boss */
  const combattre = (boss) => {
    preparer(boss);
    delai = 0;
    executer('killEnemy()');
    return { or: contexte.state.money, xp: contexte.state.team[0].xp, delai };
  };
  const sauvage = combattre(false);
  const boss = combattre(true);
  for (const valeur of [dps, clic, chance, prix, sauvage.or, sauvage.xp, sauvage.delai, boss.or, boss.xp]) assert.ok(Number.isFinite(valeur));
  return { badges: actifs, paliers, dps, clic, or: { sauvage: sauvage.or, boss: boss.or }, xp: { sauvage: sauvage.xp, boss: boss.xp }, chance, delai: sauvage.delai, prix };
});
let precedent = etatNeuf();
const paliers = [...[9, 10, 20, 40, 110, 130, 151].map((nombre) => ({ nombre, saut: false })), { nombre: 151, saut: true }].map(({ nombre, saut }) => {
  const etat = saut ? etatNeuf() : structuredClone(precedent);
  const avant = structuredClone(etat);
  etat.pokedex = Array.from({ length: nombre }, (_, i) => i + 1);
  contexte.state = etat;
  executer('checkMilestones()');
  /** @type {number[]} */
  const recus = etat.milestones.filter((n) => !avant.milestones.includes(n));
  const resultat = { nombre, saut, avant: avant.milestones, recus, argent: etat.money - avant.money,
    inventaire: Object.fromEntries(Object.entries(etat.inv).map(([id, n]) => [id, n - (avant.inv[id] ?? 0)])) };
  const apres = JSON.stringify(etat);
  executer('checkMilestones()');
  assert.equal(JSON.stringify(etat), apres);
  precedent = etat;
  return resultat;
});
assert.equal(badges.length, 8);
assert.equal(jeux.length, 9);
assert.equal(paliers.at(-1)?.recus.length, 10);
const fixture = { BADGES, MILESTONES, equipe, cible, consommable: 'pokeball', balle: 'poke', attribution, jeux, paliers };
const empreinte = createHash('sha256');
/** @type {[string, object][]} */
const sorties = [['data/badges.json', badges], ['data/jalons.json', jalons], ['tests/fixtures/v1-badges.json', fixture]];
for (const [fichier, contenu] of sorties) {
  const texte = `${JSON.stringify(contenu, null, 2)}\n`;
  empreinte.update(texte);
  if (process.argv.includes('--verifier')) assert.equal(await lire(fichier), texte, `${fichier} doit être régénéré.`);
  else await writeFile(new URL(fichier, racine), texte);
}
console.log(`Progression V1 : ${badges.length} badges, ${jalons.paliers.length} paliers, ${jeux.length} jeux ; empreinte ${empreinte.digest('hex')}`);
