// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { multiplicateurType } from '../core/combat';
import { typesDuJeu } from '../core/table-types';
import { nomType } from '../core/pokemon';
import types from '../../data/types.json';
import { TableTypes } from './TableTypes';

afterEach(cleanup);

it('affiche toutes les paires du cœur dans une table accessible', () => {
  render(<TableTypes telephone={false} />);
  const table = screen.getByRole('table');
  expect(within(table).getAllByRole('columnheader')).toHaveLength(18);
  expect(within(table).getAllByRole('rowheader')).toHaveLength(18);
  const liste = typesDuJeu();
  for (const attaque of liste) {
    const ligne = screen.getByRole('rowheader', { name: nomType(attaque) }).closest('tr')!;
    const cellules = within(ligne).getAllByRole('cell');
    liste.forEach((defense, index) => {
      const valeur = multiplicateurType([attaque], [defense]);
      expect(cellules[index]!.textContent).toBe(`×${new Intl.NumberFormat('fr-FR').format(valeur)}`);
      if (valeur === 1) expect(cellules[index]!.querySelector('.sr-only')?.textContent).toBe('×1');
    });
  }
  const cellule = (attaque: string, defense: string) => within(screen.getByRole('rowheader', { name: nomType(attaque) }).closest('tr')!).getAllByRole('cell')[liste.indexOf(defense)]!;
  expect(cellule('fire', 'grass').textContent).toBe('×2');
  expect(cellule('normal', 'ghost').textContent).toBe('×0');
  expect(cellule('normal', 'water').innerHTML).toBe('<span class="sr-only">×1</span>');
});

it('utilise la matrice fournie en prop', () => {
  const efficacite = { ...types.efficacite, fire: { ...types.efficacite.fire, grass: 0.5 } };
  render(<TableTypes telephone={false} efficacite={efficacite} />);
  const ligne = screen.getByRole('rowheader', { name: 'Feu' }).closest('tr')!;
  expect(within(ligne).getAllByRole('cell')[typesDuJeu().indexOf('grass')]!.textContent).toBe('×0,5');
});

it('propose dix-sept boutons tactiles et un seul panneau ouvert', () => {
  render(<TableTypes telephone />);
  const boutons = screen.getAllByRole('button');
  expect(boutons).toHaveLength(18);
  for (const bouton of boutons) {
    expect(bouton.getAttribute('aria-expanded')).toBe('false');
    expect(bouton.classList.contains('min-h-12')).toBe(true);
  }
  const feu = screen.getByRole('button', { name: 'Feu' });
  fireEvent.click(feu);
  expect(feu.getAttribute('aria-expanded')).toBe('true');
  const panneau = document.getElementById(feu.getAttribute('aria-controls')!)!;
  expect(within(panneau).getByText('Fort contre (×2)').parentElement!.textContent).toContain('Plante');
  fireEvent.click(screen.getByRole('button', { name: 'Eau' }));
  expect(feu.getAttribute('aria-expanded')).toBe('false');
  expect(screen.getByRole('button', { name: 'Eau' }).getAttribute('aria-expanded')).toBe('true');
});
