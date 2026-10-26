// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PageCentre, PageCarte } from './PageCentre';
import { storeJeu } from './store';
import { reglages } from '../core/reglages';

afterEach(() => { cleanup(); storeJeu.getState().arreter(); vi.restoreAllMocks(); vi.useRealTimers(); });

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
  expect(screen.getAllByRole('status')).toHaveLength(1);
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
  const quantite = screen.getByRole('spinbutton', { name: 'Quantité' });
  for (const valeur of ['0', '100', '1.5', '']) {
    fireEvent.change(quantite, { target: { value: valeur } });
    expect(screen.getByRole<HTMLButtonElement>('button', { name: /^Acheter/ }).disabled).toBe(true);
    expect(screen.getByText('Choisis une quantité de 1 à 99.')).toBeTruthy();
  }
  fireEvent.change(quantite, { target: { value: '3' } });
  expect(screen.getByRole<HTMLButtonElement>('button', { name: /^Acheter/, description: "Pas assez d'argent." }).disabled).toBe(true);
  fireEvent.change(quantite, { target: { value: '2' } });
  fireEvent.click(screen.getByRole('button', { name: /^Acheter/ }));
  expect(acheter).toHaveBeenCalledExactlyOnceWith('xAttack', 2);
  expect(screen.getByRole('status').textContent).toBe('Acheté.');
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

it('ouvre après le vol sans changer la zone, puis rend le focus au Centre', () => {
  preparer();
  storeJeu.setState({ annonce: 'Combat en cours.' });
  vi.useFakeTimers();
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers');
  const arrive = vi.fn();
  render(<PageCarte quandArrive={arrive} />);
  fireEvent.click(screen.getByRole('button', { name: /Céladopole/ }));
  const bouton = screen.getByRole('button', { name: 'Centre commercial' });
  fireEvent.click(bouton);
  expect(screen.getAllByRole('status')).toHaveLength(1);
  expect(screen.queryByRole('heading', { name: 'Centre commercial' })).toBeNull();
  const vol = reglages.interface.vol;
  act(() => vi.advanceTimersByTime(vol.poseMs + vol.volMs + vol.fermetureMs));
  expect(screen.getByRole('heading', { name: 'Centre commercial' })).toBe(document.activeElement);
  expect(screen.getAllByRole('status')).toHaveLength(1);
  expect(aller).not.toHaveBeenCalled();
  expect(arrive).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Retour à la carte' }));
  expect(document.activeElement).toBe(bouton);
});
