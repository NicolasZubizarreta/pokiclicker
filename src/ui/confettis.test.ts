// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import donnees from '../../data/pantheon.json';
import { creerConfettis } from './confettis';

const annuler = vi.fn();
const animer = vi.fn(() => ({ cancel: annuler }));
const horloge = {
  setInterval: (action: () => void, ms: number) => window.setInterval(action, ms),
  clearInterval: (id: number) => window.clearInterval(id),
  setTimeout: (action: () => void, ms: number) => window.setTimeout(action, ms),
  clearTimeout: (id: number) => window.clearTimeout(id),
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
  Object.defineProperty(HTMLElement.prototype, 'animate', { configurable: true, value: animer });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.restoreAllMocks();
  Reflect.deleteProperty(HTMLElement.prototype, 'animate');
  vi.unstubAllGlobals();
  vi.clearAllMocks();
  document.body.replaceChildren();
});

function preparer(mouvementReduit?: () => boolean) {
  const hote = document.createElement('div');
  document.body.append(hote);
  const alea = vi.fn(() => 0.5);
  const moteur = creerConfettis(hote, { alea, horloge, mouvementReduit });
  return { hote, moteur, alea };
}

it('émet continuellement aux périodes V1 dans un calque sans interaction', () => {
  const { hote, moteur, alea } = preparer();
  moteur.demarrer();
  moteur.demarrer();
  const calque = hote.firstElementChild as HTMLElement;
  expect(calque.style.pointerEvents).toBe('none');
  expect(calque.getAttribute('aria-hidden')).toBe('true');
  vi.advanceTimersByTime(donnees.effets.feuPeriodeMs);
  expect(calque.querySelectorAll('[data-particule="confetti"]')).toHaveLength(16);
  expect(calque.querySelectorAll('[data-particule="feu"]')).toHaveLength(1);
  expect(alea).toHaveBeenCalled();
  moteur.arreter();
});

it('retire chaque confetti à 4 s et chaque feu à la durée V1', () => {
  const { hote, moteur } = preparer();
  moteur.demarrer();
  vi.advanceTimersByTime(50);
  const confetti = hote.querySelector('[data-particule="confetti"]')!;
  vi.advanceTimersByTime(750);
  const feu = hote.querySelector('[data-particule="feu"]')!;
  vi.advanceTimersByTime(999);
  expect(feu.isConnected).toBe(true);
  vi.advanceTimersByTime(1);
  expect(feu.isConnected).toBe(false);
  vi.advanceTimersByTime(2249);
  expect(confetti.isConnected).toBe(true);
  vi.advanceTimersByTime(1);
  expect(confetti.isConnected).toBe(false);
  moteur.arreter();
});

it('anime seulement transform et opacity avec des couleurs issues des jetons', () => {
  const { hote, moteur } = preparer();
  moteur.demarrer();
  vi.advanceTimersByTime(800);
  for (const [images] of animer.mock.calls as unknown as [Keyframe[]][]) {
    expect(Object.keys(images[0]!)).not.toHaveLength(0);
    for (const image of images) {
      expect(Object.keys(image).every((cle) => ['transform', 'opacity', 'offset'].includes(cle))).toBe(true);
    }
  }
  for (const particule of hote.querySelectorAll<HTMLElement>('[data-particule]')) {
    expect(particule.style.getPropertyValue('--couleur')).toMatch(/^var\(--color-/);
    expect(particule.style.boxShadow).not.toContain('20px');
  }
  expect(animer).toHaveBeenCalled();
  moteur.arreter();
});

it('arrête les animations, vide son calque et annule tous les minuteurs, même après redémarrage', () => {
  const { hote, moteur } = preparer();
  const voisin = document.createElement('span');
  hote.append(voisin);
  moteur.demarrer();
  vi.advanceTimersByTime(800);
  moteur.arreter();
  moteur.arreter();
  expect(hote.children).toHaveLength(1);
  expect(hote.firstElementChild).toBe(voisin);
  expect(annuler).toHaveBeenCalledTimes(animer.mock.calls.length);
  expect(vi.getTimerCount()).toBe(0);
  vi.advanceTimersByTime(8000);
  expect(hote.children).toHaveLength(1);
  moteur.demarrer();
  vi.advanceTimersByTime(50);
  expect(hote.querySelectorAll('[data-particule]')).toHaveLength(1);
  moteur.arreter();
  expect(vi.getTimerCount()).toBe(0);
});

it('ne crée ni calque, ni animation, ni minuteur sous mouvement réduit', () => {
  vi.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
  const { hote, moteur, alea } = preparer();
  moteur.demarrer();
  vi.advanceTimersByTime(8000);
  expect(hote.children).toHaveLength(0);
  expect(animer).not.toHaveBeenCalled();
  expect(alea).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('coupe les effets si le mouvement réduit est activé en cours de lecture', () => {
  let reduit = false;
  const { hote, moteur } = preparer(() => reduit);
  moteur.demarrer();
  vi.advanceTimersByTime(800);
  reduit = true;
  vi.advanceTimersByTime(50);
  expect(hote.children).toHaveLength(0);
  expect(vi.getTimerCount()).toBe(0);
});
