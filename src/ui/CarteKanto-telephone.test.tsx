// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { CarteKanto } from './CarteKanto';
import { storeJeu } from './store';
import { creerHorlogeSysteme } from '../core/clock';
import { compteInitial, creerGestionnaire } from '../core/sauvegarde';
import { reglages } from '../core/reglages';
import { creerStockageLocal } from './stockage-local';

const gestionnaire = creerGestionnaire({ stockage: creerStockageLocal(), horloge: creerHorlogeSysteme(), genererId: () => 'test' });
const compte = compteInitial();
gestionnaire.ecrireCompte({ ...compte,
  preferences: { ...compte.preferences, arretAuto: { ...reglages.depart.preferences.arretAuto, actif: false } } });
let reduit = false;
beforeEach(() => {
  reduit = false;
  storeJeu.getState().demarrer();
  vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({
    matches: requete.includes('max-width') || (reduit && requete.includes('reduce')),
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
  })));
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }) },
    close: { configurable: true, value: vi.fn(function (this: HTMLDialogElement) {
      this.open = false; this.dispatchEvent(new Event('close'));
    }) },
  });
});
afterEach(() => {
  cleanup();
  storeJeu.getState().arreter();
  window.history.replaceState(null, '', '/');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
function afficher({ nom, quandCentre, quandCasino }: {
  nom?: string; quandCentre?: () => void; quandCasino?: () => void;
} = {}) {
  const carte = storeJeu.getState().carte;
  const zone = carte.formes.find(f => f.nom === (nom ?? 'Route 1'))!;
  if (nom) storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => f === zone ? { ...f, ouverte: true, actuelle: false } : f) } });
  const aller = vi.spyOn(storeJeu.getState(), 'allerVers').mockImplementation(() => {});
  const quandArrive = vi.fn();
  return { ...render(<CarteKanto {...{ quandArrive, quandCentre, quandCasino }} />), aller, quandArrive, zone };
}
const avancer = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const vol = reglages.interface.vol;

it('présente les zones en liste et une carte non interactive sur téléphone', () => {
  const { container } = afficher();
  expect(screen.queryByRole('region', { name: 'Ton voyage' })).toBeNull();
  const liste = screen.getByRole('list', { name: 'Zones de Kanto' });
  expect(within(liste).getAllByRole('button')).toHaveLength(storeJeu.getState().carte.formes.filter(f => f.zone !== null).length);
  expect(screen.queryByRole('listbox')).toBeNull();
  const carte = screen.getByRole('img', { name: /Carte de Kanto/ });
  expect(container.querySelector('[data-halos]')).toBeNull();
  expect(within(carte).queryByRole('button')).toBeNull();
  expect(screen.queryByRole('region', { name: 'Zone sélectionnée' })).toBeNull();
});

it('indique la zone actuelle et empêche de toucher une zone fermée sans cadenas', () => {
  const carte = storeJeu.getState().carte;
  const fermee = carte.formes.find(f => f.zone && !f.actuelle && f.nom !== 'Route 1')!;
  storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => f === fermee ? { ...f, ouverte: false, terminee: false } : f) } });
  const { aller } = afficher();
  const liste = within(screen.getByRole('list', { name: 'Zones de Kanto' }));
  const actuelle = carte.formes.find(f => f.actuelle)!;
  expect(liste.getByRole('button', { name: new RegExp(`${actuelle.nom}.*tu es ici`) })).toBeTruthy();
  const bouton = liste.getByRole('button', { name: new RegExp(fermee.nom) });
  expect(bouton.getAttribute('aria-disabled')).toBe('true');
  expect(bouton.textContent).toContain('fermée');
  expect(bouton.parentElement!.querySelector('svg')).toBeNull();
  fireEvent.click(bouton);
  expect(aller).not.toHaveBeenCalled();
});

it('verrouille la liste pendant le vol et arrive une seule fois', () => {
  vi.useFakeTimers();
  const { container, aller, quandArrive, zone } = afficher({ nom: 'Route 1' });
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  for (const bouton of within(screen.getByRole('list', { name: 'Zones de Kanto' })).getAllByRole('button')) {
    expect(bouton.getAttribute('aria-disabled')).toBe('true');
  }
  expect(aller).not.toHaveBeenCalled();
  avancer(vol.poseMs);
  expect(container.querySelector('[data-vol-overlay]')).not.toBeNull();
  avancer(vol.volMs + vol.fermetureMs);
  expect(aller).toHaveBeenCalledExactlyOnceWith(zone.zone);
  expect(quandArrive).toHaveBeenCalledTimes(1);
});

