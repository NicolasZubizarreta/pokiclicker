import type { EtatMonde, ResultatCondition } from './conditions';
import type { chargerMonde } from './monde';
import { reglages } from './reglages';
import type { PokemonPossede } from './sauvegarde-types';
import { detailDps } from './equipe';

export type TriPc = 'dps' | 'numero' | 'nom' | 'niveau' | 'favori' | 'shiny';

export function dpsPc(pokemon: PokemonPossede): number {
  return pokemon.oeuf ? 0 : Object.values(detailDps(pokemon, 1)).reduce((produit, facteur) => produit * facteur, 1);
}

export function filtrerParAttributs<P extends PokemonPossede>(pc: readonly P[], filtres: { favori: boolean; shiny: boolean; oeuf: boolean }): P[] {
  return pc.filter(pokemon => (!filtres.favori || pokemon.favori) && (!filtres.shiny || pokemon.shiny) && (!filtres.oeuf || pokemon.oeuf));
}

const collateur = new Intl.Collator('fr');

export function trierPc<P extends PokemonPossede>(pc: readonly P[], tri: TriPc, nomDe: (pokemon: P) => string): P[] {
  return [...pc].sort((a, b) => {
    switch (tri) {
      case 'dps': return Number(!!a.oeuf) - Number(!!b.oeuf) || dpsPc(b) - dpsPc(a) || a.numero - b.numero || b.niveau - a.niveau;
      case 'numero': return a.numero - b.numero || b.niveau - a.niveau;
      case 'nom': return collateur.compare(nomDe(a), nomDe(b)) || b.niveau - a.niveau;
      case 'niveau': return b.niveau - a.niveau || a.numero - b.numero;
      case 'favori': return Number(b.favori) - Number(a.favori) || a.numero - b.numero;
      case 'shiny': return Number(b.shiny) - Number(a.shiny) || a.numero - b.numero || b.niveau - a.niveau;
    }
  });
}

export function normaliserRecherche(texte: string): string {
  return texte.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase('fr').trim();
}

export function filtrerPc<P extends PokemonPossede>(
  pc: readonly P[], texte: string, nomDe: (pokemon: P) => string,
  nomEspece: (pokemon: P) => string = nomDe,
): P[] {
  const recherche = normaliserRecherche(texte);
  if (!recherche) return [...pc];
  if (/^(#|n°)?\s*\d+$/.test(recherche)) {
    const numero = Number(recherche.replace(/^(#|n°)?\s*/, ''));
    return pc.filter(pokemon => pokemon.numero === numero);
  }
  return pc.filter(pokemon => normaliserRecherche(nomDe(pokemon)).includes(recherche)
    || normaliserRecherche(nomEspece(pokemon)).includes(recherche));
}

// V1 : le PC s'ouvre avec la troisième zone de Kanto (Arène d'Argenta).
export function accesPc(monde: ReturnType<typeof chargerMonde>, etat: EtatMonde): ResultatCondition {
  return monde.zonesOuvertes(etat).some(zone => zone.id === reglages.pc.zone) ? { ok: true } : { ok: false, raison: reglages.pc.raison };
}
