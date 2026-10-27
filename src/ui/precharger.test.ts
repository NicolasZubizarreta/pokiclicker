import { beforeEach, expect, it, vi } from 'vitest';
import zones from '../../data/regions/kanto/zones.json';
import type { Zone } from '../core/monde';
import { avancerCombat, creerCombat, cliquer } from '../core/combat';
import type { ImagePrechargeable } from './precharger';

const zone = zones.zones.find(({ id }) => id === 'kanto.route-1') as Zone;
beforeEach(() => vi.resetModules());

it('choisit le sprite chromatique uniquement sur demande', async () => {
  const { cheminSprite } = await import('./precharger');
  for (const numero of [1, 25, 151]) {
    expect(cheminSprite(numero)).toBe(`img/sprites/pokemon/${numero}.png`);
    expect(cheminSprite(numero, false)).toBe(`img/sprites/pokemon/${numero}.png`);
    expect(cheminSprite(numero, true)).toBe(`img/sprites/pokemon-shiny/${numero}.png`);
  }
});

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

it('précharge aussi les adversaires de la Ligue', async () => {
  const { kanto } = await import('../core/regions');
  const { spritesPossibles, cheminSprite } = await import('./precharger');
  const ligue = kanto.zoneDeCombat('kanto.ligue-pokemon');
  const attendus = [...new Set([...(ligue.adversaires ?? []), ligue.boss].map(({ pokemon }) => cheminSprite(pokemon)))].sort();
  expect(spritesPossibles(ligue)).toEqual(attendus);
  expect(attendus.length).toBeGreaterThan(1);
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
    combat = avancerCombat(combat, combat.attenteMs);
  }
  expect(bossVus).toBeGreaterThan(0);
});
