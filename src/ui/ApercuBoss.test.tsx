// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { ContenuBoss } from './ApercuBoss';
afterEach(cleanup);
it.each([
  [10, false, 'trop lent pour les 30 s du chrono.'],
  [10, true, 'dans les temps.'],
  [0, false, "Ton équipe n'inflige aucun dégât."],
] as const)('explique l’estimation %s %s', (dps, assezRapide, phrase) => {
  render(<ContenuBoss boss={{ numero: 1, niveau: 5, pvMax: 410, types: ['grass'], chronoMs: 30000, dps, secondesPourVaincre: dps ? 41 : null, assezRapide }} />);
  expect(screen.getByText((texte) => texte.includes(phrase))).toBeTruthy();
  expect(screen.getByText('Estimation sans tes clics.')).toBeTruthy();
});
