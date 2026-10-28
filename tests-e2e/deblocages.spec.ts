import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const instant = new Date('2026-10-28T12:00:00Z');
const zones = (JSON.parse(readFileSync('data/regions/kanto/zones.json', 'utf8')) as { zones: { id: string }[] }).zones.map(z => z.id);
const textes = Object.fromEntries((JSON.parse(readFileSync('data/deblocages.json', 'utf8')) as
  { deblocages: { id: string; texte: string }[] }).deblocages.map(d => [d.id, d.texte]));
const annoncesVuesComplet = ['sac', 'pc', 'pension', 'centre-commercial', 'casino', 'poke-radar-au-shop', 'poke-radar',
  'fauchage-au-shop', 'fauchage', 'auto-clic-au-shop', 'auto-clic'];
/** Durée d'une annonce de déblocage (interface.annonceDeblocageMs), en pas de 100 ms. */
const dureeAnnonce = (JSON.parse(readFileSync('data/reglages.json', 'utf8')) as { interface: { annonceDeblocageMs: number } }).interface.annonceDeblocageMs;

const test = base.extend<{ surveillance: void }>({
  surveillance: [async ({ page }, utiliser) => {
    const erreurs: string[] = [];
    const externes: string[] = [];
    page.on('console', message => { if (message.type() === 'error') erreurs.push(message.text()); });
    page.on('pageerror', erreur => erreurs.push(erreur.message));
    page.on('request', requete => {
      if (new URL(requete.url()).hostname !== 'localhost') externes.push(requete.url());
    });
    await utiliser();
    expect.soft(erreurs, 'Erreurs de console ou de page').toEqual([]);
    expect.soft(externes, 'Requêtes hors de localhost').toEqual([]);
  }, { auto: true }],
});

type Preparation = Record<string, unknown>;

/** Charge le jeu, remplace une fois les champs de la région sauvegardée, puis recharge. */
async function demarrer(page: Page, region: Preparation, supprimer: string[] = []) {
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(instant);
  await page.addInitScript(() => { Math.random = () => 0.1; });
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.addInitScript(([champs, retirer]) => {
    if (sessionStorage.getItem('deblocages-prepare')) return;
    sessionStorage.setItem('deblocages-prepare', '1');
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    Object.assign(enveloppe.donnees, champs);
    for (const nom of retirer as string[]) delete enveloppe.donnees[nom];
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, [region, supprimer] as const);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
}

const equipe = [3, 6, 9, 65, 94, 149].map(numero => ({
  uid: `deblocages-${numero}`, numero, niveau: 100, xp: 0, shiny: false,
  bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
}));

async function regionSauvee(page: Page) {
  return page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
}

/** Avance l'horloge par pas de 100 ms et relève ce que l'annonce de déblocage affiche (texte et nombre de cadres). */
async function relever(page: Page, ms: number) {
  const suite: { texte: string; cadres: number; animations: number }[] = [];
  for (let temps = 0; temps < ms; temps += 100) {
    await page.clock.runFor(100);
    suite.push(await page.evaluate(() => {
      const zone = document.querySelector('[data-annonce-deblocage]')!;
      return { texte: zone.textContent ?? '', cadres: zone.querySelectorAll('p').length,
        animations: zone.getAnimations({ subtree: true }).length };
    }));
  }
  return suite;
}
const distincts = (suite: { texte: string }[]) => suite.map(e => e.texte).filter((texte, i, tout) => texte && texte !== tout[i - 1]);

test('Tour Pokémon : l’annonce attend le dialogue de M. Fuji, puis Pension, Centre commercial et Casino s’enchaînent', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await demarrer(page, {
    zoneId: 'kanto.tour-pokemon', etape: 10, starterId: 1, equipe, argent: 0, drapeaux: [],
    evenementsJoues: ['kanto.intro', 'kanto.rival-tour'], bossVaincus: ['kanto.route-1', 'kanto.foret-de-jade'],
    annoncesVues: ['sac', 'pc'],
  }, ['evenementEnCours']);
  const auto = page.getByRole('button', { name: 'Auto-attaque', exact: true });
  if (await auto.getAttribute('aria-pressed') !== 'true') await auto.click();
  const dialogue = page.getByRole('button', { name: /^M\. Fuji : / });
  for (let tick = 0; tick < 300 && !await dialogue.isVisible(); tick++) await page.clock.runFor(100);
  await expect(dialogue).toBeVisible();
  // Rien ne se pose par-dessus le dialogue.
  expect((await relever(page, 3000)).map(e => e.texte)).toEqual(Array(30).fill(''));
  await auto.evaluate(bouton => (bouton as HTMLButtonElement).click());
  await dialogue.click();
  await expect(dialogue).not.toBeVisible();
  const suite = await relever(page, 11000);
  expect(distincts(suite)).toEqual([textes.pension, textes['centre-commercial'], textes.casino]);
  expect(suite.every(e => e.cadres <= 1)).toBe(true);
  for (const texte of [textes.pension, textes['centre-commercial'], textes.casino]) {
    // 3 s par annonce, relevées toutes les 100 ms (la première est déjà entamée quand le relevé commence).
    expect(suite.filter(e => e.texte === texte).length).toBeGreaterThanOrEqual(dureeAnnonce / 100 - 1);
    expect(suite.filter(e => e.texte === texte).length).toBeLessThanOrEqual(dureeAnnonce / 100);
  }
  expect((await regionSauvee(page)).annoncesVues).toEqual(['sac', 'pc', 'pension', 'centre-commercial', 'casino']);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  expect(distincts(await relever(page, 11000))).toEqual([]);
});

