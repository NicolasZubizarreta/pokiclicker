import { useId, useLayoutEffect, useRef } from 'react';
import { raccourcis } from './raccourcis';

export function FenetreRaccourcis({ fermer }: { fermer(): void }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  useLayoutEffect(() => {
    const declencheur = document.activeElement;
    dialogue.current?.showModal();
    return () => { if (declencheur instanceof HTMLElement && declencheur !== document.body && declencheur.isConnected) declencheur.focus(); };
  }, []);
  const clore = () => dialogue.current?.close();
  return <dialog data-raccourcis ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte" onClose={fermer} onCancel={e => { e.preventDefault(); clore(); }}>
    <div className="fiche-contenu grid gap-4 p-8">
      <button type="button" className="cadre min-h-11 justify-self-end p-3" onClick={clore}>Fermer</button>
      <h2 id={titre} className="font-titre text-2xl">Raccourcis clavier</h2>
      <div className="grid grid-cols-2 gap-8">
        {(['Combat', 'Partout'] as const).map(groupe => <section key={groupe}><h3 className="mb-2 font-bold">{groupe}</h3><dl className="grid gap-2">{raccourcis.filter(r => r.groupe === groupe).map(r => <div key={r.action} className="flex items-center gap-3"><dt className="w-36 shrink-0"><kbd>{r.touche}</kbd></dt><dd>{r.libelle}</dd></div>)}</dl></section>)}
      </div>
      <p>Les raccourcis n'existent que sur ordinateur. Ils sont ignorés quand tu écris dans un champ.</p>
    </div>
  </dialog>;
}
