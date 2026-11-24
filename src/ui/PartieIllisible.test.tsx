// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerStockageMemoire } from '../core/sauvegarde';
import { PartieIllisible } from './PartieIllisible';

const mocks = vi.hoisted(() => ({ telecharger: vi.fn() }));
vi.mock('./telecharger', () => ({ telechargerTexte: mocks.telecharger }));

const ILLISIBLE = '{abîmée';
let stockage: ReturnType<typeof creerStockageMemoire>;

beforeEach(() => {
  mocks.telecharger.mockReset();
  stockage = creerStockageMemoire();
  stockage.ecrire('pokiclicker:partie:ancienne', ILLISIBLE);
  stockage.ecrire('pokiclicker:region:ancienne:kanto', ILLISIBLE);
});
afterEach(cleanup);

it('dit la vraie situation sans promettre qu\'un rechargement règle quoi que ce soit', () => {
  render(<PartieIllisible stockage={stockage} quandTermine={() => {}} />);
  const alerte = screen.getByRole('alert').textContent!;
  expect(alerte).toContain('ne peut pas être lue');
  expect(alerte).toContain('recharger la page ne les réparera pas');
  expect(alerte).toContain('rien n’a été effacé');
});

it('exporte le texte brut de la sauvegarde illisible sans rien modifier', () => {
  render(<PartieIllisible stockage={stockage} quandTermine={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Exporter la sauvegarde' }));
  expect(mocks.telecharger).toHaveBeenCalledOnce();
  const [nom, texte] = mocks.telecharger.mock.calls[0] as [string, string];
  expect(nom).toMatch(/^pokiclicker-sauvegarde-illisible-ancienne\.json$/);
  const brut = JSON.parse(texte) as { format: string; cles: Record<string, string> };
  expect(brut.format).toBe('pokiclicker-partie-brute');
  expect(brut.cles['pokiclicker:partie:ancienne']).toBe(ILLISIBLE);
  expect(stockage.lire('pokiclicker:partie:ancienne')).toBe(ILLISIBLE);
  expect(screen.getByRole('status').textContent).toContain('exportée');
});

it('ne crée rien sans confirmation explicite, et Annuler laisse tout intact', () => {
  const fini = vi.fn();
  render(<PartieIllisible stockage={stockage} quandTermine={fini} />);
  const avant = stockage.cles().sort();
  fireEvent.click(screen.getByRole('button', { name: 'Commencer une nouvelle partie' }));
  expect(screen.getByRole('group', { name: 'Confirmation' }).textContent).toContain('reste dans ton navigateur');
  expect(stockage.cles().sort()).toEqual(avant);
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(stockage.cles().sort()).toEqual(avant);
  expect(fini).not.toHaveBeenCalled();
  expect(screen.queryByRole('group', { name: 'Confirmation' })).toBeNull();
});

it('après confirmation, crée une nouvelle partie courante sans effacer la sauvegarde illisible', () => {
  const fini = vi.fn();
  render(<PartieIllisible stockage={stockage} quandTermine={fini} />);
  fireEvent.click(screen.getByRole('button', { name: 'Commencer une nouvelle partie' }));
  fireEvent.click(screen.getByRole('button', { name: 'Oui, commencer une nouvelle partie' }));
  expect(fini).toHaveBeenCalledOnce();
  expect(stockage.lire('pokiclicker:partie:ancienne')).toBe(ILLISIBLE);
  expect(stockage.lire('pokiclicker:region:ancienne:kanto')).toBe(ILLISIBLE);
  const courante = stockage.lire('pokiclicker:courante');
  expect(courante).toBeTruthy();
  expect(courante).not.toBe('ancienne');
  expect(stockage.lire(`pokiclicker:partie:${courante}`)).not.toBeNull();
});

it('sans partie repérable, ne propose pas l’export mais garde la nouvelle partie', () => {
  render(<PartieIllisible stockage={creerStockageMemoire()} quandTermine={() => {}} />);
  expect(screen.queryByRole('button', { name: 'Exporter la sauvegarde' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Commencer une nouvelle partie' })).toBeTruthy();
});
