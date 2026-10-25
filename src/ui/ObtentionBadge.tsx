import { useEffect, useId, useRef } from 'react';
import { BoiteBadges, type PropsBoiteBadges } from './BoiteBadges';

export function ObtentionBadge({ ouvert, badges, cache, claque, fermer, declencheur }: PropsBoiteBadges & {
  ouvert: boolean;
  fermer(): void;
  declencheur?: HTMLElement | null;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();

  useEffect(() => {
    const fenetre = dialogue.current;
    if (ouvert && !fenetre?.open) fenetre?.showModal();
    if (!ouvert && fenetre?.open) fenetre.close();
  }, [ouvert]);

  const clore = () => dialogue.current?.close();
  const aLaFermeture = () => {
    fermer();
    if (declencheur?.isConnected) declencheur.focus();
    else {
      const tabindex = document.body.getAttribute('tabindex');
      document.body.tabIndex = -1;
      document.body.focus();
      if (tabindex === null) document.body.removeAttribute('tabindex');
      else document.body.setAttribute('tabindex', tabindex);
    }
  };

  return <dialog ref={dialogue} aria-labelledby={titre}
    className="cadre m-auto w-full max-w-xl overflow-visible bg-surface p-4 text-base text-texte lg:p-8"
    onClose={aLaFermeture} onCancel={event => { event.preventDefault(); clore(); }}>
    <div className="grid min-w-0 gap-4 overflow-visible">
      <button type="button" className="cadre min-h-11 min-w-11 justify-self-end bg-surface p-3" onClick={clore}>Fermer</button>
      <h2 id={titre} className="font-titre text-2xl">Boîte à badges</h2>
      <BoiteBadges badges={badges} cache={cache} claque={claque} />
    </div>
  </dialog>;
}
