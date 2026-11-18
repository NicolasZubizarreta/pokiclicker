// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Pokedex } from './Pokedex';
import { PokedexTelephone } from './PokedexTelephone';
import { storeJeu } from './store';

vi.mock('./store', async original => {
  const module = await original<typeof import('./store')>();
  const { createStore } = await import('zustand/vanilla');
  return { ...module, storeJeu: createStore(() => module.storeJeu.getState()) };
});
beforeEach(() => storeJeu.setState({ pokedex: [1, 4], vus: [7], especesShiny: [1],
  pension: { ...storeJeu.getState().pension, especesEcloses: [1, 4], especesEclosesShiny: [1] } }));
afterEach(cleanup);

it.each([Pokedex, PokedexTelephone])('partage les dex, les filtres et les repères sans changer les paliers (%#)', Page => {
  const { container } = render(<Page retour={() => {}} />);
  const prochain = container.querySelector('[data-prochain-palier]')!.textContent;
  const progression = screen.getByRole('progressbar').outerHTML;
  const paliers = container.querySelector('dl, details ul')!.textContent;
  const boutons = within(screen.getByRole('group', { name: 'Choisir le dex' }));
  expect(boutons.getAllByRole('button')).toHaveLength(4);
  for (const nom of ['Pokédex 2 / 151', 'Shiny 1 / 151', 'Œuf 2 / 151', 'Œuf shiny 1 / 151']) {
    expect(boutons.getByRole('button', { name: nom })).toBeTruthy();
  }
  const caseInitiale = screen.getByRole('button', { name: 'Bulbizarre, numéro 1, déjà capturé, chromatique, éclos' });
  expect(within(caseInitiale).getAllByRole('img', { name: "Chromatique, marque d'éclosion" })).toHaveLength(1);
  fireEvent.change(screen.getByLabelText('Afficher'), { target: { value: 'manquants' } });
  expect(screen.queryByRole('button', { name: /Bulbizarre, numéro/ })).toBeNull();
  fireEvent.click(boutons.getByRole('button', { name: 'Shiny 1 / 151' }));
  expect((screen.getByLabelText('Afficher') as HTMLSelectElement).value).toBe('tous');
  expect(boutons.getAllByRole('button', { pressed: true })).toHaveLength(1);
  expect(screen.queryByRole('img', { name: /Chromatique|marque d'éclosion/i })).toBeNull();
  expect(screen.getByAltText('Bulbizarre').getAttribute('src')).toContain('pokemon-shiny');
  expect(screen.getByAltText('Salamèche').classList.contains('grayscale')).toBe(true);
  expect(screen.getByRole('button', { name: 'Pokémon inconnu, numéro 2' })).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Afficher'), { target: { value: 'obtenus' } });
  expect(screen.queryByAltText('Salamèche')).toBeNull();
  expect(screen.getByAltText('Bulbizarre')).toBeTruthy();
  for (const nom of ['Œuf 2 / 151', 'Œuf shiny 1 / 151']) {
    fireEvent.click(boutons.getByRole('button', { name: nom }));
    expect(screen.queryByRole('img', { name: /marque d'éclosion/i })).toBeNull();
    expect(screen.getByAltText('Bulbizarre').getAttribute('src')!.includes('pokemon-shiny')).toBe(nom.startsWith('Œuf shiny'));
  }
  expect(screen.getByRole('progressbar').outerHTML).toBe(progression);
  expect(container.querySelector('dl, details ul')!.textContent).toBe(paliers);
  expect(container.querySelector('[data-prochain-palier]')!.textContent).toBe(prochain);
});
