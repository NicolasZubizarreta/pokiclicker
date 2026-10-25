// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CarteObjet } from './CarteObjet';

afterEach(cleanup);

it('présente la carte B et achète une quantité bornée sans explication de fonds', () => {
  const acheter = vi.fn();
  const props = { id: 'pokeball', nom: 'Pokéball', description: 'Capture un Pokémon.',
    image: 'img/objets/pokeball.png', prix: 1200, stock: 3, possede: false,
    unique: false, abordable: true, acheter };
  const vue = render(<CarteObjet {...props} />);
  expect(screen.getByRole('heading', { name: props.nom })).toBeTruthy();
  expect(screen.getByText(props.description)).toBeTruthy();
  expect(vue.container.querySelector('strong')?.textContent).toBe(`${props.prix.toLocaleString('fr-FR')} pièces`);
  expect(screen.getByText('×3')).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Moins' }) as HTMLButtonElement).disabled).toBe(true);
  for (let i = 0; i < 100; i++) fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  expect((screen.getByRole('button', { name: 'Plus' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Acheter ×99' }));
  expect(acheter).toHaveBeenLastCalledWith(99);
  fireEvent.click(screen.getByRole('button', { name: 'Moins' }));
  fireEvent.click(screen.getByRole('button', { name: 'Acheter ×98' }));
  expect(acheter).toHaveBeenLastCalledWith(98);
  vue.rerender(<CarteObjet {...props} abordable={false} />);
  const achat = screen.getByRole('button', { name: 'Acheter ×98' }) as HTMLButtonElement;
  expect(achat.disabled).toBe(true);
  expect(achat.classList.contains('bg-surface')).toBe(true);
  expect(achat.classList.contains('cadre')).toBe(true);
  expect(vue.container.textContent).not.toMatch(/manque|Prépare ta route/i);
  expect(vue.container.querySelector('.bg-action')).toBeNull();
  vue.rerender(<CarteObjet {...props} unique possede stock={0} />);
  expect(screen.getByText('Possédé')).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByText('×0')).toBeNull();
  vue.rerender(<CarteObjet {...props} unique stock={0} />);
  fireEvent.click(screen.getByRole('button', { name: 'Acheter ×1' }));
  expect(acheter).toHaveBeenLastCalledWith(1);
  expect(screen.queryByRole('button', { name: 'Plus' })).toBeNull();
});
