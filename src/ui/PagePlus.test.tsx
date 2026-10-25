// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { chargerPokemon } from '../core/pokemon';
import { PagePlus } from './PagePlus';
import { creerStoreJeu, storeJeu } from './store';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));
vi.mock('./store', async original => ({
  ...await original<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

function nouvellePartie() {
  contexte.store = creerStoreJeu({
    horloge: { maintenant: () => 0 },
    stockage: {
      lire: cle => localStorage.getItem(cle),
      ecrire: (cle, valeur) => localStorage.setItem(cle, valeur),
      supprimer: cle => localStorage.removeItem(cle),
      cles: () => Object.keys(localStorage),
    },
    alea: () => 0.5,
    genererId: () => 'test-plus',
  });
  storeJeu.getState().demarrer();
}

beforeEach(() => { localStorage.clear(); nouvellePartie(); });
afterEach(() => {
  cleanup();
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  localStorage.clear();
});

it('présente seulement les deux entrées françaises, le compteur et le verrou visible lié au PC', () => {
  const { container } = render(<PagePlus />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Plus');
  const liste = screen.getByRole('list');
  expect(within(liste).getAllByRole('listitem')).toHaveLength(2);
  expect(within(liste).getAllByRole('button').map(b => b.textContent)).toEqual(['PC de Léo', 'Pokédex 3 / 151']);
  const pc = screen.getByRole('button', { name: 'PC de Léo' }) as HTMLButtonElement;
  expect(pc.disabled).toBe(true);
  const raison = screen.getByText("Le PC de Léo s'ouvre à l'Arène d'Argenta.");
  expect(raison.hidden).toBe(false);
  expect(document.getElementById(pc.getAttribute('aria-describedby')!)).toBe(raison);
  fireEvent.click(pc);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Plus');
  expect(container.textContent).toBe("PlusPC de LéoLe PC de Léo s'ouvre à l'Arène d'Argenta.Pokédex 3 / 151");
  expect(container.querySelector('[class~="bg-action"]')).toBeNull();
});

it('ouvre le PC après les boss de la Route 1 et de la Forêt de Jade et gère le focus aller-retour', () => {
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  const cle = Object.keys(localStorage).find(cle => cle.startsWith('pokiclicker:region:') && cle.endsWith(':kanto'))!;
  const sauvegarde = JSON.parse(localStorage.getItem(cle)!);
  sauvegarde.donnees.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
  localStorage.setItem(cle, JSON.stringify(sauvegarde));
  nouvellePartie();
  render(<PagePlus />);
  const pc = screen.getByRole('button', { name: 'PC de Léo' }) as HTMLButtonElement;
  expect(pc.disabled).toBe(false);
  expect(pc.hasAttribute('aria-describedby')).toBe(false);
  fireEvent.click(pc);
  const titre = screen.getByRole('heading', { level: 1, name: 'PC de Léo' });
  expect(document.activeElement).toBe(titre);
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'PC de Léo' }));
  expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull();
});

it('ouvre le Pokédex des trois starters avec ses textes français et rend le focus à l’entrée d’origine', () => {
  const { container } = render(<PagePlus />);
  fireEvent.click(screen.getByRole('button', { name: 'Pokédex 3 / 151' }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Pokédex' }));
  expect(screen.getByText('3 / 151')).toBeTruthy();
  const catalogue = chargerPokemon();
  const cases = catalogue.liste.map(p => `N° ${p.numero}${[1, 4, 7].includes(p.numero) ? p.nom : '???'}`).join('');
  expect(container.textContent).toBe(`RetourPokédex3 / 151${cases}`);
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Pokédex/ }));
  expect(screen.getByRole('button', { name: 'Pokédex 3 / 151' })).toBeTruthy();
});
