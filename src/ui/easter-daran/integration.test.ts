// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire, validerDonneesRegion } from '../../core/sauvegarde';
import { creerStoreJeu } from '../store';
import type { StoreJeu } from '../store';
import { declencherAnniversaire } from './declencheur';
import { hasherEmail } from './compte-daran';
import { DRAPEAU_DARAN } from './nettoyage';

let store: StoreJeu | undefined;
beforeEach(() => vi.useFakeTimers());
afterEach(() => { store?.getState().arreter(); vi.useRealTimers(); });

// Le vrai store du jeu : l'action `appliquerRegionTemp` remplace la région, la sauvegarde l'écrit et la validation l'accepte.
it('nettoie la région du store, sauvegarde, et la sauvegarde reste valide', async () => {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  creerGestionnaire({ stockage, horloge, genererId: () => 'test' }).ecrireCompte(compteInitial());
  store = creerStoreJeu({ horloge, stockage, alea: () => .1, genererId: () => 'test' });
  store.getState().demarrer();
  const absurde = 9007199254740991;
  store.getState().appliquerRegionTemp(region => ({
    ...region, argent: absurde, jetons: absurde, inventaire: { pokeball: absurde, calcium: 5 },
    ameliorations: ['bicycle'], objetsCles: ['pokeflute'],
    equipe: region.equipe.map(p => ({ ...p, niveau: absurde, calcium: absurde, bonheur: absurde, shiny: true })),
  }));
  const ouvrir = vi.fn();
  await declencherAnniversaire(' DARAN ', {
    lireEmail: async () => 'Dresseur@Exemple.test', autorise: await hasherEmail('dresseur@exemple.test'),
    appliquerRegion: f => store!.getState().appliquerRegionTemp(f), ouvrir,
  });
  expect(ouvrir).toHaveBeenCalledTimes(1);
  expect(store.getState().argent).toBe(22);
  store.getState().arreter();
  const region = creerGestionnaire({ stockage, horloge, genererId: () => 'test' }).chargerRegion('test', 'kanto')!.donnees;
  expect(region).toMatchObject({ argent: 22, jetons: 22, inventaire: { pokeball: 22, calcium: 22 }, ameliorations: ['bicycle'], objetsCles: ['pokeflute'] });
  expect(region.drapeaux).toContain(DRAPEAU_DARAN);
  expect(region.equipe.length).toBeGreaterThan(0);
  for (const p of region.equipe) expect([p.niveau, p.calcium, p.bonheur, p.shiny]).toEqual([100, 10, 255, true]);
  expect(() => validerDonneesRegion(region)).not.toThrow();
});
