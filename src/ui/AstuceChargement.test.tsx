// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { chargerAstuces } from '../core/astuces';
import { AstuceChargement } from './AstuceChargement';

afterEach(cleanup);
it('affiche une astuce stable sans annonce vocale', () => {
  const vue = render(<AstuceChargement />);
  const texte = vue.container.textContent;
  expect(chargerAstuces()).toContain(texte);
  expect(vue.container.firstElementChild?.getAttribute('aria-live')).toBe('off');
  vue.rerender(<AstuceChargement />);
  expect(vue.container.textContent).toBe(texte);
});
