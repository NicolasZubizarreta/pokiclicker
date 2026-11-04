import { describe, expect, it } from 'vitest';
import { evaluerParcours, lireCibles, simulerCibles, validerCibles } from '../scripts/comparer-equilibrage.mjs';

const { cibles, erreurs } = validerCibles(lireCibles());

describe('durées du parcours (ticket E)', () => {
  it('valide toujours le schéma et la couverture des zones', () => {
    expect(erreurs).toEqual([]);
  });

  it.skipIf(cibles?.valide !== true)('surveille les durées seulement après validation de Nicolas (valide: false = simulation désactivée)', async () => {
    const { resultat, simulationMs } = await simulerCibles(cibles);
    expect(simulationMs).toBeLessThan(30000);
    expect(evaluerParcours(cibles, resultat)).toEqual([]);
  }, 35000);

  const fabriquer = (valide = true) => ({
    ...cibles, valide, zones: { 'kanto.route-1': { tempsVisMinutes: 1 } },
  });
  const resultat = (minutes = 60, zone = 1.25) => ({
    tempsMs: minutes * 60000,
    zones: [
      { id: 'kanto.route-1', entreeMs: 0, sortieMs: zone * 60000, victoire: true },
      { id: 'kanto.ligue-pokemon', victoire: true },
    ],
  });

  it('fait échouer un dépassement fabriqué avec le diagnostic complet', () => {
    const messages = evaluerParcours(fabriquer(), resultat(60, 2));
    expect(messages).toEqual([
      `kanto.route-1 : temps mesuré 2 minutes, cible 1 minutes; tolérance 0.25; protocole ${JSON.stringify(cibles.protocole)}`,
    ]);
    expect(() => { if (messages.length) throw new Error(messages.join('\n')); }).toThrow(messages[0]);
  });

  it.each([60, 90])('accepte la borne Ligue %s et la borne exacte de tolérance', minutes => {
    expect(evaluerParcours(fabriquer(), resultat(minutes))).toEqual([]);
  });

  it.each([59.99, 90.01])('rejette la durée Ligue %s', minutes => {
    expect(evaluerParcours(fabriquer(), resultat(minutes))[0]).toContain('kanto.ligue-pokemon');
  });

  it('rejette une victoire manquante', () => {
    expect(evaluerParcours(fabriquer(), { tempsMs: 60 * 60000, zones: [] }).length).toBe(2);
  });

  it('désactive les seuils non validés même pour un résultat hors limites', () => {
    expect(evaluerParcours(fabriquer(false), resultat(200, 100))).toEqual([]);
  });
});
