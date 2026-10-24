import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const script = fileURLToPath(new URL('../scripts/extraire-zones-v1.mjs', import.meta.url));

// Les zones de Kanto et leur copie brute doivent toujours sortir du code actuel de la V1.
it('zones.json et la fixture V1 sont ceux que produit le code de la V1', async () => {
  const sortie = await new Promise<{ erreur: Error | null; stderr: string }>((fin) => {
    execFile(process.execPath, [script, '--verifier'], (erreur, _stdout, stderr) => fin({ erreur, stderr }));
  });
  expect(sortie.stderr).not.toContain('diffère de la V1');
  expect(sortie.erreur).toBeNull();
}, 30_000);
