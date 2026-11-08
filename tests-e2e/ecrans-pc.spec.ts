import { readFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

// Ticket I, lot I3 : les écrans PC restants (PC, Shop, Carte, Menu, Monde, Réglages, Pokédex, Badges, Statistiques, Guide)
// à 1280, 1440, 1920 et 2560 px : la page ne défile pas, rien ne déborde, aucun sprite hors de son cadre, clavier utilisable.
test.beforeEach(({}, info) => { test.skip(info.project.name !== 'pc', 'Écrans PC : projet « pc » seulement'); });

const TAILLES: [number, number][] = [[1280, 800], [1440, 900], [1920, 1080], [2560, 1440]];

async function demarrer(page: Page, largeur: number, hauteur: number, lieu: false | 'centre' | 'bourg' = false, mouvementReduit = true) {
  const kanto = JSON.parse(await readFile('data/regions/kanto/zones.json', 'utf8')) as { zones: { ancienId: number; id: string }[] };
  const boss = lieu ? kanto.zones.filter(z => z.ancienId > 0 && z.ancienId <= 10).map(z => z.id) : ['kanto.route-1', 'kanto.foret-de-jade'];
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.emulateMedia({ reducedMotion: mouvementReduit ? 'reduce' : 'no-preference' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  // Partie bien remplie : PC ouvert avec 30 Pokémon (dont un œuf et un shiny), de l'argent, deux badges.
  await page.addInitScript(({ boss, lieu }) => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'));
    if (!cle || sessionStorage.getItem('i3-prepare')) return;
    sessionStorage.setItem('i3-prepare', '1');
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const especes = [1, 4, 7, 16, 19, 25, 35, 39, 52, 54, 58, 60, 63, 66, 74, 77, 79, 92, 95, 96, 104, 109, 111, 116, 129, 133, 143, 147];
    const pokemon = (uid: string, numero: number, niveau: number, extra = {}) =>
      ({ uid, numero, niveau, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false, ...extra });
    enveloppe.donnees.pc = especes.map((n, i) => pokemon(`pc-${i}`, n, 1 + (i * 7) % 60, { shiny: i === 3, favori: i % 5 === 0, surnom: i === 1 ? 'Daran' : i === 2 ? 'Gabriel' : undefined }));
    enveloppe.donnees.bossVaincus = boss;
    enveloppe.donnees.argent = 250_000;
    if (lieu) Object.assign(enveloppe.donnees, { zoneId: lieu === 'centre' ? 'kanto.tour-pokemon' : 'kanto.bourg-palette', etape: 1 });
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { boss, lieu });
  await page.reload();
  await expect(page.getByRole('button', { name: lieu === 'bourg' ? 'Pension Pokémon' : /^Attaquer / })).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
}

const menu = async (page: Page, tuile: string | RegExp) => {
  await page.keyboard.press('6');
  await page.getByRole('button', { name: tuile }).first().click();
};

const ECRANS: { nom: string; titre: string | RegExp; lieu?: 'centre' | 'bourg'; aller: (page: Page) => Promise<void> }[] = [
  { nom: 'Pension', titre: 'Pension', lieu: 'bourg', aller: async page => { await page.getByRole('button', { name: 'Pension Pokémon', exact: true }).click(); } },
  { nom: 'Centre commercial', titre: /./, lieu: 'centre', aller: async page => {
    await page.keyboard.press('5');
    await page.getByRole('button', { name: /Céladopole/ }).last().click();
    await page.getByRole('dialog', { name: 'Céladopole', exact: true }).getByRole('button', { name: 'Centre commercial' }).click();
  } },
  { nom: 'PC', titre: 'PC de Léo', aller: async page => { await page.keyboard.press('3'); } },
  { nom: 'Shop', titre: 'Shop', aller: async page => { await page.keyboard.press('4'); } },
  { nom: 'Carte', titre: /^Carte/, aller: async page => { await page.keyboard.press('5'); } },
  { nom: 'Menu', titre: 'Menu', aller: async page => { await page.keyboard.press('6'); } },
  { nom: 'Monde', titre: 'Monde', aller: page => menu(page, /^Monde/) },
  { nom: 'Réglages', titre: 'Réglages', aller: page => menu(page, /^Réglages/) },
  { nom: 'Pokédex', titre: 'Pokédex', aller: page => menu(page, /^Pokédex/) },
  { nom: 'Badges', titre: 'Badges', aller: page => menu(page, /^Badges/) },
  { nom: 'Statistiques', titre: 'Statistiques', aller: page => menu(page, /^Statistiques/) },
  { nom: 'Guide', titre: 'Guide du jeu', aller: page => menu(page, /^Guide du jeu/) },
];

/** Mesures communes : pas de défilement de page, pas de débordement horizontal, sprites dans leur cadre et sans fond. */
async function mesurer(page: Page) {
  return page.evaluate(() => {
    const contenu = document.getElementById('contenu')!;
    const dehors: string[] = [];
    const sprites: string[] = [];
    for (const element of contenu.querySelectorAll<HTMLElement>('*')) {
      const r = element.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || getComputedStyle(element).visibility === 'hidden') continue;
      if (element.closest('[inert], [hidden], dialog:not([open])')) continue;
      // Un élément dans une liste qui défile peut être hors du cadre visible ; on ne contrôle que l'horizontale de la fenêtre.
      if (r.right > innerWidth + 1 || r.left < -1) dehors.push(`${element.tagName}.${element.className}`.slice(0, 80));
    }
    for (const image of contenu.querySelectorAll<HTMLImageElement>('img[src*="/sprites/"], img[src*="/easter-eggs/"]')) {
      const a = image.getBoundingClientRect();
      if (a.width === 0 || a.height === 0) continue;
      const cadre = image.closest('li, button, figure, .cadre, section, dialog') ?? image.parentElement!;
      const b = cadre.getBoundingClientRect();
      const style = getComputedStyle(image);
      const ratio = (a.width / a.height) / (image.naturalWidth / image.naturalHeight || 1);
      const fond = style.backgroundColor;
      const contenu_ = a.left >= b.left - 1 && a.right <= b.right + 1 && a.top >= b.top - 1 && a.bottom <= b.bottom + 1;
      if (!contenu_ || fond !== 'rgba(0, 0, 0, 0)' || (style.objectFit !== 'contain' && Math.abs(ratio - 1) > 0.03)) sprites.push(`${image.getAttribute('src')} contenu=${contenu_} fond=${fond} ratio=${ratio.toFixed(2)}`);
    }
    return {
      page: document.documentElement.scrollHeight - innerHeight, pageX: document.documentElement.scrollWidth - innerWidth,
      contenuY: contenu.scrollHeight - contenu.clientHeight, contenuX: contenu.scrollWidth - contenu.clientWidth, dehors, sprites,
    };
  });
}

for (const [largeur, hauteur] of TAILLES) {
  test.describe(`${largeur}×${hauteur}`, () => {
    for (const ecran of ECRANS) {
      test(`${ecran.nom} : ni défilement de page ni débordement, sprites dans leur cadre, clavier`, async ({ page }) => {
        await demarrer(page, largeur, hauteur, ecran.lieu);
        await ecran.aller(page);
        await expect(page.getByRole('heading', { name: ecran.titre, level: 1 }).first()).toBeVisible();
        await page.waitForTimeout(400);
        for (const image of await page.locator('#contenu img').all()) {
          if (await image.isVisible()) await image.evaluate((img: HTMLImageElement) => img.decode().catch(() => undefined));
        }
        const m = await mesurer(page);
        expect(m.page, 'la page défile en hauteur').toBeLessThanOrEqual(0);
        expect(m.pageX, 'la page défile en largeur').toBeLessThanOrEqual(0);
        expect(m.contenuY, 'la zone de contenu défile en hauteur').toBeLessThanOrEqual(1);
        expect(m.contenuX, 'la zone de contenu défile en largeur').toBeLessThanOrEqual(1);
        expect(m.dehors, 'éléments hors de la fenêtre').toEqual([]);
        expect(m.sprites, 'sprites hors cadre, avec fond ou déformés').toEqual([]);
        // Clavier : chaque Tab (deux au plus, la page Monde n'a que deux contrôles) amène le focus sur un contrôle visible, avec une marque de focus.
        await page.locator('#contenu').focus();
        for (let i = 0; i < 2; i++) {
          await page.keyboard.press('Tab');
          const focus = await page.evaluate(() => {
            const e = document.activeElement as HTMLElement | null;
            if (!e || e === document.body) return null;
            const s = getComputedStyle(e);
            return { visible: e.getBoundingClientRect().width > 0, contour: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0, ombre: s.boxShadow !== 'none' };
          });
          expect(focus, `Tab ${i + 1} : aucun élément ne prend le focus`).not.toBeNull();
          expect(focus!.visible).toBe(true);
          expect(focus!.contour || focus!.ombre, 'focus sans marque visible').toBe(true);
        }
      });
    }
  });
}

// Comportements propres au PC (1440 px) : raccourci « / », grilles du Menu et des Badges, repère de la Carte, fenêtre de Céladopole, curseurs de volume.
test.describe('détails PC', () => {
  test('« / » met le focus dans la recherche du PC et du Pokédex', async ({ page }) => {
    await demarrer(page, 1440, 900);
    await page.keyboard.press('3');
    await expect(page.getByRole('heading', { name: 'PC de Léo', level: 1 })).toBeVisible();
    await page.keyboard.press('/');
    await expect(page.locator('#recherche-pc')).toBeFocused();
    await page.locator('#recherche-pc').blur();
    await menu(page, /^Pokédex/);
    await expect(page.getByRole('heading', { name: 'Pokédex', level: 1 }).first()).toBeVisible();
    await page.keyboard.press('/');
    await expect(page.locator('#contenu input[type="search"]')).toBeFocused();
  });

  test('le Menu a trois colonnes et les Badges quatre', async ({ page }) => {
    await demarrer(page, 1440, 900);
    await page.keyboard.press('6');
    await expect(page.getByRole('heading', { name: 'Menu', level: 1 })).toBeVisible();
    const colonnes = (selecteur: string) => page.locator(selecteur).first().evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length);
    expect(await colonnes('.menu-pc-tuiles')).toBe(3);
    await page.getByRole('button', { name: /^Badges/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Badges', level: 1 })).toBeVisible();
    expect(await colonnes('.badges-pc > .grid')).toBe(4);
  });

  test('Carte : la zone actuelle clignote, sans animation en mouvement réduit, et le dresseur n’apparaît qu’en vol', async ({ page }) => {
    await demarrer(page, 1440, 900, false, false);
    await page.keyboard.press('5');
    const repere = page.locator('circle[data-actuelle]');
    await expect(repere).toHaveCount(1);
    expect(await repere.evaluate(e => getComputedStyle(e).animationName)).toContain('carte-pc-clignote');
    // Le clignotement remplit le rond (disque vert à la taille du rond de base) : pas de trait épais autour.
    expect(await repere.evaluate(e => getComputedStyle(e).fill)).not.toBe('none');
    await expect(page.locator('image[data-dresseur]')).toHaveCount(0);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    expect(await repere.evaluate(e => getComputedStyle(e).animationName)).toBe('none');
    expect(await repere.evaluate(e => parseFloat(getComputedStyle(e).strokeWidth))).toBeGreaterThan(0);
    expect(await repere.evaluate(e => getComputedStyle(e).opacity)).toBe('1');
  });

  test('Carte : Céladopole ouvre une fenêtre à trois choix', async ({ page }) => {
    await demarrer(page, 1440, 900, 'centre');
    await page.keyboard.press('5');
    await page.getByRole('button', { name: /Céladopole/ }).last().click();
    const fenetre = page.getByRole('dialog', { name: 'Céladopole', exact: true });
    await expect(fenetre).toBeVisible();
    await expect(fenetre.getByRole('button', { name: /^(Arène|Centre commercial|Casino)/ })).toHaveCount(3);
    for (const nom of [/Arène/, 'Centre commercial', 'Casino']) await expect(fenetre.getByRole('button', { name: nom })).toBeVisible();
  });

  test('Réglages : deux curseurs de volume réglables au clavier', async ({ page }) => {
    await demarrer(page, 1440, 900);
    await menu(page, /^Réglages/);
    for (const nom of ['Volume de la musique', 'Volume des effets sonores']) {
      const curseur = page.getByRole('slider', { name: nom });
      await expect(curseur).toBeVisible();
      if (!await curseur.isEnabled()) continue;
      const avant = Number(await curseur.inputValue());
      await curseur.focus();
      await page.keyboard.press(avant > 50 ? 'ArrowLeft' : 'ArrowRight');
      expect(Number(await curseur.inputValue())).not.toBe(avant);
    }
  });
});