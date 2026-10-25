import { useEffect, useLayoutEffect, useRef } from 'react';
import type { CSSProperties } from 'react';

export function MenuPokemon({ x, y, declencheur, fermer, resumer }: {
  x: number;
  y: number;
  declencheur: HTMLButtonElement;
  fermer: () => void;
  resumer: () => void;
}) {
  const menu = useRef<HTMLDivElement>(null);
  const entree = useRef<HTMLButtonElement>(null);
  const position = { '--menu-x': x, '--menu-y': y } as CSSProperties;

  function clore() {
    declencheur.focus({ preventScroll: true });
    fermer();
  }

  function activer() {
    clore();
    resumer();
  }

  useLayoutEffect(() => {
    function placer() {
      const element = menu.current;
      if (!element) return;
      const { width, height } = element.getBoundingClientRect();
      element.style.setProperty('--menu-x', String(Math.max(0, Math.min(x, window.innerWidth - width))));
      element.style.setProperty('--menu-y', String(Math.max(0, Math.min(y, window.innerHeight - height))));
    }
    placer();
    entree.current?.focus({ preventScroll: true });
    window.addEventListener('resize', placer);
    return () => window.removeEventListener('resize', placer);
  }, [x, y]);

  useEffect(() => {
    function dehors(event: PointerEvent) {
      if (event.target instanceof Node && !menu.current?.contains(event.target)) {
        declencheur.focus({ preventScroll: true });
        fermer();
      }
    }
    document.addEventListener('pointerdown', dehors);
    return () => document.removeEventListener('pointerdown', dehors);
  }, [declencheur, fermer]);

  return <div ref={menu} role="menu" aria-label="Actions du Pokémon" style={position}
    className="menu-pokemon cadre fixed left-0 top-0 z-50 max-h-dvh max-w-full overflow-auto bg-surface p-2 text-base"
    onKeyDown={event => {
      if (event.key === 'Escape' || event.key === 'Tab') {
        event.preventDefault();
        clore();
      } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        entree.current?.focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        activer();
      }
    }}>
    <button ref={entree} type="button" role="menuitem" tabIndex={-1}
      className="min-h-11 min-w-11 w-full px-4 py-2 text-left hover:bg-selection focus:bg-selection"
      onClick={activer}>Résumé</button>
  </div>;
}
