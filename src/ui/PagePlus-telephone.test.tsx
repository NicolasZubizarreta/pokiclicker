// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PagePlus } from './PagePlus';
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
    genererId: () => 'test-plus-telephone',
  });
  storeJeu.getState().demarrer();
  vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({
    matches: requete.includes('max-width'), addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
});
afterEach(() => {
  vi.unstubAllGlobals();
  cleanup();
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  localStorage.clear();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

const afficher = () => render(<PagePlus ouvrirMonde={vi.fn()} ouvrirPC={vi.fn()} />);

it.each([
  ['Statistiques', 'Statistiques', 'stats'],
  ['Guide du jeu', 'Guide du jeu', 'guide'],
])('ouvre %s en page (pas en fenêtre) sur téléphone et rend le focus à l’entrée', (entree, titre, cle) => {
  const { container } = afficher();
  fireEvent.click(screen.getByRole('button', { name: entree }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: titre }));
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(document.activeElement).toBe(container.querySelector(`[data-entree="${cle}"]`));
});

it('ouvre le Pokédex et les Badges téléphone, depuis le Menu', () => {
  const { container } = afficher();
  fireEvent.click(screen.getByRole('button', { name: /^Pokédex/ }));
  expect(screen.getByRole('searchbox')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  fireEvent.click(screen.getByRole('button', { name: /^Badges/ }));
  expect(screen.getAllByRole('button', { name: /^Badge / })).toHaveLength(8);
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(document.activeElement).toBe(container.querySelector('[data-entree="badges"]'));
});

it('range le Diplôme du Pokédex dans la page Pokédex, plus dans le Menu', () => {
  storeJeu.setState({ fin: { diplome: { nom: 'Nicolas', date: '2026-10-25T00:00:00Z' }, credits: false } });
  afficher();
  expect(screen.queryByRole('button', { name: 'Diplôme du Pokédex' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: /^Pokédex/ }));
  fireEvent.click(screen.getByRole('button', { name: /Diplôme du Pokédex/ }));
  expect(screen.getByRole('dialog', { name: 'Diplôme du Pokédex' })).toBeTruthy();
});
