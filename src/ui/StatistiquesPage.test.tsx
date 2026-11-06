// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { StatistiquesPage } from './StatistiquesPage';
import { creerStoreJeu, storeJeu } from './store';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));
vi.mock('./store', async original => ({
  ...await original<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

beforeEach(() => {
  localStorage.clear();
  contexte.store = creerStoreJeu({
    horloge: { maintenant: () => 0 },
    stockage: {
      lire: cle => localStorage.getItem(cle),
      ecrire: (cle, valeur) => localStorage.setItem(cle, valeur),
      supprimer: cle => localStorage.removeItem(cle),
      cles: () => Object.keys(localStorage),
    },
    alea: () => 0.5,
    genererId: () => 'test-statistiques',
  });
  storeJeu.getState().demarrer();
});
afterEach(() => {
  cleanup();
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
});

it('présente les sept statistiques du store et le retour', () => {
  const retour = vi.fn();
  render(<StatistiquesPage retour={retour} />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Statistiques');
  expect(screen.getAllByRole('region')).toHaveLength(7);
  for (const stat of storeJeu.getState().statistiques) {
    expect(screen.getByRole('region', { name: stat.libelle })).toBeTruthy();
  }
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(retour).toHaveBeenCalledOnce();
});

it('formate les chiffres et présente les détails des boosts', () => {
  storeJeu.setState({ statistiques: [
    { libelle: 'Clics', valeur: 12345, unite: ' clics' },
    { libelle: 'Attaque', base: '10', boosts: [], total: '20' },
    { libelle: 'Passif', libelleBase: 'Production', base: '5', boosts: ['Bonus'] },
  ] });
  render(<StatistiquesPage retour={() => {}} />);
  expect(screen.getByRole('region', { name: 'Clics' }).querySelector('p')?.textContent)
    .toBe(`${(12345).toLocaleString('fr-FR')} clics`);
  for (const texte of ['Aucun', 'Base', 'Boosts', 'Total', '20', 'Production', 'Boosts passifs', 'Bonus']) {
    expect(screen.getByText(texte)).toBeTruthy();
  }
});
