import { expect, it, vi } from 'vitest';
import { dessinerCarte } from './carte-dresseur';
it('dessine six cases et les mentions chromatiques', () => {
  const ctx = { fillRect: vi.fn(), strokeRect: vi.fn(), fillText: vi.fn() };
  dessinerCarte(ctx as unknown as CanvasRenderingContext2D, { nom: 'Nicolas', titre: 'Dresseur', equipe: [{ numero: 1, nom: 'Bulbizarre', niveau: 5, shiny: true }], chiffres: [] }, { surface: 'surface', texte: 'texte', accent: 'accent', bordure: 'bordure', police: 'police' });
  expect(ctx.strokeRect).toHaveBeenCalledTimes(7);
  expect(ctx.fillText).toHaveBeenCalledWith('Chromatique', expect.any(Number), expect.any(Number), 160);
});
