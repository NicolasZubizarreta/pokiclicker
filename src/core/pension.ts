import { evaluer } from './conditions';
import type { EtatMonde } from './conditions';
import { formeDeBase } from './evolution';
import { relacher } from './equipe';
import type { ResultatEquipe } from './equipe';
import type { chargerMonde } from './monde';
import { chargerPokemon } from './pokemon';
import { kanto } from './regions';
import { reglages } from './reglages';
import { etatMondeDe } from './sauvegarde';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { tirerSexe } from './sexe';

const catalogue = chargerPokemon();
const pension = reglages.pension;

type ResultatRetrait =
  | { ok: true; region: DonneesRegion; destination: 'equipe' | 'pc'; numero: number }
  | { ok: false; raison: string };
const absent = { ok: false, raison: 'Ce Pokémon est introuvable.' } as const;

export function deposerParent(region: DonneesRegion, uid: string): ResultatEquipe {
  if (region.pension.parents.length >= 2) return { ok: false, raison: pension.messages.pleine };
  const pokemon = [...region.equipe, ...region.pc].find(p => p.uid === uid);
  if (!pokemon) return absent;
  const retrait = relacher(region, uid);
  if (!retrait.ok) return retrait;
  return { ok: true, region: { ...retrait.region,
    pension: { ...region.pension, parents: [...region.pension.parents, pokemon] },
  } };
}

function retirer(region: DonneesRegion, liste: 'parents' | 'oeufs', uid: string): ResultatRetrait {
  const pokemon = region.pension[liste].find(p => p.uid === uid);
  if (!pokemon) return absent;
  const destination = region.equipe.length < reglages.equipe.taille ? 'equipe' : 'pc';
  return { ok: true, destination, numero: pokemon.numero, region: {
    ...region, [destination]: [...region[destination], pokemon],
    pension: { ...region.pension, [liste]: region.pension[liste].filter(p => p.uid !== uid) },
  } };
}

export function retirerParent(region: DonneesRegion, uid: string): ResultatRetrait {
  return retirer(region, 'parents', uid);
}

export function prendreOeuf(region: DonneesRegion, uid: string): ResultatRetrait {
  return retirer(region, 'oeufs', uid);
}

export function prixEmplacementOeuf(region: DonneesRegion): number | null {
  return region.pension.emplacementsOeuf >= pension.emplacementsMax
    ? null : region.pension.emplacementsOeuf * pension.prixParEmplacement;
}

export function acheterEmplacementOeuf(region: DonneesRegion): ResultatEquipe {
  const prix = prixEmplacementOeuf(region);
  if (prix === null) return { ok: false, raison: pension.messages.pleine };
  if (region.argent < prix) return { ok: false, raison: "Pas assez d'argent." };
  return { ok: true, region: { ...region, argent: region.argent - prix,
    pension: { ...region.pension, emplacementsOeuf: region.pension.emplacementsOeuf + 1 },
  } };
}

export function avancerOeuf(pokemon: PokemonPossede): PokemonPossede {
  if (!pokemon.oeuf) return pokemon;
  const pasRestants = Math.max(0, pokemon.oeuf.pasRestants - 1);
  if (pasRestants > 0) return { ...pokemon, oeuf: { ...pokemon.oeuf, pasRestants } };
  const eclos = { ...pokemon, niveau: 1, bonheur: pension.bonheurNaissance, marqueEclosion: true };
  delete eclos.oeuf;
  return eclos;
}

/** Espèces (formes de base) déjà écloses d'un œuf, dans l'ordre de première éclosion. Absent dans une ancienne sauvegarde = aucune. */
export function especesEcloses(region: Pick<DonneesRegion, 'especesEcloses'>): readonly number[] {
  return region.especesEcloses ?? [];
}

export function nombreEspecesEcloses(region: Pick<DonneesRegion, 'especesEcloses'>): number {
  return especesEcloses(region).length;
}

/** Note l'espèce d'une éclosion ; une espèce déjà connue n'est jamais comptée deux fois. */
export function noterEclosion(region: DonneesRegion, numero: number): DonneesRegion {
  const connues = especesEcloses(region);
  if (connues.includes(numero)) return region;
  return { ...region, especesEcloses: [...connues, numero] };
}

