import donnees from '../../data/safari.json';
import { evaluer } from './conditions';
import type { EtatMonde, ResultatCondition } from './conditions';
import { noterObtention } from './dex';
import { chargerPokemon } from './pokemon';
import { reglages } from './reglages';
import type { DonneesRegion, PokemonPossede, SafariEnCours } from './sauvegarde-types';
import { tirerSexe } from './sexe';
import { sansCle } from './sans-cle';

/**
 * Parc Safari (ticket F-j2-33) : visite payante de `visite.pas` pas et `visite.balles` Safari Balls. Chaque pas peut faire
 * apparaître un Pokémon du parc (liste pondérée) ; on lance une balle, on jette un appât (plus dur à capturer, fuit moins)
 * ou une roche (plus facile à capturer, fuit plus). Tout vient de `data/safari.json` ; la visite est sauvegardée (`safariEnCours`).
 */
export type Safari = typeof donnees;
export type Humeur = 'neutre' | 'appat' | 'colere';
type Refus = { ok: false; raison: string };
type Alea = () => number;
const refus = (raison: string): Refus => ({ ok: false, raison });

export function chargerSafari(source: unknown = donnees): Safari {
  const s = source as Safari;
  const nombres = (...valeurs: number[]) => valeurs.every(n => Number.isFinite(n) && n > 0);
  if (!s || typeof s !== 'object' || s.version !== 1 || !s.acces?.si || !s.visite || !s.rencontre || !s.humeurs
    || !Array.isArray(s.especes) || !s.especes.length || !s.messages) throw new Error('Données du Parc Safari invalides');
  if (!Number.isSafeInteger(s.visite.pas) || !Number.isSafeInteger(s.visite.balles) || !Number.isSafeInteger(s.visite.prix)
    || !nombres(s.visite.pas, s.visite.balles, s.visite.prix)) throw new Error('Visite du Parc Safari invalide');
  const { rencontre, humeurs } = s;
  if (!nombres(rencontre.chanceParPas, rencontre.chanceMax, rencontre.multiplicateurBalle, rencontre.fuiteMax,
    humeurs.appat.capture, humeurs.appat.fuite, humeurs.colere.capture, humeurs.colere.fuite)
    || rencontre.chanceParPas > 1 || rencontre.chanceMax > 1 || rencontre.fuiteMax > 1
    || rencontre.niveaux.length !== 2 || rencontre.niveaux[0]! > rencontre.niveaux[1]! || !rencontre.niveaux.every(Number.isInteger)) {
    throw new Error('Rencontres du Parc Safari invalides');
  }
  const numeros = s.especes.map(e => e.pokemon);
  if (new Set(numeros).size !== numeros.length
    || s.especes.some(e => !Number.isInteger(e.pokemon) || !nombres(e.poids, e.capture, e.fuite) || e.fuite > 1 || e.capture > 255)) {
    throw new Error('Pokémon du Parc Safari invalides');
  }
  return structuredClone(s);
}

const safari = chargerSafari();
const catalogue = chargerPokemon();
const [NIVEAU_MIN, NIVEAU_MAX] = safari.rencontre.niveaux as [number, number];
const txt = (modele: string, valeurs: Record<string, string | number> = {}) =>
  modele.replace(/\{(\w+)\}/g, (_, cle: string) => String(valeurs[cle] ?? ''));
const nombreFr = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const nomDe = (numero: number) => catalogue.parNumero(numero).nom;
const especeDe = (numero: number) => safari.especes.find(e => e.pokemon === numero);

export const ESPECES_SAFARI: readonly number[] = safari.especes.map(e => e.pokemon);
export const VISITE_SAFARI = safari.visite;

export type RencontreSafari = NonNullable<SafariEnCours['rencontre']>;
export type FinSafari = { captures: number; raison: 'pas' | 'balles' | 'sortie' };
export type VueSafari = { pas: number; balles: number; captures: number; rencontre: (RencontreSafari & { nom: string }) | null };
export type ResultatSafari = Refus | { ok: true; region: DonneesRegion; message: string; fin: FinSafari | null; numero?: number };

