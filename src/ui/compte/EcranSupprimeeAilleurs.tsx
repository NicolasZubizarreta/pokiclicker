import { useEffect, useRef, useState } from 'react';
import { duree, nomRegion, nomZone } from './format-partie';
import { IconeAlerte } from './icones-compte';
import './Compte.css';
import './ZoneCompte.css';

export function EcranSupprimeeAilleurs({ nom, regionId, zoneId, ecritLe, tempsJeuMs, occupe, erreur, quandGarder, quandAbandonner }: {
  nom: string; regionId: string; zoneId: string; ecritLe: string; tempsJeuMs: number | null; occupe: boolean; erreur: string;
  quandGarder(): void; quandAbandonner(): void;
}) {
  const [confirmation, fixerConfirmation] = useState(false);
  const titre = useRef<HTMLHeadingElement>(null);
  const dialogue = useRef<HTMLDialogElement>(null);
  const titreDialogue = useRef<HTMLHeadingElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  useEffect(() => {
    if (!confirmation) return;
    const fenetre = dialogue.current!;
    const bouton = declencheur.current;
    fenetre.showModal();
    titreDialogue.current?.focus();
    return () => { fenetre.close(); bouton?.focus(); };
  }, [confirmation]);
  return <main data-theme="dark" className="zc-zone zc-ecran min-h-dvh bg-fond text-texte font-texte p-4 lg:p-8 grid content-center">
    <div inert={confirmation} className="w-full max-w-(--breakpoint-md) mx-auto flex flex-col gap-4">
      <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-bold">Partie supprimée ailleurs</h1>
      <section className="cadre bg-surface p-4 flex flex-col gap-4">
        <p className="font-titre text-xl font-bold">{nom}</p>
        <p className="compte-message alerte" role="alert"><IconeAlerte /><span>Cette partie a été supprimée sur un autre appareil. Tu peux la garder ou l'abandonner.</span></p>
        <section className="cadre zc-partie">
          <h2 className="font-titre text-xl font-bold">Sur cet appareil</h2>
          <dl><dt>Région</dt><dd>{nomRegion(regionId)} · {nomZone(zoneId)}</dd>
            <dt>Dernière sauvegarde</dt><dd>{new Date(ecritLe).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}</dd>
            <dt>Temps de jeu</dt><dd>{duree(tempsJeuMs)}</dd></dl>
        </section>
        {erreur && <p className="compte-message erreur" role="alert">{erreur}</p>}
        <button type="button" className="plaque plaque-action min-h-12" disabled={occupe} onClick={quandGarder}>La garder</button>
        <button ref={declencheur} type="button" className="plaque zc-danger min-h-12" disabled={occupe} onClick={() => fixerConfirmation(true)}>L'abandonner</button>
      </section>
    </div>
    {confirmation && <dialog ref={dialogue} className="cadre zc-dialogue" aria-modal="true" aria-labelledby="zc-abandon-titre"
      onCancel={e => { e.preventDefault(); if (!occupe) fixerConfirmation(false); }}
      onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); if (!occupe) fixerConfirmation(false); } }}>
      <h2 ref={titreDialogue} id="zc-abandon-titre" tabIndex={-1} className="font-titre text-xl font-bold">Abandonner « {nom} » ?</h2>
      <p>Sa progression sera perdue pour de bon. Tes diamants, tes succès et tes skins restent sur ton compte.</p>
      <button type="button" className="plaque zc-danger min-h-12" disabled={occupe} onClick={() => { quandAbandonner(); fixerConfirmation(false); }}>L'abandonner</button>
      <button type="button" className="plaque min-h-12" disabled={occupe} onClick={() => fixerConfirmation(false)}>Annuler</button>
    </dialog>}
  </main>;
}
