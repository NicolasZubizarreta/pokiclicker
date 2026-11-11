import { describe, expect, it, vi } from 'vitest';
import {
  abandonner, assurer, construirePaquet, construireSabot, distribuer, doubler, refuserAssurance, rester, separer,
  seuilRemelange, tirerCarte, valeurMain, vueBlackjack,
} from './casino';
import type { ResultatBlackjack, VueBlackjack } from './casino';
import type { DonneesRegion } from './sauvegarde-types';

// Écart voulu avec la V1 (ticket B, 11/11/2026, voir tests/ecarts-v1.ts) : le blackjack est un vrai blackjack de casino
// (sabot de 6 paquets, carte cachée, doubler, séparer, assurance, abandon). Les comparaisons à la fixture V1 sont retirées :
// ces tests vérifient les règles, avec des sabots imposés (première carte du tableau = première carte distribuée).

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
type Reussite = Extract<ResultatBlackjack<Region>, { ok: true }>;
const sansAlea = () => vi.fn(() => { throw new Error('aléa inattendu'); });

function ok(r: ResultatBlackjack<Region>): Reussite {
  if (!r.ok) throw new Error(r.raison);
  return r;
}
/** Distribue avec un sabot imposé : joueur, croupier visible, joueur, croupier caché, puis les tirages suivants. */
function donne(cartes: string[], mise: number, jetons = 100) {
  const alea = sansAlea();
  return { alea, r: ok(distribuer<Region>({ jetons }, mise, alea, cartes)) };
}
const cartesDe = (r: Reussite) => r.fin!.mains.map(m => m.cartes);

describe('sabot', () => {
  it('compte 312 cartes : 6 exemplaires de chacune des 52, 96 cartes de 10 et 24 as', () => {
    const alea = vi.fn(graine(7));
    const sabot = construireSabot(alea);
    expect(sabot).toHaveLength(312);
    expect(alea).toHaveBeenCalledTimes(311);
    expect(sabot.filter(c => /^(10|J|Q|K)-/.test(c))).toHaveLength(96);
    expect(sabot.filter(c => c.startsWith('A-'))).toHaveLength(24);
    const compte = new Map<string, number>();
    sabot.forEach(c => compte.set(c, (compte.get(c) ?? 0) + 1));
    expect(compte.size).toBe(52);
    expect([...compte.values()].every(n => n === 6)).toBe(true);
    expect(construireSabot(graine(7))).toEqual(sabot);
    expect(construireSabot(graine(8))).not.toEqual(sabot);
    expect(construirePaquet(vi.fn(() => 0))).toHaveLength(52);
  });

  it('se remélange entre deux mains sous un quart des cartes, jamais en cours de main', () => {
    expect(seuilRemelange()).toBe(78);
    const plein = construireSabot(graine(3));
    const reste = (n: number): Region => ({ jetons: 100, sabotBlackjack: plein.slice(0, n) });
    const sansRemelange = vi.fn(() => 0.5);
    const a = ok(distribuer(reste(78), 1, sansRemelange));
    expect(sansRemelange).not.toHaveBeenCalled();
    expect(a.region.sabotBlackjack).toEqual(plein.slice(4, 78));
    const remelange = vi.fn(graine(5));
    const b = ok(distribuer(reste(77), 1, remelange));
    expect(remelange).toHaveBeenCalledTimes(311);
    expect(b.region.sabotBlackjack).toHaveLength(308);
    // En cours de main : un sabot de 78 cartes passe sous le seuil sans remélange.
    const debut = ['2-S', '10-D', '3-H', '4-C', '2-D', '2-C', '2-H', ...plein.slice(0, 71)];
    let r = ok(distribuer<Region>({ jetons: 100, sabotBlackjack: debut }, 1, sansRemelange));
    for (let i = 0; i < 6 && r.region.blackjackEnCours; i++) r = ok(tirerCarte(r.region, sansRemelange));
    expect(sansRemelange).not.toHaveBeenCalled();
    expect(r.region.sabotBlackjack!.length).toBeLessThan(72);
    // Un sabot vide en cours de main (cas limite) est reconstitué plutôt que de planter.
    const vide = vi.fn(graine(1));
    const f = ok(distribuer<Region>({ jetons: 100 }, 1, vide, ['2-S', '3-D', '2-H', '4-C']));
    expect(f.region.blackjackEnCours).toBeDefined();
    expect(ok(tirerCarte(f.region, vide)).region.sabotBlackjack).toHaveLength(311);
  });

  it('calcule la valeur d’une main (as souple, doublons permis dans un sabot)', () => {
    expect(valeurMain(['A-S', 'A-H', '9-D'])).toBe(21);
    expect(valeurMain(['A-S', 'K-H', '9-D'])).toBe(20);
    expect(valeurMain(['A-S', 'A-S'])).toBe(12);
    expect(valeurMain([])).toBe(0);
    expect(() => valeurMain(['inconnue'])).toThrow();
  });
});

