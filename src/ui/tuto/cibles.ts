import type { Rect } from './placement';

function visible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0 || element.closest('[hidden], [inert], [aria-hidden="true"]')) return false;
  for (let courant: HTMLElement | null = element; courant; courant = courant.parentElement) {
    const style = getComputedStyle(courant);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
  }
  return true;
}
function rectangle(element: HTMLElement): Rect {
  const r = element.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height };
}
export function trouverCible(id: string): HTMLElement | null {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-tuto]')).find(e => e.dataset.tuto === id && visible(e)) ?? null;
}
export function ciblesVisibles(): Set<string> {
  return new Set(Array.from(document.querySelectorAll<HTMLElement>('[data-tuto]')).filter(visible).map(e => e.dataset.tuto!));
}
export function obstaclesVisibles(sauf: HTMLElement | null): Rect[] {
  return Array.from(document.querySelectorAll<HTMLElement>('[data-tuto], [data-raccourci], [data-tuto-evite], button, a[href], input, select, summary, [role="button"]'))
    .filter(e => !e.closest('.tuto-couche') && !(sauf && (e.contains(sauf) || sauf.contains(e))) && visible(e)).map(rectangle);
}
let temoin: HTMLElement | undefined;
export function zoneUtile(): Rect {
  if (!temoin || !temoin.isConnected) {
    temoin = document.createElement('div');
    temoin.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;padding-bottom:env(safe-area-inset-bottom)';
    document.body.append(temoin);
  }
  const surete = Number.parseFloat(getComputedStyle(temoin).paddingBottom) || 0;
  let x = 0, bas = window.innerHeight;
  const navigation = document.querySelector<HTMLElement>('nav[aria-label="Navigation principale"]');
  const laterale = document.querySelector<HTMLElement>('aside.barre-laterale');
  if (navigation && visible(navigation) && navigation.getBoundingClientRect().top > window.innerHeight / 2) {
    bas = navigation.getBoundingClientRect().top;
  } else if (laterale && visible(laterale)) x = laterale.getBoundingClientRect().width;
  return { x, y: 0, w: Math.max(0, window.innerWidth - x), h: Math.max(0, bas - surete) };
}
