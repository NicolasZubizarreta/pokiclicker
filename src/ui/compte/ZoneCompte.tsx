import { Fragment, useEffect, useRef, useState, type ComponentProps } from 'react';
import type { EtatSynchro } from '../synchro';
import type { ResumeCompte } from '../store';
import type { DefinitionSucces } from '../../core/succes';
import { Parties } from './EcranParties';
import { ContenuMonCompte } from './EcranMonCompte';
import { PageReglages } from '../PageReglages';
import { IconeParties, IconeCompte, IconeReglage } from './icones-compte';
import '../Plaques.css';
import './Compte.css';
import './ZoneCompte.css';
import './ComptePC.css';
import { useTelephone } from '../useTelephone';

export type OngletCompte = 'parties' | 'compte' | 'reglages';
const entrees = [
  { id: 'parties', titre: 'Parties', Icone: IconeParties },
  { id: 'compte', titre: 'Compte', Icone: IconeCompte },
  { id: 'reglages', titre: 'Réglages', Icone: IconeReglage },
] as const;

export function ZoneCompte(props: ComponentProps<typeof Parties> & {
  compte: ResumeCompte; registre: readonly DefinitionSucces[]; etatSynchro: EtatSynchro; quandDeconnecter(): void;
}) {
  const telephone = useTelephone();
  const Entete = telephone ? Fragment : 'header';
  const [onglet, fixerOnglet] = useState<OngletCompte>('parties');
  const contenu = useRef<HTMLDivElement>(null);
  useEffect(() => { contenu.current?.querySelector('h1')?.focus(); }, [onglet]);
  return <main data-theme="dark" className={`${telephone ? '' : 'compte-pc '}zc-zone min-h-dvh bg-fond text-texte font-texte`}>
    <div className="mx-auto max-w-(--breakpoint-md) p-4 pb-[calc(var(--spacing)*20+env(safe-area-inset-bottom))] lg:pb-4">
      <Entete {...(telephone ? {} : { className: 'compte-haut' })}>
      {!telephone && <b className="font-titre text-region-accent">PokiClicker</b>}
      <nav aria-label="Zone compte" className={`${telephone ? '' : 'onglets-compte '}zc-barre fixed inset-x-0 bottom-0 z-10 box-content border-t border-bordure bg-surface pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-1 pb-[env(safe-area-inset-bottom)] lg:static lg:mb-4 lg:rounded-cadre lg:border lg:p-1`}>
        <div className="flex h-full gap-2">{entrees.map(({ id, titre, Icone }) => <button key={id} type="button" disabled={props.occupe} aria-current={onglet === id ? 'page' : undefined} onClick={() => fixerOnglet(id)}
          className={`relative flex min-h-14 min-w-0 flex-1 flex-col items-center justify-center text-sm ${onglet === id ? 'bg-selection font-bold text-region-accent' : 'text-texte-doux'}`}>
          {onglet === id && <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-region-accent" />}
          <Icone /><span>{titre}</span>
        </button>)}</div>
      </nav>
      </Entete>
      <div ref={contenu} {...(telephone ? {} : { className: 'compte-page' })}>
        {onglet === 'parties' && <Parties {...props} />}
        {onglet === 'compte' && <ContenuMonCompte compte={props.compte} registre={props.registre} etatSynchro={props.etatSynchro} quandDeconnecter={props.quandDeconnecter} />}
        {onglet === 'reglages' && <PageReglages />}
      </div>
    </div>
  </main>;
}
