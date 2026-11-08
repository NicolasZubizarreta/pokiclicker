// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Pokedex } from './Pokedex';
import { storeJeu } from './store';
afterEach(cleanup);

it('recherche un vu, le garde à trouver et masque ses types et dégâts dans la fiche', () => {
  storeJeu.setState({ pokedex: [1], vus: [1, 4] });
  const { container } = render(<Pokedex retour={() => {}} />);
  const recherche = screen.getByRole('searchbox');
  fireEvent.change(recherche, { target: { value: 'Salamèche' } });
  fireEvent.click(screen.getByRole('button', { name: 'À trouver' }));
  fireEvent.click(screen.getByRole('button', { name: 'Salamèche, numéro 4, vu, pas encore capturé' }));
  expect(screen.getByRole('heading', { name: 'Salamèche · N° 4' })).toBeTruthy();
  expect(screen.getByText('Vu, pas encore capturé')).toBeTruthy();
  expect(screen.getByText('Capture ce Pokémon pour découvrir ses types et ses dégâts de base.')).toBeTruthy();
  expect(container.querySelector('.dex-panneau .pastille-type')).toBeNull();
  expect(container.querySelector('.dex-sprite img')!.classList.contains('grayscale')).toBe(true);
  expect(screen.queryByLabelText('Dégâts de base')).toBeNull();
  fireEvent.change(recherche, { target: { value: 'Herbizarre' } });
  expect(screen.getByText('Aucune espèce capturée ou vue ne correspond à « Herbizarre ».')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /numéro/ })).toBeNull();
});
it('recherche par nom et numéro, filtre et ouvre les fiches PC', () => {
  storeJeu.setState({ pokedex: [1], vus: [1] });
  const { container } = render(<Pokedex retour={() => {}} />);
  expect(container.querySelectorAll('.dex-pc')).toHaveLength(1);
  const recherche = screen.getByRole('searchbox');
  fireEvent.change(recherche, { target: { value: 'introuvable' } });
  expect(screen.getByText('Aucune espèce capturée ou vue ne correspond à « introuvable ».')).toBeTruthy();
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
  expect(screen.getByText('Aucune espèce capturée ou vue ne correspond à « 2 ».')).toBeTruthy();
});
