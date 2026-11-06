// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PokedexTelephone } from './PokedexTelephone';
import { creerStoreJeu, storeJeu } from './store';
import { formaterProchainPalier } from './store-progression';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));
Object.defineProperties(HTMLDialogElement.prototype, {
  showModal: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) },
  close: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event('close'));
  }) },
});
vi.mock('./store', async original => ({
  ...await original<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

beforeEach(() => {
  localStorage.clear();
  contexte.store = creerStoreJeu({
    horloge: { maintenant: () => 0 },
    stockage: {
      lire: cle => localStorage.getItem(cle),
      ecrire: (cle, valeur) => localStorage.setItem(cle, valeur),
      supprimer: cle => localStorage.removeItem(cle),
      cles: () => Object.keys(localStorage),
    },
    alea: () => 0.5,
    genererId: () => 'test-pokedex',
  });
  storeJeu.getState().demarrer();
  const progression = storeJeu.getState().progression;
  storeJeu.setState({ pokedex: [1, 4, 25], progression: {
    ...progression,
    prochain: { palier: 10, titre: 'Collection', restantes: 7 },
    paliers: progression.paliers.map((palier, index) => ({ ...palier, recu: index === 0 })),
  } });
});
afterEach(() => {
  cleanup();
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
});

function rechercher(value: string) {
  fireEvent.change(screen.getByRole('searchbox', { name: 'Nom ou numéro' }), { target: { value } });
}

it.each(['Dans ton équipe', 'Rangé dans ton PC', 'Enregistré au Pokédex'])(
  'ouvre une capture : %s', localisation => {
    const equipe = (localisation === 'Dans ton équipe' ? [null, { pokemon: { numero: 1 } }] : []) as ReturnType<typeof storeJeu.getState>['equipe'];
    const pc = (localisation !== 'Enregistré au Pokédex' ? [{ numero: 1 }] : []) as ReturnType<typeof storeJeu.getState>['pc'];
    storeJeu.setState({ equipe, pc });
    render(<PokedexTelephone retour={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Bulbizarre, numéro 1,/ }));
    const fiche = screen.getByRole('dialog', { name: 'Bulbizarre · N° 1' });
    expect(within(fiche).getByText('Déjà capturé')).toBeTruthy();
    expect(within(fiche).getByText(localisation)).toBeTruthy();
    expect(within(fiche).getByText('Plante').classList.contains('pastille-type-grass')).toBe(true);
    expect(within(fiche).getByText('Poison').classList.contains('pastille-type-poison')).toBe(true);
    expect(within(fiche).getByAltText('Bulbizarre').classList.contains('size-32')).toBe(true);
  },
);

it('ouvre une silhouette inconnue sans révéler son nom ni ses types', () => {
  render(<PokedexTelephone retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Pokémon inconnu, numéro 12' }));
  const fiche = screen.getByRole('dialog', { name: '??? · N° 12' });
  expect(within(fiche).getByRole('status').textContent)
    .toBe('Capture ce Pokémon pour découvrir son nom et ses types.');
  expect(within(fiche).queryByText(/Papilusion/)).toBeNull();
  expect(fiche.querySelector('.pastille-type')).toBeNull();
  expect(within(fiche).getByAltText('Pokémon inconnu').classList.contains('brightness-0')).toBe(true);
});

it.each(['croix', 'Échap', 'fond'])('ferme par %s et rend le focus à la case', moyen => {
  render(<PokedexTelephone retour={vi.fn()} />);
  const caseEspece = screen.getByRole('button', { name: /Bulbizarre, numéro 1,/ });
  caseEspece.focus();
  fireEvent.click(caseEspece);
  const fiche = screen.getByRole('dialog');
  const fermer = within(fiche).getByRole('button', { name: 'Fermer la fiche du Pokédex' });
  expect(document.activeElement).toBe(fermer);
  fireEvent.pointerDown(within(fiche).getByRole('heading'));
  expect(screen.getByRole('dialog')).toBe(fiche);
  if (moyen === 'croix') fireEvent.click(fermer);
  else if (moyen === 'Échap') {
    const evenement = new Event('cancel', { cancelable: true });
    fireEvent(fiche, evenement);
    expect(evenement.defaultPrevented).toBe(true);
  } else fireEvent.pointerDown(fiche);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(caseEspece);
});

it('affiche la progression et les paliers repliables', () => {
  const { container } = render(<PokedexTelephone retour={vi.fn()} />);
  expect(screen.getByText('3 / 151')).toBeTruthy();
  const barre = screen.getByRole('progressbar');
  expect(barre.getAttribute('aria-valuenow')).toBe('3');
  expect(barre.getAttribute('aria-valuemax')).toBe('151');
  expect(barre.getAttribute('aria-valuemin')).toBe('0');
  expect(container.querySelector('[data-prochain-palier]')?.textContent)
    .toBe(formaterProchainPalier(storeJeu.getState().progression.prochain));
  const details = container.querySelector('details')!;
  expect(details.open).toBe(false);
  fireEvent.click(within(details).getByText(/Paliers du Pokédex · 1 sur/));
  expect(details.open).toBe(true);
  expect(within(details).getAllByRole('listitem')).toHaveLength(storeJeu.getState().progression.paliers.length);
});

it('cherche uniquement les noms capturés et normalise la saisie', () => {
  render(<PokedexTelephone retour={vi.fn()} />);
  rechercher(' PÍKA ');
  expect(screen.getByRole('button', { name: 'Pikachu, numéro 25, déjà capturé' })).toBeTruthy();
  expect(screen.getByText('1 espèce affichée')).toBeTruthy();
  rechercher('Papilusion');
  expect(screen.queryByRole('button', { name: /numéro/ })).toBeNull();
  expect(screen.getByText('Aucune espèce capturée ne correspond à « Papilusion ».')).toBeTruthy();
  expect(screen.getByText('Les espèces non capturées restent cachées : cherche-les par leur numéro.')).toBeTruthy();
});

it.each(['12', 'n°12', '#12', 'n12'])('cherche un inconnu avec %s', saisie => {
  render(<PokedexTelephone retour={vi.fn()} />);
  rechercher(saisie);
  expect(screen.getByRole('button', { name: 'Pokémon inconnu, numéro 12' })).toBeTruthy();
  expect(screen.getByText('1 espèce affichée')).toBeTruthy();
});

it('filtre les captures et les inconnus avec les accords et le message vide', () => {
  render(<PokedexTelephone retour={vi.fn()} />);
  expect(screen.getByText('151 espèces affichées')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'À trouver' }));
  expect(screen.queryByRole('button', { name: /déjà capturé/ })).toBeNull();
  expect(screen.getByText('148 espèces affichées')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'À trouver' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Capturées' }));
  expect(screen.getByText('3 espèces affichées')).toBeTruthy();
  expect(screen.getAllByText('Capturé')).toHaveLength(3);
  cleanup();
  storeJeu.setState({ pokedex: [] });
  render(<PokedexTelephone retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Capturées' }));
  expect(screen.getByText('Rien à montrer avec ce filtre.')).toBeTruthy();
});

it('propose le diplôme facultatif, le retour et des cibles tactiles', () => {
  const retour = vi.fn();
  const ouvrirDiplome = vi.fn();
  const { container, rerender } = render(<PokedexTelephone retour={retour} />);
  expect(screen.queryByRole('button', { name: /Diplôme du Pokédex/ })).toBeNull();
  rerender(<PokedexTelephone retour={retour} ouvrirDiplome={ouvrirDiplome} />);
  fireEvent.click(screen.getByRole('button', { name: /Diplôme du Pokédex/ }));
  expect(ouvrirDiplome).toHaveBeenCalledOnce();
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(retour).toHaveBeenCalledOnce();
  for (const cible of container.querySelectorAll('button, input, summary')) {
    expect(cible.classList.contains('min-h-11')).toBe(true);
  }
});
