// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { DonneesRegion, PokemonPossede } from '../core/sauvegarde';
import { poserStase, retirerStase, utiliserJetonShiny, utiliserSurPokemon } from '../core/objets-equipe';
import { evoluerParPierre } from '../core/evolution';
import { PagePC } from './PagePC';
import { FenetreSac } from './FenetreSac';
import { choisirObjet, reinitialiserSac, storeSac } from './sacContexte';
import { storeNotifications, viderNotifications } from './pileNotifications';
import { storeJeu } from './store';

vi.mock('./store', async original => {
  const module = await original<typeof import('./store')>();
  const { createStore } = await import('zustand/vanilla');
  return { ...module, storeJeu: createStore(() => module.storeJeu.getState()) };
});

const pokemon: PokemonPossede = { uid: 'equipe', numero: 1, niveau: 16, xp: 30,
  surnom: 'Bourgeon', sexe: 'male', shiny: false, favori: false, bonheur: 128, calcium: 0, pierreEternelle: false };
const initial = storeJeu.getState();
const message = () => storeNotifications.getState().liste.at(-1)?.texte;
const cible = (uid: string) => document.querySelector<HTMLButtonElement>(`button[data-uid="${uid}"]`)!;
const membre = (p: PokemonPossede) => ({ pokemon: p, dps: 42, xpMax: 100, multiplicateur: 1, evolution: p.numero === 1 ? 2 : undefined });
const lire = (uid: string) => [...storeJeu.getState().equipe.flatMap(m => m ? [m.pokemon] : []), ...storeJeu.getState().pc].find(p => p.uid === uid)!;

beforeEach(() => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } },
  });
  storeJeu.setState({ ...initial, equipe: [membre(pokemon), null, null, null, null, null],
    pc: [{ ...pokemon, uid: 'pc', surnom: 'Réserve' }], accesPc: { ouvert: true, raison: null },
    echange: null, evolution: null, annulerEchange: vi.fn(), echanger: vi.fn(() => null) });
});
afterEach(() => { cleanup(); reinitialiserSac(); viderNotifications(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

const objets = {
  bonbon: ['candy', 'Bonbon rare'], calcium: ['calcium', 'Calcium'], baie: ['pomegBerry', 'Baie Grena'],
  pierre: ['thunderStone', 'Pierre Foudre'], stase: ['everstone', 'Pierre Stase'], jeton: ['shinyToken', 'Jeton Shiny'],
} as const;

function preparer(type: keyof typeof objets, stock = 5) {
  const [cle, nom] = objets[type];
  const appliquer = (action: (region: DonneesRegion, uid: string) => ReturnType<typeof poserStase>) => (uid: string) => {
    const etat = storeJeu.getState();
    const region = { equipe: etat.equipe.flatMap(m => m ? [m.pokemon] : []), pc: etat.pc,
      inventaire: { [cle]: etat.sac.entrees[0]!.quantite } } as unknown as DonneesRegion;
    const resultat = action(region, uid);
    if (!resultat.ok) return resultat.raison;
    storeJeu.setState({ equipe: resultat.region.equipe.map(membre), pc: resultat.region.pc,
      sac: { ...etat.sac, entrees: etat.sac.entrees.map(e => ({ ...e, quantite: resultat.region.inventaire[cle]! })) } });
    return null;
  };
  storeJeu.setState({
    utiliserObjet: (type, uid, n) => appliquer((region, uid) => utiliserSurPokemon(region, type, cle, uid, n))(uid),
    utiliserPierre: (uid, pierre) => appliquer((region, uid) => {
      const resultat = evoluerParPierre(region, uid, pierre);
      return { ...resultat, message: resultat.ok ? '' : resultat.raison };
    })(uid),
    poserStase: appliquer(poserStase), retirerStase: appliquer(retirerStase), utiliserJeton: appliquer(utiliserJetonShiny),
    sac: { acces: { ouvert: true, raison: null }, entrees: [{ id: cle, nom, description: nom, image: null,
      categorie: 'soins', quantite: stock, actif: false, utilisable: type }] },
  });
  render(<main id="contenu"><PagePC /><FenetreSac /></main>);
  fireEvent.click(screen.getByRole('button', { name: 'Sac' }));
  expect(screen.getByRole('dialog', { name: 'Ton Sac' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: `${nom} ×${stock}` }));
}

it.each(['equipe', 'pc'])('applique deux bonbons à %s sans changer son XP', uid => {
  preparer('bonbon');
  fireEvent.click(cible(uid));
  expect(screen.getByText(`Utiliser Bonbon rare sur ${lire(uid).surnom}`)).toBeTruthy();
  expect(screen.getByRole('group', { name: 'Quantité' }).closest('.pc-panneau')).toBeTruthy();
  expect(cible(uid).draggable).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: '+ : augmenter' }));
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
  expect(lire(uid)).toMatchObject({ niveau: 18, xp: 30 });
  expect(storeJeu.getState().sac.entrees[0]!.quantite).toBe(3);
});

