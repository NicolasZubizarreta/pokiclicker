import { describe, expect, it } from 'vitest';
import {
  chargerEvolutions, cibleValidePierre, evolutionDisponible, evolutionParPierre,
  evoluer, evoluerParPierre, niveauRequis, pierresPour,
} from './evolution';
import { reglages } from './reglages';
import { calculerMaxXp } from './recompenses';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { calculerDps } from './stats';

function pokemon(changements: Partial<PokemonPossede> = {}): PokemonPossede {
  return {
    uid: 'cible', numero: 1, niveau: 16, xp: 9999, shiny: true, bonheur: 42,
    pierreEternelle: false, calcium: 7, surnom: 'Pousse', sexe: 'femelle', favori: true,
    ...changements,
  };
}

function region(p = pokemon(), inventaire: Record<string, number> = {}): DonneesRegion {
  return {
    ...reglages.depart.region, regionId: 'kanto', zoneId: 'kanto.route-1', etape: 1,
    equipe: [p, pokemon({ uid: 'autre' })], badges: [], bossVaincus: [], objetsCles: [],
    quetes: [], drapeaux: [], evenementsJoues: [], argent: 0, inventaire, ligueGagnee: 0,
  };
}

describe('évolution par niveau', () => {
  it('charge les données et permet une source injectée sans la modifier', () => {
    expect(chargerEvolutions().niveau).toHaveLength(56);
    const fichier = { niveau: [{ de: 1, vers: 3, niveau: 20 }], pierre: [] };
    const avant = structuredClone(fichier);
    expect(chargerEvolutions(fichier)).toEqual(fichier);
    expect(fichier).toEqual(avant);
    expect(niveauRequis(1)).toBe(16);
    expect(niveauRequis(3)).toBeNull();
  });

  it('propose Herbizarre au niveau 16, jamais à 15, avec Stase ou dans un œuf', () => {
    expect(evolutionDisponible(pokemon({ niveau: 15 }))).toBeNull();
    expect(evolutionDisponible(pokemon())).toBe(2);
    expect(evolutionDisponible(pokemon({ pierreEternelle: true }))).toBeNull();
    expect(evolutionDisponible(pokemon({ oeuf: { pasRestants: 1, pasMax: 10 } }))).toBeNull();
    expect(evolutionDisponible(pokemon({ numero: 3 }))).toBeNull();
  });

  it('ne change que le numéro, recalcule les stats de la cible et garde les entrées', () => {
    const entree = region();
    const avant = structuredClone(entree);
    const resultat = evoluer(entree, 'cible');
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) throw new Error(resultat.raison);
    const cible = resultat.region.equipe[0]!;
    expect(cible).toEqual({ ...entree.equipe[0], numero: 2 });
    expect(resultat.evolution).toEqual({ uid: 'cible', de: 1, vers: 2 });
    expect(calculerDps(cible)).toBe(calculerDps({ ...pokemon(), numero: 2 }));
    expect(calculerDps(cible)).not.toBe(calculerDps(pokemon()));
    expect(calculerMaxXp(cible.numero, cible.niveau)).toBe(calculerMaxXp(2, 16));
    expect(resultat.region.equipe[1]).toBe(entree.equipe[1]);
    expect(entree).toEqual(avant);
  });

  it('refuse Stase et les évolutions indisponibles', () => {
    expect(evoluer(region(pokemon({ pierreEternelle: true })), 'cible'))
      .toEqual({ ok: false, raison: 'Évolution bloquée !' });
    for (const p of [pokemon({ niveau: 15 }), pokemon({ numero: 3 })]) {
      expect(evoluer(region(p), p.uid).ok).toBe(false);
    }
  });
});

describe('évolution par pierre', () => {
  it('expose les branches et les cibles valides', () => {
    expect(pierresPour(133)).toEqual(['waterStone', 'thunderStone', 'fireStone']);
    expect(pierresPour(19)).toEqual([]);
    expect(evolutionParPierre(25, 'thunderStone')).toBe(26);
    expect(cibleValidePierre(pokemon({ numero: 25 }), 'thunderStone')).toBe(true);
    expect(cibleValidePierre(pokemon({ numero: 19 }), 'thunderStone')).toBe(false);
    expect(cibleValidePierre(pokemon({ numero: 25, pierreEternelle: true }), 'thunderStone')).toBe(false);
    expect(cibleValidePierre(pokemon({ numero: 25, oeuf: { pasRestants: 1, pasMax: 10 } }), 'thunderStone')).toBe(false);
  });

  it.each([[25, 'thunderStone', 26], [133, 'waterStone', 134],
    [133, 'thunderStone', 135], [133, 'fireStone', 136]] as const)(
    '%i + %s → %i, consomme une seule pierre et conserve tous les autres champs', (numero, pierre, vers) => {
      const entree = region(pokemon({ numero }), { [pierre]: 2, calcium: 3 });
      const avant = structuredClone(entree);
      const resultat = evoluerParPierre(entree, 'cible', pierre);
      expect(resultat.ok).toBe(true);
      if (!resultat.ok) throw new Error(resultat.raison);
      expect(resultat.region.equipe[0]).toEqual({ ...entree.equipe[0], numero: vers });
      expect(resultat.evolution).toEqual({ uid: 'cible', de: numero, vers });
      expect(resultat.region.inventaire).toEqual({ [pierre]: 1, calcium: 3 });
      expect(entree).toEqual(avant);
    },
  );

  it.each([
    [true, 0, 'Pierre Stase équipée !'],
    [true, 1, 'Pierre Stase équipée !'],
    [false, 0, 'Plus de pierre !'],
    [false, 1, 'Pokémon incompatible !'],
  ] as const)('respecte la priorité Stase=%s, stock=%i', (pierreEternelle, stock, raison) => {
    const entree = region(pokemon({ numero: 19, pierreEternelle }), { thunderStone: stock });
    const avant = structuredClone(entree);
    expect(evoluerParPierre(entree, 'cible', 'thunderStone')).toEqual({ ok: false, raison });
    expect(entree).toEqual(avant);
  });

  it('refuse aussi une pierre absente ou inconnue sans modifier le stock', () => {
    const entree = region(pokemon({ numero: 25 }));
    expect(evoluerParPierre(entree, 'cible', 'thunderStone'))
      .toEqual({ ok: false, raison: 'Plus de pierre !' });
    expect(evoluerParPierre(entree, 'cible', 'inconnue'))
      .toEqual({ ok: false, raison: 'Plus de pierre !' });
    expect(entree.inventaire).toEqual({});
  });
});

it('refuse en priorité les œufs, le PC et les uid absents pour les deux méthodes', () => {
  const oeuf = region(pokemon({ pierreEternelle: true, oeuf: { pasRestants: 1, pasMax: 10 } }));
  const pc = region();
  pc.pc = [pc.equipe[0]!];
  pc.equipe = [];
  for (const entree of [oeuf, pc, region(pokemon({ uid: 'autre' }))]) {
    const avant = structuredClone(entree);
    expect(evoluer(entree, 'cible')).toEqual({ ok: false, raison: 'Pokémon invalide !' });
    expect(evoluerParPierre(entree, 'cible', 'thunderStone'))
      .toEqual({ ok: false, raison: 'Pokémon invalide !' });
    expect(entree).toEqual(avant);
  }
});

it('configure la durée et l’alternance de l’animation', () => {
  expect(reglages.evolution).toEqual({ animationMs: 3000, alternanceMs: 150 });
});
