import { expect, it } from 'vitest';
import fixture from './fixtures/v1-repousses.json';
import { creerEnnemi } from '../src/core/ennemis';
import { kanto } from '../src/core/regions';
import type { Zone } from '../src/core/monde';
import { reglages } from '../src/core/reglages';

it('reproduit chaque apparition de la fixture V1 avec les repousses', () => {
  for (const ligne of fixture.apparitions) {
    const actifs = ligne.objet === 'superRepel' ? ['repousse:peu-commun']
      : ligne.objet === 'repel' ? ['repousse:commun'] : [];
    let appel = 0;
    const ennemi = creerEnnemi(kanto.zone(ligne.zone) as unknown as Zone, 1,
      () => ++appel === 2 ? ligne.r : 0.99, reglages.combat, actifs);
    expect(ennemi.numero, JSON.stringify(ligne)).toBe(ligne.id);
  }
});
