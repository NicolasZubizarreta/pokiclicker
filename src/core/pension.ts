import { evaluer } from './conditions';
import type { EtatMonde } from './conditions';
import { formeDeBase } from './evolution';
import type { chargerMonde } from './monde';
import { chargerPokemon } from './pokemon';
import { kanto } from './regions';
import { reglages } from './reglages';
import { etatMondeDe } from './sauvegarde';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { tirerSexe } from './sexe';

const catalogue = chargerPokemon();
const pension = reglages.pension;

export function accesPension(
  monde: Pick<ReturnType<typeof chargerMonde>, 'lieu' | 'zone'>, etat: EtatMonde,
): { ouvert: boolean; raison?: string } {
  const condition = monde.lieu('pension').si;
  const resultat = condition ? evaluer(condition, etat, { nomZone: id => monde.zone(id).nom }) : { ok: true };
  return resultat.ok ? { ouvert: true } : { ouvert: false, raison: resultat.raison };
}

export function chancePonte(parents: readonly PokemonPossede[]): number {
  const [premier, second] = parents;
  if (!premier || !second) return 0;
  if (premier.numero === pension.metamorph || second.numero === pension.metamorph) return pension.chances.metamorph;
  if (premier.sexe === second.sexe || premier.sexe === 'sansSexe' || second.sexe === 'sansSexe') return 0;
  if (formeDeBase(premier.numero) === formeDeBase(second.numero)) return pension.chances.memeEspece;
  const types = catalogue.parNumero(second.numero).types;
  return catalogue.parNumero(premier.numero).types.some(type => types.includes(type)) ? pension.chances.typePartage : 0;
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
