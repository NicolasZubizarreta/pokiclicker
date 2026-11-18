// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SelecteurQuantite } from './SelecteurQuantite';

afterEach(cleanup);

it('boucle − et +, propose +10 et Max, puis Utiliser et Annuler', () => {
  const props = { valeur: 1, max: 7, changer: vi.fn(), valider: vi.fn(), annuler: vi.fn() };
  const vue = render(<SelecteurQuantite {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Moins' }));
  expect(props.changer).toHaveBeenLastCalledWith(7);
  fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  expect(props.changer).toHaveBeenLastCalledWith(2);
  fireEvent.click(screen.getByRole('button', { name: 'Plus dix' }));
  expect(props.changer).toHaveBeenLastCalledWith(7);
  fireEvent.click(screen.getByRole('button', { name: 'Maximum possible' }));
  expect(props.changer).toHaveBeenLastCalledWith(7);
  vue.rerender(<SelecteurQuantite {...props} valeur={7} />);
  expect(screen.getByLabelText('Quantité', { selector: 'output' }).textContent).toBe('7');
  fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  expect(props.changer).toHaveBeenLastCalledWith(1);
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(props.valider).toHaveBeenCalledOnce();
  expect(props.annuler).toHaveBeenCalledOnce();
  expect(vue.container.querySelectorAll('.bg-action')).toHaveLength(1);
});

it('plafonne à 99 même avec un gros stock', () => {
  const changer = vi.fn();
  render(<SelecteurQuantite valeur={1} max={281} changer={changer} valider={vi.fn()} annuler={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Maximum possible' }));
  expect(changer).toHaveBeenLastCalledWith(99);
});