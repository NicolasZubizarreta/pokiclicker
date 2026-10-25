import { describe, expect, it } from 'vitest';
import { cibleValide, quantiteMax, utiliserSurPokemon } from './objets-equipe';
import { cibleValideStase, poserStase, retirerStase, utiliserJetonShiny } from './objets-equipe';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';

function pokemon(changements: Partial<PokemonPossede> = {}): PokemonPossede {
  return {
    uid: 'cible', numero: 1, niveau: 98, xp: 42, shiny: false,
    bonheur: 0, pierreEternelle: false, calcium: 9, sexe: 'sansSexe', favori: false,
    ...changements,
  };
}

function region(cible = pokemon()): DonneesRegion {
  return {
    equipe: [cible, pokemon({ uid: 'autre' })],
    pc: [pokemon({ uid: 'pc' })], inventaire: { bonbon: 5, calcium: 5, pokeball: 3 },
  } as unknown as DonneesRegion;
}

describe('Stase et Jeton Shiny', () => {
  it.each([[1, true], [2, false], [128, false]] as const)('vérifie la compatibilité de Stase pour %i', (numero, valide) => {
    const cible = pokemon({ numero });
    expect(cibleValideStase(cible)).toBe(valide);
    const entree = region(cible);
    entree.inventaire.everstone = 1;
    const avant = structuredClone(entree);
    Object.freeze(cible);
    Object.freeze(entree.equipe);
    Object.freeze(entree.inventaire);
    Object.freeze(entree);
    const resultat = poserStase(entree, 'cible');
    if (valide) {
      if (!resultat.ok) throw new Error(resultat.raison);
      expect(resultat.message).toBe('Pierre Stase équipée !');
      expect(resultat.region.equipe[0]?.pierreEternelle).toBe(true);
      expect(resultat.region.inventaire.everstone).toBe(0);
      expect(resultat.region.pc).toEqual(avant.pc);
    } else {
      expect(resultat).toEqual({ ok: false, raison: 'Pokémon incompatible !', message: 'Pokémon incompatible !' });
    }
    expect(entree).toEqual(avant);
  });

  it('respecte l’ordre des refus Stase', () => {
    const entree = region(pokemon({ numero: 128, pierreEternelle: true, oeuf: { pasRestants: 1, pasMax: 1 } }));
    const avant = structuredClone(entree);
    expect(poserStase(entree, 'cible').message).toBe('Pokémon invalide !');
    expect(poserStase(entree, 'absent').message).toBe('Pokémon invalide !');
    expect(poserStase(entree, 'pc').message).toBe('Pokémon invalide !');
    expect(poserStase(region(pokemon({ pierreEternelle: true })), 'cible').message).toBe('Retire-la via le menu !');
    expect(poserStase(region(pokemon({ numero: 128 })), 'cible').message).toBe('Plus de Pierre Stase !');
    expect(cibleValideStase(pokemon({ oeuf: { pasRestants: 1, pasMax: 1 } }))).toBe(false);
    expect(cibleValideStase(pokemon({ pierreEternelle: true }))).toBe(false);
    expect(entree).toEqual(avant);
  });

  it.each(['cible', 'pc'])('retire Stase de %s et rend une unité sans mutation', (uid) => {
    const entree = region(pokemon({ pierreEternelle: true }));
    entree.pc = [pokemon({ uid: 'pc', pierreEternelle: true })];
    const avant = structuredClone(entree);
    Object.freeze(entree.equipe[0]);
    Object.freeze(entree.pc[0]);
    Object.freeze(entree.equipe);
    Object.freeze(entree.pc);
    Object.freeze(entree.inventaire);
    Object.freeze(entree);
    const resultat = retirerStase(entree, uid);
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.message).toBe('Objet retiré !');
    expect([...resultat.region.equipe, ...resultat.region.pc].find((p) => p.uid === uid)?.pierreEternelle).toBe(false);
    expect(resultat.region.inventaire.everstone).toBe(1);
    expect(retirerStase(resultat.region, uid).ok).toBe(false);
    expect(retirerStase(entree, 'absent').ok).toBe(false);
    expect(entree).toEqual(avant);
  });

  it('ordonne les refus du Jeton', () => {
    const entree = region(pokemon({ shiny: true }));
    const avant = structuredClone(entree);
    expect(utiliserJetonShiny(entree, 'absent').message).toBe('Pokémon invalide !');
    expect(utiliserJetonShiny(entree, 'pc').message).toBe('Pokémon invalide !');
    expect(utiliserJetonShiny(entree, 'cible').message).toBe('Déjà chromatique !');
    expect(utiliserJetonShiny(region(), 'cible').message).toBe('Quantité invalide.');
    expect(entree).toEqual(avant);
  });

  it.each([undefined, { pasRestants: 1, pasMax: 10 }])('rend chromatique même un œuf : %j', (oeuf) => {
    const entree = region(pokemon({ oeuf }));
    entree.inventaire.shinyToken = 1;
    const avant = structuredClone(entree);
    Object.freeze(entree.equipe[0]);
    Object.freeze(entree.equipe);
    Object.freeze(entree.inventaire);
    Object.freeze(entree);
    const resultat = utiliserJetonShiny(entree, 'cible');
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.message).toBe('Chromatique !');
    expect(resultat.region.equipe[0]).toEqual({ ...avant.equipe[0], shiny: true });
    expect(resultat.region.inventaire.shinyToken).toBe(0);
    expect(resultat.region.pc).toEqual(avant.pc);
    expect(entree).toEqual(avant);
  });
});