/** Une visite sauvegardée est valable si ses compteurs sont des entiers cohérents et sa rencontre un Pokémon du parc. */
export function visiteValide(v: SafariEnCours | undefined): v is SafariEnCours {
  if (!v || typeof v !== 'object') return false;
  const entier = (n: unknown, max: number) => Number.isInteger(n) && (n as number) >= 0 && (n as number) <= max;
  if (!entier(v.pas, safari.visite.pas) || !entier(v.balles, safari.visite.balles) || !entier(v.captures, safari.visite.balles)) return false;
  const r = v.rencontre;
  if (r === undefined) return true;
  return !!r && ESPECES_SAFARI.includes(r.numero) && Number.isInteger(r.niveau) && r.niveau >= NIVEAU_MIN
    && r.niveau <= NIVEAU_MAX && typeof r.shiny === 'boolean' && ['neutre', 'appat', 'colere'].includes(r.humeur);
}

export function accesSafari(etat: EtatMonde): ResultatCondition {
  return evaluer(safari.acces.si as Parameters<typeof evaluer>[0], etat).ok ? { ok: true } : { ok: false, raison: safari.acces.raison };
}

export const prixEntreeSafari = (): number => safari.visite.prix;

export function vueSafari(region: Pick<Partial<DonneesRegion>, 'safariEnCours'>): VueSafari | null {
  const v = region.safariEnCours;
  if (!visiteValide(v)) return null;
  return { pas: v.pas, balles: v.balles, captures: v.captures, rencontre: v.rencontre ? { ...v.rencontre, nom: nomDe(v.rencontre.numero) } : null };
}

/** Chance de capture d'une balle (0 à `chanceMax`) : taux de l'espèce / 255 × balle Safari × humeur. */
export function chanceBalleSafari(rencontre: Pick<RencontreSafari, 'numero' | 'humeur'>): number {
  const espece = especeDe(rencontre.numero);
  if (!espece) return 0;
  const humeur = rencontre.humeur === 'neutre' ? 1 : safari.humeurs[rencontre.humeur].capture;
  return Math.min(safari.rencontre.chanceMax, (espece.capture / 255) * safari.rencontre.multiplicateurBalle * humeur);
}

/** Chance que le Pokémon s'enfuie après chaque action du joueur (0 à `fuiteMax`). */
export function chanceFuiteSafari(rencontre: Pick<RencontreSafari, 'numero' | 'humeur'>): number {
  const espece = especeDe(rencontre.numero);
  if (!espece) return 0;
  const humeur = rencontre.humeur === 'neutre' ? 1 : safari.humeurs[rencontre.humeur].fuite;
  return Math.min(safari.rencontre.fuiteMax, espece.fuite * humeur);
}

function tirerEspece(alea: Alea): number {
  const total = safari.especes.reduce((somme, e) => somme + e.poids, 0);
  let reste = alea() * total;
  for (const e of safari.especes) { reste -= e.poids; if (reste < 0) return e.pokemon; }
  return safari.especes[safari.especes.length - 1]!.pokemon;
}

const sansVisite = (region: DonneesRegion): DonneesRegion => sansCle(region, 'safariEnCours');

const sansRencontre = (visite: SafariEnCours): SafariEnCours => sansCle(visite, 'rencontre');

/** Termine la visite si plus rien n'est possible (plus de pas sans rencontre, ou plus de balles). */
function conclure(region: DonneesRegion, visite: SafariEnCours, message: string, numero?: number): ResultatSafari {
  const raison = visite.balles === 0 ? 'balles' : visite.pas === 0 && !visite.rencontre ? 'pas' : null;
  if (!raison) return { ok: true, region: { ...region, safariEnCours: visite }, message, fin: null, numero };
  const fin = { captures: visite.captures, raison } as const;
  const suite = txt(raison === 'balles' ? safari.messages.finBalles : safari.messages.finPas);
  return { ok: true, region: sansVisite(region), message: `${message} ${suite}`, fin, numero };
}

function visiteEnCours(region: DonneesRegion): SafariEnCours | Refus {
  return visiteValide(region.safariEnCours) ? region.safariEnCours : refus(safari.messages.pasDeVisite);
}

/** Paie l'entrée ; une visite déjà commencée se reprend sans payer. */
export function entrerAuSafari(region: DonneesRegion): ResultatSafari {
  if (visiteValide(region.safariEnCours)) return refus(safari.messages.dejaDansLaVisite);
  const { prix, pas, balles } = safari.visite;
  if (region.argent < prix) return refus(txt(safari.messages.argentInsuffisant, { manque: nombreFr(prix - region.argent) }));
  return { ok: true, fin: null, region: { ...region, argent: region.argent - prix, safariEnCours: { pas, balles, captures: 0 } },
    message: txt(safari.messages.entree, { prix: nombreFr(prix), pas, balles }) };
}

