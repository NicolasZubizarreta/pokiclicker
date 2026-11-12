// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { createStore } from 'zustand/vanilla';
import { FenetreEclosion } from './FenetreEclosion';
import { storeJeu } from './store';
import type { EclosionAffichee } from './store-pension';
import { reglages } from '../core/reglages';

const naissance: EclosionAffichee = { uid: 'a', numero: 1, nom: 'Bulbizarre', shiny: true, sexe: 'femelle', niveau: 1, bonheur: 125,
  marquePourcent: 7, nouvelleEspece: true, especesEcloses: 10, paliersGagnes: [{ id: 'palier', nom: 'Collection', seuil: 10, diamants: 20 }] };
beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.removeAttribute('open'); } },
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
function preparer(file = [naissance]) {
  const store = createStore(() => ({ ...storeJeu.getState(), eclosion: file[0] ?? null }));
  let index = 0;
  const fermer = vi.fn(() => store.setState({ eclosion: file[++index] ?? null }));
  store.setState({ fermerEclosion: fermer });
  const vue = render(<FenetreEclosion store={store} />);
  return { ...vue, store, fermer };
}
it('passe de la scène au résultat complet et déplace le focus', () => {
  preparer();
  const passer = screen.getByRole('button', { name: "Passer l'animation" });
  expect(document.activeElement).toBe(passer);
  expect(screen.getByRole('dialog', { name: 'Ton œuf bouge…' })).toBeTruthy();
  fireEvent.click(passer);
  expect(screen.getByRole('dialog', { name: 'Bulbizarre est né !' })).toBeTruthy();
  for (const texte of ['Niveau 1', 'Femelle', 'Bonheur 125', 'Chromatique !', "Marque d'éclosion · +7 % de dégâts",
    "Bulbizarre garde cette marque pour toujours. Un Pokémon ne la reçoit qu'une fois.",
    `Espèces écloses 10/${reglages.pension.especesTirees}`, 'Nouvelle espèce', /Succès obtenu : 10 espèces écloses/, '+20 diamants reçus.']) {
    expect(screen.getByText(texte)).toBeTruthy();
  }
  expect(screen.getByRole('img', { name: "Marque d'éclosion" })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Continuer' }));
});
it('enchaîne les quatre temps automatiquement', () => {
  const { container } = preparer();
  const scene = () => container.querySelector('.eclosion-scene')?.getAttribute('data-etape');
  expect(scene()).toBe('secousse');
  act(() => vi.advanceTimersByTime(1800)); expect(scene()).toBe('fissure');
  act(() => vi.advanceTimersByTime(900)); expect(scene()).toBe('eclair');
  act(() => vi.advanceTimersByTime(300)); expect(scene()).toBe('revele');
});
it('révèle immédiatement avec mouvement réduit', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
  const { container } = preparer();
  expect(container.querySelector('.eclosion-scene')?.getAttribute('data-etape')).toBe('revele');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Continuer' }));
  act(() => vi.advanceTimersByTime(3000));
  expect(container.querySelector('.eclosion-scene')?.getAttribute('data-etape')).toBe('revele');
});
it('Échap révèle puis ferme ; la naissance suivante recommence et Continuer ferme', () => {
  const { fermer, container } = preparer([naissance, { ...naissance, uid: 'b', shiny: false, sexe: 'sansSexe', nouvelleEspece: false, paliersGagnes: [] }]);
  const echapper = () => fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }));
  echapper(); expect(fermer).not.toHaveBeenCalled();
  echapper(); expect(fermer).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.eclosion-scene')?.getAttribute('data-etape')).toBe('secousse');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: "Passer l'animation" }));
  fireEvent.click(document.activeElement!);
  expect(screen.getByText('Déjà dans ta collection')).toBeTruthy();
  expect(screen.getByText('Sans sexe')).toBeTruthy();
  expect(screen.queryByText('Chromatique !')).toBeNull();
  expect(screen.queryByText(/Succès obtenu/)).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Continuer' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});