describe('donne et carte cachée', () => {
  it('donne deux cartes au joueur et deux au croupier, dont une cachée à l’interface', () => {
    const { r } = donne(['5-S', '10-D', '6-H', '7-C', 'K-C'], 4);
    expect(r.termine).toBe(false);
    expect(r.region.jetons).toBe(96);
    expect(r.vue).toMatchObject({ phase: 'jeu', croupier: ['10-D'], cachee: true, valeurCroupier: 10, engage: 4,
      mains: [{ cartes: ['5-S', '6-H'], valeur: 11, mise: 4 }] });
    expect(JSON.stringify(r.vue)).not.toContain('7-C');
    expect(r.region.blackjackEnCours).toMatchObject({ croupier: ['10-D', '7-C'] });
    expect(r.region.sabotBlackjack).toEqual(['K-C']);
    expect(vueBlackjack(r.region)).toEqual(r.vue);
  });

  it('paie le blackjack naturel 3 pour 2 et le croupier ne joue pas', () => {
    const { r } = donne(['A-S', '9-C', 'K-H', '7-D', '5-S'], 10);
    expect(r).toMatchObject({ termine: true, gain: 25, message: 'Blackjack ! ×2,5', vue: null });
    expect(r.region.jetons).toBe(115);
    expect(r.region).not.toHaveProperty('blackjackEnCours');
    expect(r.fin!.mains[0]).toMatchObject({ resultat: 'blackjack', gain: 25 });
    expect(r.region.sabotBlackjack).toEqual(['5-S']);
  });

  it('arrondit le blackjack d’une mise impaire vers le bas', () => {
    expect(donne(['A-S', '9-C', 'K-H', '7-D'], 5).r.gain).toBe(12);
    expect(donne(['A-S', '9-C', 'K-H', '7-D'], 1).r.gain).toBe(2);
  });

  it('rend la mise quand joueur et croupier ont un blackjack', () => {
    const dix = donne(['A-S', 'K-D', 'K-H', 'A-C'], 10).r;
    expect(dix).toMatchObject({ termine: true, gain: 10, message: 'Deux blackjacks. Égalité, mise rendue.' });
    expect(dix.region.jetons).toBe(100);
    // Croupier montrant un As : l’assurance est proposée d’abord, puis le résultat est le même.
    const as = donne(['A-S', 'A-D', 'K-H', 'K-C'], 10).r;
    expect(as).toMatchObject({ termine: false, message: 'Le croupier montre un As. Assurance ?' });
    const fin = ok(refuserAssurance(as.region, sansAlea()));
    expect(fin).toMatchObject({ termine: true, gain: 10 });
    expect(fin.region.jetons).toBe(100);
  });

  it('arrête la main tout de suite si le croupier regarde sa carte cachée et a un blackjack', () => {
    const { r } = donne(['10-S', '10-D', '9-H', 'A-C', '5-S'], 10);
    expect(r).toMatchObject({ termine: true, gain: 0, message: 'Le croupier a un blackjack. Perdu.' });
    expect(r.region.jetons).toBe(90);
    expect(r.fin).toMatchObject({ blackjackCroupier: true, croupier: ['10-D', 'A-C'] });
    expect(tirerCarte(r.region, sansAlea())).toEqual({ ok: false, raison: 'Aucune main en cours.' });
  });

  it('sans blackjack du croupier, la main continue et les actions sont permises', () => {
    const { r } = donne(['10-S', 'K-D', '9-H', '7-C'], 10);
    expect(r.termine).toBe(false);
    expect(r.vue!.actions).toMatchObject({ tirer: true, rester: true });
  });
});

