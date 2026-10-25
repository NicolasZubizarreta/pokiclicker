import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const chemin = new URL('./fixtures/v1-centre.json', import.meta.url);
const empreinte = (texte: string) => createHash('sha256').update(texte).digest('hex');

it('la fixture Centre et ses sources V1 ont les empreintes attendues', async () => {
  const script = fileURLToPath(new URL('../scripts/extraire-centre-v1.mjs', import.meta.url));
  const sortie = await new Promise<{ erreur: Error | null; stdout: string; stderr: string }>((fin) => {
    execFile(process.execPath, [script, '--verifier'], (erreur, stdout, stderr) => fin({ erreur, stdout, stderr }));
  });
  expect(sortie.stderr).toBe('');
  expect(sortie.erreur).toBeNull();
  const texte = await readFile(chemin, 'utf8');
  expect(sortie.stdout.trim()).toBe(`Empreinte SHA-256 : ${empreinte(texte)}`);
  const fixture = JSON.parse(texte);
  expect(fixture.sources).toHaveLength(4);
  for (const source of fixture.sources) {
    const brut = await readFile(new URL(`../${source.fichier}`, import.meta.url), 'utf8');
    const extrait = brut.replace(/^\uFEFF/, '').split(/\r?\n/).slice(source.debut - 1, source.fin).join('\n');
    expect(empreinte(extrait)).toBe(source.sha256);
  }
}, 30_000);

it('couvre le catalogue, les prix affichés, les achats et les accès du Centre V1', async () => {
  const fixture = JSON.parse(await readFile(chemin, 'utf8'));
  expect(fixture.ordre).toEqual(['xAttack', 'xSpecial', 'pokeDoll', 'everstone', 'calcium', 'fireStone', 'waterStone', 'leafStone', 'thunderStone', 'moonStone', 'shinyToken']);
  expect(fixture.affichage).toHaveLength(18);
  for (let badges = 0; badges <= 8; badges++) {
    for (const palier of [false, true]) {
      const cas = fixture.affichage.find((cas: { badges: number; palier: boolean }) => cas.badges === badges && cas.palier === palier);
      expect(cas.objets.map((objet: { id: string }) => objet.id)).toEqual(fixture.ordre);
      for (const objet of cas.objets) {
        expect(objet.prix).toBeGreaterThan(0);
        expect(objet.stock).toBe(fixture.ordre.indexOf(objet.id) + 2);
      }
    }
  }
  expect(fixture.affichage.find((cas: { badges: number; palier: boolean }) => cas.badges === 3 && !cas.palier).objets[0].prix).toBe(8625);
  expect(fixture.achats).toHaveLength(99);
  for (const id of fixture.ordre) {
    for (const badges of [0, 4, 8]) {
      const cas = fixture.achats.filter((cas: { id: string; badges: number }) => cas.id === id && cas.badges === badges);
      expect(cas).toHaveLength(3);
      const prix = fixture.affichage.find((cas: { badges: number; palier: boolean }) => cas.badges === badges && !cas.palier).objets.find((objet: { id: string }) => objet.id === id).prix;
      expect(cas.map((achat: { argent: number }) => achat.argent)).toEqual([prix - 1, prix, 3 * prix]);
      expect(cas.map((achat: { argentApres: number; stockApres: number }) => [achat.argentApres, achat.stockApres])).toEqual([[prix - 1, 2], [0, 3], [2 * prix, 3]]);
    }
  }
  expect(fixture.acces).toEqual(Array.from({ length: 22 }, (_, unlockedZone) => ({ unlockedZone, actif: unlockedZone >= 11 })));
});
