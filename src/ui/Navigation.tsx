import { Carte, Combat, Equipe, Menu, Shop } from './icones';

const entrees = [
  { titre: 'Combat', Icone: Combat },
  { titre: 'Équipe', Icone: Equipe },
  { titre: 'Shop', Icone: Shop },
  { titre: 'Carte', Icone: Carte },
  { titre: 'Menu', Icone: Menu },
] as const;

export type Page = 'Combat' | 'Équipe' | 'PC' | 'Shop' | 'Carte' | 'Menu' | 'Monde';

export function Navigation({ page, choisir, signalCarte = false, inerte = false, origineMonde = 'Menu' }: {
  page: Page; choisir: (page: Page) => void; signalCarte?: boolean; inerte?: boolean;
  origineMonde?: 'Menu' | 'Carte';
}) {
  const active = page === 'PC' ? 'Menu' : page === 'Monde' ? origineMonde : page;
  return (
    <nav aria-label="Navigation principale" inert={inerte}
      className="fixed inset-x-0 bottom-0 z-10 box-content border-t border-bordure bg-surface pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-1 pb-[env(safe-area-inset-bottom)] lg:rounded-cadre lg:border-t-0 lg:after:pointer-events-none lg:after:absolute lg:after:inset-0 lg:after:rounded-cadre lg:after:border lg:after:border-bordure lg:after:inset-ring lg:after:inset-ring-region-argent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-24 lg:p-0">
      <div className="flex h-full gap-2 lg:flex-col lg:gap-0">
        {entrees.map(({ titre, Icone }) => (
          <button key={titre} type="button" aria-current={active === titre ? 'page' : undefined}
            data-signal={titre === 'Carte' && signalCarte ? 'true' : undefined}
            onClick={() => choisir(titre)}
            className={`relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center text-sm lg:h-14 lg:min-h-11 lg:min-w-11 lg:flex-none ${active === titre ? 'bg-selection font-bold text-region-accent' : 'text-texte-doux'}${titre === 'Carte' && signalCarte ? ' ring-4 ring-succes-base rebond-signal' : ''}`}>
            {active === titre && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-region-accent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-full lg:w-1" />}
            <Icone />
            <span>{titre}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