describe('assurance', () => {
  const sabotAs = (cachee: string) => ['10-S', 'A-D', '8-H', cachee, '2-C'];

  it('est proposée seulement quand le croupier montre un As, avant tout autre choix', () => {
    const { r } = donne(sabotAs('K-C'), 10);
    expect(r.vue).toMatchObject({ phase: 'assurance', actions: { assurer: true, refuserAssurance: true, tirer: false,
      rester: false, doubler: false, separer: false, abandonner: false } });
    const avant = structuredClone(r.region);
    for (const action of [tirerCarte, rester, doubler, separer, abandonner]) {
      expect(action(r.region, sansAlea())).toEqual({ ok: false, raison: 'Action impossible.' });
    }
    expect(r.region).toEqual(avant);
    const sans = donne(['10-S', 'K-D', '8-H', 'A-C'], 10).r;
    expect(assurer(sans.region, sansAlea())).toEqual({ ok: false, raison: 'Aucune main en cours.' });
    const milieu = donne(['10-S', '9-D', '8-H', '7-C', '2-C'], 10).r;
    expect(assurer(milieu.region, sansAlea())).toEqual({ ok: false, raison: 'Action impossible.' });
  });

  it('est payée 2 pour 1 si le croupier a un blackjack : la mise est perdue, l’assurance la compense', () => {
    const r = ok(assurer(donne(sabotAs('K-C'), 10).r.region, sansAlea()));
    expect(r).toMatchObject({ termine: true, gain: 15 });
    expect(r.message).toBe('Le croupier a un blackjack. Perdu. Assurance payée ×2.');
    expect(r.region.jetons).toBe(100);
    expect(r.fin).toMatchObject({ assurance: 5, gainAssurance: 15, engage: 15 });
  });

  it('est perdue sans blackjack du croupier, et la main continue', () => {
    const e = ok(assurer(donne(sabotAs('6-C'), 10).r.region, sansAlea()));
    expect(e.termine).toBe(false);
    expect(e.region.jetons).toBe(85);
    expect(e.vue).toMatchObject({ phase: 'jeu', assurance: 5, engage: 15, cachee: true });
    const fin = ok(rester(e.region, sansAlea()));
    // Croupier A + 6 = 17 souple : il reste ; joueur 18 gagne.
    expect(fin).toMatchObject({ termine: true, gain: 20, message: 'Gagné ×2 ! Assurance perdue.' });
    expect(fin.region.jetons).toBe(105);
  });

  it('refusée, le blackjack du croupier fait perdre la mise', () => {
    const r = ok(refuserAssurance(donne(sabotAs('K-C'), 10).r.region, sansAlea()));
    expect(r).toMatchObject({ termine: true, gain: 0 });
    expect(r.region.jetons).toBe(90);
  });

  it('coûte la moitié de la mise (arrondie vers le bas) et exige assez de jetons', () => {
    const pauvre = donne(sabotAs('K-C'), 10, 12).r;
    const avant = structuredClone(pauvre.region);
    expect(assurer(pauvre.region, sansAlea())).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
    expect(pauvre.region).toEqual(avant);
    const impaire = ok(assurer(donne(sabotAs('K-C'), 7).r.region, sansAlea()));
    expect(impaire.fin).toMatchObject({ assurance: 3, gainAssurance: 9 });
    expect(impaire.region.jetons).toBe(100 - 7 - 3 + 9);
    // Une mise de 1 jeton ne permet pas l’assurance (la moitié arrondie vaut 0).
    const un = donne(sabotAs('K-C'), 1).r;
    expect(un.vue!.actions.assurer).toBe(false);
    expect(assurer(un.region, sansAlea())).toEqual({ ok: false, raison: 'Action impossible.' });
    expect(refuserAssurance(un.region, sansAlea()).ok).toBe(true);
  });
});

