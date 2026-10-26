import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const lire = async (chemin: string) => JSON.parse(await readFile(new URL(chemin, import.meta.url), 'utf8'));

it('pantheon.json et la fixture sont les relevés V1 avec une empreinte SHA-256', async () => {
  const script = fileURLToPath(new URL('../scripts/extraire-pantheon-v1.mjs', import.meta.url));
  const sortie = await new Promise<{ erreur: Error | null; stdout: string; stderr: string }>(fin => {
    execFile(process.execPath, [script, '--verifier'], (erreur, stdout, stderr) => fin({ erreur, stdout, stderr }));
  });
  expect(sortie.stderr).toBe('');
  expect(sortie.erreur).toBeNull();
  expect(sortie.stdout).toMatch(/Empreinte SHA-256 : [a-f0-9]{64}/);
}, 30_000);

it('conserve les six socles, la géométrie et les textes exacts de la V1', async () => {
  const donnees = await lire('../data/pantheon.json');
  const fixture = await lire('./fixtures/v1-pantheon.json');
  expect(donnees.version).toBe(1);
  expect(donnees.socles).toEqual([[126, 652], [268, 590], [422, 564], [602, 564], [756, 590], [905, 650]]
    .map(([x, y]) => ({ x: x! / 1024, y: y! / 1024 })));
  expect(donnees.geometrie).toEqual({ tailleSprite: 160 / 1024, decalageBase: 20 / 1024, decalageNiveau: 35 / 1024, departChute: -300 / 1024 });
  const constantes = (await readFile(new URL('../legacy/js/data/constants.js', import.meta.url), 'utf8')).split(/\r?\n/).slice(492, 497).join('\n');
  expect(donnees.dialogues).toEqual(JSON.parse(constantes.slice(constantes.indexOf('['), constantes.lastIndexOf(']') + 1)));
  expect(donnees.dialogues).toHaveLength(3);
  expect(donnees.titre).toBe('MAÎTRE DE LA\nLIGUE DE KANTO');
  expect(donnees.boutonSortie).toBe('SORTIR');
  expect(fixture.spriteTroisiemeLigne).toEqual({ chemin: 'img/kanto/sprites/SpriteChen2.png', delaiMs: 350 });
});

it('relève les délais et calendriers sur le faux minuteur, première visite ou suivante', async () => {
  const donnees = await lire('../data/pantheon.json');
  const fixture = await lire('./fixtures/v1-pantheon.json');
  expect(donnees.delais).toEqual({ fonduNoirMs: 1000, fonduRetourMs: 1000, entreeChenMs: 1600, sortieChenMs: 1000, apresChenMs: 1000, entrePokemonMs: 2000, niveauMs: 1000, finalApresEquipeMs: 500, defiChenMs: 800, annonceJohtoMs: 500 });
  expect(fixture.entrees).toEqual([
    { premiere: true, minuteurs: [1000, 1000, 1600], dialogues: donnees.dialogues },
    { premiere: false, minuteurs: [1000, 1000], dialogues: [] },
  ]);
  expect(fixture.sortieDialogueMs).toEqual([1000, 1000]);
  expect(fixture.equipes).toHaveLength(6);
  for (const cas of fixture.equipes) {
    expect(cas.chutes.map((p: { tMs: number }) => p.tMs)).toEqual(Array.from({ length: cas.nombre }, (_, i) => i * 2000));
    expect(cas.niveaux.map((p: { tMs: number }) => p.tMs)).toEqual(Array.from({ length: cas.nombre }, (_, i) => i * 2000 + 1000));
    expect(cas.finalMs).toBe(cas.nombre * 2000 + 500);
    cas.chutes.forEach((p: { attributs: { x: number; y: number; width: number }; style: { transform: string } }, i: number) => {
      expect(p.attributs.x).toBe(donnees.socles[i].x * 1024 - 80);
      expect(p.attributs.y).toBe(donnees.socles[i].y * 1024 - 160 + 20);
      expect(p.attributs.width).toBe(160);
      expect(p.style.transform).toBe('translateY(-300px) ');
      expect(cas.niveaux[i].attributs.y).toBe(donnees.socles[i].y * 1024 + 35);
    });
  }
  expect(donnees.effets).toEqual({ confettiPeriodeMs: 50, confettiVieMs: 4000, confettiDureeMinMs: 2000, confettiDureeMaxMs: 4000, feuPeriodeMs: 800, feuVieMs: 1000 });
  expect(fixture.effets.map((e: { alea: number; transition: string }) => [e.alea, e.transition])).toEqual([
    [0, 'top 2s linear, transform 2s linear'], [0.5, 'top 3s linear, transform 3s linear'], [1, 'top 4s linear, transform 4s linear'],
  ]);
  for (const effet of fixture.effets) {
    expect(effet.periodesMs).toEqual([50, 800]);
    expect(effet.viesMs).toEqual([4000, 1000]);
    expect(effet.intervallesRestants).toBe(0);
  }
  expect(fixture.sorties).toEqual([
    { defi: true, minuteurs: [800], destination: 'defi-chen' },
    { defi: false, minuteurs: [500], destination: 'bourg-palette' },
  ]);
});
