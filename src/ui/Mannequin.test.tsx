// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { Mannequin } from './Mannequin';
afterEach(cleanup);
it('reste fermé tant que le Menu ne l’ouvre pas, avec son titre et son bouton de lancement', () => {
  render(<Mannequin ouvert={false} quandFerme={() => undefined} />);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(screen.getByText("Mannequin d'entraînement")).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Lancer', hidden: true })).toBeTruthy();
});
