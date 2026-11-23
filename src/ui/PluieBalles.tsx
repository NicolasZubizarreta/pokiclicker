import type { CSSProperties } from 'react';
import { useCodeKonami } from './useCodeKonami';
import type { StoreJeu } from './store';
import { Image } from './Image';

export function PluieBalles({ store }: { store: StoreJeu }) {
  const visible = useCodeKonami(store);
  if (!visible) return null;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden motion-reduce:hidden">
    {Array.from({ length: 16 }, (_, i) => <span key={i} className="absolute opacity-0 motion-safe:pluie-balle"
      style={{ left: `${(i * 37) % 96}%`, '--retard-balle': `${i % 4 * 100}ms` } as CSSProperties}>
      <Image src="img/objets/poke-ball.png" genre="sprite" largeurDisponible={48} alt="" />
    </span>)}
  </div>;
}
