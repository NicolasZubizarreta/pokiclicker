// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { BarreLaterale } from './BarreLaterale';
import { storeJeu } from './store';

afterEach(cleanup);
it('présente huit entrées, active PC et conserve les noms accessibles', () => {
  const choisir = vi.fn();
  render(<BarreLaterale page="PC" choisir={choisir} />);
  const navigation = within(screen.getByRole('navigation'));
  expect(navigation.getAllByRole('button').length).toBe(8);
  for (const nom of ['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Pokédex', 'Menu']) {
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
it.each([false, true])('place « Pension » entre Pokédex et Menu avec les touches 7 et 8 (débloquée : %s)', ouvert => {
  storeJeu.setState({ pension: { ...storeJeu.getState().pension, acces: { ouvert, raison: null } } });
  const choisir = vi.fn();
  render(<BarreLaterale page="Pension" choisir={choisir} />);
  const navigation = within(screen.getByRole('navigation'));
  const boutons = navigation.getAllByRole('button');
  expect(boutons.map(b => b.textContent?.replace(/\d+$/, ''))).toEqual(['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Pokédex', 'Pension', 'Menu']);
  expect(boutons.map(b => b.querySelector('kbd')?.textContent)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
  const bouton = navigation.getByRole('button', { name: 'Pension' });
  expect(bouton.getAttribute('aria-current')).toBe('page');
  fireEvent.click(bouton);
  if (ouvert) expect(choisir).toHaveBeenCalledWith('Pension');
  else {
    expect(bouton.getAttribute('aria-disabled')).toBe('true');
    expect(choisir).not.toHaveBeenCalled();
    expect(screen.getByRole('status').textContent).toBe('Bientôt disponible.');
  }
  storeJeu.setState({ pension: { ...storeJeu.getState().pension, acces: { ouvert: false, raison: null } } });
});
