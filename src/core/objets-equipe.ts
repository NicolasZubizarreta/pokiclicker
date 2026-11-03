import type { ResultatEquipe } from './equipe';
import { peutEvoluer, stade } from './evolution';
import { reglages } from './reglages';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';

export type TypeObjetEquipe = 'bonbon' | 'calcium' | 'baie';

function refusStase(pokemon: PokemonPossede | undefined): string | undefined {
  if (!pokemon || pokemon.oeuf) return 'Pokémon invalide !';
  if (pokemon.pierreEternelle) return 'Retire-la via le menu !';
}

export function cibleValideStase(pokemon: PokemonPossede): boolean {
  return !refusStase(pokemon) && stade(pokemon.numero) === 1 && peutEvoluer(pokemon.numero);
}

export function poserStase(region: DonneesRegion, uid: string): ResultatEquipe & { message: string } {
  const pokemon = region.equipe.find((p) => p.uid === uid);
  const stock = region.inventaire.everstone ?? 0;
  const raison = refusStase(pokemon) ?? (stock <= 0 ? 'Plus de Pierre Stase !'
    : pokemon && !cibleValideStase(pokemon) ? 'Pokémon incompatible !' : undefined);
  if (raison) return { ok: false, raison, message: raison };
  return {
    ok: true, message: 'Pierre Stase équipée !',
    region: {
      ...region,
      inventaire: { ...region.inventaire, everstone: stock - 1 },
      equipe: region.equipe.map((p) => p.uid === uid ? { ...p, pierreEternelle: true } : p),
    },
  };
}

export function retirerStase(region: DonneesRegion, uid: string): ResultatEquipe & { message: string } {
  const pokemon = region.equipe.find((p) => p.uid === uid) ?? region.pc.find((p) => p.uid === uid);
  const raison = !pokemon ? 'Pokémon invalide !' : !pokemon.pierreEternelle ? 'Aucun objet à retirer !' : undefined;
  if (raison) return { ok: false, raison, message: raison };
  const retirer = (p: PokemonPossede): PokemonPossede => p.uid === uid ? { ...p, pierreEternelle: false } : p;
  return {
    ok: true, message: 'Objet retiré !',
    region: {
      ...region,
      inventaire: { ...region.inventaire, everstone: (region.inventaire.everstone ?? 0) + 1 },
      equipe: region.equipe.map(retirer), pc: region.pc.map(retirer),
    },
  };
}

export function utiliserJetonShiny(region: DonneesRegion, uid: string): ResultatEquipe & { message: string } {
  const pokemon = region.equipe.find((p) => p.uid === uid);
  const stock = region.inventaire.shinyToken ?? 0;
  const raison = !pokemon ? 'Pokémon invalide !' : pokemon.shiny ? 'Déjà chromatique !'
    : stock <= 0 ? 'Quantité invalide.' : undefined;
  if (raison) return { ok: false, raison, message: raison };
  return {
    ok: true, message: 'Chromatique !',
    region: {
      ...region,
      inventaire: { ...region.inventaire, shinyToken: stock - 1 },
      equipe: region.equipe.map((p) => p.uid === uid ? { ...p, shiny: true } : p),
    },
  };
}

function refusCible(type: TypeObjetEquipe, pokemon: PokemonPossede | undefined): string | undefined {
  if (!pokemon || pokemon.oeuf) return 'Pokémon invalide !';
  if (type === 'bonbon' && pokemon.niveau >= 100) return 'Niveau maximum !';
  if (type === 'calcium' && pokemon.calcium >= reglages.degats.calciumMax) return 'Limite atteinte !';
  if (type === 'baie' && pokemon.bonheur >= reglages.recompenses.bonheur.max) return 'Limite atteinte !';
}

export function cibleValide(type: TypeObjetEquipe, pokemon: PokemonPossede): boolean {
  return refusCible(type, pokemon) === undefined;
}

export function quantiteMax(type: TypeObjetEquipe, pokemon: PokemonPossede, stock: number): number {
  if (!cibleValide(type, pokemon) || !Number.isFinite(stock)) return 0;
  const restant = type === 'bonbon' ? 100 - pokemon.niveau : type === 'calcium' ? reglages.degats.calciumMax - pokemon.calcium
    : Math.ceil((reglages.recompenses.bonheur.max - pokemon.bonheur) / reglages.recompenses.bonheur.gainBaie);
  return Math.max(0, Math.floor(Math.min(stock, restant)));
}

export function utiliserSurPokemon(
  region: DonneesRegion, type: TypeObjetEquipe, cle: string, uid: string, n: number,
): ResultatEquipe & { message: string } {
  const pokemon = region.equipe.find((p) => p.uid === uid);
  const raison = refusCible(type, pokemon);
  if (raison) return { ok: false, raison, message: raison };
  const stock = region.inventaire[cle] ?? 0;
  if (!pokemon || !Number.isInteger(n) || n < 1 || n > quantiteMax(type, pokemon, stock)) {
    return { ok: false, raison: 'Quantité invalide.', message: 'Quantité invalide.' };
  }
  return {
    ok: true,
    message: type === 'bonbon' ? `+${n} niveaux !` : type === 'calcium' ? `+${2 * n} % DPS permanent`
      : `+${reglages.recompenses.bonheur.gainBaie * n} de bonheur`,
    region: {
      ...region,
      inventaire: { ...region.inventaire, [cle]: stock - n },
      equipe: region.equipe.map((p) => p.uid !== uid ? p : {
        ...p,
        ...(type === 'bonbon' ? { niveau: p.niveau + n } : type === 'calcium' ? { calcium: p.calcium + n }
          : { bonheur: Math.min(reglages.recompenses.bonheur.max, p.bonheur + n * reglages.recompenses.bonheur.gainBaie) }),
      }),
    },
  };
}
