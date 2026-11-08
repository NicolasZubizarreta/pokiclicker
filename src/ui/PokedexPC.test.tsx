// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Pokedex } from './Pokedex';
import { storeJeu } from './store';
afterEach(cleanup);
it('recherche par nom et numéro, filtre et ouvre les fiches PC', () => {
  storeJeu.setState({ pokedex: [1] });
  const { container } = render(<Pokedex retour={() => {}} />);
  expect(container.querySelectorAll('.dex-pc')).toHaveLength(1);
  const recherche = screen.getByRole('searchbox');
  fireEvent.change(recherche, { target: { value: 'introuvable' } });
  expect(screen.getByText('Aucune espèce ne correspond.')).toBeTruthy();
  fireEvent.change(recherche, { target: { value: 'bulbizarre' } });
  fireEvent.click(screen.getByRole('button', { name: /Bulbizarre, numéro/ }));
  expect(screen.getByLabelText('Dégâts de base').tagName).toBe('DL');
  fireEvent.click(screen.getByRole('button', { name: 'Revenir aux paliers' }));
  expect(screen.getByRole('heading', { name: 'Paliers' })).toBeTruthy();
  fireEvent.change(recherche, { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: 'À trouver' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pokémon inconnu, numéro 2' }));
  expect(screen.getByText('Capture ce Pokémon pour découvrir son nom, ses types et ses dégâts de base.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Capturés' }));
  expect(screen.getByText('Aucune espèce ne correspond.')).toBeTruthy();
});
