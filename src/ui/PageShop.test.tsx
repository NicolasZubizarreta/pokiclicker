// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PageShop } from './PageShop';
import { creerStoreJeu, storeJeu } from './store';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));
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
    genererId: () => 'test-shop',
  });
  storeJeu.getState().demarrer();
}

function preparer(bossVaincus: string[], argent = 1000000, ameliorations: string[] = []) {
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  const cle = Object.keys(localStorage).find(cle => cle.startsWith('pokiclicker:region:') && cle.endsWith(':kanto'))!;
  const sauvegarde = JSON.parse(localStorage.getItem(cle)!);
  Object.assign(sauvegarde.donnees, { bossVaincus, argent, ameliorations });
  localStorage.setItem(cle, JSON.stringify(sauvegarde));
  nouvellePartie();
}

beforeEach(() => { localStorage.clear(); nouvellePartie(); });
afterEach(() => {
  cleanup();
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  localStorage.clear();
});

it('ne montre que le titre et la raison en zone 1', () => {
  const { container } = render(<PageShop />);
  expect(screen.getByRole('heading', { level: 1, name: 'Shop' }).tabIndex).toBe(-1);
  expect(container.textContent).toBe("ShopLe Shop s'ouvre à la Forêt de Jade.");
  expect(screen.queryByRole('button')).toBeNull();
  expect(container.querySelector('article')).toBeNull();
});

it('ouvre en zone 2, affiche seulement le catalogue disponible et filtre les catégories', () => {
  preparer(['kanto.route-1']);
  const { container } = render(<PageShop />);
  const objets = storeJeu.getState().boutique.objets;
  expect(storeJeu.getState().boutique.acces.ouvert).toBe(true);
  expect(objets.length).toBeGreaterThan(0);
  expect(screen.getByText(/^1\s000\s000 pièces$/)).toBeTruthy();
  expect(Array.from(container.querySelectorAll('article')).map(c => c.getAttribute('data-objet')).sort())
    .toEqual(objets.map(o => o.id).sort());
  expect(container.querySelector('[data-objet="hyperball"]')).toBeNull();
  // Une catégorie sans objet à vendre (Soins avant la zone du Bonbon) n'affiche pas de titre vide.
  expect(screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent)).toEqual(['Balles', 'Équipement']);
  for (const [cle, nom] of [['balles', 'Balles'], ['soins', 'Soins'], ['equipement', 'Équipement']]) {
    fireEvent.click(screen.getByRole('button', { name: nom }));
    expect(screen.getByRole('button', { name: nom }).getAttribute('aria-pressed')).toBe('true');
    expect(Array.from(container.querySelectorAll('article')).map(c => c.getAttribute('data-objet')).sort())
      .toEqual(objets.filter(o => o.categorie === cle).map(o => o.id).sort());
  }
  fireEvent.click(screen.getByRole('button', { name: 'Tout' }));
  expect(container.querySelectorAll('article')).toHaveLength(objets.length);
  expect(container.querySelector('.bg-action')).toBeNull();
  expect(container.textContent).not.toMatch(/manque|panier|Prépare ta route/i);
  for (const cible of screen.getAllByRole('button')) {
    expect(cible.classList.contains('min-h-11')).toBe(true);
    expect(cible.classList.contains('min-w-11')).toBe(true);
  }
  for (const carte of container.querySelectorAll('article')) {
    expect(carte.classList.contains('flex-col')).toBe(true);
  }
  for (const image of container.querySelectorAll('img')) expect(image.getAttribute('src')).toMatch(/^img\//);
});

it('désactive les achats sans argent sans message supplémentaire', () => {
  preparer(['kanto.route-1'], 0);
  const { container } = render(<PageShop />);
  const boutons = screen.getAllByRole('button', { name: /^Acheter ×/ }) as HTMLButtonElement[];
  expect(boutons.length).toBeGreaterThan(0);
  expect(boutons.every(b => b.disabled)).toBe(true);
  expect(container.textContent).not.toMatch(/manque|panier|Prépare ta route/i);
});

it('achète la quantité choisie et actualise argent et stock', () => {
  preparer(['kanto.route-1']);
  const objet = storeJeu.getState().boutique.objets.find(o => !o.unique)!;
  render(<PageShop />);
  const carte = screen.getByRole('heading', { name: objet.nom }).closest('article')!;
  fireEvent.click(within(carte).getByRole('button', { name: 'Plus' }));
  fireEvent.click(within(carte).getByRole('button', { name: 'Acheter ×2' }));
  expect(storeJeu.getState().argent).toBe(1000000 - objet.prix * 2);
  expect(within(carte).getByText(`×${objet.stock + 2}`)).toBeTruthy();
});

it('affiche Possédé pour une amélioration déjà acquise', () => {
  preparer(['kanto.route-1']);
  const objet = { id: 'runningShoes', nom: 'Chaussures', description: "Réduit l'attente entre deux ennemis à 1 s.",
    image: null, categorie: 'equipement' as const, prix: 1000, stock: 0, possede: true, unique: true, abordable: false };
  storeJeu.setState({ boutique: { ...storeJeu.getState().boutique, objets: [objet] } });
  render(<PageShop />);
  const carte = screen.getByRole('heading', { name: objet.nom }).closest('article')!;
  expect(within(carte).getByText('Possédé')).toBeTruthy();
  expect(within(carte).queryByRole('button')).toBeNull();
});
