// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { CarteDresseur } from './CarteDresseur';
import { storeJeu } from './store';
vi.mock('./carte-dresseur', () => ({ genererCarte: vi.fn(async () => new Blob(['image'], { type: 'image/png' })) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it('choisit un titre obtenu, désactive les autres et masque le partage indisponible', async () => {
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:carte', revokeObjectURL: vi.fn() });
  storeJeu.setState(s => ({ suivi: { ...s.suivi, titre: 'invalide', capturesShiny: 1 } }));
  const choisir = vi.spyOn(storeJeu.getState(), 'choisirTitre');
  render(<CarteDresseur retour={vi.fn()} />);
  expect((screen.getByLabelText('Titre') as HTMLSelectElement).value).toBe('dresseur');
  expect((screen.getByRole('option', { name: 'Marathonien' }) as HTMLOptionElement).disabled).toBe(true);
  fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'chromatiques' } });
  expect(choisir).toHaveBeenCalledWith('chromatiques');
  await screen.findByRole('link', { name: 'Télécharger' });
  expect(screen.queryByRole('button', { name: 'Partager' })).toBeNull();
});
it('propose le partage si les fichiers sont pris en charge', async () => {
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:carte', revokeObjectURL: vi.fn() });
  const share = vi.fn(async () => {});
  Object.defineProperties(navigator, { canShare: { configurable: true, value: () => true }, share: { configurable: true, value: share } });
  render(<CarteDresseur retour={vi.fn()} />);
  fireEvent.click(await screen.findByRole('button', { name: 'Partager' }));
  expect(share).toHaveBeenCalled();
});
