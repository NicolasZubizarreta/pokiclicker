// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ZoneCompte } from './ZoneCompte';
import { storeJeu } from '../store';

vi.mock('./EcranMonCompte', () => ({ ContenuMonCompte: () => <h1 tabIndex={-1}>Mon compte</h1> }));
vi.mock('../PageReglages', () => ({ PageReglages: () => <h1 tabIndex={-1}>Réglages</h1> }));
afterEach(cleanup);
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
const props = () => ({ parties: [{ id: 'a', nom: 'Voyage', regionCourante: 'kanto', zoneId: '', tempsJeuMs: 0, ecritLe: '2026-11-04T12:00:00Z', surServeur: true, courante: false }], horsConnexion: false, chargement: false, occupe: false, erreur: '', quandJouer: vi.fn(), quandCreer: vi.fn(), quandSupprimer: vi.fn(), compte: storeJeu.getState().compte, registre: [], etatSynchro: 'ok' as const, quandDeconnecter: vi.fn() });
it('ouvre les trois onglets et place le focus sur leur titre', () => {
  render(<ZoneCompte {...props()} />);
  const nav = screen.getByRole('navigation', { name: 'Zone compte' });
  expect(within(nav).getAllByRole('button')).toHaveLength(3);
  for (const [onglet, titre] of [['Compte', 'Mon compte'], ['Réglages', 'Réglages'], ['Parties', 'Mes parties']]) {
    const bouton = within(nav).getByRole('button', { name: onglet });
    fireEvent.click(bouton);
    expect(bouton.getAttribute('aria-current')).toBe('page');
    expect(nav.querySelectorAll('[aria-current="page"]')).toHaveLength(1);
    expect(document.activeElement).toBe(screen.getByRole('heading', { name: titre }));
  }
});
it('présente la carte et une confirmation modale annulable au clavier', () => {
  const p = props(); render(<ZoneCompte {...p} />);
  const carte = screen.getByRole('article', { name: 'Voyage' });
  expect(within(carte).getByText('À jour')).toBeTruthy();
  expect(carte.querySelectorAll('dt')).toHaveLength(3);
  expect(within(carte).getByRole('button', { name: 'Jouer Voyage' }).classList.contains('min-h-12')).toBe(true);
  const bouton = within(carte).getByRole('button', { name: 'Supprimer Voyage' });
  fireEvent.click(bouton);
  expect(p.quandSupprimer).not.toHaveBeenCalled();
  const dialogue = screen.getByRole('dialog');
  expect(dialogue.hasAttribute('open')).toBe(true); // modale native : le reste de la page est inerte, sans `inert` sur le parent.
  expect(document.activeElement).toBe(within(dialogue).getByRole('heading'));
  fireEvent.keyDown(document.activeElement!, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull(); expect(document.activeElement).toBe(bouton);
  fireEvent.click(bouton); fireEvent.click(screen.getByRole('button', { name: 'Oui, supprimer' }));
  expect(p.quandSupprimer).toHaveBeenCalledExactlyOnceWith('a');
});
it('valide la nouvelle partie et garde une seule alerte applicative', () => {
  const p = props(); render(<ZoneCompte {...p} erreur="Échec" />);
  fireEvent.click(screen.getByRole('button', { name: 'Nouvelle partie' }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Nouvelle partie' }));
  const champ = screen.getByLabelText('Nom de la partie');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Créer la partie' }));
  expect(champ.getAttribute('aria-invalid')).toBe('true');
  expect(p.quandCreer).not.toHaveBeenCalled();
  fireEvent.change(champ, { target: { value: ' Voyage ' } });
  expect(screen.queryByText('Donne un nom à ta partie.')).toBeNull();
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Créer la partie' }));
  expect(p.quandCreer).toHaveBeenCalledExactlyOnceWith('Voyage');
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Mes parties' }));
});
it('désactive les gestes pendant une opération et réserve Continuer au jeu monté', () => {
  const p = props(); const retour = vi.fn();
  const { rerender } = render(<ZoneCompte {...p} parties={[{ ...p.parties[0]!, courante: true }]} />);
  expect(screen.queryByRole('button', { name: 'Continuer Voyage' })).toBeNull();
  rerender(<ZoneCompte {...p} parties={[{ ...p.parties[0]!, courante: true }]} quandRetourJeu={retour} />);
  fireEvent.click(screen.getByRole('button', { name: 'Continuer Voyage' })); expect(retour).toHaveBeenCalledOnce();
  rerender(<ZoneCompte {...p} occupe />);
  for (const bouton of screen.getAllByRole('button')) { expect((bouton as HTMLButtonElement).disabled).toBe(true); fireEvent.click(bouton); }
  expect(p.quandJouer).not.toHaveBeenCalled(); expect(p.quandSupprimer).not.toHaveBeenCalled(); expect(p.quandCreer).not.toHaveBeenCalled();
});