it('respecte les seuils du fondu en mouvement réduit', () => {
  vi.useFakeTimers(); reduit = true;
  const { container, aller, quandArrive, zone } = afficher({ nom: 'Route 1' });
  fireEvent.click(screen.getByRole('button', { name: 'Route 1 (Zone 1)' }));
  expect(container.querySelector('[data-vol-overlay]')).toBeNull();
  expect(container.querySelector('.fondu-carte')).not.toBeNull();
  avancer(vol.changerReduitMs - 1);
  expect(aller).not.toHaveBeenCalled();
  avancer(1);
  expect(aller).toHaveBeenCalledExactlyOnceWith(zone.zone);
  expect(quandArrive).not.toHaveBeenCalled();
  avancer(vol.fonduReduitMs - vol.changerReduitMs - 1);
  expect(quandArrive).not.toHaveBeenCalled();
  avancer(1);
  expect(quandArrive).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[data-vol-overlay]')).toBeNull();
});

it('ouvre les trois lieux de Céladopole et ferme immédiatement avant le vol vers l’Arène', () => {
  vi.useFakeTimers();
  const { aller, quandArrive, zone } = afficher({ nom: 'Céladopole' });
  fireEvent.click(screen.getByRole('button', { name: /Céladopole/ }));
  const dialogue = screen.getByRole<HTMLDialogElement>('dialog', { name: 'Céladopole' });
  expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);
  expect(within(dialogue).getAllByRole('button').slice(1).map(b => b.textContent)).toEqual(['Arène', 'Centre commercial', 'Casino']);
  for (const nom of ['Centre commercial', 'Casino']) {
    expect(within(dialogue).getByRole<HTMLButtonElement>('button', { name: nom, description: 'Bientôt disponible.' }).disabled).toBe(true);
  }
  fireEvent.click(within(dialogue).getByRole('button', { name: 'Arène' }));
  expect(dialogue.open).toBe(false);
  expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
  expect(aller).not.toHaveBeenCalled();
  avancer(3800);
  expect(aller).toHaveBeenCalledExactlyOnceWith(zone.zone);
  expect(quandArrive).toHaveBeenCalledTimes(1);
});

it('ferme immédiatement et rejoint le Centre ou le Casino par leur callback après le vol', () => {
  vi.useFakeTimers();
  const etat = storeJeu.getState();
  storeJeu.setState({ centre: { ...etat.centre, acces: { ouvert: true, raison: null } },
    casino: { ...etat.casino, acces: { ouvert: true, raison: null } } });
  const quandCentre = vi.fn(), quandCasino = vi.fn();
  const { aller } = afficher({ nom: 'Céladopole', quandCentre, quandCasino });
  for (const [nom, callback] of [['Centre commercial', quandCentre], ['Casino', quandCasino]] as const) {
    fireEvent.click(screen.getByRole('button', { name: /Céladopole/ }));
    const dialogue = screen.getByRole<HTMLDialogElement>('dialog', { name: 'Céladopole' });
    fireEvent.click(within(dialogue).getByRole('button', { name: nom }));
    expect(dialogue.open).toBe(false);
    expect(callback).not.toHaveBeenCalled();
    avancer(vol.poseMs + vol.volMs + vol.fermetureMs - 1);
    expect(callback).not.toHaveBeenCalled();
    avancer(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(aller).not.toHaveBeenCalled();
  }
  expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(2);
});

it('garde Céladopole touchable quand son arène est terminée, et désactive l’Arène quand on y est', () => {
  const carte = storeJeu.getState().carte;
  storeJeu.setState({ carte: { ...carte, formes: carte.formes.map(f => f.nom === 'Céladopole'
    ? { ...f, ouverte: true, terminee: true, actuelle: true } : { ...f, actuelle: false }) } });
  render(<CarteKanto quandArrive={vi.fn()} />);
  const ligne = screen.getByRole('button', { name: /Céladopole/ });
  expect(ligne.getAttribute('aria-disabled')).toBeNull();
  expect(ligne.textContent).toContain('Terminée · 3 lieux');
  fireEvent.click(ligne);
  const dialogue = screen.getByRole<HTMLDialogElement>('dialog', { name: 'Céladopole' });
  expect(within(dialogue).getByRole<HTMLButtonElement>('button', { name: 'Arène', description: 'Tu es ici.' }).disabled).toBe(true);
});

it('présente la liste directe et le titre de Kanto sur PC', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  afficher();
  expect(screen.getByRole('list', { name: 'Zones de Kanto' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Carte de Kanto' })).toBeTruthy();
  expect(screen.queryByRole('region', { name: 'Ton voyage' })).toBeNull();
});
