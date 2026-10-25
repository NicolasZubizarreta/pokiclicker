// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PokemonPossede } from '../core/sauvegarde';
import { formaterDps } from './nombres';
import { PageEquipe } from './PageEquipe';
import { storeJeu } from './store';

vi.mock('./store', async original => {
  const module = await original<typeof import('./store')>();
  const { createStore } = await import('zustand/vanilla');
  return { ...module, storeJeu: createStore(() => module.storeJeu.getState()) };
});

const pokemon: PokemonPossede = { uid: 'premier', numero: 1, niveau: 16, xp: 30,
  surnom: 'Bourgeon', sexe: 'male', shiny: false, favori: true, bonheur: 128, calcium: 0, pierreEternelle: false };
const echanger = vi.fn((): string | null => null);
const annulerEchange = vi.fn(() => storeJeu.setState({ echange: null }));
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) {
      this.removeAttribute('open'); this.dispatchEvent(new Event('close'));
    } },
  });
  echanger.mockReset();
  annulerEchange.mockClear();
  storeJeu.setState({ equipe: [pokemon, { ...pokemon, uid: 'second', surnom: undefined, numero: 4 },
    { ...pokemon, uid: 'troisieme', surnom: 'Carapuce', numero: 7 }, null, null, null]
    .map(p => p ? { pokemon: p, dps: 42.5, xpMax: 100, multiplicateur: 1 } : null),
  dps: 127.5, echange: null, echanger, annulerEchange });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('présente six cases, le total formaté et les noms français', () => {
  render(<PageEquipe />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ton équipe');
  expect(screen.getByText(`${formaterDps(127.5)} DPS · 3 / 6`)).toBeTruthy();
  const liste = screen.getByRole('list');
  expect(within(liste).getAllByRole('listitem')).toHaveLength(6);
  expect(within(liste).getAllByRole('button')).toHaveLength(3);
  expect(within(liste).getAllByText('Emplacement libre')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Salamèche, niveau 16' })).toBeTruthy();
  expect(within(liste).getAllByRole('progressbar')).toHaveLength(3);
  expect(liste.textContent).toBe('BourgeonNiv. 1642,5 DPSSalamècheNiv. 1642,5 DPSCarapuceNiv. 1642,5 DPSEmplacement libreEmplacement libreEmplacement libre');
});

it('choisit une case et conserve le choix, le défilement et le focus après fermeture', () => {
  const { container } = render(<PageEquipe />);
  const liste = screen.getByRole('list');
  liste.scrollTop = 120;
  const cible = screen.getByRole('button', { name: 'Salamèche, niveau 16' });
  expect(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(cible);
  expect(cible.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('dialog', { name: 'Salamèche' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(cible.getAttribute('aria-pressed')).toBe('true');
  expect(liste.scrollTop).toBe(120);
  expect(document.activeElement).toBe(cible);
  expect(container.querySelectorAll('dialog[open]')).toHaveLength(0);
  expect(within(screen.getByRole('complementary')).getByRole('heading').textContent).toBe('Salamèche');
});

it('sur grand écran, actualise le détail puis ouvre sa fiche avec son propre déclencheur', () => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);
  render(<PageEquipe />);
  fireEvent.click(screen.getByRole('button', { name: 'Carapuce, niveau 16' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  const detail = screen.getByRole('complementary');
  expect(within(detail).getByRole('heading').textContent).toBe('Carapuce');
  expect(within(detail).getByText('30 / 100 XP')).toBeTruthy();
  const ouvrir = screen.getByRole('button', { name: 'Ouvre la fiche' });
  fireEvent.click(ouvrir);
  expect(screen.getByRole('dialog', { name: 'Carapuce' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(document.activeElement).toBe(ouvrir);
});

it('propose l’échange, appelle le store, affiche son erreur et permet d’annuler', () => {
  storeJeu.setState({ echange: { uid: 'pc', nom: 'Pikachu' } });
  echanger.mockReturnValue('Il faut au moins 1 Pokémon actif dans l’équipe.');
  render(<PageEquipe />);
  expect(screen.getByRole('status').textContent).toContain('Choisis le Pokémon à remplacer par Pikachu');
  fireEvent.click(screen.getByRole('button', { name: 'Salamèche, niveau 16' }));
  expect(echanger).toHaveBeenCalledWith('pc', 'second');
  expect(screen.getByRole('alert').textContent).toBe('Il faut au moins 1 Pokémon actif dans l’équipe.');
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(annulerEchange).toHaveBeenCalledOnce();
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('annule l’échange au démontage', () => {
  const { unmount } = render(<PageEquipe />);
  unmount();
  expect(annulerEchange).toHaveBeenCalledOnce();
});

it('le clic droit ouvre Résumé, puis la fiche du Pokémon et rend le focus à sa carte', () => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);
  render(<PageEquipe />);
  expect(screen.queryByRole('menu')).toBeNull();
  const carte = screen.getByRole('button', { name: 'Salamèche, niveau 16' });
  expect(fireEvent.contextMenu(carte, { clientX: 100, clientY: 80 })).toBe(false);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Résumé' }));
  expect(screen.queryByRole('menu')).toBeNull();
  expect(screen.getByRole('dialog', { name: 'Salamèche' })).toBeTruthy();
  expect(carte.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(document.activeElement).toBe(carte);
});
