// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it, vi } from 'vitest';
import { ConfirmationObjet } from './ConfirmationObjet';

it('pose la question et transmet séparément la validation et l’annulation', async () => {
  const element = document.createElement('div');
  const root = createRoot(element);
  const valider = vi.fn();
  const annuler = vi.fn();
  try {
    await act(async () => root.render(<ConfirmationObjet objet="Pierre Foudre" nom="Pikachu" valider={valider} annuler={annuler} />));
    expect(element.textContent).toContain('Utiliser Pierre Foudre sur Pikachu ?');
    const boutons = element.querySelectorAll('button');
    expect(boutons).toHaveLength(2);
    const confirmer = boutons.item(0);
    const annulation = boutons.item(1);
    if (!confirmer || !annulation) throw new Error('Boutons de confirmation absents');
    expect(element.querySelectorAll('.bg-action')).toHaveLength(1);
    expect(confirmer.textContent).toBe('✓');
    expect(annulation.textContent).toBe('✗');
    expect(confirmer.getAttribute('aria-label')).toBe('Valider');
    expect(annulation.getAttribute('aria-label')).toBe('Annuler');
    for (const bouton of boutons) {
      expect(bouton.type).toBe('button');
      expect(bouton.className).toContain('min-h-11 min-w-11');
    }
    await act(async () => confirmer.click());
    expect(valider).toHaveBeenCalledTimes(1);
    expect(annuler).not.toHaveBeenCalled();
    await act(async () => annulation.click());
    expect(annuler).toHaveBeenCalledTimes(1);
    expect(valider).toHaveBeenCalledTimes(1);
  } finally {
    await act(async () => root.unmount());
  }
});
