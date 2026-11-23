import { useStore } from 'zustand';
import { storeJeu } from './store';
import { formaterDps, formateurArgent } from './nombres';
import { useTelephone } from './useTelephone';
import { ZoneLigne } from './ZoneLigne';
import { useSyncExternalStore } from 'react';
import { musique } from './musique';

function BoutonSon() {
  const actif = useStore(storeJeu, etat => etat.sonActive);
  const musiqueActive = useSyncExternalStore(musique.abonner, musique.estActive);
  const audible = actif || musiqueActive;
  return <button type="button" data-raccourci="son" className="plaque shrink-0 px-2" aria-pressed={audible}
    onClick={() => {
      if (actif === audible) storeJeu.getState().basculerSon();
      if (musiqueActive === audible) musique.basculer();
    }}>Son : {audible ? 'oui' : 'muet'}</button>;
}

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
    <dl data-tuto-evite className="flex min-w-0 gap-8">{[['Pokédollars', `${formateurArgent.format(argent)}\u00a0₽`], ['DPS', formaterDps(dps)], ['Zone', lieu?.nom ?? '—']].map(([libelle, valeur]) => <div key={libelle} className="min-w-0"><dt className="text-sm text-texte-doux">{libelle}</dt><dd className="truncate font-titre text-2xl text-region-accent">{valeur}</dd></div>)}</dl>
    <div className="ml-auto flex items-center gap-4">{combat && <BoutonSon />}<button type="button" className="plaque" onClick={ouvrirRaccourcis}>Raccourcis ?</button></div>
  </header>;
  return <header aria-label="Chiffres clés" className="sticky top-0 z-10 border-b border-bordure bg-surface pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[calc(env(safe-area-inset-top)+0.375rem)] pb-1.5 lg:hidden">
    <div className="flex items-start gap-2">
    <dl data-tuto-evite className="grid min-w-0 flex-1 grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-start gap-x-3">
      {[
        ['Pokédollars', `${formateurArgent.format(argent)}\u00a0₽`],
        ['DPS', formaterDps(dps)],
        ['Zone', lieu?.nom ?? '—'],
      ].map(([libelle, valeur]) => <div key={libelle} className="min-w-0">
        <dt className="whitespace-nowrap text-sm text-texte-doux">{libelle}</dt>
        {/* Le nom de la zone passe sur deux lignes au lieu d'être coupé ; les chiffres restent sur une ligne. */}
        <dd className={`font-titre text-region-accent ${libelle === 'Zone' ? 'line-clamp-2 break-words text-base leading-tight' : 'truncate whitespace-nowrap text-lg'}`}>{valeur}</dd>
      </div>)}
    </dl>
    {combat && <BoutonSon />}
    </div>
    {combat && telephone && <ZoneLigne etape={zone ? etape : null} precedente={precedente} suivante={suivante}
      aller={zoneId => storeJeu.getState().allerVers(zoneId)} />}
  </header>;
}
