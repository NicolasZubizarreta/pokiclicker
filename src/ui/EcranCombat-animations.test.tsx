// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { ECLAT, SECOUSSE } from './animations';
import { DegatsFlottants } from './DegatsFlottants';
import { EcranCombat } from './EcranCombat';
import { creerStoreJeu } from './store';
import type { Degat, StoreJeu } from './store';

const animer = vi.fn();
let store: StoreJeu;

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animer });
  Object.defineProperty(SVGElement.prototype, 'animate', { configurable: true, value: animer });
  window.matchMedia = vi.fn(() => ({ matches: false })) as unknown as typeof window.matchMedia;
  animer.mockClear();
});
afterEach(cleanup);

function preparer() {
  const horloge = creerHorlogeSimulee();
  const stockage = creerStockageMemoire();
  const compte = compteInitial();
  creerGestionnaire({ stockage, horloge, genererId: () => 'test' }).ecrireCompte({ ...compte,
    preferences: { ...compte.preferences, arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
  store = creerStoreJeu({ horloge, stockage, alea: () => .1, genererId: () => 'test' });
  store.getState().demarrer();
  render(<EcranCombat store={store} />);
}

it('lance la secousse et l’éclat quand le toucher porte, jamais sinon', () => {
  preparer();
  const attaquer = vi.fn(() => true);
  act(() => store.setState({ attaquer }));
  const cible = screen.getByRole('button', { name: /^Attaquer / });
  fireEvent.pointerDown(cible, { button: 0 });
  expect(animer).toHaveBeenCalledWith(SECOUSSE.keyframes, SECOUSSE.options);
  expect(animer).toHaveBeenCalledWith(ECLAT.keyframes, ECLAT.options);
  animer.mockClear();
  attaquer.mockReturnValue(false);
  fireEvent.pointerDown(cible, { button: 0 });
  expect(animer).not.toHaveBeenCalled();
});

it('ne lance aucune animation sous mouvement réduit', () => {
  preparer();
  window.matchMedia = vi.fn(() => ({ matches: true })) as unknown as typeof window.matchMedia;
  act(() => store.setState({ attaquer: () => true }));
  fireEvent.pointerDown(screen.getByRole('button', { name: /^Attaquer / }), { button: 0 });
  expect(animer).not.toHaveBeenCalled();
});

it('affiche la bannière d’arrêt automatique sans doubler l’annonce lue', () => {
  preparer();
  act(() => store.setState({ banniere: 'Shiny apparu ! Auto stoppé !' }));
  const banniere = screen.getByText('Shiny apparu ! Auto stoppé !');
  expect(banniere.getAttribute('aria-hidden')).toBe('true');
});

it.each([[2, 'text-succes-base'], [0.5, 'text-erreur-base'], [1, '']])('colore le chiffre des dégâts selon le multiplicateur %s', (multiplicateur, classe) => {
  let emettre: (degat: Degat) => void = () => undefined;
  const faux = {
    getState: () => ({ equipe: [{ multiplicateur }] }),
    abonnerDegats: (abonne: (degat: Degat) => void) => { emettre = abonne; return () => undefined; },
  } as unknown as StoreJeu;
  render(<DegatsFlottants store={faux} />);
  act(() => emettre({ id: 1, valeur: 12 }));
  const chiffre = document.querySelector('.degat-flottant')!;
  expect(chiffre.textContent).toBe('−12');
  if (classe) expect(chiffre.className).toContain(classe);
  else expect(chiffre.className).not.toMatch(/text-(succes|erreur)-base/);
});
