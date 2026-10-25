// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerStockageMemoire } from '../core/sauvegarde';
import { PageIntro } from './PageIntro';
import { creerStoreJeu, type StoreJeu } from './store';

const stores: StoreJeu[] = [];
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', (requete: string) => ({ matches: requete.includes('reduce'), media: requete,
    addEventListener() {}, removeEventListener() {} }));
});
afterEach(() => {
  cleanup();
  stores.forEach(store => store.getState().arreter());
  stores.length = 0;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function ouvrir(stockage = creerStockageMemoire()) {
  let id = 0;
  const store = creerStoreJeu({ stockage, horloge: creerHorlogeSimulee(), genererId: () => `i-${++id}`,
    alea: () => .5, nouvellePartie: 'intro' });
  stores.push(store);
  store.getState().demarrer();
  return { store, stockage };
}
const cliquer = (nom: string | RegExp) => act(() => { fireEvent.click(screen.getByRole('button', { name: nom })); });
const avancer = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

it('transmet l’accès pension du store pendant l’introduction', () => {
  const { store } = ouvrir();
  render(<PageIntro store={store} quandTerminee={vi.fn()} />);
  cliquer('JOUER');
  avancer(1);
  cliquer('Sortie');
  expect(screen.getByRole('button', { name: 'Pension Pokémon' }).getAttribute('aria-disabled')).toBe('true');
  act(() => store.setState({ pension: { ...store.getState().pension, acces: { ouvert: true, raison: null } } }));
  expect(screen.getByRole('button', { name: 'Pension Pokémon' }).hasAttribute('aria-disabled')).toBe(false);
});

it('montre le titre, puis Chez Maman, et laisse le Labo clignoter tant que l’intro est en cours', () => {
  const { store } = ouvrir();
  const terminee = vi.fn();
  const { container } = render(<PageIntro store={store} quandTerminee={terminee} />);
  expect(screen.getByRole('heading', { name: 'POKÉ CLICKER' })).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Chez Maman' })).toBeNull();
  cliquer('JOUER');
  avancer(1);
  expect(screen.getByRole('region', { name: 'Chez Maman' })).toBeTruthy();
  expect(screen.getByText("Il n'y a rien à faire ici, sortons.")).toBeTruthy();
  cliquer('Sortie');
  expect(screen.getByRole('region', { name: 'Bourg Palette' })).toBeTruthy();
  expect(container.querySelector('[data-forme="Labo Pokémon du Prof. Chen"]')?.classList.contains('motion-safe:flash-vert')).toBe(true);
  expect(terminee).not.toHaveBeenCalled();
});

it('joue les sept lignes de Chen, propose le choix, puis laisse quitter le labo', () => {
  const { store } = ouvrir();
  const terminee = vi.fn();
  render(<PageIntro store={store} quandTerminee={terminee} />);
  cliquer('JOUER');
  avancer(1);
  cliquer('Sortie');
  cliquer('Labo Pokémon du Prof. Chen');
  avancer(1);
  expect(screen.getByRole('button', { name: /^Prof\. Chen : Salutations/ })).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Sortie' }) as HTMLButtonElement).disabled).toBe(true);
  for (let ligne = 0; ligne < 7; ligne++) {
    cliquer(/^Prof\. Chen : /);
    if (ligne === 3) expect(store.getState().intro.sacOuvert).toBe(true);
  }
  expect(store.getState().intro.choixStarter).toBe(true);
  avancer(1);
  expect(screen.getByRole('heading', { name: 'CHOISIS TON PARTENAIRE' })).toBeTruthy();
  cliquer('Salamèche');
  cliquer('CHOISIR SALAMÈCHE');
  expect(store.getState().intro).toMatchObject({ enCours: false, choixStarter: false });
  expect(screen.queryByRole('heading', { name: 'CHOISIS TON PARTENAIRE' })).toBeNull();
  expect(store.getState().equipe.map(c => c?.pokemon.numero)).toContain(4);
  expect((screen.getByRole('button', { name: 'Sortie' }) as HTMLButtonElement).disabled).toBe(false);
  cliquer('Sortie');
  expect(terminee).toHaveBeenCalledOnce();
});

it('reprend directement au Labo avec la ligne en cours après un rechargement', () => {
  const { store, stockage } = ouvrir();
  for (let ligne = 0; ligne < 4; ligne++) store.getState().terminerEtape();
  store.getState().arreter();
  const { store: repris } = ouvrir(stockage);
  render(<PageIntro store={repris} quandTerminee={vi.fn()} />);
  expect(screen.queryByRole('heading', { name: 'POKÉ CLICKER' })).toBeNull();
  expect(screen.getByRole('region', { name: 'Labo Pokémon du Prof. Chen' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Prof\. Chen : Quant à moi/ })).toBeTruthy();
});

it('avec les animations : le labo ne se quitte pas avant le dialogue, puis délais de 1 s, 1,6 s et 0,5 s', () => {
  vi.stubGlobal('matchMedia', (requete: string) => ({ matches: false, media: requete, addEventListener() {}, removeEventListener() {} }));
  const { store } = ouvrir();
  const terminee = vi.fn();
  render(<PageIntro store={store} quandTerminee={terminee} />);
  cliquer('JOUER');
  avancer(1);
  expect(screen.queryByRole('region', { name: 'Chez Maman' })).toBeTruthy();
  cliquer('Sortie');
  avancer(450);
  cliquer('Labo Pokémon du Prof. Chen');
  avancer(450);
  expect((screen.getByRole('button', { name: 'Sortie' }) as HTMLButtonElement).disabled).toBe(true);
  avancer(999);
  expect(screen.queryByRole('button', { name: /^Prof\. Chen : / })).toBeNull();
  avancer(1);
  avancer(1600);
  expect(screen.getByRole('button', { name: /^Prof\. Chen : Salutations/ })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Prof\. Chen : Salutations/ }));
  expect(terminee).not.toHaveBeenCalled();
});
