// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { reglages } from '../core/reglages';
import { ActionsCombat } from './ActionsCombat';

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) {
      this.removeAttribute('open'); this.dispatchEvent(new Event('close'));
    } },
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function propsDepart() {
  return {
    autoAttaque: true, basculerAutoAttaque: vi.fn(),
    arret: { ...reglages.depart.preferences.arretAuto, actif: true, rare: true }, reglerArret: vi.fn(),
    lienAutoClic: { lie: true, regler: vi.fn() },
    sac: { accessible: true, total: 3, ouvrir: vi.fn() as (() => void) | null },
  };
}

it('affiche les quatre plaques, leurs états et transmet les actions et réglages', () => {
  const props = propsDepart();
  render(<ActionsCombat {...props} />);
  const attaque = screen.getByRole('button', { name: 'Attaque auto' });
  const arret = screen.getByRole('button', { name: 'Arrêt auto' });
  const reglage = screen.getByRole('button', { name: "Réglage de l'arrêt auto" });
  const sac = screen.getByRole('button', { name: 'Sac' });
  expect(attaque.getAttribute('aria-pressed')).toBe('true');
  expect(arret.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(attaque); fireEvent.click(arret); fireEvent.click(sac);
  expect(props.basculerAutoAttaque).toHaveBeenCalledOnce();
  expect(props.reglerArret).toHaveBeenCalledWith({ actif: false });
  expect(props.sac.ouvrir).toHaveBeenCalledOnce();
  expect(sac.querySelector('.pastille-sac')?.textContent).toBe('3');
  expect(screen.queryByRole('button', { name: /Fauchage|Poké-Radar/ })).toBeNull();
  reglage.focus(); fireEvent.click(reglage);
  expect(screen.getByRole('dialog').hasAttribute('open')).toBe(true);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Rare' }));
  expect(props.reglerArret).toHaveBeenCalledWith({ rare: false });
  const lie = screen.getByRole('checkbox', { name: "Auto-clic lié à l'attaque auto" }) as HTMLInputElement;
  expect(lie.checked).toBe(true);
  fireEvent.click(lie);
  expect(props.lienAutoClic.regler).toHaveBeenCalledWith(false);
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  expect(document.activeElement).toBe(reglage);
});

it('désactive le sac sans ouverture ou sans accès et masque le total nul', () => {
  const props = propsDepart();
  props.sac.total = 0; props.sac.ouvrir = null;
  const { rerender } = render(<ActionsCombat {...props} />);
  const sac = screen.getByRole('button', { name: 'Sac' });
  expect(sac.getAttribute('aria-disabled')).toBe('true');
  expect(sac.querySelector('.pastille-sac')).toBeNull();
  fireEvent.click(sac);
  props.sac.ouvrir = vi.fn(); props.sac.accessible = false;
  rerender(<ActionsCombat {...props} />);
  expect(sac.getAttribute('aria-disabled')).toBe('true');
  fireEvent.click(sac); expect(props.sac.ouvrir).not.toHaveBeenCalled();
});

it('ne porte plus ni Fauchage ni Poké-Radar : ils ont quitté cette ligne', () => {
  const { container } = render(<ActionsCombat {...propsDepart()} />);
  expect(container.querySelector('.actions-debloques')).toBeNull();
  expect(screen.queryByRole('button', { name: /Fauchage|Poké-Radar/ })).toBeNull();
});