describe('actions du joueur', () => {
  it('tire, reste et laisse le croupier tirer jusqu’à 17', () => {
    let r = donne(['10-S', '10-C', '2-H', '2-H', '3-D', '2-S', 'K-C'], 10).r;
    r = ok(tirerCarte(r.region, sansAlea()));
    expect(r.vue!.mains[0]).toMatchObject({ cartes: ['10-S', '2-H', '3-D'], valeur: 15 });
    r = ok(rester(r.region, sansAlea()));
    // Croupier 10 + 2 = 12 : il tire 2-S (14) puis K-C (24) et dépasse.
    expect(r.fin!.croupier).toEqual(['10-C', '2-H', '2-S', 'K-C']);
    expect(r.fin!.valeurCroupier).toBe(24);
    expect(r).toMatchObject({ termine: true, gain: 20 });
  });

  it('le croupier s’arrête sur tous les 17, y compris un 17 souple, et tire sous 17', () => {
    const souple = ok(refuserAssurance(donne(['10-S', 'A-C', '8-H', '6-D', '5-S'], 10).r.region, sansAlea()));
    const fin = ok(rester(souple.region, sansAlea()));
    expect(fin.fin!.croupier).toEqual(['A-C', '6-D']);
    expect(fin).toMatchObject({ gain: 20, termine: true });
    expect(fin.region.sabotBlackjack).toEqual(['5-S']);
    const dur = ok(rester(donne(['10-S', '10-C', '8-H', '2-D', '3-D', '2-S', 'K-C'], 10).r.region, sansAlea()));
    expect(dur.fin!.croupier).toEqual(['10-C', '2-D', '3-D', '2-S']);
    expect(dur.fin!.valeurCroupier).toBe(17);
    expect(dur.region.sabotBlackjack).toEqual(['K-C']);
    // 18 souple : il reste aussi.
    const dixHuit = ok(refuserAssurance(donne(['10-S', 'A-C', '9-H', '7-D', '5-S'], 10).r.region, sansAlea()));
    expect(ok(rester(dixHuit.region, sansAlea())).fin!.croupier).toEqual(['A-C', '7-D']);
  });

  it('dépasser 21 perd la mise et le croupier ne joue pas quand toutes les mains ont perdu', () => {
    let r = donne(['10-S', '10-C', '6-H', '5-D', '10-D', '9-H'], 10).r;
    r = ok(tirerCarte(r.region, sansAlea()));
    expect(r).toMatchObject({ termine: true, gain: 0, message: 'Dépassé ! Perdu.' });
    expect(r.fin!.croupier).toEqual(['10-C', '5-D']);
    expect(r.region.sabotBlackjack).toEqual(['9-H']);
    expect(r.region.jetons).toBe(90);
  });

  it('un 21 obtenu en tirant arrête la main tout seul', () => {
    const r = ok(tirerCarte(donne(['5-S', '10-C', '6-H', '7-D', '10-D'], 10).r.region, sansAlea()));
    expect(r.termine).toBe(true);
    expect(r.fin!.mains[0]).toMatchObject({ valeur: 21, resultat: 'gagne' });
  });

  it('égalité : mise rendue ; défaite : mise perdue', () => {
    expect(ok(rester(donne(['10-S', '10-C', '8-H', '8-D'], 10).r.region, sansAlea())))
      .toMatchObject({ gain: 10, message: 'Égalité. Mise rendue.' });
    expect(ok(rester(donne(['10-S', '10-C', '7-H', '8-D'], 10).r.region, sansAlea())))
      .toMatchObject({ gain: 0, message: 'Perdu…' });
  });

  it('double : mise doublée, une seule carte, puis la main est jouée', () => {
    const { r } = donne(['5-S', '10-D', '6-H', '7-C', '10-H', 'K-C'], 10);
    expect(r.vue!.actions.doubler).toBe(true);
    const f = ok(doubler(r.region, sansAlea()));
    expect(f.fin!.mains[0]).toMatchObject({ cartes: ['5-S', '6-H', '10-H'], mise: 20, doublee: true, resultat: 'gagne', gain: 40 });
    expect(f.gain).toBe(40);
    expect(f.region.jetons).toBe(120);
    const perdu = ok(doubler(donne(['10-S', '10-D', '6-H', '7-C', '10-H'], 10).r.region, sansAlea()));
    expect(perdu).toMatchObject({ gain: 0, message: 'Dépassé ! Perdu.' });
    expect(perdu.region.jetons).toBe(80);
  });

  it('refuse de doubler sans assez de jetons ou après avoir tiré, sans rien changer', () => {
    const pauvre = donne(['5-S', '10-D', '6-H', '7-C'], 10, 15).r;
    const avant = structuredClone(pauvre.region);
    expect(doubler(pauvre.region, sansAlea())).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
    expect(pauvre.region).toEqual(avant);
    const tire = ok(tirerCarte(donne(['2-S', '10-D', '3-H', '7-C', '2-D', '9-C'], 10).r.region, sansAlea()));
    expect(tire.vue!.actions.doubler).toBe(false);
    expect(doubler(tire.region, sansAlea())).toEqual({ ok: false, raison: 'Action impossible.' });
  });

  it('sépare une paire : mise égale sur la nouvelle main, mains jouées dans l’ordre, croupier une seule fois', () => {
    let r = donne(['8-S', '6-C', '8-H', '10-D', '3-D', '9-S', '10-C', '10-H'], 10).r;
    expect(r.vue!.actions.separer).toBe(true);
    r = ok(separer(r.region, sansAlea()));
    expect(r.region.jetons).toBe(80);
    expect(r.vue!.mains.map(m => m.cartes)).toEqual([['8-S', '3-D'], ['8-H', '9-S']]);
    expect(r.vue).toMatchObject({ active: 0, engage: 20 });
    r = ok(doubler(r.region, sansAlea()));
    expect(r.termine).toBe(false);
    expect(r.vue).toMatchObject({ active: 1 });
    expect(r.vue!.mains[0]).toMatchObject({ cartes: ['8-S', '3-D', '10-C'], mise: 20, statut: 'reste' });
    r = ok(rester(r.region, sansAlea()));
    // Croupier 16 tire 10-H : 26, il dépasse. Main 1 doublée 21 → 40 ; main 2 → 20.
    expect(cartesDe(r)).toEqual([['8-S', '3-D', '10-C'], ['8-H', '9-S']]);
    expect(r.fin!.croupier).toEqual(['6-C', '10-D', '10-H']);
    expect(r).toMatchObject({ gain: 60, message: 'Bilan : +30 jetons.' });
    expect(r.region.jetons).toBe(130);
  });

  it('refuse de séparer sans assez de jetons ou une paire inexistante', () => {
    const pauvre = donne(['8-S', '6-C', '8-H', '10-D'], 10, 15).r;
    expect(separer(pauvre.region, sansAlea())).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
    const non = donne(['8-S', '6-C', '9-H', '10-D'], 10).r;
    expect(non.vue!.actions.separer).toBe(false);
    expect(separer(non.region, sansAlea())).toEqual({ ok: false, raison: 'Action impossible.' });
  });

  it('10, valet, dame et roi forment une paire entre eux', () => {
    const { r } = donne(['10-S', '7-C', 'K-H', '10-D', '3-D', '9-S'], 10);
    expect(r.vue!.actions.separer).toBe(true);
    expect(donne(['J-S', '7-C', 'Q-H', '10-D'], 10).r.vue!.actions.separer).toBe(true);
    expect(donne(['9-S', '7-C', '10-H', '10-D'], 10).r.vue!.actions.separer).toBe(false);
  });

  it('sépare jusqu’à quatre mains, pas plus', () => {
    let r = donne(['8-S', '6-C', '8-H', '10-D', '8-C', '8-D', '8-S', '8-H', '8-D', '8-C', '9-C'], 10, 200).r;
    r = ok(separer(r.region, sansAlea()));
    expect(r.vue!.mains).toHaveLength(2);
    r = ok(separer(r.region, sansAlea()));
    expect(r.vue!.mains.map(m => m.cartes)).toEqual([['8-S', '8-S'], ['8-C', '8-H'], ['8-H', '8-D']]);
    r = ok(separer(r.region, sansAlea()));
    expect(r.vue!.mains.map(m => m.cartes)).toEqual([['8-S', '8-D'], ['8-S', '8-C'], ['8-C', '8-H'], ['8-H', '8-D']]);
    expect(r.vue!.actions.separer).toBe(false);
    expect(r.vue!.engage).toBe(40);
    expect(separer(r.region, sansAlea())).toEqual({ ok: false, raison: 'Action impossible.' });
    expect(r.region.jetons).toBe(200 - 40);
  });

  it('les as séparés ne reçoivent qu’une carte chacun, sans re-séparer, et un 21 n’est pas un blackjack', () => {
    const { r } = donne(['A-S', '6-C', 'A-H', '10-D', 'K-S', 'A-D', '7-H'], 10);
    const f = ok(separer(r.region, sansAlea()));
    expect(f.termine).toBe(true);
    expect(f.fin!.mains.map(m => m.cartes)).toEqual([['A-S', 'K-S'], ['A-H', 'A-D']]);
    expect(f.fin!.mains[0]).toMatchObject({ valeur: 21, resultat: 'gagne', gain: 20 });
    expect(f.fin!.mains).toHaveLength(2);
    // Croupier 16 tire 7-H et dépasse : première main 21 paie 1 pour 1 (20), seconde main 12 aussi (20).
    expect(f.gain).toBe(40);
    expect(f.region.jetons).toBe(100 - 20 + 40);
  });

  it('un 21 après séparation d’une paire de 10 paie 1 pour 1', () => {
    const f = ok(separer(donne(['10-S', '7-C', 'K-H', '10-D', 'A-S', '9-D'], 10).r.region, sansAlea()));
    expect(f.termine).toBe(false);
    expect(f.vue!.mains[0]).toMatchObject({ valeur: 21, statut: 'reste' });
    expect(f.vue!.active).toBe(1);
    const fin = ok(rester(f.region, sansAlea()));
    expect(fin.fin!.mains[0]).toMatchObject({ resultat: 'gagne', gain: 20 });
    expect(fin.fin!.mains[1]).toMatchObject({ resultat: 'gagne', gain: 20 });
  });

  it('abandon : la moitié de la mise est rendue et le croupier ne joue pas', () => {
    const { r } = donne(['10-S', '10-D', '6-H', '7-C', '5-S'], 10);
    expect(r.vue!.actions.abandonner).toBe(true);
    const f = ok(abandonner(r.region, sansAlea()));
    expect(f).toMatchObject({ termine: true, gain: 5, message: 'Abandon. Moitié de la mise rendue.' });
    expect(f.region.jetons).toBe(95);
    expect(f.fin!.croupier).toEqual(['10-D', '7-C']);
  });

  it('abandon : refusé après avoir tiré, après une séparation, et pour une mise de 1 jeton', () => {
    const tire = ok(tirerCarte(donne(['2-S', '10-D', '3-H', '7-C', '2-D', '9-C'], 10).r.region, sansAlea()));
    expect(tire.vue!.actions.abandonner).toBe(false);
    expect(abandonner(tire.region, sansAlea())).toEqual({ ok: false, raison: 'Action impossible.' });
    const sep = ok(separer(donne(['8-S', '10-D', '8-H', '7-C', '2-D', '3-C'], 10).r.region, sansAlea()));
    expect(sep.vue!.actions.abandonner).toBe(false);
    const un = donne(['10-S', '10-D', '6-H', '7-C'], 1).r;
    expect(un.vue!.actions.abandonner).toBe(false);
    expect(abandonner(un.region, sansAlea())).toEqual({ ok: false, raison: 'Action impossible.' });
  });

  it('assurance et abandon ne font jamais gagner un jeton grâce à l’arrondi', () => {
    for (let mise = 2; mise <= 41; mise++) {
      const abandon = ok(abandonner(donne(['10-S', '10-D', '6-H', '7-C'], mise, 1000).r.region, sansAlea()));
      expect(abandon.gain).toBeLessThanOrEqual(mise / 2);
      expect(abandon.region.jetons).toBeLessThan(1000);
      const bj = ok(assurer(donne(['10-S', 'A-D', '8-H', 'K-C'], mise, 1000).r.region, sansAlea()));
      expect(bj.region.jetons).toBeLessThanOrEqual(1000);
      expect(bj.region.jetons).toBe(1000 - (mise % 2));
      const sans = ok(assurer(donne(['10-S', 'A-D', '8-H', '6-C'], mise, 1000).r.region, sansAlea()));
      expect(sans.region.jetons).toBeLessThan(1000);
    }
  });
});

