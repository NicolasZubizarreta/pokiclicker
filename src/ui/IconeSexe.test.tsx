// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { IconeSexe } from './IconeSexe';

afterEach(cleanup);
it.each(['male', 'femelle'] as const)('affiche une icône lisible pour %s', sexe => {
  render(<IconeSexe sexe={sexe} className="size-4" />);
  const svg = screen.getByRole('img', { name: sexe === 'male' ? 'Mâle' : 'Femelle' }).querySelector('svg')!;
  expect(svg.classList.contains('size-4')).toBe(true);
  expect(svg.getAttribute('stroke-width')).toBe('2.6');
  expect(svg.getAttribute('aria-hidden')).toBe('true');
  expect(svg.querySelector('circle')).toBeTruthy();
  expect(svg.querySelector('path')?.getAttribute('d')).toBe(sexe === 'male' ? 'M14 10L21 3M15 3h6v6' : 'M12 14.5V22M8.5 18.5h7');
});
