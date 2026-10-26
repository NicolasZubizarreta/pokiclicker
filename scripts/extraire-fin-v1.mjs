import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
/** @type {Record<string, string>} */
const sources = {};
/** @param {string} chemin @param {number} debut @param {number} fin */
async function lire(chemin, debut, fin) {
  const texte = await readFile(new URL(chemin, racine), 'utf8');
  sources[chemin] = createHash('sha256').update(texte).digest('hex');
  return texte.replace(/^\uFEFF/, '').split(/\r?\n/).slice(debut - 1, fin).join('\n');
}
const combat = await lire('legacy/js/game/combat.js', 1, 28);
const minuterie = await lire('legacy/js/game/combat.js', 38, 54);
const adversaire = await lire('legacy/js/game/combat.js', 76, 92);
const sauvegarde = await lire('legacy/js/game/save.js', 143, 557);
const constantes = await lire('legacy/js/data/constants.js', 479, 507);
const html = await lire('legacy/index.html', 280, 321);
const css = await lire('legacy/css/styles.css', 250, 386);

/** @param {string} texte @param {RegExp} expression */
function relever(texte, expression) {
  const resultat = texte.match(expression)?.[1];
  if (resultat === undefined) throw new Error(`Source V1 inattendue : ${expression}`);
  return resultat;
}
/** @param {string} texte @param {RegExp} expression */
const nombre = (texte, expression) => Number(relever(texte, expression));
/** @param {string} nom */
const tableau = nom => `const ${nom} = ${relever(constantes, new RegExp(`const ${nom} = (\\[[\\s\\S]*?\\]);`))};`;
const contexte = createContext({});
runInContext(combat, contexte);
runInContext(relever(sauvegarde, /(function canTriggerChenChallenge\(\) \{[\s\S]*?\n\})/), contexte);
for (const nom of ['ENDING_DIALOGS', 'CHEN_SECRET_INTRO_DIALOGS', 'CHEN_SECRET_WIN_DIALOGS']) {
  runInContext(tableau(nom), contexte);
}
// Revenir dans le realm Node évite de conserver des objets du contexte V1.
/** @param {string} expression */
const evaluer = expression => JSON.parse(runInContext(`JSON.stringify(${expression})`, contexte));
const minuteurMs = nombre(minuterie, /t\/(\d+)\*100/) * nombre(minuterie, /\}, (\d+)\);/);
const capture = nombre(adversaire, /enemy.catchRate = (\d+);/);
const rosters = [1, 4, 7, null].map(starter => {
  runInContext(`state = { starterId: ${starter} };`, contexte);
  /** @type {{ name: string, id: number, level: number }[]} */
  const roster = evaluer('getChenChallengeRoster()');
  if (roster.length !== 6) throw new Error('Le défi V1 doit comporter six combats.');
  return { starter, combats: roster.map((pokemon, index) => ({
    etape: index + 1, nom: pokemon.name, pokemon: pokemon.id, niveau: pokemon.level, capture, minuteurMs,
  })) };
});
const conditions = [];
for (const leagueWins of [0, 1, 2]) {
  for (const hasSeenEnding of [false, true]) {
    for (const pokedex of [150, 151, 152, 0]) {
      for (const chenChallengeCompleted of [false, true]) {
        runInContext(`state = { leagueWins: ${leagueWins}, hasSeenEnding: ${hasSeenEnding}, pokedex: Array(${pokedex}), chenChallengeCompleted: ${chenChallengeCompleted} };`, contexte);
        conditions.push({ leagueWins, hasSeenEnding, pokedex, chenChallengeCompleted, possible: evaluer('canTriggerChenChallenge()') });
      }
    }
  }
}
const dialogues = {
  fin: evaluer('ENDING_DIALOGS'), intro: evaluer('CHEN_SECRET_INTRO_DIALOGS'), victoire: evaluer('CHEN_SECRET_WIN_DIALOGS'),
};
const defaut = rosters.find(cas => cas.starter === null);
if (!defaut) throw new Error('Roster V1 par défaut manquant.');
const defi = {
  version: 1, combats: defaut.combats,
  counter: rosters.map(cas => {
    const starter = cas.combats[4];
    if (!starter) throw new Error('Starter V1 manquant.');
    return { starter: cas.starter, pokemon: starter.pokemon, nom: starter.nom };
  }),
  dialogues, messages: { echec: relever(sauvegarde, /showPalletSpeech\("([^"]+)", 5000\)/) },
};
/** @type {{ titre: string, lignes: string[] }[]} */
const sections = [];
let titre;
let message;
for (const [, classe = '', contenu = ''] of html.matchAll(/<div class="([^"]+)"[^>]*>([^<]*(?:<br>[^<]*)*)<\/div>/g)) {
  const texte = contenu.trim();
  if (classe.startsWith('end-credits-title ')) titre = texte;
  if (classe.startsWith('end-credits-message ')) message = texte.replace(/\s*<br>\s*/g, '\n');
  if (classe.startsWith('credits-section-title ')) sections.push({ titre: texte, lignes: [] });
  if (classe === 'credits-line') {
    const section = sections.at(-1);
    if (!section) throw new Error('Ligne de crédits sans section.');
    section.lignes.push(texte);
  }
}
if (!titre || !message || sections.length !== 6) throw new Error('Crédits V1 incomplets.');
const textesCredits = { titre, message, sections };
const temps = {
  delaiMs: nombre(sauvegarde, /const creditsDelayMs = (\d+);/),
  dureeMs: nombre(sauvegarde, /const creditsDurationMs = (\d+);/),
  finMs: nombre(sauvegarde, /const outroBufferMs = (\d+);/),
  fonduMs: nombre(relever(sauvegarde, /(function endFinalCreditsSequence[\s\S]*?\n\})/), /\}, (\d+)\);/),
};
/** @type {string[]} */
const images = runInContext(relever(sauvegarde, /const END_CREDITS_IMAGES = (\[[\s\S]*?\]);/), contexte);
const imagesOmises = ['img/kanto/background/Pantheon.png'];
const credits = {
  version: 1, ...textesCredits, temps,
  imagesFlottantes: {
    maximum: nombre(sauvegarde, /const maxActive = (\d+);/),
    intervalleMs: nombre(sauvegarde, /setInterval\(spawnOne, (\d+)\)/),
    taillePourcent: [nombre(sauvegarde, /const size = randInt\((\d+),/), nombre(sauvegarde, /const size = randInt\(\d+, (\d+)\)/)],
    vieMs: [nombre(sauvegarde, /const stayMs = randInt\((\d+),/), nombre(sauvegarde, /const stayMs = randInt\(\d+, (\d+)\)/)],
    opacite: nombre(css, /20% \{ opacity: ([\d.]+);/),
    images: images.filter(image => !imagesOmises.includes(image)),
  },
  imagesOmises,
};
const fixture = {
  sources, rosters, conditions, dialogues, credits: textesCredits, images,
  temps: {
    credits: temps,
    css: {
      delaiMs: nombre(css, /--credits-delay: ([\d.]+)s;/) * 1000,
      dureeMs: nombre(css, /--credits-duration: ([\d.]+)s;/) * 1000,
      fonduMs: nombre(css, /\.credits-fadeout \{[^}]*transition: opacity (\d+)ms ease;/),
    },
    // Délais et transitions des séquences de fin, intro, victoire et échec.
    rappelsMs: [...sauvegarde.matchAll(/\}, (\d+)\);/g)].map(cas => Number(cas[1])),
    transitions: [...sauvegarde.matchAll(/prof.style.transition = ["']([^"']+)["']/g)].map(cas => cas[1]),
  },
};
/** @type {Array<[string, unknown]>} */
const sorties = [
  ['data/credits.json', credits], ['data/defi-chen.json', defi], ['tests/fixtures/v1-fin.json', fixture],
];
const empreinte = createHash('sha256');
for (const [chemin, contenu] of sorties) {
  const texte = JSON.stringify(contenu, null, 2) + '\n';
  if (process.argv.includes('--verifier')) {
    if (await readFile(new URL(chemin, racine), 'utf8') !== texte) {
      throw new Error(`${chemin} diffère de la V1 : relancer node scripts/extraire-fin-v1.mjs`);
    }
  } else {
    await writeFile(new URL(chemin, racine), texte);
  }
  empreinte.update(texte);
}
console.log(`Empreinte SHA-256 : ${empreinte.digest('hex')}`);
