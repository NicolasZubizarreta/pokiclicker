// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { InvitationInstallation } from './InvitationInstallation';

beforeEach(() => {
  vi.useFakeTimers(); localStorage.clear();
  vi.stubGlobal('matchMedia', vi.fn(() => ({ matches: false })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.useRealTimers(); });
function proposer() {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt, userChoice: Promise.resolve({ outcome: 'accepted' }),
  });
  act(() => { window.dispatchEvent(event); vi.advanceTimersByTime(20000); });
  return { prompt, event };
}
it('attend puis propose et appelle l’installation', async () => {
  render(<InvitationInstallation />);
  expect(screen.queryByRole('status')).toBeNull();
  const { prompt, event } = proposer();
  expect(event.defaultPrevented).toBe(true);
  await act(async () => { fireEvent.click(screen.getByText('Installer')); });
  expect(prompt).toHaveBeenCalledOnce();
  expect(screen.queryByRole('status')).toBeNull();
});
it('mémorise Plus tard entre les affichages', () => {
  const vue = render(<InvitationInstallation />); proposer();
  fireEvent.click(screen.getByText('Plus tard')); vue.unmount();
  render(<InvitationInstallation />); proposer();
  expect(screen.queryByRole('status')).toBeNull();
});
it('reste masquée en mode autonome', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: true }));
  render(<InvitationInstallation />); proposer();
  expect(screen.queryByRole('status')).toBeNull();
});
it('explique l’installation sur Safari iOS en production', () => {
  vi.stubEnv('PROD', true);
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue('iPhone AppleWebKit Safari');
  render(<InvitationInstallation />);
  act(() => vi.advanceTimersByTime(20000));
  expect(screen.getByText(/touche Partager/)).toBeTruthy();
  fireEvent.click(screen.getByText('Compris'));
  expect(screen.queryByRole('status')).toBeNull();
});
it('attend la fermeture du toast de mise à jour', async () => {
  const vue = render(<><aside className="toast" role="status">Mise à jour</aside><InvitationInstallation /></>);
  proposer(); expect(screen.queryByText('Installer')).toBeNull();
  await act(async () => { vue.rerender(<InvitationInstallation />); });
  proposer(); expect(screen.getByText('Installer')).toBeTruthy();
});
