import { useId } from 'react';
import { IconeObjet } from './icones';
import { cheminSprite } from './precharger';

export const boutonCasino = 'min-h-11 min-w-11 rounded-sm border-2 border-bordure bg-surface-2 px-4 py-2 hover:enabled:bg-selection disabled:text-texte-doux focus-visible:outline-focus';
export const actionCasino = boutonCasino.replace('bg-surface-2', 'bg-action text-action-texte').replace('hover:enabled:bg-selection', 'hover:enabled:bg-action-survol');
export const mouvementReduit = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
export function IllustrationCasino({ image, nom }: { image: string | null; nom: string }) {
  return <IconeObjet image={image?.startsWith('pokemon/') ? cheminSprite(Number(image.split('/')[1])) : image ? `img/${image}` : null} nom={nom} />;
}
export function MiseCasino({ valeur, changer, bloque = false }: { valeur: string; changer(v: string): void; bloque?: boolean }) {
  const id = useId();
  return <div className="flex flex-wrap items-center gap-2"><label htmlFor={id}>Mise</label>
    <input id={id} className="min-h-11 w-24 border-2 border-bordure bg-fond p-2" inputMode="numeric" value={valeur}
      disabled={bloque} onChange={e => changer(e.target.value)} /><span>jetons</span></div>;
}
