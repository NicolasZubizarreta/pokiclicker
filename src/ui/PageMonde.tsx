import { useEffect, useRef, type ReactNode } from 'react';
import monde from '../../data/monde.json';
import { Image } from './Image';
import { IconeRetour } from './icones-menu';
import { IconeCadenas } from './icones';
import { useTelephone } from './useTelephone';
import { useStore } from 'zustand';
import { storeJeu } from './store';
import './MenuPC.css';

function Regions({ telephone, children }: { telephone: boolean; children: ReactNode }) {
  return telephone ? <>{children}</> : <section className="cadre monde-pc-regions"><h2 className="font-titre text-lg">Autres régions</h2>{children}</section>;
}

export function PageMonde({ retour, jouerKanto }: { retour(): void; jouerKanto(): void }) {
  const telephone = useTelephone();
  const lieu = useStore(storeJeu, e => e.lieu);
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  return (
    <div className={telephone ? 'mx-auto max-w-screen-xl space-y-4 text-base' : 'monde-pc'}>
      <header className="flex items-center gap-2">
        <button type="button" aria-label={telephone ? 'Retour' : 'Retour au menu'} onClick={retour}
          className="flex min-h-11 min-w-11 items-center justify-center bg-surface-2 hover:bg-selection">
          <IconeRetour />
          {!telephone && 'Retour au menu'}
        </button>
        <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-semibold">{telephone ? 'Monde Pokémon' : 'Monde'}</h1>
      </header>
      {telephone && <p className="text-texte-doux">Choisis la région où tu veux jouer.</p>}
      <button type="button" aria-label="Jouer à Kanto" onClick={jouerKanto}
        className="cadre min-h-11 w-full overflow-hidden bg-surface p-0 text-left hover:bg-selection">
        <Image src="img/decors/carte-kanto.webp" genre="decor" alt="" couvrir={telephone} />
        <span className="flex items-center gap-2 p-4">
          <span className="flex-1 font-titre text-lg font-semibold">Kanto{!telephone && ` · reprendre à ${lieu?.nom ?? 'Kanto'}`}</span>
          {telephone && <span className="border border-succes-base bg-succes-fond px-2 text-sm text-succes-texte">Jouable</span>}
        </span>
      </button>
      <Regions telephone={telephone}>
      <ul className="grid grid-cols-2 gap-2">
        {monde.regionsVerrouillees.map(nom => (
          <li key={nom} className="flex min-h-16 items-center gap-3 border border-dashed border-bordure bg-surface-2 px-3 py-2 text-texte-doux">
            <span aria-hidden="true"><IconeCadenas /></span>
            <span>
              <b className="block">{nom}</b>
              <small className="block text-sm">Bientôt</small>
            </span>
          </li>
        ))}
      </ul>
      </Regions>
    </div>
  );
}
