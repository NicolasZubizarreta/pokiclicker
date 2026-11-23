import { describe, expect, it } from 'vitest';
import donnees from '../../data/safari.json';
import { reglages } from './reglages';
import { regionInitiale, etatMondeDe } from './sauvegarde';
import type { DonneesRegion, PokemonPossede, SafariEnCours } from './sauvegarde-types';
import { validerDonneesRegion } from './sauvegarde-validation';
import { accesSafari, avancerSafari, chanceBalleSafari, chanceFuiteSafari, chargerSafari, ESPECES_SAFARI, entrerAuSafari,
  jeterAppatSafari, jeterRocheSafari, lancerBalleSafari, messageBilanSafari, quitterSafari, visiteValide, VISITE_SAFARI, vueSafari } from './safari';

const region = (extra: Partial<DonneesRegion> = {}): DonneesRegion => ({ ...regionInitiale('kanto', 'inconnue'), argent: 20_000, ...extra });
const visite = (extra: Partial<SafariEnCours> = {}): SafariEnCours => ({ pas: 10, balles: 5, captures: 0, ...extra });
const ENCONTRE = { numero: 115, niveau: 25, shiny: false, humeur: 'neutre' as const };
const avecRencontre = (extra: Partial<SafariEnCours['rencontre'] & object> = {}, v: Partial<SafariEnCours> = {}) =>
  region({ safariEnCours: visite({ ...v, rencontre: { ...ENCONTRE, ...extra } }) });
let compteur = 0;
const id = () => `s${++compteur}`;
const pokemonFictif = (n: number): PokemonPossede => ({ uid: `x${n}`, numero: 1, niveau: 5, shiny: false, sexe: 'male', xp: 0, bonheur: 0, calcium: 0, pierreEternelle: false, favori: false });

describe('Parc Safari : données et accès', () => {
  it('le catalogue du parc est valide, sans doublon', () => {
    expect(ESPECES_SAFARI.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ESPECES_SAFARI).size).toBe(ESPECES_SAFARI.length);
    expect(() => chargerSafari(null)).toThrow();
    expect(() => chargerSafari({ ...donnees, visite: { ...donnees.visite, pas: 0 } })).toThrow();
    expect(() => chargerSafari({ ...donnees, especes: [donnees.especes[0], donnees.especes[0]] })).toThrow();
    expect(() => chargerSafari({ ...donnees, rencontre: { ...donnees.rencontre, chanceParPas: 2 } })).toThrow();
  });
  it('ouvre quand l\'Arène de Parmanie est battue', () => {
    expect(accesSafari(etatMondeDe(region()))).toMatchObject({ ok: false, raison: expect.stringContaining('Parmanie') });
    expect(accesSafari(etatMondeDe(region({ bossVaincus: ['kanto.arene-de-parmanie'] }))).ok).toBe(true);
  });
});

describe('Parc Safari : entrée', () => {
  it('débite l\'entrée et donne pas et balles', () => {
    const r = entrerAuSafari(region());
    expect(r.ok && r.region.argent).toBe(20_000 - VISITE_SAFARI.prix);
    expect(r.ok && r.region.safariEnCours).toEqual({ pas: VISITE_SAFARI.pas, balles: VISITE_SAFARI.balles, captures: 0 });
  });
  it('refuse sans assez d\'argent, ou pendant une visite', () => {
    expect(entrerAuSafari(region({ argent: 100 }))).toMatchObject({ ok: false, raison: expect.stringMatching(/4 900 ₽/) });
    expect(entrerAuSafari(region({ safariEnCours: visite() }))).toMatchObject({ ok: false });
  });
});

