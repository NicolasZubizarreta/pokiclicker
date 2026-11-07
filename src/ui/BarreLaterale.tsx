import { useStore } from 'zustand';
import { Carte, Combat, Equipe, Menu, PC, Shop } from './icones';
import { IconeSortie } from './icones-menu';
import type { Page } from './Navigation';
import type { EtatSynchro } from './synchro';
import { EtatSynchronisation } from './EtatSynchronisation';
import { storeJeu } from './store';
import { evolutionProposee } from './evolution-proposee';
import { erreurRetourMenu, useRetourMenuPrincipal } from './useRetourMenuPrincipal';

const entrees = [ ['Combat', Combat], ['Équipe', Equipe], ['PC', PC], ['Shop', Shop], ['Carte', Carte], ['Menu', Menu] ] as const;

export type InfosPartie = { nomPartie?: string; etatSynchro?: EtatSynchro; quandMenuPrincipal?: () => Promise<boolean> };

export function BarreLaterale({ page, choisir, signalCarte, inerte, origineMonde = 'Menu', nomPartie, etatSynchro, quandMenuPrincipal }: InfosPartie & {
  page: Page; choisir(page: Page): void; signalCarte?: boolean; inerte?: boolean; origineMonde?: 'Menu' | 'Carte';
}) {
  const equipe = useStore(storeJeu, e => e.equipe);
  const sac = useStore(storeJeu, e => e.sac);
  const evolution = equipe.some(c => c && evolutionProposee(c.pokemon, sac.entrees));
  const { retourEnCours, retourEchoue, revenirAuMenuPrincipal } = useRetourMenuPrincipal(quandMenuPrincipal);
  const active = page === 'Monde' ? origineMonde : page;
  return <aside inert={inerte} className="barre-laterale hidden min-h-0 flex-col gap-4 border-r border-bordure bg-surface p-4 lg:flex">
    <div className="marque-pc py-4"><b className="font-titre text-xl text-region-accent">PokiClicker</b><span className="sous-titre-pc block text-sm text-texte-doux">Kanto</span></div>
    <nav aria-label="Navigation principale" className="grid gap-1">
      {entrees.map(([titre, Icone], index) => <button key={titre} type="button" aria-current={active === titre ? 'page' : undefined}
        data-signal={titre === 'Carte' && signalCarte ? 'true' : undefined} onClick={() => choisir(titre)}
        className={`entree-pc relative flex min-h-14 items-center gap-3 border border-transparent px-3 text-left text-lg ${active === titre ? 'bg-selection font-bold text-region-accent' : 'text-texte-doux'}${titre === 'Carte' && signalCarte ? ' ring-4 ring-succes-base rebond-signal' : ''}`}>
        {active === titre && <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-region-accent" />}
        <Icone /><span>{titre}</span><kbd aria-hidden="true" className="touche-pc ml-auto">{index + 1}</kbd>
        {titre === 'Équipe' && evolution && <span aria-hidden="true" className="h-2 w-2 rounded-full bg-succes-base" />}
      </button>)}
    </nav>
    <div className="bas-pc mt-auto grid gap-2 border border-bordure bg-surface-2 p-3 text-sm"><b>{nomPartie}</b>{quandMenuPrincipal && etatSynchro && <EtatSynchronisation etat={etatSynchro} />}</div>
    {quandMenuPrincipal && <button type="button" className="entree-pc flex min-h-14 items-center gap-3 p-3 text-left" disabled={retourEnCours} onClick={revenirAuMenuPrincipal}><IconeSortie /><span>Menu principal</span></button>}
    {retourEchoue && <p role="alert">{erreurRetourMenu}</p>}
  </aside>;
}
