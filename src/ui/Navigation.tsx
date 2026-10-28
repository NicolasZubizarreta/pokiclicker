import { Carte, Combat, Equipe, PC, Plus, Shop } from './icones';

const entrees = [
  { titre: 'Combat', Icone: Combat },
  { titre: 'Équipe', Icone: Equipe },
  { titre: 'PC', Icone: PC },
  { titre: 'Shop', Icone: Shop },
  { titre: 'Carte', Icone: Carte },
  { titre: 'Plus', Icone: Plus },
] as const;

export type Page = typeof entrees[number]['titre'];

/** `pcOuvert` faux : l'entrée PC est grisée, mais s'ouvre quand même pour dire pourquoi elle est fermée. */
export function Navigation({ page, choisir, signalCarte = false, inerte = false, pcOuvert = true }: {
  page: Page; choisir: (page: Page) => void; signalCarte?: boolean; inerte?: boolean; pcOuvert?: boolean;
}) {
  return (
    <nav aria-label="Navigation principale" inert={inerte}
      className="fixed inset-x-0 bottom-0 z-10 box-content h-14 rounded-cadre bg-surface pb-[env(safe-area-inset-bottom)] after:pointer-events-none after:absolute after:inset-0 after:rounded-cadre after:border after:border-bordure after:inset-ring after:inset-ring-region-argent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-auto lg:w-24 lg:pb-0">
      <div className="flex h-full lg:flex-col">
        {entrees.map(({ titre, Icone }) => (
          <button key={titre} type="button" aria-current={page === titre ? 'page' : undefined}
            data-signal={titre === 'Carte' && signalCarte ? 'true' : undefined}
            onClick={() => choisir(titre)}
            className={`relative flex h-14 min-h-11 min-w-11 flex-1 flex-col items-center justify-center text-sm lg:flex-none ${page === titre ? 'bg-selection font-bold text-region-accent' : 'text-texte-doux'}${titre === 'PC' && !pcOuvert ? ' opacity-60' : ''}${titre === 'Carte' && signalCarte ? ' ring-4 ring-succes-base rebond-signal' : ''}`}>
            {page === titre && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-region-accent lg:inset-x-auto lg:inset-y-0 lg:left-0 lg:h-full lg:w-1" />}
            <Icone />
            <span>{titre}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
