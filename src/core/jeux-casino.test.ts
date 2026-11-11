import { describe, expect, it, vi } from 'vitest';
import casino from '../../data/casino.json';
import {
  analyserGratter, chargerJeuxCasino, combinaisonGratter, couleurRoulette, gainGratter, gainPlusOuMoins, gainsSymboleGratter,
  gratter, jouerPlusOuMoins, jouerRoulette, multiplicateurPlusOuMoins, multiplicateurRoulette, nomCarte, pariGagnant,
  rangsGagnants, tirerCarteVisible, tirerNumeroRoulette, tirerSymboleGratter,
} from './jeux-casino';
import type { ChoixPlusOuMoins, PariRoulette } from './jeux-casino';

/** Aléa à graine (mulberry32) : même suite à chaque exécution. */
function graine(a: number): () => number {
  return () => {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Aléa qui rend les valeurs données, dans l'ordre. */
const suite = (...valeurs: number[]) => { let i = 0; return vi.fn(() => valeurs[i++]!); };
/** Valeur d'aléa qui tombe au milieu de la case n sur `total` cases. */
const milieu = (n: number, total: number) => (n + 0.5) / total;

const ROUGES = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
const region = Object.freeze({ jetons: 1000, argent: 7 });

describe('données', () => {
  it('reprennent les messages et les symboles du casino', () => {
    const jeux = chargerJeuxCasino();
    for (const cle of ['miseInvalide', 'jetonsInsuffisants', 'choixInvalide', 'perdu'] as const) {
      expect(jeux.messages[cle]).toBe(casino.messages[cle]);
    }
    for (const symbole of casino.symboles) {
      expect(jeux.gratter.symboles.find(s => s.id === symbole.id)?.image).toBe(symbole.image);
    }
    expect(jeux.roulette.rouges).toEqual(ROUGES);
  });

  it('refusent des données invalides', () => {
    for (const modifier of [
      (j: ReturnType<typeof chargerJeuxCasino>) => { j.roulette.rouges[0] = 0; },
      (j: ReturnType<typeof chargerJeuxCasino>) => { j.roulette.rouges[1] = j.roulette.rouges[0]!; },
      (j: ReturnType<typeof chargerJeuxCasino>) => { j.plusOuMoins.rendementPourCent = 101; },
      (j: ReturnType<typeof chargerJeuxCasino>) => { j.gratter.symboles[0]!.poids = 0; },
      (j: ReturnType<typeof chargerJeuxCasino>) => { j.gratter.symboles[1]!.id = j.gratter.symboles[0]!.id; },
      (j: ReturnType<typeof chargerJeuxCasino>) => { j.gratter.symboles[0]!.gains.pop(); },
      (j: ReturnType<typeof chargerJeuxCasino>) => { j.messages.perdu = ''; },
    ]) {
      const j = chargerJeuxCasino();
      modifier(j);
      expect(() => chargerJeuxCasino(j)).toThrow();
    }
    expect(() => chargerJeuxCasino(null)).toThrow();
    const copie = chargerJeuxCasino();
    copie.gratter.symboles[0]!.poids = 99;
    expect(chargerJeuxCasino().gratter.symboles[0]!.poids).toBe(1);
  });
});

describe('roulette', () => {
  it('colore les 37 cases comme une roulette européenne', () => {
    expect(couleurRoulette(0)).toBe('vert');
    const rouges = Array.from({ length: 37 }, (_, n) => n).filter(n => couleurRoulette(n) === 'rouge');
    expect(rouges).toEqual(ROUGES);
    expect(Array.from({ length: 37 }, (_, n) => n).filter(n => couleurRoulette(n) === 'noir')).toHaveLength(18);
  });

  it('tire le numéro avec un seul aléa, de 0 à 36', () => {
    expect(tirerNumeroRoulette(() => 0)).toBe(0);
    expect(tirerNumeroRoulette(() => 0.9999999)).toBe(36);
    for (let n = 0; n < 37; n++) expect(tirerNumeroRoulette(() => milieu(n, 37))).toBe(n);
  });

  it('applique chaque pari avec un aléa imposé', () => {
    const cas: [PariRoulette, number, number][] = [
      [{ type: 'couleur', couleur: 'rouge' }, 7, 200], [{ type: 'couleur', couleur: 'rouge' }, 8, 0],
      [{ type: 'couleur', couleur: 'noir' }, 8, 200], [{ type: 'couleur', couleur: 'noir' }, 0, 0],
      [{ type: 'parite', parite: 'pair' }, 8, 200], [{ type: 'parite', parite: 'pair' }, 0, 0],
      [{ type: 'parite', parite: 'pair' }, 7, 0], [{ type: 'parite', parite: 'impair' }, 7, 200],
      [{ type: 'parite', parite: 'impair' }, 0, 0], [{ type: 'numero', numero: 17 }, 17, 3600],
      [{ type: 'numero', numero: 0 }, 0, 3600], [{ type: 'numero', numero: 17 }, 18, 0],
    ];
    for (const [pari, sorti, gain] of cas) {
      const alea = suite(milieu(sorti, 37));
      const r = jouerRoulette(region, 100, pari, alea);
      expect(r).toMatchObject({ ok: true, numero: sorti, gain, region: { jetons: 900 + gain, argent: 7 } });
      expect(alea).toHaveBeenCalledTimes(1);
      if (r.ok) expect(r.message).toContain(gain > 0 ? 'Gagné' : 'Perdu');
    }
  });

  it('refuse sans tirer l\'aléa et sans toucher à la région', () => {
    const alea = vi.fn(() => 0.5);
    const rouge: PariRoulette = { type: 'couleur', couleur: 'rouge' };
    for (const mise of [0, -5, 1.5, NaN, Infinity]) {
      expect(jouerRoulette(region, mise, rouge, alea)).toEqual({ ok: false, raison: 'Mise invalide.' });
    }
    expect(jouerRoulette(region, 1001, rouge, alea)).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
    for (const pari of [{ type: 'numero', numero: 37 }, { type: 'numero', numero: -1 }, { type: 'numero', numero: 1.5 },
      { type: 'couleur', couleur: 'vert' }, { type: 'parite', parite: 'zero' }, { type: 'autre' }, null] as unknown as PariRoulette[]) {
      expect(jouerRoulette(region, 10, pari, alea)).toEqual({ ok: false, raison: 'Choix invalide.' });
    }
    expect(alea).not.toHaveBeenCalled();
    const r = jouerRoulette(region, 10, rouge, () => 0.5);
    expect(region).toEqual({ jetons: 1000, argent: 7 });
    expect(r.ok && r.region).not.toBe(region);
  });

  it('rend exactement 36/37 pour chaque mise', () => {
    const paris: PariRoulette[] = [{ type: 'couleur', couleur: 'rouge' }, { type: 'couleur', couleur: 'noir' },
      { type: 'parite', parite: 'pair' }, { type: 'parite', parite: 'impair' },
      ...Array.from({ length: 37 }, (_, numero) => ({ type: 'numero', numero }) as PariRoulette)];
    for (const pari of paris) {
      let total = 0;
      for (let n = 0; n < 37; n++) {
        const r = jouerRoulette(region, 37, pari, () => milieu(n, 37));
        total += r.ok ? r.gain : 0;
        expect(pariGagnant(pari, n) ? multiplicateurRoulette(pari) * 37 : 0).toBe(r.ok ? r.gain : -1);
      }
      expect(total / (37 * 37)).toBeCloseTo(36 / 37, 12); // mise 37 sur 37 cases : 36 × 37 jetons rendus
      expect(total).toBe(36 * 37);
    }
  });
});

describe('plus ou moins', () => {
  it('tire un rang de 1 à 13, chaque rang équiprobable', () => {
    expect(tirerCarteVisible(() => 0)).toBe(1);
    expect(tirerCarteVisible(() => 0.9999999)).toBe(13);
    for (let rang = 1; rang <= 13; rang++) expect(tirerCarteVisible(() => milieu(rang - 1, 13))).toBe(rang);
    expect([1, 2, 10, 11, 12, 13].map(nomCarte)).toEqual(['As', '2', '10', 'Valet', 'Dame', 'Roi']);
  });

  it('compte les rangs gagnants et refuse les choix sans issue', () => {
    expect(rangsGagnants(7, 'plus')).toBe(6);
    expect(rangsGagnants(7, 'moins')).toBe(6);
    expect(rangsGagnants(1, 'plus')).toBe(12);
    expect(rangsGagnants(13, 'moins')).toBe(12);
    expect(rangsGagnants(13, 'plus')).toBe(0);
    expect(rangsGagnants(1, 'moins')).toBe(0);
    expect(multiplicateurPlusOuMoins(13, 'plus')).toBe(0);
    expect(multiplicateurPlusOuMoins(7, 'plus')).toBeCloseTo(0.96 * 13 / 6, 12);
    expect(multiplicateurPlusOuMoins(2, 'moins')).toBeCloseTo(0.96 * 13, 12);
    expect(gainPlusOuMoins(100, 7, 'plus')).toBe(208);
    expect(gainPlusOuMoins(1, 7, 'plus')).toBe(2);
    expect(gainPlusOuMoins(1, 2, 'moins')).toBe(12);
  });

  it('applique les règles avec un aléa imposé, l\'égalité perd', () => {
    const jouer = (visible: number, choix: ChoixPlusOuMoins, nouvelle: number) =>
      jouerPlusOuMoins(region, 100, visible, choix, suite(milieu(nouvelle - 1, 13)));
    expect(jouer(7, 'plus', 9)).toMatchObject({ ok: true, nouvelleCarte: 9, gain: 208, region: { jetons: 1108 } });
    expect(jouer(7, 'plus', 5)).toMatchObject({ ok: true, gain: 0, region: { jetons: 900 } });
    expect(jouer(7, 'plus', 7)).toMatchObject({ ok: true, gain: 0, region: { jetons: 900 } });
    expect(jouer(7, 'moins', 7)).toMatchObject({ gain: 0 });
    expect(jouer(7, 'moins', 3)).toMatchObject({ gain: 208, region: { jetons: 1108 } });
    expect(jouer(7, 'moins', 12)).toMatchObject({ gain: 0 });
    expect(jouer(1, 'plus', 13)).toMatchObject({ gain: Math.floor(100 * 0.96 * 13 / 12) });
    expect(jouer(13, 'moins', 1)).toMatchObject({ gain: 104 });
    const egalite = jouer(7, 'plus', 7);
    expect(egalite.ok && egalite.message).toContain('égalité');
    const alea = suite(0.5);
    jouerPlusOuMoins(region, 100, 7, 'plus', alea);
    expect(alea).toHaveBeenCalledTimes(1);
  });

  it('refuse sans tirer l\'aléa et sans toucher à la région', () => {
    const alea = vi.fn(() => 0.5);
    for (const mise of [0, -1, 2.5, NaN]) {
      expect(jouerPlusOuMoins(region, mise, 7, 'plus', alea)).toEqual({ ok: false, raison: 'Mise invalide.' });
    }
    expect(jouerPlusOuMoins(region, 1001, 7, 'plus', alea)).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
    for (const [visible, choix] of [[13, 'plus'], [1, 'moins'], [0, 'plus'], [14, 'moins'], [7.5, 'plus'], [7, 'egal']] as const) {
      expect(jouerPlusOuMoins(region, 10, visible, choix as ChoixPlusOuMoins, alea)).toEqual({ ok: false, raison: 'Choix invalide.' });
    }
    expect(alea).not.toHaveBeenCalled();
    expect(region).toEqual({ jetons: 1000, argent: 7 });
  });

  it('rend au plus 96 % : exact pour toutes les cartes, les deux choix et les mises 1, 10, 100, 1000', () => {
    for (const mise of [1, 10, 100, 1000]) {
      for (let visible = 1; visible <= 13; visible++) {
        for (const choix of ['plus', 'moins'] as const) {
          const g = rangsGagnants(visible, choix);
          if (g === 0) continue;
          const gain = gainPlusOuMoins(mise, visible, choix);
          // Rendement = (g/13) × gain / mise ≤ 96/100  ⇔  100 × g × gain ≤ 96 × 13 × mise (entiers, sans flottant).
          expect(100 * g * gain, `${choix} sur ${visible}, mise ${mise}`).toBeLessThanOrEqual(96 * 13 * mise);
          // Même résultat en jouant les 13 rangs possibles, un par un.
          let total = 0;
          for (let nouvelle = 1; nouvelle <= 13; nouvelle++) {
            const r = jouerPlusOuMoins({ jetons: mise }, mise, visible, choix, () => milieu(nouvelle - 1, 13));
            total += r.ok ? r.gain : 0;
          }
          expect(total / (13 * mise)).toBeLessThanOrEqual(0.96 + 1e-12);
          expect(gain).toBeGreaterThanOrEqual(mise); // une victoire ne rend jamais moins que la mise
        }
      }
    }
  });
});

describe('carte à gratter', () => {
  it('tire un symbole selon les poids, un aléa par case', () => {
    const symboles = chargerJeuxCasino().gratter.symboles;
    const total = symboles.reduce((s, x) => s + x.poids, 0);
    expect(tirerSymboleGratter(() => 0)).toBe('7');
    expect(tirerSymboleGratter(() => 0.9999999)).toBe('Magicarpe');
    let cumul = 0;
    for (const s of symboles) {
      expect(tirerSymboleGratter(() => (cumul + s.poids / 2) / total)).toBe(s.id);
      cumul += s.poids;
    }
  });

  it('prend la meilleure combinaison de 3, 4, 5 ou 6 identiques', () => {
    const M = 'Magicarpe', P = 'Pikachu', S = '7';
    expect(combinaisonGratter([M, P, S, 'Baie', 'Rattata', 'Evoli'])).toBeNull();
    expect(combinaisonGratter([M, M, P, P, S, S])).toBeNull();
    expect(combinaisonGratter([M, M, M, P, S, 'Baie'])).toEqual({ symbole: M, nombre: 3, multiplicateur: 2 });
    expect(combinaisonGratter([M, M, M, M, P, S])).toEqual({ symbole: M, nombre: 4, multiplicateur: 3 });
    expect(combinaisonGratter([M, M, M, M, M, S])).toEqual({ symbole: M, nombre: 5, multiplicateur: 6 });
    expect(combinaisonGratter([M, M, M, M, M, M])).toEqual({ symbole: M, nombre: 6, multiplicateur: 20 });
    expect(combinaisonGratter([S, S, S, S, S, S])).toEqual({ symbole: S, nombre: 6, multiplicateur: 5000 });
    // deux séries de 3 : la plus payante gagne, une seule est payée
    expect(combinaisonGratter([M, M, M, P, P, P])).toEqual({ symbole: P, nombre: 3, multiplicateur: 40 });
    expect(gainGratter([M, M, M, P, P, P], 10)).toBe(400);
    expect(gainsSymboleGratter('Pikachu')).toEqual([40, 80, 200, 800]);
    expect(gainsSymboleGratter('inconnu')).toEqual([]);
  });

  it('joue un ticket avec six tirages dans l\'ordre des cases', () => {
    const jeux = chargerJeuxCasino().gratter.symboles;
    const total = jeux.reduce((s, x) => s + x.poids, 0);
    const valeur = (id: string) => {
      let cumul = 0;
      for (const s of jeux) { if (s.id === id) return (cumul + s.poids / 2) / total; cumul += s.poids; }
      throw new Error(id);
    };
    const ordre = ['Baie', 'Magicarpe', 'Baie', 'Pikachu', 'Baie', 'Rattata'];
    const alea = suite(...ordre.map(valeur));
    const r = gratter(region, 20, alea);
    expect(alea).toHaveBeenCalledTimes(6);
    expect(r).toMatchObject({ ok: true, symboles: ordre, gain: 100, combinaison: { symbole: 'Baie', nombre: 3, multiplicateur: 5 },
      region: { jetons: 1000 - 20 + 100, argent: 7 } });
    expect(r.ok && r.message).toContain('Gagné');
    const perdu = gratter(region, 20, suite(...['Baie', 'Magicarpe', 'Pikachu', 'Rattata', '7', 'Roucool'].map(valeur)));
    expect(perdu).toMatchObject({ ok: true, gain: 0, combinaison: null, region: { jetons: 980 } });
    expect(perdu.ok && perdu.message).toContain('Perdu');
  });

  it('refuse sans tirer l\'aléa et sans toucher à la région', () => {
    const alea = vi.fn(() => 0.5);
    for (const mise of [0, -3, 0.5, NaN]) expect(gratter(region, mise, alea)).toEqual({ ok: false, raison: 'Mise invalide.' });
    expect(gratter(region, 1001, alea)).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
    expect(alea).not.toHaveBeenCalled();
    expect(region).toEqual({ jetons: 1000, argent: 7 });
  });

  it('rend entre 90 et 93 % avec 15 à 30 % de tickets gagnants, gros lot ≥ ×200 (calcul exact)', () => {
    const exact = analyserGratter();
    expect(exact.denominateur).toBe(100n ** 6n);
    expect(exact.rendement).toBeGreaterThanOrEqual(0.9);
    expect(exact.rendement).toBeLessThanOrEqual(0.93);
    expect(exact.probabiliteGain).toBeGreaterThanOrEqual(0.15);
    expect(exact.probabiliteGain).toBeLessThanOrEqual(0.3);
    const symboles = chargerJeuxCasino().gratter.symboles;
    const rare = symboles.reduce((a, b) => (b.poids < a.poids ? b : a));
    expect(rare.id).toBe('7');
    expect(rare.gains[3]).toBeGreaterThanOrEqual(200);
    expect(symboles.every(s => s.gains.every((g, i) => g >= (i === 0 ? 2 : s.gains[i - 1]!)))).toBe(true); // croissant avec le nombre
    expect(symboles.reduce((s, x) => s + x.poids, 0)).toBe(100);
  });

  it('retrouve ce rendement par énumération des 10^6 tickets', () => {
    const symboles = chargerJeuxCasino().gratter.symboles;
    const n = symboles.length;
    let numerateur = 0;
    let gagnants = 0;
    const comptes = new Array<number>(n).fill(0);
    const parcourir = (case_: number, poids: number) => {
      if (case_ === 6) {
        let gain = 0;
        comptes.forEach((c, i) => { if (c >= 3) gain = Math.max(gain, symboles[i]!.gains[c - 3]!); });
        numerateur += poids * gain;
        if (comptes.some(c => c >= 3)) gagnants += poids;
        return;
      }
      for (let i = 0; i < n; i++) { comptes[i]!++; parcourir(case_ + 1, poids * symboles[i]!.poids); comptes[i]!--; }
    };
    parcourir(0, 1);
    const exact = analyserGratter();
    expect(BigInt(numerateur)).toBe(exact.numerateur);
    expect(BigInt(gagnants)).toBe(exact.gagnants);
    expect(numerateur / 1e12).toBeCloseTo(exact.rendement, 8);
  });
});

describe('conservation des jetons et simulations', () => {
  const parisRoulette: PariRoulette[] = [{ type: 'couleur', couleur: 'rouge' }, { type: 'parite', parite: 'impair' },
    { type: 'numero', numero: 17 }, { type: 'couleur', couleur: 'noir' }];
  const jeuxTests = {
    roulette: (r: { jetons: number }, mise: number, alea: () => number, i: number) => jouerRoulette(r, mise, parisRoulette[i % 4]!, alea),
    plusOuMoins: (r: { jetons: number }, mise: number, alea: () => number) => {
      const visible = tirerCarteVisible(alea);
      const choix: ChoixPlusOuMoins = visible === 1 ? 'plus' : visible === 13 ? 'moins' : alea() < 0.5 ? 'plus' : 'moins';
      return jouerPlusOuMoins(r, mise, visible, choix, alea);
    },
    gratter: (r: { jetons: number }, mise: number, alea: () => number) => gratter(r, mise, alea),
  };

  for (const [nom, jouer] of Object.entries(jeuxTests)) {
    it(`${nom} : jetons finaux = départ − mises + gains sur 10 000 coups`, () => {
      const alea = graine(42);
      let courant: { jetons: number } = { jetons: 1_000_000 };
      let mises = 0;
      let gains = 0;
      for (let i = 0; i < 10_000; i++) {
        const mise = 1 + Math.floor(alea() * 50);
        const avant = courant;
        const r = jouer(courant, mise, alea, i);
        expect(r.ok).toBe(true);
        if (!r.ok) return;
        expect(avant).toBe(courant); // entrée non modifiée
        expect(r.region.jetons).toBe(avant.jetons - mise + r.gain);
        mises += mise;
        gains += r.gain;
        courant = r.region;
      }
      expect(courant.jetons).toBe(1_000_000 - mises + gains);
    });

    it(`${nom} : 200 000 coups à graine fixée, rendement mesuré sous 100 %`, () => {
      const alea = graine(2026);
      let mises = 0;
      let gains = 0;
      for (let i = 0; i < 200_000; i++) {
        const r = jouer({ jetons: 100 }, 10, alea, i);
        if (!r.ok) throw new Error(r.raison);
        mises += 10;
        gains += r.gain;
      }
      expect(gains / mises).toBeLessThan(1);
    });
  }
});
