// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { FiltreCategories } from './FiltreCategories';

afterEach(cleanup);

it('expose le choix par aria-pressed et transmet la catégorie choisie', () => {
  const categories = [{ cle: 'tout', nom: 'Tout' }, { cle: 'balles', nom: 'Balles' }];
  const choisir = vi.fn();
  const vue = render(<FiltreCategories categories={categories} choix="tout" choisir={choisir} />);
  expect(screen.getByRole('group', { name: 'Catégories' }).classList.contains('overflow-x-auto')).toBe(true);
  for (const { cle, nom } of categories) {
    const bouton = screen.getByRole('button', { name: nom });
    expect(bouton.getAttribute('aria-pressed')).toBe(String(cle === 'tout'));
    expect(bouton.classList.contains('min-h-11')).toBe(true);
    expect(bouton.classList.contains('min-w-11')).toBe(true);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Balles' }));
  expect(choisir).toHaveBeenLastCalledWith('balles');
  vue.rerender(<FiltreCategories categories={categories} choix="balles" choisir={choisir} />);
  expect(screen.getByRole('button', { name: 'Balles' }).getAttribute('aria-pressed')).toBe('true');
  expect(vue.container.querySelector('.bg-action')).toBeNull();
});
