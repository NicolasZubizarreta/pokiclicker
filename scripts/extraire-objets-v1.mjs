import { readFile, writeFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const contexte = createContext({ state: { badges: [], cheat: false }, palier: false });
runInContext('function hasMilestone(n) { return n === 70 && palier; }', contexte);
/** @type {[string, number][]} */
const sources = [['legacy/js/data/constants.js', 36], ['legacy/js/game/shop.js', 18]];
for (const [fichier, lignes] of sources) {
  const source = await readFile(new URL(fichier, racine), 'utf8');
  runInContext(source.replace(/^\uFEFF/, '').split(/\r?\n/).slice(0, lignes).join('\n'), contexte);
}
const items = runInContext('ITEMS', contexte);
const zones = [...(await readFile(new URL('data/regions/kanto/zones.json', racine), 'utf8')).matchAll(/"id":\s*"([^"]+)"/g)].map(match => match[1]);
if (zones.length !== 22 || zones[2] !== 'kanto.foret-de-jade') throw new Error('Ordre des zones Kanto inattendu.');
if (Object.keys(items).length !== 31) throw new Error('31 objets V1 attendus.');
const images = new Set(await readdir(new URL('public/img/objets/', racine)));
const balles = new Set(['pokeball', 'superball', 'hyperball', 'masterball']);
/** @type {Record<string, string>} */
const descriptions = {
  runningShoes: "Réduit l'attente entre deux ennemis à 1 s.",
  bicycle: "Réduit l'attente entre deux ennemis à 0,5 s (remplace les Chaussures).",
};
const objets = Object.entries(items).map(([id, item]) => {
  const fichier = item.img?.split('/').pop();
  if (item.zone != null && item.zone !== 99 && !zones[item.zone]) throw new Error(`Zone inconnue : ${id}`);
  return {
    id, nom: id === 'luckyEgg' ? 'Œuf Chance' : item.name,
    description: descriptions[id] ?? item.desc, prix: item.price,
    type: item.type === 'consumable' ? 'consommable' : 'amelioration',
    zone: zones[item.zone] ?? null, boutique: item.zone === 99 ? null : item.shop ?? 'shop',
    sansInflation: item.noBadgeInflation ?? false,
    inventaire: item.type === 'consumable' ? id === 'candy' ? 'bonbon' : id : null,
    image: images.has(fichier) ? `img/objets/${fichier}` : null,
    categorie: balles.has(id) ? 'balles' : item.type === 'upgrade' ? 'equipement' : 'soins',
    sac: id === 'pokeball' || id === 'candy' ? 'toujours' : id === 'superball' ? zones[6] : id === 'hyperball' ? zones[9] : null,
  };
});
const prix = [];
for (const id of Object.keys(items)) {
  for (let badges = 0; badges <= 8; badges++) {
    for (const palier of [false, true]) {
      contexte.state.badges = Array(badges).fill('badge');
      contexte.palier = palier;
      prix.push({ id, badges, palier, prix: runInContext(`getPrice(getItemPrice(${JSON.stringify(id)}))`, contexte) });
    }
  }
}
const fixture = {
  zones,
  objets: Object.entries(items).map(([id, item]) => ({
    id, prix: item.price, zone: item.zone ?? null, type: item.type,
    shop: item.shop ?? null, noBadgeInflation: item.noBadgeInflation ?? false, invKey: item.invKey ?? null,
  })),
  prix,
};
/** @type {[string, object][]} */
const sorties = [['data/objets.json', objets], ['tests/fixtures/v1-objets.json', fixture]];
const empreinte = createHash('sha256');
for (const [fichier, contenu] of sorties) {
  const texte = `${JSON.stringify(contenu, null, 2)}\n`;
  empreinte.update(texte);
  if (process.argv.includes('--verifier')) {
    if (await readFile(new URL(fichier, racine), 'utf8') !== texte) throw new Error(`${fichier} doit être régénéré.`);
  } else {
    await writeFile(new URL(fichier, racine), texte);
  }
}
console.log(`Objets V1 : ${objets.length} objets, ${prix.length} prix ; empreinte ${empreinte.digest('hex')}`);
