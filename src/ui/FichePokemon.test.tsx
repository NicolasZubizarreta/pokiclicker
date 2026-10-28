// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import * as actions from '../core/equipe';
import type { DonneesRegion, PokemonPossede } from '../core/sauvegarde';
import { FichePokemon } from './FichePokemon';
import { storeJeu } from './store';
import { calculerMaxXp } from '../core/recompenses';

vi.mock('./store', async (original) => {
  const module = await original<typeof import('./store')>();
  const { createStore } = await import('zustand/vanilla');
  const store = createStore(() => module.storeJeu.getState());
  const modifier = (action: (region: DonneesRegion) => actions.ResultatEquipe) => {
    const region = { equipe: store.getState().equipe.flatMap(c => c ? [c.pokemon] : []), pc: [] } as unknown as DonneesRegion;
    const resultat = action(region);
    if (!resultat.ok) return resultat.raison;
    store.setState({ equipe: resultat.region.equipe.map(pokemon => ({ pokemon, dps: 42, xpMax: 100, multiplicateur: 1 })) });
    return null;
  };
  store.setState({ renommer: (uid, texte) => modifier(r => actions.renommer(r, uid, texte)),
    basculerFavori: uid => modifier(r => actions.basculerFavori(r, uid)),
    relacher: uid => modifier(r => actions.relacher(r, uid)) });
  return { ...module, storeJeu: store };
});

const pokemon: PokemonPossede = { uid: 'fiche', numero: 1, niveau: 16, xp: 30,
  surnom: 'Bourgeon', sexe: 'male', shiny: true, favori: false, bonheur: 128, calcium: 2, pierreEternelle: true };
beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.setAttribute('open', ''); } },
    close: { configurable: true, value(this: HTMLDialogElement) {
      this.removeAttribute('open'); this.dispatchEvent(new Event('close'));
    } },
  });
  storeJeu.setState({ equipe: [pokemon, { ...pokemon, uid: 'autre' }].map(p => ({ pokemon: p, dps: 42, xpMax: 100, multiplicateur: 1 })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function Exemple({ renommer = false }: { renommer?: boolean }) {
  const declencheur = useRef<HTMLButtonElement>(null);
  const [ouvert, ouvrir] = useState(false);
  return <><button ref={declencheur} onClick={() => ouvrir(true)}>Ouvre la fiche</button>
    <FichePokemon uid="fiche" ouvert={ouvert} fermer={() => ouvrir(false)} declencheur={declencheur} renommer={renommer} /></>;
}
function afficher() {
  const vue = render(<Exemple />);
  fireEvent.click(screen.getByText('Ouvre la fiche'));
  return vue;
}

it('affiche le sprite chromatique, le halo et l’icône dans le titre', () => {
  const { container } = afficher();
  expect(container.querySelector('img.halo-shiny')?.getAttribute('src')).toBe('img/sprites/pokemon-shiny/1.png');
  expect(screen.getByRole('heading', { name: 'Bourgeon' }).querySelector('svg[aria-hidden="true"]')).toBeTruthy();
});

it.each([
  [{ ...pokemon, niveau: 15, pierreEternelle: false }, 'Évolution : niveau 16'],
  [{ ...pokemon, numero: 25, pierreEternelle: false }, 'Évolution : Pierre Foudre'],
  [{ ...pokemon, numero: 133, pierreEternelle: false }, 'Évolution : Pierre Eau, Pierre Foudre ou Pierre Feu'],
  [pokemon, 'Évolution bloquée (Pierre Stase).'],
  [{ ...pokemon, numero: 25 }, 'Évolution bloquée (Pierre Stase).'],
] as const)('décrit l’évolution dans la fiche (%s)', (p, texte) => {
  storeJeu.setState({ equipe: [{ pokemon: p, dps: 42, xpMax: 100, multiplicateur: 1 }] });
  afficher();
  expect(screen.getByText(texte)).toBeTruthy();
});

it.each([{ ...pokemon, numero: 3 }, { ...pokemon, oeuf: { pasRestants: 10, pasMax: 10 } }])(
  'omet l’évolution sans cible ou pour un œuf (%s)', p => {
    storeJeu.setState({ equipe: [{ pokemon: p, dps: 42, xpMax: 100, multiplicateur: 1 }] });
    afficher();
    expect(screen.queryByText(/^Évolution/)).toBeNull();
  });

it.each(['bouton', 'fond', 'Échap'])('ferme avec %s et restaure le focus', mode => {
  afficher();
  const dialogue = screen.getByRole('dialog', { name: 'Bourgeon' });
  if (mode === 'bouton') fireEvent.click(screen.getByText('Ferme la fiche'));
  if (mode === 'fond') fireEvent.pointerDown(dialogue);
  if (mode === 'Échap') fireEvent(dialogue, new Event('cancel', { cancelable: true }));
  expect(dialogue.hasAttribute('open')).toBe(false);
  expect(document.activeElement).toBe(screen.getByText('Ouvre la fiche'));
});

it('ne ferme pas la fiche quand on appuie à l’intérieur', () => {
  afficher();
  const dialogue = screen.getByRole('dialog', { name: 'Bourgeon' });
  fireEvent.pointerDown(screen.getByText('Ferme la fiche'));
  expect(dialogue.hasAttribute('open')).toBe(true);
});

it('renomme par le crayon avec validation du cœur, compteur et en-tête réactif', () => {
  afficher();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(screen.queryByText('Surnom')).toBeNull();
  const crayon = screen.getByRole('button', { name: 'Renommer Bourgeon' });
  fireEvent.click(crayon);
  const champ = screen.getByRole('textbox', { name: 'Surnom' }) as HTMLInputElement;
  expect(champ.value).toBe('Bourgeon');
  expect(document.activeElement).toBe(champ);
  expect(champ.hasAttribute('maxlength')).toBe(false);
  for (const texte of ['abcdefghijklm', '']) {
    fireEvent.change(champ, { target: { value: texte } });
    fireEvent.submit(champ.form!);
    expect(screen.getByRole('alert').textContent).toBe('Entre un nom de 1 à 12 caractères.');
  }
  fireEvent.change(champ, { target: { value: 'abcdefghijkl' } });
  expect(screen.getByText('12 / 12 caractères')).toBeTruthy();
  fireEvent.submit(champ.form!);
  expect(storeJeu.getState().equipe[0]?.pokemon.surnom).toBe('abcdefghijkl');
  expect(screen.getByRole('heading', { name: 'abcdefghijkl' })).toBeTruthy();
  expect(screen.getByText('Bulbizarre · N° 1 · Niveau 16')).toBeTruthy();
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Renommer abcdefghijkl' }));
});

it('annule le renommage avec Échap sans fermer la fiche ni changer le surnom', () => {
  afficher();
  const dialogue = screen.getByRole('dialog', { name: 'Bourgeon' });
  fireEvent.click(screen.getByRole('button', { name: 'Renommer Bourgeon' }));
  const champ = screen.getByRole('textbox', { name: 'Surnom' });
  fireEvent.change(champ, { target: { value: 'Autre' } });
  fireEvent.keyDown(champ, { key: 'Escape' });
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(dialogue.hasAttribute('open')).toBe(true);
  expect(storeJeu.getState().equipe[0]?.pokemon.surnom).toBe('Bourgeon');
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Renommer Bourgeon' }));
  // L'événement natif « cancel » pendant l'édition annule aussi l'édition, pas la fiche.
  fireEvent.click(screen.getByRole('button', { name: 'Renommer Bourgeon' }));
  fireEvent(dialogue, new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('textbox')).toBeNull();
  expect(dialogue.hasAttribute('open')).toBe(true);
});

it('ouvre la fiche avec le champ de surnom déjà ouvert et le focus dedans', () => {
  const vue = render(<Exemple renommer />);
  fireEvent.click(vue.getByText('Ouvre la fiche'));
  const champ = vue.getByRole('textbox', { name: 'Surnom' });
  expect(document.activeElement).toBe(champ);
});

it('n’affiche pas de crayon pour un œuf', () => {
  storeJeu.setState({ equipe: [{ pokemon: { ...pokemon, oeuf: { pasRestants: 10, pasMax: 10 } }, dps: 42, xpMax: 100, multiplicateur: 1 }] });
  afficher();
  expect(screen.queryByRole('button', { name: /^Renommer/ })).toBeNull();
});

it('affiche les données en français et bascule le favori', () => {
  const { container } = afficher();
  expect(screen.getByText('Plante')).toBeTruthy();
  expect(screen.getByText('Poison')).toBeTruthy();
  expect(screen.getByText('30 / 100')).toBeTruthy();
  expect(screen.getByText('128/255')).toBeTruthy();
  expect(screen.getByText('+12,8 % de dégâts')).toBeTruthy();
  expect(container.querySelector('circle[pathLength="255"]')?.getAttribute('stroke-dasharray')).toBe('128 255');
  const favori = screen.getByRole('button', { name: 'Ajoute aux favoris' });
  expect(favori.getAttribute('aria-pressed')).toBe('false');
  fireEvent.click(favori);
  expect(screen.getByRole('button', { name: 'Retire des favoris' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Envoyer au PC' }).hasAttribute('disabled')).toBe(false);
  expect(screen.queryByText('Le PC arrive bientôt.')).toBeNull();
  expect(container.textContent).not.toMatch(/\b(?:Level|Happiness|Release|Cancel|Grass|Male|Female)\b/);
});

it('affiche MAX au niveau 100 et aucun symbole sans sexe', () => {
  storeJeu.setState({ equipe: [{ pokemon: { ...pokemon, numero: 100, sexe: 'sansSexe', niveau: 100 }, dps: 42, xpMax: 0, multiplicateur: 1 }] });
  const { container } = afficher();
  expect(screen.getByText('MAX')).toBeTruthy();
  expect(container.textContent).not.toMatch(/[♂♀]/);
});

it('confirme le relâchement, focalise Annuler puis ferme les deux fenêtres', () => {
  afficher();
  fireEvent.click(screen.getByText('Relâcher'));
  expect(screen.getByRole('dialog', { name: 'Veux-tu vraiment relâcher Bourgeon ?' })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByText('Annuler'));
  fireEvent.click(screen.getByText('Relâche définitivement'));
  expect(storeJeu.getState().equipe.some(c => c?.pokemon.uid === 'fiche')).toBe(false);
  expect(screen.queryAllByRole('dialog')).toHaveLength(0);
  expect(document.activeElement).toBe(screen.getByText('Ouvre la fiche'));
});

it.each([false, true])('interdit le dernier non-œuf avec raison visible (œuf : %s)', oeuf => {
  const equipe = storeJeu.getState().equipe;
  storeJeu.setState({ equipe: oeuf ? [equipe[0]!, { ...equipe[1]!, pokemon: { ...pokemon, uid: 'oeuf', oeuf: { pasRestants: 10, pasMax: 10 } } }] : [equipe[0]!] });
  afficher();
  expect(screen.getByRole('button', { name: 'Relâcher' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByText(oeuf ? "Il faut au moins 1 Pokémon actif dans l'équipe." : "C'est ton dernier Pokémon : garde-le dans l'équipe.")).toBeTruthy();
});

it('garde la confirmation ouverte si le store refuse', () => {
  afficher();
  fireEvent.click(screen.getByText('Relâcher'));
  vi.spyOn(storeJeu.getState(), 'relacher').mockReturnValue('Relâchement refusé.');
  fireEvent.click(screen.getByText('Relâche définitivement'));
  expect(screen.getByRole('alert').textContent).toBe('Relâchement refusé.');
  expect(screen.getAllByRole('dialog')).toHaveLength(2);
});

beforeEach(() => {
  const modifier = (action: (region: DonneesRegion) => actions.ResultatEquipe, uid?: string) => {
    const etat = storeJeu.getState();
    const resultat = action({ equipe: etat.equipe.flatMap(c => c ? [c.pokemon] : []), pc: etat.pc } as unknown as DonneesRegion);
    if (!resultat.ok) return resultat.raison;
    if (resultat.echangeRequis) {
      storeJeu.setState({ echange: { uid: uid!, nom: 'Bourgeon' } });
    } else {
      storeJeu.setState({ pc: resultat.region.pc,
        equipe: resultat.region.equipe.map(pokemon => ({ pokemon, dps: 42, xpMax: 100, multiplicateur: 1 })) });
    }
    return null;
  };
  storeJeu.setState({ pc: [], echange: null,
    renommer: (uid, texte) => modifier(r => actions.renommer(r, uid, texte)),
    basculerFavori: uid => modifier(r => actions.basculerFavori(r, uid)),
    relacher: uid => modifier(r => actions.relacher(r, uid)),
    envoyerAuPc: uid => modifier(r => actions.envoyerAuPc(r, uid)),
    placerDansEquipe: uid => modifier(r => actions.placerDansEquipe(r, uid), uid) });
});

function mettreAuPc(taille = 1) {
  storeJeu.setState({ pc: [pokemon], equipe: Array.from({ length: taille }, (_, i) => ({
    pokemon: { ...pokemon, uid: `equipe-${i}` }, dps: 42, xpMax: 100, multiplicateur: 2,
  })) });
}

it('affiche la fiche du PC avec XP calculée, DPS sans bonus de type et une seule action', () => {
  mettreAuPc();
  afficher();
  expect(screen.getByText('Dans le PC')).toBeTruthy();
  const detail = actions.detailDps(pokemon, 1);
  const dps = Object.values(detail).reduce((produit, facteur) => produit * facteur, 1);
  expect(screen.getByText(/ DPS$/).textContent).toBe(`${dps.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} DPS`);
  expect(screen.getByText(`30 / ${calculerMaxXp(pokemon.numero, pokemon.niveau)}`)).toBeTruthy();
  expect(screen.getByRole('button', { name: "Placer dans l'équipe" }).classList.contains('bg-action')).toBe(true);
  expect(screen.queryByRole('button', { name: 'Envoyer au PC' })).toBeNull();
  expect(screen.getAllByRole('button').filter(b => b.classList.contains('bg-action'))).toHaveLength(1);
});

it.each([1, 6])('place depuis le PC avec une équipe de %s et ferme la fiche', taille => {
  mettreAuPc(taille);
  afficher();
  fireEvent.click(screen.getByRole('button', { name: "Placer dans l'équipe" }));
  const etat = storeJeu.getState();
  if (taille === 6) {
    expect(etat.echange).toEqual({ uid: pokemon.uid, nom: 'Bourgeon' });
    expect(etat.pc).toContainEqual(pokemon);
  } else {
    expect(etat.equipe.some(c => c?.pokemon.uid === pokemon.uid)).toBe(true);
    expect(etat.pc).toHaveLength(0);
  }
  expect(screen.queryAllByRole('dialog')).toHaveLength(0);
  expect(document.activeElement).toBe(screen.getByText('Ouvre la fiche'));
});

it('envoie au PC depuis une équipe de deux et ferme la fiche', () => {
  afficher();
  expect(screen.queryByText('Dans le PC')).toBeNull();
  expect(screen.queryByText('Le PC arrive bientôt.')).toBeNull();
  expect(screen.getAllByRole('button').filter(b => b.classList.contains('bg-action'))).toHaveLength(1);
  fireEvent.click(screen.getByRole('button', { name: 'Envoyer au PC' }));
  expect(storeJeu.getState().pc).toContainEqual(pokemon);
  expect(storeJeu.getState().equipe.some(c => c?.pokemon.uid === pokemon.uid)).toBe(false);
  expect(screen.queryAllByRole('dialog')).toHaveLength(0);
});

it.each([false, true])('interdit l’envoi du dernier Pokémon actif (œuf : %s)', oeuf => {
  const equipe = storeJeu.getState().equipe;
  storeJeu.setState({ equipe: oeuf ? [equipe[0]!, { ...equipe[1]!, pokemon: {
    ...pokemon, uid: 'oeuf', oeuf: { pasRestants: 10, pasMax: 10 },
  } }] : [equipe[0]!] });
  afficher();
  const envoyer = screen.getByRole('button', { name: 'Envoyer au PC' });
  expect(envoyer.hasAttribute('disabled')).toBe(true);
  expect(document.getElementById(envoyer.getAttribute('aria-describedby')!)?.textContent).toBe(oeuf
    ? "Il faut au moins 1 Pokémon actif dans l'équipe." : "C'est ton dernier Pokémon : garde-le dans l'équipe.");
});

it('relâche un Pokémon du PC malgré une équipe d’un seul', () => {
  mettreAuPc();
  afficher();
  fireEvent.click(screen.getByRole('button', { name: 'Relâcher' }));
  fireEvent.click(screen.getByRole('button', { name: 'Relâche définitivement' }));
  expect(storeJeu.getState().pc).toHaveLength(0);
  expect(storeJeu.getState().equipe).toHaveLength(1);
  expect(screen.queryAllByRole('dialog')).toHaveLength(0);
});

it('renomme et bascule le favori dans le PC par uid', () => {
  mettreAuPc();
  afficher();
  fireEvent.click(screen.getByRole('button', { name: 'Renommer Bourgeon' }));
  const champ = screen.getByRole('textbox', { name: 'Surnom' }) as HTMLInputElement;
  fireEvent.change(champ, { target: { value: 'Pousse' } });
  fireEvent.submit(champ.form!);
  fireEvent.click(screen.getByRole('button', { name: 'Ajoute aux favoris' }));
  expect(storeJeu.getState().pc[0]).toEqual({ ...pokemon, surnom: 'Pousse', favori: true });
  expect(storeJeu.getState().equipe[0]?.pokemon.surnom).toBe('Bourgeon');
  expect(screen.getByRole('heading', { name: 'Pousse' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Retire des favoris' }).getAttribute('aria-pressed')).toBe('true');
});

it.each(['envoyerAuPc', 'placerDansEquipe'] as const)('affiche le refus du store pour %s', action => {
  if (action === 'placerDansEquipe') mettreAuPc();
  afficher();
  vi.spyOn(storeJeu.getState(), action).mockReturnValue('Déplacement refusé.');
  fireEvent.click(screen.getByRole('button', { name: action === 'envoyerAuPc' ? 'Envoyer au PC' : "Placer dans l'équipe" }));
  expect(screen.getByRole('alert').textContent).toBe('Déplacement refusé.');
  expect(screen.getAllByRole('dialog')).toHaveLength(1);
});

it('cherche dans l’équipe avant le PC pour un même uid', () => {
  storeJeu.setState({ pc: [{ ...pokemon, surnom: 'Dans le PC' }] });
  afficher();
  expect(screen.getByRole('heading', { name: 'Bourgeon' })).toBeTruthy();
  expect(screen.queryByText('Dans le PC')).toBeNull();
  expect(screen.getByText('42 DPS')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Envoyer au PC' }).hasAttribute('disabled')).toBe(false);
});
