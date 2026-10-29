// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { reglages } from '../core/reglages';
import { BoutonAction } from './BoutonAction';
import { AutoClic } from './icones';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('conserve le nom accessible, une icône décorative et l’état actif', () => {
  const onClick = vi.fn();
  render(<BoutonAction icone={<AutoClic />} nom="Auto-clic" actif onClick={onClick} />);
  const bouton = screen.getByRole('button', { name: 'Auto-clic' });
  expect(bouton.getAttribute('aria-pressed')).toBe('true');
  expect(bouton.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  expect(bouton.className).toContain('min-h-11 min-w-11');
  fireEvent.click(bouton);
  expect(onClick).toHaveBeenCalledOnce();
});

it('explique le verrou au toucher, au focus et au clic sans agir, pendant la durée réglée', () => {
  vi.useFakeTimers();
  const onClick = vi.fn();
  render(<BoutonAction icone={<AutoClic />} nom="Auto-clic" verrouille
    infobulle="Nécessite l'objet Restes" onClick={onClick} />);
  const bouton = screen.getByRole('button', { name: 'Auto-clic' });
  const infobulle = screen.getByRole('tooltip');
  expect(bouton.getAttribute('aria-disabled')).toBe('true');
  expect(bouton.hasAttribute('disabled')).toBe(false);
  expect(bouton.getAttribute('aria-describedby')).toBe(infobulle.id);
  expect(infobulle.textContent).toBe("Nécessite l'objet Restes");
  for (const interaction of [() => fireEvent.pointerDown(bouton), () => fireEvent.focus(bouton), () => fireEvent.click(bouton)]) {
    interaction();
    expect(infobulle.getAttribute('data-annonce')).toBe('true');
    act(() => vi.advanceTimersByTime(reglages.interface.annonceMs - 1));
    expect(infobulle.getAttribute('data-annonce')).toBe('true');
    act(() => vi.advanceTimersByTime(1));
    expect(infobulle.getAttribute('data-annonce')).toBe('false');
  }
  expect(onClick).not.toHaveBeenCalled();
});
