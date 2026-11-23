import { useCodeKonami } from './useCodeKonami';
import type { StoreJeu } from './store';
import { Image } from './Image';

/** Une balle par position horizontale (en %, de 37 en 37 modulo 96) ; le retard de chute revient par paquets de 4. */
const POSITIONS = ['left-[0%]', 'left-[37%]', 'left-[74%]', 'left-[15%]', 'left-[52%]', 'left-[89%]', 'left-[30%]', 'left-[67%]',
  'left-[8%]', 'left-[45%]', 'left-[82%]', 'left-[23%]', 'left-[60%]', 'left-[1%]', 'left-[38%]', 'left-[75%]'];
const RETARDS = ['[--retard-balle:0ms]', '[--retard-balle:100ms]', '[--retard-balle:200ms]', '[--retard-balle:300ms]'];

export function PluieBalles({ store }: { store: StoreJeu }) {
  const visible = useCodeKonami(store);
  if (!visible) return null;
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-20 overflow-hidden motion-reduce:hidden">
    {POSITIONS.map((position, i) => <span key={position} className={`absolute opacity-0 motion-safe:pluie-balle ${position} ${RETARDS[i % 4]}`}>
      <Image src="img/objets/poke-ball.png" genre="sprite" largeurDisponible={48} alt="" />
    </span>)}
  </div>;
}
