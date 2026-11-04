// Comparaison des mesures du simulateur aux cibles de data/equilibrage.json (tickets D et E, phase 3).
// Le fichier ne vérifie pas ses types : il appelle le simulateur, lui-même non typé.
/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { chargerCoeur, jouerParcours } from './simuler-parcours.mjs';

const racine = new URL('../', import.meta.url);
export const zonesKanto = JSON.parse(readFileSync(new URL('data/regions/kanto/zones.json', racine), 'utf8')).zones;
export const lireCibles = () => readFileSync(new URL('data/equilibrage.json', racine), 'utf8');

// Le texte brut permet de signaler les clés dupliquées que JSON.parse écraserait.
export function validerCibles(source, catalogue = zonesKanto) {
  const erreurs = [];
  let cibles = source;
  if (typeof source === 'string') {
    try { cibles = JSON.parse(source); } catch (e) { return { erreurs: [`JSON invalide : ${e.message}`] }; }
    const piles = [];
    for (const token of source.matchAll(/"(?:\\.|[^"\\])*"\s*:?|[{}]/g)) {
      if (token[0] === '{') piles.push(new Set());
      else if (token[0] === '}') piles.pop();
      else if (token[0].endsWith(':')) {
        const cle = JSON.parse(token[0].slice(0, -1));
        if (piles.at(-1).has(cle)) erreurs.push(`Doublon : ${cle}`);
        piles.at(-1).add(cle);
      }
    }
  }
  const objet = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const nombre = (v, min = 0) => typeof v === 'number' && Number.isFinite(v) && v >= min;
  if (!objet(cibles)) return { erreurs: [...erreurs, 'Cibles : objet attendu'] };
  if (cibles.version !== 1 || cibles.statut !== 'propose' || typeof cibles.valide !== 'boolean') erreurs.push('Version, statut ou valide invalide');
  if (cibles.unites?.tempsVisMinutes !== 'minutes' || cibles.unites?.margeVisee !== 'rapport sans unité'
    || typeof cibles.convention !== 'string' || !cibles.convention.trim()) erreurs.push('Unités ou convention manquantes');
  const p = cibles.protocole;
  if (!objet(p) || ![1, 4, 7].includes(p.starter) || !Number.isInteger(p.graine) || !nombre(p.graine)
    || !nombre(p.clicsParSeconde) || p.clicsParSeconde > 12 || !['reel', 'theorique'].includes(p.pokedex) || p.reactions !== false) erreurs.push('Protocole invalide (réactions non prises en charge)');
  if (!nombre(cibles.tolerance)) erreurs.push('Tolérance invalide');
  if (!objet(cibles.ligue) || !nombre(cibles.ligue.minMinutes) || !nombre(cibles.ligue.maxMinutes)
    || cibles.ligue.minMinutes > cibles.ligue.maxMinutes) erreurs.push('Bornes de Ligue invalides');
  const zones = objet(cibles.zones) ? cibles.zones : {};
  if (!objet(cibles.zones)) erreurs.push('Zones : objet attendu');
  for (const [id, z] of Object.entries(zones)) {
    if (!catalogue.some(zone => zone.id === id && !zone.sansCombat)) erreurs.push(`Zone inconnue ou sans combat : ${id}`);
    if (!objet(z) || !nombre(z.tempsVisMinutes) || !nombre(z.margeVisee, -1) || typeof z.note !== 'string') erreurs.push(`Valeurs invalides : ${id}`);
  }
  for (const z of catalogue.filter(z => !z.sansCombat)) if (!Object.hasOwn(zones, z.id)) erreurs.push(`Zone manquante : ${z.id}`);
  const total = Object.values(zones).reduce((s, z) => s + (z?.tempsVisMinutes ?? NaN), 0);
  if (!nombre(total) || total < 60 || total > 90) erreurs.push(`Total des cibles hors de 60–90 minutes : ${total}`);
  return { cibles, erreurs };
}

