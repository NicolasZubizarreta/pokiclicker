import { useId, useRef } from 'react';
import type { ReglagesArret } from '../core/sauvegarde-types';
import { BoutonAction } from './BoutonAction';
import { Interrupteur } from './Interrupteur';
import { ArretAuto, AutoAttaque, AutoClic, ReglagesArret as IconeReglagesArret } from './icones';

export const optionsArret = [
  ['commun', 'Commun'], ['peuCommun', 'Peu commun'], ['rare', 'Rare'],
  ['tresRare', 'Très rare'], ['legendaire', 'Légendaire'],
  ['shiny', 'Chromatique'], ['nouveau', 'Nouveau Pokémon'],
] as const;

/** Contenu commun des fenêtres de réglage de l'arrêt : croix en haut à droite, 8 interrupteurs sur deux lignes séparés par un filet. « Tous » coche ou décoche les 7 types. */
export function ContenuArret({ id, titre, arret, regler, lienAutoClic, fermer }: {
  id: string; titre: string; arret: ReglagesArret; regler(partiel: Partial<ReglagesArret>): void;
  lienAutoClic?: LienAutoClic; fermer(): void;
}) {
  const tous = optionsArret.every(([cle]) => arret[cle]);
  const basculerTous = () => regler(Object.fromEntries(optionsArret.map(([cle]) => [cle, !tous])));
  const cellules: { cle: string; nom: string; court: string; actif: boolean; basculer(): void }[] = [
    { cle: 'tous', nom: 'Tous', court: 'Tous', actif: tous, basculer: basculerTous },
    ...optionsArret.map(([cle, nom]) => ({ cle, nom, court: nom === 'Nouveau Pokémon' ? 'Nouveau' : nom, actif: arret[cle],
      basculer: () => regler({ [cle]: !arret[cle] }) })),
  ];
  return <div className="fiche-contenu grid min-w-0 gap-4 p-4 lg:p-8">
    <header className="flex items-start justify-between gap-4">
      <h2 id={id} className="font-titre text-xl">{titre}</h2>
      <button type="button" aria-label="Fermer" onClick={fermer} className="cadre grid min-h-11 min-w-11 shrink-0 place-items-center bg-surface">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" /></svg>
      </button>
    </header>
    <h3>L'attaque auto s'arrête quand apparaît</h3>
    <div role="group" aria-label="Types d'arrêt" className="grid auto-rows-fr grid-cols-4">
      {cellules.map((cellule, rang) => <label key={cellule.cle}
        className={`flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 px-1 py-2 text-center text-xs sm:text-base${rang % 4 === 0 ? '' : ' border-l border-bordure'}`}>
        <span>{cellule.court}</span>
        <Interrupteur nom={cellule.nom} actif={cellule.actif} basculer={cellule.basculer} />
      </label>)}
    </div>
    {lienAutoClic && <CurseurAutoClicLie lien={lienAutoClic} />}
  </div>;
}

export type LienAutoClic = { lie: boolean; regler(actif: boolean): void };
/** Même réglage que Menu, Réglages : il est ici pour ne pas avoir à quitter le combat. Bloc à part des cases de l'arrêt. */
export function CurseurAutoClicLie({ lien }: { lien: LienAutoClic }) {
  return <section aria-label="Auto-clic" className="grid gap-2 border-t border-bordure pt-4">
    <h3>Auto-clic</h3>
    <div className="flex items-center justify-between gap-4">
      <p>Lié à l'attaque auto</p>
      <Interrupteur nom="Auto-clic lié à l'attaque auto" actif={lien.lie} basculer={() => lien.regler(!lien.lie)} />
    </div>
    <p className="text-sm text-texte-doux">Sans effet tant que tu n'as pas acheté les Restes.</p>
  </section>;
}

export function ReglagesCombat({ autoAttaque, arret, basculer, regler, autoClic, basculerAutoClic, lienAutoClic }: {
  autoAttaque: boolean;
  lienAutoClic?: LienAutoClic;
  arret: ReglagesArret;
  basculer(): void;
  regler(partiel: Partial<ReglagesArret>): void;
  autoClic?: { possede: boolean; actif: boolean };
  basculerAutoClic?(): void;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const declencheur = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const fermer = () => dialogue.current?.close();

  return <div className="bandeau-action-groupe">
    <BoutonAction data-raccourci="auto" icone={<AutoAttaque />} nom="Auto-attaque" actif={autoAttaque} onClick={basculer} />
    {autoClic && basculerAutoClic && <BoutonAction icone={<AutoClic />} nom="Auto-clic" actif={autoClic.actif}
      verrouille={!autoClic.possede} infobulle={!autoClic.possede ? "Nécessite l'objet Restes" : undefined}
      onClick={basculerAutoClic} />}
    <BoutonAction data-raccourci="arret" icone={<ArretAuto />} nom="Arrêt auto" actif={arret.actif}
      onClick={() => regler({ actif: !arret.actif })} />
    <BoutonAction data-tuto="reglage" data-raccourci="reglage" icone={<IconeReglagesArret />} nom="Réglages de l'arrêt"
      onClick={event => { declencheur.current = event.currentTarget; dialogue.current?.showModal(); }} />
    <dialog ref={dialogue} aria-labelledby={titre}
      className="fiche-pokemon cadre w-full max-w-3xl bg-surface p-0 text-base text-texte"
      onClose={() => declencheur.current?.focus()}
      onCancel={event => { event.preventDefault(); fermer(); }}>
      <ContenuArret id={titre} titre="Réglages de l'arrêt" arret={arret} regler={regler} lienAutoClic={lienAutoClic} fermer={fermer} />
    </dialog>
  </div>;
}
