import { commandeCourante, type CatalogueEvenements, type Commande, type MembreEquipe } from './evenements';
import type { Zone } from './monde';
import { chargerPokemon } from './pokemon';
import type { DonneesRegion } from './sauvegarde-types';

type Combat = Extract<Commande, { type: 'combat' }>;

function equipeDe(commande: Combat, starterId: number | null): MembreEquipe[] {
  if ('equipes' in commande) return commande.equipes[(starterId ?? 1) as 1 | 4 | 7];
  return [{ pokemon: commande.pokemon, niveau: commande.niveau,
    nom: commande.nom ?? chargerPokemon().parNumero(commande.pokemon).nom }];
}

export function zoneDeCombatEvenement(commande: Combat, zone: Zone, starterId: number | null): Zone {
  const equipe = equipeDe(commande, starterId).map(membre => ({ ...membre, capture: 0 }));
  return { ...structuredClone(zone), id: `evenement:${commande.evenement}`, type: 'ligue',
    etapes: equipe.length, adversaires: equipe.slice(0, -1), boss: equipe[equipe.length - 1]! };
}

export function zoneDuCombat(cat: CatalogueEvenements, region: DonneesRegion): string | null {
  const commande = commandeCourante(cat, region);
  if (commande?.type !== 'combat') return null;
  const declencheur = cat.parId(commande.evenement).declencheur;
  return 'zone' in declencheur ? declencheur.zone ?? null : null;
}

export function nomAdversaireEvenement(commande: Combat, starterId: number | null, etape: number): string {
  const membre = equipeDe(commande, starterId)[etape - 1]!;
  return 'dresseur' in commande ? `${commande.dresseur} (${membre.nom})` : membre.nom;
}
