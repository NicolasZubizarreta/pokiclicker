import { describe, expect, it } from 'vitest';
import ligueV1 from '../../tests/fixtures/v1-ligue.json';
import zonesV1 from '../../tests/fixtures/v1-zones.json';
import { evenementsKanto } from './evenements-kanto';
import { kanto } from './regions';

describe('fidélité des rencontres Kanto', () => {
  it('charge cinq rivaux dont le dernier Pokémon suit le counter V1', () => {
    const rivaux = evenementsKanto.liste.filter(e => e.etapes.some(
      etape => etape.type === 'combat' && 'equipes' in etape,
    ));
    const zones = ['foret-de-jade', 'arene-de-carmin', 'tour-pokemon', 'sylphe-sarl', 'route-victoire'];
    expect(rivaux).toHaveLength(5);
    for (const starter of [1, 4, 7] as const) {
      const counter = ligueV1.counter.find(c => c.starterId === starter)!;
      expect(counter).toBeDefined();
      for (const [index, zone] of zones.entries()) {
        const evenement = rivaux.find(e => e.declencheur.type === 'entree-zone'
          && e.declencheur.zone === `kanto.${zone}`);
        const rival = evenement?.etapes.find(etape => etape.type === 'combat' && 'equipes' in etape);
        if (rival?.type !== 'combat' || !('equipes' in rival)) throw new Error(`Rival attendu : ${zone}`);
        const equipe = rival.equipes[String(starter) as '1' | '4' | '7'];
        expect(evenement?.si).toEqual({ non: { type: 'boss', zone: `kanto.${zone}` } });
        expect(equipe).toHaveLength([2, 4, 4, 5, 6][index]!);
        for (const membre of equipe.slice(0, -1)) {
          expect(membre.niveau).toBeGreaterThanOrEqual(equipe.at(-1)!.niveau - 5);
          expect(membre.niveau).toBeLessThanOrEqual(equipe.at(-1)!.niveau - 2);
        }
        expect(equipe.at(-1)?.pokemon).toBe(counter.id - (index === 0 ? 2 : index < 3 ? 1 : 0));
        expect(equipe.at(-1)?.niveau).toBe([6, 23, 33, 45, 70][index]);
      }
    }
  });

  it('conserve le boss Pont Pépite et le Ronflex sauvage de la Centrale', () => {
    const boss = zonesV1.zones.find(z => z.id === 6)!.boss!;
    expect(kanto.zoneDeCombat('kanto.pont-pepite').boss).toEqual({
      pokemon: boss.id, nom: boss.name, niveau: boss.level, capture: boss.catchRate,
    });
    const ronflex = zonesV1.zones.find(z => z.id === 12)!.pokemons.find(p => p.id === 143)!;
    if (!('spawnRate' in ronflex)) throw new Error('Ronflex sauvage V1 attendu');
    expect(ronflex.rarity).toBe('Très Rare');
    expect(kanto.zoneDeCombat('kanto.centrale').sauvages.find(p => p.pokemon === 143)).toEqual({
      pokemon: ronflex.id, rarete: 'tres-rare', apparition: ronflex.spawnRate, capture: ronflex.catchRate,
    });
  });
});