describe('refus et immutabilité', () => {
  it('refuse les mises invalides, les sabots invalides et les actions sans main, sans aléa', () => {
    const alea = sansAlea();
    for (const mise of [0, -1, 1.5, NaN, Infinity, 101]) expect(distribuer({ jetons: 100 }, mise, alea).ok).toBe(false);
    expect(distribuer({ jetons: 100 }, 1, alea, ['X-S'])).toEqual({ ok: false, raison: 'Sabot blackjack invalide.' });
    expect(distribuer({ jetons: 100 }, 101, alea)).toEqual({ ok: false, raison: 'Pas assez de jetons.' });
    for (const action of [tirerCarte, rester, doubler, separer, abandonner, assurer, refuserAssurance]) {
      expect(action({ jetons: 100 }, alea)).toEqual({ ok: false, raison: 'Aucune main en cours.' });
    }
    const { r } = donne(['5-S', '10-D', '6-H', '7-C'], 2);
    expect(distribuer(r.region, 2, alea)).toEqual({ ok: false, raison: 'Une main est déjà en cours.' });
  });

  it('aucune action ne modifie sa région ni son sabot d’entrée', () => {
    const sabot = ['8-S', '6-C', '8-H', '10-D', '3-D', '9-S', '10-C', '10-H', 'A-H'];
    const copieSabot = [...sabot];
    const depart: Region = { jetons: 100 };
    const r = ok(distribuer(depart, 10, sansAlea(), sabot));
    expect(depart).toEqual({ jetons: 100 });
    expect(sabot).toEqual(copieSabot);
    const avant = structuredClone(r.region);
    const vueAvant: VueBlackjack = structuredClone(r.vue!);
    for (const action of [tirerCarte, rester, doubler, separer, abandonner, assurer, refuserAssurance]) {
      const suite = action(r.region, sansAlea());
      expect(r.region).toEqual(avant);
      if (suite.ok) expect(suite.region).not.toBe(r.region);
    }
    expect(r.vue).toEqual(vueAvant);
  });

  it('lit une main de l’ancien format (52 cartes) : carte cachée tirée du paquet, puis jeu normal', () => {
    const ancien = { mise: 10, paquet: ['2-C', '9-H', 'K-S'], joueur: ['10-S', '8-D'], croupier: ['10-H'] };
    const region: Region = { jetons: 90, blackjackEnCours: ancien };
    const copie = structuredClone(region);
    const vue = vueBlackjack(region)!;
    expect(vue).toMatchObject({ phase: 'jeu', croupier: ['10-H'], cachee: true, engage: 10,
      mains: [{ cartes: ['10-S', '8-D'], valeur: 18 }] });
    expect(region).toEqual(copie);
    const f = ok(rester(region, sansAlea()));
    // L’ancien paquet se pioche par la fin : carte cachée K-S, le croupier (20) reste, le joueur (18) perd.
    expect(f.fin!.croupier).toEqual(['10-H', 'K-S']);
    expect(f).toMatchObject({ termine: true, gain: 0 });
    expect(f.region.sabotBlackjack).toEqual(['9-H', '2-C']);
    expect(f.region).not.toHaveProperty('blackjackEnCours');
  });
});

