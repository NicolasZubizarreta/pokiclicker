import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { sexeEspece, tirerSexe } from '../src/core/sexe';
import sexes from '../data/sexes.json';

const source = readFileSync(new URL('../legacy/js/data/constants.js', import.meta.url), 'utf8');
const { GENDERLESS_IDS, ALWAYS_MALE_IDS, ALWAYS_FEMALE_IDS } = runInNewContext(
  `${source}\n;({ GENDERLESS_IDS, ALWAYS_MALE_IDS, ALWAYS_FEMALE_IDS })`, {},
) as { GENDERLESS_IDS: number[]; ALWAYS_MALE_IDS: number[]; ALWAYS_FEMALE_IDS: number[] };

describe('sexes fidèles à la V1', () => {
  it('classe exactement les 151 espèces de Kanto', () => {
    for (let numero = 1; numero <= 151; numero++) {
      const attendu = GENDERLESS_IDS.includes(numero) ? 'sansSexe'
        : ALWAYS_MALE_IDS.includes(numero) ? 'male'
          : ALWAYS_FEMALE_IDS.includes(numero) ? 'femelle' : 'aleatoire';
      expect(sexeEspece(numero), `Espèce n°${numero}`).toBe(attendu);
    }
  });
  it('tire un mâle à 0,49 et une femelle à 0,5', () => {
    expect(tirerSexe(25, () => 0.49)).toBe('male');
    expect(tirerSexe(25, () => 0.5)).toBe('femelle');
  });
  it.each([[100, 'sansSexe'], [32, 'male'], [29, 'femelle']] as const)(
    'ignore l’aléa pour l’espèce fixe %s', (numero, sexe) => {
      const alea = vi.fn(() => { throw new Error('Aléa interdit'); });
      expect(tirerSexe(numero, alea)).toBe(sexe);
      expect(alea).not.toHaveBeenCalled();
    },
  );
  it.each([
    { ...sexes, sansSexe: [...sexes.sansSexe, 29] },
    { ...sexes, toujoursMale: [...sexes.toujoursMale, 999] },
  ])('refuse des données non disjointes ou un numéro inconnu au chargement', async donnees => {
    vi.resetModules();
    vi.doMock('../data/sexes.json', () => ({ default: donnees }));
    try {
      await expect(import('../src/core/sexe')).rejects.toThrow(/non disjointes|inconnu/);
    } finally {
      vi.doUnmock('../data/sexes.json');
      vi.resetModules();
    }
  });
});
