// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PokemonPossede } from '../core/sauvegarde';
import { formaterDps } from './nombres';
import { PageEquipe } from './PageEquipe';
import { FenetreSac } from './FenetreSac';
import { storeNotifications, viderNotifications } from './pileNotifications';
import { choisirObjet, reinitialiserSac, storeSac } from './sacContexte';
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
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); this.querySelector<HTMLButtonElement>('button')?.focus(); } },
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
afterEach(() => { cleanup(); reinitialiserSac(); viderNotifications(); vi.restoreAllMocks(); });
// Refus et résultats d'objets : pop-up (pile de notifications), plus de ligne dans la page.
const message = () => storeNotifications.getState().liste.at(-1)?.texte;

it('sur téléphone la ligne prête à évoluer clignote sans bouton d’évolution', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  storeJeu.setState({ equipe: [{ pokemon, evolution: 2, dps: 42, xpMax: 100, multiplicateur: 1 }] });
  render(<PageEquipe />);
  expect(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }).classList.contains('pret-evoluer')).toBe(true);
  expect(screen.queryByRole('button', { name: /Faire évoluer/ })).toBeNull();
  vi.unstubAllGlobals();
});

it('relie le PC et masque son accès pendant le choix ou un échange', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const ouvrirPC = vi.fn();
  storeJeu.setState({ pc: [pokemon], accesPc: { ouvert: true, raison: null } });
  render(<PageEquipe ouvrirPC={ouvrirPC} />);
  expect(screen.getByText('1 Pokémon rangés')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /PC de Léo/ }));
  expect(ouvrirPC).toHaveBeenCalledOnce();
  act(() => storeJeu.setState({ accesPc: { ouvert: false, raison: null } }));
  expect(screen.getByText("Après l'arène d'Argenta")).toBeTruthy();
  expect(screen.getByRole('button', { name: /PC de Léo/ }).className).toContain('opacity-60');
  act(() => choisirObjet({ type: 'jeton', cle: 'shiny-token', nom: 'Jeton Shiny' }));
  expect(screen.queryByRole('button', { name: /PC de Léo/ })).toBeNull();
  const ligne = screen.getByRole('button', { name: 'Bourgeon, niveau 16' });
  expect(ligne.className).toContain('border-info-base');
  expect(within(ligne).getByText('Choisir').className).toContain('lg:hidden');
  act(() => { reinitialiserSac(); storeJeu.setState({ echange: { uid: 'pc', nom: 'Pikachu' } }); });
  expect(screen.queryByRole('button', { name: /PC de Léo/ })).toBeNull();
  vi.unstubAllGlobals();
});

it('garde sprite, halo et icône chromatiques dans les cartes, le détail et l’évolution', () => {
  const shiny = { ...pokemon, shiny: true };
  storeJeu.setState({ equipe: [{ pokemon: shiny, dps: 42, xpMax: 100, multiplicateur: 1, evolution: 2 }], evolution: null });
  const precharger = vi.spyOn(chargement, 'precharger').mockResolvedValue({ charges: 1, echecs: 0 });
  const { container } = render(<PageEquipe />);
  expect(precharger).toHaveBeenCalledWith(['img/sprites/pokemon-shiny/2.png']);
  expect(container.querySelectorAll('img.halo-shiny[src="img/sprites/pokemon-shiny/1.png"]')).toHaveLength(1);
  expect(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }).querySelector('strong svg path')).toBeTruthy();
  expect(screen.queryByRole('complementary')).toBeNull();
  act(() => storeJeu.setState({ evolution: { uid: pokemon.uid, ancien: 1, nouveau: 2 } }));
  expect(container.querySelectorAll('img.halo-shiny[src="img/sprites/pokemon-shiny/2.png"]')).toHaveLength(1);
  expect(container.querySelectorAll('img.halo-shiny[src="img/sprites/pokemon-shiny/1.png"]')).toHaveLength(1);
  expect(container.querySelector('img[src^="img/sprites/pokemon/"]')).toBeNull();
});

