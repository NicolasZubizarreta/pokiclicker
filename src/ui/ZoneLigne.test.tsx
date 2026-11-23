// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ZoneLigne } from './ZoneLigne';

afterEach(cleanup);

it.each(['Obtiens le badge Marais.', null])('explique une destination fermée sans attendre un clic : %s', raison => {
  render(<ZoneLigne etape={10} precedente={null} suivante={{ id: 'suite', nom: 'Route 2', ouverte: false, raison }} aller={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Suivant : Route 2' }).getAttribute('aria-disabled')).toBe('true');
  expect(screen.getByText(raison ?? 'Bats le boss pour avancer.')).toBeTruthy();
});
