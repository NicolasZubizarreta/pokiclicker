import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createContext, runInContext } from 'node:vm';

const racine = new URL('../', import.meta.url);
const sansEffet = () => {};
/** @param {string} chemin @param {number} debut @param {number} fin */
async function extrait(chemin, debut, fin) {
  return (await readFile(new URL(chemin, racine), 'utf8')).split(/\r?\n/).slice(debut - 1, fin).join('\n');
}
const pantheon = await extrait('legacy/js/ui/pantheon.js', 43, 275);
const victoire = await extrait('legacy/js/ui/victory.js', 1, 57);
const constantes = await extrait('legacy/js/data/constants.js', 493, 497);
const dialogue = await extrait('legacy/js/app/main.js', 210, 232);
const finDialogue = dialogue.indexOf('return;');
if (finDialogue < 0) throw new Error('Branche Panthéon de nextDialog introuvable.');
const prochainDialogue = dialogue.slice(0, finDialogue + 'return;'.length) + '\n}\n}\n}';
const sprite = await extrait('legacy/js/app/main.js', 309, 311);
const titre = await extrait('legacy/index.html', 274, 278);
const bouton = await extrait('legacy/index.html', 516, 516);
const rainbow = await extrait('legacy/css/styles.css', 180, 180);
const titleSlam = await extrait('legacy/css/styles.css', 241, 247);

/** @param {number} [alea] */
function harnais(alea = 0.5) {
  let maintenant = 0;
  let identifiant = 0;
  /** @type {Map<number, { rappel: () => void, delai: number, tMs: number, intervalle: boolean }>} */
  const rappels = new Map();
  /** @type {Array<{ delai: number, tMs: number, intervalle: boolean }>} */
  const minuteurs = [];
  /** @type {Array<{ tMs: number, balise: string, attributs: Record<string, string | number>, style: Record<string, string> }>} */
  const ajouts = [];
  /** @type {Map<string, ReturnType<typeof element>>} */
  const elements = new Map();
  /** @param {string} balise */
  function element(balise) {
    /** @type {Record<string, string | number>} */
    const attributs = {};
    /** @type {Record<string, string>} */
    const style = {};
    return {
      attributs, style, innerHTML: '', textContent: '',
      classList: { add: sansEffet, remove: sansEffet },
      firstElementChild: { classList: { add: sansEffet, remove: sansEffet } },
      setAttribute: (/** @type {string} */ nom, /** @type {string | number} */ valeur) => { attributs[nom] = valeur; },
      setAttributeNS: sansEffet, remove: sansEffet, getBoundingClientRect: sansEffet,
      appendChild: (/** @type {{ attributs: Record<string, string | number>, style: Record<string, string>, textContent: string }} */ enfant) => {
        ajouts.push({ tMs: maintenant, balise: enfant.attributs.width ? 'image' : enfant.textContent ? 'text' : balise, attributs: { ...enfant.attributs }, style: { ...enfant.style } });
      },
    };
  }
  /** @param {string} id */
  function obtenir(id) {
    if (!elements.has(id)) elements.set(id, element(id));
    return elements.get(id);
  }
  /** @param {() => void} rappel @param {number} delai @param {boolean} intervalle */
  function programmer(rappel, delai, intervalle) {
    const tMs = maintenant + delai;
    minuteurs.push({ delai, tMs, intervalle });
    rappels.set(++identifiant, { rappel, delai, tMs, intervalle });
    return identifiant;
  }
  const contexte = createContext({
    document: { getElementById: obtenir, createElement: element, createElementNS: (/** @type {string} */ _ns, /** @type {string} */ nom) => element(nom) },
    requestAnimationFrame: sansEffet,
    setTimeout: (/** @type {() => void} */ rappel, /** @type {number} */ delai) => programmer(rappel, delai, false),
    setInterval: (/** @type {() => void} */ rappel, /** @type {number} */ delai) => programmer(rappel, delai, true),
    clearTimeout: (/** @type {number} */ id) => rappels.delete(id),
    clearInterval: (/** @type {number} */ id) => rappels.delete(id),
    updateBg: sansEffet, updateZone: sansEffet, renderShop: sansEffet, renderBag: sansEffet, renderPC: sansEffet,
    spawnEnemy: sansEffet, playTone: sansEffet, getArtwork: () => 'sprite.png',
    swapProfSprite: (/** @type {string} */ chemin, /** @type {number} */ delaiMs) => { resultat.sprite = { chemin, delaiMs }; },
    startChenChallengeSequence: () => { resultat.destination = 'defi-chen'; },
    startJohtoIntro: sansEffet,
    changeZone: () => { resultat.destination = 'bourg-palette'; },
  });
  /** @type {{ sprite?: { chemin: string, delaiMs: number }, destination?: string }} */
  const resultat = {};
  /** @param {string} code */
  const executer = code => runInContext(code, contexte);
  executer(`var state = {}, pantheonTimeouts = [], victoryInterval, fireworkInterval;
    var activeDialogs = [], introIndex = 0, isEndingSequence = false;
    Math.random = () => ${alea};
    ${constantes}\n${pantheon}\n${victoire}
    ${prochainDialogue}
  `);
  function avancer() {
    for (;;) {
      const suivant = [...rappels].filter(([, r]) => !r.intervalle).sort((a, b) => a[1].tMs - b[1].tMs || a[0] - b[0])[0];
      if (!suivant) return;
      rappels.delete(suivant[0]);
      maintenant = suivant[1].tMs;
      suivant[1].rappel();
    }
  }
  return { executer, avancer, minuteurs, ajouts, rappels, resultat };
}

