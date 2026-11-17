// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { chargerPokemon } from '../core/pokemon';
import { trierPc, type TriPc } from '../core/pc';
import type { PokemonPossede } from '../core/sauvegarde';
import { PagePC } from './PagePC';
import { Notifications } from './Notifications';
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
const enTelephone = () => vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({ matches: requete.includes('max-width'), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
const cartes = () => within(screen.getByRole('list')).getAllByRole('button');

beforeEach(() => storeJeu.setState({ pc: [...pc], accesPc: { ouvert: true, raison: '' } }));
it.each([false, true])('repère sur les cartes marquées du PC : %s', marqueEclosion => {
  storeJeu.setState({ pc: [{ ...base, marqueEclosion }] });
  render(<PagePC />);
  expect(!!within(screen.getByRole('list')).queryByRole('img', { name: "Marque d'éclosion" })).toBe(marqueEclosion);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
it.each([[false, false], [true, false], [false, true], [true, true]])('pose le tag shiny à côté du tag œuf sur la carte du PC (shiny %s, marque %s)', (shiny, marqueEclosion) => {
  storeJeu.setState({ pc: [{ ...base, shiny, marqueEclosion }] });
  render(<PagePC />);
  const liste = within(screen.getByRole('list'));
  expect(!!liste.queryByRole('img', { name: 'Chromatique' })).toBe(shiny);
  expect(!!liste.queryByRole('img', { name: "Marque d'éclosion" })).toBe(marqueEclosion);
  if (shiny || marqueEclosion) {
    const tags = liste.getAllByRole('img', { name: /Chromatique|Marque d'éclosion/ }).map(tag => tag.parentElement!);
    expect(new Set(tags).size).toBe(1);
    expect(tags[0]!.classList.contains('repere-marque-sur-portrait')).toBe(true);
  }
});

it('structure le PC en trois colonnes et garde six places dans son cadre', () => {
  const { container } = render(<PagePC />);
  expect(container.querySelectorAll('.pc-pc')).toHaveLength(1);
  expect(screen.getByRole('list').classList.contains('pc-grille')).toBe(true);
  expect(container.querySelector('kbd')?.textContent).toBe('/');
  expect(screen.getByLabelText('Trie par').tagName).toBe('SELECT');
  expect(screen.getByRole('heading', { name: 'Ton équipe · 2 / 6' })).toBeTruthy();
  expect(container.querySelector('.pc-places')?.children).toHaveLength(6);
});

it('trie par DPS et conserve les DPS après un autre tri sur PC', () => {
  render(<PagePC />);
  expect(cartes().map(c => c.getAttribute('aria-label'))).toEqual(trierPc(pc, 'dps', nomDe).map(p => `${nomDe(p)}, niveau ${p.niveau}`));
  expect(within(cartes()[0]!).getByText(/ DPS$/)).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Trie par'), { target: { value: 'numero' } });
  expect(within(cartes()[0]!).getByText(/ DPS$/)).toBeTruthy();
});

it.each([['Favoris', 'favori'], ['Shiny', 'shiny'], ['Œufs', 'oeuf']])('filtre %s et efface les filtres et la recherche', (_texte, filtre) => {
  storeJeu.setState({ pc: pc.slice(0, 3) });
  render(<PagePC />);
  fireEvent.change(screen.getByLabelText('Filtre'), { target: { value: filtre } });
  expect((screen.getByLabelText('Filtre') as HTMLSelectElement).value).toBe(filtre);
  if (filtre === 'oeuf') expect(screen.getByText('Aucun Pokémon ne correspond à ces filtres.')).toBeTruthy();
  else expect(screen.getByText('1 sur 3 Pokémon')).toBeTruthy();
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'absent' } });
  fireEvent.click(screen.getByRole('button', { name: 'Effacer la recherche et les filtres' }));
  expect(cartes()).toHaveLength(3);
  expect((screen.getByRole('searchbox') as HTMLInputElement).value).toBe('');
});

it('propose un filtre en liste déroulante, dont les évolutions à découvrir', () => {
  storeJeu.setState({ pokedex: [1, 25, 101] });
  render(<PagePC />);
  const filtre = screen.getByLabelText('Filtre');
  expect(filtre.tagName).toBe('SELECT');
  expect(within(filtre).getAllByRole('option').map(o => o.textContent)).toEqual(['Tous', 'Favoris', 'Shiny', 'Œufs', 'Évolution à découvrir']);
  expect(within(screen.getByLabelText('Trie par')).getAllByRole('option').map(o => o.textContent))
    .toEqual(['DPS', 'Numéro du Pokédex', 'Nom, de A à Z', 'Niveau', "Favoris d'abord", "Shiny d'abord"]);
  expect(screen.queryByRole('button', { name: 'Favoris' })).toBeNull();
  fireEvent.change(filtre, { target: { value: 'evolution' } });
  // Bulbizarre (→ Herbizarre) et Pikachu (→ Raichu) n'ont pas leur évolution au Pokédex ; Électrode n'évolue pas.
  expect(cartes().map(c => c.getAttribute('aria-label')).sort()).toEqual(['Bulbizarre, niveau 12', 'Pikachu, niveau 8', 'Zéphyr, niveau 30']);
  act(() => storeJeu.setState({ pokedex: [1, 2, 25, 26, 101] }));
  expect(screen.getByText('Aucun Pokémon ne correspond à ces filtres.')).toBeTruthy();
});

it('donne un libellé accessible au retour', () => {
  enTelephone();
  render(<PagePC retour={vi.fn()} libelleRetour="Retour au voyage" />);
  expect(screen.getByRole('button', { name: 'Retour au voyage' }).textContent).toBe('Retour');
});

it('range les œufs en dernier et les retrouve par filtre sans DPS', () => {
  storeJeu.setState({ pc: [{ ...base, uid: 'oeuf', oeuf: { pasRestants: 10, pasMax: 10 } }, ...pc] });
  render(<PagePC />);
  expect(cartes()[0]!.getAttribute('aria-label')).toBe('Boule, niveau 20');
  expect(within(cartes().at(-1)!).queryByText(/ DPS$/)).toBeNull();
  fireEvent.change(screen.getByLabelText('Filtre'), { target: { value: 'oeuf' } });
  expect(cartes()).toHaveLength(1);
  expect(screen.getByText('1 sur 5 Pokémon')).toBeTruthy();
});

it('propose le select de tri sur téléphone', () => {
  vi.stubGlobal('matchMedia', vi.fn((requete: string) => ({ matches: requete.includes('max-width'), addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  render(<PagePC />);
  const select = screen.getByRole('combobox', { name: 'Trie par' });
  expect((select as HTMLSelectElement).value).toBe('dps');
  fireEvent.change(select, { target: { value: 'nom' } });
  expect(cartes().map(c => c.getAttribute('aria-label'))).toEqual(trierPc(pc, 'nom', nomDe).map(p => `${nomDe(p)}, niveau ${p.niveau}`));
});

it('présente le titre focalisable, le compteur et des cartes en français', () => {
  render(<PagePC retour={vi.fn()} />);
  expect(screen.getByRole('heading', { level: 1, name: 'PC de Léo' }).tabIndex).toBe(-1);
  expect(screen.getByText('4 Pokémon')).toBeTruthy();
  expect(within(screen.getByLabelText('Trie par')).getAllByRole('option').map(o => o.getAttribute('value'))).toEqual(['dps', 'numero', 'nom', 'niveau', 'favori', 'shiny']);
  expect(screen.getByLabelText('Nom ou numéro').getAttribute('type')).toBe('search');
  expect(cartes().map(c => c.getAttribute('aria-label'))).toEqual([
    ...trierPc(pc, 'dps', nomDe).map(p => `${nomDe(p)}, niveau ${p.niveau}`),
  ]);
  expect(screen.getByRole('button', { name: 'Boule, niveau 20' }).textContent).toContain('N° 101 · Niv. 20');
  expect(screen.getByRole('img', { name: 'Femelle' })).toBeTruthy();
  expect(screen.getAllByRole('img', { name: 'Mâle' })).toHaveLength(3);
  const boule = screen.getByRole('button', { name: 'Boule, niveau 20' });
  const bulbizarre = screen.getByRole('button', { name: 'Bulbizarre, niveau 12' });
  expect(within(boule).getByText('Shiny').className).toBe('sr-only');
  expect(bulbizarre.querySelector('svg.text-lien')).toBeTruthy();
  expect(boule.querySelector('strong svg path')).toBeTruthy();
  expect(boule.querySelector('img.halo-shiny')?.getAttribute('src')).toBe('img/sprites/pokemon-shiny/101.png');
  expect(boule.querySelector('img')?.classList.contains('lg:size-24')).toBe(true);
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
  enTelephone();
  const { container } = render(<PagePC retour={vi.fn()} />);
  expect(screen.getByRole('heading').textContent).toBe('PC de Léo');
  expect(screen.getByText(raison).tagName).toBe('P');
  expect(screen.getAllByRole('button')).toHaveLength(1);
  expect(container.textContent).toBe(`RetourPC de Léo${raison}`);
  expect(screen.queryByRole('list')).toBeNull();
  expect(screen.queryByRole('searchbox')).toBeNull();
  expect(container.querySelector('img')).toBeNull();
});

it('ouvre la fiche d’un œuf sans DPS ni statistiques', () => {
  storeJeu.setState({ pc: [{ ...base, uid: 'oeuf', oeuf: { pasRestants: 10, pasMax: 10 } }] });
  render(<PagePC />);
  const carte = within(screen.getByRole('list')).getByRole('button');
  expect(within(carte).queryByText(/DPS/)).toBeNull();
  expect(carte.textContent).toContain('Éclosion');
  fireEvent.click(carte);
  const fiche = screen.getByRole('dialog');
  expect(within(fiche).queryByText(/DPS/)).toBeNull();
  expect(fiche.querySelector('dl')).toBeNull();
});

it.each<[TriPc, string]>([
  ['numero', 'Numéro'], ['nom', 'Nom'], ['niveau', 'Niveau'], ['favori', 'Favori'], ['shiny', 'Shiny'],
])('applique le tri %s sans modifier le store', (tri, texte) => {
  const reference = storeJeu.getState().pc;
  render(<PagePC retour={vi.fn()} />);
  const groupe = screen.getByLabelText('Trie par') as HTMLSelectElement;
  expect(texte).toBeTruthy();
  expect(groupe.value).toBe('dps');
  fireEvent.change(groupe, { target: { value: tri } });
  expect(cartes().map(c => c.getAttribute('aria-label'))).toEqual(
    trierPc(pc, tri, nomDe).map(p => `${nomDe(p)}, niveau ${p.niveau}`),
  );
  expect(groupe.value).toBe(tri);
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
  const premier = screen.getByRole('button', { name: 'Boule, niveau 20' });
  expect(premier.getAttribute('aria-pressed')).toBe('true');
  const cible = within(screen.getByRole('list')).getByRole('button', { name: 'Pikachu, niveau 8' });
  fireEvent.click(cible);
  expect(cible.getAttribute('aria-pressed')).toBe('true');
  expect(cible.classList.contains('bg-selection')).toBe(true);
  expect(premier.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  fireEvent.change(screen.getByLabelText('Trie par'), { target: { value: 'niveau' } });
  expect(within(screen.getByRole('list')).getAllByRole('button', { pressed: true })).toEqual([cible]);
});

it('appelle retour', () => {
  const retour = vi.fn();
  enTelephone();
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
const relacherLot = vi.fn<(uids: string[]) => string | null>(() => null);

it.each([false, true])('sélection et confirmation prudente, téléphone : %s', mobile => {
  if (mobile) enTelephone();
  render(<PagePC />);
  fireEvent.click(screen.getByRole('button', { name: 'Relâcher' }));
  expect((screen.getByRole('button', { name: 'Relâcher la sélection' }) as HTMLButtonElement).disabled).toBe(true);
  const favori = cartes().find(c => c.getAttribute('aria-disabled') === 'true')!;
  expect(within(favori).getByText('Favori verrouillé')).toBeTruthy();
  fireEvent.click(favori);
  expect(screen.getByText('Aucun Pokémon sélectionné')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Boule, niveau 20' }));
  fireEvent.click(cartes().find(c => c.getAttribute('aria-label') === 'Pikachu, niveau 8')!);
  expect(screen.getByText('2 Pokémon sélectionnés')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Relâcher la sélection' }));
  const dialogue = screen.getByRole('dialog');
  expect(within(dialogue).getByText('Relâcher 2 Pokémon ?')).toBeTruthy();
  expect(within(dialogue).getByText('Attention : 1 shiny en fait partie.')).toBeTruthy();
  fireEvent.click(within(dialogue).getByRole('button', { name: 'Annuler' }));
  expect(relacherLot).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Relâcher la sélection' }));
  fireEvent.click(screen.getByRole('button', { name: 'Relâche définitivement' }));
  expect(relacherLot.mock.calls[0]![0].sort()).toEqual(['electrode', 'pikachu']);
  expect(screen.queryByText('2 Pokémon sélectionnés')).toBeNull();
});

it('ne compte que les Pokémon visibles non favoris', () => {
  render(<PagePC />);
  fireEvent.click(screen.getByRole('button', { name: 'Relâcher' }));
  fireEvent.change(screen.getByLabelText('Filtre'), { target: { value: 'shiny' } });
  fireEvent.click(screen.getByRole('button', { name: 'Tout sélectionner' }));
  expect(screen.getByText('1 Pokémon sélectionné')).toBeTruthy();
  fireEvent.change(screen.getByLabelText('Filtre'), { target: { value: 'favori' } });
  expect(screen.getByText('Aucun Pokémon sélectionné')).toBeTruthy();
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
    echange: null, annulerEchange, placerDansEquipe, echanger, basculerFavori, relacherLot });
});
afterEach(() => vi.restoreAllMocks());

it('présente le détail choisi, ses DPS sans type et six emplacements par affichage', () => {
  render(<PagePC retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Zéphyr, niveau 30' }));
  const panneau = screen.getByRole('dialog');
  expect(within(panneau).getByRole('heading', { name: 'Zéphyr' })).toBeTruthy();
  expect(within(panneau).getByText(`${formaterDps(dpsSansType(pc[3]!))} DPS`)).toBeTruthy();
  expect(within(panneau).getByRole('progressbar', { name: 'XP de Zéphyr' })).toBeTruthy();
  expect(within(screen.getByRole('complementary')).getAllByText('Emplacement libre')).toHaveLength(4);
  expect(within(screen.getByRole('complementary')).getAllByRole('button', { name: 'Pikachu, niveau 8' })).toHaveLength(2);
  expect(screen.queryByRole('group', { name: 'Équipe mobile' })).toBeNull();
});

it('place le Pokémon dans une équipe incomplète et sélectionne le suivant', () => {
  render(<PagePC retour={vi.fn()} />);
  fireEvent.change(screen.getByLabelText('Trie par'), { target: { value: 'numero' } });
  fireEvent.click(screen.getByRole('button', { name: 'Zéphyr, niveau 30' }));
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  expect(placerDansEquipe).toHaveBeenCalledWith('autre');
  expect(storeJeu.getState().equipe.some(c => c?.pokemon.uid === 'autre')).toBe(true);
  expect(storeJeu.getState().pc.some(p => p.uid === 'autre')).toBe(false);
  expect(within(screen.getByRole('list')).getByRole('button', { pressed: true }).getAttribute('aria-label')).toBe('Bulbizarre, niveau 12');
});

it('échange avec une équipe pleine depuis la colonne, puis annule', () => {
  storeJeu.setState({ equipe: Array.from({ length: 6 }, (_, i) => caseDe({ ...base, uid: `e${i}`, surnom: `Partenaire ${i}` })) });
  render(<><PagePC retour={vi.fn()} /><Notifications /></>);
  fireEvent.click(screen.getByRole('button', { name: 'Zéphyr, niveau 30' }));
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  expect(screen.getByRole('status').textContent).toContain('Choisis le Pokémon à remplacer par Zéphyr');
  const zone = screen.getByRole('complementary');
  fireEvent.click(within(zone).getByRole('button', { name: 'Partenaire 0, niveau 8' }));
  expect(echanger).toHaveBeenCalledWith('autre', 'e0');
  expect(storeJeu.getState().equipe[0]?.pokemon.uid).toBe('autre');
  expect(storeJeu.getState().pc.some(p => p.uid === 'e0')).toBe(true);
  expect(screen.queryByRole('status')).toBeNull();
  fireEvent.click(within(screen.getByRole('list')).getAllByRole('button')[0]!);
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
  fireEvent.click(within(screen.getByRole('list')).getByRole('button', { pressed: true }));
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  expect(screen.getByRole('alert').textContent).toBe('Placement impossible. Réessaie.');
  fireEvent.click(screen.getByRole('button', { name: 'Ajoute aux favoris' }));
  expect(screen.getByRole('alert').textContent).toBe('Favori impossible. Réessaie.');
  cleanup();
  storeJeu.setState({ echange: { uid: 'autre', nom: 'Zéphyr' } });
  render(<><PagePC retour={vi.fn()} /><Notifications /></>);
  fireEvent.click(within(screen.getByRole('complementary')).getAllByRole('button', { name: 'Pikachu, niveau 8' })[0]!);
  expect(screen.getByRole('alert').textContent).toBe('Échange impossible. Réessaie.');
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(screen.queryByRole('alert')).toBeNull();
});

const transfert = (uid: string) => ({ dataTransfer: { getData: () => uid, setData: vi.fn(), effectAllowed: '' } });

it('le glisser-déposer est toujours actif, sans bouton Déplacer, et dépose sur l’équipe', () => {
  render(<PagePC />);
  const carte = screen.getByRole('button', { name: 'Zéphyr, niveau 30' });
  expect(screen.queryByRole('button', { name: 'Déplacer' })).toBeNull();
  expect(carte.getAttribute('draggable')).toBe('true');
  // Place libre : le Pokémon entre dans l'équipe.
  fireEvent.dragStart(carte, transfert('autre'));
  const libre = screen.getAllByText('Emplacement libre')[0]!.parentElement!;
  fireEvent.dragOver(libre, transfert('autre'));
  fireEvent.drop(libre, transfert('autre'));
  expect(placerDansEquipe).toHaveBeenCalledWith('autre');
  // Place occupée : échange avec le Pokémon d'équipe.
  fireEvent.drop(within(screen.getByRole('complementary')).getAllByRole('button', { name: 'Pikachu, niveau 8' })[0]!, transfert('electrode'));
  expect(echanger).toHaveBeenCalledWith('electrode', 'e1');
});

it('sur téléphone, rien n’est glissable', () => {
  enTelephone();
  render(<PagePC />);
  expect(screen.getByRole('button', { name: 'Zéphyr, niveau 30' }).getAttribute('draggable')).toBeNull();
});

it('bascule le favori depuis le détail', () => {
  render(<PagePC retour={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Zéphyr, niveau 30' }));
  fireEvent.click(screen.getByRole('button', { name: 'Ajoute aux favoris' }));
  expect(basculerFavori).toHaveBeenCalledWith('autre');
  expect(storeJeu.getState().pc.find(p => p.uid === 'autre')?.favori).toBe(true);
  expect(screen.getByRole('button', { name: 'Retire des favoris', pressed: true })).toBeTruthy();
});

it('ouvre une seule fiche depuis la carte et restaure le focus', () => {
  render(<PagePC retour={vi.fn()} />);
  const bouton = screen.getByRole('button', { name: 'Zéphyr, niveau 30' });
  fireEvent.click(bouton);
  expect(screen.getByRole('dialog', { name: 'Zéphyr' })).toBeTruthy();
  expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Ferme la fiche' }).classList.contains('fiche-fermer')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(bouton);
});

it('échange en choisissant le partenaire avant le Pokémon du PC au clavier', () => {
  render(<PagePC />);
  const partenaire = within(screen.getByRole('complementary')).getAllByRole('button', { name: /niveau/ })[0]!;
  partenaire.focus();
  fireEvent.click(partenaire, { detail: 0 });
  expect(partenaire.getAttribute('aria-pressed')).toBe('true');
  const carte = within(screen.getByRole('list')).getByRole('button', { name: 'Zéphyr, niveau 30' });
  carte.focus();
  fireEvent.click(carte, { detail: 0 });
  expect(echanger).toHaveBeenCalledWith('autre', 'e1');
  expect(storeJeu.getState().equipe[0]?.pokemon.uid).toBe('autre');
  expect(screen.queryByRole('dialog')).toBeNull();
});

it('garde le focus clavier dans le mode échange puis le rend à l’action', () => {
  storeJeu.setState({ equipe: Array.from({ length: 6 }, (_, i) => caseDe({ ...base, uid: `e${i}`, surnom: `Partenaire ${i}` })) });
  render(<><PagePC retour={vi.fn()} /><Notifications /></>);
  fireEvent.click(within(screen.getByRole('list')).getByRole('button', { pressed: true }));
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Annuler' }));
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(document.activeElement).not.toBe(document.body);
});

it('annule au démontage et désactive le placement sans sélection', () => {
  storeJeu.setState({ pc: [] });
  const { unmount } = render(<PagePC retour={vi.fn()} />);
  expect(screen.getByText('Ton PC est vide. Capture des Pokémon pour les ranger ici.')).toBeTruthy();
  expect(screen.queryByRole('button', { name: "Placer dans l'équipe" })).toBeNull();
  unmount();
  expect(annulerEchange).toHaveBeenCalledOnce();
});
