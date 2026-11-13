// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { tutoriel } from '../../core/tutoriels';
import { storeSac } from '../sacContexte';
import { storeJeu } from '../store';
import { fermerTuto, lancerTuto, storeTuto } from './store-tuto';
import { Tutoriel } from './Tutoriel';

vi.mock('../store', () => ({ armementTutoAutorise: () => true, storeJeu: createStore(() => ({ eliminations: 0, tutosVus: [] as string[], tutoAArmer: vi.fn(() => null), marquerTutoVu: vi.fn() })) }));
beforeEach(() => {
  vi.stubGlobal('ResizeObserver', class { observe() {} disconnect() {} });
  vi.stubGlobal('requestAnimationFrame', (f: FrameRequestCallback) => setTimeout(f, 0));
  vi.stubGlobal('cancelAnimationFrame', clearTimeout);
});
afterEach(() => { cleanup(); fermerTuto(); storeSac.setState({ ouvert: false }); vi.clearAllMocks(); vi.unstubAllGlobals(); });

it('présente le PC sans compteur et termine en le marquant vu', () => {
  lancerTuto('pc', true);
  const aller = vi.fn();
  render(<Tutoriel page="PC" aller={aller} />);
  expect(aller).toHaveBeenCalledWith('PC');
  expect(screen.getByRole('region', { name: 'Tutoriel Le PC' })).toBeTruthy();
  expect(screen.getByText(tutoriel('pc').etapes[0]!.texte)).toBeTruthy();
  expect(screen.queryByText('1/1')).toBeNull();
  fireEvent.click(screen.getByText('Compris'));
  expect(storeTuto.getState().actif).toBeNull();
  expect(storeJeu.getState().marquerTutoVu).toHaveBeenCalledWith('pc');
});
it('enchaîne les deux étapes de la pension', () => {
  lancerTuto('pension', true); render(<Tutoriel page="Pension" aller={vi.fn()} />);
  expect(screen.getByText('1/2')).toBeTruthy();
  fireEvent.click(screen.getByText('Suivant'));
  expect(screen.getByText('2/2')).toBeTruthy();
  fireEvent.click(screen.getByText('Compris'));
  expect(storeTuto.getState().actif).toBeNull();
});
it('permet de passer avec une annonce', () => {
  lancerTuto('route-1'); render(<Tutoriel page="Combat" aller={vi.fn()} />);
  fireEvent.click(screen.getByText('Passer le tuto'));
  expect(storeTuto.getState().actif).toBeNull();
  expect(storeJeu.getState().marquerTutoVu).toHaveBeenCalledWith('route-1');
  expect(screen.getByText('Tuto passé. Rejoue-le depuis le Guide.')).toBeTruthy();
});
it('avance uniquement au clic sur la cible', () => {
  const i = tutoriel('route-1').etapes.findIndex(e => e.action === 'clic');
  lancerTuto('route-1'); storeTuto.setState({ actif: { id: 'route-1', etape: i, rejeu: false } });
  render(<><button data-tuto={tutoriel('route-1').etapes[i]!.cible!}>Cible</button><Tutoriel page="Combat" aller={vi.fn()} /></>);
  fireEvent.click(document.body); expect(storeTuto.getState().actif?.etape).toBe(i);
  fireEvent.click(screen.getByText('Cible')); expect(storeTuto.getState().actif?.etape).toBe(i + 1);
});
it('avance à l’ouverture du Sac', () => {
  const i = tutoriel('route-1').etapes.findIndex(e => e.action === 'sac');
  lancerTuto('route-1'); storeTuto.setState({ actif: { id: 'route-1', etape: i, rejeu: false } });
  render(<Tutoriel page="Combat" aller={vi.fn()} />);
  act(() => storeSac.setState({ ouvert: true }));
  expect(storeTuto.getState().actif?.etape).not.toBe(i);
});
it('masque la couche pendant une modale puis la réaffiche', async () => {
  lancerTuto('pc'); const vue = render(<><dialog open /><Tutoriel page="PC" aller={vi.fn()} /></>);
  expect(screen.queryByRole('region')).toBeNull();
  vue.rerender(<Tutoriel page="PC" aller={vi.fn()} />);
  await waitFor(() => expect(screen.getByRole('region')).toBeTruthy());
});
it('arme le tutoriel proposé par le jeu', () => {
  vi.mocked(storeJeu.getState().tutoAArmer).mockReturnValueOnce('route-1');
  render(<Tutoriel page="Combat" aller={vi.fn()} />);
  expect(storeTuto.getState().actif?.id).toBe('route-1');
});
