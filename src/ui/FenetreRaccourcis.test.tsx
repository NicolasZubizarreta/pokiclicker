// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { FenetreRaccourcis } from './FenetreRaccourcis';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function Exemple() {
  const [ouvert, ouvrir] = useState(false);
  return <><button onClick={() => ouvrir(true)}>Ouvrir</button>{ouvert && <FenetreRaccourcis fermer={() => ouvrir(false)} />}</>;
}
it('ouvre une fenêtre modale, ferme sur annulation native et rend le focus', () => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    showModal: { configurable: true, value(this: HTMLDialogElement) { this.open = true; } },
    close: { configurable: true, value(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } },
  });
  render(<Exemple />);
  const ouvrir = screen.getByRole('button', { name: 'Ouvrir' });
  ouvrir.focus();
  fireEvent.click(ouvrir);
  const dialogue = screen.getByRole('dialog', { name: 'Raccourcis clavier' });
  expect((dialogue as HTMLDialogElement).open).toBe(true);
  expect(screen.getByRole('heading', { name: 'Combat' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Partout' })).toBeTruthy();
  fireEvent(dialogue, new Event('cancel', { cancelable: true }));
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(document.activeElement).toBe(ouvrir);
});
