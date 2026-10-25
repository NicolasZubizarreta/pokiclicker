// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BarreCapture } from './BarreCapture';

afterEach(cleanup);

it('sélectionne une balle possédée et explique les captures indisponibles', () => {
  const balles = [
    { cle: 'pokeball', nom: 'Pokéball', image: 'img/objets/poke-ball.png', quantite: 2 },
    { cle: 'superball', nom: 'Superball', image: 'img/objets/great-ball.png', quantite: 3 },
    { cle: 'hyperball', nom: 'Hyperball', image: 'img/objets/ultra-ball.png', quantite: 0 },
  ];
  const capturer = vi.fn();
  const props = { balles, possible: true, raison: null, enCours: false, capturer };
  const vue = render(<BarreCapture {...props} />);
  expect(screen.getByRole('button', { name: 'Pokéball ×2' }).getAttribute('aria-pressed')).toBe('true');
  expect(vue.container.querySelector('img')?.getAttribute('src')).toBe(balles[0]!.image);
  expect(screen.queryByRole('button', { name: /Hyperball/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Superball ×3' }));
  expect(screen.getByRole('button', { name: 'Pokéball ×2' }).getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByRole('button', { name: 'Superball ×3' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Capturer' }));
  expect(capturer).toHaveBeenCalledExactlyOnceWith('superball');
  vue.rerender(<BarreCapture {...props} balles={[balles[0]!]} />);
  fireEvent.click(screen.getByRole('button', { name: 'Capturer' }));
  expect(capturer).toHaveBeenLastCalledWith('pokeball');
  const raison = 'Ce Pokémon ne peut pas être capturé.';
  vue.rerender(<BarreCapture {...props} possible={false} raison={raison} />);
  const action = screen.getByRole('button', { name: 'Capturer' }) as HTMLButtonElement;
  expect(action.disabled).toBe(true);
  expect(document.getElementById(action.getAttribute('aria-describedby')!)?.textContent).toBe(raison);
  fireEvent.click(action);
  expect(capturer).toHaveBeenCalledTimes(2);
  vue.rerender(<BarreCapture {...props} enCours />);
  expect(action.disabled).toBe(true);
  vue.rerender(<BarreCapture {...props} balles={[]} />);
  expect(action.disabled).toBe(true);
  expect(screen.getByText("Tu n'as aucune balle.")).toBeTruthy();
  expect(vue.container.querySelector('.bg-action')).toBeNull();
});
