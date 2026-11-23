// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createStore } from 'zustand/vanilla';
import { afterEach, expect, it, vi } from 'vitest';
import type { StoreJeu } from './store';
import { PageSafari } from './PageSafari';

afterEach(cleanup);
const visite = (extra = {}) => ({ pas: 20, balles: 10, captures: 1, rencontre: null, ...extra });
function magasin(etat: { safari?: Record<string, unknown>; argent?: number }, actions: Record<string, unknown> = {}) {
  return createStore(() => ({ argent: etat.argent ?? 20_000, safari: { acces: { ouvert: true, raison: null }, prix: 5000, visite: null, ...etat.safari },
    entrerAuSafari: vi.fn(() => ({ ok: true, message: 'Entrée payée.', fin: null })), avancerSafari: vi.fn(() => ({ ok: true, message: 'Rien.', fin: null })),
    lancerBalleSafari: vi.fn(() => ({ ok: true, message: 'Capturé !', fin: null })), jeterAppatSafari: vi.fn(), jeterRocheSafari: vi.fn(),
    quitterSafari: vi.fn(() => ({ ok: true, message: 'Tu quittes le parc.', fin: { captures: 2, raison: 'sortie' } })), ...actions })) as unknown as StoreJeu;
}

it('propose l\'entrée avec son prix, grisée sans assez d\'argent', () => {
  const { rerender } = render(<PageSafari retour={vi.fn()} store={magasin({ argent: 100 })} />);
  expect((screen.getByRole('button', { name: /Payer l’entrée/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(screen.getByText(/Il te manque 4\s?900/)).toBeTruthy();
  rerender(<PageSafari retour={vi.fn()} store={magasin({})} />);
  expect((screen.getByRole('button', { name: /Payer l’entrée/ }) as HTMLButtonElement).disabled).toBe(false);
});
it('paie l\'entrée et annonce le résultat', () => {
  const store = magasin({});
  render(<PageSafari retour={vi.fn()} store={store} />);
  fireEvent.click(screen.getByRole('button', { name: /Payer l’entrée/ }));
  expect(store.getState().entrerAuSafari).toHaveBeenCalled();
  expect(screen.getByRole('status').textContent).toBe('Entrée payée.');
});
it('pendant la visite : compteurs, avancer, puis les trois actions d\'une rencontre', () => {
  const store = magasin({ safari: { visite: visite() } });
  const { rerender } = render(<PageSafari retour={vi.fn()} store={store} />);
  expect(screen.getByText('20 / 30')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Avancer dans les herbes' }));
  expect(store.getState().avancerSafari).toHaveBeenCalled();
  rerender(<PageSafari retour={vi.fn()} store={magasin({ safari: { visite: visite({ rencontre: { numero: 115, nom: 'Kangourex', niveau: 25, shiny: false, humeur: 'colere' } }) } })} />);
  expect(screen.getByRole('heading', { name: /Kangourex/ })).toBeTruthy();
  expect(screen.getByText(/en colère/)).toBeTruthy();
  for (const nom of ['Lancer une Safari Ball', 'Jeter un appât', 'Jeter une roche', 'Quitter le parc']) expect(screen.getByRole('button', { name: nom })).toBeTruthy();
});
it('affiche la raison quand le parc est fermé', () => {
  render(<PageSafari retour={vi.fn()} store={magasin({ safari: { acces: { ouvert: false, raison: 'Le Parc Safari ouvre quand tu as battu l’Arène de Parmanie.' } } })} />);
  expect(screen.getByRole('status').textContent).toMatch(/Parmanie/);
  expect(screen.queryByRole('button', { name: /Payer/ })).toBeNull();
});
