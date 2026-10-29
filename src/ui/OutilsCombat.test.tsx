// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { OutilsCombat } from './OutilsCombat';

afterEach(cleanup);
const disponible = { possede: true, disponible: true, raison: null, rechargeS: 0, actif: false };

it.each([
  [{ ...disponible, possede: false, disponible: false, raison: 'Nécessite la CT Fauchage.' }, 'Nécessite la CT Fauchage.'],
  [{ ...disponible, disponible: false, raison: 'Inutile sur un boss !' }, 'Inutile sur un boss !'],
  [{ ...disponible, disponible: false, rechargeS: 12 }, 'Recharge : 12 s'],
])('désactive Fauchage avec une explication visible (%j)', (fauchage, raison) => {
  const faucher = vi.fn();
  render(<OutilsCombat fauchage={fauchage} faucher={faucher} />);
  expect(screen.queryByRole('button', { name: 'Poké-Radar' })).toBeNull();
  if (!fauchage.possede) {
    expect(screen.queryByRole('button', { name: 'Fauchage' })).toBeNull();
    expect(faucher).not.toHaveBeenCalled();
    return;
  }
  const bouton = screen.getByRole('button', { name: 'Fauchage' }) as HTMLButtonElement;
  expect(bouton.getAttribute('aria-disabled')).toBe('true');
  expect(screen.getByText(raison).id).toBe(bouton.getAttribute('aria-describedby'));
  fireEvent.click(bouton);
  expect(faucher).not.toHaveBeenCalled();
});

it('transmet Fauchage, avec une cible de 44 px sans bg-action', () => {
  const faucher = vi.fn();
  const { container } = render(<OutilsCombat fauchage={{ ...disponible, actif: true }}
    faucher={faucher} />);
  const boutons = screen.getAllByRole('button');
  expect(boutons[0]!.getAttribute('aria-pressed')).toBe('true');
  for (const bouton of boutons) {
    expect(bouton.classList.contains('min-h-11')).toBe(true);
    expect(bouton.classList.contains('min-w-11')).toBe(true);
    fireEvent.click(bouton);
  }
  expect(faucher).toHaveBeenCalledOnce();
  expect(boutons).toHaveLength(1);
  expect(container.querySelector('.bg-action')).toBeNull();
});
