import { describe, expect, it } from 'vitest';
import { chargerBlue, etatBlue, LIEU_BLUE, REVANCHES_BLUE } from './blue';
import { zoneDuCombat } from './combat-evenement';
import { commandeCourante, declencher } from './evenements';
import { evenementsKanto } from './evenements-kanto';
import type { DonneesRegion } from './sauvegarde-types';

const region = (badges: number, extra: Partial<DonneesRegion> = {}) =>
  ({ badges: Array.from({ length: badges }, (_, i) => `b${i}`), evenementsJoues: [], drapeaux: [], bossVaincus: [], objetsCles: [], quetes: [],
    zoneId: 'kanto.bourg-palette', inventaire: {}, ameliorations: [], ...extra }) as unknown as DonneesRegion;
const visite = { type: 'visite', zone: 'kanto.bourg-palette', lieu: LIEU_BLUE } as const;

describe('revanches de Blue', () => {
  it('chaque revanche du fichier est un événement connu, répété à 2, 4, 6 puis 8 badges', () => {
    expect(REVANCHES_BLUE.map(r => r.badges)).toEqual([2, 4, 6, 8]);
    for (const r of REVANCHES_BLUE) expect(() => evenementsKanto.parId(r.evenement)).not.toThrow();
  });
  it('attend le bon nombre de badges, puis passe à la revanche suivante, puis se termine', () => {
    expect(etatBlue(region(1))).toMatchObject({ fait: 0, badgesRequis: 2, pret: false });
    expect(etatBlue(region(1)).message).toMatch(/2 badges/);
    expect(etatBlue(region(2))).toMatchObject({ pret: true, badgesRequis: 2 });
    const apres1 = region(3, { evenementsJoues: [REVANCHES_BLUE[0]!.evenement] });
    expect(etatBlue(apres1)).toMatchObject({ fait: 1, badgesRequis: 4, pret: false });
    const toutes = region(8, { evenementsJoues: REVANCHES_BLUE.map(r => r.evenement) });
    expect(etatBlue(toutes)).toMatchObject({ fait: 4, badgesRequis: null, pret: false });
  });
  it('une visite ne lance qu\'une revanche à la fois, même avec huit badges', () => {
    const r = declencher(evenementsKanto, region(8), visite);
    expect(r.evenementEnCours).toMatchObject({ id: REVANCHES_BLUE[0]!.evenement, file: [] });
    expect(commandeCourante(evenementsKanto, r)?.type).toBe('dialogue');
  });
  it('le combat se joue en zone de combat, dans Bourg Palette, et récompense la victoire', () => {
    for (const { evenement } of REVANCHES_BLUE) {
      const e = evenementsKanto.parId(evenement);
      const combat = e.etapes.find(etape => etape.type === 'combat');
      expect(combat && 'zone' in combat && combat.zone).toMatch(/^kanto\.arene-/);
      expect(e.declencheur).toEqual(visite);
      expect(e.repetable).toBe(false);
      const indexCombat = e.etapes.findIndex(etape => etape.type === 'combat');
      const indexDon = e.etapes.findIndex(etape => etape.type === 'donner');
      expect(indexDon).toBeGreaterThan(indexCombat);
      expect(e.etapes.at(-1)).toMatchObject({ type: 'poser-drapeau' });
    }
    const r = declencher(evenementsKanto, region(2), visite);
    const enCombat = { ...r, evenementEnCours: { ...r.evenementEnCours!, etape: 1 } };
    expect(zoneDuCombat(evenementsKanto, enCombat)).toBe('kanto.bourg-palette');
  });
  it('les récompenses ne tombent qu\'après la victoire et la suivante n\'ouvre qu\'avec le drapeau', () => {
    const d1 = declencher(evenementsKanto, region(8, { evenementsJoues: [REVANCHES_BLUE[0]!.evenement] }), visite);
    expect(d1.evenementEnCours?.id).not.toBe(REVANCHES_BLUE[1]!.evenement);
    const avecDrapeau = declencher(evenementsKanto,
      region(8, { evenementsJoues: [REVANCHES_BLUE[0]!.evenement], drapeaux: ['blue-revanche-1'] }), visite);
    expect(avecDrapeau.evenementEnCours?.id).toBe(REVANCHES_BLUE[1]!.evenement);
  });
  it('refuse un fichier incohérent', () => {
    const bon = { version: 1, revanches: [{ evenement: 'a', badges: 2 }, { evenement: 'b', badges: 4 }], messages: { pret: 'p', attente: 'a', termine: 't' } };
    expect(() => chargerBlue(bon)).not.toThrow();
    expect(() => chargerBlue({ ...bon, revanches: [{ evenement: 'a', badges: 4 }, { evenement: 'b', badges: 2 }] })).toThrow();
    expect(() => chargerBlue({ ...bon, revanches: [] })).toThrow();
    expect(() => chargerBlue(null)).toThrow();
  });
});
