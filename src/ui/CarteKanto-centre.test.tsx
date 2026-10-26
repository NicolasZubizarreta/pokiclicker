// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CarteKanto } from './CarteKanto';
import { storeJeu } from './store';
import { reglages } from '../core/reglages';

const raison = 'Bats le boss de Tour Pokémon.';

beforeEach(() => {
  storeJeu.getState().demarrer();
  storeJeu.getState().arreter();
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ centre: { acces: { ouvert: false, raison }, objets: [] },
    carte: { ...carte, formes: carte.formes.map(forme => forme.nom === 'Céladopole'
      ? { ...forme, ouverte: true, actuelle: false } : forme) } });
});

afterEach(() => {
  cleanup();
  storeJeu.getState().arreter();
});

function afficher(ouvert = false, quandCentre = vi.fn()) {
  storeJeu.setState({ centre: { acces: { ouvert, raison: ouvert ? null : raison }, objets: [] } });
  const props = { quandArrive: vi.fn(), quandCentre };
  render(<CarteKanto {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /Céladopole/ }));
  return { bouton: screen.getByRole<HTMLButtonElement>('button', { name: 'Centre commercial' }), quandCentre };
}

it('désactive le Centre fermé et expose la raison comme description accessible', async () => {
  const { bouton, quandCentre } = afficher();
  expect(bouton.disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Centre commercial', description: raison })).toBe(bouton);
  expect(document.getElementById(bouton.getAttribute('aria-describedby')!)?.textContent).toBe(raison);
  await userEvent.click(bouton);
  expect(quandCentre).not.toHaveBeenCalled();
});

it('appelle une seule fois quandCentre par clic lorsque le Centre est ouvert', async () => {
  const { bouton, quandCentre } = afficher(true);
  expect(bouton.disabled).toBe(false);
  expect(bouton.hasAttribute('aria-describedby')).toBe(false);
  await userEvent.click(bouton);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, reglages.interface.vol.poseMs + reglages.interface.vol.volMs + reglages.interface.vol.fermetureMs)); });
  expect(quandCentre).toHaveBeenCalledTimes(1);
  const casino = screen.getByRole<HTMLButtonElement>('button', { name: 'Casino', description: 'Bientôt disponible.' });
  expect(casino.disabled).toBe(true);
  for (const cible of [bouton, casino]) {
    expect(cible.classList.contains('min-h-11')).toBe(true);
    expect(cible.classList.contains('min-w-11')).toBe(true);
  }
});

it.each(['{Enter}', ' '])('active le Centre au clavier avec %s', async touche => {
  const utilisateur = userEvent.setup();
  const { bouton, quandCentre } = afficher(true);
  bouton.focus();
  await utilisateur.tab({ shift: true });
  await utilisateur.tab();
  expect(document.activeElement).toBe(bouton);
  await utilisateur.keyboard(touche);
  await act(async () => { await new Promise(resolve => setTimeout(resolve, reglages.interface.vol.poseMs + reglages.interface.vol.volMs + reglages.interface.vol.fermetureMs)); });
  expect(quandCentre).toHaveBeenCalledTimes(1);
});

it('réagit aux changements d’accès du store', () => {
  const { bouton } = afficher();
  act(() => { storeJeu.setState({ centre: { acces: { ouvert: true, raison: null }, objets: [] } }); });
  expect(bouton.disabled).toBe(false);
  expect(screen.queryByText(raison)).toBeNull();
  act(() => { storeJeu.setState({ centre: { acces: { ouvert: false, raison }, objets: [] } }); });
  expect(bouton.disabled).toBe(true);
  expect(screen.getByRole('button', { name: 'Centre commercial', description: raison })).toBe(bouton);
});

it('garde Bientôt disponible sans callback même lorsque le Centre est ouvert', () => {
  storeJeu.setState({ centre: { acces: { ouvert: true, raison: null }, objets: [] } });
  render(<CarteKanto quandArrive={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: /Céladopole/ }));
  expect(screen.getByRole<HTMLButtonElement>('button', {
    name: 'Centre commercial', description: 'Bientôt disponible.',
  }).disabled).toBe(true);
});
