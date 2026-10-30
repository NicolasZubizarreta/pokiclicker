// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { SceneRonflex } from './SceneRonflex';
import { reglages } from '../core/reglages';

let maintenant: number;
let tick: FrameRequestCallback;
let reduit: boolean;
const reussir = vi.fn();
const commande = { type: 'souffle' as const, evenement: 'kanto.ronflex-reveil', etape: 0 };
const afficher = () => render(<SceneRonflex decor="img/decors/centrale.webp" commande={commande}
  possedeFlute reussirSouffle={reussir} />);
const bouton = () => screen.getByRole('button', { name: 'Souffler' });
const niveau = () => Number(screen.getByRole('progressbar', { name: 'Niveau de souffle' }).getAttribute('aria-valuenow'));
const cumul = () => (screen.getByRole('progressbar', { name: 'Secondes dans la zone cible' }) as HTMLProgressElement).value;
function avancer(ms: number) { act(() => { maintenant += ms; tick(maintenant); }); }
function pas(nombre: number) { for (let i = 0; i < nombre; i++) avancer(150); }
function appuyer() { fireEvent.keyDown(bouton(), { key: 'a' }); }
function relacher() { fireEvent.keyUp(bouton(), { key: 'a' }); }

beforeEach(() => {
  maintenant = 0;
  reduit = true;
  reussir.mockClear();
  vi.stubGlobal('requestAnimationFrame', vi.fn((callback: FrameRequestCallback) => { tick = callback; return 1; }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.stubGlobal('PointerEvent', MouseEvent);
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: reduit })));
  vi.spyOn(window, 'getComputedStyle').mockReturnValue({
    getPropertyValue: (nom: string) => nom === '--duree-signal' ? '1s' : '150ms',
  } as CSSStyleDeclaration);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('donne le focus au bouton et calcule le maintien, le relâchement et les bornes', () => {
  afficher();
  expect(document.activeElement).toBe(bouton());
  expect(bouton().className).toContain('min-h-20');
  appuyer(); avancer(0); pas(30);
  expect(niveau()).toBe(50);
  relacher(); pas(6);
  expect(niveau()).toBe(40);
  pas(30);
  expect(niveau()).toBe(0);
  appuyer(); pas(65);
  expect(niveau()).toBe(100);
});

it('conserve le cumul discontinu, puis valide le seuil une seule fois', () => {
  afficher(); appuyer(); avancer(0); pas(33);
  const acquis = cumul();
  expect(acquis).toBeGreaterThan(0);
  pas(10);
  expect(cumul()).toBe(acquis);
  relacher(); pas(11);
  expect(cumul()).toBeGreaterThan(acquis);
  for (let i = 0; i < 30 && reussir.mock.calls.length === 0; i++) {
    relacher(); pas(1); appuyer(); pas(1);
  }
  expect(cumul()).toBe(reglages.ronflex.souffle.dureeCumuleeS);
  expect(reussir).toHaveBeenCalledExactlyOnceWith({ evenement: commande.evenement, etape: commande.etape });
  pas(10);
  expect(reussir).toHaveBeenCalledTimes(1);
});

it('reproduit la cible mobile et fixe sa position en mouvement réduit', () => {
  reduit = false;
  const { container } = afficher(); appuyer(); avancer(0); avancer(150);
  const jauge = screen.getByRole('progressbar', { name: 'Niveau de souffle' });
  const cible = () => Number(jauge.style.getPropertyValue('--cible'));
  const p = reglages.ronflex.souffle;
  expect(cible()).toBeCloseTo(p.centreCible + Math.sin(150 / (1000 * p.facteurCible)) * p.amplitudeCible);
  reduit = true; avancer(150);
  expect(cible()).toBe(p.centreCible);
  expect(container.querySelector('.motion-safe\\:flottement')).toBeTruthy();
});

it('plafonne dt et ne cumule pas artificiellement après un onglet masqué', () => {
  afficher(); appuyer(); avancer(0); pas(32);
  const acquis = cumul();
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  fireEvent(document, new Event('visibilitychange'));
  expect(bouton().getAttribute('aria-pressed')).toBe('false');
  avancer(60000);
  expect(cumul()).toBe(acquis);
  vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
  fireEvent(document, new Event('visibilitychange'));
  avancer(60000);
  expect(cumul()).toBe(acquis);
  appuyer(); avancer(60000);
  expect(niveau()).toBe(57);
  expect(cumul()).toBe(acquis);
});

it.each(['pointerup', 'pointercancel', 'lostpointercapture', 'blur'])('libère le maintien sur %s', type => {
  afficher();
  fireEvent.pointerDown(bouton(), { button: 0, pointerId: 1 });
  expect(bouton().getAttribute('aria-pressed')).toBe('true');
  if (type === 'blur') fireEvent.blur(window);
  else fireEvent(bouton(), new Event(type, { bubbles: true }));
  expect(bouton().getAttribute('aria-pressed')).toBe('false');
});

it('nettoie la boucle et affiche le réveil autour du dialogue existant', () => {
  const { rerender, unmount } = afficher();
  rerender(<SceneRonflex decor="img/decors/centrale.webp" possedeFlute reussirSouffle={reussir}
    commande={{ type: 'dialogue', evenement: commande.evenement, etape: 1, locuteur: 'narration', texte: 'Réveil' }} />);
  expect(screen.queryByRole('button', { name: 'Souffler' })).toBeNull();
  expect(screen.getByRole('img', { name: 'Ronflex réveillé' })).toBeTruthy();
  expect(cancelAnimationFrame).toHaveBeenCalled();
  unmount();
});
