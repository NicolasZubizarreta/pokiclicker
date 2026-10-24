// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerStockageMemoire } from '../core/sauvegarde';
import { EcranCombat } from './EcranCombat';
import { creerStoreJeu } from './store';
import type { StoreJeu } from './store';
import { ERREUR_CHARGEMENT } from './persistance';

let store: StoreJeu;
beforeEach(() => vi.useFakeTimers());
afterEach(() => { cleanup(); store?.getState().arreter(); vi.useRealTimers(); });
function preparer(corrompu = false) {
  const horloge = creerHorlogeSimulee();
  const stockage = creerStockageMemoire();
  if (corrompu) stockage.ecrire('pokiclicker:partie:test', '{abîmée');
  store = creerStoreJeu({ horloge, stockage, alea: () => .1, genererId: () => 'test' });
  store.getState().demarrer();
  const vue = render(<EcranCombat store={store} />);
  return { ...vue, horloge, stockage };
}

it('rend la scène attaquable, avec des PV accessibles et dix étapes dont le boss', () => {
  const { container, horloge } = preparer();
  const attaque = screen.getByRole('button', { name: /^Attaquer / });
  expect(attaque.classList.contains('inset-0')).toBe(true);
  expect(container.querySelectorAll('.bg-action')).toHaveLength(0);
  const barre = screen.getByRole('progressbar', { name: 'PV de Rattata' });
  const avant = Number(barre.getAttribute('aria-valuenow'));
  fireEvent.click(attaque);
  expect(container.querySelector('.degat-flottant')?.textContent).toBe('−5');
  expect(Number(barre.getAttribute('aria-valuenow'))).toBe(avant);
  act(() => { horloge.avancer(100); store.getState().tick(); });
  expect(Number(barre.getAttribute('aria-valuenow'))).toBeLessThan(avant);
  expect(screen.getAllByRole('listitem')).toHaveLength(10);
  expect(screen.getByLabelText('Étape 10 : boss').querySelector('svg')).toBeTruthy();
  expect(screen.getByLabelText('Étape 1').getAttribute('aria-current')).toBe('step');
  act(() => vi.advanceTimersByTime(500));
  expect(container.querySelector('.degat-flottant')).toBeNull();
});
it('réserve une marge à droite des cartes et une ligne distincte au DPS', () => {
  preparer();
  const carte = screen.getByLabelText(/Bulbizarre, niveau 5/);
  expect(carte.className).toContain('lg:pe-4');
  const nom = carte.querySelector('strong')!;
  const dps = Array.from(carte.children).find(element => element.textContent?.includes('DPS'))!;
  expect(dps.parentElement).toBe(carte);
  expect(nom.parentElement).not.toBe(dps);
  expect(carte.className).toContain('lg:grid-cols-');
  expect(screen.getAllByLabelText('Case libre')).toHaveLength(3);
});
it('explique la suite verrouillée puis annonce la fin et le contenu à venir', () => {
  const { horloge } = preparer();
  expect(screen.getByText(/Suite : Forêt de Jade \(verrouillée :/).textContent).toMatch(/Route 1/);
  expect(screen.queryByText('La suite arrive bientôt.')).toBeNull();
  act(() => { for (let i = 0; i < 1000; i++) { horloge.avancer(100); store.getState().tick(); } });
  expect(screen.getByRole('status').textContent).toBe('Route 1 terminée !');
  expect(screen.getByText('La suite arrive bientôt.')).toBeTruthy();
  expect(screen.getByRole('button', { name: /^Attaquer / }).hasAttribute('disabled')).toBe(false);
});
it('affiche une erreur française sans toucher au stockage corrompu', () => {
  const { stockage } = preparer(true);
  expect(screen.getByRole('alert').textContent).toContain(ERREUR_CHARGEMENT);
  expect(screen.getByText('Les données de cette partie ne peuvent pas être lues.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: /^Attaquer / })).toBeNull();
  expect(stockage.lire('pokiclicker:partie:test')).toBe('{abîmée');
});
it('emploie des textes et libellés français dans tout l’écran', () => {
  const { container } = preparer();
  const parcours = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  const textes: string[] = [];
  while (parcours.nextNode()) textes.push(parcours.currentNode.textContent ?? '');
  for (const element of container.querySelectorAll('[aria-label], [alt], [title]')) {
    textes.push(element.getAttribute('aria-label') ?? '', element.getAttribute('alt') ?? '', element.getAttribute('title') ?? '');
  }
  expect(textes.join(' ')).not.toMatch(/\b(attack|health|level|next|locked|loading|shop|team|damage|stage|empty)\b/i);
  expect(screen.getByText('Prof. Chen')).toBeTruthy();
  expect(screen.getByText('Les Rattata sont ici. Touche le Pokémon pour attaquer.')).toBeTruthy();
  for (const image of container.querySelectorAll('img')) expect(image.getAttribute('src')).toMatch(/^img\//);
});
it('affiche et journalise la cause technique d’une erreur inconnue', () => {
  const cause = new TypeError('Panne inattendue de test');
  const journal = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    store = creerStoreJeu({ horloge: creerHorlogeSimulee(), stockage: creerStockageMemoire(),
      alea: () => .1, genererId: () => { throw cause; } });
    store.getState().demarrer();
    render(<EcranCombat store={store} />);
    expect(screen.getByText('Une erreur inattendue est survenue.')).toBeTruthy();
    expect(screen.getByText('TypeError: Panne inattendue de test').className).toContain('text-sm');
    expect(screen.getByRole('alert').textContent).toContain('Recharge la page ; ta partie est gardée.');
    expect(journal).toHaveBeenCalledWith(cause);
  } finally { journal.mockRestore(); }
});
it('compte les pointeurs principaux et le clavier sans doubler le clic souris', () => {
  preparer();
  const attaquer = vi.spyOn(store.getState(), 'attaquer');
  const bouton = screen.getByRole('button', { name: /^Attaquer / });
  const pointer = (button: number) => {
    const evenement = new Event('pointerdown', { bubbles: true });
    Object.defineProperty(evenement, 'button', { value: button });
    fireEvent(bouton, evenement);
  };
  pointer(0);
  fireEvent.click(bouton, { detail: 1 });
  pointer(2);
  expect(attaquer).toHaveBeenCalledTimes(1);
  fireEvent.click(bouton, { detail: 0 });
  expect(attaquer).toHaveBeenCalledTimes(2);
});
