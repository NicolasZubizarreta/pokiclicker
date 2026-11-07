// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BoutonFauchage } from './BoutonFauchage';

afterEach(cleanup);

const etat = { disponible: true, raison: null as string | null, rechargeS: 0, actif: false };

it('fauche au clic, et montre l’état actif par l’attribut aria-pressed', () => {
  const faucher = vi.fn();
  const { rerender } = render(<BoutonFauchage fauchage={etat} faucher={faucher} />);
  const bouton = screen.getByRole('button', { name: 'Fauchage' });
  expect(bouton.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(bouton);
  expect(faucher).toHaveBeenCalledOnce();
  rerender(<BoutonFauchage fauchage={{ ...etat, actif: true }} faucher={faucher} />);
  expect(bouton.getAttribute('aria-pressed')).toBe('true');
});

it('indique la recharge et le refus sans déclencher le fauchage', () => {
  const faucher = vi.fn();
  render(<BoutonFauchage fauchage={{ ...etat, disponible: false, rechargeS: 12, raison: 'En recharge' }} faucher={faucher} />);
  const bouton = screen.getByRole('button', { name: 'Fauchage' });
  expect(screen.getByText('Recharge : 12 s')).toBeTruthy();
  expect(bouton.getAttribute('aria-disabled')).toBe('true');
  expect(bouton.title).toBe('En recharge');
  fireEvent.click(bouton);
  expect(faucher).not.toHaveBeenCalled();
});
