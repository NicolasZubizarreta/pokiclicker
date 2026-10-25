// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useRef, useState } from 'react';
import * as actions from '../core/equipe';
import type { DonneesRegion, PokemonPossede } from '../core/sauvegarde';
import { FichePokemon } from './FichePokemon';
import { storeJeu } from './store';

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

function Exemple() {
  const declencheur = useRef<HTMLButtonElement>(null);
  const [ouvert, ouvrir] = useState(false);
  return <><button ref={declencheur} onClick={() => ouvrir(true)}>Ouvre la fiche</button>
    <FichePokemon uid="fiche" ouvert={ouvert} fermer={() => ouvrir(false)} declencheur={declencheur} /></>;
}
function afficher() {
  const vue = render(<Exemple />);
  fireEvent.click(screen.getByText('Ouvre la fiche'));
  return vue;
}

it.each(['bouton', 'fond', 'Échap'])('ferme avec %s et restaure le focus', mode => {
  afficher();
  const dialogue = screen.getByRole('dialog', { name: 'Bourgeon' });
  if (mode === 'bouton') fireEvent.click(screen.getByText('Ferme la fiche'));
  if (mode === 'fond') fireEvent.pointerDown(dialogue);
  if (mode === 'Échap') fireEvent(dialogue, new Event('cancel', { cancelable: true }));
  expect(dialogue.hasAttribute('open')).toBe(false);
  expect(document.activeElement).toBe(screen.getByText('Ouvre la fiche'));
});

it('renomme avec validation du cœur, compteur et en-tête réactif', () => {
  afficher();
  const champ = screen.getByRole('textbox', { name: 'Surnom' });
  expect(champ.hasAttribute('maxlength')).toBe(false);
  for (const texte of ['abcdefghijklm', '']) {
    fireEvent.change(champ, { target: { value: texte } });
    fireEvent.click(screen.getByText('Renommer'));
    expect(screen.getByRole('alert').textContent).toBe('Entre un nom de 1 à 12 caractères.');
  }
  fireEvent.change(champ, { target: { value: 'abcdefghijkl' } });
  expect(screen.getByText('12 / 12 caractères')).toBeTruthy();
  fireEvent.click(screen.getByText('Renommer'));
  expect(storeJeu.getState().equipe[0]?.pokemon.surnom).toBe('abcdefghijkl');
  expect(screen.getByRole('heading', { name: 'abcdefghijkl' })).toBeTruthy();
  expect(screen.getByText('Bulbizarre · N° 1 · Niveau 16')).toBeTruthy();
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
  expect(screen.getByRole('button', { name: 'Envoyer au PC' }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByText('Le PC arrive bientôt.')).toBeTruthy();
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
  expect(screen.getByText("C'est ton dernier Pokémon : garde-le dans l'équipe.")).toBeTruthy();
});

it('garde la confirmation ouverte si le store refuse', () => {
  afficher();
  fireEvent.click(screen.getByText('Relâcher'));
  vi.spyOn(storeJeu.getState(), 'relacher').mockReturnValue('Relâchement refusé.');
  fireEvent.click(screen.getByText('Relâche définitivement'));
  expect(screen.getByRole('alert').textContent).toBe('Relâchement refusé.');
  expect(screen.getAllByRole('dialog')).toHaveLength(2);
});
