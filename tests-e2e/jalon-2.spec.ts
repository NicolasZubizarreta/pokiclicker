import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import zones from '../data/regions/kanto/zones.json' with { type: 'json' };

// Jalon 2 : Kanto jouable de bout en bout. Les parcours détaillés (capture, évolution, Shop, éclosion,
// casino, Ligue, Panthéon, fin) ont chacun leur fichier ; ce test vérifie les points communs :
// trois départs, sauvegardes aux étapes clés, trois tailles d'écran.
const badges = ['roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan', 'terre'];
const nomZone = (id: string) => zones.zones.find(zone => zone.id === id)!.nom;
const chen = (page: Page) => page.getByRole('button', { name: /^Prof\. Chen : / });

test.describe('Trois départs', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  for (const [starter, bouton] of [['Bulbizarre', 'CHOISIR BULBIZARRE'], ['Salamèche', 'CHOISIR SALAMÈCHE'], ['Carapuce', 'CHOISIR CARAPUCE']] as const) {
    test(`${starter} : l'équipe contient un seul Pokémon de niveau 5`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/');
      await page.getByRole('button', { name: 'JOUER' }).click();
      await page.getByRole('button', { name: 'Sortie', exact: true }).click();
      await page.getByRole('button', { name: 'Labo Pokémon du Prof. Chen', exact: true }).click();
      for (let ligne = 0; ligne < 7; ligne++) await chen(page).click();
      await expect(page.getByRole('heading', { name: 'CHOISIS TON PARTENAIRE' })).toBeVisible();
      await page.getByRole('button', { name: new RegExp(`^${starter}`) }).click();
      await page.getByRole('button', { name: bouton }).click();
      await page.getByRole('button', { name: 'Sortie', exact: true }).click();
      await page.getByRole('button', { name: 'Équipe', exact: true }).click();
      await expect(page.getByRole('button', { name: new RegExp(`^${starter}, niveau 5`) })).toBeVisible();
      await expect(page.getByRole('button', { name: /niveau/ })).toHaveCount(1);
    });
  }
});

async function charger(page: Page, zone: string, nombreBadges: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  const index = zones.zones.findIndex(z => z.id === zone);
  await page.addInitScript(({ id, nombre, vaincus, tous }) => {
    if (sessionStorage.getItem('jalon-prepare')) return;
    sessionStorage.setItem('jalon-prepare', '1');
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const region = enveloppe.donnees;
    region.equipe = [3, 6, 9, 65, 94, 149].map(numero => ({
      uid: `jalon-${numero}`, numero, niveau: 50, xp: 0, shiny: false,
      bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
    }));
    region.zoneId = id;
    region.etape = 1;
    region.bossVaincus = vaincus;
    region.badges = tous.slice(0, nombre);
    region.starterId = 7;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { id: zone, nombre: nombreBadges, vaincus: zones.zones.slice(1, index).map(z => z.id), tous: badges });
  await page.reload();
}

const etapes = [
  { zone: 'kanto.arene-d-argenta', badges: 1 },
  { zone: 'kanto.arene-de-celadopole', badges: 4 },
  { zone: 'kanto.arene-de-jadielle', badges: 7 },
  { zone: 'kanto.ligue-pokemon', badges: 8 },
];
test.describe('Sauvegardes aux étapes clés', () => {
  for (const { zone, badges: nombre } of etapes) {
    test(`${nomZone(zone)} avec ${nombre} badge${nombre > 1 ? 's' : ''} : la sauvegarde se charge sans erreur`, async ({ page }) => {
      const erreurs: string[] = [];
      page.on('pageerror', e => erreurs.push(e.message));
      page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
      await charger(page, zone, nombre);
      await expect(page.getByRole('navigation', { name: 'Navigation principale' })).toBeVisible();
      await page.getByRole('button', { name: 'Plus', exact: true }).click();
      await expect(page.getByText(`Kanto · ${nomZone(zone)}`, { exact: true })).toBeVisible();
      await expect(page.getByText(`${nombre} / 8`, { exact: true }).first()).toBeVisible();
      expect(erreurs).toEqual([]);
    });
  }
});

const anglais = /\b(Loading|Settings|Cancel|Save|Next|Previous|Close|Continue|Undefined|NaN|Something went wrong)\b/;
for (const largeur of [390, 1440, 1915]) {
  test(`Pages principales à ${largeur} px : sans défilement horizontal, sans erreur, sans anglais`, async ({ page }) => {
    await page.setViewportSize({ width: largeur, height: largeur === 390 ? 844 : 1000 });
    const erreurs: string[] = [];
    page.on('pageerror', e => erreurs.push(e.message));
    page.on('console', m => { if (m.type() === 'error') erreurs.push(m.text()); });
    await charger(page, 'kanto.arene-de-jadielle', 7);
    for (const onglet of ['Combat', 'Équipe', 'Shop', 'Carte', 'Plus']) {
      await page.getByRole('button', { name: onglet, exact: true }).click();
      await expect(page.getByRole('main')).toBeVisible();
      await page.evaluate(() => Promise.all([...document.images].map(image => image.decode().catch(() => undefined))));
      expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth), `${onglet} défile en largeur`).toBeLessThanOrEqual(1);
      const texte = await page.locator('body').innerText();
      expect(texte.match(anglais), `${onglet} contient de l'anglais`).toBeNull();
    }
    expect(erreurs).toEqual([]);
  });
}
