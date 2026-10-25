// @vitest-environment jsdom
import { Profiler } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Pokedex } from './Pokedex';
import { cheminSprite } from './precharger';
import { storeJeu } from './store';
import { afficherProgression } from './store-progression';

vi.mock('./store', async original => {
  const module = await original<typeof import('./store')>();
  const { createStore } = await import('zustand/vanilla');
  return { ...module, storeJeu: createStore(() => module.storeJeu.getState()) };
});

beforeEach(() => { storeJeu.setState({ pokedex: [1, 25, 25, 200] }); });
afterEach(cleanup);

it('présente les 151 espèces dans l’ordre national et compte les captures de Kanto sans doublons', () => {
  render(<Pokedex retour={() => {}} />);
  // Isole la liste historique des espèces ; les paliers ont leur propre test.
  screen.queryByRole('list', { name: 'Paliers du Pokédex' })?.remove();
  expect(screen.getByRole('heading', { level: 1, name: 'Pokédex' }).tabIndex).toBe(-1);
  expect(screen.getByText('2 / 151')).toBeTruthy();
  const liste = screen.getByRole('list');
  expect(liste.tagName).toBe('OL');
  const entrees = within(liste).getAllByRole('listitem');
  expect(entrees).toHaveLength(151);
  expect(liste.classList.contains('grid-cols-3')).toBe(true);
  expect(liste.classList.contains('lg:grid-cols-10')).toBe(true);
  entrees.forEach((entree, index) => {
    expect(within(entree).getByText(`N° ${index + 1}`)).toBeTruthy();
    const image = within(entree).getByRole('img');
    expect(image.getAttribute('src')).toBe(cheminSprite(index + 1));
    const capture = index === 0 || index === 24;
    expect(image.classList.contains('brightness-0')).toBe(!capture);
    expect(image.getAttribute('alt')).toBe(capture ? (index === 0 ? 'Bulbizarre' : 'Pikachu') : 'Pokémon inconnu');
  });
  expect(within(entrees[0]!).getByText('Bulbizarre')).toBeTruthy();
  expect(within(entrees[24]!).getByText('Pikachu')).toBeTruthy();
  expect(within(liste).getAllByText('???')).toHaveLength(149);
  expect(within(liste).getAllByAltText('Pokémon inconnu')).toHaveLength(149);
  expect(liste.textContent).toBe(entrees.map((_, index) =>
    `N° ${index + 1}${index === 0 ? 'Bulbizarre' : index === 24 ? 'Pikachu' : '???'}`).join(''));
});

it('présente les dix paliers automatiques et le prochain objectif accessible', () => {
  const pokedex = Array.from({ length: 24 }, (_, i) => i + 1);
  const progression = afficherProgression({ badges: [], jalonsRecus: [10, 20] }, pokedex);
  storeJeu.setState({ pokedex, progression });
  const { container } = render(<Pokedex retour={() => {}} />);
  expect(screen.getByText('24 / 151')).toBeTruthy();
  expect(screen.getByText('Prochain palier : 30 (Collectionneur) · Encore 6 espèces.')).toBeTruthy();
  const liste = screen.getByRole('list', { name: 'Paliers du Pokédex' });
  expect(liste.tagName).toBe('UL');
  const entrees = within(liste).getAllByRole('listitem');
  expect(entrees).toHaveLength(10);
  progression.paliers.forEach((palier, index) => {
    expect(entrees[index]!.textContent).toContain(`${palier.palier} — ${palier.titre} — ${palier.description}`);
    expect(within(entrees[index]!).getByText(palier.recu ? 'reçu' : 'à venir')).toBeTruthy();
    expect(entrees[index]!.querySelector('[aria-hidden="true"]')).toBeTruthy();
  });
  expect(screen.queryByRole('button', { name: /Réclame/ })).toBeNull();
  expect(container.querySelector('[class~="bg-action"]')).toBeNull();
  act(() => { storeJeu.setState({ progression: { ...progression, prochain: null } }); });
  expect(screen.getByText('Pokédex complet !')).toBeTruthy();
});

it('appelle Retour', () => {
  const retour = vi.fn();
  render(<Pokedex retour={retour} />);
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(retour).toHaveBeenCalledOnce();
});

it('ne se re-rend pas au tick ni quand le reste du store change', () => {
  const rendus = vi.fn();
  const pokedex = storeJeu.getState().pokedex;
  render(<Profiler id="pokedex" onRender={rendus}><Pokedex retour={() => {}} /></Profiler>);
  const nombre = rendus.mock.calls.length;
  act(() => { storeJeu.getState().tick(); });
  act(() => { storeJeu.setState({ dps: storeJeu.getState().dps + 1 }); });
  expect(storeJeu.getState().pokedex).toBe(pokedex);
  expect(rendus).toHaveBeenCalledTimes(nombre);
  act(() => { storeJeu.setState({ pokedex: [...pokedex, 4] }); });
  expect(screen.getByText('3 / 151')).toBeTruthy();
  expect(screen.getByText('Salamèche')).toBeTruthy();
  expect(rendus.mock.calls.length).toBeGreaterThan(nombre);
});
