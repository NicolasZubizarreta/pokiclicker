// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { guide } from '../core/guide';
import { GuidePage } from './GuidePage';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it('présente le guide avec une seule section ouverte et des cibles tactiles', () => {
  const retour = vi.fn();
  const { container } = render(<GuidePage retour={retour} />);
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(guide.titre);
  const summaries = screen.getByRole('navigation').querySelectorAll('button');
  expect(summaries).toHaveLength(guide.sections.length + 1);
  expect(summaries[0]!.getAttribute('aria-current')).toBe('true');
  expect(container.querySelectorAll('article')).toHaveLength(1);
  fireEvent.click(summaries[1]!);
  expect(summaries[0]!.getAttribute('aria-current')).toBe('false');
  expect(summaries[1]!.getAttribute('aria-current')).toBe('true');
  expect(screen.getByRole('article').textContent).toContain(guide.sections[1]!.paragraphes[0]);
  fireEvent.click(summaries[1]!);
  expect(container.querySelectorAll('article')).toHaveLength(0);
  for (const cible of container.querySelectorAll('summary, button')) {
    expect(cible.classList.contains('min-h-11') || cible.classList.contains('min-h-12')).toBe(true);
  }
  fireEvent.click(screen.getByRole('button', { name: 'Retour au menu' }));
  expect(retour).toHaveBeenCalledOnce();
});

it('ajoute Types en dernière position sur PC', () => {
  render(<GuidePage retour={vi.fn()} />);
  const boutons = screen.getByRole('navigation').querySelectorAll('button');
  expect(boutons[boutons.length - 1]!.textContent).toContain('Types');
  fireEvent.click(boutons[boutons.length - 1]!);
  expect(screen.getByRole('table')).toBeTruthy();
});

it('ouvre Types sur téléphone sans accordéons imbriqués', () => {
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })));
  const { container } = render(<GuidePage retour={vi.fn()} />);
  const sections = container.querySelectorAll('details');
  expect(sections).toHaveLength(guide.sections.length + 1);
  const derniere = sections[sections.length - 1]!;
  fireEvent.click(derniere.querySelector('summary')!);
  expect(derniere.open).toBe(true);
  expect(derniere.querySelectorAll('button')).toHaveLength(17);
  expect(derniere.querySelectorAll('details')).toHaveLength(0);
  for (const cible of container.querySelectorAll('summary, button')) {
    expect(cible.classList.contains('min-h-11') || cible.classList.contains('min-h-12')).toBe(true);
  }
});
