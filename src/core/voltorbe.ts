import donneesJeux from '../../data/casino-jeux.json';
import { type Alea, chargerJeuxCasino, debiter, libelleJetons, remplir } from './jeux-casino';
import { ajouterJetons } from './plafonds';
import type { VoltorbeEnCours } from './sauvegarde-types';
import { sansCle } from './sans-cle';

/**
 * Voltorbe Flip (ticket F) : grille de cartes cachées valant ×0 (Voltorbe), ×1, ×2 ou ×3. La mise est débitée au départ ;
 * chaque ×2 et ×3 retourné ajoute un bonus à la mise en jeu ; un Voltorbe fait tout perdre ; on peut encaisser à tout moment
 * (avec une retenue) ou finir la grille (toutes les cartes ×2 et ×3 retournées, sans retenue). L'état est sauvegardé.
 * Toutes les valeurs viennent de `data/casino-jeux.json` (`voltorbe`).
 */
const regles = chargerJeuxCasino(donneesJeux).voltorbe;
const messages = chargerJeuxCasino(donneesJeux).messages;
export const TAILLE_VOLTORBE = regles.taille;
export const NIVEAUX_VOLTORBE = regles.niveaux;
const NB_CASES = regles.taille * regles.taille;

type RegionVoltorbe = { jetons: number; voltorbeEnCours?: VoltorbeEnCours };
type Refus = { ok: false; raison: string };
const refus = (raison: string): Refus => ({ ok: false, raison });

export type FinVoltorbe = { mise: number; gain: number; multiple: number; perdu: boolean; complete: boolean };
export type ResultatVoltorbe<R> = Refus | { ok: true; region: R; message: string; valeur: number | null; fin: FinVoltorbe | null };

export type IndiceLigne = { voltorbes: number; points: number };
export type VueVoltorbe = {
  niveau: number; mise: number;
  /** null = carte cachée ; sinon sa valeur (0 n'apparaît jamais : un Voltorbe termine la grille). */
  cases: (number | null)[];
  lignes: IndiceLigne[]; colonnes: IndiceLigne[];
  multiple: number; gainSiEncaisse: number; restantes: number;
};

const formeCases = /^[0-3]+$/;
const formeVues = /^[01]+$/;

/** Une grille sauvegardée lisible : bonnes longueurs, bon niveau, mise entière. Sinon elle est ignorée. */
export function grilleValide(g: VoltorbeEnCours | undefined): g is VoltorbeEnCours {
  return !!g && Number.isInteger(g.niveau) && g.niveau >= 0 && g.niveau < regles.niveaux.length
    && Number.isInteger(g.mise) && g.mise >= 1 && typeof g.cases === 'string' && typeof g.vues === 'string'
    && g.cases.length === NB_CASES && g.vues.length === NB_CASES && formeCases.test(g.cases) && formeVues.test(g.vues);
}

const valeurs = (g: VoltorbeEnCours): number[] => [...g.cases].map(Number);
const vues = (g: VoltorbeEnCours): boolean[] => [...g.vues].map(c => c === '1');

/** Points de pourcentage gagnés par les cartes retournées : 100 au départ (la mise), puis +bonus par ×2 et par ×3. */
function pointsVoltorbe(g: VoltorbeEnCours): number {
  const v = valeurs(g);
  const retournees = vues(g);
  return v.reduce((p, valeur, i) => !retournees[i] ? p
    : p + (valeur === 2 ? regles.bonusDoublePourCent : valeur === 3 ? regles.bonusTriplePourCent : 0), 100);
}

/** Multiple de la mise en jeu (1 au départ). */
export const multipleVoltorbe = (g: VoltorbeEnCours): number => pointsVoltorbe(g) / 100;

const cartesRestantes = (g: VoltorbeEnCours): number => {
  const retournees = vues(g);
  return valeurs(g).filter((valeur, i) => valeur >= 2 && !retournees[i]).length;
};

/** Gain si on encaisse maintenant : avec retenue, sans retenue quand la grille est terminée. */
export function gainVoltorbe(g: VoltorbeEnCours): number {
  const pourCent = cartesRestantes(g) === 0 ? 100 : regles.encaissementPourCent;
  return Math.floor(g.mise * pointsVoltorbe(g) * pourCent / 10000);
}

/** Tire une grille : chaque ligne et chaque colonne contient au moins un Voltorbe (sinon une ligne serait sans risque). */
export function tirerGrille(niveau: number, alea: Alea): string {
  const { voltorbes, doubles, triples } = regles.niveaux[niveau]!;
  const base = [...Array<number>(voltorbes).fill(0), ...Array<number>(doubles).fill(2), ...Array<number>(triples).fill(3),
    ...Array<number>(NB_CASES - voltorbes - doubles - triples).fill(1)];
  let grille = base;
  for (let essai = 0; essai < 500; essai++) {
    grille = [...base];
    for (let i = grille.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(alea() * (i + 1)));
      [grille[i], grille[j]] = [grille[j]!, grille[i]!];
    }
    const t = regles.taille;
    const toutes = Array.from({ length: t }, (_, k) => k).every(k =>
      grille.slice(k * t, (k + 1) * t).includes(0) && grille.filter((_, i) => i % t === k).includes(0));
    if (toutes) break;
  }
  return grille.join('');
}

