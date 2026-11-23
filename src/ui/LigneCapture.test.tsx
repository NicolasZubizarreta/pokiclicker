// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LigneCapture } from './LigneCapture';

afterEach(cleanup);
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
});

const balles = [
  { cle: 'pokeball', nom: 'Pokéball', image: 'img/objets/poke-ball.png', quantite: 2 },
  { cle: 'superball', nom: 'Superball', image: 'img/objets/great-ball.png', quantite: 3 },
  { cle: 'hyperball', nom: 'Hyperball', image: 'img/objets/ultra-ball.png', quantite: 0 },
];

describe('LigneCapture', () => {
  it('affiche la sélection et parcourt seulement les balles possédées', () => {
    const capturer = vi.fn();
    render(<LigneCapture balles={balles} possible raison={null} enCours={false} capturer={capturer} />);
    expect(screen.getByText('Pokéball')).toBeTruthy();
    expect(screen.getByText('×2')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Pokéball ×2, changer de balle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Superball ×3' }));
    expect(screen.getByText('Superball')).toBeTruthy();
    expect(screen.getByText('×3')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Capturer' }));
    expect(capturer).toHaveBeenCalledWith('superball');
    fireEvent.click(screen.getByRole('button', { name: 'Superball ×3, changer de balle' }));
    expect((screen.getByRole('button', { name: 'Hyperball ×0' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Pokéball ×2' }));
    expect(screen.getByText('Pokéball')).toBeTruthy();
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('désactive les plaques et décrit la raison', () => {
    render(<LigneCapture balles={balles} possible={false} raison="Combat terminé." enCours={false} capturer={vi.fn()} />);
    const action = screen.getByRole('button', { name: 'Capturer' }) as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    expect((screen.getByRole('button', { name: /changer de balle/ }) as HTMLButtonElement).disabled).toBe(true);
    expect(document.getElementById(action.getAttribute('aria-describedby')!)?.textContent).toBe('Combat terminé.');
  });

  it('explique l’absence de balle et désactive la capture', () => {
    render(<LigneCapture balles={[]} possible raison={null} enCours={false} capturer={vi.fn()} />);
    expect(screen.getByText("Tu n'as aucune balle.")).toBeTruthy();
    const action = screen.getByRole('button', { name: 'Capturer' }) as HTMLButtonElement;
    expect(action.disabled).toBe(true);
    expect(document.getElementById(action.getAttribute('aria-describedby')!)?.textContent).toBe("Tu n'as aucune balle.");
  });

  it('place l’outil à droite de Capturer dans la même ligne', () => {
    const { container } = render(<LigneCapture balles={[]} possible raison={null} enCours={false} capturer={vi.fn()}
      outil={<button type="button">Outil</button>} />);
    const ligne = container.querySelector('.ligne-capture')!;
    expect(ligne.classList.contains('ligne-capture-outil')).toBe(true);
    expect(screen.getByRole('button', { name: 'Outil' }).parentElement).toBe(ligne);
    expect(screen.getByRole('button', { name: 'Capturer' }).parentElement).toBe(ligne);
  });
});

describe('balle mémorisée', () => {
  it('affiche la balle mémorisée et la signale au jeu quand on en change', () => {
    const choisir = vi.fn();
    render(<LigneCapture balles={balles} possible raison={null} enCours={false} capturer={vi.fn()} choisie="superball" choisir={choisir} />);
    fireEvent.click(screen.getByRole('button', { name: 'Superball ×3, changer de balle' }));
    fireEvent.click(screen.getByRole('button', { name: 'Pokéball ×2' }));
    expect(choisir).toHaveBeenCalledWith('pokeball');
  });
  it('retombe sur la première balle possédée quand la balle mémorisée n’est plus en stock ou n’existe plus', () => {
    for (const choisie of ['masterball', 'balle-disparue']) {
      const { unmount } = render(<LigneCapture balles={balles} possible raison={null} enCours={false} capturer={vi.fn()} choisie={choisie} />);
      expect(screen.getByRole('button', { name: /Pokéball ×2, changer/ })).toBeTruthy();
      unmount();
    }
  });
});
