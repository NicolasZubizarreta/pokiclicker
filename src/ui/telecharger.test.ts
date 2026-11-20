// @vitest-environment jsdom
import { expect, it, vi } from 'vitest';
import { telechargerTexte } from './telecharger';

it('télécharge le texte et libère le lien temporaire', () => {
  const creer = vi.fn(() => 'blob:export');
  const liberer = vi.fn();
  vi.stubGlobal('URL', { createObjectURL: creer, revokeObjectURL: liberer });
  const clic = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
    expect(this.download).toBe('compte.json');
    expect(this.href).toBe('blob:export');
    expect(this.isConnected).toBe(true);
  });
  try {
    telechargerTexte('compte.json', '{}');
    expect(creer).toHaveBeenCalledWith(expect.any(Blob));
    expect(clic).toHaveBeenCalledOnce();
    expect(liberer).toHaveBeenCalledWith('blob:export');
    expect(document.querySelector('a')).toBeNull();
  } finally { vi.restoreAllMocks(); vi.unstubAllGlobals(); }
});
