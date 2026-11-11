import donnees from '../../data/casino.json';
import type { MainBlackjack, MainBlackjackAncienne, MainJoueurBlackjack } from './sauvegarde-types';

// Blackjack de casino : sabot de plusieurs paquets, carte cachée du croupier, doubler, séparer, assurance, abandon.
// Les valeurs (nombre de paquets, seuil de remélange, gains, assurance, abandon) viennent de data/casino.json.
// Arrondi des demi-mises : toujours vers le bas (assurance et abandon), donc jamais de jeton gagné grâce à l'arrondi ;
// une mise de 1 jeton ne permet ni assurance ni abandon (la moitié arrondie vaut 0).

const regles = donnees.blackjack;
const messages = donnees.messages;
const RANGS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const COULEURS = ['S', 'H', 'D', 'C'];
export const FORMAT_CARTE = /^(A|[2-9]|10|J|Q|K)-[SHDC]$/;

export type Alea = () => number;
type RegionBlackjack = { jetons: number; blackjackEnCours?: MainBlackjack | MainBlackjackAncienne; sabotBlackjack?: string[] };
export type ResultatMain = 'blackjack' | 'gagne' | 'egalite' | 'perdu' | 'depasse' | 'abandon';
export type MainReglee = {
  cartes: string[]; mise: number; separee: boolean; doublee: boolean;
  valeur: number; resultat: ResultatMain; gain: number;
};
/** Main terminée : toutes les cartes sont révélées. */
export type FinBlackjack = {
  mains: MainReglee[]; croupier: string[]; valeurCroupier: number; blackjackCroupier: boolean;
  assurance: number; gainAssurance: number; engage: number; gain: number;
};
export type ActionsBlackjack = {
  tirer: boolean; rester: boolean; doubler: boolean; separer: boolean; abandonner: boolean;
  assurer: boolean; refuserAssurance: boolean;
};
/** Ce que l'interface a le droit de voir pendant la main : la carte cachée du croupier n'y figure pas. */
export type VueBlackjack = {
  phase: MainBlackjack['phase']; active: number;
  mains: { cartes: string[]; mise: number; valeur: number; statut: MainJoueurBlackjack['statut']; separee: boolean; doublee: boolean }[];
  croupier: string[]; cachee: boolean; valeurCroupier: number;
  assurance: number; engage: number; actions: ActionsBlackjack;
};
type Refus = { ok: false; raison: string };
export type ResultatBlackjack<R> = Refus | {
  ok: true; region: R; message: string; gain: number; termine: boolean;
  vue: VueBlackjack | null; fin: FinBlackjack | null;
};

export function construireSabot(alea: Alea, paquets: number = regles.paquets): string[] {
  const sabot = Array.from({ length: paquets }, () => RANGS.flatMap(rang => COULEURS.map(couleur => `${rang}-${couleur}`))).flat();
  for (let i = sabot.length - 1; i > 0; i--) {
    const j = Math.floor(alea() * (i + 1));
    [sabot[i], sabot[j]] = [sabot[j]!, sabot[i]!];
  }
  return sabot;
}
/** Un seul paquet de 52 cartes (ancien format, conservé pour lire les anciennes sauvegardes et les tests). */
export const construirePaquet = (alea: Alea): string[] => construireSabot(alea, 1);

/** Nombre de cartes sous lequel le sabot est remélangé entre deux mains. */
export const seuilRemelange = (): number => Math.floor(regles.paquets * 52 * regles.remelangeSous);

const rangDe = (carte: string): string => carte.slice(0, carte.indexOf('-'));
const valeurDix = (rang: string): boolean => rang === '10' || rang === 'J' || rang === 'Q' || rang === 'K';

export function valeurMain(main: readonly string[]): number {
  if (!main.every(c => FORMAT_CARTE.test(c))) throw new Error('Carte blackjack invalide');
  let total = 0;
  let as = 0;
  for (const carte of main) {
    const rang = rangDe(carte);
    total += rang === 'A' ? 11 : valeurDix(rang) ? 10 : Number(rang);
    if (rang === 'A') as++;
  }
  while (total > 21 && as > 0) { total -= 10; as--; }
  return total;
}

/** Deux cartes forment une paire à séparer : même rang, ou deux cartes valant 10 (10, valet, dame, roi). */
export function paireSeparable(a: string, b: string): boolean {
  const ra = rangDe(a), rb = rangDe(b);
  return ra === rb || (valeurDix(ra) && valeurDix(rb));
}

