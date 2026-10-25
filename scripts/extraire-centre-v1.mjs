import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const sansEffet = () => {};
/** @type {Array<{ innerHTML: string; disabled: boolean }>} */
let boutons = [];
const panneau = { innerHTML: '', innerText: '', style: {}, appendChild: (/** @type {{ innerHTML: string; disabled: boolean }} */ bouton) => boutons.push(bouton) };
const contexte = createContext({
  state: {}, palier: false,
  document: {
    getElementById: () => panneau,
    createElement: () => ({ innerHTML: '', disabled: false }),
  },
  updateUI: sansEffet, renderBag: sansEffet, renderShop: sansEffet,
  closeZoneInfo: sansEffet, flyToZone: sansEffet,
  getActiveRegion: () => ({ zones: Array.from({ length: 12 }, () => ({ name: 'Zone', bg: '' })) }),
});
runInContext('function hasMilestone(n) { return n === 70 && palier; }', contexte);
/** @type {Array<[string, number, number]>} */
const plages = [
  ['legacy/js/data/constants.js', 1, 36],
  ['legacy/js/game/shop.js', 1, 41],
  ['legacy/js/ui/render.js', 475, 509],
  ['legacy/js/game/save.js', 800, 851],
];
const sources = [];
for (const [fichier, debut, fin] of plages) {
  const brut = await readFile(new URL(fichier, racine), 'utf8');
  const extrait = brut.replace(/^\uFEFF/, '').split(/\r?\n/).slice(debut - 1, fin).join('\n');
  sources.push({ fichier, debut, fin, sha256: createHash('sha256').update(extrait).digest('hex') });
  // L851 termine les boutons : fermer la fonction sans exécuter le reste de la fiche.
  runInContext(extrait + (fichier.endsWith('/save.js') ? '\n}' : ''), contexte);
}
const items = runInContext('ITEMS', contexte);
/** @param {number} badges @param {boolean} [palier] */
function reinitialiser(badges, palier = false) {
  contexte.palier = palier;
  contexte.state = {
    badges: Array.from({ length: badges }, (_, i) => i), cheat: false,
    money: 0, inv: Object.fromEntries(Object.values(items).filter((item) => item.invKey).map((item) => [item.invKey, 2])),
    upgrades: {}, zoneIdx: -6, unlockedZone: 0,
  };
  return contexte.state;
}
/** @param {string} code */
const executer = (code) => runInContext(code, contexte);
/** @param {RegExpMatchArray} match @param {number} index */
function groupe(match, index) {
  const valeur = match[index];
  if (valeur === undefined) throw new Error('Affichage Centre V1 incomplet.');
  return valeur;
}
reinitialiser(0);
executer('renderMallPanel()');
const ordre = Array.from(panneau.innerHTML.matchAll(/buyItem\('([^']+)'\)/g), (match) => groupe(match, 1));
const affichage = [];
for (let badges = 0; badges <= 8; badges++) {
  for (const palier of [false, true]) {
    const etat = reinitialiser(badges, palier);
    ordre.forEach((id, i) => { etat.inv[items[id].invKey] = i + 2; });
    executer('renderMallPanel()');
    const prix = Array.from(panneau.innerHTML.matchAll(/data-id="([^"]+)">([\d.]+)\$/g));
    const stocks = new Map(Array.from(panneau.innerHTML.matchAll(/id="shop-stock-([^"]+)">(\d+)</g), (match) => [groupe(match, 1), Number(groupe(match, 2))]));
    affichage.push({ badges, palier, objets: prix.map((match) => ({ id: groupe(match, 1), prix: Number(groupe(match, 2).replaceAll('.', '')), stock: stocks.get(groupe(match, 1)) })) });
  }
}
const achats = [];
for (const id of ordre) {
  for (const badges of [0, 4, 8]) {
    reinitialiser(badges);
    const prix = executer(`getPrice(getItemPrice('${id}'))`);
    for (const argent of [prix - 1, prix, 3 * prix]) {
      const etat = reinitialiser(badges);
      etat.money = argent;
      executer(`buyItem('${id}')`);
      achats.push({ id, badges, argent, argentApres: etat.money, stockApres: etat.inv[items[id].invKey] });
    }
  }
}
const acces = Array.from({ length: 22 }, (_, unlockedZone) => {
  const etat = reinitialiser(0);
  etat.unlockedZone = unlockedZone;
  boutons = [];
  executer('showZoneInfo(11)');
  const bouton = boutons.find((bouton) => bouton.innerHTML.includes('Centre Commercial'));
  if (!bouton) throw new Error('Bouton Centre Commercial V1 introuvable.');
  return { unlockedZone, actif: !bouton.disabled };
});
const chemin = new URL('tests/fixtures/v1-centre.json', racine);
const texte = JSON.stringify({ sources, ordre, affichage, achats, acces }, null, 2) + '\n';
if (process.argv.includes('--verifier')) {
  if (await readFile(chemin, 'utf8') !== texte) {
    throw new Error('tests/fixtures/v1-centre.json diffère de la V1 : relancer node scripts/extraire-centre-v1.mjs');
  }
} else {
  await writeFile(chemin, texte);
}
console.log(`Empreinte SHA-256 : ${createHash('sha256').update(texte).digest('hex')}`);
