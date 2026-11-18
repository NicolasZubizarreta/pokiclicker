import { describe, expect, it } from 'vitest';
import { chargerRegion } from './composition-root';

describe('composition root', () => {
  it('charge Kanto', async () => {
    const region = await chargerRegion('kanto');
    expect(region.id).toBe('kanto');
    expect(region.monde.zones.length).toBeGreaterThan(0);
  });

  it('refuse une région inconnue', async () => {
    await expect(chargerRegion('johto')).rejects.toThrow('Région inconnue : johto');
  });
});
