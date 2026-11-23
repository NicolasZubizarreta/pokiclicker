import donnees from '../../data/titres.json';
import { chargerPokemon } from './pokemon';
import type { Suivi } from './suivi';

const cles = ['captures', 'capturesShiny', 'evolutions', 'oeufsEclos', 'bossVaincus', 'victoiresLigue', 'especes', 'jetonsGagnes', 'heuresDeJeu'] as const;
export type CompteursTitres = Record<typeof cles[number], number> & { catalogueTotal: number };
export type Titre = { id: string; nom: string; description: string; condition: { compteur: typeof cles[number]; seuil: number } };
export function chargerTitres(fichier: unknown = donnees): Titre[] {
  const f = fichier as { version?: number; titres?: Titre[] } | null;
  const ids = new Set<string>();
  if (f?.version !== 1 || !Array.isArray(f.titres)) throw new Error('Titres invalides');
  for (const t of f.titres) {
    if (!t || ![t.id, t.nom, t.description].every(s => typeof s === 'string' && s.trim()) || ids.has(t.id)
      || !t.condition || !cles.includes(t.condition.compteur) || !Number.isInteger(t.condition.seuil)
      || t.condition.seuil < 0 || (t.condition.seuil === 0 && t.id !== 'dresseur')) throw new Error('Titre invalide');
    ids.add(t.id);
  }
  return f.titres;
}
export function compteursDe({ suivi, pokedexTotal, tempsJeuMs }: { suivi: Suivi; pokedexTotal: number; tempsJeuMs: number }): CompteursTitres {
  return { captures: suivi.captures, capturesShiny: suivi.capturesShiny, evolutions: suivi.evolutions,
    oeufsEclos: suivi.oeufsEclos, bossVaincus: suivi.bossVaincus, victoiresLigue: suivi.hall.length,
    especes: pokedexTotal, jetonsGagnes: suivi.jetons.gagnes, heuresDeJeu: tempsJeuMs / 3_600_000,
    catalogueTotal: chargerPokemon().liste.length };
}
export function titresObtenus(compteurs: CompteursTitres): Titre[] {
  return chargerTitres().filter(t => compteurs[t.condition.compteur] >= (t.id === 'pokedex-complet' ? compteurs.catalogueTotal : t.condition.seuil));
}
