import { Fragment, useEffect, useRef, type JSX } from 'react';
import type { DefinitionSucces } from '../../core/succes';
import type { ResumeCompte } from '../store';
import { synchronisations } from '../synchronisations';
import type { EtatSynchro } from '../synchro';
import { IconeBadges } from '../icones-menu';
import { IconeDiamant, IconeSortie } from './icones-compte';
import '../Plaques.css';
import './MonCompte.css';
import './ComptePC.css';
import { useTelephone } from '../useTelephone';



export function EcranMonCompte({ compte, registre, quandFermer, theme = 'dark' }: {
  compte: ResumeCompte; registre: readonly DefinitionSucces[]; quandFermer: () => void; theme?: 'dark' | 'light';
}) {
return <div role="dialog" aria-modal="true" aria-labelledby="titre-mon-compte" data-theme={theme} className={`${useTelephone() ? '' : 'compte-pc mon-compte-pc '}min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center`}>
    <section className="cadre bg-surface p-4 lg:p-8 w-full max-w-(--breakpoint-md) mx-auto">
      <button onClick={quandFermer} className="min-h-12 p-2 text-lien underline">Retour au jeu</button>
      <ContenuMonCompte compte={compte} registre={registre} />
    </section>
  </div>;
}

export function ContenuMonCompte({ compte, registre, etatSynchro, quandDeconnecter }: {
  compte: ResumeCompte; registre: readonly DefinitionSucces[];
  etatSynchro?: EtatSynchro; quandDeconnecter?: () => void;
}): JSX.Element {
  const telephone = useTelephone();
  const Colonne = telephone ? Fragment : 'div';
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  const obtenus = new Set(compte.succes);
  const tries = [...registre].sort((a, b) => Number(obtenus.has(b.id)) - Number(obtenus.has(a.id)));
  const nombreObtenus = registre.filter(succes => obtenus.has(succes.id)).length;

  return <div className={`${useTelephone() ? '' : 'mc-layout-pc '}w-full max-w-(--breakpoint-md) mx-auto space-y-4`}>
      <header className="flex items-center justify-between gap-3">
        <h1 id="titre-mon-compte" ref={titre} tabIndex={-1} className="font-titre text-xl font-bold">Mon compte</h1>
        {telephone && quandDeconnecter && <button type="button" className="plaque min-h-12" onClick={quandDeconnecter}><IconeSortie />Se déconnecter</button>}
      </header>
      {etatSynchro !== undefined && <section className="cadre bg-surface p-4 space-y-3">
        <p className="text-texte-doux">Connecté</p>
        <p role="status" className="mc-sync-ligne">
          <span aria-hidden="true" className={`mc-pastille ${synchronisations[etatSynchro][1]}`} />
          {synchronisations[etatSynchro][0]}
        </p>
      </section>}
      <section className="cadre bg-surface p-4 space-y-3">
        <h2 className="text-texte-doux">Diamants</h2>
        <dl>
          <dt className="sr-only">{compte.diamants > 1 ? 'diamants' : 'diamant'}</dt>
          <dd className="flex items-center gap-2 font-titre font-bold text-2xl text-region-accent"><IconeDiamant /><span>{compte.diamants}</span></dd>
        </dl>
        <p className="text-texte-doux">Gagnés avec les succès. Ils restent sur ton compte, quelle que soit la partie.</p>
      </section>
      {!telephone && quandDeconnecter && <button type="button" className="plaque mc-deconnexion min-h-12" onClick={quandDeconnecter}><IconeSortie />Se déconnecter</button>}
      <Colonne {...(telephone ? {} : { className: 'mc-droite' })}>
      <section className="mb-4">
        <h2 className="font-titre text-xl mb-4">Succès</h2>
        <p className="mb-4">{nombreObtenus} sur {registre.length} obtenus</p>
        <div className="grid gap-4 md:grid-cols-2 items-start">
          {tries.map(succes => <section key={succes.id} className={`cadre mc-succes${obtenus.has(succes.id) ? ' mc-obtenu' : ''}`}>
            <IconeBadges />
            <div className="flex-1 min-w-0">
              <h3 className="font-bold">{succes.nom}</h3>
              <p className="text-sm text-texte-doux">{succes.description}</p>
              <p className="text-sm text-region-accent">+{succes.diamants} {succes.diamants > 1 ? 'diamants' : 'diamant'}</p>
            </div>
            {obtenus.has(succes.id)
              ? <p className="text-sm text-right text-succes-texte"><span aria-hidden="true">✓ </span>Obtenu</p>
              : <p className="text-sm text-right text-texte-doux">À obtenir</p>}
          </section>)}
        </div>
      </section>
      <section>
        <h2 className="font-titre text-xl mb-4">Skins</h2>
        {compte.skins.length
          ? <ul className="grid gap-4">{compte.skins.map(skin => <li key={skin} className="cadre mc-succes mc-obtenu">{skin}</li>)}</ul>
          : <p>Aucun skin débloqué pour l'instant.</p>}
      </section>
      </Colonne>
  </div>;
}
