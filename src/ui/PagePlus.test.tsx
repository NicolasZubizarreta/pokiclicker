// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { chargerPokemon } from '../core/pokemon';
import { PagePlus } from './PagePlus';
import { creerStoreJeu, storeJeu } from './store';
import { afficherProgression } from './store-progression';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));

it('réserve le diplôme aux détenteurs et ouvre sa fenêtre depuis Menu', () => {
  const { unmount } = render(<PagePlus ouvrirMonde={vi.fn()} ouvrirPC={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Diplôme du Pokédex' })).toBeNull();
  unmount();
  storeJeu.setState({ fin: { diplome: { nom: 'Nicolas', date: '2026-10-25T00:00:00Z' }, credits: false } });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
  try {
    render(<PagePlus ouvrirMonde={vi.fn()} ouvrirPC={vi.fn()} />);
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
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  cleanup();
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  localStorage.clear();
});

it('ouvre le Guide du jeu depuis Menu et rend le focus au bouton à la fermeture (AL)', () => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
  try {
    render(<PagePlus ouvrirMonde={vi.fn()} ouvrirPC={vi.fn()} />);
    const entree = screen.getByRole('button', { name: 'Guide du jeu' });
    entree.focus();
    fireEvent.click(entree);
    const fenetre = screen.getByRole('dialog', { name: 'Guide du jeu' });
    expect(fenetre.querySelectorAll('details')).toHaveLength(11);
    fireEvent.click(screen.getByRole('button', { name: 'Fermer le guide' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(entree);
  } finally {
    cleanup();
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

it('ouvre le Pokédex des trois starters avec ses textes français et rend le focus à l’entrée d’origine', () => {
  const { container } = render(<PagePlus ouvrirMonde={vi.fn()} ouvrirPC={vi.fn()} />);
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

it('affiche la partie et les compteurs et ouvre les badges avec le focus aller-retour', () => {
  const progression = afficherProgression({ badges: ['roche', 'cascade'], jalonsRecus: [10, 20] },
    Array.from({ length: 24 }, (_, i) => i + 1));
  storeJeu.setState({ progression });
  const { container } = render(<PagePlus ouvrirMonde={vi.fn()} ouvrirPC={vi.fn()} />);
  expect(screen.getByRole('region', { name: 'Partie en cours' }).textContent).toContain(`Kanto · ${storeJeu.getState().lieu!.nom}`);
  expect(screen.getByRole('button', { name: 'Pokédex 24 / 151' })).toBeTruthy();
  expect(screen.getByText('2 sur 8')).toBeTruthy();
  expect(container.querySelector('[data-prochain-palier]')?.textContent).toContain('Encore 6 espèces');
  fireEvent.click(screen.getByRole('button', { name: /^Badges/ }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Badges' }));
  expect(screen.getAllByRole('button', { name: /^Badge / })).toHaveLength(8);
  expect(container.querySelector('.opacity-0, .badge-slam, [class~="bg-action"]')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(document.activeElement).toBe(container.querySelector('[data-entree="badges"]'));
});

it('sauvegarde et annonce le succès puis un échec', async () => {
  const sauvegarder = vi.fn(() => true);
  storeJeu.setState({ sauvegarder });
  render(<PagePlus ouvrirPC={vi.fn()} ouvrirMonde={vi.fn()} />);
  expect(screen.getByText('La partie se sauvegarde toute seule.')).toBeTruthy();
  const bouton = screen.getByRole('button', { name: 'Sauvegarder maintenant' });
  fireEvent.click(bouton);
  expect(sauvegarder).toHaveBeenCalledOnce();
  expect((await screen.findByRole('status')).textContent).toMatch(/^Partie sauvegardée à \d{2}:\d{2}\.$/);
  sauvegarder.mockReturnValue(false);
  fireEvent.click(bouton);
  expect((await screen.findByRole('alert')).textContent).toBe('La sauvegarde a échoué. Réessaie : ta partie reste en mémoire.');
});

it('attend l’envoi sans double clic et conserve le succès local si l’envoi échoue', async () => {
  const sauvegarder = vi.fn(() => true);
  storeJeu.setState({ sauvegarder });
  let rejeter!: (erreur: Error) => void;
  const attendreEnvoi = vi.fn(() => new Promise<void>((_, reject) => { rejeter = reject; }));
  render(<PagePlus ouvrirPC={vi.fn()} ouvrirMonde={vi.fn()} attendreEnvoi={attendreEnvoi} />);
  const bouton = screen.getByRole('button', { name: 'Sauvegarder maintenant' });
  fireEvent.click(bouton);
  expect((bouton as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(bouton);
  expect(sauvegarder).toHaveBeenCalledOnce();
  expect(attendreEnvoi).toHaveBeenCalledOnce();
  await act(async () => rejeter(new Error('hors ligne')));
  expect(screen.getByRole('status').textContent).toMatch(/^Partie sauvegardée sur cet appareil à .*envoi en ligne est en attente/);
  expect((bouton as HTMLButtonElement).disabled).toBe(false);
});

it('annonce un envoi en attente quand la synchro répond false, et un succès quand elle répond true', async () => {
  storeJeu.setState({ sauvegarder: vi.fn(() => true) });
  const attendreEnvoi = vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
  render(<PagePlus ouvrirPC={vi.fn()} ouvrirMonde={vi.fn()} attendreEnvoi={attendreEnvoi} />);
  const bouton = screen.getByRole('button', { name: 'Sauvegarder maintenant' });
  await act(async () => { fireEvent.click(bouton); });
  expect(screen.getByRole('status').textContent).toMatch(/sur cet appareil/);
  await act(async () => { fireEvent.click(bouton); });
  expect(screen.getByRole('status').textContent).toMatch(/^Partie sauvegardée à \d{2}:\d{2}\.$/);
});

it('désactive Menu principal pendant une sauvegarde et Sauvegarder pendant le retour', async () => {
  storeJeu.setState({ sauvegarder: vi.fn(() => true) });
  let finir!: () => void;
  const attendreEnvoi = vi.fn(() => new Promise<void>(resolve => { finir = resolve; }));
  render(<PagePlus ouvrirPC={vi.fn()} ouvrirMonde={vi.fn()} attendreEnvoi={attendreEnvoi} menuPrincipal={vi.fn(async () => true)} />);
  fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder maintenant' }));
  expect((screen.getByRole('button', { name: 'Menu principal' }) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => finir());
  expect((screen.getByRole('button', { name: 'Menu principal' }) as HTMLButtonElement).disabled).toBe(false);
});

it('ouvre le monde et conserve le PC fermé grisé', () => {
  const ouvrirPC = vi.fn();
  const ouvrirMonde = vi.fn();
  const { container } = render(<PagePlus ouvrirPC={ouvrirPC} ouvrirMonde={ouvrirMonde} />);
  fireEvent.click(screen.getByRole('button', { name: /Monde Pokémon/ }));
  expect(ouvrirMonde).toHaveBeenCalledOnce();
  const pc = screen.getByRole('button', { name: 'PC de Léo' });
  expect(pc.classList.contains('opacity-60')).toBe(true);
  expect(Array.from(container.querySelectorAll('[data-entree]')).slice(0, 2).map(b => b.getAttribute('data-entree'))).toEqual(['pc', 'pokedex']);
  fireEvent.click(pc);
  expect(ouvrirPC).toHaveBeenCalledOnce();
});

it('ouvre Réglages et rend le focus au retour', () => {
  render(<PagePlus ouvrirPC={vi.fn()} ouvrirMonde={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Réglages' }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { level: 1, name: 'Réglages' }));
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Menu');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Réglages' }));
});

it('masque Menu principal sans prop et protège le retour des doubles clics et échecs', async () => {
  const { rerender } = render(<PagePlus ouvrirPC={vi.fn()} ouvrirMonde={vi.fn()} />);
  expect(screen.queryByRole('button', { name: /Menu principal/ })).toBeNull();
  let terminer!: (ok: boolean) => void;
  const menuPrincipal = vi.fn(() => new Promise<boolean>(resolve => { terminer = resolve; }));
  rerender(<PagePlus ouvrirPC={vi.fn()} ouvrirMonde={vi.fn()} menuPrincipal={menuPrincipal} />);
  const bouton = screen.getByRole('button', { name: /Menu principal/ });
  fireEvent.click(bouton);
  expect((bouton as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(bouton);
  expect(menuPrincipal).toHaveBeenCalledOnce();
  await act(async () => terminer(false));
  expect(screen.getByRole('alert').textContent).toBe('La sauvegarde a échoué : tu restes dans la partie.');
  expect((bouton as HTMLButtonElement).disabled).toBe(false);
  fireEvent.click(bouton);
  await act(async () => terminer(true));
  expect(screen.queryByRole('alert')).toBeNull();
});
