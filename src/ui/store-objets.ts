import type { EtatCombat } from '../core/combat';
import type { Zone } from '../core/monde';
import { etatFauchage, restants } from '../core/objets-actifs';
import { chargerPokemon } from '../core/pokemon';
import { reglages } from '../core/reglages';
import type { DonneesRegion } from '../core/sauvegarde';

export type EffetsAffiches = ReturnType<typeof restants>;
export type FauchageAffiche = {
  possede: boolean; disponible: boolean; raison: string | null; rechargeS: number; actif: boolean;
};

export function afficherEffets(region: DonneesRegion, maintenant: number,
  precedent: EffetsAffiches | null): EffetsAffiches {
  const effets = restants(region.chronos, maintenant);
  return JSON.stringify(effets) === JSON.stringify(precedent) ? precedent! : effets;
}

export function afficherFauchage(region: DonneesRegion, coeur: EtatCombat | null, maintenant: number,
  precedent: FauchageAffiche | null): FauchageAffiche {
  const etat = etatFauchage(region, coeur?.ennemi.boss ?? false, maintenant);
  const raison = etat.raison ?? (!coeur ? 'Aucun Pokémon ici.'
    : coeur.attenteMs > 0 ? '' : null);
  const fauchage = { possede: etat.possede, disponible: raison === null, raison,
    rechargeS: etat.rechargeS, actif: coeur?.ennemi.fauche ?? false };
  return JSON.stringify(fauchage) === JSON.stringify(precedent) ? precedent! : fauchage;
}

export function entreesRadar(zone: Zone, pokedex: readonly number[]) {
  const catalogue = chargerPokemon();
  const rencontres = zone.type === 'ligue'
    ? (zone.adversaires ?? []).map((adversaire, index, adversaires) => ({ ...adversaire,
      rarete: index === adversaires.length - 1 ? 'maitre' as const : 'conseil-4' as const }))
    : zone.sauvages;
  return rencontres.map(({ pokemon, rarete }) => ({ numero: pokemon,
    nom: catalogue.parNumero(pokemon).nom, rarete, libelle: reglages.objetsActifs.raretes[rarete],
    vu: pokedex.includes(pokemon) }));
}
