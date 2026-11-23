// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CarteObjet } from './CarteObjet';

afterEach(cleanup);

it.each([false, true])('affiche total, manque exact et inflation (compact : %s)', compact => {
  const acheter = vi.fn();
  const props = { id: 'pokeball', nom: 'Pokéball', description: 'Capture.', image: null,
    prix: 280, prixBase: 200, inflationParBadge: 0.2, stock: 0, possede: false,
    unique: false, abordable: true, argent: 560, acheter, compact };
  const vue = render(<CarteObjet {...props} />);
  expect(screen.getByText(/Prix de base 200.*₽ · \+20 % par badge/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '+ : augmenter' }));
  fireEvent.click(screen.getByRole('button', { name: /^Acheter ×2 : 560\s₽$/ }));
  expect(acheter).toHaveBeenCalledWith(2);
  vue.rerender(<CarteObjet {...props} argent={500} />);
  const bouton = screen.getByRole<HTMLButtonElement>('button', { name: /^Il te manque 60\s₽$/ });
  expect(bouton.disabled).toBe(true);
  fireEvent.click(bouton);
  expect(acheter).toHaveBeenCalledTimes(1);
  vue.rerender(<CarteObjet {...props} unique argent={0} inflationParBadge={0} />);
  expect(screen.getByText(/sans inflation par badge/)).toBeTruthy();
  expect(screen.getByRole<HTMLButtonElement>('button', { name: /^Il te manque 280\s₽$/ }).disabled).toBe(true);
});

it('Max prend le plus grand achat que l’argent permet, au moins 1', () => {
  const props = { id: 'pokeball', nom: 'Pokéball', description: 'Capture un Pokémon.', image: null, prix: 1200, stock: 0,
    possede: false, unique: false, abordable: true, acheter: vi.fn() };
  const vue = render(<CarteObjet {...props} argent={5000} />);
  fireEvent.click(screen.getByRole('button', { name: 'Max : maximum possible' }));
  expect(screen.getByLabelText('Quantité').textContent).toBe('4');
  expect(screen.getByLabelText('Total').textContent).toBe('= 4 800 ₽');
  fireEvent.click(screen.getByRole('button', { name: '+10 : ajouter dix' }));
  vue.rerender(<CarteObjet {...props} argent={100} />);
  fireEvent.click(screen.getByRole('button', { name: 'Max : maximum possible' }));
  expect(screen.getByLabelText('Quantité').textContent).toBe('1');
  vue.rerender(<CarteObjet {...props} argent={10_000_000} />);
  fireEvent.click(screen.getByRole('button', { name: 'Max : maximum possible' }));
  expect(screen.getByLabelText('Quantité').textContent).toBe('99');
});

it('présente la carte B et achète une quantité bornée sans explication de fonds', () => {
  const acheter = vi.fn();
  const props = { id: 'pokeball', nom: 'Pokéball', description: 'Capture un Pokémon.',
    image: 'img/objets/pokeball.png', prix: 1200, stock: 3, possede: false,
    unique: false, abordable: true, argent: 1000000, acheter };
  const vue = render(<CarteObjet {...props} />);
  expect(screen.getByRole('heading', { name: props.nom })).toBeTruthy();
  expect(screen.getByText(props.description)).toBeTruthy();
  expect(vue.container.querySelector('strong')?.textContent).toBe(`${props.prix.toLocaleString('fr-FR')}\u00a0₽`);
  expect(screen.getByText('×3')).toBeTruthy();
  // « Moins » à 1 passe à 99 ; « Plus » à 99 revient à 1.
  const quantite = () => screen.getByLabelText('Quantité').textContent;
  fireEvent.click(screen.getByRole('button', { name: '− : diminuer' }));
  expect(quantite()).toBe('99');
  fireEvent.click(screen.getByRole('button', { name: '+ : augmenter' }));
  expect(quantite()).toBe('1');
  fireEvent.click(screen.getByRole('button', { name: '+10 : ajouter dix' }));
  expect(quantite()).toBe('11');
  for (let i = 0; i < 20; i++) fireEvent.click(screen.getByRole('button', { name: '+10 : ajouter dix' }));
  expect(quantite()).toBe('99');
  fireEvent.click(screen.getByRole('button', { name: /^Acheter ×99 :/ }));
  expect(acheter).toHaveBeenLastCalledWith(99);
  fireEvent.click(screen.getByRole('button', { name: '− : diminuer' }));
  fireEvent.click(screen.getByRole('button', { name: /^Acheter ×98 :/ }));
  expect(acheter).toHaveBeenLastCalledWith(98);
  vue.rerender(<CarteObjet {...props} abordable={false} />);
  const achat = screen.getByRole('button', { name: /^Acheter ×98 :/ }) as HTMLButtonElement;
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
  fireEvent.click(screen.getByRole('button', { name: /^Acheter ×1 :/ }));
  expect(acheter).toHaveBeenLastCalledWith(1);
  expect(screen.queryByRole('button', { name: '+ : augmenter' })).toBeNull();
});
