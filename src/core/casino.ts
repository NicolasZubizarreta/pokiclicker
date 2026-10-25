import donnees from '../../data/casino.json';
import { evaluer } from './conditions';
import type { EtatMonde, ResultatCondition } from './conditions';
import type { chargerMonde } from './monde';
import type { MainBlackjack } from './sauvegarde-types';

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

export function construirePaquet(alea: () => number): string[] {
  const paquet = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
    .flatMap(rang => ['S', 'H', 'D', 'C'].map(couleur => `${rang}-${couleur}`));
  for (let i = paquet.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [paquet[i], paquet[j]] = [paquet[j]!, paquet[i]!];
  }
  return paquet;
}

function cartesValides(cartes: readonly string[]): boolean {
  return cartes.every(c => /^(A|[2-9]|10|J|Q|K)-[SHDC]$/.test(c))
    && new Set(cartes).size === cartes.length;
}

export function valeurMain(main: readonly string[]): number {
  if (!cartesValides(main)) throw new Error('Carte blackjack invalide');
  let total = 0;
  let as = 0;
  for (const carte of main) {
    const rang = carte.split('-')[0]!;
    total += rang === 'A' ? 11 : ['J', 'Q', 'K'].includes(rang) ? 10 : Number(rang);
    if (rang === 'A') as++;
  }
  while (total > 21 && as > 0) { total -= 10; as--; }
  return total;
}

type RegionBlackjack = RegionCasino & { blackjackEnCours?: MainBlackjack };
type ResultatBlackjack<R> = Resultat<R, MainBlackjack & { gain: number }>;

function piocher(main: MainBlackjack, alea: () => number): string {
  if (!main.paquet.length) main.paquet = construirePaquet(alea);
  return main.paquet.pop()!;
}

function resultatBlackjack<R extends RegionBlackjack>(region: R, main: MainBlackjack,
  multiplicateur: number | null, message: string): ResultatBlackjack<R> {
  const gain = multiplicateur === null ? 0 : Math.floor(main.mise * multiplicateur);
  const copie = { ...region, jetons: region.jetons + gain };
  if (multiplicateur === null) copie.blackjackEnCours = main;
  else delete copie.blackjackEnCours;
  return { ok: true, region: copie, ...main, gain, message };
}

export function distribuer<R extends RegionBlackjack>(region: R, mise: number, alea: () => number,
  paquet?: readonly string[]): ResultatBlackjack<R> {
  if (region.blackjackEnCours) return { ok: false, raison: 'Une main est déjà en cours.' };
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  if (paquet && !cartesValides(paquet)) return { ok: false, raison: 'Paquet blackjack invalide.' };
  const main: MainBlackjack = { mise, paquet: paquet ? [...paquet] : construirePaquet(alea), joueur: [], croupier: [] };
  main.joueur.push(piocher(main, alea), piocher(main, alea));
  main.croupier.push(piocher(main, alea));
  return valeurMain(main.joueur) === 21
    ? resultatBlackjack(debit.region, main, casino.blackjack.gainNaturel, casino.messages.blackjack)
    : resultatBlackjack(debit.region, main, null, casino.messages.jouer);
}

export function tirerCarte<R extends RegionBlackjack>(region: R, alea: () => number): ResultatBlackjack<R> {
  if (!region.blackjackEnCours) return { ok: false, raison: 'Aucune main en cours.' };
  const main = structuredClone(region.blackjackEnCours);
  main.joueur.push(piocher(main, alea));
  return valeurMain(main.joueur) > 21
    ? resultatBlackjack(region, main, 0, casino.messages.bust)
    : resultatBlackjack(region, main, null, casino.messages.jouer);
}

export function rester<R extends RegionBlackjack>(region: R, alea: () => number): ResultatBlackjack<R> {
  if (!region.blackjackEnCours) return { ok: false, raison: 'Aucune main en cours.' };
  const main = structuredClone(region.blackjackEnCours);
  while (valeurMain(main.croupier) < casino.blackjack.seuilCroupier) main.croupier.push(piocher(main, alea));
  const joueur = valeurMain(main.joueur);
  const croupier = valeurMain(main.croupier);
  return croupier > 21 || joueur > croupier
    ? resultatBlackjack(region, main, casino.blackjack.gainVictoire, casino.messages.gagne.replace('{gain}', String(casino.blackjack.gainVictoire)))
    : joueur === croupier
      ? resultatBlackjack(region, main, casino.blackjack.gainEgalite, casino.messages.egalite)
      : resultatBlackjack(region, main, 0, casino.messages.perdu);
}
