// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { chargerPokemon } from '../core/pokemon';
import { PagePlus } from './PagePlus';
import { creerStoreJeu, storeJeu } from './store';
import { afficherProgression } from './store-progression';
import { formaterDps } from './nombres';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));

it('réserve le diplôme aux détenteurs et ouvre sa fenêtre depuis Plus', () => {
  const { unmount } = render(<PagePlus />);
  expect(screen.queryByRole('button', { name: 'Diplôme du Pokédex' })).toBeNull();
  unmount();
  storeJeu.setState({ fin: { diplome: { nom: 'Nicolas', date: '2026-10-25T00:00:00Z' }, credits: false } });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
  try {
    render(<PagePlus />);
    const entree = screen.getByRole('button', { name: 'Diplôme du Pokédex' });
    entree.focus();
    fireEvent.click(entree);
    expect(screen.getByRole('dialog', { name: 'Diplôme du Pokédex' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
    expect(document.activeElement).toBe(entree);
  } finally {
    cleanup();
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});
vi.mock('./store', async original => ({
  ...await original<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

function nouvellePartie() {
  contexte.store = creerStoreJeu({
    horloge: { maintenant: () => 0 },
    stockage: {
      lire: cle => localStorage.getItem(cle),
      ecrire: (cle, valeur) => localStorage.setItem(cle, valeur),
      supprimer: cle => localStorage.removeItem(cle),
      cles: () => Object.keys(localStorage),
    },
    alea: () => 0.5,
    genererId: () => 'test-plus',
  });
  storeJeu.getState().demarrer();
}

beforeEach(() => { localStorage.clear(); nouvellePartie(); });
afterEach(() => {
  cleanup();
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  localStorage.clear();
});

it('préserve les deux entrées historiques françaises, le compteur et le verrou visible lié au PC', () => {
  const { container } = render(<PagePlus />);
  // Prépare la vue historique ; les ajouts du tableau de bord sont vérifiés séparément.
  container.querySelectorAll('section[aria-labelledby]').forEach(section => section.remove());
  container.querySelector('[data-entree="badges"]')?.closest('li')?.remove();
  container.querySelector('[data-prochain-palier]')?.remove();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Plus');
  const liste = screen.getByRole('list');
  expect(within(liste).getAllByRole('listitem')).toHaveLength(2);
  expect(within(liste).getAllByRole('button').map(b => b.textContent)).toEqual(['PC de Léo', 'Pokédex 3 / 151']);
  const pc = screen.getByRole('button', { name: 'PC de Léo' }) as HTMLButtonElement;
  expect(pc.disabled).toBe(true);
  const raison = screen.getByText("Le PC de Léo s'ouvre à l'Arène d'Argenta.");
  expect(raison.hidden).toBe(false);
  expect(document.getElementById(pc.getAttribute('aria-describedby')!)).toBe(raison);
  fireEvent.click(pc);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Plus');
  expect(container.textContent).toBe("PlusPC de LéoLe PC de Léo s'ouvre à l'Arène d'Argenta.Pokédex 3 / 151");
  expect(container.querySelector('[class~="bg-action"]')).toBeNull();
});

it('ouvre le PC après les boss de la Route 1 et de la Forêt de Jade et gère le focus aller-retour', () => {
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  const cle = Object.keys(localStorage).find(cle => cle.startsWith('pokiclicker:region:') && cle.endsWith(':kanto'))!;
  const sauvegarde = JSON.parse(localStorage.getItem(cle)!);
  sauvegarde.donnees.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
  localStorage.setItem(cle, JSON.stringify(sauvegarde));
  nouvellePartie();
  render(<PagePlus />);
  const pc = screen.getByRole('button', { name: 'PC de Léo' }) as HTMLButtonElement;
  expect(pc.disabled).toBe(false);
  expect(pc.hasAttribute('aria-describedby')).toBe(false);
  fireEvent.click(pc);
  const titre = screen.getByRole('heading', { level: 1, name: 'PC de Léo' });
  expect(document.activeElement).toBe(titre);
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'PC de Léo' }));
  expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull();
});

it('ouvre le Pokédex des trois starters avec ses textes français et rend le focus à l’entrée d’origine', () => {
  const { container } = render(<PagePlus />);
  fireEvent.click(screen.getByRole('button', { name: 'Pokédex 3 / 151' }));
  // Isole le compteur et la grille historiques pour leur comparaison exacte.
  container.querySelector('[aria-label="Paliers du Pokédex"]')?.remove();
  container.querySelector('[data-prochain-palier]')?.remove();
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Pokédex' }));
  expect(screen.getByText('3 / 151')).toBeTruthy();
  const catalogue = chargerPokemon();
  const cases = catalogue.liste.map(p => `N° ${p.numero}${[1, 4, 7].includes(p.numero) ? p.nom : '???'}`).join('');
  expect(container.textContent).toBe(`RetourPokédex3 / 151${cases}`);
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: /^Pokédex/ }));
  expect(screen.getByRole('button', { name: 'Pokédex 3 / 151' })).toBeTruthy();
});

it('affiche le tableau de bord C et ouvre les badges avec le focus aller-retour', () => {
  const progression = afficherProgression({ badges: ['roche', 'cascade'], jalonsRecus: [10, 20] },
    Array.from({ length: 24 }, (_, i) => i + 1));
  storeJeu.setState({ progression });
  const { container } = render(<PagePlus />);
  const aventure = screen.getByRole('region', { name: 'Ton aventure' });
  expect(aventure.textContent).toBe(`Ton aventureRégionKanto · ${storeJeu.getState().lieu!.nom}Pokédex24 / 151Badges2 / 8DPS${formaterDps(storeJeu.getState().dps)}`);
  expect(screen.getByRole('list').textContent).toBe("PC de LéoLe PC de Léo s'ouvre à l'Arène d'Argenta.Pokédex 24 / 151Prochain palier : 30 (Collectionneur) · Encore 6 espèces.Badges");
  expect(within(screen.getByRole('list')).getAllByRole('listitem')).toHaveLength(3);
  expect(aventure.querySelector('dl')).toBeTruthy();
  expect(within(aventure).getByText('24 / 151')).toBeTruthy();
  expect(within(aventure).getByText('2 / 8')).toBeTruthy();
  expect(within(aventure).getByText(`Kanto · ${storeJeu.getState().lieu!.nom}`)).toBeTruthy();
  expect(within(aventure).getByText(formaterDps(storeJeu.getState().dps))).toBeTruthy();
  expect(screen.getByText(/Encore 6 espèces/)).toBeTruthy();
  expect(screen.queryByRole('button', { name: /Réclame/ })).toBeNull();
  expect(container.querySelector('[class~="bg-action"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Badges' }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Badges' }));
  expect(screen.getAllByRole('button', { name: /^Badge / })).toHaveLength(8);
  expect(container.querySelector('.opacity-0, .badge-slam, [class~="bg-action"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(document.activeElement).toBe(container.querySelector('[data-entree="badges"]'));
});
