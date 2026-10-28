// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Commande } from '../core/evenements';
import { DialogueScene } from './DialogueScene';
import { Coquille } from './Coquille';
import { creerStoreJeu, type StoreJeu } from './store';

const contexte = vi.hoisted(() => ({ store: null as unknown as StoreJeu }));
vi.mock('./store', async importer => ({
  ...await importer<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

const ligne = (etape = 0, locuteur = 'Blue', evenement = 'kanto.rival'): Extract<Commande, { type: 'dialogue' }> =>
  ({ type: 'dialogue', locuteur, texte: 'Prêt pour un combat ?', evenement, etape });
const reduire = (matches: boolean) => vi.stubGlobal('matchMedia', () => ({ matches }));

beforeEach(() => {
  vi.useFakeTimers();
  reduire(false);
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
});
afterEach(() => {
  cleanup();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals();
});

it.each(['Blue', 'narration'])('affiche le locuteur %s sans sprite quand la pose est absente', locuteur => {
  const { container } = render(<DialogueScene commande={ligne(0, locuteur)} terminerEtape={vi.fn()} />);
  expect(screen.getByRole('dialog', { name: 'Dialogue de scène' })).toBeTruthy();
  expect(screen.getByRole('button', { name: `${locuteur} : Prêt pour un combat ?` })).toBeTruthy();
  expect(screen.getByText(locuteur)).toBeTruthy();
  expect(container.querySelector('img')).toBeNull();
});

it('écrit la ligne puis un toucher la complète et les suivants ne terminent qu’une fois', () => {
  const terminerEtape = vi.fn();
  render(<DialogueScene commande={ligne()} terminerEtape={terminerEtape} />);
  const boite = screen.getByRole('button');
  expect(document.activeElement).toBe(boite);
  expect(boite.textContent).not.toContain('Prêt');
  act(() => { vi.advanceTimersByTime(30); });
  expect(boite.textContent).toContain('P');
  expect(boite.textContent).not.toContain('Prêt');
  fireEvent.click(boite);
  expect(boite.textContent).toContain('Prêt pour un combat ?');
  expect(terminerEtape).not.toHaveBeenCalled();
  fireEvent.click(boite);
  fireEvent.click(boite);
  expect(terminerEtape).toHaveBeenCalledOnce();
});

it('présente immédiatement le texte entier en mouvement réduit, avec la pose demandée', () => {
  reduire(true);
  const terminerEtape = vi.fn();
  const { container } = render(<DialogueScene commande={{ ...ligne(0, 'Prof. Chen'), pose: 'chen-2' }} terminerEtape={terminerEtape} />);
  expect(container.querySelector('img')?.getAttribute('src')).toBe('img/sprites/chen/chen-2.png');
  expect(container.querySelector('img')?.className).not.toContain('sprite-entree');
  expect(screen.getByRole('button').textContent).toContain('Prêt pour un combat ?');
  fireEvent.click(screen.getByRole('button'));
  expect(terminerEtape).toHaveBeenCalledOnce();
});

it('montre Blue (silhouette tant que son image manque) à côté du texte, animé sauf en mouvement réduit', () => {
  const { container, unmount } = render(<DialogueScene commande={{ ...ligne(), pose: 'blue-1' }} terminerEtape={vi.fn()} />);
  const sprite = container.querySelector('[data-silhouette]');
  expect(sprite).not.toBeNull();
  expect(sprite?.getAttribute('class')).toContain('sprite-entree');
  expect(container.querySelector('img')).toBeNull();
  expect(screen.getByRole('button', { name: 'Blue : Prêt pour un combat ?' })).toBeTruthy();
  unmount();
  reduire(true);
  const reduit = render(<DialogueScene commande={{ ...ligne(), pose: 'blue-1' }} terminerEtape={vi.fn()} />);
  expect(reduit.container.querySelector('[data-silhouette]')).not.toBeNull();
  expect(reduit.container.querySelector('[data-silhouette]')?.getAttribute('class')).not.toContain('sprite-entree');
});

it('anime l’image de Chen sauf en mouvement réduit', () => {
  const { container } = render(<DialogueScene commande={{ ...ligne(0, 'Prof. Chen'), pose: 'chen-1' }} terminerEtape={vi.fn()} />);
  expect(container.querySelector('img')?.className).toContain('sprite-entree');
});

it('réinitialise écriture, focus et validation même si un autre événement réutilise le numéro d’étape', () => {
  const terminerEtape = vi.fn();
  const { rerender } = render(<DialogueScene commande={ligne()} terminerEtape={terminerEtape} />);
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));
  rerender(<DialogueScene commande={ligne(0, 'narration', 'kanto.ronflex')} terminerEtape={terminerEtape} />);
  expect(screen.getByRole('button').textContent).not.toContain('Prêt');
  expect(document.activeElement).toBe(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));
  fireEvent.click(screen.getByRole('button'));
  expect(terminerEtape).toHaveBeenCalledTimes(2);
});

it('ne permet pas à Échap de fermer le dialogue sans terminer la ligne', () => {
  const terminerEtape = vi.fn();
  render(<DialogueScene commande={ligne()} terminerEtape={terminerEtape} />);
  const dialogue = screen.getByRole('dialog');
  expect(fireEvent(dialogue, new Event('cancel', { cancelable: true }))).toBe(false);
  expect(dialogue.hasAttribute('open')).toBe(true);
  expect(terminerEtape).not.toHaveBeenCalled();
});

function coquille() {
  contexte.store = creerStoreJeu({ horloge: { maintenant: () => 0 }, alea: () => 0.5,
    genererId: () => 'scene', stockage: { lire: () => null, ecrire() {}, supprimer() {}, cles: () => [] } });
  render(<Coquille />);
  const terminerEtape = vi.fn();
  act(() => contexte.store.setState({ evenement: ligne(), terminerEtape }));
  return terminerEtape;
}

it('branche le dialogue de scène au store et le retire quand la commande se termine', () => {
  reduire(true);
  const terminerEtape = coquille();
  fireEvent.click(screen.getByRole('button', { name: 'Blue : Prêt pour un combat ?' }));
  expect(terminerEtape).toHaveBeenCalledOnce();
  act(() => contexte.store.setState({ evenement: null }));
  expect(screen.queryByRole('dialog', { name: 'Dialogue de scène' })).toBeNull();
});

it('attend la sortie de la Carte pour laisser le vol se terminer', () => {
  coquille();
  fireEvent.click(screen.getByRole('button', { name: 'Carte' }));
  expect(screen.queryByRole('dialog', { name: 'Dialogue de scène' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Combat' }));
  expect(screen.getByRole('dialog', { name: 'Dialogue de scène' })).toBeTruthy();
});

it('attend la fin de l’évolution et ne recouvre pas l’introduction', () => {
  coquille();
  act(() => contexte.store.setState({ evolution: { uid: 'scene', ancien: 1, nouveau: 2 } }));
  expect(screen.queryByRole('dialog', { name: 'Dialogue de scène' })).toBeNull();
  act(() => contexte.store.setState({ evolution: null }));
  expect(screen.getByRole('dialog', { name: 'Dialogue de scène' })).toBeTruthy();
  act(() => contexte.store.setState({ intro: { ...contexte.store.getState().intro, enCours: true } }));
  expect(screen.queryByRole('dialog', { name: 'Dialogue de scène' })).toBeNull();
});
