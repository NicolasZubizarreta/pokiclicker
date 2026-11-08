// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { DialogueDeconnexion } from './DialogueDeconnexion';
const affichage = vi.hoisted(() => ({ telephone: false }));
vi.mock('../useTelephone', () => ({ useTelephone: () => affichage.telephone }));

afterEach(cleanup);
beforeEach(() => {
  affichage.telephone = false;
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
});
const props = () => ({ quandConfirmer: vi.fn(), quandAnnuler: vi.fn(), quandReessayer: vi.fn(), quandRester: vi.fn() });
it.each(['confirmer', 'confirmer-attente'] as const)('confirme et annule %s avec le focus et Échap', etat => {
  const p = props();
  render(<DialogueDeconnexion {...p} etat={etat} />);
  const dialogue = screen.getByRole('dialog', { name: 'Se déconnecter ?' });
  expect(dialogue.hasAttribute('open')).toBe(true);
  expect(dialogue.getAttribute('aria-modal')).toBe('true');
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Se déconnecter ?' }));
  expect(screen.getByText(etat === 'confirmer' ? 'Ta partie est à jour. Tu pourras te reconnecter quand tu veux.' : "Ta dernière progression n'est pas encore envoyée en ligne. Elle sera sauvegardée avant la déconnexion.")).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: etat === 'confirmer' ? 'Se déconnecter' : 'Sauvegarder et se déconnecter' }));
  expect(p.quandConfirmer).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: etat === 'confirmer' ? 'Annuler' : 'Rester connecté' }));
  fireEvent.keyDown(dialogue, { key: 'Escape' });
  fireEvent(dialogue, new Event('cancel', { cancelable: true }));
  expect(p.quandAnnuler).toHaveBeenCalledTimes(3);
});
it.each([false, true])('bloque la sortie pendant la sauvegarde puis permet de réessayer ou rester (téléphone : %s)', telephone => {
  affichage.telephone = telephone;
  const p = props();
  const { rerender } = render(<DialogueDeconnexion {...p} etat="chargement" />);
  const attente = screen.getByRole('alertdialog', { name: 'Sauvegarde en cours' });
  expect(attente.getAttribute('aria-modal')).toBe('true');
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: 'Sauvegarde en cours…' }));
  expect(screen.getByText("Ne ferme pas la page et ne quitte pas l'application. Tu seras déconnecté dès que ta partie sera sauvegardée.")).toBeTruthy();
  if (telephone) expect(screen.queryByRole('button')).toBeNull();
  else expect((screen.getByRole('button', { name: 'Fermer' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.keyDown(attente, { key: 'Escape' });
  fireEvent(attente, new Event('cancel', { cancelable: true }));
  expect(p.quandAnnuler).not.toHaveBeenCalled();
  rerender(<DialogueDeconnexion {...p} etat="echec" />);
  expect(screen.getByRole('alertdialog', { name: 'Échec de la sauvegarde' }).hasAttribute('open')).toBe(true);
  expect(document.activeElement).toBe(screen.getByRole('heading', { name: "La sauvegarde n'a pas abouti" }));
  expect(screen.getByText("Ta progression n'a pas été envoyée en ligne. Vérifie ta connexion, puis réessaie. Tant que ce n'est pas fait, tu restes connecté et ta partie reste sur cet appareil.")).toBeTruthy();
  expect(screen.getAllByRole('button')).toHaveLength(telephone ? 2 : 3);
  fireEvent.click(screen.getByRole('button', { name: 'Réessayer' }));
  fireEvent.click(screen.getByRole('button', { name: 'Rester connecté' }));
  expect(p.quandReessayer).toHaveBeenCalledTimes(1);
  expect(p.quandRester).toHaveBeenCalledTimes(1);
  expect(p.quandConfirmer).not.toHaveBeenCalled();
});

it.each(['confirmer', 'confirmer-attente', 'chargement', 'echec'] as const)('barre de titre réservée au PC : %s', etat => {
  const { container, rerender } = render(<DialogueDeconnexion {...props()} etat={etat} />);
  expect(container.querySelector('.fenetre-titre')?.contains(screen.getByRole('heading'))).toBe(true);
  expect(screen.getByRole('button', { name: 'Fermer' })).toBeTruthy();
  affichage.telephone = true;
  rerender(<DialogueDeconnexion {...props()} etat={etat} />);
  expect(container.querySelector('.fenetre-titre')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Fermer' })).toBeNull();
});
