import { test, expect, type Page } from '@playwright/test';
import type { DonneesRegion } from '../src/core/sauvegarde';
import zones from '../data/regions/kanto/zones.json' with { type: 'json' };
import reglages from '../data/reglages.json' with { type: 'json' };

test.use({ trace: 'off' });

const instant = new Date('2026-10-25T12:00:00Z');
const raisonRonflex = 'Un Ronflex endormi bloque la route de Parmanie. Joue de la Pokéflûte pour le réveiller.';

async function preparer(page: Page, ronflex: boolean, surcharge: Partial<DonneesRegion> = {}, reducedMotion: 'reduce' | 'no-preference' = 'reduce') {
  await page.emulateMedia({ reducedMotion });
  await page.clock.install({ time: instant });
  await page.clock.pauseAt(instant);
  await page.addInitScript(() => { Math.random = () => 0.1; });
  // Même préparation que ligue.spec.ts : seuls les PV initiaux sont réduits,
  // les attaques, transitions et récompenses passent par le jeu compilé.
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
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  const vaincus = ronflex
    ? zones.zones.filter(zone => !zone.sansCombat && zone.ancienId > 0 && zone.ancienId < 12).map(zone => zone.id)
    : zones.zones.slice(1, 7).map(zone => zone.id);
  await page.addInitScript(({ centrale, boss, surcharge }) => {
    if (sessionStorage.getItem('scenes-prepare')) return;
    sessionStorage.setItem('scenes-prepare', '1');
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    const enveloppe = JSON.parse(localStorage.getItem(cle)!);
    const region = enveloppe.donnees;
    region.equipe = [3, 6, 9, 65, 94, 149].map(numero => ({
      uid: `scenes-${numero}`, numero, niveau: 100, xp: 0, shiny: false,
      bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
    }));
    region.zoneId = centrale ? 'kanto.arene-de-celadopole' : 'kanto.pont-pepite';
    region.etape = 1;
    region.bossVaincus = boss;
    region.badges = centrale ? ['roche', 'cascade', 'foudre', 'prisme'] : ['roche', 'cascade'];
    region.starterId = 4;
    region.ligueGagnee = 0;
    region.objetsCles = [];
    Object.assign(region, surcharge);
    enveloppe.revision += 1;
    localStorage.setItem(cle, JSON.stringify(enveloppe));
  }, { centrale: ronflex, boss: vaincus, surcharge });
  await page.reload();
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  expect(injections, 'Injection du dernier PV dans le combat compilé').toBeGreaterThan(0);
  const auto = page.getByRole('button', { name: 'Auto-attaque', exact: true });
  if (await auto.getAttribute('aria-pressed') === 'true') await auto.click();
}

async function regionSauvee(page: Page): Promise<DonneesRegion> {
  return page.evaluate(() => {
    const cle = Object.keys(localStorage).find(c => c.startsWith('pokiclicker:region:') && c.endsWith(':kanto'))!;
    return JSON.parse(localStorage.getItem(cle)!).donnees;
  });
}

async function selectionner(page: Page, nom: string) {
  await page.getByRole('button', { name: 'Carte', exact: true }).click();
  await page.locator(`[data-forme="${nom}"]`).first().focus();
  await page.keyboard.press('Enter');
}

async function voyager(page: Page, nom: string) {
  await selectionner(page, nom);
  await page.getByRole('button', { name: 'Y aller', exact: true }).click();
  const vol = reglages.interface.vol;
  const reduit = await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  await page.clock.runFor(reduit ? vol.fonduReduitMs : vol.poseMs + vol.volMs + vol.fermetureMs);
}

async function dialogue(page: Page, texte: string) {
  const fenetre = page.getByRole('dialog', { name: 'Dialogue de scène' });
  await expect(fenetre).toBeVisible();
  if (!(await fenetre.textContent())?.includes(texte)) await fenetre.getByRole('button').click();
  await expect(fenetre).toContainText(texte);
  await fenetre.getByRole('button').click();
}

