import { expect, it } from 'vitest';
import fixture from './fixtures/v1-repousses.json';
import { creerEnnemi } from '../src/core/ennemis';
import { kanto } from '../src/core/regions';
import type { Zone } from '../src/core/monde';
import { reglages } from '../src/core/reglages';
import zonesV1 from './fixtures/v1-zones.json';

// Les taux des zones à légendaires ont changé (ticket T) : la zone est rejouée avec les taux d'origine de la V1.
const tauxV1 = (zone: Zone, ancienId: number): Zone => {
  const v1 = zonesV1.zones.find((candidate) => candidate.id === ancienId)!;
  return { ...zone, sauvages: zone.sauvages?.map((sauvage) => ({
    ...sauvage, apparition: (v1.pokemons.find((pokemon) => pokemon.id === sauvage.pokemon) as { spawnRate: number }).spawnRate,
  })) } as Zone;
};

it('reproduit chaque apparition de la fixture V1 avec les repousses', () => {
  for (const ligne of fixture.apparitions) {
    const actifs = ligne.objet === 'superRepel' ? ['repousse:peu-commun']
      : ligne.objet === 'repel' ? ['repousse:commun'] : [];
    let appel = 0;
    const ennemi = creerEnnemi(tauxV1(kanto.zone(ligne.zone) as unknown as Zone, kanto.zone(ligne.zone).ancienId), 1,
      () => ++appel === 2 ? ligne.r : 0.99, reglages.combat, actifs);
    expect(ennemi.numero, JSON.stringify(ligne)).toBe(ligne.id);
  }
});
