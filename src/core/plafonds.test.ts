import { expect, it } from 'vitest';
import { ajouterArgent, ajouterJetons, PLAFOND_ARGENT, PLAFOND_JETONS } from './plafonds';
import { acheterJetons, echangerJetons, jouerPileOuFace } from './casino';
import { appliquerVictoire } from './recompenses';
import { regionInitiale } from './sauvegarde';
import { validerDonneesRegion } from './sauvegarde-validation';

it("tronque les gains d'argent au plafond", () => {
  expect(ajouterArgent(PLAFOND_ARGENT - 1, 10)).toBe(PLAFOND_ARGENT);
  expect(ajouterArgent(PLAFOND_ARGENT, 1)).toBe(PLAFOND_ARGENT);
});

it('tronque les gains de jetons au plafond', () => {
  expect(ajouterJetons(PLAFOND_JETONS - 1, 10)).toBe(PLAFOND_JETONS);
  expect(ajouterJetons(PLAFOND_JETONS, 1)).toBe(PLAFOND_JETONS);
});

it('conserve les gains sous les plafonds et les débits autorisés', () => {
  expect(ajouterArgent(20, 5)).toBe(25);
  expect(ajouterJetons(20, 5)).toBe(25);
  expect(ajouterArgent(20, -20)).toBe(0);
  expect(ajouterJetons(20, -20)).toBe(0);
});

it("plafonne l'argent gagné par une victoire", () => {
  const region = regionInitiale('kanto', 'kanto.bourg-palette');
  region.argent = PLAFOND_ARGENT - 1;
  const resultat = appliquerVictoire(region, { numero: 1, niveau: 2, shiny: false, boss: false, rarete: 'commun' });
  expect(resultat.region.argent).toBe(PLAFOND_ARGENT);
  expect(resultat.region.statistiques.argentTotalGagne).toBeGreaterThan(region.statistiques.argentTotalGagne);
});

it('plafonne les jetons gagnés au casino', () => {
  const resultat = jouerPileOuFace({ jetons: PLAFOND_JETONS - 1 }, 10, 'face', () => 0);
  expect(resultat.ok).toBe(true);
  if (resultat.ok) expect(resultat.region.jetons).toBe(PLAFOND_JETONS);
});

it('refuse un achat de jetons au plafond', () => {
  expect(acheterJetons({ argent: PLAFOND_ARGENT, jetons: PLAFOND_JETONS })).toMatchObject({ ok: false, raison: 'Tu ne peux pas dépasser 999 999 jetons.' });
});

it("refuse un échange au plafond d'argent", () => {
  expect(echangerJetons({ argent: PLAFOND_ARGENT, jetons: 50 })).toMatchObject({ ok: false, raison: 'Tu ne peux pas dépasser 999 999 999 ₽.' });
});

it('répare les soldes trop élevés au chargement sans plafonner la statistique', () => {
  const region = regionInitiale('kanto', 'kanto.bourg-palette');
  region.argent = 5_000_000_000;
  region.jetons = 5_000_000;
  region.statistiques.argentTotalGagne = 5_000_000_000;
  validerDonneesRegion(region);
  expect(region.argent).toBe(PLAFOND_ARGENT);
  expect(region.jetons).toBe(PLAFOND_JETONS);
  expect(region.statistiques.argentTotalGagne).toBe(5_000_000_000);
});
