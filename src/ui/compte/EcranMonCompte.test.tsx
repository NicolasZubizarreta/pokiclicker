// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import type { DefinitionSucces } from '../../core/succes';
import type { ResumeCompte } from '../store';
import { EcranMonCompte } from './EcranMonCompte';

afterEach(cleanup);
const registre: readonly DefinitionSucces[] = [
  { id: 'premier', nom: 'Premier pas', description: 'Commence ton aventure.', diamants: 5, mesure: 'pokedex', seuil: 1 },
  { id: 'collection', nom: 'Collection', description: 'Capture dix Pokémon.', diamants: 10, mesure: 'pokedex', seuil: 10 },
  { id: 'voyage', nom: 'Voyage', description: 'Explore les zones.', diamants: 20, mesure: 'badges', seuil: 3 },
];
const compte: ResumeCompte = { diamants: 42, succes: ['collection'], skins: ['tenue-kanto'] };

it('est une boîte de dialogue qui suit le thème du jeu', () => {
  render(<EcranMonCompte compte={compte} registre={registre} quandFermer={vi.fn()} theme="light" />);
  const boite = screen.getByRole('dialog', { name: 'Mon compte' });
  expect(boite.getAttribute('data-theme')).toBe('light');
  expect(boite.getAttribute('aria-modal')).toBe('true');
  expect(screen.queryByRole('main')).toBeNull();
});

it('affiche les diamants, le compteur, les récompenses et les succès obtenus en premier', () => {
  render(<EcranMonCompte compte={compte} registre={registre} quandFermer={vi.fn()} />);
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Mon compte' }));
  expect(screen.getByText('42')).toBeTruthy();
  expect(screen.getByText('diamants')).toBeTruthy();
  expect(screen.getByText('1 sur 3 obtenus')).toBeTruthy();
  const titres = screen.getAllByRole('heading', { level: 3 });
  expect(titres.map(titre => titre.textContent)).toEqual(['Collection', 'Premier pas', 'Voyage']);
  const carte = titres[0]!.closest('section')!;
  expect(within(carte).getByText('Capture dix Pokémon.')).toBeTruthy();
  expect(within(carte).getByText('+10 diamants')).toBeTruthy();
  expect(within(carte).getByText(/Obtenu/).querySelector('span')?.getAttribute('aria-hidden')).toBe('true');
  for (const titre of titres.slice(1)) {
    expect(within(titre.closest('section')!).getByText('À obtenir')).toBeTruthy();
  }
});

it('affiche les skins ou le message de liste vide et accorde le libellé diamant', () => {
  const { rerender } = render(<EcranMonCompte compte={compte} registre={registre} quandFermer={vi.fn()} />);
  expect(screen.getByText('tenue-kanto')).toBeTruthy();
  expect(screen.queryByText(/Aucun skin débloqué/)).toBeNull();
  rerender(<EcranMonCompte compte={{ ...compte, diamants: 1, skins: [] }} registre={registre} quandFermer={vi.fn()} />);
  expect(screen.getByText('1')).toBeTruthy();
  expect(screen.getByText('diamant')).toBeTruthy();
  expect(screen.getByText("Aucun skin débloqué pour l'instant.")).toBeTruthy();
  expect(screen.queryByText('tenue-kanto')).toBeNull();
});

it('ignore les succès inconnus et ne compte pas deux fois un identifiant obtenu', () => {
  render(<EcranMonCompte compte={{ ...compte, succes: ['collection', 'inconnu', 'collection'] }} registre={registre} quandFermer={vi.fn()} />);
  expect(screen.getByText('1 sur 3 obtenus')).toBeTruthy();
  expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3);
  expect(screen.queryByText('inconnu')).toBeNull();
});

it('permet de revenir au jeu même avec un registre vide', () => {
  const quandFermer = vi.fn();
  render(<EcranMonCompte compte={compte} registre={[]} quandFermer={quandFermer} />);
  expect(screen.getByText('0 sur 0 obtenus')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Retour au jeu' }));
  expect(quandFermer).toHaveBeenCalledOnce();
});