it('présente six cases, le total formaté et les noms français', () => {
  render(<PageEquipe />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Ton équipe');
  expect(screen.queryByRole('button', { name: /PC de Léo/ })).toBeNull();
  expect(screen.getByText(`${formaterDps(127.5)} DPS`)).toBeTruthy();
  expect(screen.getByText('3 / 6')).toBeTruthy();
  const liste = screen.getByRole('list');
  expect(within(liste).getAllByRole('listitem')).toHaveLength(6);
  expect(within(liste).getAllByRole('button', { name: /, niveau / })).toHaveLength(3);
  expect(within(liste).queryAllByRole('button', { name: /^Renommer / })).toHaveLength(0);
  expect(within(liste).getAllByText('Emplacement libre')).toHaveLength(3);
  expect(screen.getByRole('button', { name: 'Salamèche, niveau 16' })).toBeTruthy();
  expect(within(liste).getAllByRole('progressbar')).toHaveLength(3);
  expect(liste.querySelectorAll('.pastille-type')).toHaveLength(4);
});

it('le crayon de la carte ouvre la fiche avec le champ de surnom, le focus dedans, et rend le focus au crayon', () => {
  render(<PageEquipe />);
  const carte = screen.getByRole('button', { name: 'Carapuce, niveau 16' });
  fireEvent.click(carte);
  const crayon = screen.getByRole('button', { name: 'Renommer Carapuce' });
  expect(crayon.className).toContain('after:size-11');
  expect(crayon.closest('dialog')).toBeTruthy();
  fireEvent.click(crayon);
  const champ = screen.getByRole('textbox', { name: 'Surnom' }) as HTMLInputElement;
  expect(screen.getByRole('dialog', { name: 'Carapuce' })).toBeTruthy();
  expect(champ.value).toBe('Carapuce');
  expect(document.activeElement).toBe(champ);
  fireEvent.keyDown(champ, { key: 'Escape' });
  fireEvent.click(screen.getByRole('button', { name: 'Ferme la fiche' }));
  expect(document.activeElement).toBe(carte);
  // Une ouverture par la carte repart d'une fiche sans champ ouvert.
  fireEvent.click(screen.getByRole('button', { name: 'Carapuce, niveau 16' }));
  expect(screen.queryByRole('textbox')).toBeNull();
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
  expect(screen.queryByRole('complementary')).toBeNull();
});

it('sur grand écran, actualise le détail puis ouvre sa fiche avec son propre déclencheur', () => {
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);
  render(<PageEquipe />);
  fireEvent.click(screen.getByRole('button', { name: 'Carapuce, niveau 16' }));
  const ouvrir = screen.getByRole('button', { name: 'Carapuce, niveau 16' });
  expect(screen.queryByRole('complementary')).toBeNull();
  expect(within(screen.getByRole('dialog', { name: 'Carapuce' })).getByRole('progressbar', { name: 'XP de Carapuce' }).getAttribute('aria-valuenow')).toBe('30');
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
  fireEvent.click(screen.getAllByRole('button', { name: 'Annuler' }).at(-1)!);
  expect(annulerEchange).toHaveBeenCalledOnce();
  expect(screen.queryByText(/Choisis le Pokémon à remplacer/)).toBeNull();
  expect(screen.queryByRole('alert')).toBeNull();
});

it('annule l’échange au démontage', () => {
  const { unmount } = render(<PageEquipe />);
  unmount();
  expect(annulerEchange).toHaveBeenCalledOnce();
});