test('Poké-Radar, CT Fauchage et Auto-clic arrivent au Shop : trois annonces de 3 s, une à la fois, dans l’ordre, sans attendre l’achat', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await demarrer(page, {
    zoneId: 'kanto.route-1', etape: 1, starterId: 1, equipe, drapeaux: [], evenementsJoues: ['kanto.intro'],
    bossVaincus: zones, ameliorations: [],
    annoncesVues: annoncesVuesComplet.filter(id => !id.endsWith('-au-shop') && !['poke-radar', 'fauchage', 'auto-clic'].includes(id)),
  }, ['evenementEnCours']);
  const suite = await relever(page, 11000);
  const attendu = [textes['poke-radar-au-shop'], textes['fauchage-au-shop'], textes['auto-clic-au-shop']];
  expect(attendu).toEqual(['Poké-Radar disponible au Shop !', 'CT Fauchage disponible au Shop !', 'Auto-clic (Restes) disponible au Shop !']);
  expect(distincts(suite)).toEqual(attendu);
  expect(suite.every(e => e.cadres <= 1)).toBe(true);
  for (const texte of attendu) {
    expect(suite.filter(e => e.texte === texte).length).toBeGreaterThanOrEqual(dureeAnnonce / 100 - 1);
    expect(suite.filter(e => e.texte === texte).length).toBeLessThanOrEqual(dureeAnnonce / 100);
  }
  expect((await regionSauvee(page)).annoncesVues).toEqual(annoncesVuesComplet.filter(id => !['poke-radar', 'fauchage', 'auto-clic'].includes(id)));
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  expect(distincts(await relever(page, 3000))).toEqual([]);
});

test('Ancienne sauvegarde qui a déjà tout débloqué : aucune annonce, tout est noté comme vu', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await demarrer(page, {
    zoneId: 'kanto.route-1', etape: 1, starterId: 1, equipe, drapeaux: [], evenementsJoues: ['kanto.intro'],
    bossVaincus: zones, ameliorations: ['pokeradar', 'falseSwipe', 'leftovers'],
  }, ['evenementEnCours', 'annoncesVues']);
  expect(distincts(await relever(page, 6000))).toEqual([]);
  expect((await regionSauvee(page)).annoncesVues).toEqual(annoncesVuesComplet);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  expect(distincts(await relever(page, 3000))).toEqual([]);
});

for (const mouvement of ['reduce', 'no-preference'] as const) {
  test(`Mouvement ${mouvement === 'reduce' ? 'réduit' : 'normal'} : même texte, ${mouvement === 'reduce' ? 'sans' : 'avec'} animation`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: mouvement });
    await demarrer(page, {
      zoneId: 'kanto.route-1', etape: 1, starterId: 1, equipe, drapeaux: [], evenementsJoues: ['kanto.intro'],
      bossVaincus: zones, ameliorations: ['pokeradar'], annoncesVues: annoncesVuesComplet.filter(id => id !== 'poke-radar'),
    }, ['evenementEnCours']);
    const suite = await relever(page, 4000);
    expect(distincts(suite)).toEqual([textes['poke-radar']]);
    const visibles = suite.filter(e => e.texte);
    expect(visibles.length).toBeGreaterThanOrEqual(dureeAnnonce / 100 - 1);
    expect(visibles.length).toBeLessThanOrEqual(dureeAnnonce / 100);
    expect(visibles.some(e => e.animations > 0)).toBe(mouvement === 'no-preference');
  });
}
