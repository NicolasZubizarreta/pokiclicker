// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, act } from '@testing-library/react';
import { reglages } from '../core/reglages';
import { ZoneLigne } from './ZoneLigne';

afterEach(() => { cleanup(); vi.useRealTimers(); });
it('affiche le nom de la zone', () => {
  render(<ZoneLigne nom="Route 1" etape={1} precedente={null} suivante={null} aller={vi.fn()} />);
  expect(screen.getByText('Route 1').tagName).toBe('STRONG');
});

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

  it('n’affiche pas de bouton sans destination', () => {
    render(<ZoneLigne etape={3} precedente={null} suivante={null} aller={vi.fn()} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('montre des boutons Précédent et Suivant lisibles, sans nom de zone en combat', () => {
    render(<ZoneLigne etape={3} precedente={precedente} suivante={suivante} aller={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Zone précédente : Bois' }).textContent).toBe('Précédent');
    expect(screen.getByRole('button', { name: 'Zone suivante : Mont' }).textContent).toBe('Suivant');
  });

  it('hors zone de combat (Bourg Palette) : seulement Suivant, avec le nom de la zone, sans marques ni 1/10', () => {
    const { container } = render(<ZoneLigne nom="Bourg Palette" etape={null} precedente={null} suivante={{ ...suivante, nom: 'Route 1' }} aller={vi.fn()} />);
    expect(screen.getAllByText('Bourg Palette')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'Zone suivante : Route 1' }).textContent).toBe('Suivant : Route 1');
    expect(screen.queryByRole('button', { name: /précédente/ })).toBeNull();
    expect(container.querySelector('.zone-marques')).toBeNull();
    expect(screen.queryByText(/\/10/)).toBeNull();
  });
});
