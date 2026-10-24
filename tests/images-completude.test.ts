import { access, readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';

const racine = fileURLToPath(new URL('../', import.meta.url));
const lire = (chemin: string) => readFile(join(racine, chemin), 'utf8');
const tailles: Record<string, { largeur: number; hauteur: number }> = JSON.parse(await lire('public/img/tailles.json'));
const images = JSON.parse(await lire('data/images.json')) as {
  sprite: { taille: number }; objet: { taille: number }; decor: { largeur: number; hauteur: number };
};
const { pokemon } = JSON.parse(await lire('data/pokemon.json')) as { pokemon: { numero: number }[] };
type Zone = {
  id: string; decor: string; sansCombat?: boolean;
  sauvages?: { pokemon: number }[]; adversaires?: { pokemon: number }[]; boss?: { pokemon: number };
};
const { zones, lieux } = JSON.parse(await lire('data/regions/kanto/zones.json')) as {
  zones: Zone[]; lieux: { lieu: string; decor: string }[];
};
const existe = async (chemin: string) => {
  await expect(access(join(racine, 'public', chemin)), `Fichier absent : public/${chemin}`).resolves.toBeUndefined();
};

it('contient exactement les 151 sprites du Pokédex aux dimensions configurées', async () => {
  const attendus = pokemon.map(({ numero }) => `img/sprites/pokemon/${numero}.png`);
  expect(attendus).toHaveLength(151);
  expect(Object.keys(tailles).filter((cle) => cle.startsWith('img/sprites/pokemon/')).sort()).toEqual([...attendus].sort());
  for (const chemin of attendus) {
    expect(tailles[chemin], chemin).toEqual({ largeur: images.sprite.taille, hauteur: images.sprite.taille });
    await existe(chemin);
  }
});

it('contient les sprites de tous les Pokémon cités dans les zones', () => {
  for (const zone of zones) {
    const rencontres = [...(zone.sauvages ?? []), ...(zone.adversaires ?? []), ...(zone.boss ? [zone.boss] : [])];
    for (const { pokemon: numero } of rencontres) {
      expect(tailles[`img/sprites/pokemon/${numero}.png`], `${zone.id} : Pokémon ${numero}`).toBeDefined();
    }
  }
});

it('contient les décors de combat et documente chaque autre décor absent', async () => {
  const documentation = await lire('docs/projet/decors-provisoires.md');
  const slugsDocumentes = documentation.split('\n')
    .filter((ligne) => ligne.startsWith('|'))
    .flatMap((ligne) => (ligne.split('|')[1] ?? '').split(',').map((slug) => slug.trim()));
  for (const entree of [...zones, ...lieux]) {
    const nom = entree.decor.split('/').at(-1)!;
    const chemin = `img/decors/${nom}`;
    const combat = 'id' in entree && !entree.sansCombat;
    if (combat || tailles[chemin]) {
      expect(tailles[chemin], chemin).toEqual({ largeur: images.decor.largeur, hauteur: images.decor.hauteur });
      await existe(chemin);
    } else {
      expect(slugsDocumentes, `Décor absent non documenté : ${chemin}`).toContain(nom.replace(/\.webp$/, ''));
    }
  }
});

it('contient 24 objets, six artworks carrés et l’animation de Roucarnage', async () => {
  const objets = Object.keys(tailles).filter((cle) => cle.startsWith('img/objets/'));
  const artworks = Object.keys(tailles).filter((cle) => cle.startsWith('img/artworks/'));
  const animations = Object.keys(tailles).filter((cle) => cle.startsWith('img/animes/'));
  expect(objets).toHaveLength(24);
  expect(artworks.sort()).toEqual([1, 4, 7].flatMap((numero) => [
    `img/artworks/${numero}.png`, `img/artworks/${numero}-shiny.png`,
  ]).sort());
  expect(animations).toEqual(['img/animes/roucarnage-vol.gif']);
  for (const chemin of objets) {
    expect(tailles[chemin], chemin).toEqual({ largeur: images.objet.taille, hauteur: images.objet.taille });
  }
  for (const chemin of artworks) {
    expect(tailles[chemin]?.largeur, chemin).toBeGreaterThan(0);
    expect(tailles[chemin]?.largeur, chemin).toBe(tailles[chemin]?.hauteur);
  }
  for (const chemin of [...objets, ...artworks, ...animations]) await existe(chemin);
});

it('ne contient aucune URL externe dans le code et les données du jeu', async () => {
  async function parcourir(dossier: string): Promise<string[]> {
    const fichiers: string[] = [];
    for (const entree of await readdir(join(racine, dossier), { withFileTypes: true })) {
      const chemin = `${dossier}/${entree.name}`;
      if (chemin === 'data/schemas' || chemin === 'data/ressources-externes.json') continue;
      if (entree.isDirectory()) fichiers.push(...await parcourir(chemin));
      else if (dossier.startsWith('src') ? /\.(ts|tsx|css|html)$/.test(entree.name) : entree.name.endsWith('.json')) fichiers.push(chemin);
    }
    return fichiers;
  }
  const fichiers = ['index.html', ...await parcourir('src'), ...await parcourir('data')];
  for (const fichier of fichiers) {
    const urls = (await lire(fichier)).match(/https?:\/\/[^\s<>"'`\\]+/g) ?? [];
    expect(urls.filter((url) => new URL(url).hostname !== 'www.w3.org'), `URL externe dans ${fichier}`).toEqual([]);
  }
});
