// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RangEquipe } from './RangEquipe';
import type { CaseEquipe } from './store';
afterEach(cleanup);
const membre: NonNullable<CaseEquipe> = { pokemon: { uid: 'a', numero: 1, niveau: 1, xp: 0, sexe: 'male', shiny: false, favori: false, bonheur: 0, calcium: 0, pierreEternelle: false }, dps: 3, xpMax: 100, multiplicateur: 1 };
it('ouvre la fiche et signale une évolution sans bouton dédié', () => {
  const ouvrir = vi.fn();
  render(<RangEquipe membre={membre} evolution={{ vers: 2, pierre: null }} ouvrirFiche={ouvrir} />);
  const bouton = screen.getByRole('button', { name: 'Ouvrir la fiche de Bulbizarre' });
  fireEvent.click(bouton);
  expect(ouvrir).toHaveBeenCalledWith(bouton);
  expect(bouton.classList.contains('pret-evoluer')).toBe(true);
  expect(screen.getByText('Prêt à évoluer')).toBeTruthy();
  expect(screen.getAllByRole('button')).toHaveLength(1);
});
it('affiche une case libre', () => {
  render(<RangEquipe membre={null} ouvrirFiche={vi.fn()} />);
  expect(screen.getByLabelText('Case libre').textContent).toBe('—');
});
it('affiche la progression de l’œuf sans XP', () => {
  render(<RangEquipe membre={{ ...membre, pokemon: { ...membre.pokemon, oeuf: { pasRestants: 18, pasMax: 25 } } }} ouvrirFiche={vi.fn()} />);
  expect(screen.getByText('Éclosion : 7/25')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
});
