import { useId, useLayoutEffect, useRef } from 'react';
import { raccourcis } from './raccourcis';

export function FenetreRaccourcis({ fermer }: { fermer(): void }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  useLayoutEffect(() => {
    const declencheur = document.activeElement;
    dialogue.current?.showModal();
    return () => { if (declencheur instanceof HTMLElement && declencheur.isConnected) declencheur.focus(); };
  }, []);
  const clore = () => dialogue.current?.close();
  return <dialog ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte" onClose={fermer} onCancel={e => { e.preventDefault(); clore(); }}>
    <div className="fiche-contenu grid gap-4 p-8">
      <button type="button" className="cadre min-h-11 justify-self-end p-3" onClick={clore}>Fermer</button>
      <h2 id={titre} className="font-titre text-2xl">Raccourcis clavier</h2>
      {(['Combat', 'Partout'] as const).map(groupe => <section key={groupe}><h3 className="font-bold">{groupe}</h3><dl className="grid gap-2">{raccourcis.filter(r => r.groupe === groupe).map(r => <div key={r.action} className="flex justify-between gap-4"><dt><kbd>{r.touche}</kbd></dt><dd>{r.libelle}</dd></div>)}</dl></section>)}
      <p>Les raccourcis n'existent que sur ordinateur. Ils sont ignorés quand tu écris dans un champ.</p>
    </div>
  </dialog>;
}
