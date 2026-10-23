import { beforeEach, expect, it, vi } from 'vitest';
import zones from '../../data/regions/kanto/zones.json';
import type { Zone } from '../core/monde';
import { creerCombat, cliquer } from '../core/combat';
import type { ImagePrechargeable } from './precharger';

const zone = zones.zones.find(({ id }) => id === 'kanto.route-1') as Zone;
beforeEach(() => vi.resetModules());

function fabrique(demandes: Set<string>, echec?: string) {
  return vi.fn((): ImagePrechargeable => ({
    onload: null,
    onerror: null,
    set src(chemin: string) {
      demandes.add(chemin);
      queueMicrotask(() => { if (chemin === echec) this.onerror?.(new Event('error')); else this.onload?.(new Event('load')); });
    },
  }));
}

it('liste tous les sauvages et le boss de la Route 1, triés sans doublon', async () => {
  const { spritesPossibles, cheminSprite } = await import('./precharger');
  const chemins = spritesPossibles(zone);
  expect(chemins).toEqual([...new Set([...zone.sauvages, zone.boss].map(({ pokemon }) => cheminSprite(pokemon)))].sort());
  expect(chemins).toContain('img/sprites/pokemon/19.png');
  expect(chemins).toHaveLength(zone.sauvages.length);
});

it('mutualise les requêtes même simultanées et compte les échecs sans interruption', async () => {
  const { precharger } = await import('./precharger');
  const creer = fabrique(new Set(), 'absent.png');
  const premier = precharger(['present.png', 'absent.png', 'present.png'], creer);
  const second = precharger(['present.png', 'absent.png'], creer);
  expect(await premier).toEqual({ charges: 1, echecs: 1 });
  expect(await second).toEqual({ charges: 1, echecs: 1 });
  expect(await precharger(['present.png', 'absent.png'], creer)).toEqual({ charges: 1, echecs: 1 });
  expect(creer).toHaveBeenCalledTimes(2);
});

it('compte aussi une fabrique qui échoue', async () => {
  const { precharger } = await import('./precharger');
  expect(await precharger(['absent.png'], () => { throw new Error('Image indisponible'); }))
    .toEqual({ charges: 0, echecs: 1 });
});

it('a déjà chargé le sprite de chacune des 200 apparitions, boss compris', async () => {
  const { prechargerZone, cheminSprite } = await import('./precharger');
  const charges = new Set<string>();
  await prechargerZone(zone, fabrique(charges));
  let graine = 17;
  const alea = () => { graine = (graine * 16807) % 2147483647; return graine / 2147483647; };
  let combat = creerCombat(zone, [], alea);
  let bossVus = 0;
  for (let apparition = 0; apparition < 200; apparition++) {
    expect(charges.has(cheminSprite(combat.ennemi.numero))).toBe(true);
    if (combat.ennemi.boss) bossVus++;
    const courant = combat.ennemi;
    combat = cliquer({ ...combat, ennemi: { ...courant, pv: 1 } }, { essayer: () => true });
    expect(combat.ennemi).not.toBe(courant);
  }
  expect(bossVus).toBeGreaterThan(0);
});
