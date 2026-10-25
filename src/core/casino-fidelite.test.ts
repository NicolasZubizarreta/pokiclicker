import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import fixture from '../../tests/fixtures/v1-casino.json';
import { gainMachine, jouerMachine, jouerPileOuFace } from './casino';

function graine(valeur: number) {
  let etat = valeur >>> 0;
  return () => {
    etat = (etat + 0x6D2B79F5) >>> 0;
    let n = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

// Préparation corrigée : le harnais T1 conserve l'ancien Math.random dans sa table.
// Exécuter les fonctions V1 avec le générateur courant, sans modifier la fixture.
function machineV1() {
  const lignes = readFileSync(new URL('../../legacy/js/game/casino.js', import.meta.url), 'utf8').split('\n');
  let symboles: string[] = [];
  let courant = () => 0;
  const state = { casinoTokens: 1000000 };
  const contexte = createContext({
    state, SLOT_SYMBOLS: fixture.constantes.symboles, SLOT_WEIGHTS: fixture.constantes.poids,
    slotsSpinning: false, suivant: () => courant(), updateCasinoUI: () => {}, showFeedback: () => {},
    document: { getElementById: () => ({ innerText: '' }) },
    setInterval: () => 0, clearInterval: () => {}, setTimeout: (f: () => void) => f(),
    setSlotReelImage: (i: number, s: string) => { symboles[i - 1] = s; },
  });
  runInContext(`Math.random = suivant;\n${lignes.slice(143, 179).join('\n')}\n${lignes.slice(296, 350).join('\n')}`, contexte);
  const spin = runInContext('spinSlots', contexte) as (mise: number) => void;
  return (alea: () => number, mise = 1) => {
    courant = alea;
    symboles = [];
    const avant = state.casinoTokens;
    spin(mise);
    return { symboles, gain: state.casinoTokens - avant + mise };
  };
}

describe('fidélité du casino', () => {
  it('compare les 125 triplets et leur espérance exacte à la V1 exécutée', () => {
    const v1 = machineV1();
    const c = fixture.constantes;
    let numerateurV1 = 0;
    let numerateurV2 = 0;
    expect(fixture.machine.table).toHaveLength(125);
    for (const { symboles } of fixture.machine.table) {
      const valeurs = symboles.map(s => {
        const i = c.symboles.indexOf(s);
        return (c.poids.slice(0, i).reduce((a, b) => a + b, 0) + c.poids[i]! / 2) / 100;
      });
      const attendu = v1(() => valeurs.shift()!);
      const gain = gainMachine(symboles as [string, string, string], 1);
      expect(attendu.symboles).toEqual(symboles);
      expect(gain).toBe(attendu.gain);
      const poids = symboles.reduce((p, s) => p * c.poids[c.symboles.indexOf(s)]!, 1);
      numerateurV1 += poids * attendu.gain;
      numerateurV2 += poids * gain;
    }
    expect(numerateurV2).toBe(numerateurV1);
    expect(numerateurV2).toBe(1622153);
  });

  it.each([fixture.machine.serie.graine, 1, 42])('100 000 tours et 10 000 lancers : graine %i', seed => {
    const v1 = machineV1();
    for (const jeu of ['machine', 'pileOuFace'] as const) {
      const serie = fixture[jeu].serie;
      const suivant = graine(seed);
      const suivantV1 = graine(seed);
      let tirages = 0;
      const alea = () => { tirages++; return suivant(); };
      const premiers: object[] = [];
      const histogramme: Record<number, number> = {};
      let total = 0;
      let region = { jetons: 1000000 };
      let identique = true;
      for (let i = 0; i < serie.nombre; i++) {
        const avant = region.jetons;
        const r = jeu === 'machine' ? jouerMachine(region, 1, alea) : jouerPileOuFace(region, 1, 'face', alea);
        if (!r.ok) throw new Error(r.raison);
        const attendu = jeu === 'machine' ? v1(suivantV1) : (() => {
          const resultat = suivantV1() < 0.5 ? 'face' : 'pile';
          return { resultat, gain: resultat === 'face' ? 2 : 0 };
        })();
        const ligne = 'symboles' in r ? { symboles: r.symboles, gain: r.gain } : { resultat: r.resultat, gain: r.gain };
        identique &&= JSON.stringify(ligne) === JSON.stringify(attendu) && r.region.jetons === avant - 1 + r.gain;
        region = r.region;
        total += r.gain;
        histogramme[r.gain] = (histogramme[r.gain] ?? 0) + 1;
        if (i < serie.premiers.length) premiers.push(ligne);
      }
      expect(identique).toBe(true);
      expect(tirages).toBe(serie.tirages);
      if (seed === serie.graine) {
        expect(total).toBe(serie.total);
        expect(histogramme).toEqual(serie.histogramme);
        expect(premiers).toEqual(serie.premiers.map(r => 'symboles' in r
          ? { symboles: r.symboles, gain: r.gain } : { resultat: r.resultat, gain: r.gain }));
      }
    }
  });
});
