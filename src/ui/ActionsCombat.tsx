import { useId, useRef } from 'react';
import type { ReglagesArret } from '../core/sauvegarde-types';
import { AutoAttaque, ArretAuto, ReglagesArret as IconeReglagesArret, Sac } from './icones';
import { ContenuArret, type LienAutoClic } from './ReglagesCombat';
import './Plaques.css';
import './ActionsCombat.css';
import { Mannequin } from './Mannequin';

type Props = {
  autoAttaque: boolean; basculerAutoAttaque(): void;
  arret: ReglagesArret; reglerArret(partiel: Partial<ReglagesArret>): void;
  lienAutoClic: LienAutoClic;
  sac: { accessible: boolean; total: number; ouvrir: (() => void) | null };
};

export function ActionsCombat({ autoAttaque, basculerAutoAttaque, arret, reglerArret, lienAutoClic, sac }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const fermer = () => dialogue.current?.close();
  return <><div className="actions-combat" role="group" aria-label="Actions du combat">
    <div className="actions-quatre">
      <button data-tuto="auto" data-raccourci="auto" type="button" className="plaque plaque-vertical" aria-pressed={autoAttaque} onClick={basculerAutoAttaque}><AutoAttaque />Attaque auto<span aria-hidden="true" className="etat-interrupteur">{autoAttaque ? 'Oui' : 'Non'}</span><kbd aria-hidden="true" className="touche-pc">A</kbd></button>
      <button data-tuto="arret" data-raccourci="arret" type="button" className="plaque plaque-vertical" aria-pressed={arret.actif} onClick={() => reglerArret({ actif: !arret.actif })}><ArretAuto />Arrêt auto<span aria-hidden="true" className="etat-interrupteur">{arret.actif ? 'Oui' : 'Non'}</span><kbd aria-hidden="true" className="touche-pc">T</kbd></button>
      <button data-tuto="reglage" data-raccourci="reglage" type="button" className="plaque plaque-vertical" aria-label="Réglage de l'arrêt auto" onClick={event => { declencheur.current = event.currentTarget; dialogue.current?.showModal(); }}><IconeReglagesArret />Réglage<svg viewBox="0 0 24 24" aria-hidden="true" className="chevron-tiroir"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg><kbd aria-hidden="true" className="touche-pc">R</kbd></button>
      <button data-tuto="sac" data-raccourci="sac" type="button" className="plaque plaque-vertical" aria-disabled={!sac.accessible || sac.ouvrir === null} onClick={() => { if (sac.accessible) sac.ouvrir?.(); }}>
        <Sac />Sac<svg viewBox="0 0 24 24" aria-hidden="true" className="chevron-tiroir"><path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" /></svg>{sac.total > 0 && <span className="pastille-sac" aria-hidden="true">{sac.total}</span>}<kbd aria-hidden="true" className="touche-pc">S</kbd>
      </button>
    </div>
    <dialog ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
      onClose={() => declencheur.current?.focus()} onCancel={event => { event.preventDefault(); fermer(); }}
      onPointerDown={event => { if (event.target === event.currentTarget) fermer(); }}>
      <ContenuArret id={titre} titre="Réglage de l'arrêt auto" arret={arret} regler={reglerArret} lienAutoClic={lienAutoClic} fermer={fermer} />
    </dialog>
  </div><Mannequin /></>;
}
