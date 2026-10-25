// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { ChoixStarter } from './ChoixStarter';

const starters = [
  { numero: 1, nom: 'Bulbizarre', shiny: false },
  { numero: 4, nom: 'Salamèche', shiny: true },
  { numero: 7, nom: 'Carapuce', shiny: false },
];
afterEach(cleanup);

it('présente trois Poké Balls et attend un choix avant de proposer la confirmation', () => {
  const { container } = render(<ChoixStarter starters={starters} choisir={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'CHOISIS TON PARTENAIRE' })).toBeTruthy();
  expect(screen.getAllByRole('button')).toHaveLength(3);
  expect(container.querySelectorAll('img[src="img/objets/poke-ball.png"]')).toHaveLength(3);
  expect(screen.queryByRole('button', { name: /^CHOISIR/ })).toBeNull();
});

it('affiche l’artwork du choix agrandi et laisse les autres balles visibles', () => {
  const { container } = render(<ChoixStarter starters={starters} choisir={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Carapuce' }));
  expect(screen.getByRole('button', { name: 'Carapuce' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Bulbizarre' }).getAttribute('aria-pressed')).toBe('false');
  const artwork = container.querySelector('img[src="img/artworks/7.png"]')!;
  expect(artwork.className).toContain('intro-starter-choisi');
  const balles = Array.from(container.querySelectorAll('img[src="img/objets/poke-ball.png"]'));
  expect(balles.map(balle => balle.className.includes('opacity-0'))).toEqual([false, false, true]);
});

it('confirme avec le nom du Pokémon et transmet son numéro', () => {
  const choisir = vi.fn();
  render(<ChoixStarter starters={starters} choisir={choisir} />);
  fireEvent.click(screen.getByRole('button', { name: 'Bulbizarre' }));
  fireEvent.click(screen.getByRole('button', { name: 'CHOISIR BULBIZARRE' }));
  expect(choisir).toHaveBeenCalledOnce();
  expect(choisir).toHaveBeenCalledWith(1);
  fireEvent.click(screen.getByRole('button', { name: 'Carapuce' }));
  expect(screen.getByRole('button', { name: 'CHOISIR CARAPUCE' }).className).toContain('min-h-11');
});

it('marque le starter chromatique par son artwork chromatique et un anneau doré', () => {
  const { container } = render(<ChoixStarter starters={starters} choisir={vi.fn()} />);
  expect(container.querySelector('img[src="img/artworks/4-shiny.png"]')).toBeTruthy();
  expect(container.querySelector('img[src="img/artworks/4.png"]')).toBeNull();
  expect(screen.getByRole('button', { name: 'Salamèche chromatique' }).innerHTML).toContain('ring-alerte-base');
  expect(screen.getByRole('button', { name: 'Bulbizarre' }).innerHTML).not.toContain('ring-alerte-base');
});
