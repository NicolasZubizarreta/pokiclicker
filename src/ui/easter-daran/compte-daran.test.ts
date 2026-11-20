import { describe, expect, it } from 'vitest';
import { COMPTE_DARAN, estCompteDaran, estSurnomDaran } from './compte-daran';

describe('garde-fou du compte de Daran', () => {
  it('refuse toute autorisation non renseignée', () => {
    for (const autorise of ['', '   ']) {
      for (const identifiant of ['', '   ', null, undefined, 'daran']) {
        expect(estCompteDaran(identifiant, autorise)).toBe(false);
      }
    }
    expect(COMPTE_DARAN).toBe('');
    for (const identifiant of ['', null, undefined, 'daran']) {
      expect(estCompteDaran(identifiant)).toBe(false);
    }
  });

  it('compare les comptes en ignorant la casse et les espaces extérieurs', () => {
    expect(estCompteDaran('autre', 'compte-daran')).toBe(false);
    expect(estCompteDaran('  COMPTE-Daran ', ' compte-daran  ')).toBe(true);
    expect(estCompteDaran(null, 'compte-daran')).toBe(false);
    expect(estCompteDaran(undefined, 'compte-daran')).toBe(false);
  });

  it('reconnaît seulement le surnom Daran', () => {
    for (const surnom of ['Daran', 'daran', 'DARAN', '  Daran  ']) {
      expect(estSurnomDaran(surnom)).toBe(true);
    }
    for (const surnom of ['Daran2', 'Dar an', '', null, undefined]) {
      expect(estSurnomDaran(surnom)).toBe(false);
    }
  });
});