describe('Parc Safari : pas et rencontres', () => {
  it('un pas sans rencontre consomme un pas', () => {
    const r = avancerSafari(region({ safariEnCours: visite() }), () => .99);
    expect(r.ok && r.region.safariEnCours).toEqual({ pas: 9, balles: 5, captures: 0 });
  });
  it('une rencontre apparaît selon le tirage, niveau dans les bornes, chromatique rare', () => {
    const r = avancerSafari(region({ safariEnCours: visite() }), () => 0);
    expect(r.ok && r.region.safariEnCours?.rencontre).toMatchObject({ numero: donnees.especes[0]!.pokemon, humeur: 'neutre',
      niveau: donnees.rencontre.niveaux[0], shiny: reglages.combat.chanceShiny > 0 });
    const s = avancerSafari(region({ safariEnCours: visite() }), () => .6);
    expect(s.ok && s.region.safariEnCours?.rencontre).toBeUndefined();
  });
  it('tous les tirages donnent une espèce et un niveau valides', () => {
    for (let i = 0; i < 200; i++) {
      let n = i + 1;
      const alea = () => { n = (n * 16807) % 2147483647; return n / 2147483647; };
      const r = avancerSafari(region({ safariEnCours: visite() }), alea);
      const v = r.ok ? r.region.safariEnCours : undefined;
      expect(visiteValide(v)).toBe(true);
    }
  });
  it('interdit d\'avancer pendant une rencontre ; sans visite, tout est refusé', () => {
    expect(avancerSafari(avecRencontre(), () => 0)).toMatchObject({ ok: false });
    expect(avancerSafari(region(), () => 0)).toMatchObject({ ok: false });
    expect(lancerBalleSafari(region(), () => 0, id)).toMatchObject({ ok: false });
  });
  it('le dernier pas sans rencontre termine la visite', () => {
    const r = avancerSafari(region({ safariEnCours: visite({ pas: 1, captures: 2 }) }), () => .99);
    expect(r.ok && r.fin).toEqual({ captures: 2, raison: 'pas' });
    expect(r.ok && r.region.safariEnCours).toBeUndefined();
  });
  it('le dernier pas avec rencontre laisse jouer la rencontre', () => {
    const r = avancerSafari(region({ safariEnCours: visite({ pas: 1 }) }), () => 0);
    expect(r.ok && r.fin).toBeNull();
    expect(r.ok && r.region.safariEnCours?.pas).toBe(0);
    const fin = r.ok ? jeterRocheSafari(r.region, () => 1) : r;
    expect(fin).toMatchObject({ ok: true });
  });
});

describe('Parc Safari : capture', () => {
  it('une balle réussie ajoute le Pokémon à l\'équipe, au Pokédex, et libère la rencontre', () => {
    const r = lancerBalleSafari(avecRencontre(), () => 0, id);
    expect(r.ok && r.region.equipe).toHaveLength(1);
    expect(r.ok && r.region.equipe[0]).toMatchObject({ numero: 115, niveau: 25, shiny: false });
    expect(r.ok && r.numero).toBe(115);
    expect(r.ok && r.region.safariEnCours).toEqual({ pas: 10, balles: 4, captures: 1 });
    expect(r.ok && r.region.argent).toBe(20_000);
  });
  it('équipe pleine : le Pokémon va au PC ; un chromatique entre dans la liste des espèces chromatiques', () => {
    const pleine = avecRencontre({ shiny: true });
    pleine.equipe = Array.from({ length: reglages.equipe.taille }, (_, i) => pokemonFictif(i));
    const r = lancerBalleSafari(pleine, () => 0, id);
    expect(r.ok && r.region.pc).toHaveLength(1);
    expect(r.ok && r.region.pc[0]).toMatchObject({ numero: 115, shiny: true });
    expect(r.ok && r.region.especesShiny).toContain(115);
  });
  it('balle ratée : la balle est perdue, le Pokémon reste ou s\'enfuit', () => {
    const reste = lancerBalleSafari(avecRencontre(), () => .999, id);
    expect(reste.ok && reste.region.safariEnCours).toMatchObject({ balles: 4, rencontre: { numero: 115 } });
    expect(reste.ok && reste.region.equipe).toHaveLength(0);
    // Tirage 0,5 : au-dessus de la chance de capture (0,26), sous la fuite d'un Kangourex (0,3) ? non : 0,5 > 0,3.
    const fuit = lancerBalleSafari(avecRencontre(), (() => { const t = [.9, .1]; return () => t.shift() ?? .9; })(), id);
    expect(fuit.ok && fuit.region.safariEnCours?.rencontre).toBeUndefined();
    expect(fuit.ok && fuit.message).toMatch(/s’est enfui/);
  });
  it('la dernière balle termine la visite', () => {
    const r = lancerBalleSafari(avecRencontre({}, { balles: 1, captures: 3 }), () => .999, id);
    expect(r.ok && r.fin).toEqual({ captures: 3, raison: 'balles' });
    expect(r.ok && r.region.safariEnCours).toBeUndefined();
    expect(r.ok && messageBilanSafari(r.fin!)).toMatch(/3 Pokémon/);
  });
  it('les chances suivent l\'humeur et restent bornées', () => {
    const base = chanceBalleSafari({ numero: 115, humeur: 'neutre' });
    expect(chanceBalleSafari({ numero: 115, humeur: 'colere' })).toBeCloseTo(base * donnees.humeurs.colere.capture);
    expect(chanceBalleSafari({ numero: 115, humeur: 'appat' })).toBeCloseTo(base * donnees.humeurs.appat.capture);
    expect(chanceFuiteSafari({ numero: 115, humeur: 'colere' })).toBeGreaterThan(chanceFuiteSafari({ numero: 115, humeur: 'appat' }));
    for (const numero of ESPECES_SAFARI) for (const humeur of ['neutre', 'appat', 'colere'] as const) {
      expect(chanceBalleSafari({ numero, humeur })).toBeLessThanOrEqual(donnees.rencontre.chanceMax);
      expect(chanceFuiteSafari({ numero, humeur })).toBeLessThanOrEqual(donnees.rencontre.fuiteMax);
    }
    expect(chanceBalleSafari({ numero: 1, humeur: 'neutre' })).toBe(0);
  });
});

