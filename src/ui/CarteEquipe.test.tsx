// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { PokemonPossede } from '../core/sauvegarde';
import { CarteEquipe } from './CarteEquipe';

const base: PokemonPossede = { uid: 'a', numero: 1, niveau: 1, xp: 0, sexe: 'male', shiny: false,
  favori: false, bonheur: 0, calcium: 0, pierreEternelle: false };

afterEach(cleanup);

it('affiche un chromatique avec son sprite, son halo et son icône près du nom', () => {
  const { container } = render(<CarteEquipe membre={{ pokemon: { ...base, shiny: true }, dps: 3, xpMax: 100, multiplicateur: 1 }} />);
  expect(container.querySelector('img.halo-shiny')?.getAttribute('src')).toBe('img/sprites/pokemon-shiny/1.png');
  expect(container.querySelector('strong svg[aria-hidden="true"]')).toBeTruthy();
});

it('cache l’espèce d’un œuf et montre sa progression', () => {
  const { container } = render(<CarteEquipe membre={{ pokemon: { ...base, oeuf: { pasRestants: 18, pasMax: 25 } },
    dps: 0, xpMax: 100, multiplicateur: 1 }} />);
  expect(screen.getByLabelText('Œuf, Éclosion : 7/25, 0 DPS')).toBeTruthy();
  expect(container.textContent).toContain('Éclosion : 7/25');
  expect(container.textContent).not.toContain('Bulbizarre');
  expect(container.querySelector('img')?.getAttribute('src')).toContain('lucky-egg');
});

it('garde le nom et le niveau d’un Pokémon éclos', () => {
  render(<CarteEquipe membre={{ pokemon: base, dps: 3, xpMax: 100, multiplicateur: 1 }} />);
  expect(screen.getByLabelText(/^Bulbizarre, niveau 1, /)).toBeTruthy();
});

it('n’affiche aucun crayon sans action de renommage', () => {
  render(<CarteEquipe membre={{ pokemon: base, dps: 3, xpMax: 100, multiplicateur: 1 }} />);
  expect(screen.queryByRole('button')).toBeNull();
});

it('propose un crayon « Renommer <nom> » de 44 px qui transmet l’uid et le bouton', () => {
  const renommer = vi.fn();
  render(<CarteEquipe membre={{ pokemon: { ...base, surnom: 'Bourgeon' }, dps: 3, xpMax: 100, multiplicateur: 1 }}
    renommer={renommer} />);
  const crayon = screen.getByRole('button', { name: 'Renommer Bourgeon' });
  expect(crayon.classList.contains('min-h-11')).toBe(true);
  expect(crayon.classList.contains('min-w-11')).toBe(true);
  expect(crayon.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  fireEvent.click(crayon);
  expect(renommer).toHaveBeenCalledWith('a', crayon);
});

it('n’affiche pas de crayon sur un œuf', () => {
  render(<CarteEquipe membre={{ pokemon: { ...base, oeuf: { pasRestants: 18, pasMax: 25 } }, dps: 0, xpMax: 100, multiplicateur: 1 }}
    renommer={vi.fn()} />);
  expect(screen.queryByRole('button')).toBeNull();
});
