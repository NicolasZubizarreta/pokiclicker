// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { chargerPokemon } from '../core/pokemon';
import { trierPc, type TriPc } from '../core/pc';
import type { PokemonPossede } from '../core/sauvegarde';
import { PagePC } from './PagePC';
import { storeJeu } from './store';

vi.mock('./store', async original => {
  const module = await original<typeof import('./store')>();
  const { createStore } = await import('zustand/vanilla');
  return { ...module, storeJeu: createStore(() => module.storeJeu.getState()) };
});

const base: PokemonPossede = { uid: 'pikachu', numero: 25, niveau: 8, xp: 0,
  sexe: 'male', shiny: false, favori: false, bonheur: 128, calcium: 0, pierreEternelle: false };
const pc: PokemonPossede[] = [
  { ...base, uid: 'electrode', numero: 101, niveau: 20, surnom: 'Boule', sexe: 'femelle', shiny: true },
  base,
  { ...base, uid: 'bulbizarre', numero: 1, niveau: 12, favori: true },
  { ...base, uid: 'autre', numero: 1, niveau: 30, surnom: 'Zéphyr' },
];
const catalogue = chargerPokemon();
const nomDe = (pokemon: PokemonPossede) => pokemon.surnom ?? catalogue.parNumero(pokemon.numero).nom;
const cartes = () => within(screen.getByRole('list')).getAllByRole('button');

beforeEach(() => storeJeu.setState({ pc: [...pc], accesPc: { ouvert: true, raison: '' } }));
afterEach(cleanup);

it('présente le titre focalisable, le compteur et des cartes en français', () => {
  render(<PagePC retour={vi.fn()} />);
  expect(screen.getByRole('heading', { level: 1, name: 'PC de Léo' }).tabIndex).toBe(-1);
  expect(screen.getByText('4 Pokémon')).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Trie les Pokémon' }).textContent).toBe('Trie par :NuméroNomNiveauFavoriShiny');
  expect(screen.getByLabelText('Nom ou numéro').getAttribute('type')).toBe('search');
  expect(cartes().map(c => c.getAttribute('aria-label'))).toEqual([
    'Zéphyr, niveau 30', 'Bulbizarre, niveau 12', 'Pikachu, niveau 8', 'Boule, niveau 20',
  ]);
  expect(screen.getByText('N° 101 · Niveau 20')).toBeTruthy();
  expect(screen.getByRole('img', { name: 'Femelle' })).toBeTruthy();
  expect(screen.getAllByRole('img', { name: 'Mâle' })).toHaveLength(3);
  const boule = screen.getByRole('button', { name: 'Boule, niveau 20' });
  const bulbizarre = screen.getByRole('button', { name: 'Bulbizarre, niveau 12' });
  expect(within(boule).getByText('Shiny').className).toBe('sr-only');
  expect(bulbizarre.querySelector('svg.text-lien')).toBeTruthy();
  expect(boule.querySelector('svg.text-alerte-base')).toBeTruthy();
  expect(boule.querySelector('img')?.classList.contains('size-24')).toBe(true);
  expect(screen.queryByText(/Search|Sort|Level|Back|Empty|Favorite/)).toBeNull();
});

it.each([0, 1, 2])('compte %i Pokémon', nombre => {
  storeJeu.setState({ pc: pc.slice(0, nombre) });
  render(<PagePC retour={vi.fn()} />);
  expect(screen.getByText(`${nombre} Pokémon`)).toBeTruthy();
});

it('ne présente que le retour, le titre et la raison quand le PC est verrouillé', () => {
  const raison = "Le PC de Léo s'ouvre à l'Arène d'Argenta.";
  storeJeu.setState({ accesPc: { ouvert: false, raison } });
  const { container } = render(<PagePC retour={vi.fn()} />);
  expect(screen.getByRole('heading').textContent).toBe('PC de Léo');
  expect(screen.getByText(raison).tagName).toBe('P');
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(container.textContent).toBe(`RetourPC de Léo${raison}`);
  expect(screen.queryByRole('list')).toBeNull();
  expect(screen.queryByRole('searchbox')).toBeNull();
});

it.each<[TriPc, string]>([
  ['numero', 'Numéro'], ['nom', 'Nom'], ['niveau', 'Niveau'], ['favori', 'Favori'], ['shiny', 'Shiny'],
])('applique le tri %s sans modifier le store', (tri, texte) => {
  const reference = storeJeu.getState().pc;
  render(<PagePC retour={vi.fn()} />);
  const groupe = screen.getByRole('group', { name: 'Trie les Pokémon' });
  const bouton = within(groupe).getByRole('button', { name: texte });
  if (tri === 'numero') expect(bouton.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(bouton);
  expect(cartes().map(c => c.getAttribute('aria-label'))).toEqual(
    trierPc(pc, tri, nomDe).map(p => `${nomDe(p)}, niveau ${p.niveau}`),
  );
  expect(within(groupe).getAllByRole('button', { pressed: true })).toEqual([bouton]);
  expect(storeJeu.getState().pc).toBe(reference);
  expect(reference).toEqual(pc);
});

it('cherche par espèce malgré un surnom, par numéro exact, puis efface la recherche', () => {
  render(<PagePC retour={vi.fn()} />);
  const recherche = screen.getByRole('searchbox');
  fireEvent.change(recherche, { target: { value: 'élec' } });
  expect(cartes().map(c => c.getAttribute('aria-label'))).toEqual(['Boule, niveau 20']);
  fireEvent.change(recherche, { target: { value: '25' } });
  expect(cartes().map(c => c.getAttribute('aria-label'))).toEqual(['Pikachu, niveau 8']);
  fireEvent.change(recherche, { target: { value: '' } });
  expect(cartes()).toHaveLength(4);
});

it('annonce une recherche sans résultat', () => {
  render(<PagePC retour={vi.fn()} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'introuvable' } });
  expect(screen.getByRole('status').textContent).toBe('Aucun Pokémon ne correspond à « introuvable ».');
  expect(screen.queryByRole('list')).toBeNull();
});

it('explique comment remplir un PC vide', () => {
  storeJeu.setState({ pc: [] });
  render(<PagePC retour={vi.fn()} />);
  expect(screen.getByText('Ton PC est vide. Capture des Pokémon pour les ranger ici.')).toBeTruthy();
  expect(screen.queryByRole('list')).toBeNull();
});

it('sélectionne une carte par défaut puis au clic, et conserve le choix après un tri', () => {
  render(<PagePC retour={vi.fn()} />);
  const premier = screen.getByRole('button', { name: 'Zéphyr, niveau 30' });
  expect(premier.getAttribute('aria-pressed')).toBe('true');
  const cible = screen.getByRole('button', { name: 'Pikachu, niveau 8' });
  fireEvent.click(cible);
  expect(cible.getAttribute('aria-pressed')).toBe('true');
  expect(cible.classList.contains('bg-selection')).toBe(true);
  expect(premier.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Niveau' }));
  expect(within(screen.getByRole('list')).getAllByRole('button', { pressed: true })).toEqual([cible]);
});

it('appelle retour', () => {
  const retour = vi.fn();
  render(<PagePC retour={retour} />);
  fireEvent.click(screen.getByRole('button', { name: 'Retour' }));
  expect(retour).toHaveBeenCalledOnce();
});
