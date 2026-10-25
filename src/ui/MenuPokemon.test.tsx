// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { MenuPokemon } from './MenuPokemon';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Exemple({ resumer = vi.fn() }: { resumer?: () => void }) {
  const [position, placer] = useState<{ x: number; y: number; declencheur: HTMLButtonElement } | null>(null);
  return <>
    <button onContextMenu={event => {
      event.preventDefault();
      placer({ x: event.clientX, y: event.clientY, declencheur: event.currentTarget });
    }}>Pokémon</button>
    <button>À côté</button>
    {position && <MenuPokemon {...position}
      fermer={() => placer(null)} resumer={resumer} />}
  </>;
}

function ouvrir() {
  const carte = screen.getByRole('button', { name: 'Pokémon' });
  expect(fireEvent.contextMenu(carte, { clientX: 100, clientY: 80 })).toBe(false);
  return carte;
}

it('est absent par défaut ; le clic droit ouvre une seule entrée et lui donne le focus', () => {
  render(<Exemple />);
  expect(screen.queryByRole('menu')).toBeNull();
  ouvrir();
  expect(screen.getAllByRole('menuitem')).toHaveLength(1);
  expect(screen.getByRole('menu').getAttribute('aria-label')).toBe('Actions du Pokémon');
  expect(document.activeElement).toBe(screen.getByRole('menuitem', { name: 'Résumé' }));
});

it('Échap ferme le menu et rend le focus à la carte', () => {
  render(<Exemple />);
  const carte = ouvrir();
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(carte);
});

it.each(['mouse', 'touch'])('un pointerdown extérieur (%s) ferme et rend le focus', pointerType => {
  render(<Exemple />);
  const carte = ouvrir();
  fireEvent.pointerDown(screen.getByRole('menuitem'), { pointerType });
  expect(screen.getByRole('menu')).toBeTruthy();
  fireEvent.pointerDown(screen.getByRole('button', { name: 'À côté' }), { pointerType });
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(carte);
});

it.each(['Enter', ' ', 'clic'])('Résumé active le choix avec %s puis ferme', touche => {
  const resumer = vi.fn();
  render(<Exemple resumer={resumer} />);
  const carte = ouvrir();
  const entree = screen.getByRole('menuitem');
  if (touche === 'clic') fireEvent.click(entree);
  else fireEvent.keyDown(entree, { key: touche });
  expect(resumer).toHaveBeenCalledOnce();
  expect(screen.queryByRole('menu')).toBeNull();
  expect(document.activeElement).toBe(carte);
});

it('les flèches bouclent sur la première entrée', () => {
  render(<Exemple />);
  ouvrir();
  const entree = screen.getByRole('menuitem');
  for (const key of ['ArrowDown', 'ArrowUp']) {
    entree.blur();
    expect(fireEvent.keyDown(screen.getByRole('menu'), { key })).toBe(false);
    expect(document.activeElement).toBe(entree);
  }
});

it('reste dans la fenêtre, même aux bords, avec seulement deux variables numériques', () => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({ width: 160, height: 60 } as DOMRect);
  render(<Exemple />);
  const carte = screen.getByRole('button', { name: 'Pokémon' });
  fireEvent.contextMenu(carte, { clientX: window.innerWidth, clientY: window.innerHeight });
  const menu = screen.getByRole('menu');
  expect(menu.style.length).toBe(2);
  expect(menu.style.getPropertyValue('--menu-x')).toBe(String(window.innerWidth - 160));
  expect(menu.style.getPropertyValue('--menu-y')).toBe(String(window.innerHeight - 60));
  fireEvent.contextMenu(carte, { clientX: -10, clientY: -10 });
  expect(menu.style.getPropertyValue('--menu-x')).toBe('0');
  expect(menu.style.getPropertyValue('--menu-y')).toBe('0');
});

it.each(['Enter', ' ', 'clic'])("propose le retrait en deuxième entrée et l'active avec %s", touche => {
  const retirerObjet = vi.fn();
  const resumer = vi.fn();
  const fermer = vi.fn();
  const { rerender } = render(<button>Pokémon</button>);
  const declencheur = screen.getByRole<HTMLButtonElement>('button');
  rerender(<><button>Pokémon</button><MenuPokemon x={0} y={0} declencheur={declencheur}
    fermer={fermer} resumer={resumer} retirerObjet={retirerObjet} /></>);
  const entrees = screen.getAllByRole('menuitem');
  expect(entrees.map(e => e.textContent)).toEqual(['Résumé', "Retirer l'objet"]);
  fireEvent.keyDown(entrees[0]!, { key: 'ArrowUp' });
  expect(document.activeElement).toBe(entrees[1]);
  fireEvent.keyDown(entrees[1]!, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(entrees[0]);
  fireEvent.keyDown(entrees[0]!, { key: 'ArrowDown' });
  expect(document.activeElement).toBe(entrees[1]);
  expect(entrees[1]!.classList.contains('min-h-11')).toBe(true);
  expect(entrees[1]!.classList.contains('min-w-11')).toBe(true);
  expect(screen.getByRole('menu').querySelector('.bg-action')).toBeNull();
  if (touche === 'clic') fireEvent.click(entrees[1]!);
  else fireEvent.keyDown(entrees[1]!, { key: touche });
  expect(retirerObjet).toHaveBeenCalledOnce();
  expect(resumer).not.toHaveBeenCalled();
  expect(fermer).toHaveBeenCalledOnce();
  expect(document.activeElement).toBe(declencheur);
});
