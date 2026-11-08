import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';
import { telephone, voyagerVers } from './aide-carte';

// Retours de Nicolas du 08/11 sur la version PC : survol sans carré marron, rond vert de la carte, colonne d'équipe,
// bandeau haut. Profil PC seulement (le téléphone ne change pas).
const tailles = [[1280, 800], [1440, 900], [1920, 1080], [2560, 1440]] as const;

async function ouvrir(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

async function allerABourgPalette(page: Page) {
  await page.keyboard.press('5');
  await expect(page.locator('svg[aria-label="Carte de Kanto"]')).toBeVisible();
  await voyagerVers(page, 'Bourg Palette');
  await expect(page.getByRole('button', { name: 'Chez Maman' })).toBeVisible({ timeout: 20_000 });
}

test('Bourg Palette : le survol est un voile dans la forme de la zone, sans cadre ni aplat', async ({ page }) => {
  test.skip(telephone(page), 'Survol : profil PC seulement');
  await ouvrir(page);
  await allerABourgPalette(page);
  for (const nom of ['Chez Maman', 'Chez Blue', 'Labo Pokémon du Prof. Chen']) {
    const zone = page.getByRole('button', { name: nom });
    await zone.hover();
    const style = await zone.evaluate(e => { const s = getComputedStyle(e); return { fond: s.backgroundColor, contour: s.outlineStyle }; });
    expect(style.fond, `${nom} : fond au survol`).toBe('rgba(0, 0, 0, 0)');
    expect(style.contour, `${nom} : aucun cadre autour`).toBe('none');
    // Le repère est la forme de l'image mapping, en voile léger : fond translucide, pas de contour.
    const repere = page.locator(`[data-repere="${nom}"]`);
    await expect(repere, `${nom} : voile dans la forme`).toHaveCount(1);
    const voile = await repere.evaluate(e => { const s = getComputedStyle(e); return { fill: s.fill, stroke: s.stroke, opacite: parseFloat(s.fillOpacity) }; });
    expect(voile.stroke).toBe('none');
    expect(voile.fill).not.toBe('none');
    const alpha = Number(/\/\s*([\d.]+)/.exec(voile.fill)?.[1] ?? /rgba\([^)]*,\s*([\d.]+)\)/.exec(voile.fill)?.[1] ?? 1);
    expect(alpha * voile.opacite).toBeLessThanOrEqual(0.3);
    await page.mouse.move(5, 5);
    await expect(repere).toHaveCount(0);
  }
});

test('Chez Blue : la sortie en losange ne réagit qu’à l’intérieur du losange, focus clavier en contour fin dans la forme', async ({ page }) => {
  test.skip(telephone(page), 'Survol : profil PC seulement');
  await ouvrir(page);
  await allerABourgPalette(page);
  await page.getByRole('button', { name: 'Chez Blue' }).click();
  const sortie = page.getByRole('button', { name: 'Sortie' });
  await expect(sortie).toBeVisible({ timeout: 20_000 });
  const boite = (await sortie.boundingBox())!;
  const repere = page.locator('[data-repere="Sortie"]');
  // Coin de la boîte englobante : hors du losange, donc aucun repère et aucun cadre.
  await page.mouse.move(boite.x + 3, boite.y + 3);
  await expect(repere).toHaveCount(0);
  expect(await sortie.evaluate(e => getComputedStyle(e).outlineStyle)).toBe('none');
  // Centre du losange : le voile apparaît, de la forme exacte du polygone (quatre points, pas un rectangle).
  await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
  await expect(repere).toHaveCount(1);
  expect(await repere.evaluate(e => e.tagName.toLowerCase())).toBe('polygon');
  expect(await repere.evaluate(e => e.getAttribute('points')!.trim().split(/\s+/).length)).toBe(4);
  await page.screenshot({ path: 'test-results/survol-losange.png' });
  // Clavier : contour fin dans la forme, aucun rectangle autour du bouton.
  await page.mouse.move(5, 5);
  await sortie.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect(repere).toHaveCount(1);
  const focus = await repere.evaluate(e => { const s = getComputedStyle(e); return { stroke: s.stroke, fill: s.fill }; });
  expect(focus.stroke).not.toBe('none');
  expect(await sortie.evaluate(e => getComputedStyle(e).outlineStyle)).toBe('none');
});

