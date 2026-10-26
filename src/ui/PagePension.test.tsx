// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire, type PokemonPossede } from '../core/sauvegarde';
import { creerStoreJeu, type StoreJeu } from './store';
import { PagePension } from './PagePension';
import { EcranCombat } from './EcranCombat';

const stores: StoreJeu[] = [];
afterEach(() => { cleanup(); stores.splice(0).forEach(s => s.getState().arreter()); });
const pokemon = (uid: string, sexe: PokemonPossede['sexe'] = 'femelle'): PokemonPossede => ({
  uid, numero: 1, sexe, niveau: 15, xp: 0, shiny: false, bonheur: 0, calcium: 0, favori: false, pierreEternelle: false,
});
function preparer(ouvert = true) {
  const stockage = creerStockageMemoire(), horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.ecrireCompte(compteInitial());
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, argent: 12500,
    equipe: [pokemon('actif')], pc: [pokemon('mere'), { ...pokemon('pere', 'male'), shiny: true }],
    bossVaincus: ouvert ? ['kanto.tour-pokemon'] : [],
    pension: { parents: [], emplacementsOeuf: 1, oeufs: [{ ...pokemon('oeuf'), numero: 150, sexe: 'sansSexe', oeuf: { pasRestants: 25, pasMax: 25 } }] },
  });
  const store = creerStoreJeu({ stockage, horloge, alea: () => 0, genererId: () => 'nouveau' });
  store.getState().demarrer(); stores.push(store);
  return store;
}

it('dépose depuis le PC, affiche le refus du cœur et retire les parents', () => {
  const store = preparer();
  render(<PagePension store={store} retour={vi.fn()} />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Déposer un parent' })[0]!);
  fireEvent.click(within(screen.getByRole('region', { name: 'Équipe' })).getByRole('button', { name: /Déposer Bulbizarre/ }));
  expect(screen.getByRole('status').textContent).toBeTruthy();
  expect(screen.getByRole('status').textContent).toBe("C'est ton dernier Pokémon : garde-le dans l'équipe.");
  expect(store.getState().pension.parents).toHaveLength(0);
  fireEvent.click(within(screen.getByRole('region', { name: 'PC' })).getAllByRole('button')[0]!);
  fireEvent.click(screen.getByRole('button', { name: 'Déposer un parent' }));
  fireEvent.click(within(screen.getByRole('region', { name: 'PC' })).getByRole('button'));
  expect(screen.getByText('4 % par élimination')).toBeTruthy();
  expect(screen.getByLabelText('Shiny')).toBeTruthy();
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
  expect(screen.getByText("Pas assez d'argent.")).toBeTruthy();
});

it('présente la raison d’accès fermé et la sortie', () => {
  const retour = vi.fn();
  render(<PagePension store={preparer(false)} retour={retour} />);
  expect(screen.getByRole('status').textContent).toBe('Bats le boss de Tour Pokémon.');
  expect(screen.queryByRole('button', { name: 'Déposer un parent' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Sortir de la pension' }));
  expect(retour).toHaveBeenCalledOnce();
});

it('ouvre depuis Bourg Palette et rend le focus au bouton Pension à la sortie', () => {
  const store = preparer();
  render(<EcranCombat store={store} />);
  fireEvent.click(screen.getByRole('button', { name: 'Pension Pokémon' }));
  expect(screen.getByRole('heading', { name: 'La pension' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Sortir de la pension' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Pension Pokémon' }));
  expect(store.getState().lieu?.id).toBe('kanto.bourg-palette');
});
