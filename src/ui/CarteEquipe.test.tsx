// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import type { PokemonPossede } from '../core/sauvegarde';
import { CarteEquipe } from './CarteEquipe';

const base: PokemonPossede = { uid: 'a', numero: 1, niveau: 1, xp: 0, sexe: 'male', shiny: false,
  favori: false, bonheur: 0, calcium: 0, pierreEternelle: false };

afterEach(cleanup);

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
