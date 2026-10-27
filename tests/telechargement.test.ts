import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it, vi } from 'vitest';
import { planifier, telecharger } from '../scripts/lib/telechargement.mjs';

const base = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/';
const ressources = {
  hote: 'raw.githubusercontent.com', base,
  fixes: [{ source: 'sprites/items/poke-ball.png', destination: 'objets/poke-ball.png' }],
  sprites: { source: 'sprites/pokemon/{id}.png', destination: 'sprites/{id}.png', taille: 96 },
  spritesShiny: { source: 'sprites/pokemon/shiny/{id}.png', destination: 'sprites-shiny/{id}.png', taille: 96 },
};
const octets = new Uint8Array([1, 2, 3]);
const reponse = () => Promise.resolve({ ok: true, status: 200, arrayBuffer: async () => octets.buffer });
const mesurer = async () => ({ largeur: 96, hauteur: 96 });
const element = (destination: string) => ({ url: `${base}${destination}`, destination });

describe('téléchargement des images sans réseau', () => {
  it('planifie les fixes puis les sprites manquants seulement', () => {
    const plan = planifier({ ressources, numeros: [1, 2, 3], existe: (destination) => destination === 'sprites/2.png' });
    expect(plan).toEqual([
      { url: `${base}sprites/items/poke-ball.png`, destination: 'objets/poke-ball.png' },
      { url: `${base}sprites/pokemon/1.png`, destination: 'sprites/1.png' },
      { url: `${base}sprites/pokemon/3.png`, destination: 'sprites/3.png' },
      { url: `${base}sprites/pokemon/shiny/1.png`, destination: 'sprites-shiny/1.png' },
      { url: `${base}sprites/pokemon/shiny/2.png`, destination: 'sprites-shiny/2.png' },
      { url: `${base}sprites/pokemon/shiny/3.png`, destination: 'sprites-shiny/3.png' },
    ]);
    expect(planifier({ ressources, numeros: [1], existe: () => true })).toEqual([]);
  });

  it('planifie les 151 sprites chromatiques et ignore ceux déjà présents', () => {
    const numeros = Array.from({ length: 151 }, (_, index) => index + 1);
    const plan = planifier({ ressources, numeros, existe: () => false });
    expect(plan.filter(({ destination }) => destination.startsWith('sprites-shiny/'))).toEqual(numeros.map((numero) => ({
      url: `${base}sprites/pokemon/shiny/${numero}.png`, destination: `sprites-shiny/${numero}.png`,
    })));
    expect(planifier({ ressources, numeros, existe: (destination) => destination.startsWith('sprites-shiny/') }))
      .toEqual(plan.filter(({ destination }) => !destination.startsWith('sprites-shiny/')));
  });

  it.each([
    { source: 'https://exemple.fr/{id}.png' },
    { source: 'http://raw.githubusercontent.com/{id}.png' },
    { destination: '../sprites-shiny/{id}.png' },
    { destination: 'sprites-shiny/../{id}.png' },
    { destination: 'sprites-shiny\\..\\{id}.png' },
    { destination: '/sprites-shiny/{id}.png' },
    { destination: 'C:\\sprites-shiny\\{id}.png' },
  ])('refuse une ressource chromatique interdite : %o', (modification) => {
    expect(() => planifier({
      ressources: { ...ressources, spritesShiny: { ...ressources.spritesShiny, ...modification } },
      numeros: [1], existe: () => true,
    })).toThrow(/interdit/);
  });

  it.each(['sprites-shiny/1.png', 'sprites-shiny\\1.png'])('contrôle les dimensions chromatiques : %s', async (destination) => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    await expect(telecharger({
      plan: [element(destination)], fetch: vi.fn(reponse), ecrire,
      mesurer: async () => ({ largeur: 96, hauteur: 100 }), tailleSprite: 96,
    })).rejects.toThrow('Dimensions refusées');
    expect(ecrire).not.toHaveBeenCalled();
    await telecharger({ plan: [element(destination)], fetch: vi.fn(reponse), ecrire, mesurer, tailleSprite: 96 });
    expect(ecrire).toHaveBeenCalledWith(destination, octets);
  });

  it('ne fait jamais appel à fetch pendant la planification', () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    try {
      planifier({ ressources, numeros: [1], existe: () => false });
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it.each(['https://exemple.fr/image.png', 'http://raw.githubusercontent.com/image.png'])(
    'refuse un hôte ou protocole interdit : %s', (source) => {
      expect(() => planifier({
        ressources: { ...ressources, fixes: [{ source, destination: 'objets/image.png' }] },
        numeros: [], existe: () => true,
      })).toThrow('Hôte ou protocole interdit');
    },
  );

  it.each(['../image.png', 'objets/../image.png', 'objets\\..\\image.png', '/image.png', 'C:\\image.png'])(
    'refuse une destination sortant du dossier : %s', (destination) => {
      expect(() => planifier({
        ressources: { ...ressources, fixes: [{ source: 'image.png', destination }] },
        numeros: [], existe: () => false,
      })).toThrow('Destination interdite');
    },
  );

  it('signale toutes les réponses 404 avec leurs URL et poursuit les écritures valides', async () => {
    const plan = [element('objets/a.png'), element('objets/b.png'), element('objets/c.png')];
    const fetch = vi.fn().mockResolvedValueOnce({ ok: false, status: 404 })
      .mockResolvedValueOnce({ ok: false, status: 404 }).mockImplementationOnce(reponse);
    const ecrire = vi.fn().mockResolvedValue(undefined);
    const resultat = telecharger({ plan, fetch, ecrire, mesurer, tailleSprite: 96 });
    await expect(resultat).rejects.toThrow(`${base}objets/a.png) : Réponse HTTP 404`);
    await expect(resultat).rejects.toThrow(`${base}objets/b.png) : Réponse HTTP 404`);
    expect(ecrire).toHaveBeenCalledExactlyOnceWith('objets/c.png', octets);
  });

  it('refuse le sprite de 100 × 100 et écrit les autres fichiers valides', async () => {
    const ecrire = vi.fn().mockResolvedValue(undefined);
    const mesurerImage = vi.fn().mockResolvedValueOnce({ largeur: 100, hauteur: 100 })
      .mockResolvedValueOnce({ largeur: 96, hauteur: 96 })
      .mockResolvedValueOnce({ largeur: 100, hauteur: 100 });
    await expect(telecharger({
      plan: [element('sprites/1.png'), element('sprites/2.png'), element('artworks/1.png')],
      fetch: vi.fn(reponse), ecrire, mesurer: mesurerImage, tailleSprite: 96,
    })).rejects.toThrow('Dimensions refusées pour sprites/1.png');
    expect(ecrire.mock.calls).toEqual([['sprites/2.png', octets], ['artworks/1.png', octets]]);
  });

  it('attend la fin de chaque écriture avant de télécharger le fichier suivant', async () => {
    const ordre: string[] = [];
    await telecharger({
      plan: [element('objets/a.png'), element('objets/b.png')],
      fetch: async (url) => { ordre.push(url); return reponse(); },
      ecrire: async (destination) => { await Promise.resolve(); ordre.push(destination); },
      mesurer, tailleSprite: 96,
    });
    expect(ordre).toEqual([`${base}objets/a.png`, 'objets/a.png', `${base}objets/b.png`, 'objets/b.png']);
  });

  it('conserve une destination déjà présente grâce à la création seule', async () => {
    const dossier = await mkdtemp(join(tmpdir(), 'telechargement-'));
    const chemin = join(dossier, 'image.png');
    try {
      await writeFile(chemin, 'original');
      await expect(telecharger({
        plan: [element('objets/image.png')], fetch: vi.fn(reponse), mesurer, tailleSprite: 96,
        ecrire: async (_destination, contenu) => writeFile(chemin, contenu, { flag: 'wx' }),
      })).rejects.toThrow('EEXIST');
      expect(await readFile(chemin, 'utf8')).toBe('original');
    } finally {
      await rm(dossier, { recursive: true, force: true });
    }
  });

  it('affiche le plan complet en essai sans réseau ni création de fichiers', async () => {
    const racine = fileURLToPath(new URL('../', import.meta.url));
    const dossier = await mkdtemp(join(tmpdir(), 'telechargement-essai-'));
    const garde = join(dossier, 'garde.cjs');
    try {
      await writeFile(garde, "const fs = require('node:fs'); globalThis.fetch = () => { fs.writeFileSync(require('node:path').join(__dirname, 'reseau-interdit'), ''); throw new Error('Réseau interdit'); }; fs.promises.writeFile = fs.promises.mkdir = async () => { throw new Error('Écriture interdite en essai'); };\n");
      const { stdout, stderr } = await promisify(execFile)(process.execPath, [join(racine, 'scripts/telecharger-sprites.mjs'), '--essai'], {
        cwd: dossier, env: { ...process.env, NODE_OPTIONS: `--require="${garde.replaceAll('\\', '/')}"` },
      });
      const catalogue: typeof ressources = JSON.parse(await readFile(join(racine, 'data/ressources-externes.json'), 'utf8'));
      const pokemon: { pokemon: { numero: number }[] } = JSON.parse(await readFile(join(racine, 'data/pokemon.json'), 'utf8'));
      const plan = planifier({
        ressources: catalogue, numeros: pokemon.pokemon.map(({ numero }) => numero),
        existe: (destination) => existsSync(join(racine, 'assets-src', destination))
          || (destination.startsWith('sprites/') && existsSync(join(racine, 'public/img/sprites/pokemon', destination.slice(8))))
          || (destination.startsWith('sprites-shiny/') && existsSync(join(racine, 'public/img/sprites/pokemon-shiny', destination.slice('sprites-shiny/'.length)))),
      });
      expect(stdout.split(/\r?\n/)[0]).toBe('Hôte unique contacté : raw.githubusercontent.com');
      for (const genre of ['objets', 'artworks', 'animes', 'sprites', 'sprites-shiny']) {
        expect(stdout).toContain(`${genre} : ${plan.filter(({ destination }) => destination.startsWith(`${genre}/`)).length}`);
      }
      expect(catalogue.fixes).toHaveLength(32);
      expect(stdout).toContain(`${plan.length} fichiers à télécharger`);
      expect(stdout).toContain(`${catalogue.fixes.length + pokemon.pokemon.length * 2 - plan.length} déjà présents ignorés`);
      for (const { url, destination } of plan) expect(stdout).toContain(`${url} → assets-src/${destination}`);
      expect(stderr).toBe('');
      expect(await readdir(dossier)).toEqual(['garde.cjs']);
    } finally {
      await rm(dossier, { recursive: true, force: true });
    }
  });
});
