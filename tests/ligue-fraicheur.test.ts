import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/extraire-ligue-v1.mjs', import.meta.url));

it('ligue.json et la fixture V1 sont ceux que produit le code de la V1', async () => {
  const sortie = await new Promise<{ erreur: Error | null; stdout: string; stderr: string }>((fin) => {
    execFile(process.execPath, [script, '--verifier'], (erreur, stdout, stderr) => fin({ erreur, stdout, stderr }));
  });
  expect(sortie.stderr).toBe('');
  expect(sortie.erreur).toBeNull();
  expect(sortie.stdout).toMatch(/Empreinte SHA-256 : [a-f0-9]{64}/);
}, 30_000);

it('décrit les dix combats V1, les cinq dresseurs et les trois counters', async () => {
  const lire = async (chemin: string) => JSON.parse(await readFile(new URL(chemin, import.meta.url), 'utf8'));
  const ligue = await lire('../data/ligue.json');
  const fixture = await lire('./fixtures/v1-ligue.json');
  const zones = await lire('../data/regions/kanto/zones.json');
  const zone = zones.zones.find((candidate: { id: string }) => candidate.id === ligue.zone);
  expect(ligue.version).toBe(1);
  expect(ligue.zone).toBe('kanto.ligue-pokemon');
  expect(ligue.dresseurs).toEqual([
    { id: 'olga', nom: 'Olga' }, { id: 'aldo', nom: 'Aldo' },
    { id: 'agatha', nom: 'Agatha' }, { id: 'peter', nom: 'Peter' },
    { id: 'maitre-blue', nom: 'Maître Blue' },
  ]);
  expect(ligue.combats).toHaveLength(10);
  expect(fixture.combats).toHaveLength(10);
  for (let index = 0; index < 10; index++) {
    const brut = fixture.combats[index];
    const adversaire = index === 9 ? zone.boss : zone.adversaires[index];
    expect(ligue.combats[index]).toEqual({
      etape: index + 1, dresseur: ligue.dresseurs[Math.floor(index / 2)].id,
      nom: brut.name, pokemon: brut.id, niveau: brut.level, minuteurMs: 30_000,
    });
    expect({ nom: brut.name, pokemon: brut.id, niveau: brut.level, capture: brut.catchRate }).toEqual(adversaire);
    expect(brut.isBoss).toBe(true);
    expect(brut.catchRate).toBe(0);
    expect(brut.maxHp).toBeGreaterThan(0);
  }
  expect(ligue.counter).toEqual([
    { starter: 1, pokemon: 6, nom: 'Maître Blue (Dracaufeu)' },
    { starter: 4, pokemon: 9, nom: 'Maître Blue (Tortank)' },
    { starter: 7, pokemon: 3, nom: 'Maître Blue (Florizarre)' },
  ]);
  expect(fixture.counter.map((cas: { starterId: number | null; id: number; name: string }) => ({
    starter: cas.starterId, pokemon: cas.id, nom: cas.name,
  }))).toEqual([...ligue.counter, { starter: null, pokemon: 9, nom: 'Maître Blue' }]);
  for (const cas of [...fixture.combats, ...fixture.counter]) {
    expect(cas.minuteur.periodeMs).toBe(1000);
    expect(cas.minuteur.tops).toHaveLength(30);
    expect(cas.minuteur.tops.slice(0, 29).every((top: { expire: boolean }) => !top.expire)).toBe(true);
    expect(cas.minuteur.tops[29]).toEqual({ largeur: '0%', expire: true });
  }
  expect(ligue.messages).toEqual({
    enchainement: 'Victoire contre {dresseur} ! {suivant} entre en scène.',
    victoire: 'Victoire contre {dresseur} !',
    defaite: 'Temps écoulé ! Retour au premier Pokémon de {dresseur}.',
  });
});
