// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PageCentre, PageCarte } from './PageCentre';
import { storeJeu } from './store';
import { reglages } from '../core/reglages';

const affichage = vi.hoisted(() => ({ telephone: true }));
vi.mock('./useTelephone', () => ({ useTelephone: () => affichage.telephone }));
afterEach(() => { cleanup(); affichage.telephone = true; storeJeu.getState().arreter(); vi.restoreAllMocks(); vi.useRealTimers();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

it('affiche sur PC la grille, le décor et le bloc d’achat commun', () => {
  affichage.telephone = false;
  preparer();
  const acheter = vi.spyOn(storeJeu.getState(), 'acheter').mockReturnValue('Acheté.');
  const retour = vi.fn();
  const { container } = render(<PageCentre retour={retour} />);
  expect(container.querySelectorAll('.commercial-pc')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Centre commercial' })).toBeTruthy();
  expect(screen.getByText(/^15\s000\s₽$/)).toBeTruthy();
  expect(container.querySelectorAll('.commercial-grille button[data-objet]')).toHaveLength(reglages.centre.objets.length);
  expect(container.querySelector('.produit')).toBeNull();
  expect(container.querySelector('img[src="img/decors/centre-commercial.webp"]')).toBeTruthy();
  expect(screen.getByText('Ton achat')).toBeTruthy();
  const carte = container.querySelector('[data-objet="calcium"]')!;
  fireEvent.click(carte);
  expect(carte.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('heading', { name: 'calcium' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  expect(screen.getByLabelText('Total').textContent).toMatch(/^= 15\s000\s₽$/);
  fireEvent.click(screen.getByRole('button', { name: /^Acheter ×2/ }));
  expect(acheter).toHaveBeenCalledExactlyOnceWith('calcium', 2);
  fireEvent.click(screen.getByRole('button', { name: 'Retour à la carte' }));
  expect(retour).toHaveBeenCalledOnce();
});

function preparer() {
  storeJeu.getState().demarrer();
  storeJeu.getState().arreter();
  const objets = reglages.centre.objets.map(id => ({ id, nom: id, description: `Description ${id}`, image: null,
    categorie: 'equipement' as const, prix: 7500, stock: 0, possede: false, unique: false, abordable: true }));
  storeJeu.setState({ centre: { acces: { ouvert: true, raison: null }, objets }, argent: 15000, annonce: null });
}

it('affiche le catalogue dans l’ordre, le décor, la sélection et un seul statut', () => {
  preparer();
  const { container } = render(<PageCentre retour={vi.fn()} />);
  expect([...container.querySelectorAll('[data-objet]')].map(e => e.getAttribute('data-objet'))).toEqual(reglages.centre.objets);
  expect(container.querySelector('img[src="img/decors/centre-commercial.webp"]')).toBeTruthy();
  // L'annonce d'achat passe par le calque de notifications : aucune zone de statut dans la page.
  expect(screen.queryAllByRole('status').filter(e => e.tagName !== 'OUTPUT')).toHaveLength(0);
  fireEvent.click(container.querySelector('[data-objet="calcium"]')!);
  expect(screen.getByRole('heading', { name: 'calcium' })).toBeTruthy();
  expect(screen.getByText('Description calcium')).toBeTruthy();
});

it('borne la quantité et expose le refus puis transmet l’achat et son annonce', () => {
  preparer();
  const acheter = vi.spyOn(storeJeu.getState(), 'acheter').mockImplementation(() => {
    storeJeu.setState({ annonce: 'Acheté.' });
    return 'Acheté.';
  });
  render(<PageCentre retour={vi.fn()} />);
  const plus = screen.getByRole<HTMLButtonElement>('button', { name: 'Plus' });
  const moins = screen.getByRole<HTMLButtonElement>('button', { name: 'Moins' });
  // La quantité reste entre 1 et le maximum : « Moins » est bloqué à 1, « Plus » au maximum.
  expect(moins.disabled).toBe(true);
  for (let i = 0; i < reglages.boutique.quantiteMax + 5; i++) fireEvent.click(plus);
  expect(screen.getByLabelText('Quantité').textContent).toBe(String(reglages.boutique.quantiteMax));
  expect(plus.disabled).toBe(true);
  for (let i = 0; i < reglages.boutique.quantiteMax + 5; i++) fireEvent.click(moins);
  expect(screen.getByLabelText('Quantité').textContent).toBe('1');
  fireEvent.click(plus);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: /^Acheter ×2/ }).disabled).toBe(false);
  fireEvent.click(plus);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: /^Acheter/, description: "Pas assez d'argent." }).disabled).toBe(true);
  fireEvent.click(moins);
  fireEvent.click(screen.getByRole('button', { name: /^Acheter/ }));
  expect(acheter).toHaveBeenCalledExactlyOnceWith('xAttack', 2);
  expect(screen.queryByText('Acheté.')).toBeNull();
});

it('affiche la raison de fermeture et permet le retour', () => {
  preparer();
  storeJeu.setState({ centre: { acces: { ouvert: false, raison: 'Bats le boss de Tour Pokémon.' }, objets: [] } });
  const retour = vi.fn();
  render(<PageCentre retour={retour} />);
  expect(screen.getByText('Bats le boss de Tour Pokémon.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Acheter/ })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retour à la carte' }));
  expect(retour).toHaveBeenCalledTimes(1);
});

it('ouvre après le vol sans changer la zone, puis rend le focus à la carte', () => {
  HTMLDialogElement.prototype.showModal = function () { this.open = true; };
  HTMLDialogElement.prototype.close = function () { this.open = false; };
  affichage.telephone = false;
  preparer();
  storeJeu.setState({ annonce: 'Combat en cours.' });
  vi.useFakeTimers();
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  const arrive = vi.fn();
  render(<PageCarte quandArrive={arrive} />);
  fireEvent.click(screen.getAllByRole('button', { name: /Céladopole/ }).find(b => b.hasAttribute('data-zone'))!);
  const bouton = screen.getByRole('button', { name: 'Centre commercial' });
  fireEvent.click(bouton);
  expect(screen.getAllByRole('status').filter(e => e.tagName !== 'OUTPUT')).toHaveLength(1);
  expect(screen.queryByRole('heading', { name: 'Centre commercial' })).toBeNull();
  const vol = reglages.interface.vol;
  act(() => vi.advanceTimersByTime(vol.poseMs + vol.volMs + vol.fermetureMs));
  expect(screen.getByRole('heading', { name: 'Centre commercial' })).toBe(document.activeElement);
  expect(screen.queryAllByRole('status').filter(e => e.tagName !== 'OUTPUT')).toHaveLength(0);
  expect(aller).not.toHaveBeenCalled();
  expect(arrive).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Retour à la carte' }));
  expect(screen.queryByRole('button', { name: 'Centre commercial' })).toBeNull();
  expect(bouton.closest('dialog')?.open).toBe(false);
  expect((document.activeElement as HTMLElement).closest('[data-zone][role="button"]')).not.toBeNull();
});