export function evaluerParcours(cibles, resultat) {
  if (cibles.valide !== true) return [];
  const erreurs = [];
  const contexte = `tolérance ${cibles.tolerance}; protocole ${JSON.stringify(cibles.protocole)}`;
  const minutes = resultat.tempsMs / 60000;
  const ligue = resultat.zones.find(z => z.id === 'kanto.ligue-pokemon');
  if (!ligue?.victoire || !Number.isFinite(minutes) || minutes < cibles.ligue.minMinutes || minutes > cibles.ligue.maxMinutes) {
    erreurs.push(`kanto.ligue-pokemon : temps mesuré ${minutes} minutes, cible ${cibles.ligue.minMinutes}–${cibles.ligue.maxMinutes} minutes, victoire ${ligue?.victoire ?? false}; ${contexte}`);
  }
  for (const [id, cible] of Object.entries(cibles.zones)) {
    const z = resultat.zones.find(z => z.id === id);
    const temps = z ? (z.sortieMs - z.entreeMs) / 60000 : NaN;
    if (!z?.victoire || !Number.isFinite(temps) || temps > cible.tempsVisMinutes * (1 + cibles.tolerance)) {
      erreurs.push(`${id} : temps mesuré ${temps} minutes, cible ${cible.tempsVisMinutes} minutes; ${contexte}`);
    }
  }
  return erreurs;
}

export async function simulerCibles(cibles) {
  const { M, fermer } = await chargerCoeur();
  try {
    const debut = performance.now();
    const resultat = jouerParcours(M, { ...cibles.protocole, clics: cibles.protocole.clicsParSeconde });
    return { resultat, simulationMs: performance.now() - debut };
  } finally { await fermer(); }
}

function revisionDonnees() {
  const hash = createHash('sha256');
  const parcourir = (url, prefixe = '') => {
    for (const entree of readdirSync(url, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name, 'en'))) {
      const chemin = prefixe + entree.name;
      const fichier = new URL(entree.name + (entree.isDirectory() ? '/' : ''), url);
      if (entree.isDirectory()) parcourir(fichier, chemin + '/');
      else if (chemin !== 'equilibrage.json') hash.update(chemin).update('\0').update(readFileSync(fichier)).update('\0');
    }
  };
  parcourir(new URL('data/', racine));
  return hash.digest('hex');
}

async function main() {
  const { cibles, erreurs } = validerCibles(lireCibles());
  if (erreurs.length) { console.error(erreurs.join('\n')); process.exitCode = 1; return; }
  const { resultat } = await simulerCibles(cibles);
  const zones = resultat.zones.map(z => {
    const cible = cibles.zones[z.id];
    const tempsMinutes = (z.sortieMs - z.entreeMs) / 60000;
    const marge = 1 / z.margeAvecClics - 1;
    return { id: z.id, tempsMinutes, tempsViseMinutes: cible.tempsVisMinutes,
      ecartMinutes: tempsMinutes - cible.tempsVisMinutes,
      ecartPourcent: cible.tempsVisMinutes === 0 ? null : 100 * (tempsMinutes / cible.tempsVisMinutes - 1),
      marge, margeVisee: cible.margeVisee, ecartMarge: marge - cible.margeVisee };
  });
  const rapport = { statut: cibles.statut, valide: cibles.valide, revision: revisionDonnees(), protocole: cibles.protocole,
    avertissement: 'durée simulée, pas une promesse de durée réelle',
    convention: 'Marge (rapport sans unité) = dégâts infligeables sur 30 secondes / PV du boss − 1 = 1 / margeAvecClics − 1 ; premier essai, équipe et bonus du simulateur.',
    zones, totalMinutes: resultat.tempsMs / 60000, totalViseMinutes: Object.values(cibles.zones).reduce((s, z) => s + z.tempsVisMinutes, 0),
    erreurs: evaluerParcours(cibles, resultat) };
  if (process.argv.includes('--json')) console.log(JSON.stringify(rapport, null, 2));
  else {
    const f = n => n === null ? 'n/d' : n.toFixed(2);
    console.log(`Statut : ${rapport.statut} ; validé : ${rapport.valide}\nRévision des données (SHA-256, data hors cibles) : ${rapport.revision}\nStarter ${cibles.protocole.starter} ; Pokédex ${cibles.protocole.pokedex} ; graine ${cibles.protocole.graine} ; clics/s ${cibles.protocole.clicsParSeconde} ; réactions ${cibles.protocole.reactions}\n${rapport.avertissement}\n${rapport.convention}\n\n| Zone | Temps mesuré / visé / écart (minutes et %) | Marge mesurée / visée / écart (rapport sans unité) |\n| --- | --- | --- |`);
    for (const z of zones) console.log(`| ${z.id} | ${f(z.tempsMinutes)} / ${f(z.tempsViseMinutes)} / ${f(z.ecartMinutes)} min (${f(z.ecartPourcent)} %) | ${f(z.marge)} / ${f(z.margeVisee)} / ${f(z.ecartMarge)} |`);
    console.log(`\nTotal : ${f(rapport.totalMinutes)} minutes mesurées / ${f(rapport.totalViseMinutes)} minutes visées.`);
  }
  if (rapport.erreurs.length) process.exitCode = 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
