// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PokemonPossede } from '../core/sauvegarde';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerHorlogeSimulee } from '../core/clock';
import { PageEquipe } from './PageEquipe';
import { PagePC } from './PagePC';
import { FichePokemon } from './FichePokemon';
import { creerStoreJeu, storeJeu } from './store';

vi.mock('./store', async original => {
  const module = await original<typeof import('./store')>();
  const { createStore } = await import('zustand/vanilla');
  return { ...module, storeJeu: createStore(() => module.storeJeu.getState()) };
});

const oeuf: PokemonPossede = { uid: 'oeuf', numero: 1, niveau: 1, xp: 0,
  surnom: 'Secret', sexe: 'male', shiny: false, favori: false, bonheur: 0,
  calcium: 0, pierreEternelle: false, oeuf: { pasRestants: 18, pasMax: 25 } };

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); },
  });
  storeJeu.setState({ equipe: [{ pokemon: oeuf, dps: 0, xpMax: 100, multiplicateur: 1 }],
    pc: [oeuf], accesPc: { ouvert: true, raison: null }, echange: null });
});
afterEach(cleanup);

it('masque le nom et le sprite jusqu’à l’éclosion, puis retrouve le surnom ou l’espèce', async () => {
  const { nomAffiche, spriteAffiche } = await import('./affichage-pokemon');
  expect(nomAffiche(oeuf)).toBe('Œuf');
  expect(spriteAffiche(oeuf)).toBe('img/objets/lucky-egg.png');
  expect(nomAffiche({ ...oeuf, oeuf: undefined })).toBe('Secret');
  expect(nomAffiche({ ...oeuf, oeuf: undefined, surnom: undefined })).toBe('Bulbizarre');
  expect(spriteAffiche({ ...oeuf, oeuf: undefined })).toBe('img/sprites/pokemon/1.png');
});

it.each(['équipe', 'PC', 'fiche'])('cache l’espèce dans %s et garde le ratio carré de l’œuf', page => {
  const { container } = render(page === 'équipe' ? <PageEquipe /> : page === 'PC' ? <PagePC retour={vi.fn()} />
    : <FichePokemon uid={oeuf.uid} ouvert fermer={vi.fn()} declencheur={{ current: null }} />);
  expect(container.innerHTML).not.toMatch(/Bulbizarre|sprites\/pokemon\/1\.png/);
  expect(screen.getAllByText('Œuf').length).toBeGreaterThan(0);
  expect(screen.getAllByText('Éclosion : 7/25').length).toBeGreaterThan(0);
  expect(container.textContent).not.toMatch(/Niv\.|Niveau 1|N° 1/);
  const images = [...container.querySelectorAll('img[src="img/objets/lucky-egg.png"]')];
  expect(images.length).toBeGreaterThan(0);
  for (const image of images) expect(Number(image.getAttribute('width')) / Number(image.getAttribute('height'))).toBe(1);
  if (page === 'PC') {
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'Bulbizarre' } });
    expect(screen.queryByRole('list')).toBeNull();
  }
});

it('nomme l’œuf dans le message de remplacement du store', () => {
  const stockage = creerStockageMemoire();
  const horloge = creerHorlogeSimulee();
  const gestionnaire = creerGestionnaire({ stockage, horloge, genererId: () => 'test' });
  gestionnaire.ecrireCompte(compteInitial());
  gestionnaire.creerPartie('Test', 'kanto.bourg-palette');
  const region = gestionnaire.chargerRegion('test', 'kanto')!.donnees;
  const parent = { ...oeuf };
  delete parent.oeuf;
  gestionnaire.ecrireRegion('test', 'kanto', { ...region, bossVaincus: ['kanto.argenta'],
    equipe: Array.from({ length: 6 }, (_, i) => ({ ...parent, uid: `membre-${i}` })), pc: [oeuf] });
  const store = creerStoreJeu({ stockage, horloge, alea: () => .1, genererId: () => 'test' });
  try {
    store.getState().demarrer();
    expect(store.getState().placerDansEquipe(oeuf.uid)).toBeNull();
    expect(store.getState().echange).toEqual({ uid: oeuf.uid, nom: 'Œuf' });
  } finally { store.getState().arreter(); }
});
