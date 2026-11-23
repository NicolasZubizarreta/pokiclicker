// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { chargerEvenements } from '../core/evenements';
import { kanto } from '../core/regions';
import { creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';
import { PageCasino } from './PageCasino';

const stores: StoreJeu[] = [];
afterEach(() => { cleanup(); stores.forEach(s => s.getState().arreter()); stores.length = 0; vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function preparer() {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, argent: 2000, jetons: 1000, bossVaincus: ['kanto.tour-pokemon'] });
  const ouvrir = () => {
    const store = creerStoreJeu({ stockage, horloge, alea: () => 0.5, genererId: () => 'achat',
      evenements: chargerEvenements({ test: { version: 1, evenements: [] } }, kanto) });
    stores.push(store); store.getState().demarrer(); return store;
  };
  return { ouvrir };
}
const clic = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));

it('Voltorbe Flip : on commence, la grille survit à un rechargement, on encaisse', () => {
  const { ouvrir } = preparer();
  const store = ouvrir();
  const page = render(<PageCasino store={store} retour={vi.fn()} />);
  clic('Retourner des cartes');
  fireEvent.change(screen.getByLabelText('Mise en jetons'), { target: { value: '20' } });
  clic('Commencer la grille');
  expect(store.getState().casino.jetons).toBe(980);
  expect(screen.getAllByRole('button', { name: /Retourner la carte/ })).toHaveLength(25);
  page.unmount();
  // Rechargement : la grille en cours rouvre directement le jeu.
  const suite = ouvrir();
  render(<PageCasino store={suite} retour={vi.fn()} />);
  expect(screen.getAllByRole('button', { name: /Retourner la carte/ })).toHaveLength(25);
  clic(/Encaisser/);
  expect(suite.getState().casino.voltorbe).toBeNull();
  expect(suite.getState().casino.jetons).toBe(980 + 16);
  expect(screen.getByText(/Session : .4 jetons · 1 partie · 0 gagnée/)).toBeTruthy();
});
