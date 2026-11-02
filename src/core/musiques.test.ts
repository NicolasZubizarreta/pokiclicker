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
  expect(sceneMusicale({ ...base, credits: true, intro: true, horsCombat: true })).toBe('credits');
  expect(sceneMusicale({ ...base, credits: true, pantheon: true })).toBe('pantheon');
});

it('associe chaque scène à une piste connue, ou au silence', () => {
  expect(pisteDeScene('intro')).toBe('carte');
  expect(pisteDeScene('pantheon')).toBe('victoire');
  expect(pisteDeScene('credits')).toBe('credits');
  expect(musiques.pistes.credits!.boucle).toBe(false);
  expect(musiques.pistes.victoire!.boucle).toBe(false);
});

it('ne référence que des fichiers présents, sous licence CC0 sauf le générique des crédits', () => {
  for (const [id, piste] of Object.entries(musiques.pistes)) {
    expect(existsSync(new URL(`../../public/${piste.fichier}`, import.meta.url)), piste.fichier).toBe(true);
    // Le générique est un fichier de Nicolas, pas libre de droits : usage privé uniquement.
    if (id !== 'credits') expect(piste.licence).toBe('CC0');
  }
});
