import { useStore } from 'zustand';
import { storeJeu } from './store';
import { formaterDps } from './nombres';

const formateurArgent = new Intl.NumberFormat('fr-FR');

export function BandeauHaut() {
  const argent = useStore(storeJeu, etat => etat.argent);
  const dps = useStore(storeJeu, etat => etat.dps);
  const lieu = useStore(storeJeu, etat => etat.lieu);
  return <header aria-label="Chiffres clés" className="sticky top-0 z-10 border-b border-bordure bg-surface pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[calc(env(safe-area-inset-top)+0.375rem)] pb-1.5 lg:hidden">
    <dl className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-start gap-x-3">
      {[
        ['Pokédollars', `${formateurArgent.format(argent)}\u00a0₽`],
        ['DPS', formaterDps(dps)],
        ['Zone', lieu?.nom ?? '—'],
      ].map(([libelle, valeur]) => <div key={libelle} className="min-w-0">
        <dt className="whitespace-nowrap text-sm text-texte-doux">{libelle}</dt>
        <dd className="truncate whitespace-nowrap font-titre text-lg text-region-accent">{valeur}</dd>
      </div>)}
    </dl>
  </header>;
}
