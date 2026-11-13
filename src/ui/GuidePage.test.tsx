// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { tutoriels } from '../core/tutoriels';
import { GuidePage } from './GuidePage';
import { lancerTuto } from './tuto/store-tuto';
vi.mock('./useTelephone', () => ({ useTelephone: () => true }));
vi.mock('./tuto/store-tuto', () => ({ lancerTuto: vi.fn() }));
afterEach(cleanup);
it('liste les huit tutoriels et permet leur rejeu', () => {
  render(<GuidePage retour={vi.fn()} />);
  const nav = screen.queryByRole('navigation', { name: 'Sections du guide' });
  if (nav) fireEvent.click(within(nav).getByRole('button', { name: 'Tutoriels' }));
  const section = within(screen.getByRole('region', { name: 'Tutoriels' }));
  const boutons = section.getAllByRole('button', { name: 'Rejouer le tuto' });
  expect(boutons).toHaveLength(8);
  tutoriels.forEach((t, i) => {
    expect(section.getByText(t.titre)).toBeTruthy();
    fireEvent.click(boutons[i]!); expect(lancerTuto).toHaveBeenLastCalledWith(t.id, true);
  });
});
