import donnees from '../../data/evolutions.json';
import type { ResultatEquipe } from './equipe';
import { noterObtention } from './dex';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';

export type Evolutions = {
  niveau: { de: number; vers: number; niveau: number }[];
  pierre: { de: number; vers: number; pierre: string }[];
};

export function chargerEvolutions(fichier: Evolutions = donnees): Evolutions {
  return structuredClone(fichier);
}

const catalogue = chargerEvolutions();
const origines = new Map([...catalogue.niveau, ...catalogue.pierre].map(ligne => [ligne.vers, ligne.de]));

export function formeDeBase(numero: number): number {
  const origine = origines.get(numero);
  return origine === undefined ? numero : formeDeBase(origine);
}

/** Lignée de l'espèce, de sa forme de base jusqu'à elle-même. */
export function lignee(numero: number): number[] {
  const origine = origines.get(numero);
  return origine === undefined ? [numero] : [...lignee(origine), numero];
}

export function niveauRequis(numero: number): number | null {
  return catalogue.niveau.find((ligne) => ligne.de === numero)?.niveau ?? null;
}

export function evolutionParPierre(numero: number, pierre: string): number | null {
  return catalogue.pierre.find((ligne) => ligne.de === numero && ligne.pierre === pierre)?.vers ?? null;
}

export function pierresPour(numero: number): string[] {
  return catalogue.pierre.filter((ligne) => ligne.de === numero).map((ligne) => ligne.pierre);
}

export function evolutionsDirectes(numero: number): number[] {
  return [...catalogue.niveau, ...catalogue.pierre].filter((ligne) => ligne.de === numero).map((ligne) => ligne.vers);
}

export function stade(numero: number): number {
  const origine = catalogue.niveau.find((ligne) => ligne.vers === numero)
    ?? catalogue.pierre.find((ligne) => ligne.vers === numero);
  return origine ? stade(origine.de) + 1 : 1;
}

export function peutEvoluer(numero: number): boolean {
  return niveauRequis(numero) !== null || pierresPour(numero).length > 0;
}

export function evolutionDisponible(pokemon: PokemonPossede): number | null {
  if (pokemon.oeuf || pokemon.pierreEternelle) return null;
  const ligne = catalogue.niveau.find((ligne) => ligne.de === pokemon.numero);
  return ligne && pokemon.niveau >= ligne.niveau ? ligne.vers : null;
}

export function cibleValidePierre(pokemon: PokemonPossede, pierre: string): boolean {
  return !pokemon.oeuf && !pokemon.pierreEternelle
    && evolutionParPierre(pokemon.numero, pierre) !== null;
}

type ResultatEvolution = ResultatEquipe & { evolution?: { uid: string; de: number; vers: number } };

function appliquer(region: DonneesRegion, pokemon: PokemonPossede, vers: number): ResultatEvolution {
  const evolue = {
    ...region,
    equipe: region.equipe.map((p) => p.uid === pokemon.uid ? { ...p, numero: vers } : p),
  };
  return {
    ok: true,
    // Un Pokémon à marque d'éclosion fait entrer chaque espèce atteinte dans la liste des éclos.
    region: noterObtention(evolue, vers, { shiny: pokemon.shiny, eclos: pokemon.marqueEclosion }),
    evolution: { uid: pokemon.uid, de: pokemon.numero, vers },
  };
}

export function evoluer(region: DonneesRegion, uid: string): ResultatEvolution {
  const pokemon = region.equipe.find((p) => p.uid === uid);
  if (!pokemon || pokemon.oeuf) return { ok: false, raison: 'Pokémon invalide !' };
  if (pokemon.pierreEternelle) return { ok: false, raison: 'Évolution bloquée !' };
  const vers = evolutionDisponible(pokemon);
  if (vers === null) return { ok: false, raison: 'Évolution indisponible !' };
  return appliquer(region, pokemon, vers);
}

export function evoluerParPierre(region: DonneesRegion, uid: string, pierre: string): ResultatEvolution {
  const pokemon = region.equipe.find((p) => p.uid === uid);
  if (!pokemon || pokemon.oeuf) return { ok: false, raison: 'Pokémon invalide !' };
  if (pokemon.pierreEternelle) return { ok: false, raison: 'Pierre Stase équipée !' };
  const stock = region.inventaire[pierre] ?? 0;
  if (stock <= 0) return { ok: false, raison: 'Plus de pierre !' };
  const vers = evolutionParPierre(pokemon.numero, pierre);
  if (vers === null) return { ok: false, raison: 'Pokémon incompatible !' };
  return appliquer({ ...region, inventaire: { ...region.inventaire, [pierre]: stock - 1 } }, pokemon, vers);
}