it('enchaîne équipe et PC jusqu’à épuisement puis notifie', () => {
  preparer('bonbon', 2);
  for (const uid of ['equipe', 'pc']) {
    fireEvent.click(cible(uid));
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
  }
  expect(lire('equipe').niveau).toBe(17);
  expect(lire('pc').niveau).toBe(17);
  expect(storeSac.getState().objet).toBeNull();
  expect(message()).toBe('Plus de Bonbon rare.');
});

it.each(['equipe', 'pc'])('laisse œuf et niveau maximum inertes dans %s', uid => {
  const p = { ...pokemon, uid, niveau: 100 };
  storeJeu.setState(uid === 'pc' ? { pc: [p, { ...p, uid: 'oeuf', oeuf: { pasRestants: 10, pasMax: 10 } }] }
    : { equipe: [membre(p), membre({ ...p, uid: 'oeuf', oeuf: { pasRestants: 10, pasMax: 10 } })] });
  preparer('bonbon');
  for (const id of [uid, 'oeuf']) {
    expect(cible(id).disabled).toBe(true);
    fireEvent.click(cible(id));
  }
  expect(screen.queryByRole('group', { name: 'Quantité' })).toBeNull();
});

it.each(['equipe', 'pc'])('applique baie et calcium à %s', uid => {
  preparer('baie');
  fireEvent.click(cible(uid));
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
  expect(lire(uid).bonheur).toBe(130);
  cleanup(); reinitialiserSac();
  preparer('calcium');
  fireEvent.click(cible(uid));
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
  expect(lire(uid).calcium).toBe(1);
});

it.each(['calcium', 'pierre'] as const)('annonce le refus du store pour %s et garde la fenêtre', type => {
  storeJeu.setState({ pc: [{ ...pokemon, uid: 'pc', numero: 25 }] });
  preparer(type);
  act(() => storeJeu.setState(type === 'calcium' ? { utiliserObjet: vi.fn(() => 'Quantité invalide.') }
    : { utiliserPierre: vi.fn(() => 'Plus de pierre !') }));
  fireEvent.click(cible('pc'));
  fireEvent.click(screen.getByRole('button', { name: type === 'calcium' ? 'Utiliser' : 'Valider' }));
  expect(message()).toBe(type === 'calcium' ? 'Quantité invalide.' : 'Plus de pierre !');
  expect(screen.getByRole('group', { name: type === 'calcium' ? 'Quantité' : /Utiliser Pierre/ })).toBeTruthy();
  expect(storeJeu.getState().sac.entrees[0]!.quantite).toBe(5);
});

it.each(['equipe', 'pc'])('confirme puis applique une pierre sur %s', uid => {
  storeJeu.setState(uid === 'pc' ? { pc: [{ ...pokemon, uid, numero: 25 }] } : { equipe: [membre({ ...pokemon, numero: 25 })] });
  preparer('pierre');
  fireEvent.click(cible(uid));
  expect(lire(uid).numero).toBe(25);
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
  expect(lire(uid).numero).toBe(25);
  fireEvent.click(cible(uid));
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  expect(lire(uid).numero).toBe(26);
});

it.each(['equipe', 'pc'])('pose Stase sur %s puis la retire par le menu', uid => {
  preparer('stase');
  fireEvent.click(cible(uid));
  expect(lire(uid).pierreEternelle).toBe(true);
  expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
  fireEvent.keyDown(document, { key: 'Escape' });
  fireEvent.click(within(screen.getByRole('dialog', { name: 'Ton Sac' })).getByRole('button', { name: 'Fermer' }));
  fireEvent.contextMenu(cible(uid));
  fireEvent.click(screen.getByRole('menuitem', { name: "Retirer l'objet" }));
  expect(lire(uid).pierreEternelle).toBe(false);
  expect(storeJeu.getState().sac.entrees[0]!.quantite).toBe(5);
});

it.each(['equipe', 'pc'])('confirme le jeton shiny sur %s', uid => {
  preparer('jeton');
  fireEvent.click(cible(uid));
  expect(lire(uid).shiny).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  expect(lire(uid).shiny).toBe(true);
});

it('donne priorité à l’échange et ignore objets et menu', () => {
  preparer('bonbon');
  act(() => storeJeu.setState({ echange: { uid: 'pc', nom: 'Réserve' } }));
  fireEvent.contextMenu(cible('equipe'));
  expect(screen.queryByRole('menu')).toBeNull();
  fireEvent.click(cible('equipe'));
  expect(storeJeu.getState().echanger).toHaveBeenCalledWith('pc', 'equipe');
  expect(screen.queryByRole('group', { name: 'Quantité' })).toBeNull();
});

it('Échap annule le choix et rouvre le Sac', () => {
  preparer('bonbon');
  fireEvent.click(cible('pc'));
  fireEvent.click(document.body);
  expect(storeSac.getState().objet).not.toBeNull();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(storeSac.getState()).toMatchObject({ objet: null, ouvert: true });
  expect(screen.getByRole('dialog', { name: 'Ton Sac' })).toBeTruthy();
});