function indices(g: VoltorbeEnCours): { lignes: IndiceLigne[]; colonnes: IndiceLigne[] } {
  const v = valeurs(g);
  const t = regles.taille;
  const resume = (cles: number[]): IndiceLigne => ({ voltorbes: cles.filter(i => v[i] === 0).length, points: cles.reduce((s, i) => s + v[i]!, 0) });
  const rangee = (k: number) => Array.from({ length: t }, (_, i) => k * t + i);
  const colonne = (k: number) => Array.from({ length: t }, (_, i) => i * t + k);
  return { lignes: Array.from({ length: t }, (_, k) => resume(rangee(k))), colonnes: Array.from({ length: t }, (_, k) => resume(colonne(k))) };
}

export function vueVoltorbe(region: { voltorbeEnCours?: VoltorbeEnCours }): VueVoltorbe | null {
  const g = region.voltorbeEnCours;
  if (!grilleValide(g)) return null;
  const retournees = vues(g);
  return { niveau: g.niveau, mise: g.mise, cases: valeurs(g).map((valeur, i) => retournees[i] ? valeur : null),
    ...indices(g), multiple: multipleVoltorbe(g), gainSiEncaisse: gainVoltorbe(g), restantes: cartesRestantes(g) };
}

const sansGrille = <R extends RegionVoltorbe>(region: R): R => sansCle(region, 'voltorbeEnCours') as R;
const multiple = (produit: number) => Number(produit.toFixed(2));

export function commencerVoltorbe<R extends RegionVoltorbe>(region: R, mise: number, niveau: number, alea: Alea): ResultatVoltorbe<R> {
  if (region.voltorbeEnCours) return refus(messages.voltorbeEnCours);
  if (!Number.isInteger(niveau) || niveau < 0 || niveau >= regles.niveaux.length) return refus(messages.choixInvalide);
  const debit = debiter(region, mise);
  if (!debit.ok) return debit;
  const grille: VoltorbeEnCours = { niveau, mise, cases: tirerGrille(niveau, alea), vues: '0'.repeat(NB_CASES) };
  return { ok: true, region: { ...debit.region, voltorbeEnCours: grille }, message: '', valeur: null, fin: null };
}

function terminer<R extends RegionVoltorbe>(region: R, g: VoltorbeEnCours, valeur: number | null): ResultatVoltorbe<R> {
  const complete = cartesRestantes(g) === 0;
  const gain = gainVoltorbe(g);
  const multiplicateur = multipleVoltorbe(g);
  const fin: FinVoltorbe = { mise: g.mise, gain, multiple: multiplicateur, perdu: false, complete };
  const modele = complete ? messages.voltorbeFini : messages.voltorbeEncaisse;
  return { ok: true, valeur, fin,
    region: { ...sansGrille(region), jetons: ajouterJetons(region.jetons, gain) },
    message: remplir(modele, { gain: libelleJetons(gain), multiplicateur: multiple(multiplicateur) }) };
}

export function retournerVoltorbe<R extends RegionVoltorbe>(region: R, index: number): ResultatVoltorbe<R> {
  const g = region.voltorbeEnCours;
  if (!grilleValide(g)) return refus(messages.voltorbeAucune);
  if (!Number.isInteger(index) || index < 0 || index >= NB_CASES) return refus(messages.choixInvalide);
  const retournees = vues(g);
  if (retournees[index]) return refus(messages.voltorbeDeja);
  const valeur = valeurs(g)[index]!;
  if (valeur === 0) {
    return { ok: true, valeur: 0, region: sansGrille(region), message: messages.voltorbePerdu,
      fin: { mise: g.mise, gain: 0, multiple: 0, perdu: true, complete: false } };
  }
  retournees[index] = true;
  const suite: VoltorbeEnCours = { ...g, vues: retournees.map(r => r ? '1' : '0').join('') };
  // Grille terminée : la partie s'arrête et paie sans retenue.
  if (cartesRestantes(suite) === 0) return terminer(region, suite, valeur);
  return { ok: true, valeur, fin: null, region: { ...region, voltorbeEnCours: suite },
    message: remplir(messages.voltorbeSur, { valeur, multiplicateur: multiple(multipleVoltorbe(suite)) }) };
}

export function encaisserVoltorbe<R extends RegionVoltorbe>(region: R): ResultatVoltorbe<R> {
  const g = region.voltorbeEnCours;
  if (!grilleValide(g)) return refus(messages.voltorbeAucune);
  return terminer(region, g, null);
}
