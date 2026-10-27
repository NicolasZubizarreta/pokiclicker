import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it, vi } from 'vitest';
import donnees from '../data/reglages.json';
import { reglages } from '../src/core/reglages';
import { musiques } from '../src/core/musiques';

const v1 = readFileSync('legacy/js/app/main.js', 'utf8').split(/\r?\n/).slice(430, 451).join('\n');

it.each([
  { sons: { ...donnees.sons, tempo: 0 } },
  { sons: { ...donnees.sons, volumeDb: NaN } },
  { sons: { ...donnees.sons, actifParDefaut: 'oui' } },
  { sons: { ...donnees.sons, oscillateur: 'invalide' } },
  { sons: { ...donnees.sons, enveloppe: { ...donnees.sons.enveloppe, maintien: 2 } } },
  { sons: { ...donnees.sons, enveloppe: { ...donnees.sons.enveloppe, attaque: -1 } } },
  { sons: { ...donnees.sons, tons: { ...donnees.sons.tons, hit: { notes: ['Z2'], duree: '32n' } } } },
  { sons: { ...donnees.sons, tons: { ...donnees.sons.tons, hit: { notes: [], duree: '32n' } } } },
  { sons: { ...donnees.sons, tons: { ...donnees.sons.tons, hit: { notes: ['C2'], duree: '0n' } } } },
  { animations: { ...donnees.animations, secousseMs: 0 } },
])('rejette les réglages invalides %#', async modification => {
  vi.resetModules();
  vi.doMock('../data/reglages.json', () => ({ default: { ...donnees, ...modification } }));
  try {
    await expect(import('../src/core/reglages')).rejects.toThrow(/Réglages/);
  } finally {
    vi.doUnmock('../data/reglages.json');
    vi.resetModules();
  }
});

it('reprend toutes les notes, durées et le volume de la V1', () => {
  const tons = Array.from(v1.matchAll(/if\(t==='(\w+)'\) synth.triggerAttackRelease\((\[[^\]]+\]|"[^"]+"),"(\d+)n",now\)/g));
  expect(tons).toHaveLength(5);
  expect(Object.keys(reglages.sons.tons).sort()).toEqual(tons.map(ton => ton[1]).sort());
  for (const [, nom, notes, subdivision] of tons) {
    const reference: string | string[] = JSON.parse(notes!);
    expect(reglages.sons.tons[nom as keyof typeof reglages.sons.tons]).toEqual({
      notes: typeof reference === 'string' ? [reference] : reference,
      duree: `${subdivision}n`,
    });
  }
  expect(reglages.sons.volumeDb).toBe(Number(v1.match(/synth.volume.value=(-?\d+)/)![1]));
  expect(reglages.sons.tempo).toBe(120);
  expect(reglages.sons.oscillateur).toBe('triangle');
  expect(reglages.sons.enveloppe).toEqual({ attaque: 0.005, declin: 0.1, maintien: 0.3, relachement: 1 });
  expect(reglages.sons.actifParDefaut).toBe(true);
  expect(reglages.animations).toEqual({ flottementMs: 3000, secousseMs: 300, banniereMs: 3000 });
});

it('reste sans Tone et sans fichier audio hors des musiques déclarées', () => {
  const paquet = JSON.parse(readFileSync('package.json', 'utf8'));
  expect({ ...paquet.dependencies, ...paquet.devDependencies }).not.toHaveProperty('tone');
  const audio = (dossier: string): string[] => readdirSync(dossier, { withFileTypes: true }).flatMap(entree => {
    const chemin = join(dossier, entree.name);
    return entree.isDirectory() ? audio(chemin) : /\.(mp3|ogg|wav)$/i.test(entree.name) ? [chemin] : [];
  });
  const declares = Object.values(musiques.pistes).map(piste => join('public', piste.fichier));
  expect([...audio('public'), ...audio('src')].sort()).toEqual(declares.sort());
});
