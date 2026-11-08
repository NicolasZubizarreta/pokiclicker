// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BarreLaterale } from './BarreLaterale';

afterEach(cleanup);
it('présente six entrées, active PC et conserve les noms accessibles', () => {
  const choisir = vi.fn();
  render(<BarreLaterale page="PC" choisir={choisir} />);
  const navigation = within(screen.getByRole('navigation'));
  expect(navigation.getAllByRole('button').length).toBe(6);
  for (const nom of ['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Menu']) {
    const bouton = navigation.getByRole('button', { name: nom });
    expect(bouton.getAttribute('aria-current')).toBe(nom === 'PC' ? 'page' : null);
  }
  fireEvent.click(navigation.getByRole('button', { name: 'Combat' }));
  expect(choisir).toHaveBeenCalledWith('Combat');
});
it('garde le nom mais masque le retour et la synchro sans compte', () => {
  render(<BarreLaterale page="Combat" choisir={vi.fn()} nomPartie="Partie de Léo" etatSynchro="ok" />);
  expect(screen.getByText('Partie de Léo')).toBeTruthy();
  expect(screen.queryByText('À jour')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Menu principal' })).toBeNull();
});
it('n’affiche l’état de synchro que pour un problème', () => {
  for (const etat of ['ok', 'inactif'] as const) {
    render(<BarreLaterale page="Combat" choisir={vi.fn()} nomPartie="Partie" quandMenuPrincipal={vi.fn()} etatSynchro={etat} />);
    expect(screen.queryByText(/À jour|en attente/)).toBeNull();
    cleanup();
  }
  for (const [etat, texte] of [['hors-ligne', 'Hors connexion'], ['ailleurs', 'Partie ouverte sur un autre appareil'], ['divergence', 'Mise à jour depuis l’autre appareil'], ['refuse', 'Synchronisation refusée']] as const) {
    render(<BarreLaterale page="Combat" choisir={vi.fn()} nomPartie="Partie" quandMenuPrincipal={vi.fn()} etatSynchro={etat} />);
    expect(screen.getByText(texte)).toBeTruthy();
    cleanup();
  }
});
it('verrouille le retour pendant l’envoi et annonce un échec', async () => {
  let terminer!: (ok: boolean) => void;
  const retour = vi.fn(() => new Promise<boolean>(r => { terminer = r; }));
  render(<BarreLaterale page="Combat" choisir={vi.fn()} quandMenuPrincipal={retour} etatSynchro="hors-ligne" />);
  expect(screen.getByText('Hors connexion')).toBeTruthy();
  const bouton = screen.getByRole('button', { name: 'Menu principal' }) as HTMLButtonElement;
  fireEvent.click(bouton);
  expect(bouton.disabled).toBe(true);
  fireEvent.click(bouton);
  expect(retour).toHaveBeenCalledTimes(1);
  terminer(false);
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', 'La sauvegarde a échoué : tu restes dans la partie.');
  expect(bouton.disabled).toBe(false);
});
