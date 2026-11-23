// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Mannequin } from './Mannequin';
afterEach(cleanup);
it('désactive l’outil hors combat avec une raison', () => {
  render(<Mannequin />);
  expect((screen.getByRole('button', { name: 'Mannequin' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText('Disponible pendant un combat.')).toBeTruthy();
});
