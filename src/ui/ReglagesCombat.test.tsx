// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { ReglagesArret } from '../core/sauvegarde-types';
import { ReglagesCombat } from './ReglagesCombat';

beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) {
      this.removeAttribute('open'); this.dispatchEvent(new Event('close'));
    } },
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('réserve Auto-clic aux Restes et reflète son état par props', () => {
  const props = { autoAttaque: false, arret: { actif: false, commun: false, peuCommun: false,
    rare: false, tresRare: false, legendaire: false, shiny: false, nouveau: false },
    basculer: vi.fn(), regler: vi.fn(), basculerAutoClic: vi.fn() };
  const vue = render(<ReglagesCombat {...props} autoClic={{ possede: false, actif: false }} />);
  const bouton = screen.getByRole('button', { name: 'Auto-clic' }) as HTMLButtonElement;
  expect(bouton.disabled).toBe(true);
  expect(bouton.getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByText("Nécessite l'objet Restes.").id).toBe(bouton.getAttribute('aria-describedby'));
  fireEvent.click(bouton);
  expect(props.basculerAutoClic).not.toHaveBeenCalled();
  vue.rerender(<ReglagesCombat {...props} autoClic={{ possede: true, actif: true }} />);
  expect(bouton.disabled).toBe(false);
  expect(bouton.getAttribute('aria-pressed')).toBe('true');
  expect(bouton.hasAttribute('aria-describedby')).toBe(false);
  expect(screen.queryByText("Nécessite l'objet Restes.")).toBeNull();
  fireEvent.click(bouton);
  expect(props.basculerAutoClic).toHaveBeenCalledOnce();
  expect(vue.container.querySelector('.bg-action')).toBeNull();
});

it("pilote les préférences par props et rend le focus après le dialogue et Échap", () => {
  const arret: ReglagesArret = { actif: true, commun: false, peuCommun: false, rare: true,
    tresRare: true, legendaire: true, shiny: true, nouveau: true };
  const basculer = vi.fn();
  const regler = vi.fn();
  const vue = render(<ReglagesCombat autoAttaque arret={arret} basculer={basculer} regler={regler} />);
  const auto = screen.getByRole('button', { name: 'Auto-attaque' });
  expect(auto.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(auto);
  expect(basculer).toHaveBeenCalledOnce();
  const actif = screen.getByRole('button', { name: 'Arrêt auto' });
  expect(actif.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(actif);
  expect(regler).toHaveBeenLastCalledWith({ actif: false });
  const ouvrir = screen.getByRole('button', { name: "Réglages de l'arrêt" });
  ouvrir.focus();
  fireEvent.click(ouvrir);
  const dialogue = screen.getByRole('dialog', { name: "Réglages de l'arrêt" });
  expect(screen.getAllByRole('checkbox')).toHaveLength(7);
  const options = [['Commun', 'commun'], ['Peu commun', 'peuCommun'], ['Rare', 'rare'],
    ['Très rare', 'tresRare'], ['Légendaire', 'legendaire'], ['Chromatique', 'shiny'],
    ['Nouveau Pokémon', 'nouveau']] as const;
  for (const [nom, cle] of options) {
    const caseACocher = screen.getByRole('checkbox', { name: nom }) as HTMLInputElement;
    expect(caseACocher.checked).toBe(arret[cle]);
    expect(caseACocher.closest('label')?.classList.contains('min-h-11')).toBe(true);
    fireEvent.click(caseACocher);
    expect(regler).toHaveBeenLastCalledWith({ [cle]: !arret[cle] });
  }
  screen.getByRole('checkbox', { name: 'Rare' }).focus();
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  expect(dialogue.hasAttribute('open')).toBe(false);
  expect(document.activeElement).toBe(ouvrir);
  fireEvent.click(ouvrir);
  screen.getByRole('checkbox', { name: 'Commun' }).focus();
  fireEvent(dialogue, new Event('cancel', { cancelable: true }));
  expect(dialogue.hasAttribute('open')).toBe(false);
  expect(document.activeElement).toBe(ouvrir);
  vue.rerender(<ReglagesCombat autoAttaque={false} arret={{ ...arret, actif: false, commun: true }} basculer={basculer} regler={regler} />);
  expect(auto.getAttribute('aria-pressed')).toBe('false');
  expect(actif.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(ouvrir);
  expect((screen.getByRole('checkbox', { name: 'Commun' }) as HTMLInputElement).checked).toBe(true);
  expect(vue.container.querySelector('.bg-action')).toBeNull();
});
