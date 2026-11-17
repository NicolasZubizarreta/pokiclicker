import type { EtatMonde, ResultatCondition } from './conditions';
import type { chargerMonde } from './monde';
import { reglages } from './reglages';
import type { PokemonPossede } from './sauvegarde-types';
import { detailDps } from './equipe';
import { evolutionsDirectes } from './evolution';

export type TriPc = 'dps' | 'numero' | 'nom' | 'niveau' | 'favori' | 'shiny';

export function dpsPc(pokemon: PokemonPossede): number {
  return pokemon.oeuf ? 0 : Object.values(detailDps(pokemon, 1)).reduce((produit, facteur) => produit * facteur, 1);
}

export type FiltrePc = 'tous' | 'favori' | 'shiny' | 'oeuf' | 'evolution';

// Vrai si une évolution directe du Pokémon manque au Pokédex (capturés) : en l'évoluant, le Pokédex grandit.
// Un œuf ou un Pokémon sous Pierre Stase ne peut pas évoluer.
export function evolutionAFaireDecouvrir(pokemon: PokemonPossede, pokedex: ReadonlySet<number>): boolean {
  return !pokemon.oeuf && !pokemon.pierreEternelle && evolutionsDirectes(pokemon.numero).some(vers => !pokedex.has(vers));
}

export function filtrerParAttributs<P extends PokemonPossede>(pc: readonly P[], filtre: FiltrePc, pokedex: ReadonlySet<number> = new Set()): P[] {
  switch (filtre) {
    case 'favori': return pc.filter(pokemon => pokemon.favori);
    case 'shiny': return pc.filter(pokemon => pokemon.shiny);
    case 'oeuf': return pc.filter(pokemon => pokemon.oeuf);
    case 'evolution': return pc.filter(pokemon => evolutionAFaireDecouvrir(pokemon, pokedex));
    case 'tous': return [...pc];
  }
}

const collateur = new Intl.Collator('fr');

export function trierPc<P extends PokemonPossede>(pc: readonly P[], tri: TriPc, nomDe: (pokemon: P) => string): P[] {
  const dps = tri === 'dps' ? new Map(pc.map(pokemon => [pokemon, dpsPc(pokemon)])) : null;
  return [...pc].sort((a, b) => {
    switch (tri) {
      case 'dps': return Number(!!a.oeuf) - Number(!!b.oeuf) || dps!.get(b)! - dps!.get(a)! || a.numero - b.numero || b.niveau - a.niveau;
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
