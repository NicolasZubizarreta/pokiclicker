import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { chargerRegion } from './composition-root';

const { ContexteRegion, useRegion } = await vi.importActual<typeof import('./ContexteRegion')>('./ContexteRegion');

function Identifiant() {
  return createElement('span', null, useRegion().id);
}

describe('ContexteRegion', () => {
  it('donne la région fournie', async () => {
    const region = await chargerRegion('kanto');
    const html = renderToString(createElement(ContexteRegion.Provider, { value: region }, createElement(Identifiant)));
    expect(html).toContain('kanto');
  });

  it('refuse de fonctionner sans région', () => {
    expect(() => renderToString(createElement(Identifiant))).toThrow('Aucune région fournie');
  });
});
