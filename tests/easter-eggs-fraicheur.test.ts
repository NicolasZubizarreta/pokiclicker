import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

it('le registre et la fixture des easter eggs sont ceux extraits de la V1', async () => {
  const script = fileURLToPath(new URL('../scripts/extraire-easter-eggs-v1.mjs', import.meta.url));
  const sortie = await new Promise<{ erreur: Error | null; stdout: string; stderr: string }>((fin) => {
    execFile(process.execPath, [script, '--verifier'], (erreur, stdout, stderr) => fin({ erreur, stdout, stderr }));
  });
  expect(sortie.stderr).toBe('');
  expect(sortie.erreur).toBeNull();
  expect(sortie.stdout).toMatch(/Empreinte SHA-256 : [a-f0-9]{64}/);
}, 30_000);

it('relève les 151 stades, les six sites V1 et les quatre effets actifs', async () => {
  const lire = async (chemin: string) => JSON.parse(await readFile(new URL(chemin, import.meta.url), 'utf8'));
  const registre = await lire('../data/easter-eggs.json');
  const fixture = await lire('./fixtures/v1-easter-eggs.json');
  expect(registre.version).toBe(1);
  expect(registre.effets.filter((effet: { inactif: boolean }) => !effet.inactif)
    .map((effet: { declencheurs: string[] }) => effet.declencheurs))
    .toEqual([['dinnerbone', 'grumm'], ['jeb_'], ['caca'], ['daran']]);
  expect(registre.effets.filter((effet: { inactif: boolean }) => effet.inactif)).toEqual([
    { nom: 'Bjorn', declencheurs: ['bjorn'], effet: null, assets: [], inactif: true, raison: 'Apparence non définie par Nicolas (design/DESIGN.md)' },
    { nom: 'Gabriel', declencheurs: ['gabriel'], effet: null, assets: [], inactif: true, raison: 'Apparence non définie par Nicolas (design/DESIGN.md)' },
  ]);
  expect(fixture.stades.map((cas: { numero: number }) => cas.numero)).toEqual(Array.from({ length: 151 }, (_, i) => i + 1));
  for (const numero of [1, 25, 133, 151]) expect(fixture.stades[numero - 1]).toEqual({ numero, stade: 1 });
  for (const numero of [2, 26, 134, 135, 136]) expect(fixture.stades[numero - 1]).toEqual({ numero, stade: 2 });
  for (const numero of [3, 31, 62, 149]) expect(fixture.stades[numero - 1]).toEqual({ numero, stade: 3 });
  expect(fixture.sites.map((site: { site: string }) => site.site)).toEqual(['equipe', 'pc', 'fiche', 'renommage', 'pension', 'pantheon']);
  for (const site of fixture.sites) {
    expect(site.effets.map((effet: { nom: string }) => effet.nom)).toEqual(['dinnerbone', 'grumm', 'jeb_', 'caca', 'daran']);
    expect(site.effets[0].classe || site.effets[0].transformation).toBeTruthy();
    expect(site.effets[2].classe).toBe('rainbow-anim');
    expect(site.effets[3].classe || site.effets[3].filtre).toBeTruthy();
    expect(site.effets[4].image).toBe('img/kanto/EasterEgg/DaranStade1.png');
  }
  expect(registre.css).toEqual(fixture.css);
  expect(Object.keys(fixture.css)).toEqual(['caca-filter', 'rainbow', 'rainbow-anim', 'upside-down', 'float-upside-down', 'pokemon-float.upside-down']);
  expect(registre.effets[3].assets).toEqual([1, 2, 3].map((stade) => `img/easter-eggs/daran-stade-${stade}.webp`));
  expect(fixture.alternanceEvolutionMs).toBe(150);
});
