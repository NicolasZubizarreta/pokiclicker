import type { ResultatEquipe } from './equipe';
import { reglages } from './reglages';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';

type TypeObjet = 'bonbon' | 'calcium';

function refusCible(type: TypeObjet, pokemon: PokemonPossede | undefined): string | undefined {
  if (!pokemon || pokemon.oeuf) return 'Pokémon invalide !';
  if (type === 'bonbon' && pokemon.niveau >= 100) return 'Niveau maximum !';
  if (type === 'calcium' && pokemon.calcium >= reglages.degats.calciumMax) return 'Limite atteinte !';
}

export function cibleValide(type: TypeObjet, pokemon: PokemonPossede): boolean {
  return refusCible(type, pokemon) === undefined;
}

export function quantiteMax(type: TypeObjet, pokemon: PokemonPossede, stock: number): number {
  if (!cibleValide(type, pokemon) || !Number.isFinite(stock)) return 0;
  const restant = type === 'bonbon' ? 100 - pokemon.niveau : reglages.degats.calciumMax - pokemon.calcium;
  return Math.max(0, Math.floor(Math.min(stock, restant)));
}

export function utiliserSurPokemon(
  region: DonneesRegion, type: TypeObjet, cle: string, uid: string, n: number,
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
    message: type === 'bonbon' ? `+${n} niveaux !` : `+${2 * n} % DPS permanent`,
    region: {
      ...region,
      inventaire: { ...region.inventaire, [cle]: stock - n },
      equipe: region.equipe.map((p) => p.uid !== uid ? p : {
        ...p,
        ...(type === 'bonbon' ? { niveau: p.niveau + n } : { calcium: p.calcium + n }),
      }),
    },
  };
}
