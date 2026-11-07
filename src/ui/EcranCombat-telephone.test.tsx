// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { EcranCombat } from './EcranCombat';
import { BandeauHaut } from './BandeauHaut';
import { creerStoreJeu } from './store';
import type { StoreJeu } from './store';
import { fermerSac, storeSac } from './sacContexte';

let store: StoreJeu;
const ecran = (telephone: boolean) => vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({
  matches: telephone && requete.includes('max-width'), addEventListener: vi.fn(), removeEventListener: vi.fn() })));

beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); store?.getState().arreter(); fermerSac(); vi.useRealTimers(); vi.unstubAllGlobals(); });

function preparer(telephone: boolean) {
  ecran(telephone);
  const horloge = creerHorlogeSimulee();
  const stockage = creerStockageMemoire();
  const compte = compteInitial();
  creerGestionnaire({ stockage, horloge, genererId: () => 'test' }).ecrireCompte({ ...compte,
    preferences: { ...compte.preferences, arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  store = creerStoreJeu({ horloge, stockage, alea: () => .1, genererId: () => 'test' });
  store.getState().demarrer();
  return render(<EcranCombat store={store} />);
}

it('téléphone : toucher une carte ouvre la fiche sans édition du surnom', () => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true,
    value(this: HTMLDialogElement) { this.setAttribute('open', ''); } });
  preparer(true);
  fireEvent.click(screen.getAllByRole('button', { name: /^Ouvrir la fiche de / })[0]!);
  expect(screen.getByRole('dialog')).toBeTruthy();
  expect(screen.queryByRole('textbox', { name: 'Surnom' })).toBeNull();
});

it('téléphone : capture, quatre boutons, ni Outils ni Arrêter après ni dialogue permanent', () => {
  preparer(true);
  const capture = screen.getByRole('region', { name: 'Capture' });
  expect(within(capture).getByRole('button', { name: 'Capturer' })).toBeTruthy();
  const actions = within(screen.getByRole('group', { name: 'Actions du combat' }));
  for (const nom of ['Attaque auto', 'Arrêt auto', "Réglage de l'arrêt auto", 'Sac']) {
    expect(actions.getByRole('button', { name: nom })).toBeTruthy();
  }
  expect(screen.queryByRole('button', { name: /Outils|Arrêter après/ })).toBeNull();
  expect(screen.queryByRole('complementary', { name: 'Dialogue' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Fauchage' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Poké-Radar' })).toBeNull();
});

it('téléphone : Fauchage et Poké-Radar apparaissent une fois débloqués', () => {
  preparer(true);
  act(() => store.setState({ radar: true, fauchage: { ...store.getState().fauchage, possede: true, disponible: true } }));
  const actions = within(screen.getByRole('group', { name: 'Actions du combat' }));
  expect(actions.getByRole('button', { name: 'Fauchage' })).toBeTruthy();
  expect(actions.getByRole('button', { name: 'Poké-Radar' })).toBeTruthy();
});

it('téléphone : le réglage de l’arrêt auto ouvre le paramétrage, le bouton Sac ouvre la fenêtre du Sac', () => {
  preparer(true);
  const showModal = vi.fn(function (this: HTMLDialogElement) { this.setAttribute('open', ''); });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: showModal });
  fireEvent.click(screen.getByRole('button', { name: "Réglage de l'arrêt auto" }));
  expect(showModal).toHaveBeenCalledTimes(1);
  expect(screen.getByRole('heading', { name: "Réglage de l'arrêt auto", hidden: true })).toBeTruthy();
  act(() => store.setState({ sac: { ...store.getState().sac, acces: { ouvert: true, raison: null } } }));
  fireEvent.click(screen.getByRole('button', { name: 'Sac' }));
  expect(storeSac.getState().ouvert).toBe(true);
});

it('PC : rien ne change, boutons d’origine et dialogue de Chen', () => {
  preparer(false);
  expect(screen.getByRole('button', { name: 'Auto-attaque' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Attaque auto' })).toBeNull();
  expect(screen.getByRole('complementary', { name: 'Dialogue' })).toBeTruthy();
});

it('bandeau : la ligne de zone n’existe que dans le combat sur téléphone', () => {
  ecran(true);
  const { rerender } = render(<BandeauHaut combat />);
  expect(screen.getAllByRole('button', { name: /^Zone (précédente|suivante)/ }).length).toBe(2);
  rerender(<BandeauHaut />);
  expect(screen.queryByRole('button', { name: /^Zone (précédente|suivante)/ })).toBeNull();
});
