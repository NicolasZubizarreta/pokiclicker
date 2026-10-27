// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ScenesBourgPalette } from './ScenesBourgPalette';
import { chargerScenes } from '../core/scenes';
import { centreForme } from './carte-geometrie';

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });
const avancer = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

it('ouvre la pension sans changer de scène ni lancer de transition', () => {
  const quandPension = vi.fn();
  const quandScene = vi.fn();
  const { container } = render(<ScenesBourgPalette accesPension={{ ouvert: true, raison: null }}
    quandPension={quandPension} quandScene={quandScene} />);
  const pension = screen.getByRole('button', { name: 'Pension Pokémon' });
  expect(pension.hasAttribute('aria-disabled')).toBe(false);
  fireEvent.click(pension);
  expect(quandPension).toHaveBeenCalledTimes(1);
  avancer(450);
  expect(quandScene).not.toHaveBeenCalled();
  expect(screen.getByRole('region', { name: 'Bourg Palette' })).toBeTruthy();
  expect(container.querySelector('[data-voile]')?.classList.contains('opacity-0')).toBe(true);
  expect(vi.getTimerCount()).toBe(0);
  fireEvent.click(pension);
  expect(quandPension).toHaveBeenCalledTimes(2);
});

it('affiche la raison reçue et refuse le clic quand la pension est fermée', () => {
  const quandPension = vi.fn();
  render(<ScenesBourgPalette accesPension={{ ouvert: false, raison: 'Accès fermé.' }} quandPension={quandPension} />);
  const pension = screen.getByRole('button', { name: 'Pension Pokémon' });
  expect(pension.getAttribute('aria-disabled')).toBe('true');
  fireEvent.focus(pension);
  expect(screen.getByRole('status').textContent).toBe('Accès fermé.');
  fireEvent.click(pension);
  expect(quandPension).not.toHaveBeenCalled();
});

it('visite Maman sous le voile de 300 + 150 ms, puis revient par la sortie pulsante', () => {
  const { container } = render(<ScenesBourgPalette />);
  expect(screen.getByRole('status').textContent).toBe('');
  fireEvent.click(screen.getByRole('button', { name: 'Chez Maman' }));
  expect(container.querySelector('[data-voile]')?.classList.contains('opacity-100')).toBe(true);
  avancer(299);
  expect(screen.queryByText("Il n'y a rien à faire ici, sortons.")).toBeNull();
  avancer(1);
  expect(screen.getByText("Il n'y a rien à faire ici, sortons.")).toBeTruthy();
  expect(container.querySelector('[data-forme="Sortie"]')?.classList.contains('motion-safe:flash-vert')).toBe(true);
  expect((screen.getByRole('button', { name: 'Sortie' }) as HTMLButtonElement).disabled).toBe(true);
  avancer(150);
  expect(container.querySelector('[data-voile]')?.classList.contains('opacity-0')).toBe(true);
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Sortie' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sortie' }));
  avancer(450);
  expect(screen.getByRole('button', { name: 'Chez Maman' })).toBeTruthy();
});

it('Chez Maman : la télé cachée ne lance la vidéo muette que sur un clic, et l\'éteint au second', () => {
  const lecture = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
  const pause = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => undefined);
  const { container } = render(<ScenesBourgPalette sceneInitiale="kanto.chez-maman" />);
  const video = container.querySelector('video')!;
  expect(video.hidden).toBe(true);
  expect(video.muted).toBe(true);
  expect(video.getAttribute('src')).toBe('img/easter-eggs/daran.mp4');
  expect(lecture).not.toHaveBeenCalled();
  const tele = screen.getByRole('button', { name: 'Télé' });
  fireEvent.click(tele);
  expect(lecture).toHaveBeenCalledTimes(1);
  expect(video.hidden).toBe(false);
  expect(tele.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(tele);
  expect(pause).toHaveBeenCalledTimes(1);
  expect(video.hidden).toBe(true);
  lecture.mockRestore(); pause.mockRestore();
});