test('Carte : survol et clic sans carré, rond vert de même taille que les autres, focus clavier sur le rond', async ({ page }) => {
  test.skip(telephone(page), 'Carte cliquable : profil PC seulement');
  await ouvrir(page);
  await page.keyboard.press('5');
  await expect(page.locator('svg[aria-label="Carte de Kanto"]')).toBeVisible();
  const repere = page.locator('g[data-forme="Route 1"]');
  await repere.hover({ force: true });
  expect(await repere.evaluate(e => getComputedStyle(e).backgroundColor)).toBe('rgba(0, 0, 0, 0)');
  // Survol d'un rond : le rond s'éclaircit lui-même, aucun contour ni rectangle autour.
  expect(await repere.evaluate(e => getComputedStyle(e).outlineStyle)).toBe('none');
  expect(await repere.evaluate(e => getComputedStyle(e.querySelector('circle')!).filter)).toContain('brightness');
  // Le rond vert clignotant est celui du marqueur : même diamètre que les ronds de base, sans contour en unités de carte.
  const mesures = await page.evaluate(() => {
    const vert = document.querySelector('circle[data-actuelle]')!;
    const base = document.querySelector('g[data-forme] > circle')!;
    const s = getComputedStyle(vert);
    return { vert: vert.getBoundingClientRect().width, base: base.getBoundingClientRect().width, trait: s.stroke, epaisseur: s.strokeWidth };
  });
  expect(mesures.vert).toBeCloseTo(mesures.base, 0);
  expect(mesures.trait === 'none' || parseFloat(mesures.epaisseur) <= 4).toBe(true);
  // Clic à la souris : aucun contour de focus sur un rond.
  await repere.click({ force: true });
  await page.mouse.move(5, 5);
  const contours = await page.locator('g[data-forme][role="button"]').evaluateAll(l => l.map(e => getComputedStyle(e).outlineStyle));
  expect(new Set(contours)).toEqual(new Set(['none']));
  // Clavier : le focus se voit sur le contour jaune du rond.
  await page.keyboard.press('Escape');
  await repere.focus();
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  const focus = await repere.evaluate(e => ({ visible: e.matches(':focus-visible'), trait: getComputedStyle(e.querySelector('circle')!).stroke, contour: getComputedStyle(e).outlineStyle }));
  expect(focus).toMatchObject({ visible: true, contour: 'none' });
  expect(focus.trait).not.toBe('rgb(20, 24, 33)');
});

test('Combat PC : six Pokémon visibles sans défilement, aucun bouton ni texte Auto-clic dans la colonne', async ({ page }) => {
  test.skip(telephone(page), 'Colonne de droite : profil PC seulement');
  await ouvrir(page);
  for (const [largeur, hauteur] of tailles) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    const colonne = page.locator('.combat-pc-droite');
    const equipe = page.getByRole('region', { name: 'Ton équipe' });
    await expect(equipe.getByRole('listitem')).toHaveCount(6);
    await equipe.hover();
    const mesure = await page.evaluate(() => {
      const liste = document.querySelector('.combat-pc-equipe ul')!;
      const cadre = liste.getBoundingClientRect();
      const rangs = [...liste.children].map(e => e.getBoundingClientRect());
      return { defile: liste.scrollHeight > liste.clientHeight + 1, toutDans: rangs.every(r => r.top >= cadre.top - 1 && r.bottom <= cadre.bottom + 1 && r.bottom <= innerHeight) };
    });
    expect(mesure, `${largeur} px : équipe`).toEqual({ defile: false, toutDans: true });
    expect(await colonne.innerText(), `${largeur} px`).not.toContain('Auto-clic');
    await expect(colonne.getByRole('button', { name: 'Auto-clic' })).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Effets actifs' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Attaque auto/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Arrêt auto/ })).toBeVisible();
  }
});

test('Bandeau haut PC : le bouton Raccourcis ne touche ni la bordure ni les chiffres, à toutes les largeurs', async ({ page }) => {
  test.skip(telephone(page), 'Bandeau PC : profil PC seulement');
  await ouvrir(page);
  for (const [largeur, hauteur] of tailles) {
    await page.setViewportSize({ width: largeur, height: hauteur });
    const m = await page.evaluate(() => {
      const bandeau = document.querySelector('.bandeau-pc')!.getBoundingClientRect();
      const bouton = document.querySelector('.bandeau-pc .plaque')!.getBoundingClientRect();
      const chiffres = [...document.querySelectorAll('.bandeau-pc dl > div')].map(e => e.getBoundingClientRect());
      return {
        haut: bouton.top - bandeau.top, bas: bandeau.bottom - bouton.bottom,
        chiffresHaut: Math.min(...chiffres.map(r => r.top)) - bandeau.top, chiffresBas: bandeau.bottom - Math.max(...chiffres.map(r => r.bottom)),
      };
    });
    // Le bas du bandeau porte une bande de 6 px : on exige au moins 8 px de marge au-dessus d'elle.
    expect(m.haut, `${largeur} px : bouton, marge haute`).toBeGreaterThanOrEqual(8);
    expect(m.bas, `${largeur} px : bouton, marge basse`).toBeGreaterThanOrEqual(14);
    expect(m.chiffresHaut, `${largeur} px : chiffres, marge haute`).toBeGreaterThanOrEqual(8);
    expect(m.chiffresBas, `${largeur} px : chiffres, marge basse`).toBeGreaterThanOrEqual(14);
  }
});
