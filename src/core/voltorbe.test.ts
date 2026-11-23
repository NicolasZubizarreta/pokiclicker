import { describe, expect, it } from 'vitest';
import donnees from '../../data/casino-jeux.json';
import { commencerVoltorbe, encaisserVoltorbe, gainVoltorbe, grilleValide, NIVEAUX_VOLTORBE, multipleVoltorbe, retournerVoltorbe,
  TAILLE_VOLTORBE, tirerGrille, vueVoltorbe } from './voltorbe';
import type { VoltorbeEnCours } from './sauvegarde-types';

const { bonusDoublePourCent: bd, bonusTriplePourCent: bt, encaissementPourCent: retenue } = donnees.voltorbe;
type R = { jetons: number; voltorbeEnCours?: VoltorbeEnCours };
const graine = (n: number) => () => { n = (n + 0x6D2B79F5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const grille = (cases: string, vues = '0'.repeat(25), mise = 10): VoltorbeEnCours => ({ niveau: 0, mise, cases, vues });
// 5 Voltorbes en diagonale, un ×3 et trois ×2, le reste ×1.
const CASES = '0111111011111101111101113'.slice(0, 25);

describe('Voltorbe Flip : grille', () => {
  it.each(NIVEAUX_VOLTORBE.map((n, i) => [n.nom, i] as const))('niveau %s : bonnes quantités, une bombe par ligne et colonne', (_nom, i) => {
    const n = NIVEAUX_VOLTORBE[i]!;
    for (let essai = 1; essai <= 50; essai++) {
      const g = tirerGrille(i, graine(essai));
      expect(g).toHaveLength(25);
      expect([...g].filter(c => c === '0')).toHaveLength(n.voltorbes);
      expect([...g].filter(c => c === '2')).toHaveLength(n.doubles);
      expect([...g].filter(c => c === '3')).toHaveLength(n.triples);
      for (let k = 0; k < TAILLE_VOLTORBE; k++) {
        expect(g.slice(k * 5, k * 5 + 5)).toContain('0');
        expect([...g].filter((_, j) => j % 5 === k)).toContain('0');
      }
    }
  });
  it('refuse une grille illisible', () => {
    expect(grilleValide(grille(CASES))).toBe(true);
    expect(grilleValide({ ...grille(CASES), cases: '012' })).toBe(false);
    expect(grilleValide({ ...grille(CASES), cases: '4'.repeat(25) })).toBe(false);
    expect(grilleValide({ ...grille(CASES), mise: 0 })).toBe(false);
    expect(grilleValide({ ...grille(CASES), niveau: 9 })).toBe(false);
    expect(grilleValide(undefined)).toBe(false);
  });
});

describe('Voltorbe Flip : partie', () => {
  it('débite la mise, refuse une deuxième grille, ne montre aucune valeur cachée', () => {
    const r = commencerVoltorbe<R>({ jetons: 100 }, 30, 0, graine(1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.region.jetons).toBe(70);
    const vue = vueVoltorbe(r.region)!;
    expect(vue.cases.every(c => c === null)).toBe(true);
    expect(vue.lignes).toHaveLength(5);
    expect(commencerVoltorbe(r.region, 10, 0, graine(2)).ok).toBe(false);
    expect(commencerVoltorbe<R>({ jetons: 5 }, 10, 0, graine(1)).ok).toBe(false);
    expect(commencerVoltorbe<R>({ jetons: 50 }, 10, 7, graine(1)).ok).toBe(false);
  });
  it('un Voltorbe fait tout perdre', () => {
    const r = retournerVoltorbe<R>({ jetons: 90, voltorbeEnCours: grille(CASES) }, 0);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.fin).toMatchObject({ perdu: true, gain: 0 });
    expect(r.region.jetons).toBe(90);
    expect(r.region.voltorbeEnCours).toBeUndefined();
  });
  it('les cartes multiplient la mise ; on encaisse avec la retenue', () => {
    let region: R = { jetons: 90, voltorbeEnCours: grille('0222111111111111111111111'.replace(/^0/, '0'), '0'.repeat(25), 100) };
    const a = retournerVoltorbe(region, 1);
    if (!a.ok) throw new Error('attendu');
    const b = retournerVoltorbe(a.region, 2);
    if (!b.ok) throw new Error('attendu');
    region = b.region;
    expect(multipleVoltorbe(region.voltorbeEnCours!)).toBeCloseTo((100 + 2 * bd) / 100);
    const encaisse = encaisserVoltorbe(region);
    expect(encaisse.ok).toBe(true);
    if (!encaisse.ok) return;
    expect(encaisse.fin).toMatchObject({ gain: Math.floor(100 * (100 + 2 * bd) * retenue / 10000), perdu: false, complete: false });
    expect(encaisse.region.jetons).toBe(90 + Math.floor(100 * (100 + 2 * bd) * retenue / 10000));
    expect(encaisse.region.voltorbeEnCours).toBeUndefined();
  });
  it('retourner toutes les cartes ×2 et ×3 termine la grille sans retenue', () => {
    let region: R = { jetons: 0, voltorbeEnCours: grille('0221111111111111111111111', '0'.repeat(25), 10) };
    const a = retournerVoltorbe(region, 1);
    if (!a.ok) throw new Error('attendu');
    region = a.region;
    const b = retournerVoltorbe(region, 2);
    expect(b.ok).toBe(true);
    if (!b.ok) return;
    expect(b.fin).toMatchObject({ complete: true, gain: Math.floor(10 * (100 + 2 * bd) / 100) });
    expect(b.region.jetons).toBe(Math.floor(10 * (100 + 2 * bd) / 100));
  });
  it('refuse une carte déjà retournée, hors grille ou sans partie', () => {
    const base: R = { jetons: 0, voltorbeEnCours: grille(CASES, '0100000000000000000000000') };
    expect(retournerVoltorbe(base, 1).ok).toBe(false);
    expect(retournerVoltorbe(base, 25).ok).toBe(false);
    expect(retournerVoltorbe({ jetons: 0 }, 0).ok).toBe(false);
    expect(encaisserVoltorbe({ jetons: 0 }).ok).toBe(false);
  });
  it('une grille de ×3 seulement se paie en entier, sans retenue', () => {
    const toutes = '0' + '3'.repeat(24);
    let region: R = { jetons: 0, voltorbeEnCours: grille(toutes, '0'.repeat(25), 10) };
    let fin: ReturnType<typeof retournerVoltorbe<R>> = { ok: false, raison: '' };
    for (let i = 1; i < 25 && region.voltorbeEnCours; i++) { fin = retournerVoltorbe(region, i); if (!fin.ok) throw new Error('attendu'); region = fin.region; }
    expect(fin.ok && fin.fin?.multiple).toBeCloseTo((100 + 24 * bt) / 100);
    expect(region.jetons).toBe(Math.floor(10 * (100 + 24 * bt) / 100));
  });
  it('gain avec retenue sur une grille entamée', () => {
    expect(gainVoltorbe(grille('0222111111111111111111111', '0100000000000000000000000', 100))).toBe(Math.floor(100 * (100 + bd) * retenue / 10000));
  });
});

describe('Voltorbe Flip : rendement', () => {
  /** Joueur prudent : retourne la carte la moins risquée d'après les chiffres des lignes, s'arrête au-delà d'un seuil. */
  function jouer(niveau: number, seuil: number, alea: () => number): number {
    let region: R = { jetons: 1000 };
    const debut = commencerVoltorbe(region, 100, niveau, alea);
    if (!debut.ok) throw new Error('départ');
    region = debut.region;
    for (let coup = 0; coup < 30; coup++) {
      const vue = vueVoltorbe(region)!;
      let meilleur = -1, risque = 2;
      vue.cases.forEach((c, i) => {
        if (c !== null) return;
        const l = Math.floor(i / 5), k = i % 5;
        const caches = (cles: number[]) => cles.filter(j => vue.cases[j] === null).length;
        const rl = vue.lignes[l]!.voltorbes / caches([0, 1, 2, 3, 4].map(x => l * 5 + x));
        const rc = vue.colonnes[k]!.voltorbes / caches([0, 1, 2, 3, 4].map(x => x * 5 + k));
        const r = (rl + rc) / 2;
        if (r < risque) { risque = r; meilleur = i; }
      });
      if (meilleur < 0 || risque > seuil) { const f = encaisserVoltorbe(region); if (!f.ok) throw new Error('fin'); return f.region.jetons - 900; }
      const suite = retournerVoltorbe(region, meilleur);
      if (!suite.ok) throw new Error('coup');
      region = suite.region;
      if (!region.voltorbeEnCours) return region.jetons - 900;
    }
    return 0;
  }
  it.each(NIVEAUX_VOLTORBE.map((n, i) => [n.nom, i] as const))('niveau %s : un joueur prudent perd en moyenne', (_nom, niveau) => {
    for (const seuil of [0.2, 0.3, 0.4]) {
      const alea = graine(niveau * 100 + seuil * 10);
      let total = 0;
      const parties = 4000;
      for (let p = 0; p < parties; p++) total += jouer(niveau, seuil, alea);
      const rendement = total / parties / 100;
      console.log(`rendement ${_nom} seuil ${seuil} : ${(rendement * 100).toFixed(1)} %`);
      expect(rendement).toBeLessThan(1);
    }
  });
});
