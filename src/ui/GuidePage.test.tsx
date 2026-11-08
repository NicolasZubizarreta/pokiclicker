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
  const summaries = screen.getByRole('navigation').querySelectorAll('button');
  expect(summaries).toHaveLength(guide.sections.length);
  expect(summaries[0]!.getAttribute('aria-current')).toBe('true');
  expect(container.querySelectorAll('article')).toHaveLength(1);
  fireEvent.click(summaries[1]!);
  expect(summaries[0]!.getAttribute('aria-current')).toBe('false');
  expect(summaries[1]!.getAttribute('aria-current')).toBe('true');
  expect(screen.getByRole('article').textContent).toContain(guide.sections[1]!.paragraphes[0]);
  fireEvent.click(summaries[1]!);
  expect(container.querySelectorAll('article')).toHaveLength(0);
  for (const cible of container.querySelectorAll('summary, button')) {
    expect(cible.classList.contains('min-h-11')).toBe(true);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(retour).toHaveBeenCalledOnce();
});