const coutAssurance = (mise: number): number => Math.floor(mise * regles.coutAssurance);
const retourAbandon = (mise: number): number => Math.floor(mise * regles.retourAbandon);
const naturel = (main: MainBlackjack, m: MainJoueurBlackjack): boolean =>
  main.mains.length === 1 && !m.separee && m.cartes.length === 2 && valeurMain(m.cartes) === 21;
const blackjackCroupier = (croupier: readonly string[]): boolean => croupier.length === 2 && valeurMain(croupier) === 21;

export function actionsPossibles(main: MainBlackjack): ActionsBlackjack {
  const aucune = { tirer: false, rester: false, doubler: false, separer: false, abandonner: false, assurer: false, refuserAssurance: false };
  if (main.phase === 'assurance') return { ...aucune, assurer: coutAssurance(main.mains[0]!.mise) >= 1, refuserAssurance: true };
  const m = main.mains[main.active];
  if (!m || m.statut !== 'en-cours') return aucune;
  const deux = m.cartes.length === 2;
  return {
    ...aucune, tirer: true, rester: true, doubler: deux,
    separer: deux && paireSeparable(m.cartes[0]!, m.cartes[1]!) && main.mains.length < regles.maxMains,
    abandonner: deux && main.mains.length === 1 && !m.separee && retourAbandon(m.mise) >= 1,
  };
}

type Brouillon = { main: MainBlackjack; sabot: string[]; jetons: number; alea: Alea };

function piocher(b: Brouillon): string {
  if (!b.sabot.length) b.sabot.push(...construireSabot(b.alea));
  return b.sabot.shift()!;
}

/** Copie de travail de la main en cours ; une main de l'ancien format (52 cartes, croupier sans carte cachée) est convertie. */
function ouvrir(region: RegionBlackjack, alea: Alea): Brouillon | null {
  const en = region.blackjackEnCours;
  if (!en) return null;
  if ('paquet' in en) {
    const sabot = [...en.paquet].reverse();
    const cachee = sabot.shift() ?? construireSabot(() => 0.5, 1)[0]!;
    return { alea, sabot, jetons: region.jetons, main: {
      phase: 'jeu', active: 0, assurance: 0, croupier: [...en.croupier, cachee],
      mains: [{ cartes: [...en.joueur], mise: en.mise, separee: false, doublee: false, statut: 'en-cours' }],
    } };
  }
  return { alea, sabot: [...(region.sabotBlackjack ?? [])], jetons: region.jetons, main: structuredClone(en) };
}

export function vueMain(main: MainBlackjack): VueBlackjack {
  const visible = main.croupier.slice(0, 1);
  return {
    phase: main.phase, active: main.active,
    mains: main.mains.map(m => ({ cartes: [...m.cartes], mise: m.mise, valeur: valeurMain(m.cartes), statut: m.statut,
      separee: m.separee, doublee: m.doublee })),
    croupier: visible, cachee: main.croupier.length > visible.length, valeurCroupier: valeurMain(visible),
    assurance: main.assurance, engage: main.mains.reduce((s, m) => s + m.mise, 0) + main.assurance,
    actions: actionsPossibles(main),
  };
}

/** Vue sans carte cachée de la main en cours d'une région (null s'il n'y en a pas). */
export function vueBlackjack(region: RegionBlackjack): VueBlackjack | null {
  const b = ouvrir(region, () => 0.5);
  return b ? vueMain(b.main) : null;
}

const refus = (raison: string): Refus => ({ ok: false, raison });

function sortie<R extends RegionBlackjack>(region: R, b: Brouillon, message: string,
  fin: FinBlackjack | null): ResultatBlackjack<R> {
  const copie: R = { ...region, jetons: b.jetons, sabotBlackjack: b.sabot };
  if (fin) delete copie.blackjackEnCours;
  else copie.blackjackEnCours = b.main;
  return { ok: true, region: copie, message, gain: fin?.gain ?? 0, termine: fin !== null,
    vue: fin ? null : vueMain(b.main), fin };
}