async function vaincre(page: Page, nom: string | RegExp) {
  await expect(page.getByRole('heading', { name: nom, exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Attaquer / }).click();
  await page.clock.runFor(100);
  // Le Pokémon suivant apparaît après `delais.ennemiSuivantMs` (2 000 ms).
  await page.clock.runFor(2100);
}

async function jouerSouffle(page: Page) {
  const bouton = page.getByRole('button', { name: 'Souffler', exact: true });
  const jauge = page.getByRole('progressbar', { name: 'Niveau de souffle' });
  await expect(bouton).toBeFocused();
  await bouton.hover();
  await page.mouse.down();
  await expect(bouton).toHaveAttribute('aria-pressed', 'true');
  await page.clock.runFor(400);
  await page.mouse.up();
  await expect(bouton).toHaveAttribute('aria-pressed', 'false');
  const p = reglages.ronflex.souffle;
  // Lire la cible affichée et agir sur les vraies commandes, sans modifier l'état du jeu.
  let touche: 'Space' | 'a' = 'Space';
  let maintien = false;
  for (let tour = 0; tour < 600 && await bouton.count(); tour++) {
    const cible = await jauge.evaluate(element => Number(element.style.getPropertyValue('--cible')));
    const niveau = Number(await jauge.getAttribute('aria-valuenow')) / 100;
    const souffler = niveau < cible + p.largeurCible / 2;
    if (souffler !== maintien) {
      if (souffler) await page.keyboard.down(touche);
      else {
        await page.keyboard.up(touche);
        touche = touche === 'Space' ? 'a' : 'Space';
      }
      maintien = souffler;
    }
    await page.clock.runFor(100);
  }
  await page.keyboard.up(touche);
  await expect(bouton).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Dialogue de scène' }).getByRole('button'))
    .toHaveAccessibleName(/La mélodie de la Pokéflûte réveille Ronflex !/);
}

for (const largeur of [390, 1440]) {
  test.describe(`Scènes à ${largeur} px`, () => {
    test.use({ viewport: { width: largeur, height: 900 } });

    test('Pont Pépite vaincu : Blue à Carmin, victoire puis aucun rejeu', async ({ page }) => {
      await preparer(page, false);
      const avant = await regionSauvee(page);
      expect(avant.bossVaincus).toContain('kanto.pont-pepite');
      await voyager(page, 'Arène de Carmin');
      await dialogue(page, 'Avant de défier le Champion');
      for (const nom of ['Roucoups', 'Rattatac', 'Kadabra', 'Carabaffe']) {
        await vaincre(page, `Blue (${nom})`);
      }
      await dialogue(page, 'Pas mal ! Va donc tenter ta chance');
      const apres = await regionSauvee(page);
      expect(apres.evenementsJoues).toContain('kanto.rival-carmin');
      expect(apres.bossVaincus).toEqual(avant.bossVaincus);
      expect(apres.badges).toEqual(avant.badges);
      expect(apres.ligueGagnee).toBe(0);
      expect(apres.zoneId).toBe('kanto.arene-de-carmin');
      expect(apres.etape).toBe(1);
      await page.reload();
      await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
      await expect(page.getByRole('dialog', { name: 'Dialogue de scène' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: /^Blue \(/ })).toHaveCount(0);
      await voyager(page, 'Pont Pépite');
      await voyager(page, 'Arène de Carmin');
      await expect(page.getByRole('dialog', { name: 'Dialogue de scène' })).toHaveCount(0);
      await expect(page.getByRole('heading', { name: /^Blue \(/ })).toHaveCount(0);
      expect((await regionSauvee(page)).evenementsJoues).toContain('kanto.rival-carmin');
    });

    test('Route 1, premier boss : Chen explique les zones, le combat attend, puis aucun rejeu', async ({ page }) => {
      await preparer(page, false, { zoneId: 'kanto.route-1', etape: 10, bossVaincus: [], badges: [] });
      await page.clock.runFor(200);
      const fenetre = page.getByRole('dialog', { name: 'Dialogue de scène' });
      await expect(fenetre).toBeVisible();
      await expect(fenetre).toContainText('Prof. Chen');
      const sprite = fenetre.locator('img[src="img/sprites/chen/chen-1.png"]');
      await expect(sprite).toBeVisible();
      const boite = fenetre.getByRole('button');
      const [haut, bas] = await Promise.all([sprite.boundingBox(), boite.boundingBox()]);
      expect(haut!.y + haut!.height).toBeLessThanOrEqual(bas!.y + 1);
      expect(bas!.x + bas!.width).toBeLessThanOrEqual(largeur);
      // Le chrono de 30 s ne tourne pas pendant les explications : 40 s plus tard, on est toujours à l'étape 10.
      await page.clock.runFor(40_000);
      await expect(page.getByText('Étape 10 sur 10')).toBeVisible();
      await dialogue(page, 'Chaque zone a 10 étapes');
      await dialogue(page, 'Tu as 30 secondes');
      await dialogue(page, 'tu reviens à l\'étape 9');
      await dialogue(page, 'tu débloques la zone suivante');
      await expect(fenetre).toHaveCount(0);
      expect((await regionSauvee(page)).evenementsJoues).toContain('kanto.chen-premier-boss');
      await expect(page.getByText('Étape 10 sur 10')).toBeVisible();
      // Le chrono démarre à la fin du dialogue : l'échec ramène à l'étape 9, sans nouveau dialogue.
      await page.clock.runFor(31_000);
      await expect(page.getByText('Étape 9 sur 10')).toBeVisible();
      await expect(fenetre).toHaveCount(0);
      await page.reload();
      await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
      await page.clock.runFor(200);
      await expect(fenetre).toHaveCount(0);
    });

    test('Forêt de Jade : Blue est présenté avant son défi, sprite à côté du texte, puis plus jamais', async ({ page }) => {
      await preparer(page, false, { zoneId: 'kanto.route-1', etape: 1, bossVaincus: ['kanto.route-1'], badges: [] });
      await voyager(page, 'Forêt de Jade');
      const fenetre = page.getByRole('dialog', { name: 'Dialogue de scène' });
      await expect(fenetre).toBeVisible();
      await expect(fenetre).toContainText('Blue');
      await expect(fenetre).toContainText('petit-fils du Prof. Chen');
      const sprite = fenetre.locator('img[src$="img/sprites/blue/blue-1.png"]');
      await expect(sprite).toBeVisible();
      const [haut, bas] = await Promise.all([sprite.boundingBox(), fenetre.getByRole('button').boundingBox()]);
      expect(haut!.y + haut!.height).toBeLessThanOrEqual(bas!.y + 1);
      await dialogue(page, 'petit-fils du Prof. Chen');
      await dialogue(page, 'Je suis ton rival');
      await expect(sprite).toBeVisible();
      await dialogue(page, 'Voyons si ton Pokémon est aussi fort');
      const region = await regionSauvee(page);
      expect(region.evenementsJoues).toContain('kanto.blue-presentation');
      expect(region.evenementEnCours?.id).toBe('kanto.rival-foret');
    });

    for (const mouvement of ['reduce', 'no-preference'] as const) {
    test(`Centrale : Souffle, Ronflex et arrivée automatique à Parmanie (${mouvement})`, async ({ page }) => {
      await preparer(page, true, {
        zoneId: 'kanto.centrale', etape: reglages.combat.etapeBoss, objetsCles: ['pokeflute'],
      }, mouvement);
      const avant = await regionSauvee(page);
      expect(avant.bossVaincus).not.toContain('kanto.centrale');
      await expect(page.getByRole('dialog', { name: 'Dialogue de scène' })).toHaveCount(0);
      await selectionner(page, 'Route de Ronflex');
      const fiche = page.getByRole('region', { name: 'Zone sélectionnée' });
      await expect(page.getByRole('button', { name: 'Y aller', exact: true })).toHaveCount(0);
      await selectionner(page, 'Arène de Parmanie');
      await expect(page.getByRole('button', { name: 'Y aller', exact: true })).toHaveCount(0);
      expect((await regionSauvee(page)).zoneId).toBe('kanto.centrale');
      await page.getByRole('button', { name: 'Combat', exact: true }).click();
      await vaincre(page, /^Électhor/);
      const centrale = await regionSauvee(page);
      expect(centrale.bossVaincus).toEqual([...avant.bossVaincus, 'kanto.centrale']);
      await expect(page.getByRole('dialog', { name: 'Dialogue de scène' })).toHaveCount(0);
      await voyager(page, 'Route de Ronflex');
      await dialogue(page, raisonRonflex);
      await expect(page.getByRole('img', { name: 'Ronflex endormi', exact: true })).toBeVisible();
      if (mouvement === 'reduce') {
        expect(await page.getByRole('img', { name: 'Ronflex endormi', exact: true })
          .evaluate(element => getComputedStyle(element).animationName)).toBe('none');
      }
      await selectionner(page, 'Arène de Parmanie');
      await expect(fiche).toContainText('Bloquée');
      await expect(fiche).toContainText(raisonRonflex);
      await expect(page.getByRole('button', { name: 'Y aller', exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Équipe', exact: true }).click();
      const objets = page.getByRole('region', { name: 'Objets clés', exact: true });
      await expect(objets).toContainText('Pokéflûte');
      await objets.getByRole('button', { name: 'Utiliser Pokéflûte', exact: true }).click();
      await expect(objets.getByRole('status')).toHaveText('À utiliser devant Ronflex');
      await expect(page.getByRole('dialog', { name: 'Dialogue de scène' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Combat', exact: true }).click();
      await jouerSouffle(page);
      await page.reload();
      await expect(page.getByRole('img', { name: 'Ronflex réveillé', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Souffler', exact: true })).toHaveCount(0);
      await dialogue(page, 'La mélodie de la Pokéflûte réveille Ronflex !');
      await page.reload();
      await vaincre(page, 'Ronflex');
      const apres = await regionSauvee(page);
      expect(apres.drapeaux).toContain('ronflex-vaincu');
      expect(apres.objetsCles).toContain('pokeflute');
      expect(apres.bossVaincus).toEqual(centrale.bossVaincus);
      expect(apres.zoneId).toBe('kanto.route-de-ronflex');
      await page.reload();
      expect((await regionSauvee(page)).argent).toBe(apres.argent);
      await dialogue(page, 'La route de Parmanie est libre !');
      await expect(page.getByRole('heading', { name: 'Arène de Parmanie', exact: true })).toBeVisible();
      expect((await regionSauvee(page)).zoneId).toBe('kanto.arene-de-parmanie');
      for (const recharger of [false, true]) {
        if (recharger) await page.reload();
        await expect(page.getByRole('dialog', { name: 'Dialogue de scène' })).toHaveCount(0);
        await selectionner(page, 'Route de Ronflex');
        await expect(fiche).toContainText('Terminée');
        await expect(page.getByRole('button', { name: 'Y aller', exact: true })).toHaveCount(0);
        await page.keyboard.press('Enter');
        expect((await regionSauvee(page)).zoneId).toBe('kanto.arene-de-parmanie');
        expect((await regionSauvee(page)).argent).toBe(apres.argent);
        await page.getByRole('button', { name: 'Combat', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Souffler', exact: true })).toHaveCount(0);
      }
    });
    }
  });
}
