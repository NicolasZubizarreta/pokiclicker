import { useEffect, useId, useRef } from 'react';
import { Image } from './Image';
import { cheminSprite } from './precharger';

export function FenetreRadar({ ouvert, nomZone, especes, fermer, declencheur }: {
  ouvert: boolean;
  nomZone: string;
  especes: { numero: number; nom: string; rarete: string; vu: boolean }[];
  fermer(): void;
  declencheur: HTMLButtonElement | null;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();

  useEffect(() => {
    const fenetre = dialogue.current;
    if (ouvert && !fenetre?.open) fenetre?.showModal();
    if (!ouvert && fenetre?.open) fenetre.close();
  }, [ouvert]);

  const clore = () => dialogue.current?.close();

  return <dialog ref={dialogue} aria-labelledby={titre}
    className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
    onClose={() => { fermer(); declencheur?.focus(); }}
    onCancel={event => { event.preventDefault(); clore(); }}
    onPointerDown={event => { if (event.target === event.currentTarget) clore(); }}>
    <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
      <button type="button" className="cadre min-h-11 min-w-11 justify-self-end bg-surface p-3" onClick={clore}>Fermer</button>
      <h2 id={titre} className="break-words font-titre text-2xl">{nomZone}</h2>
      <ul className="grid grid-cols-3 gap-2">
        {especes.map(espece => <li key={espece.numero}
          className="cadre flex min-w-0 flex-col items-center gap-2 bg-surface p-1 text-center">
          <Image src={cheminSprite(espece.numero)} genre="sprite" alt={espece.nom}
            className={`size-16 max-w-full ${espece.vu ? '' : 'brightness-0'}`} />
          <span className="w-full break-words">{espece.nom}</span>
          <span className="max-w-full break-words bg-surface-2 px-2 py-1">{espece.rarete}</span>
        </li>)}
      </ul>
    </div>
  </dialog>;
}