const entrees = [true, false].map(premiere => {
  const h = harnais();
  h.executer(`state = { hasSeenPantheonIntro: ${!premiere} }; enterHallOfFame(); animateHallOfFame = () => {};`);
  h.avancer();
  return { premiere, minuteurs: h.minuteurs.map(m => m.delai), dialogues: h.executer('activeDialogs') };
});
const sortieDialogue = harnais();
sortieDialogue.executer('activeDialogs = PANTHEON_DIALOGS; introIndex = activeDialogs.length; animateHallOfFame = () => {}; nextDialog();');
sortieDialogue.avancer();
sortieDialogue.executer(`var currentIndex = 2, INTRO_DIALOGS = []; ${sprite}`);

const equipes = Array.from({ length: 6 }, (_, i) => {
  const nombre = i + 1;
  const h = harnais();
  h.executer(`state = { team: Array.from({ length: ${nombre} }, (_, i) => ({ id: i + 1, name: 'Pokemon', level: 50 })) }; animateHallOfFame();`);
  h.avancer();
  const premierIntervalle = h.minuteurs.find(m => m.intervalle);
  if (!premierIntervalle) throw new Error('Final V1 non déclenché.');
  return {
    nombre,
    chutes: h.ajouts.filter(a => a.balise === 'image'),
    niveaux: h.ajouts.filter(a => a.balise === 'text'),
    finalMs: premierIntervalle.tMs - premierIntervalle.delai,
    delaisChutesMs: h.minuteurs.slice(0, nombre).map(m => m.delai),
    delaisNiveauxMs: h.minuteurs.filter(m => !m.intervalle && m.delai === 1000).slice(0, nombre).map(m => m.delai),
  };
});
const effets = [0, 0.5, 1].map(alea => {
  const h = harnais(alea);
  h.executer('startVictoryAnimation();');
  for (const r of [...h.rappels.values()]) r.rappel();
  h.avancer();
  h.executer('stopVictoryAnimation();');
  return {
    alea, periodesMs: h.minuteurs.filter(m => m.intervalle).map(m => m.delai),
    viesMs: h.minuteurs.filter(m => !m.intervalle).map(m => m.delai),
    transition: h.ajouts[0]?.style.transition,
    intervallesRestants: h.rappels.size,
  };
});
const sorties = [true, false].map(defi => {
  const h = harnais();
  h.executer(`state = { chenChallengePending: ${defi}, leagueWins: 1 }; exitPantheon();`);
  h.avancer();
  return { defi, minuteurs: h.minuteurs.map(m => m.delai), destination: h.resultat.destination };
});
const six = equipes[5];
if (!six || six.chutes.length !== 6 || six.niveaux.length !== 6) throw new Error('Les six socles V1 n’ont pas été relevés.');
const premiereImage = six.chutes[0];
const premierNiveau = six.niveaux[0];
if (!premiereImage || !premierNiveau) throw new Error('Géométrie V1 absente.');
const taille = Number(premiereImage.attributs.width);
const centres = six.niveaux.map(n => Number(n.attributs.x));
// Les centres y sont relevés dans la déclaration V1, puis recoupés avec les attributs du DOM.
const positions = [...pantheon.matchAll(/\{x: (\d+), y: (\d+)\}/g)].map(m => ({ x: Number(m[1]), y: Number(m[2]) }));
if (positions.length !== 6 || positions.some((p, i) => p.x !== centres[i])) throw new Error('Socles V1 incohérents.');
const premierSocle = positions[0];
const premiereEntree = entrees[0];
const premierEffet = effets[0];
const sortieDefi = sorties[0];
const sortieNormale = sorties[1];
const entrePokemonMs = six.delaisChutesMs[1];
if (!premierSocle || !premiereEntree || !premierEffet || !sortieDefi || !sortieNormale || entrePokemonMs === undefined) {
  throw new Error('Relevé V1 incomplet.');
}
const base = Number(premiereImage.attributs.y) - premierSocle.y + taille;
const niveau = Number(premierNiveau.attributs.y) - premierSocle.y;
const depart = Number(premiereImage.style.transform?.match(/translateY\((-?\d+)px\)/)?.[1]);
const durees = effets.map(e => Number(e.transition?.match(/top (\d+)s/)?.[1]) * 1000);
const entree = premiereEntree.minuteurs;
const sortieChen = sortieDialogue.minuteurs.map(m => m.delai);
const texteTitre = titre.match(/<h1[^>]*>(.*?)<\/h1>/)?.[1];
const libelleSortie = bouton.match(/>([^<]+)<\/button>/)?.[1];
if (!texteTitre || !libelleSortie) throw new Error('Titre ou bouton de sortie V1 absent.');
const donnees = {
  version: 1,
  socles: positions.map(p => ({ x: p.x / 1024, y: p.y / 1024 })),
  geometrie: { tailleSprite: taille / 1024, decalageBase: base / 1024, decalageNiveau: niveau / 1024, departChute: depart / 1024 },
  delais: {
    fonduNoirMs: entree[0], fonduRetourMs: entree[1], entreeChenMs: entree[2],
    sortieChenMs: sortieChen[0], apresChenMs: sortieChen[1],
    entrePokemonMs, niveauMs: six.delaisNiveauxMs[0],
    finalApresEquipeMs: Number(six.finalMs) - six.nombre * entrePokemonMs,
    defiChenMs: sortieDefi.minuteurs[0], annonceJohtoMs: sortieNormale.minuteurs[0],
  },
  effets: {
    confettiPeriodeMs: premierEffet.periodesMs[0], confettiVieMs: premierEffet.viesMs[0],
    confettiDureeMinMs: Math.min(...durees), confettiDureeMaxMs: Math.max(...durees),
    feuPeriodeMs: premierEffet.periodesMs[1], feuVieMs: premierEffet.viesMs[1],
  },
  dialogues: premiereEntree.dialogues,
  titre: texteTitre.replace(/<br\s*\/?\s*>/g, '\n'),
  boutonSortie: libelleSortie,
};
const fixture = {
  sources: { pantheon: 'legacy/js/ui/pantheon.js:43-275', victoire: 'legacy/js/ui/victory.js:1-57' },
  entrees, sortieDialogueMs: sortieChen, spriteTroisiemeLigne: sortieDialogue.resultat.sprite,
  equipes, effets, sorties, animations: { rainbow: rainbow.trim(), titre: titleSlam.trim() },
};
const empreinte = createHash('sha256');
for (const [chemin, contenu] of /** @type {Array<[string, unknown]>} */ ([
  ['data/pantheon.json', donnees], ['tests/fixtures/v1-pantheon.json', fixture],
])) {
  const texte = JSON.stringify(contenu, null, 2) + '\n';
  if (process.argv.includes('--verifier')) {
    if (await readFile(new URL(chemin, racine), 'utf8') !== texte) {
      throw new Error(`${chemin} diffère de la V1 : relancer node scripts/extraire-pantheon-v1.mjs`);
    }
  } else {
    await writeFile(new URL(chemin, racine), texte);
  }
  empreinte.update(texte);
}
console.log(`Empreinte SHA-256 : ${empreinte.digest('hex')}`);