describe('objets sur les Pokémon de l’équipe', () => {
  it('borne les Bonbons au niveau 100 et le Calcium à 10', () => {
    expect(quantiteMax('bonbon', pokemon(), 5)).toBe(2);
    expect(quantiteMax('calcium', pokemon(), 5)).toBe(1);
    expect(quantiteMax('bonbon', pokemon(), 1)).toBe(1);
    expect(quantiteMax('calcium', pokemon({ calcium: 0 }), 3)).toBe(3);
    expect(quantiteMax('bonbon', pokemon(), 0)).toBe(0);
    expect(cibleValide('bonbon', pokemon({ niveau: 100 }))).toBe(false);
    expect(cibleValide('calcium', pokemon({ calcium: 10 }))).toBe(false);
    expect(cibleValide('calcium', pokemon({ niveau: 100, calcium: 0 }))).toBe(true);
    expect(cibleValide('bonbon', pokemon({ calcium: 10 }))).toBe(true);
  });

  it.each(['bonbon', 'calcium'] as const)('refuse un œuf pour %s', (type) => {
    const cible = pokemon({ oeuf: { pasRestants: 1, pasMax: 10 } });
    expect(cibleValide(type, cible)).toBe(false);
    expect(quantiteMax(type, cible, 5)).toBe(0);
    expect(utiliserSurPokemon(region(cible), type, type, cible.uid, 1)).toEqual({
      ok: false, raison: 'Pokémon invalide !', message: 'Pokémon invalide !',
    });
  });

  it.each([
    ['bonbon', { niveau: 100 }, 'Niveau maximum !'],
    ['calcium', { calcium: 10 }, 'Limite atteinte !'],
  ] as const)('annonce la limite pour %s', (type, changements, message) => {
    expect(utiliserSurPokemon(region(pokemon(changements)), type, type, 'cible', 1))
      .toEqual({ ok: false, raison: message, message });
  });

  it.each([
    ['bonbon', 2, 100, 9, '+2 niveaux !'],
    ['calcium', 1, 98, 10, '+2 % DPS permanent'],
    ['calcium', 2, 98, 2, '+4 % DPS permanent'],
  ] as const)('utilise %s ×%i sans modifier les entrées ni l’XP', (type, n, niveau, calcium, message) => {
    const entree = region(pokemon({ calcium: type === 'calcium' && n === 2 ? 0 : 9 }));
    const avant = structuredClone(entree);
    Object.freeze(entree.equipe[0]);
    Object.freeze(entree.equipe);
    Object.freeze(entree.inventaire);
    Object.freeze(entree);
    const resultat = utiliserSurPokemon(entree, type, type, 'cible', n);
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.message).toBe(message);
    expect(resultat.region.equipe[0]).toEqual({ ...avant.equipe[0], niveau, calcium });
    expect(resultat.region.inventaire).toEqual({ ...avant.inventaire, [type]: 5 - n });
    expect(resultat.region.equipe[1]).toEqual(avant.equipe[1]);
    expect(resultat.region.pc).toEqual(avant.pc);
    expect(entree).toEqual(avant);
  });

  it.each(['bonbon', 'calcium'] as const)('refuse les quantités hors bornes pour %s', (type) => {
    const entree = region();
    const avant = structuredClone(entree);
    for (const n of [-1, 0, 0.5, 3, 6, NaN, Infinity]) {
      expect(utiliserSurPokemon(entree, type, type, 'cible', n)).toEqual({
        ok: false, raison: 'Quantité invalide.', message: 'Quantité invalide.',
      });
    }
    expect(utiliserSurPokemon({ ...entree, inventaire: {} }, type, type, 'cible', 1).ok).toBe(false);
    expect(utiliserSurPokemon({ ...entree, inventaire: { [type]: 1 } }, type, type, 'cible', 2).ok).toBe(false);
    expect(entree).toEqual(avant);
  });

  it.each(['pc', 'absent'])('refuse une cible hors équipe : %s', (uid) => {
    expect(utiliserSurPokemon(region(), 'bonbon', 'bonbon', uid, 1)).toEqual({
      ok: false, raison: 'Pokémon invalide !', message: 'Pokémon invalide !',
    });
  });
});
