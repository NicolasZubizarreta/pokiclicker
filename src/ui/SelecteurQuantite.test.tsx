// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SelecteurQuantite } from './SelecteurQuantite';

afterEach(cleanup);

it('respecte les bornes et transmet les commandes par props', () => {
  const props = { valeur: 1, max: 3, changer: vi.fn(), valider: vi.fn(), annuler: vi.fn() };
  const vue = render(<SelecteurQuantite {...props} />);
  const moins = screen.getByRole('button', { name: 'Moins' }) as HTMLButtonElement;
  const plus = screen.getByRole('button', { name: 'Plus' }) as HTMLButtonElement;
  expect(moins.disabled).toBe(true);
  fireEvent.click(moins);
  expect(props.changer).not.toHaveBeenCalled();
  fireEvent.click(plus);
  expect(props.changer).toHaveBeenLastCalledWith(2);
  vue.rerender(<SelecteurQuantite {...props} valeur={3} />);
  expect(screen.getByText('3')).toBeTruthy();
  expect(plus.disabled).toBe(true);
  fireEvent.click(moins);
  expect(props.changer).toHaveBeenLastCalledWith(2);
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(props.valider).toHaveBeenCalledOnce();
  expect(props.annuler).toHaveBeenCalledOnce();
  expect(vue.container.querySelectorAll('.bg-action')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Valider' }).classList.contains('bg-action')).toBe(true);
  for (const bouton of screen.getAllByRole('button')) {
    expect(bouton.classList.contains('min-h-11')).toBe(true);
    expect(bouton.classList.contains('min-w-11')).toBe(true);
  }
  vue.rerender(<SelecteurQuantite {...props} max={1} />);
  expect(moins.disabled && plus.disabled).toBe(true);
});
