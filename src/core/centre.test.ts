import { afterEach, expect, it, vi } from 'vitest';
import donnees from '../../data/reglages.json';
import { accesCentre, chargerObjets, objetsDuCentre, objetsDuShop } from './boutique';
import { reglages } from './reglages';
import { kanto } from './regions';
import type { EtatMonde } from './conditions';

const etat: EtatMonde = { badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [] };

afterEach(() => {
  vi.doUnmock('../../data/reglages.json');
  vi.resetModules();
});

it('ferme le catalogue puis propose tous les objets du Centre sans filtre de zone ni mutation', () => {
  const objets = chargerObjets().reverse();
  const avant = structuredClone(objets);
  expect(objetsDuCentre(objets, kanto, etat)).toEqual([]);
  const ouvert = { ...etat, bossVaincus: ['kanto.tour-pokemon'] };
  expect(objetsDuCentre(objets, kanto, ouvert).map(objet => objet.id)).toEqual(reglages.centre.objets);
  expect(objets).toEqual(avant);
  const complet = { ...etat, bossVaincus: kanto.zones.map(zone => zone.id) };
  expect(objetsDuShop(objets, kanto, complet).length).toBeGreaterThan(0);
  expect(objetsDuShop(objets, kanto, complet).some(objet => reglages.centre.objets.includes(objet.id))).toBe(false);
});

it('évalue la condition du lieu configuré et résout les noms de zones', () => {
  const lieu = vi.fn(() => ({ ...kanto.lieu('centre-commercial'), si: { type: 'boss' as const, zone: 'kanto.route-1' } }));
  expect(accesCentre({ lieu, zone: kanto.zone }, etat)).toEqual({ ok: false, raison: 'Bats le boss de Route 1.' });
  expect(lieu).toHaveBeenCalledWith('centre-commercial');
  expect(accesCentre({ lieu: () => ({ ...kanto.lieu('centre-commercial'), si: undefined }), zone: kanto.zone }, etat))
    .toEqual({ ok: true });
});

it.each(['inconnu', 'non-mall', 'absent', 'doublon', 'lieu', 'bloc'])(
  'rejette des réglages du Centre invalides : %s', async cas => {
    const centre = { lieu: 'centre-commercial', objets: chargerObjets().filter(objet => objet.boutique === 'mall').map(objet => objet.id) };
    if (cas === 'inconnu') centre.objets.push('inconnu');
    if (cas === 'non-mall') centre.objets.push('pokeball');
    if (cas === 'absent') centre.objets.pop();
    if (cas === 'doublon') centre.objets.push(centre.objets[0]!);
    if (cas === 'lieu') centre.lieu = '';
    vi.doMock('../../data/reglages.json', () => ({ default: { ...donnees, centre: cas === 'bloc' ? undefined : centre } }));
    vi.resetModules();
    await expect(import('./reglages')).rejects.toThrow('Réglages du Centre invalides');
  },
);
