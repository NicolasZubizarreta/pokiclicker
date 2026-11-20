// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { COMPTE_DARAN, estCompteDaran, estSurnomDaran, hasherEmail, normaliserEmail } from './compte-daran';

describe('garde-fou du compte de Daran', () => {
  it('compare les e-mails normalisés par leur hash', async () => {
    const hash = await hasherEmail('dresseur@exemple.test');
    expect(normaliserEmail(' Dresseur@\tExemple.TEST\n')).toBe('dresseur@exemple.test');
    expect(await estCompteDaran(' Dresseur@ Ex emple.TEST ', ` ${hash.toUpperCase()} `)).toBe(true);
    expect(await estCompteDaran('autre@exemple.test', hash)).toBe(false);
    for (const email of [null, undefined, '', '   ']) {
      expect(await estCompteDaran(email, hash)).toBe(false);
    }
    for (const autorise of ['', '   ']) {
      expect(await estCompteDaran('dresseur@exemple.test', autorise)).toBe(false);
    }
    expect(await estCompteDaran('dresseur@exemple.test')).toBe(false);
    expect(COMPTE_DARAN).toMatch(/^[0-9a-f]{64}$/);
  });

  it('calcule le SHA-256 attendu', async () => {
    expect(await hasherEmail('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('refuse si le chiffrement est indisponible ou échoue', async () => {
    try {
      vi.stubGlobal('crypto', {});
      expect(await estCompteDaran('dresseur@exemple.test', 'hash')).toBe(false);
      vi.stubGlobal('crypto', { subtle: { digest: async () => { throw new Error('indisponible'); } } });
      expect(await estCompteDaran('dresseur@exemple.test', 'hash')).toBe(false);
    } finally { vi.unstubAllGlobals(); }
  });

  it.runIf(process.env.DARAN_EMAIL_TEST)('la vraie adresse passe, une autre non', async () => {
    expect(await estCompteDaran(process.env.DARAN_EMAIL_TEST)).toBe(true);
    expect(await estCompteDaran('autre@exemple.test')).toBe(false);
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
