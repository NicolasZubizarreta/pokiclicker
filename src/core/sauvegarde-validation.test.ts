import { describe, it, expect } from 'vitest';
import { partieInitiale, regionInitiale } from './sauvegarde';
import { validerDonneesPartie, validerDonneesRegion, validerEnveloppe, validerPokemonPossede } from './sauvegarde-validation';
import { reglages } from './reglages';
import { commandeCourante } from './evenements';
import monde from '../../data/regions/kanto/zones.json';

const region = () => regionInitiale('kanto', 'inconnue');
const pokemon = () => ({ uid: 'a', numero: 1, niveau: 5, xp: 0, shiny: false, bonheur: 0, calcium: 0, pierreEternelle: false, sexe: 'male', favori: false });
describe('validation des sauvegardes auditées', () => {
  it('S-core-01 / B-core-07 répare la zone et les étapes au chargement', () => {
    const r = region(); r.etape = 99999;
    const e = validerEnveloppe({ version: 4, niveau: 'region', id: 'kanto', revision: 1, ecritLe: '2026-11-19T00:00:00Z', donnees: r }, 'region');
    expect(e.donnees).toMatchObject({ zoneId: 'kanto.bourg-palette', etape: 1 });
  });
  it('S-core-02 borne les nombres et refuse les révisions débordantes', () => {
    const p = partieInitiale('Test'); p.statistiques.argentTotalGagne = Number.MAX_VALUE;
    validerDonneesPartie(p);
    expect(p.statistiques.argentTotalGagne).toBe(Number.MAX_SAFE_INTEGER);
    expect(() => validerEnveloppe({ version: 4, niveau: 'partie', id: 'a', revision: Number.MAX_SAFE_INTEGER, ecritLe: '2026-11-19T00:00:00Z', donnees: partieInitiale('Test') }, 'partie')).toThrow();
  });
  it('S-core-03 ramène les statistiques au maximum du jeu au lieu de refuser la partie (incident du 20/11)', () => {
    for (const [cle, max] of Object.entries({ niveau: reglages.recompenses.niveauMax, calcium: reglages.degats.calciumMax, bonheur: reglages.recompenses.bonheur.max })) {
      const p = { ...pokemon(), [cle]: max + 1 };
      validerPokemonPossede(p);
      expect((p as Record<string, unknown>)[cle]).toBe(max);
    }
  });
  it('S-core-04 répare les uid partagés entre équipe et pension au lieu de refuser la partie (incident du 20/11)', () => {
    const r = region(); r.equipe = [pokemon() as never]; r.pension.parents = [pokemon() as never];
    validerDonneesRegion(r);
    expect(new Set([...r.equipe, ...r.pension.parents].map(p => p.uid)).size).toBe(2);
    expect(r.equipe[0]!.uid).toBe('a');
  });
  it('S-core-05 dédoublonne les identifiants et borne les listes', () => {
    const p = partieInitiale('Test'); p.vus = [1, 1]; validerDonneesPartie(p); expect(p.vus).toEqual([1]);
    p.drapeaux = Array.from({ length: 10001 }, (_, i) => String(i));
    validerDonneesPartie(p);
    expect(p.drapeaux).toEqual(Array.from({ length: 10000 }, (_, i) => String(i)));
  });
  it('S-core-07 retire une région inconnue', () => {
    const p = partieInitiale('Test'); p.regionsDebloquees.push('inconnue');
    validerDonneesPartie(p); expect(p.regionsDebloquees).toEqual(['kanto']);
  });
  it('S-core-12 abandonne l’événement en cours déjà joué (le catalogue, injecté par le store, est jugé par le moteur)', () => {
    const r = region(); r.evenementEnCours = { id: 'kanto.intro', etape: 0, file: [] }; r.evenementsJoues = ['kanto.intro'];
    validerDonneesRegion(r); expect(r.evenementEnCours).toBeUndefined();
  });
  it('S-core-31 commandeCourante reste sûre hors catalogue', () => {
    const r = region(); r.evenementEnCours = { id: 'inconnu', etape: 99, file: [] };
    expect(commandeCourante({ liste: [], parId: () => { throw Error(); } }, r)).toBeNull();
  });
  it('B-core-07 borne les étapes des zones connues', () => {
    const z = monde.zones.find(z => z.etapes)!;
    for (const etape of [-10, 0, 99999]) {
      const r = region(); r.zoneId = z.id; r.etape = etape;
      validerDonneesRegion(r); expect(r.etape).toBe(etape < 1 ? 1 : z.etapes);
    }
  });
  it('conserve les fixtures versionnées encore prises en charge', () => {
    const fichiers = import.meta.glob<{ niveau: 'region' | 'partie' | 'compte'; version: number }>('./migrations/__fixtures__/{partie,region,compte}-v{1,2}.json', { eager: true, import: 'default' });
    expect(Object.keys(fichiers).length).toBeGreaterThan(0);
    for (const [chemin, fixture] of Object.entries(fichiers)) {
      const copie = structuredClone(fixture) as typeof fixture & { donnees: Record<string, unknown> };
      // Même préparation que sauvegarde.test.ts : « futur » est volontairement interdit.
      delete copie.donnees.futur;
      expect(() => validerEnveloppe(copie, copie.niveau), chemin).not.toThrow();
    }
  });
  it('S-core-15 borne noms et identifiants', () => {
    const p = partieInitiale('a'.repeat(101));
    validerDonneesPartie(p); expect(p.nom).toBe('a'.repeat(100));
    const r = region(); r.regionId = 'a'.repeat(65); expect(() => validerDonneesRegion(r)).toThrow();
  });
  it('B-core-06 conserve un starter hors catalogue', () => {
    const r = region(); r.starterId = 25;
    validerDonneesRegion(r); expect(r.starterId).toBe(25);
  });
  it('B-core-10 arrondit les anciens montants vers le bas', () => {
    const r = region(); r.argent = 12.9; r.statistiques.argentTotalGagne = 15.8;
    validerDonneesRegion(r); expect(r.argent).toBe(12); expect(r.statistiques.argentTotalGagne).toBe(15);
  });
});
