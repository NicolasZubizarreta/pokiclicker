import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { guide } from '../core/guide';

/** Le « Guide du jeu » de la V1, ouvert depuis la page Plus : une fenêtre modale, une section repliable par thème. */
export function Guide({ fermer }: { fermer(): void }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  useEffect(() => {
    const origine = document.activeElement;
    const fenetre = dialogue.current!;
    fenetre.showModal();
    fenetre.querySelector('button')?.focus();
    return () => {
      fenetre.close();
      if (origine instanceof HTMLElement && origine.isConnected) origine.focus();
    };
  }, []);

  return createPortal(<dialog ref={dialogue} aria-labelledby={titre}
    className="guide-fenetre cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
    onCancel={event => { event.preventDefault(); fermer(); }}
    onPointerDown={event => { if (event.target === event.currentTarget) fermer(); }}>
    <header className="flex items-center justify-between gap-4 p-4">
      <h2 id={titre} className="font-titre text-xl font-semibold">{guide.titre}</h2>
      <button type="button" onClick={fermer} aria-label="Fermer le guide"
        className="min-h-11 min-w-11 bg-surface-2 text-xl hover:bg-selection">×</button>
    </header>
    <div data-guide-contenu className="fiche-contenu grid min-w-0 gap-2 px-4 pb-4">
      {guide.sections.map((section, index) => <details key={section.id} open={index === 0} className="bg-surface-2 px-4 py-2">
        <summary className="min-h-11 cursor-pointer py-2 font-bold">{section.titre}</summary>
        <div className="space-y-2 pb-2">
          {section.paragraphes.map((texte, i) => <p key={i} className="min-w-0 break-words">{texte}</p>)}
        </div>
      </details>)}
    </div>
  </dialog>, document.body);
}
