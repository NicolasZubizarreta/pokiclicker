import { expect, it, vi } from 'vitest';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import casino from '../../data/casino.json';
import { reglages } from './reglages';
import { regionInitiale, validerDonneesRegion } from './sauvegarde';
import { avecTutoVu, chargerTutoriels, tutoriel, tutoriels, tutoAArmer, tutosDejaDepasses, validerTutoriels, type Tutoriel } from './tutoriels';

const depart = () => ({ ...regionInitiale('kanto', 'kanto.route-1'), etape: 0, jetons: 0 });

it('charge les données réelles, leurs identifiants uniques et leurs textes courts', () => {
  expect(chargerTutoriels()).toEqual(tutoriels);
  expect(new Set(tutoriels.map(t => t.id)).size).toBe(tutoriels.length);
  expect(tutoriel('route-1').etapes).toHaveLength(8);
  for (const t of tutoriels) for (const e of t.etapes) expect(e.texte.trim().split(/ +/).length).toBeLessThanOrEqual(12);
  expect(() => tutoriel('inconnu')).toThrow();
});

it.each([
  ['écran absent', (t: Tutoriel) => { Reflect.deleteProperty(t, 'ecran'); }],
  ['écran inconnu', (t: Tutoriel) => { Object.assign(t, { ecran: 'inconnu' }); }],
  ['texte trop long', (t: Tutoriel) => { t.etapes[0]!.texte = Array(13).fill('mot').join(' '); }],
  ['action inconnue', (t: Tutoriel) => { Object.assign(t.etapes[0]!, { action: 'inconnue' }); }],
  ['cible nulle avec clic', (t: Tutoriel) => { t.etapes[0]!.cible = null; }],
  ['déblocage inconnu', (t: Tutoriel) => { t.declencheur = { cible: 'pc', deblocage: 'inconnu' }; }],
  ['neuf étapes', (t: Tutoriel) => { t.etapes.push(structuredClone(t.etapes[0]!)); }],
  ['identifiant vide', (t: Tutoriel) => { t.id = ' '; }],
  ['identifiant avec deux-points', (t: Tutoriel) => { t.id = 'a:b'; }],
  ['geste vide', (t: Tutoriel) => { t.etapes[0]!.geste = ' '; }],
  ['déclencheur hybride', (t: Tutoriel) => { Object.assign(t.declencheur, { cible: 'pc', deblocage: 'pc' }); }],
] as const)('rejette %s', (_nom, modifier) => {
  const liste = chargerTutoriels();
  modifier(liste[0]!);
  expect(() => validerTutoriels(liste)).toThrowError();
});

it('rejette les identifiants en double et les étapes absentes', () => {
  expect(() => validerTutoriels([tutoriel('pc'), tutoriel('pc')])).toThrowError();
  expect(() => validerTutoriels([{ ...tutoriel('pc'), etapes: [] }])).toThrowError();
});

it('reste cohérent avec les règles de pension et les achats de jetons', () => {
  const pension = tutoriel('pension').etapes.map(e => e.texte).join(' ');
  expect(pension).toContain(String(reglages.pension.pasEclosion));
  expect(pension).toContain(`${reglages.pension.marqueEclosion * 100} %`);
  const texte = tutoriel('casino').etapes.map(e => e.texte).join(' ');
  expect(texte).toContain(String(casino.jetons.achat.cost));
  expect(texte).toContain(String(casino.jetons.achat.tokens));
});

it('reconnaît seulement les tutoriels déjà dépassés', () => {
  const region = depart();
  expect(tutosDejaDepasses(region)).toEqual([]);
  expect(tutosDejaDepasses({ ...region, statistiques: { ...region.statistiques, eliminations: 1 } })).toEqual(['route-1']);
  expect(tutosDejaDepasses({ ...region, etape: 2 })).toEqual(['route-1']);
  expect(tutosDejaDepasses({ ...region, bossVaincus: ['boss'] })).toEqual(['route-1']);
  expect(tutosDejaDepasses({ ...region, pc: [{ uid: 'test', numero: 25, niveau: 5, xp: 0, shiny: false,
    bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false }] })).toEqual(['pc']);
  expect(tutosDejaDepasses({ ...region, casinoVu: true })).toEqual(['casino']);
  expect(tutosDejaDepasses({ ...region, jetons: 1 })).toEqual(['casino']);
  expect(tutosDejaDepasses({ ...region, pensionVue: true })).toEqual(['pension']);
});

it('dérive un tutoriel de déblocage depuis l’annonce déjà vue, sans toucher à la Route 1', () => {
  const region = { ...depart(), annoncesVues: ['poke-radar', 'route-1'] };
  const declencheur = tutoriel('poke-radar').declencheur;
  expect('deblocage' in declencheur && region.annoncesVues.includes(declencheur.deblocage)).toBe(true);
  expect(tutosDejaDepasses(region)).toEqual(['poke-radar']);
});

