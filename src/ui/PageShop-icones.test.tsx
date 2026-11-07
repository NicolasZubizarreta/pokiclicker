// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import zones from '../../data/regions/kanto/zones.json';
import { PageShop } from './PageShop';
import { categoriesShop } from './categories-shop';
import { creerStoreJeu, storeJeu } from './store';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));
vi.mock('./store', async original => ({
  ...await original<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

// Objets du Shop qui s'affichent encore avec l'icône de repli : aucune image n'existe pour eux, ni dans public/img
// ni dans legacy/ (la V1 utilisait une icône de police). Le test échoue dans les deux sens : un nouvel objet sans
// image, ou un objet de cette liste qui reçoit enfin la sienne (il faut alors l'en retirer).
const REPLI_ATTENDU = ['runningShoes'];

function nouvellePartie() {
  contexte.store = creerStoreJeu({
    horloge: { maintenant: () => 0 },
    stockage: {
      lire: cle => localStorage.getItem(cle),
      ecrire: (cle, valeur) => localStorage.setItem(cle, valeur),
      supprimer: cle => localStorage.removeItem(cle),
      cles: () => Object.keys(localStorage),
    },
    alea: () => 0.5,
    genererId: () => 'test-shop-icones',
  });
  storeJeu.getState().demarrer();
}

beforeEach(() => { localStorage.clear(); nouvellePartie(); });
afterEach(() => {
  cleanup();
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  localStorage.clear();
});

it('chaque objet du Shop (toutes catégories, tout débloqué) a une vraie icône, sauf ceux en attente d’une image', () => {
  storeJeu.getState().fermer();
  storeJeu.getState().arreter();
  const cle = Object.keys(localStorage).find(cle => cle.startsWith('pokiclicker:region:') && cle.endsWith(':kanto'))!;
  const sauvegarde = JSON.parse(localStorage.getItem(cle)!);
  Object.assign(sauvegarde.donnees, { bossVaincus: zones.zones.map(zone => zone.id), argent: 1000000 });
  localStorage.setItem(cle, JSON.stringify(sauvegarde));
  nouvellePartie();

  const { container } = render(<PageShop />);
  const vus: string[] = [];
  const repli: string[] = [];
  for (const { nom } of categoriesShop) {
    fireEvent.click(screen.getByRole('button', { name: nom }));
    for (const carte of container.querySelectorAll('article[data-objet]')) {
      const id = carte.getAttribute('data-objet')!;
      vus.push(id);
      if (carte.querySelector('[data-icone-repli]')) repli.push(id);
      else expect(carte.querySelector('img, svg[role="img"]'), `${id} sans icône`).not.toBeNull();
    }
  }
  // Tout le catalogue du Shop est passé en revue, pas seulement la catégorie ouverte.
  expect(vus.sort()).toEqual(storeJeu.getState().boutique.objets.map(objet => objet.id).sort());
  expect(vus).toContain('falseSwipe');
  expect(repli.sort()).toEqual([...REPLI_ATTENDU].sort());
});
