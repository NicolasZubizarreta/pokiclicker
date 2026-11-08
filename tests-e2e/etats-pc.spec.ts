import { expect, type Page } from '@playwright/test';
import { test, verifierEtat } from './aide-etats-pc';
import type { DonneesRegion } from '../src/core/sauvegarde-types';

test.beforeEach(async ({ page }, info) => {
  test.skip(info.project.name !== 'pc', 'États du jeu : projet pc seulement');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install();
  await page.clock.pauseAt(new Date());
});

async function demarrer(page: Page, options: { rempli?: boolean; vide?: boolean; objet?: boolean } = {}) {
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(options => {
    if (sessionStorage.getItem('i4-prepare')) return;
    sessionStorage.setItem('i4-prepare', '1');
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!) as { donnees: DonneesRegion; revision: number };
    const d = enveloppe.donnees;
    d.bossVaincus = ['kanto.route-1', 'kanto.foret-de-jade'];
    d.argent = 250_000;
    const especes = [1, 4, 7, 16, 19, 25, 35, 39, 52, 54, 58, 60, 63, 66, 74, 77, 79, 92, 95, 96, 104, 109, 111, 116, 129, 133, 143, 147];
    if (options.rempli) d.pc = especes.map((n, i) => ({ uid: `pc-${i}`, numero: n, niveau: 1 + (i * 7) % 60, xp: 0, shiny: i === 3, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male' as const, favori: i % 5 === 0 }));
    else d.pc = [];
    if (options.vide) d.inventaire = {};
    if (options.objet) d.inventaire = { everstone: 1 };
    enveloppe.revision++;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, options);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.locator('body').click({ position: { x: 5, y: 5 } });
}

async function menu(page: Page, nom: RegExp) {
  await page.keyboard.press('6');
  await page.getByRole('button', { name: nom }).first().click();
}

const etats: { id: string; nom: string; options?: Parameters<typeof demarrer>[1]; aller(page: Page): Promise<void> }[] = [
  { id: 'pc-vide', nom: 'PC vide', aller: async page => {
    await page.keyboard.press('3');
    await expect(page.getByRole('heading', { name: 'PC de Léo' })).toBeVisible();
    await expect(page.getByText('Ton PC est vide. Capture des Pokémon pour les ranger ici.', { exact: true })).toBeVisible();
  } },
  { id: 'pc-sans-resultat', nom: 'recherche sans résultat', options: { rempli: true }, aller: async page => {
    await page.keyboard.press('3'); await page.keyboard.press('/');
    await page.getByRole('searchbox').fill('introuvable-i4');
    await expect(page.getByRole('status')).toContainText('introuvable-i4');
  } },
  { id: 'pc-fiche-dernier', nom: 'fiche du dernier Pokémon actif', aller: async page => {
    await page.keyboard.press('2');
    const fiches = page.locator('#contenu').getByRole('button', { name: /, niveau / });
    while (await fiches.count() > 1) {
      await fiches.last().click();
      await page.getByRole('dialog').getByRole('button', { name: 'Envoyer au PC', exact: true }).click();
    }
    await fiches.first().click();
    const fiche = page.getByRole('dialog');
    await expect(fiche.getByRole('button', { name: 'Envoyer au PC', exact: true })).toBeDisabled();
    await expect(fiche.getByRole('button', { name: 'Relâcher', exact: true })).toBeDisabled();
    await expect(fiche.getByText("C'est ton dernier Pokémon : garde-le dans l'équipe.").first()).toBeVisible();
  } },
  { id: 'equipe-choix', nom: 'choix dans l’Équipe depuis le Sac', options: { objet: true }, aller: async page => {
    await page.keyboard.press('s');
    await page.getByRole('region', { name: 'Sac', exact: true }).getByRole('button', { name: 'Pierre Stase ×1', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Pierre Stase : touche un Pokémon' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Annuler', exact: true })).toBeVisible();
  } },
  { id: 'badges-aucun', nom: 'aucun badge', aller: async page => {
    await menu(page, /^Badges/); await expect(page.getByRole('heading', { name: 'Badges', exact: true })).toBeVisible();
  } },
  { id: 'pokedex-inconnu', nom: 'détail d’une espèce inconnue', aller: async page => {
    await menu(page, /^Pokédex/);
    await page.getByRole('button', { name: /^Pokémon inconnu, numéro / }).first().click();
    await expect(page.locator('.dex-panneau')).toContainText('???');
  } },
  { id: 'raccourcis', nom: 'raccourcis clavier', aller: async page => {
    await page.keyboard.press('?'); await expect(page.getByRole('dialog')).toBeVisible();
  } },
  { id: 'focus', nom: 'premier contrôle au clavier', aller: async page => {
    await page.locator('#contenu').focus(); await page.keyboard.press('Tab');
  } },
];

for (const etat of etats) {
  test(`États PC : ${etat.nom} (${etat.id})`, async ({ page }) => {
    await demarrer(page, etat.options); await etat.aller(page);
    await verifierEtat(page, etat.id, async () => {
      if (etat.id === 'focus') expect(await page.evaluate(() => {
        const s = getComputedStyle(document.activeElement!);
        return s.outlineStyle !== 'none' || s.boxShadow !== 'none';
      }), 'marque de focus visible').toBe(true);
    });
  });
}

for (const nom of ['Daran', 'Gabriel']) {
  test(`États PC : Pokémon renommé ${nom} (easter-${nom.toLowerCase()})`, async ({ page }) => {
    await demarrer(page); await page.keyboard.press('2');
    await page.locator('#contenu').getByRole('button', { name: /, niveau / }).first().click();
    const fiche = page.getByRole('dialog');
    await fiche.getByRole('button', { name: /^Renommer / }).click();
    await fiche.getByRole('textbox').fill(nom); await fiche.getByRole('textbox').press('Enter');
    await expect(fiche.getByRole('heading', { level: 2 }).first()).toContainText(nom);
    await page.keyboard.press('Escape');
    await expect(page.locator('#contenu').getByRole('button', { name: new RegExp(`^${nom}, niveau `) })).toBeVisible();
    await verifierEtat(page, `easter-${nom.toLowerCase()}`);
  });
}

test('États PC : notification fixe en bas à droite (notifications)', async ({ page }) => {
  await demarrer(page); await page.keyboard.press('4');
  const rect = () => page.locator('#contenu').evaluate(e => e.getBoundingClientRect().toJSON());
  const avant = await rect();
  await page.getByRole('article').first().getByRole('button', { name: /^Acheter/ }).click();
  const notification = page.locator('[data-notifications] div[aria-live]:not([data-annonce-deblocage]) p').first();
  await expect(notification).toBeVisible();
  const apres = await rect();
  await verifierEtat(page, 'notifications', async () => {
    expect(apres).toEqual(avant);
    await expect(notification).toBeVisible();
    const b = (await notification.boundingBox())!;
    const taille = page.viewportSize()!;
    expect(b.x + b.width).toBeGreaterThan(taille.width - 32);
    expect(b.y + b.height).toBeGreaterThan(taille.height - 32);
    expect(b.x + b.width).toBeLessThanOrEqual(taille.width);
    expect(b.y + b.height).toBeLessThanOrEqual(taille.height);
    expect(await notification.evaluate(e => {
      for (let p: Element | null = e; p; p = p.parentElement) if (getComputedStyle(p).position === 'fixed') return true;
      return false;
    })).toBe(true);
  });
});

test.fixme('États PC : arrêt auto — aucun bouton Reprendre dans le combat actuel (combat-arret-auto)', async () => {});
test.fixme('États PC : fin de zone — aucune annonce zone terminée dans le combat actuel (combat-fin-zone)', async () => {});
