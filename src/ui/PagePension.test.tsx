// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type PokemonPossede } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';
import { PagePension } from './PagePension';
import { EcranCombat } from './EcranCombat';

const stores: StoreJeu[] = [];
beforeAll(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; fireEvent(this, new Event('close')); } },
  });
});
afterEach(() => { cleanup(); stores.splice(0).forEach(s => s.getState().arreter()); });
const pokemon = (uid: string, sexe: PokemonPossede['sexe'] = 'femelle'): PokemonPossede => ({
  uid, numero: 1, sexe, niveau: 15, xp: 0, shiny: false, bonheur: 0, calcium: 0, favori: false, pierreEternelle: false,
});
function preparer(ouvert = true, pleine = false, nouvelle = false) {
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.ecrireCompte(compteInitial());
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, argent: 12500,
    equipe: pleine ? Array.from({ length: 6 }, (_, i) => pokemon(`actif-${i}`)) : [pokemon('actif')], pc: [pokemon('mere'), { ...pokemon('pere', 'male'), shiny: true }],
    bossVaincus: ouvert ? ['kanto.tour-pokemon'] : [],
    pension: { parents: [], emplacementsOeuf: 1, oeufs: nouvelle ? [] : [{ ...pokemon('oeuf'), numero: 150, sexe: 'sansSexe', oeuf: { pasRestants: 25, pasMax: 25 } }] },
  });
  const store = creerStoreJeu({ stockage, horloge, alea: () => 0, genererId: () => 'nouveau' });
  store.getState().demarrer(); stores.push(store);
  return store;
}

it('dépose depuis le PC, affiche le refus du cœur et retire les parents', () => {
  const store = preparer();
  const { container } = render(<PagePension store={store} retour={vi.fn()} />);
  expect(container.querySelectorAll('.pension-pc')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Les parents' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Parents' })).toBeTruthy();
  expect(screen.getByRole('region', { name: 'Œufs' })).toBeTruthy();
  fireEvent.click(screen.getAllByRole('button', { name: 'Déposer un parent' })[0]!);
  fireEvent.click(within(screen.getByRole('region', { name: 'Équipe' })).getByRole('button', { name: /Déposer Bulbizarre/ }));
  expect(screen.getByRole('status').textContent).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe("C'est ton dernier Pokémon : garde-le dans l'équipe.");
  expect(store.getState().pension.parents).toHaveLength(0);
  fireEvent.click(within(screen.getByRole('region', { name: 'PC' })).getAllByRole('button')[0]!);
  fireEvent.click(screen.getAllByRole('button', { name: 'Déposer un parent' })[0]!);
  fireEvent.click(within(screen.getByRole('region', { name: 'PC' })).getByRole('button'));
  expect(screen.getByText('4 % par élimination')).toBeTruthy();
  expect(document.querySelector('strong svg[aria-hidden="true"]')).toBeTruthy();
  expect(document.querySelector('img.halo-shiny')?.getAttribute('src')).toBe('img/sprites/pokemon-shiny/1.png');
  expect(document.querySelector('.halo-shiny')).toBeTruthy();
  fireEvent.click(screen.getAllByRole('button', { name: 'Retirer Bulbizarre' })[0]!);
  expect(store.getState().pension.parents).toHaveLength(1);
});

it('cache l’espèce de l’œuf, le prend et achète le prochain emplacement', () => {
  const store = preparer();
  render(<PagePension store={store} retour={vi.fn()} />);
  expect(screen.queryByText(/Mewtwo/)).toBeNull();
  expect(within(screen.getByRole('group', { name: 'Emplacements des œufs' })).getAllByRole('listitem')).toHaveLength(5);
  fireEvent.click(screen.getByRole('button', { name: 'Prendre l’œuf' }));
  expect(store.getState().pension.oeufs).toHaveLength(0);
  expect(store.getState().equipe.some(m => m?.pokemon.uid === 'oeuf')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /Ouvrir · 5/ }));
  expect(store.getState().pension.emplacements).toBe(2);
  expect(screen.getByRole('status').textContent).toBe('Emplacement ouvert. Tu peux accueillir un œuf de plus.');
  expect(screen.getByText("Pas assez d'argent.")).toBeTruthy();
});

it('présente la raison d’accès fermé et la sortie', () => {
  const retour = vi.fn();
  render(<PagePension store={preparer(false)} retour={retour} />);
  expect(screen.getByRole('status').textContent).toBe('Bats le boss de Tour Pokémon.');
  expect(screen.queryByRole('button', { name: 'Déposer un parent' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Retour à Bourg Palette' }));
  expect(retour).toHaveBeenCalledOnce();
});

it('signale une seule entrée au montage', () => {
  const store = preparer(true, false, true);
  expect(store.getState().pension.nouveau).toBe(true);
  const entrer = vi.spyOn(store.getState(), 'entrerALaPension');
  render(<PagePension store={store} retour={vi.fn()} />);
  expect(entrer).toHaveBeenCalledOnce();
  expect(store.getState().pension.nouveau).toBe(false);
});

it('recherche, montre les chances du cœur et rend le focus après dépôt et annulation', () => {
  const store = preparer();
  render(<PagePension store={store} retour={vi.fn()} />);
  const ouvrir = screen.getAllByRole('button', { name: 'Déposer un parent' })[0]!;
  fireEvent.click(ouvrir);
  expect(screen.getByRole('dialog', { name: 'Choisir un parent' })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('searchbox', { name: 'Nom ou numéro' }));
  expect(screen.queryByText(/% · même/)).toBeNull();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: '025' } });
  expect(within(screen.getByRole('region', { name: 'PC' })).queryByRole('button')).toBeNull();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Bulbizarre' } });
  fireEvent.click(within(screen.getByRole('region', { name: 'PC' })).getAllByRole('button')[0]!);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Retirer Bulbizarre' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  const second = screen.getAllByRole('button', { name: 'Déposer un parent' })[0]!;
  fireEvent.click(second);
  expect(screen.getByText('4 % · même espèce')).toBeTruthy();
  expect(screen.getByText('0 % · même sexe')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(document.activeElement).toBe(second);
  fireEvent.click(second);
  fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(second);
});

it.each([false, true])('retire un parent et prend un œuf avec équipe pleine : %s', pleine => {
  const store = preparer(true, pleine);
  store.getState().deposerParent('mere');
  render(<PagePension store={store} retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Retirer Bulbizarre' }));
  expect(screen.getByRole('status').textContent).toBe(`Bulbizarre rejoint ${pleine ? 'PC (équipe pleine)' : 'ton équipe'}.`);
  expect(pleine ? store.getState().pc.some(p => p.uid === 'mere') : store.getState().equipe.some(m => m?.pokemon.uid === 'mere')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Prendre l’œuf' }));
  expect(screen.getByRole('status').textContent).toBe(`L’œuf rejoint ${pleine ? 'PC (équipe pleine)' : 'ton équipe'}.`);
  expect(pleine ? store.getState().pc.some(p => p.uid === 'oeuf') : store.getState().equipe.some(m => m?.pokemon.uid === 'oeuf')).toBe(true);
});

it('ouvre depuis Bourg Palette et rend le focus au bouton Pension à la sortie', () => {
  const store = preparer();
  render(<EcranCombat store={store} />);
  fireEvent.click(screen.getByRole('button', { name: 'Pension Pokémon' }));
  expect(screen.getByRole('heading', { name: 'Pension' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Retour à Bourg Palette' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pension Pokémon' }));
  expect(store.getState().lieu?.id).toBe('kanto.bourg-palette');
});