function regler<R extends RegionBlackjack>(region: R, b: Brouillon): ResultatBlackjack<R> {
  const { main } = b;
  const bj = blackjackCroupier(main.croupier);
  const joue = !bj && main.mains.some(m => m.statut === 'reste' && !naturel(main, m));
  if (joue) while (valeurMain(main.croupier) < regles.seuilCroupier) main.croupier.push(piocher(b));
  const vc = valeurMain(main.croupier);
  const mains: MainReglee[] = main.mains.map(m => {
    const valeur = valeurMain(m.cartes);
    const base = { cartes: m.cartes, mise: m.mise, separee: m.separee, doublee: m.doublee, valeur };
    if (m.statut === 'abandon') return { ...base, resultat: 'abandon', gain: retourAbandon(m.mise) };
    if (m.statut === 'depasse') return { ...base, resultat: 'depasse', gain: 0 };
    if (naturel(main, m)) return bj ? { ...base, resultat: 'egalite', gain: Math.floor(m.mise * regles.gainEgalite) }
      : { ...base, resultat: 'blackjack', gain: Math.floor(m.mise * regles.gainNaturel) };
    if (bj) return { ...base, resultat: 'perdu', gain: 0 };
    if (vc > 21 || valeur > vc) return { ...base, resultat: 'gagne', gain: Math.floor(m.mise * regles.gainVictoire) };
    return valeur === vc ? { ...base, resultat: 'egalite', gain: Math.floor(m.mise * regles.gainEgalite) }
      : { ...base, resultat: 'perdu', gain: 0 };
  });
  const gainAssurance = bj ? main.assurance * regles.retourAssurance : 0;
  const gain = mains.reduce((s, m) => s + m.gain, 0) + gainAssurance;
  const engage = main.mains.reduce((s, m) => s + m.mise, 0) + main.assurance;
  b.jetons += gain;
  const fin: FinBlackjack = { mains, croupier: [...main.croupier], valeurCroupier: vc, blackjackCroupier: bj,
    assurance: main.assurance, gainAssurance, engage, gain };
  const un = mains[0]!;
  const net = gain - engage;
  const principal = mains.length > 1 ? messages.bilan.replace('{net}', net > 0 ? `+${net}` : String(net))
    : un.resultat === 'blackjack' ? messages.blackjack
      : un.resultat === 'egalite' ? (bj ? messages.blackjackEgalite : messages.egalite)
        : un.resultat === 'gagne' ? messages.gagne.replace('{gain}', String(regles.gainVictoire))
          : un.resultat === 'depasse' ? messages.bust
            : un.resultat === 'abandon' ? messages.abandon
              : bj ? messages.croupierBlackjack : messages.perdu;
  const assurance = main.assurance === 0 ? '' : ` ${bj ? messages.assurancePayee : messages.assurancePerdue}`;
  return sortie(region, b, principal + assurance, fin);
}

/** Passe à la prochaine main à jouer ; sans main restante, le croupier joue et la main est réglée. */
function avancer<R extends RegionBlackjack>(region: R, b: Brouillon): ResultatBlackjack<R> {
  const suivante = b.main.mains.findIndex((m, i) => i >= b.main.active && m.statut === 'en-cours');
  if (suivante < 0) return regler(region, b);
  b.main.active = suivante;
  return sortie(region, b, messages.jouer, null);
}

/** Le croupier regarde sa carte cachée (carte visible : As ou carte de 10) : blackjack, la main s'arrête. */
function demarrerJeu<R extends RegionBlackjack>(region: R, b: Brouillon): ResultatBlackjack<R> {
  const { main } = b;
  if (blackjackCroupier(main.croupier) || naturel(main, main.mains[0]!)) return regler(region, b);
  return sortie(region, b, messages.jouer, null);
}

export function distribuer<R extends RegionBlackjack>(region: R, mise: number, alea: Alea,
  sabotImpose?: readonly string[]): ResultatBlackjack<R> {
  if (region.blackjackEnCours) return refus('Une main est déjà en cours.');
  if (!Number.isInteger(mise) || mise < 1) return refus(messages.miseInvalide);
  if (region.jetons < mise) return refus(messages.jetonsInsuffisants);
  if (sabotImpose && !sabotImpose.every(c => FORMAT_CARTE.test(c))) return refus('Sabot blackjack invalide.');
  let sabot = sabotImpose ? [...sabotImpose] : [...(region.sabotBlackjack ?? [])];
  // Remélange entre deux mains seulement, jamais en cours de main.
  if (!sabotImpose && sabot.length < seuilRemelange()) sabot = construireSabot(alea);
  const b: Brouillon = { alea, sabot, jetons: region.jetons - mise, main: {
    phase: 'jeu', active: 0, assurance: 0, croupier: [],
    mains: [{ cartes: [], mise, separee: false, doublee: false, statut: 'en-cours' }],
  } };
  const joueur = b.main.mains[0]!.cartes;
  joueur.push(piocher(b));
  b.main.croupier.push(piocher(b));
  joueur.push(piocher(b));
  b.main.croupier.push(piocher(b));
  if (rangDe(b.main.croupier[0]!) === 'A') {
    b.main.phase = 'assurance';
    return sortie(region, b, messages.assurance, null);
  }
  return demarrerJeu(region, b);
}

