// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { FenetreSac } from './FenetreSac';
import { Coquille } from './Coquille';
import { creerStoreJeu, storeJeu } from './store';
import { ouvrirSac, reinitialiserSac, storeSac } from './sacContexte';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));
vi.mock('./store', async (importOriginal) => ({
  ...await importOriginal<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

beforeEach(() => {
  reinitialiserSac();
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
    genererId: () => 'test-sac',
  });
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } },
  });
});
afterEach(() => {
  cleanup();
  reinitialiserSac();
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});

it('ouvre à la demande et ferme en rendant le focus', () => {
  render(<><button>Déclencheur</button><FenetreSac /></>);
  const bouton = screen.getByRole('button', { name: 'Déclencheur' });
  bouton.focus();
  expect(screen.queryByRole('dialog')).toBeNull();
  act(ouvrirSac);
  expect(screen.getByRole('dialog', { name: 'Ton Sac' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  expect(storeSac.getState().ouvert).toBe(false);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(bouton);
});

it('transmet un objet visant un Pokémon et ferme sans rendre le focus', () => {
  storeJeu.setState({ sac: { acces: { ouvert: true, raison: null }, entrees: [
    { id: 'candy', nom: 'Bonbon', description: 'Ajoute un niveau.', image: null,
      categorie: 'soins', quantite: 2, actif: false, utilisable: 'bonbon' },
  ] } });
  render(<><button>Déclencheur</button><FenetreSac /></>);
  const bouton = screen.getByRole('button', { name: 'Déclencheur' });
  bouton.focus();
  act(ouvrirSac);
  screen.getByRole('button', { name: 'Bonbon ×2' }).focus();
  fireEvent.click(screen.getByRole('button', { name: 'Bonbon ×2' }));
  expect(storeSac.getState()).toMatchObject({ ouvert: false, objet: { type: 'bonbon', cle: 'candy', nom: 'Bonbon' } });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).not.toBe(bouton);
});

it('ouvre le Sac dans la coque sur Combat puis Équipe', () => {
  render(<Coquille />);
  for (const onglet of ['Combat', 'Équipe']) {
    fireEvent.click(screen.getByRole('button', { name: onglet }));
    act(ouvrirSac);
    expect(screen.getByRole('dialog', { name: 'Ton Sac' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  }
});
