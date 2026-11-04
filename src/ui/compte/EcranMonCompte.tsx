import { useEffect, useRef } from 'react';
import type { DefinitionSucces } from '../../core/succes';
import type { ResumeCompte } from '../store';

export function EcranMonCompte({ compte, registre, quandFermer, theme = 'dark' }: {
  compte: ResumeCompte; registre: readonly DefinitionSucces[]; quandFermer: () => void; theme?: 'dark' | 'light';
}) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  const obtenus = new Set(compte.succes);
  const tries = [...registre].sort((a, b) => Number(obtenus.has(b.id)) - Number(obtenus.has(a.id)));
  const nombreObtenus = registre.filter(succes => obtenus.has(succes.id)).length;

  return <div role="dialog" aria-modal="true" aria-labelledby="titre-mon-compte" data-theme={theme} className="min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center">
    <section className="cadre bg-surface p-4 lg:p-8 w-full max-w-(--breakpoint-md) mx-auto">
      <button onClick={quandFermer} className="min-h-11 p-2 text-lien underline">Retour au jeu</button>
      <h1 id="titre-mon-compte" ref={titre} tabIndex={-1} className="font-titre text-2xl mb-4">Mon compte</h1>
      <section className="mb-4">
        <h2 className="font-titre text-xl mb-4">Diamants</h2>
        <dl>
          <dt className="text-sm text-texte-doux">{compte.diamants > 1 ? 'diamants' : 'diamant'}</dt>
          <dd className="text-2xl text-region-accent">{compte.diamants}</dd>
        </dl>
      </section>
      <section className="mb-4">
        <h2 className="font-titre text-xl mb-4">Succès</h2>
        <p className="mb-4">{nombreObtenus} sur {registre.length} obtenus</p>
        <div className="grid gap-4 md:grid-cols-2 items-start">
          {tries.map(succes => <section key={succes.id} className="cadre bg-surface-2 p-4">
            <h3 className="font-titre text-xl mb-4">{succes.nom}</h3>
            <p className="mb-4">{succes.description}</p>
            <p className="mb-2 text-region-accent">+{succes.diamants} {succes.diamants > 1 ? 'diamants' : 'diamant'}</p>
            {obtenus.has(succes.id)
              ? <p><span aria-hidden="true">✓ </span>Obtenu</p>
              : <p className="text-texte-doux">À obtenir</p>}
          </section>)}
        </div>
      </section>
      <section>
        <h2 className="font-titre text-xl mb-4">Skins</h2>
        {compte.skins.length
          ? <ul className="grid gap-4">{compte.skins.map(skin => <li key={skin} className="cadre bg-surface-2 p-4">{skin}</li>)}</ul>
          : <p>Aucun skin débloqué pour l'instant.</p>}
      </section>
    </section>
  </div>;
}
