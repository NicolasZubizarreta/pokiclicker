import donnees from '../../data/casino.json';
import { evaluer } from './conditions';
import type { EtatMonde, ResultatCondition } from './conditions';
import type { chargerMonde } from './monde';

export type Casino = typeof donnees;
export type Face = keyof Casino['pileOuFace']['faces'];
export type Triplet = readonly [string, string, string];
type RegionCasino = { readonly jetons: number };
type Resultat<R, T = object> = ({ ok: true; region: R; message: string } & T) | { ok: false; raison: string };

// Le document fournit aussi la forme attendue : champs requis, tableaux complets,
// chaînes non vides et constantes numériques finies et positives.
function validerForme(valeur: unknown, modele: unknown): void {
  if (modele === null) {
    if (valeur !== null && (typeof valeur !== 'string' || !valeur.trim())) throw new Error('Image casino invalide');
  } else if (Array.isArray(modele)) {
    if (!Array.isArray(valeur) || valeur.length !== modele.length) throw new Error('Liste casino invalide');
    modele.forEach((entree, i) => validerForme(valeur[i], entree));
  } else if (typeof modele === 'object') {
    if (!valeur || typeof valeur !== 'object') throw new Error('Données casino invalides');
    for (const [cle, entree] of Object.entries(modele)) {
      validerForme((valeur as Record<string, unknown>)[cle], entree);
    }
  } else if (typeof modele === 'number') {
    if (typeof valeur !== 'number' || !Number.isFinite(valeur) || valeur <= 0) throw new Error('Nombre casino invalide');
  } else if (typeof valeur !== 'string' || !valeur.trim()) throw new Error('Texte casino invalide');
}

export function chargerCasino(source: unknown = donnees): Casino {
  validerForme(source, donnees);
  const casino = structuredClone(source) as Casino;
  if (casino.version !== 1 || casino.symboles.reduce((s, symbole) => s + symbole.poids, 0) !== 100
    || new Set(casino.symboles.map(s => s.id)).size !== casino.symboles.length
    || new Set(casino.boutique.map(o => o.key)).size !== casino.boutique.length
    || !casino.symboles.some(s => s.id === casino.deuxBaies.symbole)
    || casino.deuxBaies.nombre !== 2 || casino.pileOuFace.seuilFace >= 1) {
    throw new Error('Règles casino invalides');
  }
  for (const nombre of [casino.jetons.achat.cost, casino.jetons.achat.tokens,
    casino.jetons.rachat.tokens, casino.jetons.rachat.money,
    ...casino.symboles.flatMap(s => [s.poids, s.gain]), ...casino.boutique.map(o => o.price)]) {
    if (!Number.isSafeInteger(nombre)) throw new Error('Entier casino invalide');
  }
  return casino;
}

const casino = chargerCasino();

export function accesCasino(monde: Pick<ReturnType<typeof chargerMonde>, 'lieu'>, etat: EtatMonde): ResultatCondition {
  const condition = monde.lieu('casino').si;
  return !condition || evaluer(condition, etat).ok
    ? { ok: true } : { ok: false, raison: casino.acces.raison };
}

export function lireMise(valeur: string, jetons = Infinity): number {
  const mise = parseInt(valeur, 10);
  return Number.isFinite(mise) && mise >= 1 && mise <= jetons ? mise : 0;
}

export function acheterJetons<R extends RegionCasino & { argent: number }>(region: R): Resultat<R> {
  const lot = casino.jetons.achat;
  if (region.argent < lot.cost) return { ok: false, raison: casino.messages.argentInsuffisant };
  return { ok: true, region: { ...region, argent: region.argent - lot.cost, jetons: region.jetons + lot.tokens },
    message: casino.messages.achatJetons };
}

export function echangerJetons<R extends RegionCasino & { argent: number }>(region: R): Resultat<R> {
  const lot = casino.jetons.rachat;
  if (region.jetons < lot.tokens) return { ok: false, raison: casino.messages.jetonsInsuffisants };
  return { ok: true, region: { ...region, argent: region.argent + lot.money, jetons: region.jetons - lot.tokens },
    message: casino.messages.rachatJetons };
}

export function tirerSymbole(alea: () => number): string {
  let r = alea() * 100;
  for (const symbole of casino.symboles) {
    r -= symbole.poids;
    if (r <= 0) return symbole.id;
  }
  return casino.symboles[casino.symboles.length - 1]!.id;
}

export function gainMachine(symboles: Triplet, mise: number): number {
  if (symboles[0] === symboles[1] && symboles[1] === symboles[2]) {
    return mise * (casino.symboles.find(s => s.id === symboles[0])?.gain ?? 0);
  }
  return symboles.filter(s => s === casino.deuxBaies.symbole).length === casino.deuxBaies.nombre
    ? mise * casino.deuxBaies.gain : 0;
}

function debiter<R extends RegionCasino>(region: R, mise: number): { ok: true; region: R } | { ok: false; raison: string } {
  if (!Number.isInteger(mise) || mise < 1) return { ok: false, raison: casino.messages.miseInvalide };
  if (region.jetons < mise) return { ok: false, raison: casino.messages.jetonsInsuffisants };
  return { ok: true, region: { ...region, jetons: region.jetons - mise } };
}

export function jouerMachine<R extends RegionCasino>(region: R, mise: number, alea: () => number): Resultat<R, { symboles: Triplet; gain: number }> {
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  const symboles: Triplet = [tirerSymbole(alea), tirerSymbole(alea), tirerSymbole(alea)];
  const gain = gainMachine(symboles, mise);
  const deuxBaies = symboles.filter(s => s === casino.deuxBaies.symbole).length === casino.deuxBaies.nombre;
  return { ok: true, region: { ...debit.region, jetons: debit.region.jetons + gain }, symboles, gain,
    message: gain === 0 ? casino.messages.perdu : deuxBaies ? casino.messages.baies
      : casino.messages.gagne.replace('{gain}', String(gain / mise)) };
}

export function jouerPileOuFace<R extends RegionCasino>(region: R, mise: number, choix: Face, alea: () => number): Resultat<R, { resultat: Face; gain: number }> {
  if (choix !== 'face' && choix !== 'pile') return { ok: false, raison: casino.messages.choixInvalide };
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  const resultat = alea() < casino.pileOuFace.seuilFace ? 'face' : 'pile';
  const gain = choix === resultat ? mise * casino.pileOuFace.gain : 0;
  return { ok: true, region: { ...debit.region, jetons: debit.region.jetons + gain }, resultat, gain,
    message: gain === 0 ? casino.messages.perdu : casino.messages.gagne.replace('{gain}', String(casino.pileOuFace.gain)) };
}
