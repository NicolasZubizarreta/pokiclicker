import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test as base, type Page } from '@playwright/test';

export const test = base.extend<{ erreursPage: string[] }>({
  erreursPage: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    await utiliser(erreurs);
    expect.soft(erreurs, 'Erreurs JavaScript de page').toEqual([]);
  }, { auto: true }],
});

export async function verifierEtat(page: Page, id: string, supplement?: () => Promise<void>) {
  for (const [width, height] of [[1280, 800], [1440, 900], [1920, 1080], [2560, 1440]] as const) {
    await page.setViewportSize({ width, height });
    await page.evaluate(() => Promise.all([...document.images].map(img => img.decode().catch(() => undefined))));
    if (process.env.CAPTURES_I4) {
      await mkdir(process.env.CAPTURES_I4, { recursive: true });
      await page.screenshot({ path: join(process.env.CAPTURES_I4, `${id}-${width}.png`), fullPage: false, animations: 'disabled' });
    }
    const mesures = await page.evaluate(() => {
      const dehors: string[] = [];
      const sprites: string[] = [];
      const visible = (e: Element) => {
        if (e.closest('[inert], [hidden], dialog:not([open])')) return false;
        const r = e.getBoundingClientRect();
        const s = getComputedStyle(e);
        return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
      };
      // Les écrans de compte n'ont pas de #contenu.
      const racines = document.querySelectorAll('#contenu, main, dialog[open]');
      const elements = new Set<Element>();
      racines.forEach(r => { elements.add(r); r.querySelectorAll('*').forEach(e => elements.add(e)); });
      for (const e of elements) {
        if (!visible(e)) continue;
        const r = e.getBoundingClientRect();
        // Comme mesurer : les lignes hors champ d'une liste défilante sont masquées.
        let haut = r.top, bas = r.bottom;
        for (let parent = e.parentElement; parent; parent = parent.parentElement) {
          if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(parent).overflowY)) {
            const cadre = parent.getBoundingClientRect();
            haut = Math.max(haut, cadre.top); bas = Math.min(bas, cadre.bottom);
          }
        }
        if (bas <= haut) continue;
        if (r.left < -1 || r.right > innerWidth + 1 || haut < -1 || bas > innerHeight + 1)
          dehors.push(`${e.tagName}.${e.className}`.slice(0, 100));
        // Le sprite ennemi du combat descend volontairement sous la scène (pieds sur le cercle) : la scène clippe, et combat-equipe-pc.spec la contrôle.
        if (e instanceof HTMLImageElement && !e.closest('.scene-limitee')) {
          const cadre = e.closest('li, button, figure, .cadre, section, dialog') ?? e.parentElement!;
          const b = cadre.getBoundingClientRect();
          if (r.left < b.left - 1 || r.right > b.right + 1 || r.top < b.top - 1 || r.bottom > b.bottom + 1)
            sprites.push(`${e.src.split('/').slice(-2).join('/')} [${[r.left, r.top, r.right, r.bottom].map(Math.round)}] dans ${cadre.tagName}.${String(cadre.className).slice(0, 30)} [${[b.left, b.top, b.right, b.bottom].map(Math.round)}]`);
        }
      }
      const dialogues = [...document.querySelectorAll('dialog[open]')].map(e => {
        const r = e.getBoundingClientRect();
        return r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight;
      });
      return { y: document.documentElement.scrollHeight - innerHeight, x: document.documentElement.scrollWidth - innerWidth, dehors, sprites, dialogues };
    });
    expect.soft(mesures.y, `${id} ${width} : défilement vertical`).toBeLessThanOrEqual(0);
    expect.soft(mesures.x, `${id} ${width} : défilement horizontal`).toBeLessThanOrEqual(0);
    expect.soft(mesures.dehors, `${id} ${width} : éléments hors viewport`).toEqual([]);
    expect.soft(mesures.sprites, `${id} ${width} : images hors cadre`).toEqual([]);
    expect.soft(mesures.dialogues.every(Boolean), `${id} ${width} : fenêtre hors viewport`).toBe(true);
    await supplement?.();
  }
}
