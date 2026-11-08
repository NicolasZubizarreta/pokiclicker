import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Image } from './Image';
import { IconeBadge } from './icones';
import { useTelephone } from './useTelephone';
import './DexPC.css';

export type PropsBoiteBadges = {
  badges: { id: string; nom: string; description: string; image: string | null; arene: string; obtenu: boolean }[];
  cache?: string | null;
  claque?: string | null;
};

export function BoiteBadges({ badges, cache, claque }: PropsBoiteBadges) {
  const [survole, survoler] = useState<string | null>(null);
  const [focus, focaliser] = useState<string | null>(null);
  const [selection, choisir] = useState<string | null>(null);
  const [dansFenetre, situer] = useState(false);
  const racine = useCallback((element: HTMLDivElement | null) => {
    if (element) situer(element.closest('dialog') !== null);
  }, []);
  const telephone = useTelephone() || dansFenetre;
  const detail = badges.find(b => b.id === selection);
  const actif = badges.find(badge => badge.id === (survole ?? focus));

  return <div ref={racine} className={telephone ? 'grid gap-4 text-base' : 'badges-pc grid gap-4 text-base'}>
    {!telephone && <p>{badges.some(b => b.obtenu) ? 'Clique un badge pour voir son effet.' : "Aucun badge obtenu. Bats les champions d'arène !"}</p>}
    <div className="grid grid-cols-4 gap-4 overflow-visible">
      {badges.map(badge => <button key={badge.id} type="button"
        onClick={() => choisir(badge.id)}
        aria-label={`Badge ${badge.nom}${badge.obtenu ? '' : `, à gagner : ${badge.arene}`}`}
        className={`flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-plein p-2 ${badge.obtenu ? 'badge-obtenu' : 'badge-vide'} ${cache === badge.id ? 'opacity-0' : ''} ${claque === badge.id ? 'badge-slam overflow-visible' : ''}`}
        onMouseEnter={() => survoler(badge.id)} onMouseLeave={() => survoler(null)}
        onFocus={() => focaliser(badge.id)} onBlur={() => focaliser(null)}>
        {badge.image !== null
          ? <Image src={badge.image} genre="badge" alt=""
            className={`h-auto w-full ${badge.obtenu ? '' : 'brightness-0 invert opacity-30'}`} />
          : <span className={badge.obtenu ? '' : 'brightness-0 invert opacity-30'}><IconeBadge /></span>}
        {!telephone && <><strong>{badge.nom}</strong><span>{badge.obtenu ? badge.description : `à gagner : ${badge.arene}`}</span></>}
      </button>)}
    </div>
    {!telephone && detail && <DetailBadge badge={detail} fermer={() => choisir(null)} />}
    <p role="status">{actif ? `${actif.nom} : ${actif.description}` : badges.some(badge => badge.obtenu)
      ? 'Survole ou touche un badge pour voir son effet.' : "Aucun badge obtenu. Bats les champions d'arène !"}</p>
  </div>;
}

function DetailBadge({ badge, fermer }: { badge: PropsBoiteBadges['badges'][number]; fermer(): void }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const origine = document.activeElement;
    const element = dialogue.current!;
    if (element.showModal) element.showModal();
    else element.open = true;
    element.querySelector('button')?.focus();
    return () => {
      element.close?.();
      if (origine instanceof HTMLElement && origine.isConnected) origine.focus();
    };
  }, []);
  return createPortal(<dialog ref={dialogue} aria-label={`Détail du badge ${badge.nom}`}
    className="badge-detail-pc cadre m-auto bg-surface p-6 text-texte"
    onCancel={e => { e.preventDefault(); fermer(); }}
    onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); dialogue.current?.querySelector('button')?.focus(); } }}>
    <h2 className="font-titre text-xl font-bold">{badge.nom}</h2>
    {badge.image && <Image genre="badge" src={badge.image} alt="" className={`mx-auto size-24 object-contain ${badge.obtenu ? '' : 'brightness-0 opacity-30'}`} />}
    <p>{badge.description}</p>{!badge.obtenu && <p>à gagner : {badge.arene}</p>}
    <button type="button" className="plaque min-h-11 px-3" onClick={fermer}>Fermer</button>
  </dialog>, document.body);
}
