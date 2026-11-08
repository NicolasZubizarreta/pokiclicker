import { useEffect, useRef } from 'react';
import { IconeTelephone } from './icones-compte';
import './ZoneCompte.css';
import './ComptePC.css';
import { useTelephone } from '../useTelephone';

export function EcranRepriseAilleurs({ nom, quandVoirParties }: { nom: string; quandVoirParties(): void }) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
return <main data-theme="dark" className={`${useTelephone() ? '' : 'compte-pc '}zc-zone zc-ecran min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center`}>
    <section role="alert" className="cadre bg-surface p-4 lg:p-8 w-full max-w-(--breakpoint-md) mx-auto flex flex-col gap-4">
      <IconeTelephone />
      <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-bold">Partie reprise ailleurs</h1>
      <p>« {nom} » vient d'être reprise sur un autre appareil. Elle est fermée ici.</p>
      <p className="text-texte-doux">Ta progression est sauvegardée : l'autre appareil repart exactement là où tu en étais. Il n'y a toujours qu'une seule sauvegarde.</p>
      <button type="button" className="plaque plaque-action min-h-12" onClick={quandVoirParties}>Voir mes parties</button>
    </section>
  </main>;
}
