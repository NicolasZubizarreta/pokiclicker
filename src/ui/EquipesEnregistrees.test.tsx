// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { suiviVide } from '../core/suivi';
import { storeJeu } from './store';
import { EquipesEnregistrees } from './EquipesEnregistrees';
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
it('affiche les emplacements, confirme le remplacement et applique une équipe', () => {
  const suivi = suiviVide(); suivi.equipes[0] = ['absent'];
  vi.spyOn(storeJeu, 'getState').mockReturnValue({ ...storeJeu.getState(), suivi, equipe: [], pc: [], enregistrerEquipe: vi.fn(() => null), appliquerEquipe: vi.fn(() => 'Indisponible') });
  render(<EquipesEnregistrees />);
  const a = within(screen.getByRole('region', { name: 'Équipe A' }));
  fireEvent.click(a.getByText('Enregistrer'));
  expect(storeJeu.getState().enregistrerEquipe).not.toHaveBeenCalled();
  fireEvent.click(a.getByText('Remplacer ?'));
  expect(storeJeu.getState().enregistrerEquipe).toHaveBeenCalledWith(0);
  fireEvent.click(a.getByText('Appliquer'));
  expect(storeJeu.getState().appliquerEquipe).toHaveBeenCalledWith(0);
  expect(screen.getByRole('status').textContent).toBe('Indisponible');
  expect(within(screen.getByRole('region', { name: 'Équipe B' })).getByText('Appliquer').hasAttribute('disabled')).toBe(true);
});

it('dit quels Pokémon ont été laissés de côté quand l’équipe est appliquée', () => {
  const suivi = suiviVide(); suivi.equipes[0] = ['absent'];
  const phrase = 'Équipe A appliquée, mais Bulbizarre n’est plus disponible.';
  vi.spyOn(storeJeu, 'getState').mockReturnValue({ ...storeJeu.getState(), suivi, equipe: [], pc: [],
    appliquerEquipe: vi.fn(() => null), avertissementEquipe: phrase });
  render(<EquipesEnregistrees />);
  fireEvent.click(within(screen.getByRole('region', { name: 'Équipe A' })).getByText('Appliquer'));
  expect(screen.getByRole('status').textContent).toBe(phrase);
});
