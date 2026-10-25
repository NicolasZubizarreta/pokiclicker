// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { PastillesEffets } from './PastillesEffets';

afterEach(cleanup);

it('affiche les effets dans leur ordre sans annonce en direct', () => {
  const { container, rerender } = render(<PastillesEffets effets={[
    { id: 'xAttack', pastille: 'Attaque + ×1,5', restantS: 12 },
    { id: 'repel', pastille: 'Repousse', restantS: 1 },
  ]} />);
  const liste = screen.getByRole('list', { name: 'Effets actifs' });
  expect(liste.tagName).toBe('UL');
  expect(liste.hasAttribute('aria-live')).toBe(false);
  expect(within(liste).getAllByRole('listitem').map(e => e.textContent))
    .toEqual(['Attaque + ×1,5 : 12 s', 'Repousse : 1 s']);
  expect(container.querySelector('.bg-action')).toBeNull();
  rerender(<PastillesEffets effets={[]} />);
  expect(screen.queryAllByRole('listitem')).toHaveLength(0);
});
