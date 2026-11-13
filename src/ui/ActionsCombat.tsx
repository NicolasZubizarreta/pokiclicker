import { useId, useRef } from 'react';
import type { ReglagesArret } from '../core/sauvegarde-types';
import { AutoAttaque, ArretAuto, ReglagesArret as IconeReglagesArret, Sac } from './icones';
import { CurseurAutoClicLie, optionsArret, type LienAutoClic } from './ReglagesCombat';
import './Plaques.css';
import './ActionsCombat.css';

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
  return <div className="actions-combat" role="group" aria-label="Actions du combat">
    <div className="actions-quatre">
      <button data-tuto="auto" data-raccourci="auto" type="button" className="plaque plaque-vertical" aria-pressed={autoAttaque} onClick={basculerAutoAttaque}><AutoAttaque />Attaque auto<kbd aria-hidden="true" className="touche-pc">A</kbd></button>
      <button data-tuto="arret" data-raccourci="arret" type="button" className="plaque plaque-vertical" aria-pressed={arret.actif} onClick={() => reglerArret({ actif: !arret.actif })}><ArretAuto />Arrêt auto<kbd aria-hidden="true" className="touche-pc">T</kbd></button>
      <button data-tuto="reglage" data-raccourci="reglage" type="button" className="plaque plaque-vertical" aria-label="Réglage de l'arrêt auto" onClick={event => { declencheur.current = event.currentTarget; dialogue.current?.showModal(); }}><IconeReglagesArret />Réglage<kbd aria-hidden="true" className="touche-pc">R</kbd></button>
      <button data-tuto="sac" data-raccourci="sac" type="button" className="plaque plaque-vertical" aria-disabled={!sac.accessible || sac.ouvrir === null} onClick={() => { if (sac.accessible) sac.ouvrir?.(); }}>
        <Sac />Sac{sac.total > 0 && <span className="pastille-sac" aria-hidden="true">{sac.total}</span>}<kbd aria-hidden="true" className="touche-pc">S</kbd>
      </button>
    </div>
    <dialog ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
      onClose={() => declencheur.current?.focus()} onCancel={event => { event.preventDefault(); fermer(); }}>
      <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
        <h2 id={titre} className="font-titre text-xl">Réglage de l'arrêt auto</h2>
        <h3>L'attaque auto s'arrête quand apparaît</h3>
        {optionsArret.map(([cle, nom]) => <label key={cle} className="flex min-h-11 min-w-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={arret[cle]} onChange={event => reglerArret({ [cle]: event.currentTarget.checked })} />{nom}
        </label>)}
        <CurseurAutoClicLie lien={lienAutoClic} />
        <button type="button" className="cadre min-h-11 min-w-11 bg-surface p-3 aria-pressed:bg-selection" onClick={fermer}>Fermer</button>
      </div>
    </dialog>
  </div>;
}
