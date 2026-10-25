import { useState } from 'react';
import { Image } from './Image';
import { IconeBadge } from './icones';

export type PropsBoiteBadges = {
  badges: { id: string; nom: string; description: string; image: string | null; arene: string; obtenu: boolean }[];
  cache?: string | null;
  claque?: string | null;
};

export function BoiteBadges({ badges, cache, claque }: PropsBoiteBadges) {
  const [survole, survoler] = useState<string | null>(null);
  const [focus, focaliser] = useState<string | null>(null);
  const actif = badges.find(badge => badge.id === (survole ?? focus));

  return <div className="grid gap-4 text-base">
    <div className="grid grid-cols-4 gap-4 overflow-visible">
      {badges.map(badge => <button key={badge.id} type="button"
        aria-label={`Badge ${badge.nom}${badge.obtenu ? '' : `, à gagner : ${badge.arene}`}`}
        className={`flex aspect-square min-h-11 min-w-11 items-center justify-center rounded-plein p-2 ${badge.obtenu ? 'badge-obtenu' : 'badge-vide'} ${cache === badge.id ? 'opacity-0' : ''} ${claque === badge.id ? 'badge-slam overflow-visible' : ''}`}
        onMouseEnter={() => survoler(badge.id)} onMouseLeave={() => survoler(null)}
        onFocus={() => focaliser(badge.id)} onBlur={() => focaliser(null)}>
        {badge.image !== null
          ? <Image src={badge.image} genre="badge" alt=""
            className={`h-auto w-full ${badge.obtenu ? '' : 'brightness-0 invert opacity-30'}`} />
          : <span className={badge.obtenu ? '' : 'brightness-0 invert opacity-30'}><IconeBadge /></span>}
      </button>)}
    </div>
    <p role="status">{actif ? `${actif.nom} : ${actif.description}` : badges.some(badge => badge.obtenu)
      ? 'Survole ou touche un badge pour voir son effet.' : "Aucun badge obtenu. Bats les champions d'arène !"}</p>
  </div>;
}
