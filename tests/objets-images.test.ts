import { access, readFile } from 'node:fs/promises';
import { expect, it } from 'vitest';
import objets from '../data/objets.json';

const racine = new URL('../', import.meta.url);

// Objets vendus (Shop ou Casino) pour lesquels aucune image n'existe encore, ni dans public/img ni dans legacy/ :
// la V1 les montrait avec une icône de police (« sprint », « content_cut », etc.) et la V2 affiche l'icône de repli.
// À fournir par Nicolas ; ne rien inventer. Dès qu'une image est branchée, l'objet doit sortir de cette liste.
const SANS_IMAGE_A_FOURNIR = ['runningShoes', 'falseSwipe', 'ctJackpot'];

const vendus = objets.filter(objet => objet.boutique !== null);

it('chaque objet vendu a une image enregistrée dans tailles.json, sauf ceux en attente d’une image', async () => {
  const tailles = JSON.parse(await readFile(new URL('public/img/tailles.json', racine), 'utf8'));
  const sans: string[] = [];
  for (const objet of vendus) {
    if (objet.image === null) { sans.push(objet.id); continue; }
    await access(new URL(`public/${objet.image}`, racine));
    expect(tailles[objet.image], `${objet.id} : ${objet.image} absente de tailles.json`).toBeDefined();
  }
  expect(sans.sort()).toEqual([...SANS_IMAGE_A_FOURNIR].sort());
});

it('le Poké-Radar vendu au Shop utilise l’icône du Poké-Radar du combat', () => {
  expect(objets.find(objet => objet.id === 'pokeradar')!.image).toBe('img/objets/PokeRadar.png');
});
