// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BoiteBadges } from './BoiteBadges';

afterEach(cleanup);

const badges = ['roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan', 'terre'].map((id, i) => ({
  id, nom: i === 0 ? 'Roche' : id, description: 'Dégâts Clic +50%',
  image: `img/badges/${id}.png`, arene: "Arène d'Argenta", obtenu: i === 0,
}));

it('dispose huit disques accessibles dans quatre colonnes sans cadre', () => {
  const { container } = render(<BoiteBadges badges={badges} />);
  const boutons = screen.getAllByRole('button');
  expect(boutons).toHaveLength(8);
  expect(boutons[0]!.parentElement?.classList.contains('grid-cols-4')).toBe(true);
  expect(boutons[0]!.parentElement?.classList.contains('overflow-visible')).toBe(true);
  for (const bouton of boutons) {
    expect(bouton.classList.contains('min-h-11')).toBe(true);
    expect(bouton.classList.contains('min-w-11')).toBe(true);
    expect(bouton.classList.contains('rounded-plein')).toBe(true);
    expect(bouton.classList.contains('cadre')).toBe(false);
  }
  expect(boutons[0]!.classList.contains('badge-obtenu')).toBe(true);
  const vide = screen.getByRole('button', { name: "Badge cascade, à gagner : Arène d'Argenta" });
  expect(vide.classList.contains('badge-vide')).toBe(true);
  const silhouette = vide.querySelector('img')!;
  for (const classe of ['brightness-0', 'invert', 'opacity-30']) expect(silhouette.classList.contains(classe)).toBe(true);
  const image = boutons[0]!.querySelector('img')!;
  expect(image.getAttribute('src')).toBe('img/badges/roche.png');
  expect(image.getAttribute('width')).toBe('96');
  expect(image.getAttribute('height')).toBe('96');
  expect(image.classList.contains('image-rendering-pixelated')).toBe(false);
  expect(image.classList.contains('brightness-0')).toBe(false);
  expect(container.querySelector('.bg-action')).toBeNull();
});

it('garde la même région status et décrit au survol comme au focus', () => {
  render(<BoiteBadges badges={badges} />);
  const statut = screen.getByRole('status');
  expect(statut.textContent).toBe('Survole ou touche un badge pour voir son effet.');
  const bouton = screen.getAllByRole('button')[0]!;
  fireEvent.mouseEnter(bouton);
  expect(statut.textContent).toBe('Roche : Dégâts Clic +50%');
  fireEvent.mouseLeave(bouton);
  expect(statut.textContent).toBe('Survole ou touche un badge pour voir son effet.');
  fireEvent.focus(bouton);
  expect(statut.textContent).toBe('Roche : Dégâts Clic +50%');
  fireEvent.mouseEnter(bouton);
  fireEvent.mouseLeave(bouton);
  expect(statut.textContent).toBe('Roche : Dégâts Clic +50%');
  fireEvent.blur(bouton);
  expect(statut.textContent).toBe('Survole ou touche un badge pour voir son effet.');
  expect(screen.getByRole('status')).toBe(statut);
});

it('annonce une boîte vide et utilise une icône masquée aux lecteurs si image absente', () => {
  render(<BoiteBadges badges={badges.map(b => ({ ...b, obtenu: false, image: null }))} />);
  expect(screen.getByRole('status').textContent).toBe("Aucun badge obtenu. Bats les champions d'arène !");
  const bouton = screen.getByRole('button', { name: "Badge Roche, à gagner : Arène d'Argenta" });
  expect(bouton.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  expect(within(bouton).queryByRole('img')).toBeNull();
  fireEvent.focus(bouton);
  expect(screen.getByRole('status').textContent).toBe('Roche : Dégâts Clic +50%');
});

it('cache seulement le badge désigné puis le fait claquer sans rognage', () => {
  const { rerender } = render(<BoiteBadges badges={badges} cache="roche" />);
  const boutons = screen.getAllByRole('button');
  expect(boutons[0]!.classList.contains('opacity-0')).toBe(true);
  expect(boutons[1]!.classList.contains('opacity-0')).toBe(false);
  rerender(<BoiteBadges badges={badges} claque="roche" />);
  expect(boutons[0]!.classList.contains('opacity-0')).toBe(false);
  expect(boutons[0]!.classList.contains('badge-slam')).toBe(true);
  expect(boutons[0]!.classList.contains('overflow-visible')).toBe(true);
  expect(boutons[1]!.classList.contains('badge-slam')).toBe(false);
  rerender(<BoiteBadges badges={badges} />);
  expect(boutons[0]!.classList.contains('badge-slam')).toBe(false);
});
