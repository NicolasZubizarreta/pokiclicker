import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const contexte = createContext({ document: { addEventListener() {} }, window: {} });
const sources = ['legacy/js/data/constants.js', 'legacy/js/game/stats.js',
  'legacy/js/game/team.js', 'legacy/js/game/items.js'];
const empreinte = createHash('sha256');
for (const fichier of sources) {
  const source = await readFile(new URL(fichier, racine), 'utf8');
  empreinte.update(fichier).update('\0').update(source.replace(/\r\n/g, '\n')).update('\0');
  runInContext(source.replace(/^\uFEFF/, ''), contexte, { filename: fichier });
}
const pierres = ['fireStone', 'waterStone', 'leafStone', 'thunderStone', 'moonStone'];
const extrait = JSON.parse(runInContext(`JSON.stringify({
  EVOLUTIONS, STONE_EVOLUTIONS,
  especes: Array.from({ length: 151 }, (_, i) => ({
    numero: i + 1, stade: getEvolutionStage(i + 1), peutEvoluer: canEvolveAny(i + 1),
    pierres: Object.fromEntries(${JSON.stringify(pierres)}.map(pierre =>
      [pierre, getStoneEvolution(i + 1, pierre)]))
  }))
})`, contexte));
/** @type {{ numero: number, nom: string }[]} */
const pokemon = JSON.parse(await readFile(new URL('data/pokemon.json', racine), 'utf8')).pokemon;
/** @type {{ inventaire?: string }[]} */
const objets = JSON.parse(await readFile(new URL('data/objets.json', racine), 'utf8'));
const niveau = [];
const pierre = [];
for (const [de, evolution] of Object.entries(extrait.EVOLUTIONS)) {
  niveau.push({ de: Number(de), vers: evolution.id, niveau: evolution.lvl });
}
for (const [de, branches] of Object.entries(extrait.STONE_EVOLUTIONS)) {
  for (const evolution of Array.isArray(branches) ? branches : [branches]) {
    pierre.push({ de: Number(de), vers: evolution.id, pierre: evolution.stone });
  }
}
for (const evolution of [...Object.values(extrait.EVOLUTIONS), ...Object.values(extrait.STONE_EVOLUTIONS).flat()]) {
  if (pokemon.find(p => p.numero === evolution.id)?.nom !== evolution.name) {
    throw new Error(`Nom V1 différent pour ${evolution.id}`);
  }
}
for (const cle of pierres) {
  if (!objets.some(objet => objet.inventaire === cle)) throw new Error(`Inventaire absent : ${cle}`);
}
if (niveau.length !== 56 || pierre.length !== 16 || new Set(pierre.map(e => e.de)).size !== 14) {
  throw new Error('Nombre inattendu d’évolutions V1');
}
const fixture = { empreinte: empreinte.digest('hex'), ...extrait };
for (const [fichier, contenu] of [['data/evolutions.json', { niveau, pierre }],
  ['tests/fixtures/v1-evolutions.json', fixture]]) {
  const attendu = `${JSON.stringify(contenu, null, 2)}\n`;
  const url = new URL(fichier, racine);
  if (process.argv.includes('--verifier')) {
    if ((await readFile(url, 'utf8')).replace(/\r\n/g, '\n') !== attendu) {
      throw new Error(`Extraction différente : ${fichier}`);
    }
  } else {
    await writeFile(url, attendu);
  }
}
console.log(`Évolutions V1 ${process.argv.includes('--verifier') ? 'vérifiées' : 'extraites'} : ${fixture.empreinte}`);
