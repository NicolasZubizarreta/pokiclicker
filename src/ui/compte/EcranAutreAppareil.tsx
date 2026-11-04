import { useEffect, useRef } from 'react';

export function EcranAutreAppareil({ occupe, erreur, quandReprendre }: {
  occupe: boolean; erreur: string; quandReprendre: () => void;
}) {
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  return <main data-theme="dark" className="min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center">
    <section className="cadre bg-surface p-4 lg:p-8 w-full max-w-(--breakpoint-md) mx-auto">
      <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl mb-4">Partie ouverte ailleurs</h1>
      <p className="mb-4">Cette partie est ouverte sur un autre appareil. Si tu reprends ici, l'autre appareil le verra dans la minute et te laissera la main.</p>
      <button disabled={occupe} onClick={quandReprendre} className="min-h-11 p-2 w-full bg-action text-action-texte hover:bg-action-survol disabled:bg-surface-2 disabled:text-texte-doux">
        {occupe ? 'Un instant…' : 'Reprendre ici'}
      </button>
      {erreur && <p role="alert" className="mt-4">{erreur}</p>}
    </section>
  </main>;
}
