// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PokemonPossede } from '../core/sauvegarde';
import { formaterDps } from './nombres';
import { PageEquipe } from './PageEquipe';
import { storeJeu } from './store';
import { poserStase, retirerStase, utiliserJetonShiny, utiliserSurPokemon } from '../core/objets-equipe';
import { evolutionDisponible, evoluerParPierre } from '../core/evolution';
import * as chargement from './precharger';
import type { DonneesRegion } from '../core/sauvegarde';

vi.mock('./store', async original => {
  const module = await original<typeof import('./store')>();
  const { createStore } = await import('zustand/vanilla');
  return { ...module, storeJeu: createStore(() => module.storeJeu.getState()) };
});

const pokemon: PokemonPossede = { uid: 'premier', numero: 1, niveau: 16, xp: 30,
  surnom: 'Bourgeon', sexe: 'male', shiny: false, favori: true, bonheur: 128, calcium: 0, pierreEternelle: false };
const echanger = vi.fn((): string | null => null);
const annulerEchange = vi.fn(() => storeJeu.setState({ echange: null }));
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) {
      this.removeAttribute('open'); this.dispatchEvent(new Event('close'));
    } },
  });
  echanger.mockReset();
  annulerEchange.mockClear();
  storeJeu.setState({ equipe: [pokemon, { ...pokemon, uid: 'second', surnom: undefined, numero: 4 },
    { ...pokemon, uid: 'troisieme', surnom: 'Carapuce', numero: 7 }, null, null, null]
    .map(p => p ? { pokemon: p, dps: 42.5, xpMax: 100, multiplicateur: 1 } : null),
  dps: 127.5, echange: null, echanger, annulerEchange });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('garde sprite, halo et icône chromatiques dans les cartes, le détail et l’évolution', () => {
  const shiny = { ...pokemon, shiny: true };
  storeJeu.setState({ equipe: [{ pokemon: shiny, dps: 42, xpMax: 100, multiplicateur: 1, evolution: 2 }], evolution: null });
  const precharger = vi.spyOn(chargement, 'precharger').mockResolvedValue({ charges: 1, echecs: 0 });
  const { container } = render(<PageEquipe />);
  expect(precharger).toHaveBeenCalledWith(['img/sprites/pokemon-shiny/2.png']);
  expect(container.querySelectorAll('img.halo-shiny[src="img/sprites/pokemon-shiny/1.png"]')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }).querySelector('strong svg linearGradient')).toBeTruthy();
  expect(within(screen.getByRole('complementary')).getByRole('heading').querySelector('svg')).toBeTruthy();
  act(() => storeJeu.setState({ evolution: { uid: pokemon.uid, ancien: 1, nouveau: 2 } }));
  expect(container.querySelectorAll('img.halo-shiny[src="img/sprites/pokemon-shiny/2.png"]')).toHaveLength(2);
  expect(container.querySelectorAll('img.halo-shiny[src="img/sprites/pokemon-shiny/1.png"]')).toHaveLength(2);
  expect(container.querySelector('img[src^="img/sprites/pokemon/"]')).toBeNull();
});

