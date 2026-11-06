// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { reglages } from '../core/reglages';
import { ZoneLigne } from './ZoneLigne';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const precedente = { id: 'bois', nom: 'Bois', ouverte: true, raison: null };
const suivante = { id: 'mont', nom: 'Mont', ouverte: true, raison: null };

describe('ZoneLigne', () => {
  it('nomme les destinations, navigue et annonce l’étape', () => {
    const aller = vi.fn();
    render(<ZoneLigne etape={3} precedente={precedente} suivante={suivante} aller={aller} />);
    fireEvent.click(screen.getByRole('button', { name: 'Zone précédente : Bois' }));
    expect(aller).toHaveBeenLastCalledWith('bois');
    fireEvent.click(screen.getByRole('button', { name: 'Zone suivante : Mont' }));
    expect(aller).toHaveBeenLastCalledWith('mont');
    expect(screen.getByText('Étape 3 sur 10')).toBeTruthy();
    expect(screen.getByText('3/10')).toBeTruthy();
  });

  it('explique temporairement une destination verrouillée sans naviguer', () => {
    vi.useFakeTimers();
    const aller = vi.fn();
    render(<ZoneLigne etape={3} precedente={precedente} suivante={{ ...suivante, ouverte: false, raison: 'Battez le boss' }} aller={aller} />);
    const bouton = screen.getByRole('button', { name: 'Zone suivante : Mont' });
    expect(bouton.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(bouton);
    expect(aller).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('Battez le boss');
    act(() => { vi.advanceTimersByTime(reglages.interface.annonceMs); });
    expect(screen.queryByRole('status')).toBeNull();
  });

  it('désactive les boutons sans destination et sans nom de zone', () => {
    const aller = vi.fn();
    render(<ZoneLigne etape={3} precedente={null} suivante={null} aller={aller} />);
    for (const name of ['Zone précédente', 'Zone suivante']) {
      const bouton = screen.getByRole('button', { name });
      expect(bouton.getAttribute('aria-disabled')).toBe('true');
      fireEvent.click(bouton);
    }
    expect(aller).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).toBeNull();
  });
});
