// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PageReglages } from './PageReglages';
import { storeJeu } from './store';
import { volumes } from './volumes';

const audio = vi.hoisted(() => ({ actif: true, basculer: vi.fn() }));
vi.mock('./musique', () => ({ musique: { abonner: () => () => {}, estActive: () => audio.actif, basculer: audio.basculer } }));
const initial = storeJeu.getState();
it('bascule Relâcher automatiquement les doublons, désactivé par défaut', () => {
  expect(initial.relacherDoublons).toBe(false);
  const reglerRelacherDoublons = vi.fn((actif: boolean) => storeJeu.setState({ relacherDoublons: actif }));
  storeJeu.setState({ reglerRelacherDoublons });
  render(<PageReglages />);
  const interrupteur = screen.getByRole('switch', { name: 'Relâcher automatiquement les doublons' });
  expect(interrupteur.getAttribute('aria-checked')).toBe('false');
  fireEvent.click(interrupteur);
  expect(reglerRelacherDoublons).toHaveBeenCalledWith(true);
  expect(interrupteur.getAttribute('aria-checked')).toBe('true');
});
it('bascule Passer les éclosions, désactivé par défaut', () => {
  expect(initial.passerEclosions).toBe(false);
  const reglerPasserEclosions = vi.fn((actif: boolean) => storeJeu.setState({ passerEclosions: actif }));
  storeJeu.setState({ reglerPasserEclosions });
  render(<PageReglages />);
  const interrupteur = screen.getByRole('switch', { name: 'Passer les éclosions' });
  expect(interrupteur.getAttribute('aria-checked')).toBe('false');
  fireEvent.click(interrupteur);
  expect(reglerPasserEclosions).toHaveBeenCalledWith(true);
  expect(interrupteur.getAttribute('aria-checked')).toBe('true');
});
it('affiche les réglages sans bouton Retour dans la zone compte', () => {
  const { container } = render(<PageReglages />);
  expect(container.querySelectorAll('.reglages-pc')).toHaveLength(1);
  expect(screen.getByRole('heading', { name: 'Son' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Combat' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 1, name: 'Réglages' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull();
});
beforeEach(() => { audio.actif = true; audio.basculer.mockClear(); storeJeu.setState({ sonActive: true }); });
afterEach(() => { cleanup(); storeJeu.setState(initial); });

it('bascule la préférence des effets sonores', () => {
  const basculerSon = vi.fn(() => storeJeu.setState({ sonActive: !storeJeu.getState().sonActive }));
  storeJeu.setState({ basculerSon });
  render(<PageReglages retour={vi.fn()} />);
  const interrupteur = screen.getByRole('switch', { name: 'Effets sonores' });
  expect(interrupteur.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(interrupteur);
  expect(basculerSon).toHaveBeenCalledTimes(1);
  expect(interrupteur.getAttribute('aria-checked')).toBe('false');
});

it('règle les deux volumes', () => {
  render(<PageReglages retour={vi.fn()} />);
  fireEvent.change(screen.getByRole('slider', { name: 'Volume des effets sonores' }), { target: { value: '70' } });
  fireEvent.change(screen.getByRole('slider', { name: 'Volume de la musique' }), { target: { value: '0' } });
  expect(volumes.lire('effets')).toBe(70);
  expect(volumes.lire('musique')).toBe(0);
  expect(screen.getByText('70')).toBeTruthy();
  expect(screen.getByText('0')).toBeTruthy();
});

it('désactive le curseur des effets coupés et garde sa valeur', () => {
  volumes.definir('effets', 42);
  storeJeu.setState({ sonActive: false });
  render(<PageReglages retour={vi.fn()} />);
  const curseur = screen.getByRole('slider', { name: 'Volume des effets sonores' }) as HTMLInputElement;
  expect(curseur.disabled).toBe(true);
  expect(curseur.value).toBe('42');
});

it('bascule la musique et désactive son curseur sans perdre le volume', () => {
  volumes.definir('musique', 33);
  const { rerender } = render(<PageReglages retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('switch', { name: 'Musique' }));
  expect(audio.basculer).toHaveBeenCalledTimes(1);
  audio.actif = false;
  rerender(<PageReglages retour={vi.fn()} />);
  const curseur = screen.getByRole('slider', { name: 'Volume de la musique' }) as HTMLInputElement;
  expect(curseur.disabled).toBe(true);
  expect(curseur.value).toBe('33');
  expect(curseur.getAttribute('aria-valuetext')).toBe('33 %');
});

it.each([true, false])('inverse la liaison auto-clic depuis %s', actif => {
  const reglerAutoClicLie = vi.fn();
  storeJeu.setState({ autoClicLie: actif, reglerAutoClicLie });
  render(<PageReglages retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('switch', { name: "Auto-clic lié à l'attaque auto" }));
  expect(reglerAutoClicLie).toHaveBeenCalledWith(!actif);
});

it('revient au menu et ne propose aucun arrêt auto', () => {
  const retour = vi.fn();
  render(<PageReglages retour={retour} />);
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(retour).toHaveBeenCalledTimes(1);
  expect(screen.queryByText(/arrêt auto/i)).toBeNull();
});

it('bascule l’évolution automatique, active par défaut', () => {
  const reglerEvolutionAuto = vi.fn((actif: boolean) => storeJeu.setState({ evolutionAuto: actif }));
  storeJeu.setState({ evolutionAuto: true, reglerEvolutionAuto });
  render(<PageReglages retour={vi.fn()} />);
  const interrupteur = screen.getByRole('switch', { name: 'Évolution automatique' });
  expect(interrupteur.getAttribute('aria-checked')).toBe('true');
  expect(screen.getByText(/Quand un Pokémon est prêt, une fenêtre te propose/)).toBeTruthy();
  fireEvent.click(interrupteur);
  expect(reglerEvolutionAuto).toHaveBeenCalledWith(false);
  expect(interrupteur.getAttribute('aria-checked')).toBe('false');
});