describe('conservation des jetons', () => {
  /** Joueur au hasard parmi toutes les actions permises : exerce séparation, doublement, assurance et abandon. */
  function choisir(vue: VueBlackjack, alea: () => number) {
    const a = vue.actions;
    type Action = (region: Region, alea: () => number) => ResultatBlackjack<Region>;
    const permises: Action[] = ([['assurer', assurer], ['refuserAssurance', refuserAssurance], ['tirer', tirerCarte], ['rester', rester],
      ['doubler', doubler], ['separer', separer], ['abandonner', abandonner]] as const)
      .filter(([nom]) => a[nom]).map(([, action]) => action);
    return permises[Math.floor(alea() * permises.length)]!;
  }

  it('rejoue 10 000 mains aléatoires : jetons finaux = départ − mises + gains', () => {
    const alea = graine(2026);
    const depart = 1_000_000;
    let region: Region = { jetons: depart };
    let engage = 0, gains = 0, mains = 0, naturels = 0, separations = 0, doublements = 0, assurances = 0;
    for (let i = 0; i < 10_000; i++) {
      let r = ok(distribuer(region, 1 + Math.floor(alea() * 20), alea));
      for (let pas = 0; !r.termine; pas++) {
        expect(pas).toBeLessThan(60);
        const vue = r.vue!;
        const action = choisir(vue, alea);
        if (action === doubler) doublements++;
        r = ok(action(r.region, alea));
        if (r.vue && r.vue.mains.length > vue.mains.length) separations++;
        if (r.vue && r.vue.assurance > 0 && vue.assurance === 0) assurances++;
      }
      engage += r.fin!.engage;
      gains += r.fin!.gain;
      mains += r.fin!.mains.length;
      naturels += r.fin!.mains.filter(m => m.resultat === 'blackjack').length;
      expect(r.region.jetons).toBe(depart - engage + gains);
      expect(r.region).not.toHaveProperty('blackjackEnCours');
      region = r.region;
    }
    expect(region.jetons).toBe(depart - engage + gains);
    expect(mains).toBeGreaterThan(10_000);
    expect(naturels).toBeGreaterThan(300);
    expect(separations).toBeGreaterThan(50);
    expect(doublements).toBeGreaterThan(300);
    expect(assurances).toBeGreaterThan(30);
    // Les sabots restent plausibles : au plus 312 cartes, au plus 6 exemplaires de chaque.
    expect(region.sabotBlackjack!.length).toBeLessThanOrEqual(312);
  });

  it('une main jamais finie ne perd pas de jetons : engagé + solde = départ à chaque étape', () => {
    const alea = graine(11);
    let r = ok(distribuer<Region>({ jetons: 500 }, 20, alea));
    for (let pas = 0; !r.termine && pas < 50; pas++) {
      expect(r.region.jetons + r.vue!.engage).toBe(500);
      r = ok(choisir(r.vue!, alea)(r.region, alea));
    }
  });
});
