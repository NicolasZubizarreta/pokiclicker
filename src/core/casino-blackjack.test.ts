import { describe, expect, it, vi } from 'vitest';
import fixture from '../../tests/fixtures/v1-casino.json';
import { construirePaquet, distribuer, rester, tirerCarte, valeurMain } from './casino';
import type { DonneesRegion } from './sauvegarde-types';

function graine(valeur: number) {
  let etat = valeur >>> 0;
  return () => {
    etat = (etat + 0x6D2B79F5) >>> 0;
    let n = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}
type Region = Pick<DonneesRegion, 'jetons' | 'blackjackEnCours'>;

describe('blackjack', () => {
  it('construit 52 cartes distinctes en 51 tirages et compte les as', () => {
    const alea = vi.fn(() => 0);
    const paquet = construirePaquet(alea);
    expect(new Set(paquet).size).toBe(52);
    expect(alea).toHaveBeenCalledTimes(51);
    expect(valeurMain(['A-S', 'A-H', '9-D'])).toBe(21);
    expect(valeurMain(['A-S', 'K-H', '9-D'])).toBe(20);
    expect(valeurMain([])).toBe(0);
    expect(() => valeurMain(['inconnue'])).toThrow();
  });

  it.each(fixture.blackjack.scenarios)('reproduit le scénario $nom', scenario => {
    const suivant = graine(fixture.blackjack.serie.graine);
    const alea = vi.fn(suivant);
    const region: Region = { jetons: 100 };
    const paquet = [...scenario.cartes].reverse();
    let r = distribuer(region, scenario.mise, alea, paquet);
    if (!r.ok) throw new Error(r.raison);
    expect(r.joueur).toEqual(scenario.donne.joueur);
    expect(r.croupier).toEqual(scenario.donne.croupier);
    expect(r.region.blackjackEnCours !== undefined).toBe(scenario.donne.active);
    for (const action of scenario.actions) {
      r = action === 'tirer' ? tirerCarte(r.region, alea) : rester(r.region, alea);
      if (!r.ok) throw new Error(r.raison);
    }
    expect(r.joueur).toEqual(scenario.joueur);
    expect(r.croupier).toEqual(scenario.croupier);
    expect(r.paquet).toEqual(scenario.paquetRestant);
    expect(r.gain).toBe(Math.floor(scenario.gain));
    expect(r.region.jetons).toBe(100 - scenario.mise + Math.floor(scenario.gain));
    expect(r.region).not.toHaveProperty('blackjackEnCours');
    expect(alea).toHaveBeenCalledTimes(scenario.tirages);
    expect(region).toEqual({ jetons: 100 });
    expect(paquet).toEqual([...scenario.cartes].reverse());
  });

  it('refuse les mises, paquets et actions invalides sans aléa ni mutation', () => {
    const alea = vi.fn(() => 0);
    for (const mise of [0, -1, 1.5, NaN, Infinity, 101]) {
      expect(distribuer({ jetons: 100 }, mise, alea).ok).toBe(false);
    }
    for (const paquet of [['X-S'], ['A-S', 'A-S']]) {
      expect(distribuer({ jetons: 100 }, 1, alea, paquet).ok).toBe(false);
    }
    expect(tirerCarte({ jetons: 100 }, alea).ok).toBe(false);
    expect(rester({ jetons: 100 }, alea).ok).toBe(false);
    const r = distribuer({ jetons: 100 }, 2, alea, ['5-S', '9-H', '10-D']);
    if (!r.ok) throw new Error(r.raison);
    const avant = structuredClone(r.region);
    expect(distribuer(r.region, 2, alea).ok).toBe(false);
    const suite = tirerCarte(r.region, alea);
    expect(suite.ok).toBe(true);
    expect(r.region).toEqual(avant);
  });

  it('reproduit les 10 000 mains de la fixture', () => {
    const serie = fixture.blackjack.serie;
    const suivant = graine(serie.graine);
    let tirages = 0;
    const alea = () => { tirages++; return suivant(); };
    let region: Region = { jetons: 1000000 };
    let total = 0;
    const histogramme: Record<number, number> = {};
    const premiers: object[] = [];
    for (let i = 0; i < serie.nombre; i++) {
      let r = distribuer(region, serie.mise, alea);
      if (!r.ok) throw new Error(r.raison);
      while (r.region.blackjackEnCours && valeurMain(r.joueur) < 17) {
        r = tirerCarte(r.region, alea);
        if (!r.ok) throw new Error(r.raison);
      }
      if (r.region.blackjackEnCours) r = rester(r.region, alea);
      if (!r.ok) throw new Error(r.raison);
      region = r.region;
      total += r.gain;
      histogramme[r.gain] = (histogramme[r.gain] ?? 0) + 1;
      if (i < serie.premiers.length) premiers.push({ joueur: r.joueur, croupier: r.croupier,
        paquetRestant: r.paquet, gain: r.gain });
    }
    expect(tirages).toBe(serie.tirages);
    expect(total).toBe(Math.floor(serie.total));
    expect(histogramme).toEqual(serie.histogramme);
    expect(premiers).toEqual(serie.premiers.map(r => ({ joueur: r.joueur, croupier: r.croupier,
      paquetRestant: r.paquetRestant, gain: Math.floor(r.gain) })));
    expect(region.jetons).toBe(1000000 - serie.nombre * serie.mise + total);
  });
});
