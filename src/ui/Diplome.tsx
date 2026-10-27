import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import './Diplome.css';

export function Diplome({ diplome, fermer }: {
  diplome: { nom: string; date: string }; fermer(): void;
}) {
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
    className="diplome-fenetre cadre m-auto w-full max-w-screen-lg bg-surface p-4 text-base text-texte md:p-6"
    onCancel={event => { event.preventDefault(); fermer(); }}
    onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const boutons = dialogue.current!.querySelectorAll('button');
      const premier = boutons[0]!;
      const dernier = boutons[boutons.length - 1]!;
      if (event.shiftKey && document.activeElement === premier) { event.preventDefault(); dernier.focus(); }
      else if (!event.shiftKey && document.activeElement === dernier) { event.preventDefault(); premier.focus(); }
    }}>
    <header className="my-4 flex flex-wrap items-center justify-between gap-4">
      <h1 id={titre} className="font-titre text-3xl font-semibold">Diplôme du Pokédex</h1>
      <button type="button" onClick={fermer} className="min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection">Fermer</button>
    </header>
    <article className="diplome-feuille">
      <img src={`${import.meta.env.BASE_URL}img/fin/diplome.webp`} width={1280} height={698}
        className="block h-auto w-full"
        alt="Diplôme officiel de Kanto : le Professeur Chen certifie que tu as complété le Pokédex." />
      <div className="diplome-identite mt-4 flex flex-wrap items-center justify-between gap-4 bg-selection p-4">
        <strong className="min-w-0 break-words text-2xl">{diplome.nom}</strong>
        <span>Obtenu le <time dateTime={diplome.date}>{new Intl.DateTimeFormat('fr-FR', {
          day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
        }).format(new Date(diplome.date))}</time> (UTC)</span>
      </div>
    </article>
    <footer className="my-4">
      <button type="button" onClick={() => window.print()}
        className="min-h-11 bg-action px-4 py-2 text-action-texte shadow-sm hover:bg-action-survol">Imprimer</button>
    </footer>
  </dialog>, document.body);
}
