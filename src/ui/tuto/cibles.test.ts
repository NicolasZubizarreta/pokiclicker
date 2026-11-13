// @vitest-environment jsdom
import { afterEach, expect, it, vi } from 'vitest';
import { ciblesVisibles, obstaclesVisibles, trouverCible, zoneUtile } from './cibles';

afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
function rect(element: HTMLElement, x = 10, y = 20, w = 80, h = 40) {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({ x, y, left: x, top: y, width: w, height: h,
    right: x + w, bottom: y + h, toJSON: () => ({}) });
  return element;
}
function ajouter(id: string) {
  const e = document.createElement('button');
  e.dataset.tuto = id;
  document.body.append(e);
  return rect(e);
}
it('ignore un rectangle nul et choisit le premier élément visible', () => {
  const nul = ajouter('pc'); rect(nul, 0, 0, 0, 40);
  const premier = ajouter('pc'); ajouter('pc');
  expect(trouverCible('pc')).toBe(premier);
  expect(trouverCible('inconnu')).toBeNull();
  expect(trouverCible('a"[]')).toBeNull();
});
it.each(['hidden', 'inert', 'aria-hidden', 'display', 'visibility'])('ignore un ancêtre masqué par %s', mode => {
  const parent = document.createElement('div');
  const enfant = ajouter('pc');
  document.body.append(parent); parent.append(enfant);
  if (mode === 'display') parent.style.display = 'none';
  else if (mode === 'visibility') parent.style.visibility = 'hidden';
  else parent.setAttribute(mode, mode === 'aria-hidden' ? 'true' : '');
  expect(trouverCible('pc')).toBeNull();
  expect(ciblesVisibles()).toEqual(new Set());
});
it('liste les identifiants visibles sans doublon', () => {
  ajouter('pc'); ajouter('pc'); ajouter('sac');
  ajouter('cache').hidden = true;
  expect(ciblesVisibles()).toEqual(new Set(['pc', 'sac']));
});
it('exclut la cible, ses ancêtres et descendants des obstacles', () => {
  const parent = ajouter('parent'), cible = ajouter('pc'), enfant = ajouter('enfant');
  parent.append(cible); cible.append(enfant);
  ajouter('cache').hidden = true;
  const raccourci = document.createElement('button'); raccourci.dataset.raccourci = 'sac';
  document.body.append(raccourci); rect(raccourci);
  const eviter = document.createElement('div'); eviter.dataset.tutoEvite = '';
  document.body.append(eviter); rect(eviter, 100, 200, 50, 60);
  expect(obstaclesVisibles(cible)).toEqual([{ x: 10, y: 20, w: 80, h: 40 }, { x: 100, y: 200, w: 50, h: 60 }]);
  expect(obstaclesVisibles(null)).toHaveLength(5);
});
it('retire la navigation du bas et ignore une navigation masquée', () => {
  vi.stubGlobal('innerWidth', 360); vi.stubGlobal('innerHeight', 800);
  const nav = document.createElement('nav'); nav.setAttribute('aria-label', 'Navigation principale');
  document.body.append(nav); rect(nav, 0, 740, 360, 60);
  expect(zoneUtile()).toEqual({ x: 0, y: 0, w: 360, h: 740 });
  nav.hidden = true;
  expect(zoneUtile()).toEqual({ x: 0, y: 0, w: 360, h: 800 });
});
it('retire la barre latérale et la zone de sûreté', () => {
  vi.stubGlobal('innerWidth', 1200); vi.stubGlobal('innerHeight', 800);
  const aside = document.createElement('aside'); aside.className = 'barre-laterale';
  document.body.append(aside); rect(aside, 0, 0, 200, 800);
  expect(zoneUtile()).toEqual({ x: 200, y: 0, w: 1000, h: 800 });
  const styleReel = window.getComputedStyle.bind(window);
  vi.spyOn(window, 'getComputedStyle').mockImplementation(element => {
    const style = styleReel(element);
    if ((element as HTMLElement).style.position === 'fixed' && (element as HTMLElement).style.visibility === 'hidden') {
      return new Proxy(style, { get: (objet, cle) => cle === 'paddingBottom' ? '20px' : Reflect.get(objet, cle) });
    }
    return style;
  });
  expect(zoneUtile()).toEqual({ x: 200, y: 0, w: 1000, h: 780 });
});
