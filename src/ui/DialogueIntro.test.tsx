// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { Commande } from '../core/evenements';
import { DialogueIntro } from './DialogueIntro';

const ligne = (etape: number, texte: string, pose = 'chen-1'): Commande =>
  ({ type: 'dialogue', locuteur: 'Prof. Chen', texte, pose, evenement: 'kanto.intro', etape });

function reduire(valeur: boolean) {
  vi.stubGlobal('matchMedia', (requete: string) => ({ matches: valeur && requete.includes('reduce'), media: requete,
    addEventListener() {}, removeEventListener() {} }));
}
const sprite = (conteneur: HTMLElement) => conteneur.querySelector('img')!;

beforeEach(() => { vi.useFakeTimers(); reduire(false); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

it('montre Chen tout de suite et la boîte seulement après 1,6 s, texte écrit à 30 ms par caractère', () => {
  const { container } = render(<DialogueIntro commande={ligne(0, 'Salut !')} sacOuvert={false} carteOuverte={false}
    terminerEtape={vi.fn()} />);
  expect(sprite(container).getAttribute('src')).toBe('img/sprites/chen/chen-1.png');
  expect(screen.queryByRole('button')).toBeNull();
  act(() => { vi.advanceTimersByTime(1599); });
  expect(screen.queryByRole('button')).toBeNull();
  act(() => { vi.advanceTimersByTime(1); });
  const boite = screen.getByRole('button', { name: 'Prof. Chen : Salut !' });
  expect(boite.textContent).not.toContain('Salut');
  for (let i = 0; i < 3; i++) act(() => { vi.advanceTimersByTime(30); });
  expect(boite.textContent).toContain('Sal');
  expect(boite.textContent).not.toContain('Salu');
  expect(boite.textContent).not.toContain('▼');
  for (let i = 0; i < 4; i++) act(() => { vi.advanceTimersByTime(30); });
  expect(boite.textContent).toContain('Salut !');
  expect(boite.textContent).toContain('▼');
});

it('un toucher pendant l’écriture complète la ligne sans avancer ; le suivant avance une seule fois', () => {
  const terminerEtape = vi.fn();
  render(<DialogueIntro commande={ligne(0, 'Bienvenue dans le monde des Pokémon.')} sacOuvert={false} carteOuverte={false}
    terminerEtape={terminerEtape} />);
  act(() => { vi.advanceTimersByTime(1600); });
  for (let i = 0; i < 2; i++) act(() => { vi.advanceTimersByTime(30); });
  const boite = screen.getByRole('button');
  fireEvent.click(boite);
  expect(boite.textContent).toContain('Bienvenue dans le monde des Pokémon.');
  expect(terminerEtape).not.toHaveBeenCalled();
  fireEvent.click(boite);
  fireEvent.click(boite);
  expect(terminerEtape).toHaveBeenCalledOnce();
});

it('affiche le texte complet tout de suite en mouvement réduit, sans attendre la boîte', () => {
  reduire(true);
  const terminerEtape = vi.fn();
  render(<DialogueIntro commande={ligne(0, 'Texte immédiat.')} sacOuvert={false} carteOuverte={false}
    terminerEtape={terminerEtape} />);
  const boite = screen.getByRole('button', { name: 'Prof. Chen : Texte immédiat.' });
  expect(boite.textContent).toContain('Texte immédiat.');
  fireEvent.click(boite);
  expect(terminerEtape).toHaveBeenCalledOnce();
});

it('change de pose après 350 ms avec un fondu de 250 ms', () => {
  const { container, rerender } = render(<DialogueIntro commande={ligne(1, 'Un.', 'chen-1')} sacOuvert={false}
    carteOuverte={false} terminerEtape={vi.fn()} />);
  rerender(<DialogueIntro commande={ligne(2, 'Deux.', 'chen-2')} sacOuvert={false} carteOuverte={false} terminerEtape={vi.fn()} />);
  act(() => { vi.advanceTimersByTime(349); });
  expect(sprite(container).getAttribute('src')).toBe('img/sprites/chen/chen-1.png');
  expect(sprite(container).className).toContain('opacity-100');
  act(() => { vi.advanceTimersByTime(1); });
  expect(sprite(container).className).toContain('opacity-0');
  act(() => { vi.advanceTimersByTime(250); });
  expect(sprite(container).getAttribute('src')).toBe('img/sprites/chen/chen-2.png');
  expect(sprite(container).className).toContain('opacity-100');
});

it('annonce les Pokéballs puis la carte quand elles s’ouvrent, pas à la reprise', () => {
  reduire(true);
  const { rerender } = render(<DialogueIntro commande={ligne(2, 'A.')} sacOuvert={false} carteOuverte={false} terminerEtape={vi.fn()} />);
  expect(document.querySelector('[aria-live]')).toBeNull();
  rerender(<DialogueIntro commande={ligne(5, 'B.')} sacOuvert carteOuverte={false} terminerEtape={vi.fn()} />);
  expect(screen.getByText('+5 POKÉBALLS !')).toBeTruthy();
  rerender(<DialogueIntro commande={ligne(8, 'C.')} sacOuvert carteOuverte terminerEtape={vi.fn()} />);
  expect(screen.getByText('CARTE DÉBLOQUÉE !')).toBeTruthy();
  expect(screen.queryByText('+5 POKÉBALLS !')).toBeNull();
  rerender(<DialogueIntro commande={ligne(9, 'D.')} sacOuvert carteOuverte terminerEtape={vi.fn()} />);
  expect(document.querySelector('[aria-live]')).toBeNull();
});

it('ne présente que Chen quand aucune ligne n’est en cours', () => {
  const { container } = render(<DialogueIntro commande={null} sacOuvert carteOuverte terminerEtape={vi.fn()} />);
  expect(sprite(container)).toBeTruthy();
  expect(screen.queryByRole('button')).toBeNull();
});
