import { useEffect } from 'react';
import type { Page } from './Navigation';
import { useTelephone } from './useTelephone';
import { storeJeu } from './store';

const visible = (element: HTMLElement) => !element.closest('[hidden], [inert]') && element.getClientRects().length > 0;
const pages: Page[] = ['Combat', 'Équipe', 'PC', 'Shop', 'Carte', 'Menu'];
const actions: Record<string, string> = { ' ': 'attaquer', Enter: 'attaquer', c: 'capturer', b: 'balle', a: 'auto', t: 'arret', r: 'reglage', s: 'sac', f: 'fauchage', p: 'radar' };

export function useRaccourcisPC({ page, aller, raccourcisOuverts, basculerRaccourcis, actif }: {
  page: Page; aller(page: Page): void; raccourcisOuverts: boolean; basculerRaccourcis(): void; actif: boolean;
}) {
  const telephone = useTelephone();
  useEffect(() => {
    if (telephone || !actif) return;
    const clavier = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
      const cible = event.target instanceof Element ? event.target : null;
      const fenetres = [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')];
      const fenetre = fenetres.find(f => f.contains(document.activeElement)) ?? fenetres.at(-1);
      if (fenetre && event.key === 'Tab') {
        const elements = [...fenetre.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex]')]
          .filter(e => e.tabIndex >= 0 && !e.matches(':disabled, [aria-disabled="true"]') && visible(e));
        const premier = elements[0], dernier = elements.at(-1);
        if (premier && dernier && document.activeElement === (event.shiftKey ? premier : dernier)) {
          event.preventDefault(); (event.shiftKey ? dernier : premier).focus();
        }
        return;
      }
      if (cible?.closest('input, textarea, select, [contenteditable]')) return;
      if (fenetre) {
        if (event.key === '?' && raccourcisOuverts && fenetre.hasAttribute('data-raccourcis')) basculerRaccourcis();
        return;
      }
      if (event.key === '?') { basculerRaccourcis(); return; }
      const destination = pages[Number(event.key) - 1];
      if (/^[1-6]$/.test(event.key) && destination) { aller(destination); return; }
      const contenu = document.getElementById('contenu');
      if (event.key === '/') {
        const recherche = [...(contenu?.querySelectorAll<HTMLInputElement>('input[type="search"]') ?? [])].find(visible);
        if (recherche) { event.preventDefault(); recherche.focus(); }
        return;
      }
      if (page !== 'Combat') return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const etat = storeJeu.getState();
        const zone = event.key === 'ArrowLeft' ? etat.zonePrecedente : etat.zoneSuivante;
        if (zone?.ouverte) etat.allerVers(zone.id);
        return;
      }
      const action = actions[event.key] ?? actions[event.key.toLowerCase()];
      if (!action || (action === 'attaquer' && cible?.closest('button, a, [role="button"], [role="link"], [role="checkbox"], [role="radio"], [role="switch"], [role="tab"], [role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="textbox"], [role="combobox"], [role="slider"], [role="spinbutton"], [role="searchbox"], [role="option"], [role="treeitem"]'))) return;
      const controles = [...(contenu?.querySelectorAll<HTMLElement>(`[data-raccourci="${action}"]:not(:disabled):not([aria-disabled="true"])`) ?? [])];
      const controle = action === 'balle' ? controles[(controles.findIndex(e => e.getAttribute('aria-pressed') === 'true') + 1) % controles.length] : controles[0];
      if (controle) {
        if (event.key === ' ') event.preventDefault();
        if (action === 'sac') controle.focus();
        controle.click();
      }
    };
    document.addEventListener('keydown', clavier);
    return () => document.removeEventListener('keydown', clavier);
  }, [telephone, actif, page, aller, raccourcisOuverts, basculerRaccourcis]);
}
