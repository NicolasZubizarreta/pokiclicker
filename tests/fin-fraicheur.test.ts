import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const lire = async (chemin: string) => JSON.parse(await readFile(new URL(chemin, import.meta.url), 'utf8'));

it('les données de fin et la fixture sont celles extraites de la V1', async () => {
  const script = fileURLToPath(new URL('../scripts/extraire-fin-v1.mjs', import.meta.url));
  const sortie = await new Promise<{ erreur: Error | null; stdout: string; stderr: string }>((fin) => {
    execFile(process.execPath, [script, '--verifier'], (erreur, stdout, stderr) => fin({ erreur, stdout, stderr }));
  });
  expect(sortie.stderr).toBe('');
  expect(sortie.erreur).toBeNull();
  expect(sortie.stdout).toMatch(/Empreinte SHA-256 : [a-f0-9]{64}/);
}, 30_000);

it('conserve les six combats, les starters et toute la table des conditions V1', async () => {
  const defi = await lire('../data/defi-chen.json');
  const fixture = await lire('./fixtures/v1-fin.json');
  expect(defi.version).toBe(1);
  expect(defi.combats.map((combat: { pokemon: number }) => combat.pokemon)).toEqual([128, 103, 59, 130, 3, 149]);
  expect(defi.counter).toEqual([
    { starter: 1, pokemon: 9, nom: 'Tortank' },
    { starter: 4, pokemon: 3, nom: 'Florizarre' },
    { starter: 7, pokemon: 6, nom: 'Dracaufeu' },
    { starter: null, pokemon: 3, nom: 'Florizarre' },
  ]);
  expect(fixture.rosters).toHaveLength(4);
  for (const cas of fixture.rosters) {
    expect(cas.combats).toHaveLength(6);
    for (const [index, combat] of cas.combats.entries()) {
      expect(combat).toEqual({
        etape: index + 1, nom: index === 4 ? defi.counter.find((c: { starter: number | null }) => c.starter === cas.starter).nom : defi.combats[index].nom,
        pokemon: index === 4 ? defi.counter.find((c: { starter: number | null }) => c.starter === cas.starter).pokemon : defi.combats[index].pokemon,
        niveau: 100, capture: 0, minuteurMs: 30_000,
      });
    }
  }
  expect(fixture.conditions).toHaveLength(48);
  for (const cas of fixture.conditions) {
    expect(cas.possible).toBe(cas.leagueWins >= 1 && cas.hasSeenEnding && cas.pokedex >= 151 && !cas.chenChallengeCompleted);
  }
  expect(defi.dialogues).toEqual(fixture.dialogues);
  expect(fixture.dialogues.fin).toHaveLength(8);
  expect(fixture.dialogues.intro).toHaveLength(3);
  expect(fixture.dialogues.victoire).toHaveLength(3);
  expect(defi.messages.echec).toBe("Continue de t'entraîner pour réussir ton dernier défi...");
});

it('conserve les textes, images et temps des crédits sans masquer les écarts JS/CSS', async () => {
  const credits = await lire('../data/credits.json');
  const fixture = await lire('./fixtures/v1-fin.json');
  expect(credits.titre).toBe('POKÉ-CLICKER : KANTO ORIGINS');
  expect(credits.sections).toHaveLength(6);
  expect({ titre: credits.titre, message: credits.message, sections: credits.sections }).toEqual(fixture.credits);
  expect(credits.sections.flatMap((section: { lignes: string[] }) => section.lignes)).toHaveLength(12);
  expect(credits.temps).toEqual({ delaiMs: 1000, dureeMs: 110000, finMs: 4000, fonduMs: 1300 });
  expect(fixture.temps.css).toEqual({ delaiMs: 0, dureeMs: 110000, fonduMs: 1200 });
  expect(credits.imagesFlottantes).toMatchObject({ maximum: 3, intervalleMs: 3200, taillePourcent: [8, 30], vieMs: [3500, 5500], opacite: 0.6 });
  expect(credits.imagesOmises).toEqual(['img/kanto/background/Pantheon.png']);
  expect(credits.imagesFlottantes.images).toEqual(fixture.images.filter((image: string) => !credits.imagesOmises.includes(image)));
  expect(fixture.images).toHaveLength(37);
});
