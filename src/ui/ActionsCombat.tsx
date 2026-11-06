import { useId, useRef } from 'react';
import type { ReglagesArret } from '../core/sauvegarde-types';
import { AutoAttaque, ArretAuto, ReglagesArret as IconeReglagesArret, Sac, Fauchage } from './icones';
import { optionsArret } from './ReglagesCombat';
import './Plaques.css';
import './ActionsCombat.css';

type Props = {
  autoAttaque: boolean; basculerAutoAttaque(): void;
  arret: ReglagesArret; reglerArret(partiel: Partial<ReglagesArret>): void;
  fauchage: { possede: boolean; disponible: boolean; raison: string | null; rechargeS: number; actif: boolean }; faucher(): void;
  radar: boolean; radarInutile: boolean; ouvrirRadar(declencheur: HTMLButtonElement): void;
  sac: { accessible: boolean; total: number; ouvrir: (() => void) | null };
};

export function ActionsCombat({ autoAttaque, basculerAutoAttaque, arret, reglerArret, fauchage, faucher, radar, radarInutile, ouvrirRadar, sac }: Props) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const fermer = () => dialogue.current?.close();
  return <div className="actions-combat" role="group" aria-label="Actions du combat">
    <div className="actions-quatre">
      <button type="button" className="plaque plaque-vertical" aria-pressed={autoAttaque} onClick={basculerAutoAttaque}><AutoAttaque />Attaque auto</button>
      <button type="button" className="plaque plaque-vertical" aria-pressed={arret.actif} onClick={() => reglerArret({ actif: !arret.actif })}><ArretAuto />Arrêt auto</button>
      <button type="button" className="plaque plaque-vertical" aria-label="Réglage de l'arrêt auto" onClick={event => { declencheur.current = event.currentTarget; dialogue.current?.showModal(); }}><IconeReglagesArret />Réglage</button>
      <button type="button" className="plaque plaque-vertical" aria-disabled={!sac.accessible || sac.ouvrir === null} onClick={() => { if (sac.accessible) sac.ouvrir?.(); }}>
        <Sac />Sac{sac.total > 0 && <span className="pastille-sac" aria-hidden="true">{sac.total}</span>}
      </button>
    </div>
    {(fauchage.possede || radar) && <div className="actions-debloques">
      {fauchage.possede && <button type="button" className="plaque" aria-label="Fauchage" aria-pressed={fauchage.actif} aria-disabled={!fauchage.disponible || undefined}
        title={!fauchage.disponible ? fauchage.raison ?? undefined : undefined} onClick={() => { if (fauchage.disponible) faucher(); }}>
        <Fauchage />Fauchage
        {fauchage.rechargeS > 0 && <small className="text-texte-doux">Recharge : {fauchage.rechargeS} s</small>}
        {!fauchage.disponible && fauchage.raison && <span className="sr-only">{fauchage.raison}</span>}
      </button>}
      {radar && <button type="button" className="plaque" aria-disabled={radarInutile || undefined}
        title={radarInutile ? 'Inutile à la Ligue : il n’y a que des boss, aucun Pokémon à capturer.' : undefined}
        onClick={event => { if (!radarInutile) ouvrirRadar(event.currentTarget); }}>
        <img src="img/objets/PokeRadar.png" alt="" width={30} height={30} className="image-rendering-pixelated" />Poké-Radar
      </button>}
    </div>}
    <dialog ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
      onClose={() => declencheur.current?.focus()} onCancel={event => { event.preventDefault(); fermer(); }}>
      <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
        <h2 id={titre} className="font-titre text-xl">Réglage de l'arrêt auto</h2>
        <p className="text-texte-doux">Le lien avec l'auto-clic se règle dans Menu, puis Réglages.</p>
        <h3>L'attaque auto s'arrête quand apparaît</h3>
        {optionsArret.map(([cle, nom]) => <label key={cle} className="flex min-h-11 min-w-11 cursor-pointer items-center gap-3">
          <input type="checkbox" checked={arret[cle]} onChange={event => reglerArret({ [cle]: event.currentTarget.checked })} />{nom}
        </label>)}
        <button type="button" className="cadre min-h-11 min-w-11 bg-surface p-3 aria-pressed:bg-selection" onClick={fermer}>Fermer</button>
      </div>
    </dialog>
  </div>;
}
