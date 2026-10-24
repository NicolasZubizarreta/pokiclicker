import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

test('Fluidité : 60 secondes à 12 appuis/s avec processeur limité à 4×', async ({ page }, informations) => {
  test.skip(informations.project.name !== 'mobile', 'Mesure réservée au profil mobile.');
  await page.goto('/');
  await expect(page.getByRole('button', { name: /^Attaquer / })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const session = await page.context().newCDPSession(page);
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  try {
    const resultat = await page.evaluate(() => new Promise<{
      dureeMs: number; appuis: number; fpsMoyen: number; fpsMinimum: number;
      fpsParSeconde: number[]; rendusPvMaximumParNoeudParSeconde: number;
      rendusPvParSeconde: number[]; tachesLongues: number; dureesTachesLonguesMs: number[];
    }>(terminer => {
      const duree = 60_000;
      const debut = performance.now();
      const images = Array<number>(60).fill(0);
      const rendus = new Map<Node, number[]>();
      const taches: PerformanceEntry[] = [];
      const bouton = document.querySelector('button[aria-label^="Attaquer "]')!;
      let appuis = 0;
      let animation = 0;
      let minuteur = 0;
      const fenetre = () => Math.floor((performance.now() - debut) / 1000);
      const dessiner = () => {
        const seconde = fenetre();
        if (seconde < 60) images[seconde]!++;
        animation = requestAnimationFrame(dessiner);
      };
      const mutations = new MutationObserver(liste => {
        const seconde = fenetre();
        if (seconde >= 60) return;
        // Compter une mise à jour par paragraphe PV et livraison de mutations.
        const paragraphes = new Set<Node>();
        for (const mutation of liste) {
          const element = mutation.target instanceof Element ? mutation.target : mutation.target.parentElement;
          const paragraphe = element?.closest('p');
          if (paragraphe && /^PV \d+ \/ \d+$/.test(paragraphe.textContent ?? '')) paragraphes.add(paragraphe);
        }
        for (const paragraphe of paragraphes) {
          if (!rendus.has(paragraphe)) rendus.set(paragraphe, Array<number>(60).fill(0));
          rendus.get(paragraphe)![seconde]!++;
        }
      });
      mutations.observe(document.body, { subtree: true, characterData: true, childList: true });
      const longues = new PerformanceObserver(liste => taches.push(...liste.getEntries()));
      longues.observe({ type: 'longtask' });
      animation = requestAnimationFrame(dessiner);
      // Échéances absolues : 720 appuis, sans dérive cumulative de setInterval.
      const attaquer = () => {
        if (performance.now() - debut >= duree || appuis >= 720) return;
        bouton.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, pointerType: 'touch' }));
        appuis++;
        minuteur = window.setTimeout(attaquer, Math.max(0, debut + appuis * 1000 / 12 - performance.now()));
      };
      minuteur = window.setTimeout(attaquer, 0);
      window.setTimeout(() => {
        const fin = performance.now();
        cancelAnimationFrame(animation);
        clearTimeout(minuteur);
        mutations.disconnect();
        taches.push(...longues.takeRecords());
        longues.disconnect();
        const durees = taches.filter(tache => tache.startTime >= debut && tache.startTime < debut + duree && tache.duration > 50)
          .map(tache => tache.duration);
        const parNoeud = [...rendus.values()];
        terminer({
          dureeMs: fin - debut, appuis,
          fpsMoyen: images.reduce((somme, nombre) => somme + nombre, 0) / 60,
          fpsMinimum: Math.min(...images), fpsParSeconde: images,
          rendusPvMaximumParNoeudParSeconde: Math.max(0, ...parNoeud.flat()),
          rendusPvParSeconde: images.map((_, seconde) => Math.max(0, ...parNoeud.map(compteurs => compteurs[seconde]!))),
          tachesLongues: durees.length, dureesTachesLonguesMs: durees,
        });
      }, duree);
    }));
    await mkdir('test-results', { recursive: true });
    await writeFile('test-results/fluidite.json', JSON.stringify(resultat, null, 2) + '\n', 'utf8');
    console.log('Mesure de fluidité :', JSON.stringify(resultat));
    await informations.attach('Mesure de fluidité', { body: JSON.stringify(resultat, null, 2), contentType: 'application/json' });
    expect.soft(resultat.appuis, 'Nombre d’appuis sur 60 secondes').toBe(720);
    expect.soft(resultat.fpsMinimum, 'Minimum des fenêtres de 1 seconde').toBeGreaterThanOrEqual(50);
    expect.soft(resultat.fpsMoyen, 'Moyenne des images par seconde').toBeGreaterThanOrEqual(55);
    expect.soft(resultat.rendusPvMaximumParNoeudParSeconde, 'Rendus PV par seconde pour un même nœud').toBeLessThanOrEqual(10);
    expect.soft(resultat.tachesLongues, 'Tâches longues de plus de 50 ms').toBeLessThanOrEqual(5);
  } finally {
    await session.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    await session.detach();
  }
});
