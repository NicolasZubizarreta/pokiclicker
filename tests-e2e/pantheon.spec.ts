import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';
import zones from '../data/regions/kanto/zones.json' with { type: 'json' };
import pantheon from '../data/pantheon.json' with { type: 'json' };

const bossAvantLigue = zones.zones.slice(1, 21).map(zone => zone.id);
const instant = new Date('2026-10-25T12:00:00Z');
// Six espèces, dont un shiny (Dracaufeu) : le Panthéon doit montrer l'équipe de la sauvegarde.
const equipe = [3, 6, 9, 65, 94, 149];
const nomsEquipe = ['Florizarre', 'Dracaufeu', 'Tortank', 'Alakazam', 'Ectoplasma', 'Dracolosse'];

async function demarrer(page: Page, ligueGagnee: number, taille: number) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(instant);
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(({ gagnee, vaincus, numeros, nombre }) => {
    if (sessionStorage.getItem('pantheon-prepare')) return;
    sessionStorage.setItem('pantheon-prepare', '1');
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const region = enveloppe.donnees;
    region.equipe = numeros.slice(0, nombre).map((numero, index) => ({
      uid: `pantheon-${numero}`, numero, niveau: 100, xp: 0, shiny: numero === 6,
      bonheur: 0, pierreEternelle: false, calcium: 0, sexe: index % 2 ? 'femelle' : 'male', favori: false,
    }));
    region.zoneId = 'kanto.ligue-pokemon';
    region.etape = 10;
    region.bossVaincus = vaincus;
    region.badges = ['roche', 'cascade', 'foudre', 'prisme', 'ame', 'marais', 'volcan', 'terre'];
    region.starterId = 7;
    region.ligueGagnee = gagnee;
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { gagnee: ligueGagnee, vaincus: bossAvantLigue, numeros: equipe, nombre: taille });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Maître Blue (Florizarre)', exact: true })).toBeVisible();
}

// Même injection que ligue.spec.ts : un seul PV au dernier adversaire, le reste du combat est réel.
async function dernierPv(page: Page) {
  let injections = 0;
  await page.route('**/assets/*.js', async route => {
    const reponse = await route.fetch();
    const source = await reponse.text();
    const corps = source.replace(/\bpv:([\w$]+),pvMax:\1\b/g, (_, maximum: string) => {
      injections++;
      return `pv:1,pvMax:${maximum}`;
    });
    await route.fulfill({ response: reponse, body: corps });
  });
  return () => expect(injections, 'Injection du dernier PV dans le combat compilé').toBeGreaterThan(0);
}

async function gagner(page: Page) {
  const arret = page.getByRole('button', { name: 'Arrêt auto', exact: true });
  if (await arret.getAttribute('aria-pressed') === 'true') await arret.click();
  const auto = page.getByRole('button', { name: 'Auto-attaque', exact: true });
  if (await auto.getAttribute('aria-pressed') === 'true') await auto.click();
  await page.getByRole('button', { name: /^Attaquer / }).click();
  await page.clock.runFor(100);
}

async function regionSauvee(page: Page) {
  return page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
}

const sansDefilement = (page: Page) => page.evaluate(() =>
  document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth);

test('Panthéon : première victoire, Chen dit trois lignes, l’équipe de la sauvegarde est honorée', async ({ page }, informations) => {
  const verifierInjection = await dernierPv(page);
  await demarrer(page, 0, 6);
  verifierInjection();
  await gagner(page);
  const salle = page.getByRole('dialog', { name: 'Panthéon' });
  await expect(salle).toBeVisible();
  // Fondu au noir puis retour (mouvement réduit : les délais restent, pas l'animation), puis Chen.
  await page.clock.runFor(pantheon.delais.fonduNoirMs + pantheon.delais.fonduRetourMs + pantheon.delais.entreeChenMs);
  for (const [index, ligne] of pantheon.dialogues.entries()) {
    const bouton = salle.getByRole('button', { name: `Professeur Chen : ${ligne}` });
    await expect(bouton, `ligne ${index + 1} de Chen`).toBeVisible();
    await bouton.click();
    // Un premier clic termine l'écriture du texte, un second passe à la ligne suivante.
    if (await bouton.isVisible().catch(() => false)) await bouton.click();
    await page.clock.runFor(50);
  }
  await page.clock.runFor(pantheon.delais.sortieChenMs + pantheon.delais.apresChenMs + 100);
  for (const nom of nomsEquipe) await expect(salle.getByRole('img', { name: nom, exact: true })).toBeVisible();
  await expect(salle.locator('.halo-shiny')).toHaveCount(1);
  await expect(salle.getByRole('heading', { name: /MAÎTRE DE LA\s*LIGUE DE KANTO/ })).toBeVisible();
  expect(await sansDefilement(page)).toBe(true);
  await mkdir('design/captures', { recursive: true });
  const largeur = informations.project.name === 'mobile' ? 390 : 1440;
  await page.screenshot({ path: `design/captures/r-pantheon-${largeur}.png`, animations: 'disabled' });
  if (largeur === 1440) {
    await page.setViewportSize({ width: 1915, height: 1000 });
    expect(await sansDefilement(page)).toBe(true);
    await page.screenshot({ path: 'design/captures/r-pantheon-1915.png', animations: 'disabled' });
  }
  await salle.getByRole('button', { name: pantheon.boutonSortie, exact: true }).click();
  await expect(salle).toHaveCount(0);
  const region = await regionSauvee(page);
  expect(region.ligueGagnee).toBe(1);
  expect(region.zoneId).toBe('kanto.bourg-palette');
});

test('Panthéon : victoires suivantes sans Chen, équipe de deux Pokémon et socles vides', async ({ page }) => {
  const verifierInjection = await dernierPv(page);
  await demarrer(page, 1, 2);
  verifierInjection();
  await gagner(page);
  const salle = page.getByRole('dialog', { name: 'Panthéon' });
  await expect(salle).toBeVisible();
  await page.clock.runFor(pantheon.delais.fonduNoirMs + pantheon.delais.fonduRetourMs + 200);
  await expect(salle.getByRole('button', { name: /^Professeur Chen/ })).toHaveCount(0);
  await expect(salle.getByRole('img', { name: nomsEquipe[0]!, exact: true })).toBeVisible();
  await expect(salle.getByRole('img', { name: nomsEquipe[1]!, exact: true })).toBeVisible();
  await expect(salle.locator('[data-partenaire]:not([hidden])')).toHaveCount(2);
  await expect(salle.locator('[data-partenaire]')).toHaveCount(2);
  await salle.getByRole('button', { name: pantheon.boutonSortie, exact: true }).click();
  await expect(salle).toHaveCount(0);
  expect((await regionSauvee(page)).ligueGagnee).toBe(2);
});
