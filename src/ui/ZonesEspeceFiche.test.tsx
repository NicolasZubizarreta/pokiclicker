// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { zonesDeEspece } from '../core/zones-espece';
import { Pokedex } from './Pokedex';
import { storeJeu } from './store';
import { ZonesEspeceFiche } from './ZonesEspeceFiche';
afterEach(cleanup);

const tous = Array.from({ length: 151 }, (_, i) => i + 1);
const avec = (garde: (r: ReturnType<typeof zonesDeEspece>) => boolean) =>
  tous.find(n => garde(zonesDeEspece(n)))!;

function ouvrir(numero: number, etat: { pokedex: number[]; vus: number[] }) {
  storeJeu.setState(etat);
  render(<Pokedex retour={() => {}} />);
  fireEvent.change(screen.getByRole('searchbox'), { target: { value: String(numero) } });
  fireEvent.click(screen.getByRole('button', { name: new RegExp(`numéro ${numero}(,|$)`) }));
}

it('liste les zones d\'une espèce capturée, tirées des données', () => {
  const numero = avec(r => r.zones.length > 0 && r.via === null);
  ouvrir(numero, { pokedex: [numero], vus: [numero] });
  for (const zone of zonesDeEspece(numero).zones) expect(screen.getAllByText(zone.nom).length).toBeGreaterThan(0);
  expect(screen.queryByText(/Via l'évolution/)).toBeNull();
});

it('affiche les zones d\'une espèce vue, avec la mention d\'évolution quand elle est introuvable', () => {
  const numero = avec(r => r.via !== null);
  ouvrir(numero, { pokedex: [], vus: [numero] });
  expect(screen.getByText(/Via l'évolution de/)).toBeTruthy();
  for (const zone of zonesDeEspece(numero).zones) expect(screen.getAllByText(zone.nom).length).toBeGreaterThan(0);
});

it('dit qu\'une espèce est introuvable en zone', () => {
  // Aucune des 151 espèces n'est dans ce cas aujourd'hui : on teste le composant avec un numéro absent des données.
  render(<ZonesEspeceFiche numero={999} />);
  expect(screen.getByText(/Introuvable en zone/)).toBeTruthy();
});

it('ne révèle aucune zone pour une espèce jamais vue', () => {
  const numero = avec(r => r.zones.length > 0);
  ouvrir(numero, { pokedex: [], vus: [] });
  expect(screen.queryByText('Où le trouver')).toBeNull();
  expect(screen.queryByLabelText('Où le trouver')).toBeNull();
  for (const zone of zonesDeEspece(numero).zones) expect(screen.queryByText(zone.nom)).toBeNull();
});