it('arme la Route 1 après l’intro et avant la première victoire', () => {
  const visibles = new Set<string>();
  expect(tutoAArmer(depart(), [], visibles)).toBeNull();
  const region = { ...depart(), evenementsJoues: ['kanto.intro'], starterId: 25 };
  expect(tutoAArmer(region, [], visibles)).toBeNull();
  visibles.add('ennemi');
  expect(tutoAArmer(region, [], visibles)?.id).toBe('route-1');
  expect(tutoAArmer({ ...region, starterId: null }, [], visibles)).toBeNull();
  expect(tutoAArmer(avecTutoVu(region, 'route-1'), [], visibles)).toBeNull();
  expect(tutoAArmer({ ...region, statistiques: { ...region.statistiques, eliminations: 1 } }, [], visibles)).toBeNull();
});

it('exige visibilité, déblocage et absence de vue, dans l’ordre du fichier', () => {
  const region = depart();
  expect(tutoAArmer(region, ['pc'], new Set())).toBeNull();
  expect(tutoAArmer(region, [], new Set(['page-pc']))).toBeNull();
  expect(tutoAArmer(region, ['pc'], new Set(['page-pc']))?.id).toBe('pc');
  expect(tutoAArmer(avecTutoVu(region, 'pc'), ['pc'], new Set(['page-pc']))).toBeNull();
  expect(tutoAArmer(region, ['casino', 'pc'], new Set(['casino-jetons', 'page-pc']))?.id).toBe('pc');
});

it('n’interroge le DOM que si un tutoriel non vu a son déblocage, et une seule fois', () => {
  const region = { ...depart(), evenementsJoues: ['kanto.intro'], starterId: 25, statistiques: { ...depart().statistiques, eliminations: 3 } };
  const lire = vi.fn(() => new Set(['page-pc', 'casino-jetons']));
  expect(tutoAArmer(region, [], lire)).toBeNull();
  expect(lire).not.toHaveBeenCalled();
  expect(tutoAArmer(region, ['casino', 'pc'], lire)?.id).toBe('pc');
  expect(lire).toHaveBeenCalledTimes(1);
});

it('ajoute une vue sans doublon et sans mutation', () => {
  const region = depart();
  const vue = avecTutoVu(region, 'pc');
  expect(vue.tutosVus).toEqual(['pc']);
  expect(region.tutosVus).toBeUndefined();
  expect(avecTutoVu(vue, 'pc')).toBe(vue);
  expect(avecTutoVu(vue, 'casino').tutosVus).toEqual(['pc', 'casino']);
  expect(vue.tutosVus).toEqual(['pc']);
});

it('valide la liste sauvegardée et accepte les anciennes sauvegardes', () => {
  const region = regionInitiale('kanto', 'kanto.route-1');
  expect(() => validerDonneesRegion(region)).not.toThrow();
  expect(() => validerDonneesRegion({ ...region, tutosVus: ['pc'] })).not.toThrow();
  expect(() => validerDonneesRegion({ ...region, tutosVus: 'pc' })).toThrow();
  expect(() => validerDonneesRegion({ ...region, tutosVus: [1] })).toThrow();
  expect(() => validerDonneesRegion({ ...region, tutosVus: [{}] })).toThrow();
  expect(() => validerDonneesRegion({ ...region, tutosVus: Array(100_000).fill('pc') })).toThrow();
  expect(() => validerDonneesRegion({ ...region, tutosVus: Array(65).fill('pc') })).toThrow();
  expect(() => validerDonneesRegion({ ...region, tutosVus: ['x'.repeat(41)] })).toThrow();
  expect(() => validerDonneesRegion({ ...region, tutosVus: Array(64).fill('x'.repeat(40)) })).not.toThrow();
});

it('retrouve chaque cible dans les attributs de l’interface', () => {
  function lireSources(dossier: string): string[] {
    return readdirSync(dossier, { withFileTypes: true }).flatMap(entree => {
      const chemin = join(dossier, entree.name);
      return entree.isDirectory() ? lireSources(chemin)
        : entree.name.endsWith('.tsx') && !/\.(test|spec)\./.test(entree.name) ? [readFileSync(chemin, 'utf8')] : [];
    });
  }
  const sources = lireSources('src/ui');
  const cibles = tutoriels.flatMap(t => [...t.etapes.map(e => e.cible), ...('cible' in t.declencheur ? [t.declencheur.cible] : [])]);
  for (const cible of new Set(cibles.filter(c => c !== null))) {
    expect(sources.some(source => new RegExp(`(?:data-tuto|tuto)=(?:"${cible}"|\{[^}]*["']${cible}["'])`).test(source)), `Cible absente : ${cible}`).toBe(true);
  }
});
