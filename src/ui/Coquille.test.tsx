// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { Coquille } from './Coquille';
import { storeJeu } from './store';

afterEach(cleanup);
const noms = ['Combat', 'Équipe', 'Shop', 'Carte', 'Plus'];

describe('Coquille', () => {
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
      expect(within(screen.getByRole('main')).getByRole('heading').textContent).toBe(nom);
      if (nom === 'Carte') expect(screen.getByRole('button', { name: 'Route 1 (Zone 1)' })).toBeTruthy();
      else expect(screen.getByText('Cette page arrive bientôt.')).toBeTruthy();
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
      const parcours = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
      while (parcours.nextNode()) {
        const texte = parcours.currentNode.textContent?.trim();
        const textesCarte = new Set(['Sélectionne une zone.', ...storeJeu.getState().carte.formes.map(f =>
          f.numero === null || f.numero === 0 ? f.nom : `${f.nom} (Zone ${f.numero})`)]);
        if (texte) expect(autorises.has(texte) || textesCarte.has(texte), texte).toBe(true);
      }
      for (const element of container.querySelectorAll('[aria-label]')) {
        const forme = storeJeu.getState().carte.formes.find(f => f.nom === element.getAttribute('data-forme'));
        const attendu = forme ? (forme.numero === null || forme.numero === 0 ? forme.nom : `${forme.nom} (Zone ${forme.numero})`)
          : element.tagName.toLowerCase() === 'svg' ? 'Carte de Kanto' : 'Navigation principale';
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
