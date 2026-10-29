// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { PokemonPossede } from '../core/sauvegarde';
import { CarteEquipe } from './CarteEquipe';
import { evolutionDisponible, evolutionParPierre } from '../core/evolution';
import { pierreProposee } from './evolution-proposee';

const base: PokemonPossede = { uid: 'a', numero: 1, niveau: 1, xp: 0, sexe: 'male', shiny: false,
  favori: false, bonheur: 0, calcium: 0, pierreEternelle: false };

afterEach(cleanup);

it('affiche un chromatique avec son sprite, son halo et son icône près du nom', () => {
  const { container } = render(<CarteEquipe membre={{ pokemon: { ...base, shiny: true }, dps: 3, xpMax: 100, multiplicateur: 1 }} />);
  expect(container.querySelector('img.halo-shiny')?.getAttribute('src')).toBe('img/sprites/pokemon-shiny/1.png');
  expect(container.querySelector('strong svg[aria-hidden="true"]')).toBeTruthy();
});

it('cache l’espèce d’un œuf et montre sa progression', () => {
  const { container } = render(<CarteEquipe membre={{ pokemon: { ...base, oeuf: { pasRestants: 18, pasMax: 25 } },
    dps: 0, xpMax: 100, multiplicateur: 1 }} />);
  expect(screen.getByLabelText('Œuf, Éclosion : 7/25, 0 DPS')).toBeTruthy();
  expect(container.textContent).toContain('Éclosion : 7/25');
  expect(container.textContent).not.toContain('Bulbizarre');
  expect(container.querySelector('img')?.getAttribute('src')).toContain('lucky-egg');
});

it('garde le nom et le niveau d’un Pokémon éclos', () => {
  render(<CarteEquipe membre={{ pokemon: base, dps: 3, xpMax: 100, multiplicateur: 1 }} />);
  expect(screen.getByLabelText(/^Bulbizarre, niveau 1, /)).toBeTruthy();
});

it('n’affiche aucun crayon sans action de renommage', () => {
  render(<CarteEquipe membre={{ pokemon: base, dps: 3, xpMax: 100, multiplicateur: 1 }} />);
  expect(screen.queryByRole('button')).toBeNull();
});

it('propose un crayon « Renommer <nom> » de 44 px qui transmet l’uid et le bouton', () => {
  const renommer = vi.fn();
  render(<CarteEquipe membre={{ pokemon: { ...base, surnom: 'Bourgeon' }, dps: 3, xpMax: 100, multiplicateur: 1 }}
    renommer={renommer} />);
  const crayon = screen.getByRole('button', { name: 'Renommer Bourgeon' });
  expect(crayon.classList.contains('min-h-11')).toBe(true);
  expect(crayon.classList.contains('min-w-11')).toBe(true);
  expect(crayon.querySelector('svg[aria-hidden="true"]')).toBeTruthy();
  fireEvent.click(crayon);
  expect(renommer).toHaveBeenCalledWith('a', crayon);
});

it('n’affiche pas de crayon sur un œuf', () => {
  render(<CarteEquipe membre={{ pokemon: { ...base, oeuf: { pasRestants: 18, pasMax: 25 } }, dps: 0, xpMax: 100, multiplicateur: 1 }}
    renommer={vi.fn()} />);
  expect(screen.queryByRole('button')).toBeNull();
});

it('propose un aperçu accessible, un contour d’alerte et transmet le bouton au clic', () => {
  const evoluer = vi.fn();
  const { container } = render(<CarteEquipe membre={{ pokemon: base, dps: 3, xpMax: 100, multiplicateur: 1 }}
    evolution={{ vers: 2, pierre: null }} evoluer={evoluer} />);
  const bouton = screen.getByRole('button', { name: 'Faire évoluer Bulbizarre en Herbizarre' });
  expect(bouton.classList.contains('min-h-11')).toBe(true);
  expect(container.firstElementChild?.classList.contains('cadre-alerte')).toBe(true);
  expect(bouton.querySelector('img')?.getAttribute('src')).toBe('img/sprites/pokemon/2.png');
  expect(container.firstElementChild?.contains(screen.getByRole('progressbar', { name: 'XP de Bulbizarre' }))).toBe(true);
  fireEvent.click(bouton);
  expect(evoluer).toHaveBeenCalledWith(bouton);
});

it('laisse la carte sans bouton ni contour d’alerte en l’absence d’évolution', () => {
  const { container } = render(<CarteEquipe membre={{ pokemon: base, dps: 3, xpMax: 100, multiplicateur: 1 }} evolution={null} />);
  expect(screen.queryByRole('button')).toBeNull();
  expect(container.querySelector('.cadre-alerte')).toBeNull();
});

it('nomme et affiche la pierre de l’évolution proposée', () => {
  render(<CarteEquipe membre={{ pokemon: { ...base, numero: 133 }, dps: 3, xpMax: 100, multiplicateur: 1 }}
    evolution={{ vers: 134, pierre: { id: 'waterStone', nom: 'Pierre Eau', image: 'img/objets/water-stone.png' } }} />);
  const bouton = screen.getByRole('button', { name: 'Faire évoluer Évoli en Aquali avec la Pierre Eau' });
  expect(bouton.querySelectorAll('img')).toHaveLength(2);
});

it('ne propose pas de bouton pour une pierre absente du Sac ou une Pierre Stase équipée', () => {
  const pokemon = { ...base, numero: 133 };
  expect(pierreProposee(pokemon, [])).toBeNull();
  expect(evolutionDisponible({ ...base, niveau: 100, pierreEternelle: true })).toBeNull();
  render(<CarteEquipe membre={{ pokemon, dps: 3, xpMax: 100, multiplicateur: 1 }}
    evolution={null} />);
  expect(screen.queryByRole('button')).toBeNull();
});

it('propose uniquement la première pierre compatible en stock et respecte la Stase', () => {
  const entree = (id: string, quantite: number) => ({ id, nom: id, image: id, quantite, actif: false,
    utilisable: 'pierre' as const });
  const entrees = [entree('fireStone', 0), entree('waterStone', 1), entree('thunderStone', 1)] as Parameters<typeof pierreProposee>[1];
  const pokemon = { ...base, numero: 133 };
  expect(evolutionParPierre(pokemon.numero, 'waterStone')).toBe(134);
  expect(pierreProposee(pokemon, entrees)?.id).toBe('waterStone');
  expect(pierreProposee({ ...pokemon, pierreEternelle: true }, entrees)).toBeNull();
  expect(pierreProposee({ ...pokemon, oeuf: { pasRestants: 1, pasMax: 1 } }, entrees)).toBeNull();
});

it('affiche SpriteEvolution pendant l’animation', () => {
  const { container } = render(<CarteEquipe membre={{ pokemon: { ...base, numero: 2 }, dps: 3, xpMax: 100, multiplicateur: 1 }}
    animation={{ uid: base.uid, ancien: 1, nouveau: 2 }} />);
  expect(container.querySelector('img[src="img/sprites/pokemon/1.png"]')).toBeTruthy();
  expect(container.querySelector('img[src="img/sprites/pokemon/2.png"]')).toBeTruthy();
});
