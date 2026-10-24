// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { BarreTemps } from './BarreTemps';

afterEach(cleanup);

it.each([[30000, 30, '30 secondes'], [14501, 15, '15 secondes'], [1, 1, '1 seconde'], [0, 0, '0 secondes']])(
  'affiche %i ms en secondes arrondies au-dessus', (restantMs, secondes, texte) => {
    render(<BarreTemps restantMs={restantMs} totalMs={30000} />);
    const barre = screen.getByRole('progressbar', { name: 'Temps restant' });
    expect(barre.getAttribute('aria-valuemin')).toBe('0');
    expect(barre.getAttribute('aria-valuemax')).toBe('30');
    expect(barre.getAttribute('aria-valuenow')).toBe(String(secondes));
    expect(barre.getAttribute('aria-valuetext')).toBe(texte);
    expect(screen.getByText('Temps')).toBeTruthy();
    expect(screen.getByText(texte).className).toContain('tabular-nums');
    expect(barre.className).toContain('bg-fond');
    const remplissage = barre.firstElementChild as HTMLElement;
    expect(remplissage.className).toContain('bg-alerte-base');
    expect(remplissage.className).toContain('barre-pv');
    expect(remplissage.style.transform).toBe(`scaleX(${restantMs / 30000})`);
  });
