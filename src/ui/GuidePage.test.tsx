// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { guide } from '../core/guide';
import { GuidePage } from './GuidePage';

afterEach(cleanup);

it('présente le guide avec une seule section ouverte et des cibles tactiles', () => {
  const retour = vi.fn();
  const { container } = render(<GuidePage retour={retour} />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(guide.titre);
  const summaries = container.querySelectorAll('summary');
  const details = container.querySelectorAll('details');
  expect(summaries).toHaveLength(guide.sections.length);
  expect(details[0]!.open).toBe(true);
  expect(Array.from(details).filter(detail => detail.open)).toHaveLength(1);
  fireEvent.click(summaries[1]!);
  expect(details[0]!.open).toBe(false);
  expect(details[1]!.open).toBe(true);
  fireEvent.click(summaries[1]!);
  expect(Array.from(details).filter(detail => detail.open)).toHaveLength(0);
  for (const cible of container.querySelectorAll('summary, button')) {
    expect(cible.classList.contains('min-h-11')).toBe(true);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(retour).toHaveBeenCalledOnce();
});
