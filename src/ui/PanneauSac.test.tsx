// @vitest-environment jsdom
import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PanneauSac } from './PanneauSac';
import type { AffichageSac } from './store-boutique';

vi.mock('./Sac', () => ({
  Sac: ({ sac, utiliser }: { sac: AffichageSac; utiliser(entree: AffichageSac['entrees'][number], bouton: HTMLButtonElement): void }) =>
    <>{sac.entrees.map(entree => <button key={entree.id} onClick={event => utiliser(entree, event.currentTarget)}>{entree.nom}</button>)}</>,
}));

const types = ['direct', 'pierre', 'bonbon', 'calcium', 'stase', 'jeton'] as const;
const sac: AffichageSac = { acces: { ouvert: true, raison: null }, entrees: types.map(type => ({
  id: type, nom: type, description: '', image: null, categorie: 'equipement',
  quantite: 1, actif: false, utilisable: type,
})) };
const utiliserObjetActif = vi.fn<(id: string) => string | null>();
const modalInitial = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
const closeInitial = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
const showModal = vi.fn(function (this: HTMLDialogElement) {
  this.setAttribute('open', '');
  this.querySelector('button')?.focus();
});

beforeEach(() => {
  utiliserObjetActif.mockReset().mockReturnValue(null);
  showModal.mockClear();
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: showModal },
    close: { configurable: true, value(this: HTMLDialogElement) {
      this.removeAttribute('open'); this.dispatchEvent(new Event('close'));
    } },
  });
});
afterEach(() => {
  cleanup();
  if (modalInitial) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', modalInitial);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (closeInitial) Object.defineProperty(HTMLDialogElement.prototype, 'close', closeInitial);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

function Exemple() {
  const [declencheur, ouvrir] = useState<HTMLButtonElement | null>(null);
  return <><button onClick={event => ouvrir(event.currentTarget)}>Sac</button>
    {declencheur && <PanneauSac sac={sac} utiliserObjetActif={utiliserObjetActif}
      fermer={() => ouvrir(null)} declencheur={declencheur} />}</>;
}
function preparer() {
  render(<Exemple />);
  const bouton = screen.getByRole('button', { name: 'Sac' });
  bouton.focus();
  fireEvent.click(bouton);
  return bouton;
}

it('ouvre une modale, ferme par le bouton et Échap et rend le focus au déclencheur', () => {
  const bouton = preparer();
  expect(showModal).toHaveBeenCalledOnce();
  expect(screen.getByRole('dialog', { name: 'Ton Sac' })).toBeTruthy();
  const fermer = screen.getByRole('button', { name: 'Fermer' });
  expect(fermer.classList.contains('min-h-11')).toBe(true);
  expect(document.activeElement).toBe(fermer);
  fireEvent.click(fermer);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(bouton);
  fireEvent.click(bouton);
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(bouton);
});

it.each(types.filter(type => type !== 'direct'))('annonce la cible pour %s sans utiliser un objet', type => {
  preparer();
  fireEvent.click(screen.getByRole('button', { name: type }));
  expect(screen.getByRole('status').textContent).toBe(type === 'pierre'
    ? 'Touche la carte du Pokémon' : 'Choisis le Pokémon dans Équipe');
  expect(utiliserObjetActif).not.toHaveBeenCalled();
});

it('utilise un objet direct comme la page Sac et annonce le résultat du store', () => {
  preparer();
  utiliserObjetActif.mockReturnValueOnce('Boss non vaincu !');
  fireEvent.click(screen.getByRole('button', { name: 'direct' }));
  expect(utiliserObjetActif).toHaveBeenCalledExactlyOnceWith('direct');
  expect(screen.getByRole('status').textContent).toBe('Boss non vaincu !');
  fireEvent.click(screen.getByRole('button', { name: 'direct' }));
  expect(screen.getByRole('status').textContent).toBe('');
});
