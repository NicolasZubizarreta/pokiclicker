import { describe, expect, it } from 'vitest';
import donnees from '../../data/meta.json';
import { meta } from './meta';

describe('Métadonnées du jeu', () => {
  it('lit le nom depuis le JSON', () => {
    expect(meta.nom).toBe(donnees.nom);
  });

  it('lit la version des données depuis le JSON', () => {
    expect(meta.versionDonnees).toBe(donnees.versionDonnees);
  });
});
