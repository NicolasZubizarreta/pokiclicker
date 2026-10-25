import { describe, expect, it } from 'vitest';
import { basculerFavori, detailDps, echanger, envoyerAuPc, placerDansEquipe, relacher, renommer } from './equipe';
import { reglages } from './reglages';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { calculerDps } from './stats';

function pokemon(uid: string, oeuf = false): PokemonPossede {
  return {
    uid, numero: 25, niveau: 10, xp: 0, shiny: false, bonheur: 0,
    pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
    ...(oeuf ? { oeuf: { pasRestants: 10, pasMax: 10 } } : {}),
  };
}

function region(equipe = [pokemon('a'), pokemon('b')], pc = [pokemon('pc')]): DonneesRegion {
  return {
    ...structuredClone(reglages.depart.region),
    regionId: 'kanto', zoneId: '1', etape: 1, equipe, pc,
    badges: [], bossVaincus: [], objetsCles: [], quetes: [], drapeaux: [],
    evenementsJoues: [], argent: 0, inventaire: {}, ligueGagnee: 0,
  };
}

function figer(objet: object) {
  Object.values(objet).forEach((valeur: unknown) => {
    if (valeur !== null && typeof valeur === 'object') figer(valeur);
  });
  Object.freeze(objet);
}

const dernier = "C'est ton dernier Pokémon : garde-le dans l'équipe.";
const actif = "Il faut au moins 1 Pokémon actif dans l'équipe.";

