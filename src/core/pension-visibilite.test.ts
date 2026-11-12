import { describe, expect, it } from 'vitest';
import { chancePonte, couplePonte, entrerALaPension, pensionVisitee } from './pension';
import { reglages } from './reglages';
import { regionInitiale, validerDonneesRegion } from './sauvegarde';
import type { PokemonPossede } from './sauvegarde-types';

const pokemon = (numero: number, sexe: PokemonPossede['sexe'], uid = `p${numero}${sexe}`): PokemonPossede => ({
  uid, numero, sexe, niveau: 10, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, favori: false,
});
const { chances, metamorph } = reglages.pension;

describe('couplePonte', () => {
  it('donne la chance et la raison de chaque cas, avec la même chance que chancePonte', () => {
    const cas: [PokemonPossede, PokemonPossede, number, string][] = [
      [pokemon(25, 'femelle'), pokemon(25, 'male'), chances.memeEspece, 'memeEspece'],
      [pokemon(25, 'femelle'), pokemon(26, 'male'), chances.memeEspece, 'memeEspece'],
      [pokemon(25, 'femelle'), pokemon(81, 'sansSexe'), 0, 'sansSexe'],
      [pokemon(25, 'femelle'), pokemon(26, 'femelle', 'autre'), 0, 'memeSexe'],
      [pokemon(25, 'femelle'), pokemon(metamorph, 'sansSexe'), chances.metamorph, 'metamorph'],
      [pokemon(25, 'femelle'), pokemon(81, 'male'), chances.typePartage, 'typePartage'],
      [pokemon(25, 'femelle'), pokemon(74, 'male'), 0, 'aucunType'],
    ];
    for (const [a, b, chance, raison] of cas) {
      const resultat = couplePonte([a, b]);
      expect(resultat).toEqual({ chance, raison });
      expect(resultat.chance).toBe(chancePonte([a, b]));
    }
  });

  it('un seul parent ou aucun : pas de chance, raison « incomplet »', () => {
    expect(couplePonte([])).toEqual({ chance: 0, raison: 'incomplet' });
    expect(couplePonte([pokemon(25, 'femelle')])).toEqual({ chance: 0, raison: 'incomplet' });
  });

  it('Métamorph pond avec n’importe qui, même sans sexe', () => {
    expect(couplePonte([pokemon(metamorph, 'sansSexe'), pokemon(25, 'male')])).toEqual({ chance: chances.metamorph, raison: 'metamorph' });
  });

  it('deux Pokémon sans sexe ou du même sexe ne pondent pas', () => {
    expect(couplePonte([pokemon(81, 'sansSexe'), pokemon(82, 'sansSexe')])).toMatchObject({ chance: 0 });
    expect(couplePonte([pokemon(25, 'male'), pokemon(26, 'male', 'x')])).toEqual({ chance: 0, raison: 'memeSexe' });
  });
});

describe('première entrée dans la pension', () => {
  const region = () => regionInitiale('kanto', 'kanto.bourg-palette');

  it('une pension neuve n’a jamais été visitée ; la première entrée pose pensionVue et se signale une seule fois', () => {
    const neuve = region();
    expect(pensionVisitee(neuve)).toBe(false);
    const premiere = entrerALaPension(neuve);
    expect(premiere.premiere).toBe(true);
    expect(premiere.region.pensionVue).toBe(true);
    expect(pensionVisitee(premiere.region)).toBe(true);
    const seconde = entrerALaPension(premiere.region);
    expect(seconde.premiere).toBe(false);
    expect(seconde.region).toBe(premiere.region);
  });

  it('une pension déjà utilisée (parents, œufs ou espèces écloses) compte comme visitée, sans signal de première entrée', () => {
    const avecParent = { ...region(), pension: { ...region().pension, parents: [pokemon(25, 'femelle')] } };
    expect(pensionVisitee(avecParent)).toBe(true);
    expect(entrerALaPension(avecParent).premiere).toBe(false);
    const avecEspeces = { ...region(), especesEcloses: [25] };
    expect(pensionVisitee(avecEspeces)).toBe(true);
    expect(entrerALaPension(avecEspeces).region.pensionVue).toBe(true);
  });

  it('la sauvegarde accepte pensionVue, la refuse mal typé, et son absence reste valide', () => {
    expect(() => validerDonneesRegion(region())).not.toThrow();
    expect(() => validerDonneesRegion({ ...region(), pensionVue: true })).not.toThrow();
    expect(() => validerDonneesRegion({ ...region(), pensionVue: 'oui' })).toThrow();
  });
});
