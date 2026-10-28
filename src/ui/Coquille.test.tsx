// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Coquille } from './Coquille';
import { creerStoreJeu, storeJeu } from './store';
import { chargerPokemon } from '../core/pokemon';
import { formaterDps } from './nombres';
import { reglages } from '../core/reglages';
import { creditPiste, musiques } from '../core/musiques';

const contexte = vi.hoisted(() => ({ store: null as unknown as typeof storeJeu }));
vi.mock('./store', async (importOriginal) => ({
  ...await importOriginal<typeof import('./store')>(),
  get storeJeu() { return contexte.store; },
}));

let maintenant = 0;
function nouvellePartie() {
  contexte.store = creerStoreJeu({
    horloge: { maintenant: () => maintenant },
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

beforeEach(() => { maintenant = 0; localStorage.clear(); nouvellePartie(); });

afterEach(() => {
  cleanup();
  localStorage.clear();
});
const noms = ['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Plus'];

it('affiche les crédits seulement lorsque fin.credits est vrai et rend la navigation inerte', () => {
  const montrer = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
  const clore = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function () { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function () { this.open = false; } });
  try {
    const { container, unmount } = render(<Coquille />);
    expect(container.querySelector('dialog.credits')).toBeNull();
    act(() => storeJeu.setState({ fin: { ...storeJeu.getState().fin, credits: true } }));
    expect(screen.getByRole('dialog', { name: 'POKÉ-CLICKER : KANTO ORIGINS' })).toBeTruthy();
    expect(container.querySelector('nav')?.hasAttribute('inert')).toBe(true);
    act(() => storeJeu.setState({ fin: { ...storeJeu.getState().fin, credits: false } }));
    expect(container.querySelector('dialog.credits')).toBeNull();
    unmount();
  } finally {
    if (montrer) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', montrer);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
    if (clore) Object.defineProperty(HTMLDialogElement.prototype, 'close', clore);
    else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

it('annonce un achat formaté au Shop et retire la notification expirée', () => {
  const { unmount } = render(<Coquille />);
  unmount();
  const cle = Object.keys(localStorage).find(cle => cle.startsWith('pokiclicker:region:') && cle.endsWith(':kanto'))!;
  const sauvegarde = JSON.parse(localStorage.getItem(cle)!);
  Object.assign(sauvegarde.donnees, { bossVaincus: ['kanto.route-1'], argent: 100000 });
  localStorage.setItem(cle, JSON.stringify(sauvegarde));
  nouvellePartie();
  render(<Coquille />);
  fireEvent.click(screen.getByRole('button', { name: 'Shop' }));
  const objet = storeJeu.getState().boutique.objets.find(o => !o.unique)!;
  const carte = within(screen.getByRole('heading', { name: objet.nom }).closest('article')!);
  for (let i = 1; i < 10; i++) fireEvent.click(carte.getByRole('button', { name: 'Plus' }));
  fireEvent.click(carte.getByRole('button', { name: 'Acheter ×10' }));
  // Les output de quantité ont aussi le rôle implicite status, nommé « Quantité ».
  expect(screen.getAllByRole('status', { name: '' })).toHaveLength(1);
  expect(screen.getByRole('status', { name: '' }).textContent).toBe(`${objet.nom} ×10 acheté. ${(objet.prix * 10).toLocaleString('fr-FR')} pièces dépensées.`);
  expect(screen.getByRole('status', { name: '' }).getAttribute('aria-live')).toBe('polite');
  expect(screen.getByRole('status', { name: '' }).classList.contains('absolute')).toBe(false);
  const message = screen.getByRole('status', { name: '' }).textContent;
  for (const page of ['Équipe', 'Combat', 'Shop']) {
    fireEvent.click(screen.getByRole('button', { name: page }));
    const notifications = document.querySelectorAll('[role="status"][aria-live="polite"]');
    expect(notifications).toHaveLength(1);
    expect(notifications[0]?.textContent).toBe(message);
  }
  act(() => {
    for (let ms = 0; ms < reglages.interface.annonceMs; ms += reglages.boucle.pasMs) {
      maintenant += reglages.boucle.pasMs;
      storeJeu.getState().tick();
    }
  });
  expect(screen.queryByRole('status', { name: '' })).toBeNull();
});

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

  it('présente les six destinations dans l’ordre et active seulement Combat', () => {
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
      expect(within(screen.getByRole('main')).getByRole('heading', { level: 1 }).textContent).toBe(nom === 'Équipe' ? 'Ton équipe' : nom === 'PC' ? 'PC de Léo' : nom);
      if (nom === 'PC') {
        // Fermé avant Argenta : l'entrée reste grisée mais s'ouvre et donne la raison (AD).
        expect(screen.getByText("Le PC de Léo s'ouvre à l'Arène d'Argenta.")).toBeTruthy();
        expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull();
      } else if (nom === 'Carte') expect(screen.getByRole('button', { name: 'Route 1 (Zone 1)' })).toBeTruthy();
      else if (nom === 'Équipe') {
        expect(screen.queryByText('Cette page arrive bientôt.')).toBeNull();
        // Six cases d'équipe, plus la Pokéball et le Bonbon que le Sac affiche toujours.
        expect(screen.getAllByRole('listitem')).toHaveLength(8);
      } else if (nom === 'Plus') {
        expect(screen.queryByText('Cette page arrive bientôt.')).toBeNull();
        expect(screen.queryByRole('button', { name: 'PC de Léo' })).toBeNull();
        expect(screen.getByRole('button', { name: /^Pokédex \d+ \/ 151$/ })).toBeTruthy();
      } else expect(screen.getByText("Le Shop s'ouvre à la Forêt de Jade.")).toBeTruthy();
      expect(screen.queryByText('Cette page arrive bientôt.')).toBeNull();
      expect(screen.getAllByRole('button').filter((bouton) => bouton.hasAttribute('aria-current')))
        .toEqual([screen.getByRole('button', { name: nom })]);
    }
  });

  it('revient au menu Plus après avoir quitté son onglet depuis une sous-page', async () => {
    const utilisateur = userEvent.setup();
    render(<Coquille />);
    await utilisateur.click(screen.getByRole('button', { name: 'Plus' }));
    await utilisateur.click(screen.getByRole('button', { name: /^Pokédex \d+ \/ 151$/ }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Pokédex');
    await utilisateur.click(screen.getByRole('button', { name: 'Shop' }));
    expect(screen.getByText("Le Shop s'ouvre à la Forêt de Jade.")).toBeTruthy();
    expect(screen.queryByText('Cette page arrive bientôt.')).toBeNull();
    await utilisateur.click(screen.getByRole('button', { name: 'Plus' }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Plus');
    expect(screen.queryByRole('button', { name: 'Retour' })).toBeNull();
  });

  it('grise l’entrée PC tant que le PC est fermé et la remet en couleur à son ouverture', () => {
    render(<Coquille />);
    const pc = screen.getByRole('button', { name: 'PC' });
    expect(pc.className).toContain('opacity-60');
    act(() => storeJeu.setState({ accesPc: { ouvert: true, raison: null } }));
    expect(screen.getByRole('button', { name: 'PC' }).className).not.toContain('opacity-60');
  });

  it('place le lien d’évitement puis les six boutons dans le parcours clavier', async () => {
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
    const { container: rendu } = render(<Coquille />);
    const container = document.createElement('div');
    act(() => {
      for (let ms = 0; ms < reglages.interface.annonceMs; ms += reglages.boucle.pasMs) {
        maintenant += reglages.boucle.pasMs;
        storeJeu.getState().tick();
      }
    });
    const autorises = new Set(['Aller au contenu', ...noms, "Le Shop s'ouvre à la Forêt de Jade.",
      'Ton aventure', 'Région', `Kanto · ${storeJeu.getState().lieu!.nom}`, 'Badges', '0 / 8', 'DPS',
      formaterDps(storeJeu.getState().dps), 'Prochain palier : 10 (Débutant) · Encore 7 espèces.',
      'PC de Léo', 'Pokédex', "Le PC de Léo s'ouvre à l'Arène d'Argenta.", 'Réglages', 'Son', 'Activé',
      'Musique', 'Activée', 'Volume des effets', 'Volume de la musique', 'Crédits des musiques', ...Object.values(musiques.pistes).map(creditPiste)]);
    for (const nom of noms.slice(1)) {
      await utilisateur.click(screen.getByRole('button', { name: nom }));
      const equipe = storeJeu.getState().equipe;
      const nomPokemon = (c: NonNullable<typeof equipe[number]>) => c.pokemon.surnom ?? chargerPokemon().parNumero(c.pokemon.numero).nom;
      const premier = equipe.find(c => c)!;
      if (nom === 'Équipe') {
        const cases = equipe.map(c => c ? `${nomPokemon(c)}Niv. ${c.pokemon.niveau}${formaterDps(c.dps)} DPS` : 'Emplacement libre').join('');
        const xp = premier.xpMax === 0 ? 'MAX' : `${premier.pokemon.xp} / ${premier.xpMax} XP`;
        expect(screen.getByRole('main').textContent).toBe(`Ton équipe${formaterDps(storeJeu.getState().dps)} DPS · ${equipe.filter(Boolean).length} / 6${cases}${nomPokemon(premier)}Niv. ${premier.pokemon.niveau}${xp}${formaterDps(premier.dps)} DPSOuvre la ficheTon SacToutBallesSoinsÉquipementPokéball×0Bonbon×0`);
      }
      // Prépare le balayage de la page visible sans la boîte fermée, montée en permanence.
      container.replaceChildren(rendu.cloneNode(true));
      container.querySelector('dialog:not([open])')?.remove();
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
        const textesCarte = new Set(['Ton voyage', ...storeJeu.getState().carte.formes.map(f =>
          f.numero === null || f.numero === 0 ? f.nom : `${f.nom} (Zone ${f.numero})`)]);
        if (texte) expect(autorises.has(texte) || textesCarte.has(texte) || (nom === 'Plus' && /^(\d+ \/ 151|\d+ %)$/.test(texte)), texte).toBe(true);
      }
      for (const element of container.querySelectorAll('[aria-label]')) {
        const forme = storeJeu.getState().carte.formes.find(f => f.nom === element.getAttribute('data-forme'));
        const attendu = forme ? (forme.numero === null || forme.numero === 0 ? forme.nom : `${forme.nom} (Zone ${forme.numero})`)
          : element.getAttribute('role') === 'listbox' ? 'Zones de Kanto'
            : element.getAttribute('role') === 'option'
              ? storeJeu.getState().carte.formes.map(f => f.numero === null || f.numero === 0 ? f.nom : `${f.nom} (Zone ${f.numero})`).find(n => n === element.getAttribute('aria-label'))
          : element.tagName.toLowerCase() === 'svg' ? 'Carte de Kanto'
            : element.tagName.toLowerCase() === 'progress' ? 'Badges obtenus'
              : element.tagName.toLowerCase() === 'section' && ['Ton voyage', 'Zone sélectionnée'].includes(element.getAttribute('aria-label') ?? '')
                ? element.getAttribute('aria-label')
                : nom === 'Équipe' && element.tagName.toLowerCase() === 'button'
                  ? equipe.filter(c => c).map(c => `${nomPokemon(c!)}, niveau ${c!.pokemon.niveau}`).find(n => n === element.getAttribute('aria-label'))
                  : nom === 'Équipe' && element.getAttribute('role') === 'progressbar'
                    ? equipe.filter(c => c).map(c => `XP de ${nomPokemon(c!)}`).find(n => n === element.getAttribute('aria-label'))
                    : 'Navigation principale';
        // Le Sac de l'onglet Équipe : région, filtre, liste et pastilles « <objet> ×n ».
        if (nom === 'Équipe' && ['Sac', 'Catégories', 'Objets du Sac', 'Pokéball ×0', 'Bonbon ×0'].includes(element.getAttribute('aria-label') ?? '')) continue;
        expect(element.getAttribute('aria-label')).toBe(attendu);
      }
    }
    const icones = container.querySelectorAll('svg');
    expect(icones).toHaveLength(6);
    for (const icone of icones) {
      expect(icone.getAttribute('aria-hidden')).toBe('true');
      expect(icone.getAttribute('focusable')).toBe('false');
    }
  });
});

it('pilote la boîte de badges selon les phases et rend le focus après fermeture', () => {
  const showModal = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'showModal');
  const close = Object.getOwnPropertyDescriptor(HTMLDialogElement.prototype, 'close');
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) {
    if (!this.open) return;
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  } });
  const { container } = render(<Coquille />);
  const fermer = vi.spyOn(storeJeu.getState(), 'fermerBoiteBadges');
  const declencheur = screen.getByRole('button', { name: 'Plus' });
  declencheur.focus();
  expect(screen.queryByRole('dialog')).toBeNull();
  act(() => { storeJeu.setState({ obtentionBadge: { id: 'roche', phase: 'message' } }); });
  expect(screen.queryByRole('dialog')).toBeNull();
  act(() => { storeJeu.setState({ obtentionBadge: { id: 'roche', phase: 'boite' } }); });
  const dialogue = screen.getByRole('dialog', { name: 'Boîte à badges' });
  const badge = within(dialogue).getByRole('button', { name: /^Badge Roche/ });
  expect(badge.classList.contains('opacity-0')).toBe(true);
  act(() => { storeJeu.setState({ obtentionBadge: { id: 'roche', phase: 'claque' } }); });
  expect(badge.classList.contains('badge-slam')).toBe(true);
  expect(badge.classList.contains('opacity-0')).toBe(false);
  act(() => { storeJeu.setState({ obtentionBadge: { id: 'roche', phase: 'fin' } }); });
  expect(badge.classList.contains('badge-slam')).toBe(false);
  fireEvent.click(within(dialogue).getByRole('button', { name: 'Fermer' }));
  expect(fermer).toHaveBeenCalledOnce();
  expect(storeJeu.getState().obtentionBadge).toBeNull();
  expect(document.activeElement).toBe(declencheur);
  expect(container.contains(dialogue)).toBe(true);
  if (showModal) Object.defineProperty(HTMLDialogElement.prototype, 'showModal', showModal);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  if (close) Object.defineProperty(HTMLDialogElement.prototype, 'close', close);
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
});