describe('Parc Safari : appât, roche, sortie', () => {
  it('l\'appât et la roche changent l\'humeur si le Pokémon ne fuit pas', () => {
    const roche = jeterRocheSafari(avecRencontre(), () => .999);
    expect(roche.ok && roche.region.safariEnCours?.rencontre?.humeur).toBe('colere');
    const appat = jeterAppatSafari(roche.ok ? roche.region : region(), () => .999);
    expect(appat.ok && appat.region.safariEnCours?.rencontre?.humeur).toBe('appat');
    expect(appat.ok && appat.region.safariEnCours?.balles).toBe(5);
  });
  it('le Pokémon peut s\'enfuir après une roche', () => {
    const r = jeterRocheSafari(avecRencontre(), () => 0);
    expect(r.ok && r.region.safariEnCours?.rencontre).toBeUndefined();
    expect(r.ok && r.message).toMatch(/enfui/);
  });
  it('refuse sans rencontre', () => {
    expect(jeterAppatSafari(region({ safariEnCours: visite() }), () => 0)).toMatchObject({ ok: false });
    expect(jeterRocheSafari(region(), () => 0)).toMatchObject({ ok: false });
  });
  it('quitter termine la visite sans remboursement', () => {
    const r = quitterSafari(avecRencontre({}, { captures: 2 }));
    expect(r.ok && r.fin).toEqual({ captures: 2, raison: 'sortie' });
    expect(r.ok && r.region.safariEnCours).toBeUndefined();
    expect(r.ok && r.region.argent).toBe(20_000);
    expect(quitterSafari(region())).toMatchObject({ ok: false });
  });
  it('la vue donne le nom du Pokémon rencontré', () => {
    expect(vueSafari(avecRencontre())).toMatchObject({ pas: 10, balles: 5, rencontre: { nom: 'Kangourex', humeur: 'neutre' } });
    expect(vueSafari(region())).toBeNull();
  });
});

describe('Parc Safari : sauvegarde tolérante', () => {
  it('une visite valide est conservée', () => {
    const bonne = region({ safariEnCours: visite({ rencontre: { ...ENCONTRE } }) });
    validerDonneesRegion(bonne);
    expect(bonne.safariEnCours).toEqual(visite({ rencontre: { ...ENCONTRE } }));
  });
  it('une visite abîmée est retirée, jamais refusée', () => {
    for (const mauvaise of [{ pas: -1, balles: 3, captures: 0 }, { pas: 5, balles: 'x', captures: 0 }, { pas: 5, balles: 3, captures: 0, rencontre: { ...ENCONTRE, numero: 1 } },
      { pas: 5, balles: 3, captures: 0, rencontre: { ...ENCONTRE, humeur: 'fou' } }, { pas: 999, balles: 3, captures: 0 }, null, 'oups']) {
      const r = { ...region(), safariEnCours: mauvaise } as unknown as DonneesRegion;
      expect(() => validerDonneesRegion(r)).not.toThrow();
      expect(r.safariEnCours).toBeUndefined();
    }
  });
  it('une sauvegarde sans le champ reste valide', () => {
    const r = region();
    validerDonneesRegion(r);
    expect('safariEnCours' in r).toBe(false);
  });
});