it('annule le choix du Sac par Échap et ignore le clic extérieur', () => {
  render(<PageEquipe />);
  act(() => choisirObjet({ type: 'bonbon', cle: 'candy', nom: 'Bonbon rare' }));
  expect(screen.getByText('Bonbon rare ×0 : touche un Pokémon')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Fermer' })).toBeTruthy();
  fireEvent.click(document.body);
  expect(storeSac.getState().objet).not.toBeNull();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(storeSac.getState()).toMatchObject({ objet: null, ouvert: true });
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

function preparerObjet(type: 'bonbon' | 'calcium' | 'baie' = 'bonbon', stock = 5, avantUtilisation?: () => void) {
  storeJeu.setState({ sac: { acces: { ouvert: true, raison: null }, entrees: [{
    id: type === 'bonbon' ? 'candy' : type === 'baie' ? 'pomegBerry' : 'calcium',
    nom: type === 'bonbon' ? 'Bonbon' : type === 'baie' ? 'Baie Grena' : 'Calcium',
    description: 'Objet pour ton équipe.', image: null, categorie: 'soins', quantite: stock,
    actif: false, utilisable: type,
  }] } });
  render(<><PageEquipe /><FenetreSac /></>);
  avantUtilisation?.();
  fireEvent.click(screen.getByRole('button', { name: 'Sac' }));
  fireEvent.click(screen.getByRole('button', { name: `${type === 'bonbon' ? 'Bonbon' : type === 'baie' ? 'Baie Grena' : 'Calcium'} ×${stock}` }));
}

it('conserve la même région de sélection vide puis annoncée puis vide', () => {
  let region: HTMLElement;
  preparerObjet('bonbon', 5, () => {
    region = screen.getByRole('status');
    expect(region.textContent).toBe('');
  });
  const selection = screen.getByRole('status');
  expect(region!.isConnected).toBe(false);
  expect(selection.textContent).toBe('Bonbon ×5 : touche un Pokémon');
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(storeSac.getState()).toMatchObject({ objet: null, ouvert: true });
  expect(screen.getByRole('dialog', { name: 'Ton Sac' })).toBeTruthy();
});

it.each(['bouton', 'Échap', 'extérieur', 'validation', 'déclencheur disparu'])('rend le focus après %s', moyen => {
  storeJeu.setState({ utiliserObjet: () => null });
  preparerObjet();
  const declencheur = screen.getByRole('heading', { level: 1 });
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  const annuler = within(screen.getByRole('group', { name: 'Quantité' })).getByRole('button', { name: 'Annuler' });
  annuler.focus();
  if (moyen === 'déclencheur disparu') act(() => storeJeu.setState({ sac: { ...storeJeu.getState().sac, entrees: [] } }));
  if (moyen === 'bouton') fireEvent.click(annuler);
  else if (moyen === 'extérieur') {
    fireEvent.click(document.body);
    expect(storeSac.getState().objet).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
  }
  else if (moyen === 'validation') fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  else fireEvent.keyDown(document, { key: 'Escape' });
  expect(declencheur.isConnected).toBe(true);
  expect(document.activeElement).toBe(moyen === 'validation' || moyen === 'bouton' ? screen.getByRole('button', { name: 'Bourgeon, niveau 16' }) : screen.getByRole('button', { name: 'Fermer' }));
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
  expect(screen.getAllByRole('status')[0]!.textContent).toBe('Bonbon ×5 : touche un Pokémon');
  const cible = screen.getByRole('button', { name: 'Bourgeon, niveau 16' });
  expect(cible.className).toContain('motion-safe:cible-valide');
  fireEvent.contextMenu(cible);
  expect(screen.queryByRole('menu')).toBeNull();
  fireEvent.click(cible);
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.querySelectorAll('button.bg-action')).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  expect(utiliserObjet).toHaveBeenCalledWith('bonbon', 'premier', 2);
  expect(storeJeu.getState().equipe[0]?.pokemon.niveau).toBe(18);
  expect(storeJeu.getState().equipe[0]?.pokemon.xp).toBe(30);
  expect(screen.queryByRole('group', { name: 'Quantité' })).toBeNull();
  expect(screen.getAllByRole('status')[0]!.textContent).toBe('Bonbon ×5 : touche un Pokémon');
});

it('enchaîne deux cibles puis ferme à stock zéro avec une notification', () => {
  storeJeu.setState({ utiliserObjet: vi.fn(() => {
    const sac = storeJeu.getState().sac;
    storeJeu.setState({ sac: { ...sac, entrees: sac.entrees.map(e => ({ ...e, quantite: e.quantite - 1 })) } });
    return null;
  }) });
  preparerObjet('bonbon', 2);
  const cartes = document.querySelectorAll<HTMLButtonElement>('button[data-uid]');
  for (let i = 0; i < 2; i++) {
    fireEvent.click(cartes[i]!);
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    if (i === 0) {
      expect(screen.getByText('Bonbon ×1 : touche un Pokémon')).toBeTruthy();
      expect(document.activeElement).toBe(cartes[i]);
    }
  }
  expect(storeSac.getState().objet).toBeNull();
  expect(screen.queryByText(/touche un Pokémon/)).toBeNull();
  expect(message()).toBe('Plus de Bonbon.');
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

it('borne la Baie Grena au plafond et permet une utilisation en série', () => {
  storeJeu.setState({ equipe: [{ ...storeJeu.getState().equipe[0]!, pokemon: { ...pokemon, bonheur: 250 } },
    { ...storeJeu.getState().equipe[1]!, pokemon: { ...pokemon, uid: 'limite', surnom: 'Limite', bonheur: 255 } }],
  utiliserObjet: vi.fn(() => '+6 de bonheur') });
  preparerObjet('baie', 5);
  expect((screen.getByRole('button', { name: 'Limite, niveau 16' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  fireEvent.click(screen.getByRole('button', { name: 'Plus' }));
  expect((screen.getByRole('button', { name: 'Plus' }) as HTMLButtonElement).disabled).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  expect(storeJeu.getState().utiliserObjet).toHaveBeenCalledWith('baie', 'premier', 3);
  expect(message()).toBe('+6 de bonheur');
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
  expect(message()).toBe('Quantité invalide.');
});

it.each(['bouton', 'Échap', 'extérieur'])('annule la sélection par %s et conserve les clics dans le Sac', moyen => {
  preparerObjet();
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  fireEvent.click(screen.getAllByRole('status')[0]!);
  expect(screen.getByRole('group', { name: 'Quantité' })).toBeTruthy();
  if (moyen === 'bouton') fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  else if (moyen === 'Échap') fireEvent.keyDown(document, { key: 'Escape' });
  else {
    fireEvent.click(document.body);
    expect(screen.getByRole('group', { name: 'Quantité' })).toBeTruthy();
    fireEvent.keyDown(document, { key: 'Escape' });
  }
  expect(screen.getAllByRole('status')[0]!.textContent).toBe('');
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
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  const bouton = screen.getByRole('button', { name: /Faire évoluer Bourgeon en/ });
  expect(bouton.textContent).toBe('Évoluer');
  expect(bouton.className).toContain('cadre-alerte');
  expect(bouton.classList.contains('bg-action')).toBe(false);
  expect(container.querySelector('button button')).toBeNull();
  expect(screen.getByRole('button', { name: /Faire évoluer/ }).closest('dialog')).toBeTruthy();
  expect(precharger).toHaveBeenCalledWith(['img/sprites/pokemon/2.png']);
  fireEvent.click(bouton);
  expect(evoluer).toHaveBeenCalledWith('premier');
  expect(screen.getByRole('alert').textContent).toBe('Évolution bloquée !');
});

it('rend le focus au bouton de la ligne après une évolution réussie', () => {
  preparerEvolution();
  storeJeu.setState({ evoluer: vi.fn(() => null) });
  render(<PageEquipe />);
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  fireEvent.click(screen.getByRole('button', { name: /Faire évoluer Bourgeon en/ }));
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
  expect(container.querySelectorAll('.evolution-nouveau')).toHaveLength(1);
  expect(container.querySelectorAll('img[src="img/sprites/pokemon/2.png"]')).toHaveLength(1);
  act(() => storeJeu.setState({ evolution: { uid: 'autre', ancien: 4, nouveau: 5 } }));
  expect(container.querySelector('.evolution-nouveau')).toBeNull();
  act(() => storeJeu.setState({ evolution: null }));
  expect(container.querySelectorAll('img[src="img/sprites/pokemon/1.png"]')).toHaveLength(1);
});

function preparerPierre(p: PokemonPossede = { ...pokemon, numero: 25 }) {
  preparerEvolution(p);
  storeJeu.setState({ sac: { acces: { ouvert: true, raison: null }, entrees: [{
    id: 'thunderStone', nom: 'Pierre Foudre', description: 'Pierre d’évolution.', image: null,
    categorie: 'soins', quantite: 1, actif: false, utilisable: 'pierre',
  }] } });
  render(<><PageEquipe /><FenetreSac /></>);
  fireEvent.click(screen.getByRole('button', { name: 'Sac' }));
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
  expect(message()).toBe(raison);
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
  const declencheur = screen.getByRole('heading', { level: 1 });
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  expect(screen.getByRole('group', { name: 'Utiliser Pierre Foudre sur Bourgeon ?' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Plus' })).toBeNull();
  expect(document.querySelectorAll('button.bg-action')).toHaveLength(1);
  expect(document.querySelector('button button')).toBeNull();
  expect(screen.queryByRole('button', { name: /Faire évoluer/ })).toBeNull();
  if (moyen === 'validation') fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  else if (moyen === 'Échap') fireEvent.keyDown(document, { key: 'Escape' });
  else if (moyen === 'extérieur') {
    fireEvent.click(document.body);
    expect(storeSac.getState().objet).not.toBeNull();
    fireEvent.keyDown(document, { key: 'Escape' });
  }
  else {
    if (moyen === 'déclencheur disparu') act(() => storeJeu.setState({ sac: { acces: { ouvert: true, raison: null }, entrees: [] } }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Annuler' }).at(-1)!);
  }
  expect(screen.queryByRole('group', { name: /Utiliser Pierre/ })).toBeNull();
  if (moyen === 'bouton' || moyen === 'déclencheur disparu') {
    expect(storeSac.getState().objet).not.toBeNull();
    expect(screen.queryByRole('dialog', { name: 'Ton Sac' })).toBeNull();
    expect(document.activeElement).toBe(document.querySelector('button[data-uid="premier"]'));
    fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  }
  expect(screen.getAllByRole('status')[0]!.textContent).toBe('');
  expect(document.activeElement).toBe(moyen === 'validation' ? declencheur : screen.getByRole('button', { name: 'Fermer' }));
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
  expect(message()).toBe('Plus de pierre !');
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
  render(<><PageEquipe /><FenetreSac /></>);
  fireEvent.click(screen.getByRole('button', { name: 'Sac' }));
  const declencheur = screen.getByRole('button', { name: `${nom} ×2` });
  fireEvent.click(declencheur);
  return declencheur;
}

it('pose la Stase sans confirmation, affiche son icône et le DPS puis la retire via le menu', () => {
  preparerActif('stase');
  const ligne = screen.getByRole('button', { name: 'Bourgeon, niveau 16' });
  expect(ligne.className).toContain('motion-safe:cible-valide');
  fireEvent.click(ligne);
  expect(storeJeu.getState().poserStase).toHaveBeenCalledWith('premier');
  expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
  const retrait = within(ligne.parentElement!).getByRole('button', { name: /^Retirer Pierre Stase de / });
  const icone = retrait.querySelector('img')!;
  expect(icone.getAttribute('src')).toBe('img/objets/everstone.png');
  expect(ligne.contains(retrait)).toBe(false);
  expect(within(ligne).getByText(`${formaterDps(42 * 1.25)} DPS`)).toBeTruthy();
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(1);
  expect(document.activeElement).toBe(ligne);
  expect(screen.getAllByRole('status')[0]!.textContent).toBe('Pierre Stase ×1 : touche un Pokémon');
  expect(document.querySelectorAll('button.bg-action')).toHaveLength(0);
  expect(document.querySelector('button button')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.contextMenu(ligne);
  fireEvent.click(screen.getByRole('menuitem', { name: "Retirer l'objet" }));
  expect(storeJeu.getState().retirerStase).toHaveBeenCalledWith('premier');
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(2);
  expect(within(ligne.parentElement!).queryByRole('button', { name: /^Retirer Pierre Stase de / })).toBeNull();
  expect(document.activeElement).toBe(ligne);
  fireEvent.contextMenu(ligne);
  expect(screen.queryByRole('menuitem', { name: "Retirer l'objet" })).toBeNull();
});

it('retire la Stase d’un clic sur son icône et la rend au stock', () => {
  preparerActif('stase');
  fireEvent.click(screen.getByRole('button', { name: 'Bourgeon, niveau 16' }));
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(1);
  fireEvent.click(screen.getByRole('button', { name: /^Retirer Pierre Stase de / }));
  expect(storeJeu.getState().retirerStase).toHaveBeenCalledWith('premier');
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(2);
  expect(screen.queryByRole('button', { name: /^Retirer Pierre Stase de / })).toBeNull();
});

it.each([
  [{ ...pokemon, numero: 2 }, 'Pokémon incompatible !', false],
  [{ ...pokemon, oeuf: { pasRestants: 10, pasMax: 10 } }, 'Pokémon invalide !', false],
  [{ ...pokemon, pierreEternelle: true }, 'Retire-la via le menu !', true],
] as const)('explique le refus de Stase sur une ligne grisée cliquable (%j)', (p, raison, ferme) => {
  preparerActif('stase', p);
  const ligne = screen.getByRole('button', { name: 'oeuf' in p ? 'Œuf, Éclosion : 0/10' : 'Bourgeon, niveau 16' });
  expect(ligne.hasAttribute('disabled')).toBe(false);
  expect(ligne.className).toContain('grayscale');
  fireEvent.click(ligne);
  expect(message()).toBe(raison);
  expect(screen.getAllByRole('status')[0]!.textContent).toBe('Pierre Stase ×2 : touche un Pokémon');
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(2);
  if (ferme) expect(storeSac.getState().objet).not.toBeNull();
});

it.each(['validation', 'annulation', 'refus'] as const)('confirme le Jeton et restitue le focus après %s', moyen => {
  preparerActif('jeton');
  const ligne = screen.getByRole('button', { name: 'Bourgeon, niveau 16' });
  expect(ligne.className).toContain('motion-safe:cible-valide');
  fireEvent.click(ligne);
  expect(screen.getByRole('group', { name: 'Utiliser Jeton Shiny sur Bourgeon ?' })).toBeTruthy();
  expect(document.querySelectorAll('button.bg-action')).toHaveLength(1);
  expect(document.querySelector('button button')).toBeNull();
  if (moyen === 'refus') storeJeu.setState({ utiliserJeton: vi.fn(() => 'Quantité invalide.') });
  fireEvent.click(screen.getAllByRole('button', { name: moyen === 'annulation' ? 'Annuler' : 'Valider' }).at(-1)!);
  expect(storeJeu.getState().equipe[0]?.pokemon.shiny).toBe(moyen === 'validation');
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(moyen === 'validation' ? 1 : 2);
  if (moyen === 'annulation') expect(document.activeElement).toBe(ligne);
  if (moyen === 'refus') expect(message()).toBe('Quantité invalide.');
  else expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
});

it('fait pulser aussi les chromatiques et les œufs pour le Jeton', () => {
  preparerActif('jeton', { ...pokemon, shiny: true, oeuf: { pasRestants: 10, pasMax: 10 } });
  const ligne = screen.getByRole('button', { name: 'Œuf, Éclosion : 0/10' });
  expect(ligne.className).toContain('motion-safe:cible-valide');
  fireEvent.click(ligne);
  expect(message()).toBe('Déjà chromatique !');
  expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
  expect(storeJeu.getState().utiliserJeton).not.toHaveBeenCalled();
});

it('annonce le message direct en pop-up sans rien ajouter à la page', () => {
  storeJeu.setState({ utiliserObjetActif: vi.fn(() => 'Boss non vaincu !') });
  preparerActif('direct');
  expect(within(screen.getByRole('dialog', { name: 'Ton Sac' })).getByRole('status').textContent).toBe('Boss non vaincu !');
  expect(within(screen.getAllByRole('list')[0]!).queryByText('Boss non vaincu !')).toBeNull();
  expect(screen.getAllByRole('status')[0]!.textContent).toBe('');
});

it.each([null, 'Boss non vaincu !'])('utilise directement le Sac et annonce le refus %s en pop-up', refus => {
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
  expect(within(screen.getByRole('dialog', { name: 'Ton Sac' })).getByRole('status').textContent).toBe(refus ?? '');
  expect(screen.getAllByRole('status')[0]!.textContent).toBe('');
  expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
  expect(storeJeu.getState().sac.entrees[0]?.quantite).toBe(refus ? 2 : 1);
});
