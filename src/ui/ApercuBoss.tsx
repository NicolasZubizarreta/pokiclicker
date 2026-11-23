import { useId, useRef, useState, type ReactNode } from 'react';
import type { ApercuBoss as DonneesBoss } from '../core/apercu-boss';
import { chargerPokemon, nomType } from '../core/pokemon';
import { storeJeu, type StoreJeu } from './store';
import { Image } from './Image';
import { cheminSprite } from './precharger';
import { formaterNombre } from './nombres';
import { useStore } from 'zustand';

export function ContenuBoss({ boss }: { boss: DonneesBoss }) {
  const chrono = formaterNombre(boss.chronoMs / 1000);
  return <>
    <Image src={cheminSprite(boss.numero)} genre="sprite" alt="" />
    <p>{chargerPokemon().parNumero(boss.numero).nom} · Niveau {boss.niveau}</p>
    <p>{boss.types.map(nomType).join(' · ')}</p>
    <p>PV {formaterNombre(boss.pvMax)} · Chrono {chrono} s</p>
    <p>{boss.dps <= 0 ? "Ton équipe n'inflige aucun dégât." : `Ton DPS actuel le bat en ${boss.secondesPourVaincre} s : ${boss.assezRapide ? 'dans les temps.' : `trop lent pour les ${chrono} s du chrono.`}`}</p>
    <p className="text-texte-doux">Estimation sans tes clics.</p>
  </>;
}

export function ApercuBoss({ children, store = storeJeu }: { children: ReactNode; store?: StoreJeu }) {
  const disponible = useStore(store, etat => Boolean(etat.zone && (etat.zone.type === 'ligue' || etat.zone.etapes === 10) && etat.zone.id !== 'kanto.labo' && !etat.zone.id.startsWith('evenement:') && !etat.evenement));
  const [boss, definir] = useState<DonneesBoss | null>(null);
  const dialogue = useRef<HTMLDialogElement>(null);
  const bouton = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const fermer = () => dialogue.current?.close();
  if (!disponible) return <>{children}</>;
  return <>
    <button ref={bouton} type="button" aria-label="Aperçu du boss" className="relative inline-flex min-h-11 min-w-11 items-center justify-center" onClick={() => {
      const apercu = store.getState().apercuBoss();
      if (apercu) { definir(apercu); dialogue.current?.showModal(); }
    }}>{children}</button>
    <dialog ref={dialogue} aria-labelledby={titre} className="fiche-pokemon cadre w-full max-w-lg bg-surface p-4 text-base text-texte tabular-nums"
      onClose={() => bouton.current?.focus()} onCancel={event => { event.preventDefault(); fermer(); }} onPointerDown={event => { if (event.target === event.currentTarget) fermer(); }}>
      <h2 id={titre} className="font-titre text-xl">Boss de la zone</h2>
      {boss && <ContenuBoss boss={boss} />}
      <button className="plaque min-h-11 px-4" onClick={fermer}>Fermer</button>
    </dialog>
  </>;
}