function decider<R extends RegionBlackjack>(region: R, alea: Alea, prendre: boolean): ResultatBlackjack<R> {
  const b = ouvrir(region, alea);
  if (!b) return refus('Aucune main en cours.');
  if (b.main.phase !== 'assurance') return refus(messages.actionImpossible);
  if (prendre) {
    const cout = coutAssurance(b.main.mains[0]!.mise);
    if (cout < 1) return refus(messages.actionImpossible);
    if (b.jetons < cout) return refus(messages.jetonsInsuffisants);
    b.jetons -= cout;
    b.main.assurance = cout;
  }
  b.main.phase = 'jeu';
  return demarrerJeu(region, b);
}
export const assurer = <R extends RegionBlackjack>(region: R, alea: Alea): ResultatBlackjack<R> => decider(region, alea, true);
export const refuserAssurance = <R extends RegionBlackjack>(region: R, alea: Alea): ResultatBlackjack<R> => decider(region, alea, false);

/** Ouvre la main en cours pour une action du joueur sur la main active (jamais pendant la décision d'assurance). */
function ouvrirAction(region: RegionBlackjack, alea: Alea): { b: Brouillon; m: MainJoueurBlackjack } | Refus {
  const b = ouvrir(region, alea);
  if (!b) return refus('Aucune main en cours.');
  const m = b.main.mains[b.main.active];
  if (b.main.phase !== 'jeu' || !m || m.statut !== 'en-cours') return refus(messages.actionImpossible);
  return { b, m };
}

export function tirerCarte<R extends RegionBlackjack>(region: R, alea: Alea): ResultatBlackjack<R> {
  const o = ouvrirAction(region, alea);
  if ('ok' in o) return o;
  o.m.cartes.push(piocher(o.b));
  const valeur = valeurMain(o.m.cartes);
  if (valeur > 21) o.m.statut = 'depasse';
  else if (valeur === 21) o.m.statut = 'reste';
  return avancer(region, o.b);
}

export function rester<R extends RegionBlackjack>(region: R, alea: Alea): ResultatBlackjack<R> {
  const o = ouvrirAction(region, alea);
  if ('ok' in o) return o;
  o.m.statut = 'reste';
  return avancer(region, o.b);
}

export function doubler<R extends RegionBlackjack>(region: R, alea: Alea): ResultatBlackjack<R> {
  const o = ouvrirAction(region, alea);
  if ('ok' in o) return o;
  if (!actionsPossibles(o.b.main).doubler) return refus(messages.actionImpossible);
  if (o.b.jetons < o.m.mise) return refus(messages.jetonsInsuffisants);
  o.b.jetons -= o.m.mise;
  o.m.mise *= 2;
  o.m.doublee = true;
  o.m.cartes.push(piocher(o.b));
  o.m.statut = valeurMain(o.m.cartes) > 21 ? 'depasse' : 'reste';
  return avancer(region, o.b);
}

export function separer<R extends RegionBlackjack>(region: R, alea: Alea): ResultatBlackjack<R> {
  const o = ouvrirAction(region, alea);
  if ('ok' in o) return o;
  if (!actionsPossibles(o.b.main).separer) return refus(messages.actionImpossible);
  if (o.b.jetons < o.m.mise) return refus(messages.jetonsInsuffisants);
  o.b.jetons -= o.m.mise;
  const [a, c] = o.m.cartes as [string, string];
  const as = rangDe(a) === 'A';
  const nouvelle = (carte: string): MainJoueurBlackjack => {
    const cartes = [carte, piocher(o.b)];
    // Un as séparé ne reçoit qu'une carte ; un 21 s'arrête de lui-même.
    return { cartes, mise: o.m.mise, separee: true, doublee: false,
      statut: as || valeurMain(cartes) === 21 ? 'reste' : 'en-cours' };
  };
  const premiere = nouvelle(a), seconde = nouvelle(c);
  o.b.main.mains.splice(o.b.main.active, 1, premiere, seconde);
  return avancer(region, o.b);
}

export function abandonner<R extends RegionBlackjack>(region: R, alea: Alea): ResultatBlackjack<R> {
  const o = ouvrirAction(region, alea);
  if ('ok' in o) return o;
  if (!actionsPossibles(o.b.main).abandonner) return refus(messages.actionImpossible);
  o.m.statut = 'abandon';
  return avancer(region, o.b);
}