/** Un pas dans les herbes hautes : peut faire apparaître un Pokémon. Interdit pendant une rencontre. */
export function avancerSafari(region: DonneesRegion, alea: Alea): ResultatSafari {
  const visite = visiteEnCours(region);
  if ('ok' in visite) return visite;
  if (visite.rencontre) return refus(safari.messages.rencontreEnCours);
  const suivante: SafariEnCours = { ...visite, pas: visite.pas - 1 };
  if (alea() >= safari.rencontre.chanceParPas) return conclure(region, suivante, safari.messages.rien);
  const numero = tirerEspece(alea);
  const niveau = NIVEAU_MIN + Math.floor(alea() * (NIVEAU_MAX - NIVEAU_MIN + 1));
  const shiny = alea() < reglages.combat.chanceShiny;
  const rencontre: RencontreSafari = { numero, niveau: Math.min(NIVEAU_MAX, niveau), shiny, humeur: 'neutre' };
  return conclure(region, { ...suivante, rencontre }, txt(shiny ? safari.messages.apparitionShiny : safari.messages.apparition, { nom: nomDe(numero) }));
}

/** Lance une Safari Ball : capture, ou le Pokémon se libère puis peut s'enfuir. */
export function lancerBalleSafari(region: DonneesRegion, alea: Alea, genererId: () => string): ResultatSafari {
  const visite = visiteEnCours(region);
  if ('ok' in visite) return visite;
  const rencontre = visite.rencontre;
  if (!rencontre) return refus(safari.messages.pasDeRencontre);
  const nom = nomDe(rencontre.numero);
  const balles = visite.balles - 1;
  if (alea() < chanceBalleSafari(rencontre)) {
    const pokemon: PokemonPossede = {
      uid: genererId(), numero: rencontre.numero, niveau: rencontre.niveau, shiny: rencontre.shiny,
      sexe: tirerSexe(rencontre.numero, alea), xp: 0, bonheur: 0, calcium: 0, pierreEternelle: false, favori: false,
    };
    const destination = region.equipe.length < reglages.equipe.taille ? 'equipe' : 'pc';
    const avecPokemon = noterObtention({ ...region, [destination]: [...region[destination], pokemon] }, pokemon.numero, { shiny: pokemon.shiny });
    const message = `${txt(safari.messages.capture, { nom })} ${txt(destination === 'equipe' ? safari.messages.captureEquipe : safari.messages.capturePc, { nom })}`;
    return conclure(avecPokemon, { pas: visite.pas, balles, captures: visite.captures + 1 }, message, pokemon.numero);
  }
  const enfuite = alea() < chanceFuiteSafari(rencontre);
  const message = txt(enfuite ? safari.messages.fuite : safari.messages.libere, { nom });
  return conclure(region, enfuite ? sansRencontre({ ...visite, balles }) : { ...visite, balles }, message);
}

function jeter(region: DonneesRegion, alea: Alea, humeur: Exclude<Humeur, 'neutre'>): ResultatSafari {
  const visite = visiteEnCours(region);
  if ('ok' in visite) return visite;
  if (!visite.rencontre) return refus(safari.messages.pasDeRencontre);
  const rencontre: RencontreSafari = { ...visite.rencontre, humeur };
  const nom = nomDe(rencontre.numero);
  if (alea() < chanceFuiteSafari(rencontre)) {
    return conclure(region, sansRencontre(visite), txt(safari.messages.fuite, { nom }));
  }
  return conclure(region, { ...visite, rencontre }, txt(safari.messages[humeur === 'appat' ? 'appat' : 'roche'], { nom }));
}
export const jeterAppatSafari = (region: DonneesRegion, alea: Alea): ResultatSafari => jeter(region, alea, 'appat');
export const jeterRocheSafari = (region: DonneesRegion, alea: Alea): ResultatSafari => jeter(region, alea, 'colere');

/** Quitte le parc : l'entrée n'est pas remboursée. */
export function quitterSafari(region: DonneesRegion): ResultatSafari {
  const visite = visiteEnCours(region);
  if ('ok' in visite) return visite;
  return { ok: true, region: sansVisite(region), fin: { captures: visite.captures, raison: 'sortie' }, message: safari.messages.finSortie };
}

export const messageBilanSafari = (fin: FinSafari): string => txt(safari.messages.bilan, { captures: fin.captures });