export function accesPension(
  monde: Pick<ReturnType<typeof chargerMonde>, 'lieu' | 'zone'>, etat: EtatMonde,
): { ouvert: boolean; raison?: string } {
  const condition = monde.lieu('pension').si;
  const resultat = condition ? evaluer(condition, etat, { nomZone: id => monde.zone(id).nom }) : { ok: true };
  return resultat.ok ? { ouvert: true } : { ouvert: false, raison: resultat.raison };
}

/** Pourquoi un couple pond (ou non) : l'écran de choix d'un parent montre la raison à côté du pourcentage. */
export type RaisonPonte = 'incomplet' | 'metamorph' | 'memeSexe' | 'sansSexe' | 'memeEspece' | 'typePartage' | 'aucunType';

export function couplePonte(parents: readonly PokemonPossede[]): { chance: number; raison: RaisonPonte } {
  const [premier, second] = parents;
  if (!premier || !second) return { chance: 0, raison: 'incomplet' };
  if (premier.numero === pension.metamorph || second.numero === pension.metamorph) return { chance: pension.chances.metamorph, raison: 'metamorph' };
  if (premier.sexe === second.sexe) return { chance: 0, raison: 'memeSexe' };
  if (premier.sexe === 'sansSexe' || second.sexe === 'sansSexe') return { chance: 0, raison: 'sansSexe' };
  if (formeDeBase(premier.numero) === formeDeBase(second.numero)) return { chance: pension.chances.memeEspece, raison: 'memeEspece' };
  const types = catalogue.parNumero(second.numero).types;
  return catalogue.parNumero(premier.numero).types.some(type => types.includes(type))
    ? { chance: pension.chances.typePartage, raison: 'typePartage' } : { chance: 0, raison: 'aucunType' };
}

export function chancePonte(parents: readonly PokemonPossede[]): number {
  return couplePonte(parents).chance;
}

/**
 * Le joueur est entré dans la pension (la pastille de rappel est retirée). Une sauvegarde sans `pensionVue` compte comme
 * « déjà entré » dès que la pension a servi (parents, œufs ou espèce éclose) : inutile de rappeler un lieu qu'il connaît.
 */
export function pensionVisitee(region: Pick<DonneesRegion, 'pensionVue' | 'pension' | 'especesEcloses'>): boolean {
  return region.pensionVue === true || region.pension.parents.length > 0 || region.pension.oeufs.length > 0
    || nombreEspecesEcloses(region) > 0;
}

/** Première entrée : pose le drapeau `pensionVue` ; `premiere` n'est vrai qu'une fois par partie, et jamais si la pension a déjà servi. */
export function entrerALaPension<R extends Pick<DonneesRegion, 'pensionVue' | 'pension' | 'especesEcloses'>>(region: R): { region: R; premiere: boolean } {
  if (region.pensionVue === true) return { region, premiere: false };
  return { region: { ...region, pensionVue: true }, premiere: !pensionVisitee(region) };
}

export function tirerOeuf(
  parents: readonly PokemonPossede[], alea: () => number,
): { numero: number; shiny: boolean } | null {
  const chance = chancePonte(parents);
  if (chance === 0 || alea() >= chance) return null;
  const [premier, second] = parents as readonly [PokemonPossede, PokemonPossede];
  let numero: number;
  if (premier.numero === pension.metamorph && second.numero === pension.metamorph) {
    numero = Math.floor(alea() * pension.especesTirees) + 1;
  } else if (premier.numero === pension.metamorph) {
    numero = second.numero;
  } else if (second.numero === pension.metamorph) {
    numero = premier.numero;
  } else {
    numero = premier.sexe === 'femelle' ? premier.numero : second.numero;
  }
  return { numero: formeDeBase(numero), shiny: alea() < pension.chanceShiny };
}

export function pondre(region: DonneesRegion, alea: () => number, genererId: () => string): DonneesRegion {
  if (region.pension.oeufs.length >= region.pension.emplacementsOeuf
    || !accesPension(kanto, etatMondeDe(region)).ouvert) return region;
  const tirage = tirerOeuf(region.pension.parents, alea);
  if (!tirage) return region;
  const sexe = tirerSexe(tirage.numero, alea);
  const oeuf: PokemonPossede = {
    ...tirage, uid: genererId(), sexe, niveau: 1, xp: 0, bonheur: 0,
    favori: false, calcium: 0, pierreEternelle: false,
    oeuf: { pasRestants: pension.pasEclosion, pasMax: pension.pasEclosion },
  };
  return { ...region, pension: { ...region.pension, oeufs: [...region.pension.oeufs, oeuf] } };
}