it('annonce les raisons au focus et au toucher et bloque Pension et Bateau', () => {
  const { container } = render(<ScenesBourgPalette />);
  const pension = screen.getByRole('button', { name: 'Pension Pokémon' });
  expect(pension.getAttribute('aria-disabled')).toBe('true');
  fireEvent.focus(pension);
  expect(screen.getByRole('status').textContent).toBe('Bats le boss de Tour Pokémon.');
  expect(document.getElementById(pension.getAttribute('aria-describedby')!)?.textContent).toContain('Tour Pokémon');
  fireEvent.click(pension);
  const bateau = screen.getByRole('button', { name: 'Bateau en direction de Johto' });
  fireEvent.pointerDown(bateau);
  expect(screen.getByRole('status').textContent).toContain('Bientôt disponible');
  fireEvent.click(bateau);
  expect(container.querySelector('[data-forme="Bateau en direction de Johto"]')?.classList.contains('fill-texte-doux/50')).toBe(true);
  expect(screen.getByRole('button', { name: 'Chez Maman' })).toBeTruthy();
});

it('cale les formes et cibles sur les fractions, même après redimensionnement', () => {
  const { container } = render(<ScenesBourgPalette />);
  const scene = chargerScenes()[0]!;
  const image = screen.getByRole('img', { name: 'Bourg Palette' });
  expect(image.getAttribute('src')).toBe(`img/${scene.image}`);
  expect(image.classList.contains('object-contain')).toBe(true);
  expect(image.parentElement?.style.aspectRatio).toBe('1 / 1');
  for (const forme of scene.formes) {
    const cible = screen.getByRole('button', { name: forme.nom });
    const centre = centreForme(forme);
    expect(cible.style.left).toBe(`${centre.x / 16 * 100}%`);
    expect(cible.style.top).toBe(`${centre.y / 9 * 100}%`);
    expect(cible.classList.contains('min-h-11') && cible.classList.contains('min-w-11')).toBe(true);
    fireEvent(window, new Event('resize'));
    expect(cible.style.left).toBe(`${centre.x / 16 * 100}%`);
  }
  expect(container.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
});

it('permet la visite de Blue et le retour au clavier', async () => {
  vi.useRealTimers();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true })));
  const user = userEvent.setup();
  render(<ScenesBourgPalette />);
  await user.tab();
  await user.tab();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Chez Blue' }));
  await user.keyboard('{Enter}');
  expect(screen.getByText('Eh pourquoi il a le droit à une maison en 3D lui ?')).toBeTruthy();
  expect(screen.getByRole('img').parentElement?.style.aspectRatio).toBe('16 / 9');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Sortie' }));
  await user.keyboard(' ');
  expect(screen.getByRole('button', { name: 'Chez Blue' })).toBeTruthy();
});

it('signale le labo et sa sortie, appelle quandLabo et nettoie les minuteurs', () => {
  const quandLabo = vi.fn();
  const { container, unmount } = render(<ScenesBourgPalette laboAVisiter sortieLaboClignote quandLabo={quandLabo} />);
  expect(container.querySelector('[data-forme="Labo Pokémon du Prof. Chen"]')?.classList.contains('motion-safe:flash-vert')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Labo Pokémon du Prof. Chen' }));
  avancer(300);
  expect(quandLabo).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[data-forme="Sortie"]')?.classList.contains('motion-safe:flash-vert')).toBe(true);
  avancer(150);
  fireEvent.click(screen.getByRole('button', { name: 'Sortie' }));
  avancer(450);
  fireEvent.click(screen.getByRole('button', { name: 'Labo Pokémon du Prof. Chen' }));
  avancer(450);
  expect(container.querySelector('[data-forme="Sortie"]')?.classList.contains('motion-safe:flash-vert')).toBe(false);
  avancer(0);
  fireEvent.click(screen.getByRole('button', { name: 'Sortie' }));
  unmount();
  vi.runAllTicks();
  expect(vi.getTimerCount()).toBe(0);
});
