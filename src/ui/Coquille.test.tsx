// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Coquille } from './Coquille';
import { creerStoreJeu, storeJeu } from './store';
import { chargerPokemon } from '../core/pokemon';
import { formaterDps } from './nombres';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));
vi.mock('./store', async (importOriginal) => ({
  ...await importOriginal<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

function nouvellePartie() {
  contexte.store = creerStoreJeu({
    horloge: { maintenant: () => 0 },
    stockage: {
      lire: cle => localStorage.getItem(cle),
      ecrire: (cle, valeur) => localStorage.setItem(cle, valeur),
      supprimer: cle => localStorage.removeItem(cle),
      cles: () => Object.keys(localStorage),
    },
    alea: () => 0.5,
    genererId: () => 'test-coquille',
  });
}

beforeEach(() => { localStorage.clear(); nouvellePartie(); });

afterEach(() => {
  cleanup();
  localStorage.clear();
});
const noms = ['Combat', 'Équipe', 'Shop', 'Carte', 'Plus'];

describe('Coquille', () => {
  it('ne signale plus Carte à Bourg Palette après un boss vaincu', () => {
    const { unmount } = render(<Coquille />);
    unmount();
    const cle = Object.keys(localStorage).find(cle => cle.startsWith('pokiclicker:region:') && cle.endsWith(':kanto'))!;
    const sauvegarde = JSON.parse(localStorage.getItem(cle)!);
    sauvegarde.donnees.bossVaincus = ['kanto.route-1'];
    localStorage.setItem(cle, JSON.stringify(sauvegarde));
    nouvellePartie();
    render(<Coquille />);
    act(() => storeJeu.getState().allerVers('kanto.bourg-palette'));
    expect(storeJeu.getState().carte.tutorielRoute1).toBe(false);
    const carte = screen.getByRole('button', { name: 'Carte' });
    expect(carte.hasAttribute('data-signal')).toBe(false);
    expect(carte.classList.contains('rebond-signal')).toBe(false);
  });

  it('signale seulement Carte à Bourg Palette avant le premier boss', () => {
    const { container } = render(<Coquille />);
    act(() => storeJeu.getState().allerVers('kanto.bourg-palette'));
    const carte = screen.getByRole('button', { name: 'Carte' });
    expect(carte.getAttribute('data-signal')).toBe('true');
    expect(carte.classList.contains('ring-4')).toBe(true);
    expect(carte.classList.contains('ring-succes-base')).toBe(true);
    expect(carte.classList.contains('rebond-signal')).toBe(true);
    expect(container.querySelectorAll('[data-signal="true"]')).toHaveLength(1);
  });

  it('éteint le signal en quittant Bourg Palette pour la Route 1', () => {
    render(<Coquille />);
    act(() => storeJeu.getState().allerVers('kanto.bourg-palette'));
    expect(screen.getByRole('button', { name: 'Carte' }).getAttribute('data-signal')).toBe('true');
    act(() => storeJeu.getState().allerVers('kanto.route-1'));
    expect(screen.getByRole('button', { name: 'Carte' }).hasAttribute('data-signal')).toBe(false);
  });

  it('éteint le signal quand on ouvre Carte', async () => {
    const utilisateur = userEvent.setup();
    render(<Coquille />);
    act(() => storeJeu.getState().allerVers('kanto.bourg-palette'));
    const carte = screen.getByRole('button', { name: 'Carte' });
    expect(carte.getAttribute('data-signal')).toBe('true');
    await utilisateur.click(carte);
    expect(carte.hasAttribute('data-signal')).toBe(false);
    expect(carte.classList.contains('rebond-signal')).toBe(false);
  });

  it('présente les cinq destinations dans l’ordre et active seulement Combat', () => {
    render(<Coquille />);
    const boutons = within(screen.getByRole('navigation')).getAllByRole('button');
    expect(boutons.map((bouton) => bouton.textContent)).toEqual(noms);
    expect(boutons.filter((bouton) => bouton.getAttribute('aria-current') === 'page')).toEqual([boutons[0]]);
    expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 }).textContent).toBe('Route 1');
    expect(screen.getByRole('button', { name: /^Attaquer / })).toBeTruthy();
  });

  it('change de page et déplace la sélection au clic', async () => {
    const utilisateur = userEvent.setup();
    render(<Coquille />);
    for (const nom of noms.slice(1)) {
      await utilisateur.click(screen.getByRole('button', { name: nom }));
      expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 }).textContent).toBe(nom === 'Équipe' ? 'Ton équipe' : nom);
      if (nom === 'Carte') expect(screen.getByRole('button', { name: 'Route 1 (Zone 1)' })).toBeTruthy();
      else if (nom === 'Équipe') {
        expect(screen.queryByText('Cette page arrive bientôt.')).toBeNull();
        expect(screen.getAllByRole('listitem')).toHaveLength(6);
      } else expect(screen.getByText('Cette page arrive bientôt.')).toBeTruthy();
      expect(screen.getAllByRole('button').filter((bouton) => bouton.hasAttribute('aria-current')))
        .toEqual([screen.getByRole('button', { name: nom })]);
    }
  });

  it('place le lien d’évitement puis les cinq boutons dans le parcours clavier', async () => {
    const utilisateur = userEvent.setup();
    render(<Coquille />);
    for (const element of [screen.getByRole('link', { name: 'Aller au contenu' }), ...screen.getAllByRole('button').filter(b => !b.hasAttribute('disabled'))]) {
      await utilisateur.tab();
      expect(document.activeElement).toBe(element);
    }
  });

  it('change de région par attribut sans modifier la structure ni les classes', () => {
    const { container, rerender } = render(<Coquille />);
    const racine = container.firstElementChild!;
    expect(racine.getAttribute('data-region')).toBe('kanto');
    expect(racine.getAttribute('data-theme')).toBe('dark');
    const navigation = screen.getByRole('navigation').outerHTML;
    const structure = racine.innerHTML;
    rerender(<Coquille region="johto" />);
    expect(container.firstElementChild!.getAttribute('data-region')).toBe('johto');
    expect(screen.getByRole('navigation').outerHTML).toBe(navigation);
    expect(container.firstElementChild!.innerHTML).toBe(structure);
  });

  it('emploie les textes français prévus et masque les icônes aux lecteurs d’écran', async () => {
    const utilisateur = userEvent.setup();
    const { container } = render(<Coquille />);
    const autorises = new Set(['Aller au contenu', ...noms, 'Cette page arrive bientôt.']);
    for (const nom of noms.slice(1)) {
      await utilisateur.click(screen.getByRole('button', { name: nom }));
      const equipe = storeJeu.getState().equipe;
      const nomPokemon = (c: NonNullable<typeof equipe[number]>) => c.pokemon.surnom ?? chargerPokemon().parNumero(c.pokemon.numero).nom;
      const premier = equipe.find(c => c)!;
      if (nom === 'Équipe') {
        const cases = equipe.map(c => c ? `${nomPokemon(c)}Niv. ${c.pokemon.niveau}${formaterDps(c.dps)} DPS` : 'Emplacement libre').join('');
        const xp = premier.xpMax === 0 ? 'MAX' : `${premier.pokemon.xp} / ${premier.xpMax} XP`;
        expect(screen.getByRole('main').textContent).toBe(`Ton équipe${formaterDps(storeJeu.getState().dps)} DPS · ${equipe.filter(Boolean).length} / 6${cases}${nomPokemon(premier)}Niv. ${premier.pokemon.niveau}${xp}${formaterDps(premier.dps)} DPSOuvre la fiche`);
      }
      const parcours = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      while (parcours.nextNode()) {
        const texte = parcours.currentNode.textContent?.trim();
        // Le texte entier de la page Équipe est vérifié exactement ci-dessus.
        if (nom === 'Équipe' && parcours.currentNode.parentElement?.closest('main')) continue;
        const voyage = parcours.currentNode.parentElement?.closest('section')?.querySelector('h2')?.textContent === 'Ton voyage';
        if (voyage) {
          // Les fragments de la barre « Ton voyage » (nombres, « badges sur ») sont vérifiés en bloc.
          expect(parcours.currentNode.parentElement?.closest('section')?.textContent).toMatch(/Ton voyage\d+ badges? sur \d+ · .+ en cours/);
          continue;
        }
        const textesCarte = new Set(['Ton voyage', 'Touche une zone pour la voir.', ...storeJeu.getState().carte.formes.map(f =>
          f.numero === null || f.numero === 0 ? f.nom : `${f.nom} (Zone ${f.numero})`)]);
        if (texte) expect(autorises.has(texte) || textesCarte.has(texte), texte).toBe(true);
      }
      for (const element of container.querySelectorAll('[aria-label]')) {
        const forme = storeJeu.getState().carte.formes.find(f => f.nom === element.getAttribute('data-forme'));
        const attendu = forme ? (forme.numero === null || forme.numero === 0 ? forme.nom : `${forme.nom} (Zone ${forme.numero})`)
          : element.tagName.toLowerCase() === 'svg' ? 'Carte de Kanto'
            : element.tagName.toLowerCase() === 'progress' ? 'Badges obtenus'
              : element.tagName.toLowerCase() === 'section' && ['Ton voyage', 'Zone sélectionnée'].includes(element.getAttribute('aria-label') ?? '')
                ? element.getAttribute('aria-label')
                : nom === 'Équipe' && element.tagName.toLowerCase() === 'button'
                  ? equipe.filter(c => c).map(c => `${nomPokemon(c!)}, niveau ${c!.pokemon.niveau}`).find(n => n === element.getAttribute('aria-label'))
                  : nom === 'Équipe' && element.getAttribute('role') === 'progressbar'
                    ? equipe.filter(c => c).map(c => `XP de ${nomPokemon(c!)}`).find(n => n === element.getAttribute('aria-label'))
                    : 'Navigation principale';
        expect(element.getAttribute('aria-label')).toBe(attendu);
      }
    }
    const icones = container.querySelectorAll('svg');
    expect(icones).toHaveLength(5);
    for (const icone of icones) {
      expect(icone.getAttribute('aria-hidden')).toBe('true');
      expect(icone.getAttribute('focusable')).toBe('false');
    }
  });
});