it.each(['equipe', 'pc'])('ouvre Résumé puis la fiche de %s', uid => {
  render(<PagePC />);
  fireEvent.contextMenu(cible(uid));
  fireEvent.click(screen.getByRole('menuitem', { name: 'Résumé' }));
  expect(screen.getByRole('dialog', { name: lire(uid).surnom })).toBeTruthy();
});

it.each([false, true])('place la fenêtre dans la zone équipe, téléphone : %s', telephone => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: telephone, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  preparer('bonbon');
  fireEvent.click(cible('pc'));
  const zone = telephone ? screen.getByRole('group', { name: 'Équipe mobile' }) : screen.getByRole('complementary');
  expect(within(zone).getByRole('group', { name: 'Quantité' })).toBeTruthy();
});

it('conserve l’équipe et le Sac lorsque le PC est verrouillé', () => {
  storeJeu.setState({ accesPc: { ouvert: false, raison: 'PC fermé.' } });
  preparer('bonbon');
  expect(screen.getByText('PC fermé.')).toBeTruthy();
  fireEvent.click(cible('equipe'));
  expect(screen.getByRole('group', { name: 'Quantité' })).toBeTruthy();
});

it.each(['equipe', 'pc'])('propose et anime l’évolution de %s', uid => {
  const demanderEvolution = vi.fn(() => null);
  storeJeu.setState({ demanderEvolution });
  render(<PagePC />);
  fireEvent.click(cible(uid));
  fireEvent.click(screen.getByRole('button', { name: /Faire évoluer/ }));
  expect(demanderEvolution).toHaveBeenCalledWith(uid, undefined);
  act(() => storeJeu.setState({ evolution: { uid, ancien: 1, nouveau: 2 } }));
  expect(cible(uid).querySelector('.evolution-nouveau')).toBeTruthy();
  act(() => storeJeu.setState({ evolution: null }));
  expect(cible(uid).querySelector('.evolution-nouveau')).toBeNull();
});

it('le choix externe d’un objet active aussi les cibles', () => {
  render(<PagePC />);
  act(() => choisirObjet({ type: 'jeton', cle: 'shinyToken', nom: 'Jeton Shiny' }));
  expect(screen.getByText('Jeton Shiny ×0 : touche un Pokémon')).toBeTruthy();
});

it.each(['bonbon', 'calcium', 'baie'] as const)('borne %s au plafond et désactive les cibles saturées', type => {
  const proche = { ...pokemon, niveau: 98, calcium: 9, bonheur: 254 };
  storeJeu.setState({ equipe: [membre(proche)], pc: [{ ...proche, uid: 'pc', niveau: 100, calcium: 10, bonheur: 255 }] });
  preparer(type);
  expect(cible('pc').disabled).toBe(true);
  expect(cible('pc').className).toContain('grayscale');
  fireEvent.click(cible('equipe'));
  fireEvent.click(screen.getByRole('button', { name: '+ : augmenter' }));
  expect(screen.getByLabelText('Quantité', { selector: 'output' }).textContent).toBe(type === 'bonbon' ? '2' : '1');
});

it.each([
  [19, false, undefined, 'Pokémon incompatible !'],
  [25, true, undefined, 'Pierre Stase équipée !'],
  [25, false, { pasRestants: 1, pasMax: 10 }, 'Pokémon invalide !'],
] as const)('explique le refus de pierre pour %s sans consommer', (numero, pierreEternelle, oeuf, raison) => {
  storeJeu.setState({ pc: [{ ...pokemon, uid: 'pc', numero, pierreEternelle, oeuf }] });
  preparer('pierre');
  fireEvent.click(cible('pc'));
  expect(message()).toBe(raison);
  expect(storeJeu.getState().sac.entrees[0]!.quantite).toBe(5);
  expect(screen.queryByRole('group', { name: /^Utiliser/ })).toBeNull();
});

it('annonce les résultats non nuls du store sans quitter le mode', () => {
  preparer('baie');
  act(() => storeJeu.setState({ utiliserObjet: vi.fn(() => '+6 de bonheur') }));
  fireEvent.click(cible('equipe'));
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
  expect(message()).toBe('+6 de bonheur');
  expect(storeSac.getState().objet?.type).toBe('baie');
});

it('refuse le jeton sur un chromatique et sur un œuf', () => {
  storeJeu.setState({ pc: [{ ...pokemon, uid: 'pc', shiny: true }], equipe: [membre({ ...pokemon, oeuf: { pasRestants: 1, pasMax: 10 } })] });
  preparer('jeton');
  fireEvent.click(cible('pc'));
  expect(message()).toBe('Déjà chromatique !');
  fireEvent.click(cible('equipe'));
  fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
  expect(message()).toBe('Pokémon invalide !');
  expect(lire('equipe').shiny).toBe(false);
});

it('relaie un refus d’évolution depuis la fiche', () => {
  storeJeu.setState({ demanderEvolution: vi.fn(() => 'Évolution bloquée !') });
  render(<PagePC />);
  fireEvent.click(cible('equipe'));
  fireEvent.click(screen.getByRole('button', { name: /Faire évoluer/ }));
  expect(screen.getByRole('alert').textContent).toBe('Évolution bloquée !');
});
