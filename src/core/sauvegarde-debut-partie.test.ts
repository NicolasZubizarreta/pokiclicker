import { describe, expect, it } from 'vitest';
import { kanto } from './regions';
import { compteInitial, partieInitiale, regionInitiale, VERSION_ACTUELLE } from './sauvegarde';
import type { DonneesRegion } from './sauvegarde';
import { validerEnveloppe } from './sauvegarde-validation';

// Régression (incident du 20/11) : les parties de début de jeu doivent toujours rester lisibles.
const enveloppe = <D>(niveau: 'compte' | 'partie' | 'region', id: string, donnees: D) =>
  ({ version: VERSION_ACTUELLE, niveau, id, revision: 3, ecritLe: '2026-11-18T10:00:00.000Z', donnees });

describe('parties de début de jeu', () => {
  it('compte, partie et région neufs sont valides', () => {
    expect(() => validerEnveloppe(enveloppe('compte', 'local', compteInitial()), 'compte')).not.toThrow();
    expect(() => validerEnveloppe(enveloppe('partie', 'p1', partieInitiale('Ma partie')), 'partie')).not.toThrow();
    const region = regionInitiale('kanto', kanto.depart);
    expect(() => validerEnveloppe(enveloppe('region', 'kanto', region), 'region')).not.toThrow();
  });

  it.each(Object.keys(kanto.lieux ?? {}).length ? [] : [0])('zone de départ', () => {
    const region = regionInitiale('kanto', kanto.depart);
    expect(region.zoneId).toBeTruthy();
  });

  it('une vraie partie avancée n\'est jamais refusée pour une règle douce (listes, plafonds, uid)', () => {
    const p = (uid: string) => ({ uid, numero: 25, niveau: 12, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false,
      calcium: 0, favori: false, sexe: 'male' as const });
    const region = regionInitiale('kanto', kanto.depart);
    const avancee = { ...region,
      equipe: [{ ...p('a'), niveau: 400, calcium: 99, bonheur: 9999 }], pc: [p('a'), p('b')], // uid « a » en double
      badges: Array.from({ length: 40 }, (_, i) => `badge-${i % 3}`),
      ameliorations: Array.from({ length: 60 }, (_, i) => `amelio-${i}`),
      jalonsRecus: Array.from({ length: 50 }, (_, i) => i + 1),
      zonesAtteintes: Array.from({ length: 80 }, (_, i) => `zone-${i}`) };
    const resultat = validerEnveloppe(enveloppe('region', 'kanto', avancee), 'region').donnees as DonneesRegion;
    const uids = [...resultat.equipe, ...resultat.pc].map(x => x.uid);
    expect(new Set(uids).size).toBe(3);
    expect(resultat.equipe[0]!.niveau).toBe(100);
    expect(resultat.badges).toHaveLength(3);
    expect(resultat.ameliorations.length).toBeLessThan(60);
  });

  it('incident du 20/11 : toutes les zones visitées plus le Centre commercial (24 entrées) restent intactes', () => {
    const visitees = [...kanto.zones.map(z => z.id), 'centre-commercial'];
    expect(visitees.length).toBeGreaterThan(kanto.zones.length);
    const region = { ...regionInitiale('kanto', kanto.depart), zonesAtteintes: visitees };
    const resultat = validerEnveloppe(enveloppe('region', 'kanto', region), 'region').donnees as DonneesRegion;
    expect(resultat.zonesAtteintes).toEqual(visitees);
  });

  it('chaque zone et chaque lieu de Kanto est un point de sauvegarde valide', () => {
    const zones = kanto.zones.map(z => z.id);
    const lieux = (kanto as unknown as { lieux?: { id?: string; lieu?: string }[] }).lieux ?? [];
    const ids = [...zones, ...lieux.map(l => l.id ?? `kanto.${l.lieu}`), 'kanto.labo'];
    for (const zoneId of ids) {
      const region: DonneesRegion = { ...regionInitiale('kanto', kanto.depart), zoneId };
      expect(() => validerEnveloppe(enveloppe('region', 'kanto', region), 'region'), zoneId).not.toThrow();
    }
  });
});
