// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import donnees from '../../data/pantheon.json';
import type { PokemonPossede } from '../core/sauvegarde';
import { Pantheon } from './Pantheon';
import { Coquille } from './Coquille';
import { creerStoreJeu, type StoreJeu } from './store';

const contexte = vi.hoisted(() => ({ store: null as unknown as StoreJeu }));
vi.mock('./store', async importer => ({ ...await importer<typeof import('./store')>(),
  get storeJeu() { return contexte.store; } }));

const pokemon: PokemonPossede = { uid: 'un', numero: 1, niveau: 62, xp: 0, shiny: true,
  bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: true };
const annuler = vi.fn();
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: vi.fn(() => ({ cancel: annuler })) });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});
const avancer = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
function ouvrir(n = 1, premiereVictoire = false) {
  const quitter = vi.fn();
  const equipe = Array.from({ length: n }, (_, i) => ({ ...pokemon, uid: String(i) }));
  const rendu = render(<Pantheon equipe={equipe} premiereVictoire={premiereVictoire} quitter={quitter} />);
  return { ...rendu, quitter, equipe };
}

it.each([1, 2, 3, 4, 5, 6])('enregistre %s partenaires aux délais du calendrier puis lance les effets', n => {
  const { container, equipe } = ouvrir(n);
  const avant = structuredClone(equipe);
  const places = container.querySelectorAll<HTMLElement>('[data-partenaire]');
  expect(places).toHaveLength(n);
  expect(places[0]!.hidden).toBe(true);
  avancer(2000);
  expect(screen.queryByRole('button', { name: /Professeur Chen :/ })).toBeNull();
  expect(places[0]!.hidden).toBe(false);
  expect(places[0]!.querySelector('[data-identite]')?.hasAttribute('hidden')).toBe(true);
  avancer(1000);
  expect(places[0]!.querySelector('[data-identite]')?.hasAttribute('hidden')).toBe(false);
  avancer(n * 2000 - 500);
  expect(screen.getByRole('heading', { name: donnees.titre })).toBeTruthy();
  avancer(800);
  expect(container.querySelector('[data-particule="confetti"]')).toBeTruthy();
  expect(container.querySelector('[data-particule="feu"]')).toBeTruthy();
  expect(equipe).toEqual(avant);
});

it('suspend la cérémonie pendant les trois répliques et reprend après la sortie de Chen', () => {
  const { container } = ouvrir(1, true);
  avancer(3600);
  for (const texte of donnees.dialogues) {
    const boite = screen.getByRole('button', { name: `Professeur Chen : ${texte}` });
    expect(boite.textContent).not.toContain(texte);
    fireEvent.click(boite);
    expect(boite.textContent).toContain(texte);
    avancer(10000);
    expect(container.querySelector<HTMLElement>('[data-partenaire]')?.hidden).toBe(true);
    fireEvent.click(boite);
  }
  avancer(1999);
  expect(container.querySelector<HTMLElement>('[data-partenaire]')?.hidden).toBe(true);
  avancer(1);
  expect(container.querySelector<HTMLElement>('[data-partenaire]')?.hidden).toBe(false);
});

it('emploie le sprite chromatique, le halo et l’icône sans étoile de favori', () => {
  ouvrir(); avancer(3000);
  const sprite = screen.getByRole('img', { name: 'Bulbizarre' });
  expect(sprite.getAttribute('src')).toContain('shiny');
  expect(sprite.classList.contains('halo-shiny')).toBe(true);
  expect(screen.getByRole('img', { name: 'Chromatique' })).toBeTruthy();
  expect(document.body.textContent).not.toContain('★');
});

it.each([0, 2500, 3600, 20000])('sort à %s ms et annule tous les minuteurs et animations', ms => {
  const { quitter, container } = ouvrir(6, ms === 3600);
  avancer(ms);
  fireEvent.click(screen.getByRole('button', { name: donnees.boutonSortie }));
  expect(quitter).toHaveBeenCalledOnce();
  avancer(0); // Événement selectionchange de jsdom après le retrait du texte focalisé.
  expect(vi.getTimerCount()).toBe(0);
  expect(container.querySelector('[data-particule]')).toBeNull();
  expect(annuler).toHaveBeenCalled();
});

it('nettoie également au démontage', () => {
  const { unmount } = ouvrir(); avancer(6000); unmount();
  expect(vi.getTimerCount()).toBe(0);
});

it('respecte les easter eggs et présente les œufs sans niveau', () => {
  render(<Pantheon equipe={[{ ...pokemon, surnom: 'DinnerBone' },
    { ...pokemon, uid: 'oeuf', shiny: false, oeuf: { pasRestants: 10, pasMax: 20 } }]}
    premiereVictoire={false} quitter={vi.fn()} />);
  avancer(5000);
  expect(screen.getByRole('img', { name: 'DinnerBone' }).classList.contains('ee-retourne')).toBe(true);
  expect(screen.getByRole('img', { name: 'Œuf' }).getAttribute('src')).toBe('img/objets/lucky-egg.png');
  expect(screen.getAllByText('Niv. 62')).toHaveLength(1);
});

it('branche le store, rend la navigation inerte et permet de sortir par Échap', () => {
  contexte.store = creerStoreJeu({ horloge: { maintenant: () => 0 }, alea: () => 0.5,
    genererId: () => 'pantheon', stockage: { lire: () => null, ecrire() {}, supprimer() {}, cles: () => [] } });
  render(<Coquille />);
  const quitter = vi.fn(() => contexte.store.setState({ pantheon: null }));
  act(() => contexte.store.setState({ pantheon: { ouvert: true, premiereVictoire: false,
    equipe: [pokemon], defiChenEnAttente: false }, quitterPantheon: quitter }));
  expect(screen.getByRole('navigation').hasAttribute('inert')).toBe(true);
  fireEvent(screen.getByRole('dialog', { name: 'Panthéon' }), new Event('cancel', { cancelable: true }));
  expect(quitter).toHaveBeenCalledOnce();
  expect(screen.queryByRole('dialog', { name: 'Panthéon' })).toBeNull();
  expect(screen.getByRole('navigation').hasAttribute('inert')).toBe(false);
});

it('pose ensemble les partenaires sans animation ni effets en mouvement réduit', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const { container } = ouvrir(6, true);
  avancer(3600);
  for (const texte of donnees.dialogues) {
    const boite = screen.getByRole('button', { name: `Professeur Chen : ${texte}` });
    expect(boite.textContent).toContain(texte);
    fireEvent.click(boite);
  }
  avancer(2000);
  expect([...container.querySelectorAll<HTMLElement>('[data-partenaire], [data-identite]')].every(el => !el.hidden)).toBe(true);
  expect(screen.getByRole('heading')).toBeTruthy();
  expect(HTMLElement.prototype.animate).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});
