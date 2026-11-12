// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { registreSucces } from '../core/succes';
import { creerHorlogeSimulee } from '../core/clock';
import { creerStockageMemoire } from '../core/sauvegarde';
import { creerStoreJeu } from './store';
import { CollectionEclosions } from './CollectionEclosions';

afterEach(cleanup);
function preparer(n: number, succes: string[] = []) {
  const store = creerStoreJeu({ horloge: creerHorlogeSimulee(), stockage: creerStockageMemoire(), alea: () => 0, genererId: () => 'test' });
  store.setState(e => ({ pension: { ...e.pension, especesEcloses: Array.from({ length: n }, (_, i) => i + 1) }, compte: { ...e.compte, succes } }));
  return store;
}
it.each([0, 9, 10, 50, 151])('affiche le compteur et les quatre paliers pour %i espèces', n => {
  render(<CollectionEclosions store={preparer(n)} />);
  expect(screen.getByText(`${n}/151`)).toBeTruthy();
  const paliers = registreSucces.filter(p => p.mesure === 'eclosions');
  const prochain = paliers.find(p => p.seuil > n);
  for (const p of paliers) {
    const carte = screen.getByText(p.nom).closest('li')!;
    expect(within(carte).getByText(p.seuil <= n ? 'Obtenu' : p === prochain ? `Prochain · encore ${p.seuil - n}` : 'Verrouillé')).toBeTruthy();
    expect(within(carte).getByLabelText(`+${p.diamants} diamants`)).toBeTruthy();
  }
  if (prochain) {
    expect(screen.getByRole('progressbar').getAttribute('aria-valuenow')).toBe(String(n));
    expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe(String(prochain.seuil));
  } else expect(screen.getByText('Collection complète.')).toBeTruthy();
});
it('respecte les succès déjà crédités au compte', () => {
  render(<CollectionEclosions store={preparer(0, ['eclosions-10'])} />);
  expect(within(screen.getByText('Éleveur débutant').closest('li')!).getByText('Obtenu')).toBeTruthy();
  expect(screen.getByRole('progressbar').getAttribute('aria-valuemax')).toBe('50');
});
it('cache les noms inconnus, charge les sprites paresseusement et filtre la grille', () => {
  render(<CollectionEclosions store={preparer(1)} />);
  const eclos = screen.getByLabelText('Bulbizarre, éclos');
  const inconnu = screen.getByLabelText('N° 025, pas encore éclos');
  expect(eclos.querySelector('img')?.className).not.toContain('brightness-0');
  expect(inconnu.querySelector('img')?.className).toContain('brightness-0');
  expect(inconnu.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  expect(screen.queryByText('Pikachu')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Écloses (1)' }));
  expect(screen.queryByLabelText('N° 025, pas encore éclos')).toBeNull();
  expect(screen.getByRole('button', { name: 'Écloses (1)' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'À trouver (150)' }));
  expect(screen.queryByLabelText('Bulbizarre, éclos')).toBeNull();
  expect(screen.getByLabelText('N° 025, pas encore éclos')).toBeTruthy();
});
