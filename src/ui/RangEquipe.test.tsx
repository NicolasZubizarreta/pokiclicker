// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { RangEquipe } from './RangEquipe';
import type { CaseEquipe } from './store';
afterEach(cleanup);
const membre: NonNullable<CaseEquipe> = { pokemon: { uid: 'a', numero: 1, niveau: 1, xp: 0, sexe: 'male', shiny: false, favori: false, bonheur: 0, calcium: 0, pierreEternelle: false }, dps: 3, xpMax: 100, multiplicateur: 1 };
it.each([false, true])('repère accessible seulement sur une carte marquée : %s', marqueEclosion => {
  render(<RangEquipe membre={{ ...membre, pokemon: { ...membre.pokemon, marqueEclosion } }} ouvrirFiche={vi.fn()} />);
  expect(!!screen.queryByRole('img', { name: "Marque d'éclosion" })).toBe(marqueEclosion);
});
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
  expect(screen.getByText('7/25')).toBeTruthy();
  expect(screen.queryByRole('progressbar')).toBeNull();
});
it('pose un seul tag combiné (œuf avec étoile) à droite du nom, et rien sur le sprite', () => {
  const { container } = render(<RangEquipe membre={{ ...membre, pokemon: { ...membre.pokemon, shiny: true, marqueEclosion: true } }} ouvrirFiche={vi.fn()} />);
  expect(container.querySelectorAll('svg')).toHaveLength(1);
  const nom = container.querySelector('strong')!;
  expect(nom.querySelectorAll('.repere-tags > *')).toHaveLength(1);
  expect(nom.querySelector('.repere-tags')!.lastElementChild!.classList.contains('repere-marque-shiny')).toBe(true);
  expect(container.querySelectorAll('.repere-marque')).toHaveLength(1);
});
it('n’écrit plus « XP max » à un niveau 100', () => {
  render(<RangEquipe membre={{ ...membre, pokemon: { ...membre.pokemon, niveau: 100 }, xpMax: 0 }} ouvrirFiche={vi.fn()} />);
  expect(screen.queryByText(/XP max/)).toBeNull();
  expect(screen.getByText('Niv. 100')).toBeTruthy();
});
