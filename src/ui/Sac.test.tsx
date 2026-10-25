// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Sac } from './Sac';
import type { AffichageSac } from './store-boutique';

const sac: AffichageSac = { acces: { ouvert: true, raison: null }, entrees: [
  { id: 'pokeball', nom: 'Pokéball', description: 'Capture un Pokémon.', image: 'img/objets/pokeball.png',
    categorie: 'balles', quantite: 0, actif: false, utilisable: null },
  { id: 'candy', nom: 'Bonbon', description: 'Ajoute un niveau.', image: 'img/objets/candy.png',
    categorie: 'soins', quantite: 2, actif: false, utilisable: 'bonbon' },
  { id: 'shoes', nom: 'Chaussures', description: 'Réduit l’attente.', image: null,
    categorie: 'equipement', quantite: 1, actif: true, utilisable: null },
] };
afterEach(cleanup);

it('ne présente que la raison quand le Sac est verrouillé', () => {
  render(<Sac sac={{ ...sac, acces: { ouvert: false, raison: "Le Sac s’ouvre à la Route 1." } }} utiliser={vi.fn()} />);
  expect(screen.getByText('Le Sac s’ouvre à la Route 1.')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByRole('list')).toBeNull();
});

it('présente une grille compacte, les stocks, les icônes locales et le repli SVG', () => {
  const { container } = render(<Sac sac={sac} utiliser={vi.fn()} />);
  expect(screen.getAllByRole('listitem')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Pokéball ×0' }).className).toContain('size-16');
  expect(Array.from(container.querySelectorAll('img')).every(img => img.getAttribute('src')?.startsWith('img/'))).toBe(true);
  expect(container.querySelectorAll('img')).toHaveLength(2);
  expect(screen.getByRole('img', { name: 'Chaussures' }).tagName).toBe('svg');
  expect(screen.getByText('Actif')).toBeTruthy();
  expect(container.querySelectorAll('.bg-action')).toHaveLength(0);
});

it('filtre les catégories et affiche le détail avec Utiliser pour les consommables disponibles', () => {
  const utiliser = vi.fn();
  render(<Sac sac={sac} utiliser={utiliser} />);
  fireEvent.click(screen.getByRole('button', { name: 'Soins' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Bonbon ×2' }));
  expect(screen.getByText('Ajoute un niveau.')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
  expect(utiliser).toHaveBeenCalledWith(sac.entrees[1]);
  fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
  fireEvent.click(screen.getByRole('button', { name: 'Pokéball ×0' }));
  expect(screen.getByText('Capture un Pokémon.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Utiliser' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Équipement' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Balles' }));
  expect(screen.getAllByRole('listitem')).toHaveLength(1);
});

it('désactive Utiliser sans stock', () => {
  render(<Sac sac={{ ...sac, entrees: [{ ...sac.entrees[1]!, quantite: 0 }] }} utiliser={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Bonbon ×0' }));
  expect((screen.getByRole('button', { name: 'Utiliser' }) as HTMLButtonElement).disabled).toBe(true);
});
