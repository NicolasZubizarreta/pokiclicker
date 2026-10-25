// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { chargerPokemon } from '../core/pokemon';
import { trierPc, type TriPc } from '../core/pc';
import type { PokemonPossede } from '../core/sauvegarde';
import { PagePC } from './PagePC';
import { storeJeu } from './store';
import { dpsSansType } from './dps-pc';
import { formaterDps } from './nombres';

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

const caseDe = (pokemon: PokemonPossede) => ({ pokemon, dps: 42, xpMax: 100, multiplicateur: 1 });
const annulerEchange = vi.fn(() => storeJeu.setState({ echange: null }));
const placerDansEquipe = vi.fn((uid: string): string | null => {
  const { pc, equipe } = storeJeu.getState();
  const pokemon = pc.find(p => p.uid === uid)!;
  const libre = equipe.indexOf(null);
  if (libre < 0) storeJeu.setState({ echange: { uid, nom: nomDe(pokemon) } });
  else storeJeu.setState({ pc: pc.filter(p => p.uid !== uid), equipe: equipe.map((c, i) => i === libre ? caseDe(pokemon) : c) });
  return null;
});
const echanger = vi.fn((uid: string, cible: string): string | null => {
  const { pc, equipe } = storeJeu.getState();
  const entrant = pc.find(p => p.uid === uid)!;
  const sortant = equipe.find(c => c?.pokemon.uid === cible)!.pokemon;
  storeJeu.setState({ pc: pc.map(p => p.uid === uid ? sortant : p),
    equipe: equipe.map(c => c?.pokemon.uid === cible ? caseDe(entrant) : c), echange: null });
  return null;
});
const basculerFavori = vi.fn((uid: string): string | null => {
  storeJeu.setState({ pc: storeJeu.getState().pc.map(p => p.uid === uid ? { ...p, favori: !p.favori } : p) });
  return null;
});

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) {
      this.removeAttribute('open'); this.dispatchEvent(new Event('close'));
    } },
  });
  vi.clearAllMocks();
  storeJeu.setState({ equipe: [caseDe({ ...base, uid: 'e1' }), caseDe({ ...base, uid: 'e2' }), null, null, null, null],
    echange: null, annulerEchange, placerDansEquipe, echanger, basculerFavori });
});
afterEach(() => vi.restoreAllMocks());

it('présente le détail choisi, ses DPS sans type et six emplacements par affichage', () => {
  render(<PagePC retour={vi.fn()} />);
  const panneau = screen.getByRole('complementary');
  expect(within(panneau).getByRole('heading', { name: 'Zéphyr' })).toBeTruthy();
  expect(within(panneau).getByText(`${formaterDps(dpsSansType(pc[3]!))} DPS`)).toBeTruthy();
  expect(within(panneau).getByRole('progressbar', { name: 'XP de Zéphyr' })).toBeTruthy();
  expect(within(panneau).getAllByText('Emplacement libre')).toHaveLength(4);
  expect(within(panneau).queryByRole('button', { name: 'Pikachu, niveau 8' })).toBeNull();
  expect(screen.getByRole('group', { name: 'Équipe mobile' }).children).toHaveLength(6);
});

it('place le Pokémon dans une équipe incomplète et sélectionne le suivant', () => {
  render(<PagePC retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  expect(placerDansEquipe).toHaveBeenCalledWith('autre');
  expect(storeJeu.getState().equipe.some(c => c?.pokemon.uid === 'autre')).toBe(true);
  expect(storeJeu.getState().pc.some(p => p.uid === 'autre')).toBe(false);
  expect(within(screen.getByRole('list')).getByRole('button', { pressed: true }).getAttribute('aria-label')).toBe('Bulbizarre, niveau 12');
});

it.each(['colonne', 'mobile'])('échange avec une équipe pleine depuis la %s, puis annule', affichage => {
  storeJeu.setState({ equipe: Array.from({ length: 6 }, (_, i) => caseDe({ ...base, uid: `e${i}`, surnom: `Partenaire ${i}` })) });
  render(<PagePC retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  expect(screen.getByRole('status').textContent).toContain('Choisis le Pokémon à remplacer par Zéphyr');
  const zone = affichage === 'mobile' ? screen.getByRole('group', { name: 'Équipe mobile' }) : screen.getByRole('complementary');
  fireEvent.click(within(zone).getByRole('button', { name: 'Partenaire 0, niveau 8' }));
  expect(echanger).toHaveBeenCalledWith('autre', 'e0');
  expect(storeJeu.getState().equipe[0]?.pokemon.uid).toBe('autre');
  expect(storeJeu.getState().pc.some(p => p.uid === 'e0')).toBe(true);
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(annulerEchange).toHaveBeenCalledOnce();
  expect(screen.queryByRole('status')).toBeNull();
});

it('affiche les erreurs de placement, de favori et d’échange', () => {
  placerDansEquipe.mockReturnValueOnce('Placement impossible. Réessaie.');
  basculerFavori.mockReturnValueOnce('Favori impossible. Réessaie.');
  echanger.mockReturnValueOnce('Échange impossible. Réessaie.');
  render(<PagePC retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  expect(screen.getByRole('alert').textContent).toBe('Placement impossible. Réessaie.');
  fireEvent.click(screen.getByRole('button', { name: 'Ajoute aux favoris' }));
  expect(screen.getByRole('alert').textContent).toBe('Favori impossible. Réessaie.');
  cleanup();
  storeJeu.setState({ echange: { uid: 'autre', nom: 'Zéphyr' } });
  render(<PagePC retour={vi.fn()} />);
  fireEvent.click(within(screen.getByRole('complementary')).getAllByRole('button', { name: 'Pikachu, niveau 8' })[0]!);
  expect(screen.getByRole('alert').textContent).toBe('Échange impossible. Réessaie.');
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(screen.queryByRole('alert')).toBeNull();
});

it('bascule le favori depuis le détail', () => {
  render(<PagePC retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Ajoute aux favoris' }));
  expect(basculerFavori).toHaveBeenCalledWith('autre');
  expect(storeJeu.getState().pc.find(p => p.uid === 'autre')?.favori).toBe(true);
  expect(screen.getByRole('button', { name: 'Retire des favoris', pressed: true })).toBeTruthy();
});

it.each(['détail', 'carte mobile'])('ouvre une seule fiche depuis le %s et restaure le focus', origine => {
  if (origine === 'carte mobile') vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({ length: 0 } as DOMRectList);
  render(<PagePC retour={vi.fn()} />);
  const bouton = screen.getByRole('button', { name: origine === 'détail' ? 'Ouvre la fiche' : 'Zéphyr, niveau 30' });
  fireEvent.click(bouton);
  expect(screen.getByRole('dialog', { name: 'Zéphyr' })).toBeTruthy();
  expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(bouton);
});

it('annule au démontage et désactive le placement sans sélection', () => {
  storeJeu.setState({ pc: [] });
  const { unmount } = render(<PagePC retour={vi.fn()} />);
  expect(screen.getByRole('heading', { name: 'Aucune sélection' })).toBeTruthy();
  expect((screen.getByRole('button', { name: "Placer dans l'équipe" }) as HTMLButtonElement).disabled).toBe(true);
  unmount();
  expect(annulerEchange).toHaveBeenCalledOnce();
});
