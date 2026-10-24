// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { creerStockageMemoire } from '../core/sauvegarde';
import { EcranCombat } from './EcranCombat';
import { formaterDps } from './nombres';
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

it('affiche les pièces du store au format français sans constante provisoire', () => {
  preparer();
  for (const argent of [1250, 9876543, 0]) {
    act(() => store.setState({ argent }));
    expect(screen.getByRole('banner').textContent?.replace(/\s/g, ' ')).toContain(
      `${new Intl.NumberFormat('fr-FR').format(argent).replace(/\s/g, ' ')} pièces`);
  }
  expect(readFileSync('src/ui/EcranCombat.tsx', 'utf8'))
    .not.toContain(['ARGENT', 'PROVISOIRE'].join('_'));
});
it('affiche les niveaux mobile et PC ainsi que les XP accessibles de chaque Pokémon', () => {
  preparer();
  const noms = ['Bulbizarre', 'Salamèche', 'Carapuce'];
  const membres = store.getState().equipe.filter(membre => membre !== null);
  expect(membres).toHaveLength(3);
  for (const [index, membre] of membres.entries()) {
    const nom = noms[index];
    const carte = screen.getByLabelText(`${nom}, niveau ${membre.pokemon.niveau}, ${formaterDps(membre.dps)} DPS`);
    expect(within(carte).getByText(String(membre.pokemon.niveau)).className).toContain('lg:hidden');
    expect(within(carte).getByText(`Niv. ${membre.pokemon.niveau}`)).toBeTruthy();
    const barre = within(carte).getByRole('progressbar', { name: `XP de ${nom}` });
    expect(barre.getAttribute('aria-valuemin')).toBe('0');
    expect(barre.getAttribute('aria-valuemax')).toBe(String(membre.xpMax));
    expect(barre.getAttribute('aria-valuenow')).toBe(String(membre.pokemon.xp));
    expect(barre.className).toContain('h-1');
  }
  expect(screen.getAllByRole('progressbar', { name: /^XP de / })).toHaveLength(3);
  act(() => store.setState({ equipe: store.getState().equipe.map((membre, index) =>
    membre && index === 0 ? { ...membre, pokemon: { ...membre.pokemon, niveau: 100 }, xpMax: 0 } : membre) }));
  expect(screen.queryByRole('progressbar', { name: 'XP de Bulbizarre' })).toBeNull();
  expect(screen.getAllByRole('progressbar', { name: /^XP de / })).toHaveLength(2);
});
it('affiche puis retire l’annonce du store sans déplacer la scène', () => {
  preparer();
  expect(screen.queryByRole('status')).toBeNull();
  const annonce = 'Salamèche passe au niveau 6 ! Chromatique ! +5 Bonbons';
  act(() => store.setState({ annonce }));
  const message = screen.getByRole('status');
  expect(message.textContent).toBe(annonce);
  expect(message.getAttribute('aria-live')).toBe('polite');
  expect(message.className).toContain('absolute');
  expect(message.className).toContain('pointer-events-none');
  act(() => store.setState({ annonce: null }));
  expect(screen.queryByRole('status')).toBeNull();
  expect(screen.queryByText(annonce)).toBeNull();
});
it('masque l’ennemi pendant la recherche en gardant la cible d’attaque et les éléments en place', () => {
  const { container } = preparer();
  expect(screen.queryByText('Recherche en cours…')).toBeNull();
  const attaque = screen.getByRole('button', { name: /^Attaquer / });
  const panneau = screen.getByRole('progressbar', { name: 'PV de Rattata' }).parentElement?.parentElement;
  const sprite = container.querySelector('.will-change-transform');
  act(() => store.setState({ enRecherche: true }));
  expect(screen.getByRole('status').textContent).toBe('Recherche en cours…');
  expect(screen.getByRole('button', { name: /^Attaquer / })).toBe(attaque);
  expect(attaque.getAttribute('aria-label')).toBe('Attaquer (recherche en cours)');
  expect(screen.queryByRole('heading', { name: 'Rattata' })).toBeNull();
  expect(screen.queryByRole('img', { name: 'Rattata' })).toBeNull();
  expect(panneau?.classList.contains('opacity-0')).toBe(true);
  expect(sprite?.classList.contains('opacity-0')).toBe(true);
  act(() => store.setState({ enRecherche: false }));
  expect(screen.queryByText('Recherche en cours…')).toBeNull();
  expect(panneau?.classList.contains('opacity-0')).toBe(false);
  expect(sprite?.classList.contains('opacity-0')).toBe(false);
});

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
