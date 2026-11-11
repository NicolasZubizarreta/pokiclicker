import { expect, it } from 'vitest';
import { distribuer, doubler, refuserAssurance, rester, tirerCarte } from './casino';
import type { ResultatBlackjack, VueBlackjack } from './casino';
import type { DonneesRegion } from './sauvegarde-types';

/** Générateur déterministe (mulberry32). */
function graine(valeur: number) {
  let etat = valeur >>> 0;
  return () => {
    etat = (etat + 0x6D2B79F5) >>> 0;
    let n = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    n ^= n + Math.imul(n ^ (n >>> 7), 61 | n);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

type Region = Pick<DonneesRegion, 'jetons' | 'blackjackEnCours' | 'sabotBlackjack'>;
const MISE = Number(process.env.SIMULATION_MISE ?? 10);
const ok = (r: ResultatBlackjack<Region>) => { if (!r.ok) throw new Error(r.raison); return r; };

/** Stratégie de base simplifiée (tirer, rester, doubler ; ni séparation, ni abandon, ni assurance). */
function strategieDeBase(vue: VueBlackjack): 'tirer' | 'rester' | 'doubler' {
  const main = vue.mains[vue.active]!;
  const croupier = vue.valeurCroupier;
  const dur = main.cartes.reduce((s, c) => s + (c.startsWith('A') ? 1 : /^(10|J|Q|K)/.test(c) ? 10 : Number(c.split('-')[0])), 0);
  const souple = main.cartes.some(c => c.startsWith('A')) && dur + 10 <= 21;
  const deux = main.cartes.length === 2;
  const total = main.valeur;
  if (souple) {
    if (total >= 19) return 'rester';
    if (total === 18) return deux && croupier >= 3 && croupier <= 6 ? 'doubler' : croupier <= 8 ? 'rester' : 'tirer';
    return deux && croupier >= 5 && croupier <= 6 ? 'doubler' : 'tirer';
  }
  if (total >= 17) return 'rester';
  if (total >= 13) return croupier <= 6 ? 'rester' : 'tirer';
  if (total === 12) return croupier >= 4 && croupier <= 6 ? 'rester' : 'tirer';
  if (total === 11) return deux ? 'doubler' : 'tirer';
  if (total === 10) return deux && croupier <= 9 ? 'doubler' : 'tirer';
  if (total === 9) return deux && croupier >= 3 && croupier <= 6 ? 'doubler' : 'tirer';
  return 'tirer';
}

/** Rendement mesuré = jetons rendus / jetons engagés. Par défaut 100 000 mains ; SIMULATION_BLACKJACK=1000000 pour la mesure du backlog. */
it('la banque garde son avantage : le rendement de la stratégie de base reste sous 100 %', () => {
  const mains = Number(process.env.SIMULATION_BLACKJACK ?? 100_000);
  const alea = graine(11112026);
  let region: Region = { jetons: 1_000_000_000 };
  let engage = 0, rendu = 0;
  const actions = { tirer: tirerCarte, rester, doubler };
  for (let i = 0; i < mains; i++) {
    let r = ok(distribuer(region, MISE, alea));
    while (!r.termine) {
      const vue = r.vue!;
      r = ok(vue.phase === 'assurance' ? refuserAssurance(r.region, alea)
        : actions[strategieDeBase(vue)](r.region, alea));
    }
    engage += r.fin!.engage;
    rendu += r.fin!.gain;
    region = r.region;
  }
  const rendement = rendu / engage;
  console.info(`Blackjack : ${mains} mains, mise ${MISE}, rendement ${(rendement * 100).toFixed(2)} %`);
  expect(rendement).toBeLessThan(1);
  expect(rendement).toBeGreaterThan(0.9);
}, 600_000);
