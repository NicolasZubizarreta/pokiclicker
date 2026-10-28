import { existsSync } from 'node:fs';
import { expect, it } from 'vitest';
import { musiques, pisteDeScene, sceneMusicale } from './musiques';

const base = { pantheon: false, intro: false, horsCombat: false, boss: false, adversaire: false };

it('choisit la scène d\'après ce qui est à l\'écran', () => {
  expect(sceneMusicale(base)).toBe('combat');
  expect(sceneMusicale({ ...base, boss: true })).toBe('boss');
  expect(sceneMusicale({ ...base, boss: true, adversaire: true })).toBe('adversaire');
  expect(sceneMusicale({ ...base, horsCombat: true, boss: true })).toBe('hors-combat');
  expect(sceneMusicale({ ...base, intro: true, horsCombat: true })).toBe('intro');
  expect(sceneMusicale({ ...base, pantheon: true, intro: true })).toBe('pantheon');
});

it('associe chaque scène à une piste connue, ou au silence', () => {
  expect(pisteDeScene('intro')).toBe('carte');
  expect(pisteDeScene('pantheon')).toBe('victoire');
  expect(musiques.pistes.victoire!.boucle).toBe(false);
});

it('ne référence que des fichiers présents, tous sous licence CC0', () => {
  for (const piste of Object.values(musiques.pistes)) {
    expect(existsSync(new URL(`../../public/${piste.fichier}`, import.meta.url)), piste.fichier).toBe(true);
    expect(piste.licence).toBe('CC0');
  }
});
