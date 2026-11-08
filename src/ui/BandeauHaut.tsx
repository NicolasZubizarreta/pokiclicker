import { useStore } from 'zustand';
import { storeJeu } from './store';
import { formaterDps } from './nombres';
import { useTelephone } from './useTelephone';
import { ZoneLigne } from './ZoneLigne';

const formateurArgent = new Intl.NumberFormat('fr-FR');

// `combat` : la ligne Zone précédente / étapes / Zone suivante n'existe que sur l'écran de combat (téléphone).
export function BandeauHaut({ combat = false, ouvrirRaccourcis }: { combat?: boolean; ouvrirRaccourcis?: () => void }) {
  const argent = useStore(storeJeu, etat => etat.argent);
  const dps = useStore(storeJeu, etat => etat.dps);
  const lieu = useStore(storeJeu, etat => etat.lieu);
  const zone = useStore(storeJeu, etat => etat.zone);
  const etape = useStore(storeJeu, etat => etat.etape);
  const precedente = useStore(storeJeu, etat => etat.zonePrecedente);
  const suivante = useStore(storeJeu, etat => etat.zoneSuivante);
  const telephone = useTelephone();
  if (!telephone) return <header aria-label="Chiffres clés" className="bandeau-pc hidden h-20 shrink-0 items-center gap-8 border-b border-bordure bg-surface px-8 pb-1.5 lg:flex">
    <dl className="flex min-w-0 gap-8">{[['Pokédollars', `${formateurArgent.format(argent)}\u00a0₽`], ['DPS', formaterDps(dps)], ['Zone', lieu?.nom ?? '—']].map(([libelle, valeur]) => <div key={libelle} className="min-w-0"><dt className="text-sm text-texte-doux">{libelle}</dt><dd className="truncate font-titre text-2xl text-region-accent">{valeur}</dd></div>)}</dl>
    <div className="ml-auto flex items-center gap-4"><button type="button" className="plaque" onClick={ouvrirRaccourcis}>Raccourcis ?</button></div>
  </header>;
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
    {combat && telephone && <ZoneLigne etape={zone ? etape : null} precedente={precedente} suivante={suivante}
      aller={zoneId => storeJeu.getState().allerVers(zoneId)} />}
  </header>;
}
