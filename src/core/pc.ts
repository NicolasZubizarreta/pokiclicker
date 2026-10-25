import type { EtatMonde, ResultatCondition } from './conditions';
import type { chargerMonde } from './monde';
import { reglages } from './reglages';
import type { PokemonPossede } from './sauvegarde-types';

export type TriPc = 'numero' | 'nom' | 'niveau' | 'favori' | 'shiny';

const collateur = new Intl.Collator('fr');

export function trierPc<P extends PokemonPossede>(pc: readonly P[], tri: TriPc, nomDe: (pokemon: P) => string): P[] {
  return [...pc].sort((a, b) => {
    switch (tri) {
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