it('présente six cases, le total formaté et les noms français', () => {
  render(<PageEquipe />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ton équipe');
  expect(screen.getByText(`${formaterDps(127.5)} DPS · 3 / 6`)).toBeTruthy();
  const liste = screen.getByRole('list');
  expect(within(liste).getAllByRole('listitem')).toHaveLength(6);
  expect(within(liste).getAllByRole('button')).toHaveLength(3);
  expect(within(liste).getAllByText('Emplacement libre')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Salamèche, niveau 16' })).toBeTruthy();
  expect(within(liste).getAllByRole('progressbar')).toHaveLength(3);
  expect(liste.textContent).toBe('BourgeonNiv. 1642,5 DPSSalamècheNiv. 1642,5 DPSCarapuceNiv. 1642,5 DPSEmplacement libreEmplacement libreEmplacement libre');
});

it('choisit une case et conserve le choix, le défilement et le focus après fermeture', () => {
  const { container } = render(<PageEquipe />);
  const liste = screen.getByRole('list');
  liste.scrollTop = 120;
  const cible = screen.getByRole('button', { name: 'Salamèche, niveau 16' });
  expect(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(cible);
  expect(cible.getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('dialog', { name: 'Salamèche' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(cible.getAttribute('aria-pressed')).toBe('true');
  expect(liste.scrollTop).toBe(120);
  expect(document.activeElement).toBe(cible);
  expect(container.querySelectorAll('dialog[open]')).toHaveLength(0);
  expect(within(screen.getByRole('complementary')).getByRole('heading').textContent).toBe('Salamèche');
});

it('sur grand écran, actualise le détail puis ouvre sa fiche avec son propre déclencheur', () => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);
  render(<PageEquipe />);
  fireEvent.click(screen.getByRole('button', { name: 'Carapuce, niveau 16' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  const detail = screen.getByRole('complementary');
  expect(within(detail).getByRole('heading').textContent).toBe('Carapuce');
  expect(within(detail).getByText('30 / 100 XP')).toBeTruthy();
  const ouvrir = screen.getByRole('button', { name: 'Ouvre la fiche' });
  fireEvent.click(ouvrir);
  expect(screen.getByRole('dialog', { name: 'Carapuce' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(document.activeElement).toBe(ouvrir);
});

it('propose l’échange, appelle le store, affiche son erreur et permet d’annuler', () => {
  storeJeu.setState({ echange: { uid: 'pc', nom: 'Pikachu' } });
  echanger.mockReturnValue('Il faut au moins 1 Pokémon actif dans l’équipe.');
  render(<PageEquipe />);
  expect(screen.getAllByRole('status').map(zone => zone.textContent).join(' ')).toContain('Choisis le Pokémon à remplacer par Pikachu');
  fireEvent.click(screen.getByRole('button', { name: 'Salamèche, niveau 16' }));
  expect(echanger).toHaveBeenCalledWith('pc', 'second');
  expect(screen.getByRole('alert').textContent).toBe('Il faut au moins 1 Pokémon actif dans l’équipe.');
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(annulerEchange).toHaveBeenCalledOnce();
  expect(screen.queryByText(/Choisis le Pokémon à remplacer/)).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('annule l’échange au démontage', () => {
  const { unmount } = render(<PageEquipe />);
  unmount();
  expect(annulerEchange).toHaveBeenCalledOnce();
});

it('le clic droit ouvre Résumé, puis la fiche du Pokémon et rend le focus à sa carte', () => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);
  render(<PageEquipe />);
  expect(screen.queryByRole('menu')).toBeNull();
  const carte = screen.getByRole('button', { name: 'Salamèche, niveau 16' });
  expect(fireEvent.contextMenu(carte, { clientX: 100, clientY: 80 })).toBe(false);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('menuitem', { name: 'Résumé' }));
  expect(screen.queryByRole('menu')).toBeNull();
  expect(screen.getByRole('dialog', { name: 'Salamèche' })).toBeTruthy();
  expect(carte.getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(document.activeElement).toBe(carte);
});

function preparerObjet(type: 'bonbon' | 'calcium' = 'bonbon', stock = 5, avantUtilisation?: () => void) {
  storeJeu.setState({ sac: { acces: { ouvert: true, raison: null }, entrees: [{
    id: type === 'bonbon' ? 'candy' : 'calcium', nom: type === 'bonbon' ? 'Bonbon' : 'Calcium',
    description: 'Objet pour ton équipe.', image: null, categorie: 'soins', quantite: stock,
    actif: false, utilisable: type,
  }] } });
  render(<PageEquipe />);
  avantUtilisation?.();
  fireEvent.click(screen.getByRole('button', { name: `${type === 'bonbon' ? 'Bonbon' : 'Calcium'} ×${stock}` }));
}

it('conserve la même région de sélection vide puis annoncée puis vide', () => {
  let region: HTMLElement;
  preparerObjet('bonbon', 5, () => {
    region = screen.getByRole('status');
    expect(region.textContent).toBe('');
  });
  const selection = screen.getByRole('status');
  expect(selection).toBe(region!);
  expect(selection.textContent).toBe('Sélectionne un Pokémon.');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.getByRole('status')).toBe(selection);
  expect(selection.textContent).toBe('');
});

it.each(['bouton', 'Échap', 'extérieur', 'validation', 'déclencheur disparu'])('rend le focus après %s', moyen => {
  storeJeu.setState({ utiliserObjet: () => null });
  preparerObjet();
  const declencheur = screen.getByRole('button', { name: 'Bonbon ×5' });
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  const annuler = screen.getByRole('button', { name: 'Annuler' });
  annuler.focus();
  if (moyen === 'déclencheur disparu') act(() => storeJeu.setState({ sac: { ...storeJeu.getState().sac, entrees: [] } }));
  if (moyen === 'bouton') fireEvent.click(annuler);
  else if (moyen === 'extérieur') fireEvent.click(document.body);
  else if (moyen === 'validation') fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  else fireEvent.keyDown(document, { key: 'Escape' });
  expect(document.activeElement).toBe(moyen === 'déclencheur disparu'
    ? screen.getByRole('heading', { level: 1 }) : declencheur);
});

it('utilise deux Bonbons pour gagner exactement deux niveaux sans changer l’XP', () => {
  const utiliserObjet = vi.fn((type: 'bonbon' | 'calcium', uid: string, n: number) => {
    const equipe = storeJeu.getState().equipe;
    const resultat = utiliserSurPokemon({ equipe: equipe.flatMap(c => c ? [c.pokemon] : []),
      inventaire: { bonbon: 5 } } as unknown as DonneesRegion, type, 'bonbon', uid, n);
    if (!resultat.ok) return resultat.raison;
    storeJeu.setState({ equipe: equipe.map(c => c ? { ...c,
      pokemon: resultat.region.equipe.find(p => p.uid === c.pokemon.uid)! } : null) });
    return null;
  });
  storeJeu.setState({ utiliserObjet });
  preparerObjet();
  expect(screen.getByRole('status').textContent).toBe('Sélectionne un Pokémon.');
  const cible = screen.getByRole('button', { name: 'Bourgeon, niveau 16' });
  expect(cible.className).toContain('motion-safe:cible-valide');
  fireEvent.contextMenu(cible);
  expect(screen.queryByRole('menu')).toBeNull();
  fireEvent.click(cible);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.querySelectorAll('.bg-action')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  expect(utiliserObjet).toHaveBeenCalledWith('bonbon', 'premier', 2);
  expect(storeJeu.getState().equipe[0]?.pokemon.niveau).toBe(18);
  expect(storeJeu.getState().equipe[0]?.pokemon.xp).toBe(30);
  expect(screen.queryByRole('group', { name: 'Quantité' })).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('');
});

it('laisse les œufs et les niveaux maximum inertes et borne les Bonbons au niveau 100', () => {
  storeJeu.setState({ equipe: [
    { ...storeJeu.getState().equipe[0]!, pokemon: { ...pokemon, niveau: 98 } },
    { ...storeJeu.getState().equipe[1]!, pokemon: { ...pokemon, uid: 'max', surnom: 'Maximum', niveau: 100 } },
    { ...storeJeu.getState().equipe[2]!, pokemon: { ...pokemon, uid: 'oeuf', surnom: 'Œuf', oeuf: { pasRestants: 10, pasMax: 10 } } },
  ] });
  preparerObjet();
  for (const nom of ['Maximum, niveau 100', 'Œuf, Éclosion : 0/10']) {
    const cible = screen.getByRole('button', { name: nom }) as HTMLButtonElement;
    expect(cible.disabled).toBe(true);
    expect(cible.className).toContain('grayscale');
    fireEvent.click(cible);
    fireEvent.contextMenu(cible);
  }
  expect(screen.queryByRole('group', { name: 'Quantité' })).toBeNull();
  expect(screen.queryByRole('menu')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 98' }));
  fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  expect((screen.getByRole('button', { name: 'Plus' }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByLabelText('Quantité', { selector: 'output' }).textContent).toBe('2');
});

it('borne le Calcium au stock et à la limite et affiche une erreur du store', () => {
  storeJeu.setState({ equipe: [{ ...storeJeu.getState().equipe[0]!, pokemon: { ...pokemon, calcium: 9 } },
    { ...storeJeu.getState().equipe[1]!, pokemon: { ...pokemon, uid: 'limite', surnom: 'Limite', calcium: 10 } }],
  utiliserObjet: vi.fn(() => 'Quantité invalide.') });
  preparerObjet('calcium', 1);
  expect((screen.getByRole('button', { name: 'Limite, niveau 16' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  expect((screen.getByRole('button', { name: 'Plus' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  expect(storeJeu.getState().utiliserObjet).toHaveBeenCalledWith('calcium', 'premier', 1);
  expect(screen.getByRole('alert').textContent).toBe('Quantité invalide.');
});

it.each(['bouton', 'Échap', 'extérieur'])('annule la sélection par %s et conserve les clics dans le Sac', moyen => {
  preparerObjet();
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  fireEvent.click(screen.getByText('Ton Sac'));
  expect(screen.getByRole('group', { name: 'Quantité' })).toBeTruthy();
  if (moyen === 'bouton') fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  else if (moyen === 'Échap') fireEvent.keyDown(document, { key: 'Escape' });
  else fireEvent.click(document.body);
  expect(screen.getByRole('status').textContent).toBe('');
  expect(screen.queryByRole('group', { name: 'Quantité' })).toBeNull();
});

it('garde le mode échange prioritaire sur les objets et bloque le menu contextuel', () => {
  storeJeu.setState({ echange: { uid: 'pc', nom: 'Pikachu' } });
  preparerObjet();
  const cible = screen.getByRole('button', { name: 'Bourgeon, niveau 16' });
  fireEvent.contextMenu(cible);
  expect(screen.queryByRole('menu')).toBeNull();
  fireEvent.click(cible);
  expect(echanger).toHaveBeenCalledWith('pc', 'premier');
  expect(screen.queryByRole('group', { name: 'Quantité' })).toBeNull();
  expect(screen.queryByRole('dialog')).toBeNull();
});

function preparerEvolution(p: PokemonPossede = pokemon) {
  storeJeu.setState({ equipe: [{ pokemon: p, dps: 42, xpMax: 100, multiplicateur: 1,
    evolution: evolutionDisponible(p) }], evolution: null });
}

it('propose l’évolution au niveau requis, précharge la cible et relaie les refus', () => {
  preparerEvolution();
  const precharger = vi.spyOn(chargement, 'precharger').mockResolvedValue({ charges: 1, echecs: 0 });
  const evoluer = vi.fn(() => 'Évolution bloquée !');
  storeJeu.setState({ evoluer });
  const { container } = render(<PageEquipe />);
  const bouton = screen.getByRole('button', { name: 'Faire évoluer Bourgeon' });
  expect(bouton.textContent).toBe('Évoluer');
  expect(bouton.className).toContain('cadre-alerte');
  expect(bouton.classList.contains('bg-action')).toBe(false);
  expect(container.querySelector('button button')).toBeNull();
  expect(container.querySelectorAll('.bg-action')).toHaveLength(1);
  expect(precharger).toHaveBeenCalledWith(['img/sprites/pokemon/2.png']);
  fireEvent.click(bouton);
  expect(evoluer).toHaveBeenCalledWith('premier');
  expect(screen.getByRole('alert').textContent).toBe('Évolution bloquée !');
});

it('rend le focus au bouton de la ligne après une évolution réussie', () => {
  preparerEvolution();
  storeJeu.setState({ evoluer: vi.fn(() => null) });
  render(<PageEquipe />);
  fireEvent.click(screen.getByRole('button', { name: 'Faire évoluer Bourgeon' }));
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
});

it.each([{ ...pokemon, niveau: 15 }, { ...pokemon, pierreEternelle: true },
  { ...pokemon, oeuf: { pasRestants: 10, pasMax: 10 } }])('masque l’évolution indisponible (%j)', p => {
  preparerEvolution(p);
  render(<PageEquipe />);
  expect(screen.queryByRole('button', { name: /Faire évoluer/ })).toBeNull();
});

it.each(['bonbon', 'calcium', 'échange'] as const)('masque l’évolution pendant %s', mode => {
  preparerEvolution();
  if (mode === 'échange') {
    storeJeu.setState({ echange: { uid: 'pc', nom: 'Pikachu' } });
    render(<PageEquipe />);
  } else preparerObjet(mode);
  expect(screen.queryByRole('button', { name: /Faire évoluer/ })).toBeNull();
});

it('anime uniquement le membre concerné dans la ligne et le panneau, puis rétablit les images', () => {
  preparerEvolution();
  const { container } = render(<PageEquipe />);
  act(() => storeJeu.setState({ evolution: { uid: 'premier', ancien: 1, nouveau: 2 } }));
  expect(container.querySelectorAll('.evolution-nouveau')).toHaveLength(2);
  expect(container.querySelectorAll('img[src="img/sprites/pokemon/2.png"]')).toHaveLength(2);
  act(() => storeJeu.setState({ evolution: { uid: 'autre', ancien: 4, nouveau: 5 } }));
  expect(container.querySelector('.evolution-nouveau')).toBeNull();
  act(() => storeJeu.setState({ evolution: null }));
  expect(container.querySelectorAll('img[src="img/sprites/pokemon/1.png"]')).toHaveLength(2);
});

function preparerPierre(p: PokemonPossede = { ...pokemon, numero: 25 }) {
  preparerEvolution(p);
  storeJeu.setState({ sac: { acces: { ouvert: true, raison: null }, entrees: [{
    id: 'thunderStone', nom: 'Pierre Foudre', description: 'Pierre d’évolution.', image: null,
    categorie: 'soins', quantite: 1, actif: false, utilisable: 'pierre',
  }] } });
  render(<PageEquipe />);
  fireEvent.click(screen.getByRole('button', { name: 'Pierre Foudre ×1' }));
}

it.each([
  [{ ...pokemon, numero: 19 }, 'Pokémon incompatible !'],
  [{ ...pokemon, numero: 25, pierreEternelle: true }, 'Pierre Stase équipée !'],
  [{ ...pokemon, numero: 25, oeuf: { pasRestants: 10, pasMax: 10 } }, 'Pokémon invalide !'],
] as const)('explique le refus d’une pierre sans consommer le stock (%s)', (p, raison) => {
  const utiliserPierre = vi.fn(() => null);
  storeJeu.setState({ utiliserPierre });
  preparerPierre(p);
  const ligne = screen.getByRole('button', { name: 'oeuf' in p ? 'Œuf, Éclosion : 0/10' : 'Bourgeon, niveau 16' });
  expect(ligne.hasAttribute('disabled')).toBe(false);
  expect(ligne.className).toContain('grayscale');
  fireEvent.click(ligne);
  expect(screen.getByRole('alert').textContent).toBe(raison);
  expect(screen.queryByRole('group', { name: /Utiliser Pierre/ })).toBeNull();
  expect(utiliserPierre).not.toHaveBeenCalled();
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(1);
});

it.each(['validation', 'bouton', 'Échap', 'extérieur', 'déclencheur disparu'])('confirme une pierre et rend le focus après %s', moyen => {
  storeJeu.setState({ utiliserPierre: vi.fn((uid, pierre) => {
    const etat = storeJeu.getState();
    const resultat = evoluerParPierre({ equipe: etat.equipe.flatMap(c => c ? [c.pokemon] : []),
      inventaire: { thunderStone: 1 } } as unknown as DonneesRegion, uid, pierre);
    if (!resultat.ok) return resultat.raison;
    storeJeu.setState({ equipe: resultat.region.equipe.map(pokemon => ({ pokemon, dps: 42, xpMax: 100, multiplicateur: 1 })),
      sac: { ...etat.sac, entrees: etat.sac.entrees.map(e => ({ ...e, quantite: 0 })) } });
    return null;
  }) });
  preparerPierre();
  const declencheur = screen.getByRole('button', { name: 'Pierre Foudre ×1' });
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  expect(screen.getByRole('group', { name: 'Utiliser Pierre Foudre sur Bourgeon ?' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Plus' })).toBeNull();
  expect(document.querySelectorAll('.bg-action')).toHaveLength(1);
  expect(document.querySelector('button button')).toBeNull();
  expect(screen.queryByRole('button', { name: /Faire évoluer/ })).toBeNull();
  if (moyen === 'validation') fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  else if (moyen === 'Échap') fireEvent.keyDown(document, { key: 'Escape' });
  else if (moyen === 'extérieur') fireEvent.click(document.body);
  else {
    if (moyen === 'déclencheur disparu') act(() => storeJeu.setState({ sac: { acces: { ouvert: true, raison: null }, entrees: [] } }));
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  }
  expect(screen.queryByRole('group', { name: /Utiliser Pierre/ })).toBeNull();
  expect(screen.getByRole('status').textContent).toBe('');
  expect(document.activeElement).toBe(moyen === 'validation' || moyen === 'déclencheur disparu'
    ? screen.getByRole('heading', { level: 1 }) : declencheur);
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(moyen === 'validation' ? 0 : moyen === 'déclencheur disparu' ? undefined : 1);
  if (moyen === 'validation') {
    expect(storeJeu.getState().utiliserPierre).toHaveBeenCalledWith('premier', 'thunderStone');
    expect(storeJeu.getState().equipe[0]?.pokemon.numero).toBe(26);
  }
});

it('garde la confirmation de pierre ouverte si le store refuse', () => {
  storeJeu.setState({ utiliserPierre: vi.fn(() => 'Plus de pierre !') });
  preparerPierre();
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  expect(screen.getByRole('alert').textContent).toBe('Plus de pierre !');
  expect(screen.getByRole('group', { name: 'Utiliser Pierre Foudre sur Bourgeon ?' })).toBeTruthy();
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(1);
});

function preparerActif(type: 'stase' | 'jeton' | 'direct', p: PokemonPossede = pokemon) {
  const id = type === 'stase' ? 'everstone' : type === 'jeton' ? 'shinyToken' : 'repel';
  const nom = type === 'stase' ? 'Pierre Stase' : type === 'jeton' ? 'Jeton Shiny' : 'Repousse';
  preparerEvolution(p);
  const appliquer = (action: typeof poserStase) => vi.fn((uid: string) => {
    const etat = storeJeu.getState();
    const resultat = action({ equipe: etat.equipe.flatMap(c => c ? [c.pokemon] : []), pc: [],
      inventaire: { [id]: etat.sac.entrees[0]!.quantite } } as unknown as DonneesRegion, uid);
    if (!resultat.ok) return resultat.raison;
    storeJeu.setState({ equipe: resultat.region.equipe.map(pokemon => ({ pokemon,
      dps: 42 * (pokemon.pierreEternelle ? 1.25 : 1), xpMax: 100, multiplicateur: 1 })),
    sac: { ...etat.sac, entrees: etat.sac.entrees.map(e => ({ ...e, quantite: resultat.region.inventaire[id]! })) } });
    return null;
  });
  storeJeu.setState({ poserStase: appliquer(poserStase), retirerStase: appliquer(retirerStase),
    utiliserJeton: appliquer(utiliserJetonShiny),
    sac: { acces: { ouvert: true, raison: null }, entrees: [{ id, nom, description: nom, image: null,
      categorie: 'soins', quantite: 2, actif: false, utilisable: type }] } });
  render(<PageEquipe />);
  const declencheur = screen.getByRole('button', { name: `${nom} ×2` });
  fireEvent.click(declencheur);
  return declencheur;
}

it('pose la Stase sans confirmation, affiche son icône et le DPS puis la retire via le menu', () => {
  const declencheur = preparerActif('stase');
  const ligne = screen.getByRole('button', { name: 'Bourgeon, niveau 16' });
  expect(ligne.className).toContain('motion-safe:cible-valide');
  fireEvent.click(ligne);
  expect(storeJeu.getState().poserStase).toHaveBeenCalledWith('premier');
  expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
  const icone = within(ligne.parentElement!).getByRole('img', { name: 'Pierre Stase' });
  expect(icone.getAttribute('src')).toBe('img/objets/everstone.png');
  expect(ligne.contains(icone)).toBe(false);
  expect(within(ligne).getByText(`${formaterDps(42 * 1.25)} DPS`)).toBeTruthy();
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(1);
  expect(document.activeElement).toBe(declencheur);
  expect(screen.getByRole('status').textContent).toBe('');
  expect(document.querySelectorAll('.bg-action')).toHaveLength(1);
  expect(document.querySelector('button button')).toBeNull();
  fireEvent.contextMenu(ligne);
  fireEvent.click(screen.getByRole('menuitem', { name: "Retirer l'objet" }));
  expect(storeJeu.getState().retirerStase).toHaveBeenCalledWith('premier');
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(2);
  expect(within(ligne.parentElement!).queryByRole('img', { name: 'Pierre Stase' })).toBeNull();
  expect(document.activeElement).toBe(ligne);
  fireEvent.contextMenu(ligne);
  expect(screen.queryByRole('menuitem', { name: "Retirer l'objet" })).toBeNull();
});

it.each([
  [{ ...pokemon, numero: 2 }, 'Pokémon incompatible !', false],
  [{ ...pokemon, oeuf: { pasRestants: 10, pasMax: 10 } }, 'Pokémon invalide !', false],
  [{ ...pokemon, pierreEternelle: true }, 'Retire-la via le menu !', true],
] as const)('explique le refus de Stase sur une ligne grisée cliquable (%j)', (p, raison, ferme) => {
  const declencheur = preparerActif('stase', p);
  const ligne = screen.getByRole('button', { name: 'oeuf' in p ? 'Œuf, Éclosion : 0/10' : 'Bourgeon, niveau 16' });
  expect(ligne.hasAttribute('disabled')).toBe(false);
  expect(ligne.className).toContain('grayscale');
  fireEvent.click(ligne);
  expect(screen.getByRole('alert').textContent).toBe(raison);
  expect(screen.getByRole('status').textContent).toBe(ferme ? '' : 'Sélectionne un Pokémon.');
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(2);
  if (ferme) expect(document.activeElement).toBe(declencheur);
});

it.each(['validation', 'annulation', 'refus'] as const)('confirme le Jeton et restitue le focus après %s', moyen => {
  preparerActif('jeton');
  const ligne = screen.getByRole('button', { name: 'Bourgeon, niveau 16' });
  expect(ligne.className).toContain('motion-safe:cible-valide');
  fireEvent.click(ligne);
  expect(screen.getByRole('group', { name: 'Utiliser Jeton Shiny sur Bourgeon ?' })).toBeTruthy();
  expect(document.querySelectorAll('.bg-action')).toHaveLength(1);
  expect(document.querySelector('button button')).toBeNull();
  if (moyen === 'refus') storeJeu.setState({ utiliserJeton: vi.fn(() => 'Quantité invalide.') });
  fireEvent.click(screen.getByRole('button', { name: moyen === 'annulation' ? 'Annuler' : 'Valider' }));
  expect(storeJeu.getState().equipe[0]?.pokemon.shiny).toBe(moyen === 'validation');
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(moyen === 'validation' ? 1 : 2);
  if (moyen === 'annulation') expect(document.activeElement).toBe(ligne);
  if (moyen === 'refus') expect(screen.getByRole('alert').textContent).toBe('Quantité invalide.');
  else expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
});

it('fait pulser aussi les chromatiques et les œufs pour le Jeton', () => {
  preparerActif('jeton', { ...pokemon, shiny: true, oeuf: { pasRestants: 10, pasMax: 10 } });
  const ligne = screen.getByRole('button', { name: 'Œuf, Éclosion : 0/10' });
  expect(ligne.className).toContain('motion-safe:cible-valide');
  fireEvent.click(ligne);
  expect(screen.getByRole('alert').textContent).toBe('Déjà chromatique !');
  expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
  expect(storeJeu.getState().utiliserJeton).not.toHaveBeenCalled();
});

it('efface le message direct au clic sur une ligne et conserve la région status', () => {
  storeJeu.setState({ utiliserObjetActif: vi.fn(() => 'Boss non vaincu !') });
  preparerActif('direct');
  const status = screen.getByRole('status');
  expect(status.textContent).toBe('Boss non vaincu !');
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  expect(screen.getByRole('status')).toBe(status);
  expect(status.textContent).toBe('');
});

it.each([null, 'Boss non vaincu !'])('utilise directement le Sac et annonce le refus %s dans le status existant', refus => {
  const utiliserObjetActif = vi.fn(() => {
    if (!refus) {
      const sac = storeJeu.getState().sac;
      storeJeu.setState({ sac: { ...sac, entrees: sac.entrees.map(e => ({ ...e, quantite: e.quantite - 1 })) } });
    }
    return refus;
  });
  storeJeu.setState({ utiliserObjetActif });
  preparerActif('direct');
  expect(utiliserObjetActif).toHaveBeenCalledWith('repel');
  expect(screen.getByRole('status').textContent).toBe(refus ?? '');
  expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(refus ? 2 : 1);
});
