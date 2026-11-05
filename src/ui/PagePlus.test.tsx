// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { chargerPokemon } from '../core/pokemon';
import { PagePlus } from './PagePlus';
import { creerStoreJeu, storeJeu } from './store';
import { afficherProgression } from './store-progression';
import { formaterDps } from './nombres';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));

it('réserve le diplôme aux détenteurs et ouvre sa fenêtre depuis Menu', () => {
  const { unmount } = render(<PagePlus ouvrirPC={vi.fn()} />);
  expect(screen.queryByRole('button', { name: 'Diplôme du Pokédex' })).toBeNull();
  unmount();
  storeJeu.setState({ fin: { diplome: { nom: 'Nicolas', date: '2026-10-25T00:00:00Z' }, credits: false } });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
  try {
    render(<PagePlus ouvrirPC={vi.fn()} />);
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

it('garde le relevé replié et active le journal local avec accès console', () => {
  render(<PagePlus ouvrirPC={vi.fn()} />);
  const panneau = screen.getByText('Relevé de partie (développement)').closest('details')!;
  expect(panneau.open).toBe(false);
  expect(window.pokiJournal).toBeUndefined();
  panneau.open = true;
  const interrupteur = within(panneau).getByRole('switch');
  expect(interrupteur.getAttribute('aria-checked')).toBe('false');
  fireEvent.click(interrupteur);
  expect(interrupteur.getAttribute('aria-checked')).toBe('true');
  expect(localStorage.getItem('pokiclicker-dev:journal-actif')).toBe('1');
  expect(window.pokiJournal?.exporter()).toEqual(storeJeu.getState().exporterJournal());
  fireEvent.click(interrupteur);
  expect(window.pokiJournal).toBeUndefined();
});

it('exporte le journal courant par Blob et confirme avant de l’effacer', async () => {
  render(<PagePlus ouvrirPC={vi.fn()} />);
  screen.getByText('Relevé de partie (développement)').closest('details')!.open = true;
  fireEvent.click(screen.getByRole('switch', { name: /Relevé de partie/ }));
  const exporter = vi.spyOn(storeJeu.getState(), 'exporterJournal');
  const effacer = vi.spyOn(storeJeu.getState(), 'effacerJournal');
  const creer = vi.fn(() => 'blob:releve');
  const revoquer = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: creer, revokeObjectURL: revoquer });
  const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toMatch(/^poki-releve-\d{4}-\d{2}-\d{2}\.json$/);
    expect(this.isConnected).toBe(true);
  });
  fireEvent.click(screen.getByRole('button', { name: 'Exporter le relevé' }));
  expect(exporter).toHaveBeenCalledOnce();
  expect(clic).toHaveBeenCalledOnce();
  const blob = creer.mock.calls[0] as unknown as [Blob];
  expect(blob[0].type).toBe('application/json');
  const texte = await new Promise<string>(resolve => {
    const lecteur = new FileReader();
    lecteur.onload = () => resolve(String(lecteur.result));
    lecteur.readAsText(blob[0]);
  });
  expect(JSON.parse(texte)).toEqual(exporter.mock.results[0]!.value);
  expect(document.querySelector('a[download]')).toBeNull();
  expect(revoquer).toHaveBeenCalledWith('blob:releve');
  const confirmer = vi.spyOn(window, 'confirm').mockReturnValue(false);
  fireEvent.click(screen.getByRole('button', { name: 'Effacer le relevé' }));
  expect(confirmer).toHaveBeenCalledOnce();
  expect(effacer).not.toHaveBeenCalled();
  confirmer.mockReturnValue(true);
  fireEvent.click(screen.getByRole('button', { name: 'Effacer le relevé' }));
  expect(effacer).toHaveBeenCalledOnce();
  expect(window.pokiJournal?.exporter()?.zones).toEqual({});
});

it('propose le PC avant le Pokédex et appelle ouvrirPC', () => {
  const ouvrirPC = vi.fn();
  const { container } = render(<PagePlus ouvrirPC={ouvrirPC} />);
  // Prépare la vue historique ; les ajouts du tableau de bord sont vérifiés séparément.
  container.querySelectorAll('section[aria-labelledby]').forEach(section => section.remove());
  screen.getByText('Relevé de partie (développement)').closest('details')!.remove();
  container.querySelector('[data-entree="badges"]')?.closest('li')?.remove();
  container.querySelector('[data-prochain-palier]')?.remove();
  screen.getByRole('button', { name: 'Guide du jeu' }).remove();
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Menu');
  const liste = screen.getByRole('list');
  expect(within(liste).getAllByRole('listitem')).toHaveLength(2);
  expect(within(liste).getAllByRole('button').map(b => b.textContent)).toEqual(['PC de Léo', 'Pokédex 3 / 151']);
  fireEvent.click(screen.getByRole('button', { name: 'PC de Léo' }));
  expect(ouvrirPC).toHaveBeenCalledOnce();
  expect(container.textContent).toBe('MenuPC de LéoPokédex 3 / 151');
  expect(container.querySelector('[class~="bg-action"]')).toBeNull();
});

it('ouvre le Guide du jeu depuis Menu et rend le focus au bouton à la fermeture (AL)', () => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; } },
  });
  try {
    render(<PagePlus ouvrirPC={vi.fn()} />);
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
  const { container } = render(<PagePlus ouvrirPC={vi.fn()} />);
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
  const { container } = render(<PagePlus ouvrirPC={vi.fn()} />);
  const aventure = screen.getByRole('region', { name: 'Ton aventure' });
  expect(aventure.textContent).toBe(`Ton aventureStatistiquesRégionKanto · ${storeJeu.getState().lieu!.nom}Pokédex24 / 151Badges2 / 8DPS${formaterDps(storeJeu.getState().dps)}`);
  expect(screen.getByRole('list').textContent).toBe('PC de LéoPokédex 24 / 151Prochain palier : 30 (Collectionneur) · Encore 6 espèces.Badges');
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
