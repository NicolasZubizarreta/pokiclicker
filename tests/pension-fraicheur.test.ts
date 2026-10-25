import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

it('la fixture pension provient du code V1 et affiche son empreinte', async () => {
  const script = fileURLToPath(new URL('../scripts/extraire-pension-v1.mjs', import.meta.url));
  const sortie = await new Promise<{ erreur: Error | null; stdout: string; stderr: string }>((fin) => {
    execFile(process.execPath, [script, '--verifier'], (erreur, stdout, stderr) => fin({ erreur, stdout, stderr }));
  });
  expect(sortie.stderr).toBe('');
  expect(sortie.erreur).toBeNull();
  expect(sortie.stdout).toMatch(/Empreinte SHA-256 : [a-f0-9]{64}/);
}, 30_000);

it('couvre les espèces, les tirages et les mouvements de pension V1', async () => {
  const fixture = JSON.parse(await readFile(new URL('./fixtures/v1-pension.json', import.meta.url), 'utf8'));
  expect(fixture.formesDeBase).toHaveLength(151);
  expect(fixture.compatibilite).toHaveLength(151);
  for (const ligne of fixture.compatibilite) expect(ligne).toMatch(/^[024]{151}$/);
  expect(fixture.cas.map((cas: { chance: number }) => cas.chance)).toEqual([0.04, 0.04, 0.04, 0, 0, 0, 0]);
  expect(fixture.ponte.paires).toHaveLength(5);
  for (const paire of fixture.ponte.paires) {
    expect(paire.appels).toBe(1000);
    expect(paire.slots).toBe(1000);
    const metamorphs = paire.parents.filter((parent: { id: number }) => parent.id === 132).length;
    expect(paire.tirages).toBe(paire.nom === 'incompatible' ? 0 : 1000 + paire.oeufs.length * (metamorphs === 2 ? 2 : 1));
    for (const oeuf of paire.oeufs) {
      expect(oeuf.appel).toBeGreaterThanOrEqual(1);
      expect(oeuf.appel).toBeLessThanOrEqual(1000);
      expect(oeuf.numero).toBeGreaterThanOrEqual(1);
      expect(oeuf.numero).toBeLessThanOrEqual(151);
      expect(typeof oeuf.shiny).toBe('boolean');
    }
    if (paire.nom !== 'incompatible') expect(paire.oeufs.length).toBeGreaterThan(0);
  }
  expect(fixture.ponte.plein.tirages).toBe(0);
  expect(fixture.ponte.verrouille.tirages).toBe(0);
  expect(fixture.emplacements.map((cas: { cout: number }) => cas.cout)).toEqual([5000, 10000, 15000, 20000, 0, 0]);
  expect(fixture.retraitOeuf.map((cas: { destination: string }) => cas.destination)).toEqual(['equipe', 'pc']);
  for (const cas of fixture.retraitOeuf) {
    expect(cas.pokedex).toEqual([25]);
    expect(cas.appelsPokedex).toEqual([25]);
    expect(cas.oeuf).toMatchObject({ id: 25, level: 1, isEgg: true, hatchSteps: 0, maxSteps: 25, happiness: 0, xp: 0 });
  }
  expect(fixture.parents.dernier.messages[0][0]).toBe('IMPOSSIBLE (DERNIER POKÉMON)');
  expect(fixture.parents.actif.messages[0][0]).toBe('IL FAUT 1 POKÉMON ACTIF !');
  expect(fixture.parents.depuisPC.parents[0].id).toBe(25);
  expect(fixture.parents.oeuf.parents[0].isEgg).toBe(true);
  expect(fixture.parents.retraits.map((cas: { destination: string }) => cas.destination)).toEqual(['equipe', 'pc']);
  expect(fixture.eclosion.etapes).toHaveLength(25);
  expect(fixture.eclosion.etapes.slice(0, 24).every((etape: { equipe: { isEgg: boolean } }) => etape.equipe.isEgg)).toBe(true);
  expect(fixture.eclosion.etapes[24].equipe).toMatchObject({ isEgg: false, level: 1, happiness: 125, isShiny: true });
  expect(fixture.eclosion.etapes.every((etape: { pc: { isEgg: boolean; hatchSteps: number } }) => etape.pc.isEgg && etape.pc.hatchSteps === 0)).toBe(true);
  expect(fixture.eclosion.appelsPokedex).toEqual([25]);
});