describe('règles d’équipe', () => {
  it.each(['a', 'pc'])('renomme dans les deux listes : %s, après trim', (uid) => {
    const resultat = renommer(region(), uid, '  abcdefghijkl  ');
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect([...resultat.region.equipe, ...resultat.region.pc].find((p) => p.uid === uid)?.surnom).toBe('abcdefghijkl');
    }
  });

  it.each(['abcdefghijklm', '', '   ', '😀'.repeat(7)])('refuse le surnom invalide %j', (texte) => {
    expect(renommer(region(), 'a', texte)).toEqual({ ok: false, raison: 'Entre un nom de 1 à 12 caractères.' });
  });

  it.each(['a', 'pc'])('bascule le favori dans les deux sens : %s', (uid) => {
    const resultat = basculerFavori(region(), uid);
    expect(resultat.ok).toBe(true);
    if (resultat.ok) {
      expect([...resultat.region.equipe, ...resultat.region.pc].find((p) => p.uid === uid)?.favori).toBe(true);
      expect(basculerFavori(resultat.region, uid)).toEqual({ ok: true, region: region() });
    }
  });

  it.each([false, true])('garde le seul Pokémon, même œuf (%s)', (oeuf) => {
    const entree = region([pokemon('a', oeuf)]);
    expect(envoyerAuPc(entree, 'a')).toEqual({ ok: false, raison: dernier });
    expect(relacher(entree, 'a')).toEqual({ ok: false, raison: dernier });
  });

  it('garde le dernier actif mais permet de déplacer ou relâcher un œuf', () => {
    const entree = region([pokemon('a'), pokemon('oeuf', true)]);
    expect(envoyerAuPc(entree, 'a')).toEqual({ ok: false, raison: actif });
    expect(relacher(entree, 'a')).toEqual({ ok: false, raison: actif });
    expect(envoyerAuPc(entree, 'oeuf')).toEqual({ ok: true, region: { ...entree, equipe: [pokemon('a')], pc: [...entree.pc, pokemon('oeuf', true)] } });
    expect(relacher(entree, 'oeuf')).toEqual({ ok: true, region: { ...entree, equipe: [pokemon('a')] } });
  });

  it('déplace ou relâche un actif quand il en reste un autre', () => {
    const entree = region();
    expect(envoyerAuPc(entree, 'a')).toEqual({ ok: true, region: { ...entree, equipe: [pokemon('b')], pc: [...entree.pc, pokemon('a')] } });
    expect(relacher(entree, 'a')).toEqual({ ok: true, region: { ...entree, equipe: [pokemon('b')] } });
    expect(relacher(region([pokemon('a')]), 'pc')).toEqual({ ok: true, region: region([pokemon('a')], []) });
  });

  it('place depuis le PC ou demande un échange si l’équipe est pleine', () => {
    const entree = region();
    expect(placerDansEquipe(entree, 'pc')).toEqual({ ok: true, region: { ...entree, equipe: [...entree.equipe, pokemon('pc')], pc: [] } });
    const pleine = region(Array.from({ length: reglages.equipe.taille }, (_, i) => pokemon(String(i))));
    const resultat = placerDansEquipe(pleine, 'pc');
    expect(resultat).toEqual({ ok: true, echangeRequis: true, region: pleine });
    if (resultat.ok) expect(resultat.region).toBe(pleine);
  });

  it('échange en conservant les positions et au moins un actif', () => {
    const entree = region([pokemon('a'), pokemon('b')], [pokemon('x'), pokemon('oeuf', true)]);
    expect(echanger(entree, 'oeuf', 'a')).toEqual({ ok: true, region: { ...entree, equipe: [pokemon('oeuf', true), pokemon('b')], pc: [pokemon('x'), pokemon('a')] } });
    const dernierActif = region([pokemon('a'), pokemon('b', true)], [pokemon('oeuf', true)]);
    expect(echanger(dernierActif, 'oeuf', 'a')).toEqual({ ok: false, raison: actif });
    expect(echanger(dernierActif, 'oeuf', 'b').ok).toBe(true);
    expect(echanger(region([pokemon('a')]), 'pc', 'a').ok).toBe(true);
  });

  it('ne limite pas le PC', () => {
    const entree = region(undefined, Array.from({ length: 1000 }, (_, i) => pokemon(`pc${i}`)));
    const resultat = envoyerAuPc(entree, 'a');
    expect(resultat.ok).toBe(true);
    if (resultat.ok) expect(resultat.region.pc).toHaveLength(1001);
  });

  it('refuse les identifiants absents ou dans la mauvaise liste', () => {
    const entree = region();
    for (const resultat of [renommer(entree, '?', 'nom'), basculerFavori(entree, '?'), relacher(entree, '?'), envoyerAuPc(entree, 'pc'), placerDansEquipe(entree, 'a'), echanger(entree, '?', 'a'), echanger(entree, 'pc', '?')]) {
      expect(resultat).toMatchObject({ ok: false, raison: expect.any(String) });
    }
  });

  it('ne modifie aucune entrée, y compris les Pokémon imbriqués', () => {
    const entree = region();
    const copie = structuredClone(entree);
    figer(entree);
    for (const resultat of [renommer(entree, 'a', 'nom'), renommer(entree, 'pc', 'nom'), basculerFavori(entree, 'a'), basculerFavori(entree, 'pc'), relacher(entree, 'a'), relacher(entree, 'pc'), envoyerAuPc(entree, 'a'), placerDansEquipe(entree, 'pc'), echanger(entree, 'pc', 'a')]) {
      expect(resultat.ok).toBe(true);
    }
    expect(entree).toEqual(copie);
  });
});

describe('détail du DPS', () => {
  it.each([1, 0, 0.5, 2])('reproduit calculerDps pour le multiplicateur %s', (multiplicateurType) => {
    for (const numero of [25, 129, 150]) {
      for (const bonus of [false, true]) {
        const p = { ...pokemon('a'), numero, niveau: 42, shiny: bonus, bonheur: bonus ? 255 : 0, pierreEternelle: bonus, calcium: bonus ? 7 : 0 };
        figer(p);
        const detail = detailDps(p, multiplicateurType);
        expect(detail).toEqual({
          base: calculerDps({ numero, niveau: p.niveau }), multiplicateurType,
          shiny: bonus ? reglages.degats.shiny : 1,
          bonheur: 1 + p.bonheur * reglages.degats.bonheurParPoint,
          pierreEternelle: bonus ? reglages.degats.pierreEternelle : 1,
          calcium: 1 + p.calcium * reglages.degats.calciumParBoost,
        });
        expect(Object.values(detail).reduce((produit, facteur) => produit * facteur, 1))
          .toBeCloseTo(calculerDps({ ...p, multiplicateurType }));
      }
    }
  });
});
