import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { expect, it } from 'vitest';

it('la fixture casino provient du code V1 et affiche son empreinte', async () => {
  const script = fileURLToPath(new URL('../scripts/extraire-casino-v1.mjs', import.meta.url));
  const sortie = await new Promise<{ erreur: Error | null; stdout: string; stderr: string }>((fin) => {
    execFile(process.execPath, [script, '--verifier'], (erreur, stdout, stderr) => fin({ erreur, stdout, stderr }));
  });
  expect(sortie.stderr).toBe('');
  expect(sortie.erreur).toBeNull();
  const contenu = await readFile(new URL('./fixtures/v1-casino.json', import.meta.url));
  expect(sortie.stdout).toContain(`Empreinte SHA-256 : ${createHash('sha256').update(contenu).digest('hex')}`);
  const fixture = JSON.parse(contenu.toString());
  for (const [fichier, empreinte] of Object.entries(fixture.sources)) {
    const source = await readFile(new URL(`../${fichier}`, import.meta.url));
    expect(createHash('sha256').update(source).digest('hex'), fichier).toBe(empreinte);
  }
  expect(fixture.machine.table).toHaveLength(125);
  expect(fixture.machine.serie.tirages).toBe(300_000);
  expect(fixture.machine.serie.nombre).toBe(100_000);
  expect(fixture.machine.serie.premiers).toHaveLength(50);
  expect(fixture.pileOuFace.serie.tirages).toBe(10_000);
  expect(fixture.pileOuFace.serie.nombre).toBe(10_000);
  expect(fixture.blackjack.scenarios).toHaveLength(8);
  expect(fixture.blackjack.scenarios[0].gain).toBe(7.5);
  expect(fixture.blackjack.serie.tirages).toBe(510_000);
  expect(fixture.blackjack.serie.premiers).toHaveLength(20);
  expect(fixture.blackjack.serie.premiers.every((main: { tirages: number }) => main.tirages === 51)).toBe(true);
  expect(fixture.boutique.achats).toHaveLength(14);
  expect(fixture.boutique.sexes).toHaveLength(12);
  for (const serie of fixture.boutique.sexes) {
    expect(serie.valeurs).toHaveLength(100);
    expect(serie.tirages).toBe(serie.numero === 137 ? 0 : 100);
  }
  expect(fixture.acces.zone).toBe(11);
  expect(fixture.acces.zonePrecedente).toEqual({ ancienId: 10, id: 'kanto.tour-pokemon', nom: 'Tour Pokémon' });
  expect(fixture.acces.conditionV2).toEqual({ type: 'boss', zone: 'kanto.tour-pokemon' });
}, 30_000);

it('chaque tour respecte le nombre de tirages V1 sur la série entière', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/v1-casino.json', import.meta.url), 'utf8'));
  expect(fixture.machine.serie.tiragesParTour).toEqual({ 3: 100_000 });
  expect(fixture.pileOuFace.serie.tiragesParTour).toEqual({ 1: 10_000 });
  expect(fixture.blackjack.serie.tiragesParTour).toEqual({ 51: 10_000 });
});
