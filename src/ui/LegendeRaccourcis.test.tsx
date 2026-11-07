// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { LegendeRaccourcis } from './LegendeRaccourcis';
import { storeJeu } from './store';

const initial = storeJeu.getState();
afterEach(() => { cleanup(); storeJeu.setState(initial); });
it('ne propose les outils que lorsqu’ils sont possédés', () => {
  storeJeu.setState({ fauchage: { ...initial.fauchage, possede: false }, radar: false });
  const { rerender } = render(<LegendeRaccourcis page="Combat" />);
  expect(screen.queryByText('Fauchage', { exact: false })).toBeNull();
  expect(screen.queryByText('Radar', { exact: false })).toBeNull();
  act(() => storeJeu.setState({ fauchage: { ...initial.fauchage, possede: true }, radar: true }));
  expect(screen.getByText('Fauchage', { exact: false })).toBeTruthy();
  expect(screen.getByText('Radar', { exact: false })).toBeTruthy();
  rerender(<LegendeRaccourcis page="PC" />);
  expect(screen.getByText('Chercher', { exact: false })).toBeTruthy();
  expect(screen.queryByText('Attaquer', { exact: false })).toBeNull();
  rerender(<LegendeRaccourcis page="Menu" />);
  expect(screen.queryByText('Chercher', { exact: false })).toBeNull();
  expect(screen.getByText('Naviguer', { exact: false })).toBeTruthy();
});
