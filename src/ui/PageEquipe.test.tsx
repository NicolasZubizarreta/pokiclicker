// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { PokemonPossede } from '../core/sauvegarde';
import { formaterDps } from './nombres';
import { PageEquipe } from './PageEquipe';
import { storeJeu } from './store';
import { utiliserSurPokemon } from '../core/objets-equipe';
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
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
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
  const declencheur = screen.getByRole('button', { name: 'Utiliser' });
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
  for (const nom of ['Maximum, niveau 100', 'Œuf, niveau 16']) {
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
  fireEvent.click(screen.getByText('Objet pour ton équipe.'));
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
