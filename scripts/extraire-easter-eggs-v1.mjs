import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const contexte = createContext({});
/** @type {Record<string, string>} */
const empreintes = {};
/** @param {string} chemin @param {number} [debut] @param {number} [fin] */
async function lire(chemin, debut, fin) {
  const brut = (await readFile(new URL(chemin, racine), 'utf8')).replace(/^\uFEFF/, '');
  const texte = debut ? brut.split(/\r?\n/).slice(debut - 1, fin).join('\n') : brut;
  empreintes[`${chemin}${debut ? `:${debut}-${fin}` : ''}`] = createHash('sha256').update(texte).digest('hex');
  return texte;
}
runInContext(await lire('legacy/js/data/constants.js'), contexte);
runInContext(await lire('legacy/js/game/stats.js', 111, 137), contexte);
for (const nom of ['EVOLUTIONS', 'STONE_EVOLUTIONS', 'getEvolutionStage']) {
  if (!runInContext(`typeof ${nom} !== 'undefined'`, contexte)) throw new Error(`Variable V1 manquante : ${nom}`);
}
const stades = Array.from({ length: 151 }, (_, index) => {
  const numero = index + 1;
  const stade = runInContext(`getEvolutionStage(${numero})`, contexte);
  if (![1, 2, 3].includes(stade)) throw new Error(`Stade V1 invalide pour ${numero}`);
  return { numero, stade };
});
/** @type {Array<[string, string, number, number]>} */
const definitions = [
  ['equipe', 'legacy/js/ui/render.js', 79, 97],
  ['pc', 'legacy/js/ui/render.js', 186, 194],
  ['fiche', 'legacy/js/ui/summary.js', 14, 21],
  ['renommage', 'legacy/js/ui/summary.js', 232, 237],
  ['pension', 'legacy/js/game/daycare.js', 198, 203],
  ['pantheon', 'legacy/js/ui/pantheon.js', 146, 181],
];
const noms = ['dinnerbone', 'grumm', 'jeb_', 'caca', 'daran'];
const sites = [];
let alternanceEvolutionMs;
for (const [site, source, debut, fin] of definitions) {
  const extrait = await lire(source, debut, fin);
  const image = extrait.match(/`img\/kanto\/EasterEgg\/DaranStade\$\{getEvolutionStage\(p.id\)\}\.png`/)?.[0];
  if (!image) throw new Error(`Image Daran V1 absente : ${site}`);
  let code = extrait;
  if (site === 'equipe' || site === 'pc') code = code.slice(0, code.indexOf('if (pNameLower === "daran")'));
  if (site === 'fiche') code = code.split('\n').slice(1).join('\n');
  if (site === 'pantheon') code = code.slice(0, code.indexOf('const img ='));
  if (site === 'equipe') {
    alternanceEvolutionMs = Number(extrait.match(/Math\.floor\(timeLeft \/ (\d+)\)/)?.[1]);
    if (!Number.isFinite(alternanceEvolutionMs)) throw new Error('Alternance V1 introuvable.');
  }
  const effets = noms.map(nom => {
    contexte.nom = nom;
    return JSON.parse(runInContext(`JSON.stringify((() => {
      const p = { name: nom, id: 1, img: 'sprite', isShiny: false };
      const newName = nom;
      const classes = new Set();
      const sprite = { src: '', className: '', classList: {
        add: (...valeurs) => valeurs.forEach(valeur => classes.add(valeur)),
        remove: (...valeurs) => valeurs.forEach(valeur => classes.delete(valeur)),
      } };
      const getArtwork = () => 'sprite';
      let displayImg = p.img;
      ${code}
      return { nom, classe: typeof specialClass === 'string' ? specialClass : [...classes].join(' '),
        transformation: typeof transformRotate === 'string' ? transformRotate : '',
        filtre: typeof filterStyle === 'string' ? filterStyle : '',
        image: nom === 'daran' ? ${image} : null };
    })())`, contexte));
  });
  sites.push({ site, source, lignes: [debut, fin], effets });
}
const cssSource = (await lire('legacy/css/styles.css', 91, 91)) + '\n'
  + await lire('legacy/css/styles.css', 178, 190);
/** @type {Record<string, string>} */
const css = {};
for (const regle of cssSource.matchAll(/(@keyframes\s+([\w-]+)|\.([\w.-]+))\s*\{/g)) {
  const debut = regle.index;
  let fin = debut + regle[0].length;
  let profondeur = 1;
  while (profondeur && fin < cssSource.length) {
    if (cssSource[fin] === '{') profondeur++;
    if (cssSource[fin] === '}') profondeur--;
    fin++;
  }
  if (profondeur) throw new Error('Règle CSS V1 incomplète.');
  const nom = regle[2] ?? regle[3];
  if (!nom) throw new Error('Nom de règle CSS V1 absent.');
  css[nom] = cssSource.slice(debut, fin).trim();
}
const donnees = {
  version: 1,
  effets: [
    { nom: 'Dinnerbone / Grumm', declencheurs: noms.slice(0, 2), effet: 'retourne', assets: [], inactif: false },
    { nom: 'Jeb_', declencheurs: ['jeb_'], effet: 'arc-en-ciel', assets: [], inactif: false },
    { nom: 'Caca', declencheurs: ['caca'], effet: 'caca', assets: [], inactif: false },
    { nom: 'Daran', declencheurs: ['daran'], effet: 'photo', assets: [1, 2, 3].map(stade => `img/easter-eggs/daran-stade-${stade}.webp`), inactif: false },
    ...['Bjorn', 'Gabriel'].map(nom => ({ nom, declencheurs: [nom.toLowerCase()], effet: null, assets: [], inactif: true,
      raison: 'Apparence non définie par Nicolas (design/DESIGN.md)' })),
  ],
  css,
};
/** @type {Array<[string, unknown]>} */
const sorties = [
  ['data/easter-eggs.json', donnees],
  ['tests/fixtures/v1-easter-eggs.json', { version: 1, empreintes, stades, sites, css, alternanceEvolutionMs }],
];
const empreinte = createHash('sha256');
for (const [chemin, contenu] of sorties) {
  const texte = JSON.stringify(contenu, null, 2) + '\n';
  if (process.argv.includes('--verifier')) {
    if (await readFile(new URL(chemin, racine), 'utf8') !== texte) {
      throw new Error(`${chemin} diffère de la V1 : relancer node scripts/extraire-easter-eggs-v1.mjs`);
    }
  } else {
    await writeFile(new URL(chemin, racine), texte);
  }
  empreinte.update(texte);
}
console.log(`Empreinte SHA-256 : ${empreinte.digest('hex')}`);
