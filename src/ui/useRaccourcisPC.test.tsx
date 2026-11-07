// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useState } from 'react';
import { useRaccourcisPC } from './useRaccourcisPC';
import { storeJeu } from './store';

const aller = vi.fn(), clic = vi.fn();
function Essai({ actif = true }: { actif?: boolean }) {
  const [ouvert, ouvrir] = useState(false);
  useRaccourcisPC({ page: 'Combat', aller, actif, raccourcisOuverts: ouvert, basculerRaccourcis: () => ouvrir(v => !v) });
  return <main id="contenu">
    <input aria-label="Saisie" /><input type="search" aria-label="Recherche" />
    {['attaquer', 'capturer', 'auto', 'arret', 'reglage', 'sac', 'fauchage', 'radar'].map(id =>
      <button key={id} data-raccourci={id} onClick={() => clic(id)}>{id}</button>)}
    <button data-raccourci="balle" aria-pressed="true" onClick={() => clic('balle1')}>Balle 1</button>
    <button data-raccourci="balle" onClick={() => clic('balle2')}>Balle 2</button>
    {ouvert && <dialog open data-raccourcis><button>Premier</button><button>Milieu</button><button>Dernier</button></dialog>}
  </main>;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('matchMedia', () => ({ matches: false }));
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it.each(['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Menu'])('navigue vers %s', page => {
  render(<Essai />);
  fireEvent.keyDown(document, { key: String(['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Menu'].indexOf(page) + 1) });
  expect(aller).toHaveBeenCalledWith(page);
});
it.each([[' ', 'attaquer'], ['Enter', 'attaquer'], ['c', 'capturer'], ['b', 'balle2'], ['a', 'auto'], ['t', 'arret'], ['r', 'reglage'], ['s', 'sac'], ['f', 'fauchage'], ['p', 'radar']])('%s clique %s', (key, action) => {
  render(<Essai />); fireEvent.keyDown(document, { key }); expect(clic).toHaveBeenCalledWith(action);
});
it('ignore saisie, modificateurs, répétition, contrôles absents ou désactivés et activation native', () => {
  render(<Essai />);
  fireEvent.keyDown(screen.getByLabelText('Saisie'), { key: 'c' });
  fireEvent.keyDown(document, { key: 'c', ctrlKey: true });
  fireEvent.keyDown(document, { key: 'c', repeat: true });
  fireEvent.keyDown(screen.getByText('capturer'), { key: 'Enter' });
  screen.getByText('capturer').setAttribute('disabled', '');
  fireEvent.keyDown(document, { key: 'c' });
  screen.getByText('auto').remove(); fireEvent.keyDown(document, { key: 'a' });
  expect(clic).not.toHaveBeenCalled();
});
it('ignore téléphone et état inactif', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  const vue = render(<Essai />); fireEvent.keyDown(document, { key: 'c' });
  vue.unmount(); vi.stubGlobal('matchMedia', () => ({ matches: false }));
  render(<Essai actif={false} />); fireEvent.keyDown(document, { key: 'c' });
  expect(clic).not.toHaveBeenCalled();
});
it('focalise la recherche', () => {
  render(<Essai />); fireEvent.keyDown(document, { key: '/' });
  expect(document.activeElement).toBe(screen.getByLabelText('Recherche'));
});
it('ouvre, piège Tab, bloque les actions puis ferme les raccourcis', async () => {
  const utilisateur = userEvent.setup();
  render(<Essai />); fireEvent.keyDown(document, { key: '?' });
  screen.getByText('Dernier').focus(); await utilisateur.tab();
  expect(document.activeElement).toBe(screen.getByText('Premier'));
  await utilisateur.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByText('Dernier'));
  fireEvent.keyDown(document, { key: 'c' }); expect(clic).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: '?' }); expect(screen.queryByRole('dialog')).toBeNull();
});
it('navigue entre les zones accessibles', () => {
  const naviguer = vi.fn();
  const precedent = storeJeu.getState();
  storeJeu.setState({ allerVers: naviguer, zonePrecedente: { id: 'avant', nom: 'Avant', ouverte: true, raison: null }, zoneSuivante: { id: 'apres', nom: 'Après', ouverte: true, raison: null } });
  render(<Essai />);
  fireEvent.keyDown(document, { key: 'ArrowLeft' }); fireEvent.keyDown(document, { key: 'ArrowRight' });
  expect(naviguer.mock.calls).toEqual([['avant'], ['apres']]);
  storeJeu.setState(precedent);
});
