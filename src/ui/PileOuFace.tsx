import { useEffect, useRef, useState } from 'react';
import { chargerCasino, lireMise, type Face } from '../core/casino';
import type { ActionsCasino } from './store-casino';
import { actionCasino, boutonCasino, IllustrationCasino, MiseCasino, mouvementReduit } from './casino-interface';

const donnees = chargerCasino();
export function PileOuFace({ actions, signaler, occuper }: { actions: ActionsCasino; signaler(m: string): void; occuper(b: boolean): void }) {
  const [mise, changer] = useState('1'), [choix, choisir] = useState<Face>('face');
  const [face, afficher] = useState<Face>('face'), [tourne, tourner] = useState(false);
  const delai = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const actif = useRef(false);
  useEffect(() => () => clearTimeout(delai.current), []);
  function lancer() {
    if (actif.current) return;
    const resultat = actions.jouerPileOuFace(lireMise(mise), choix);
    if (!resultat.ok) { signaler(resultat.raison); return; }
    const terminer = () => {
      afficher(resultat.resultat); tourner(false); actif.current = false; occuper(false);
      signaler(`${resultat.resultat === 'pile' ? 'Pile' : 'Face'}. ${resultat.message}`);
    };
    if (mouvementReduit()) { terminer(); return; }
    actif.current = true; tourner(true); occuper(true); signaler('La pièce tourne…');
    delai.current = setTimeout(terminer, donnees.animation.piece);
  }
  return <section className="grid gap-4" aria-label="Pile ou face">
    <h2 className="font-titre text-2xl">Pile ou face</h2>
    <div className="grid justify-items-center gap-2 bg-fond p-4">
      <div className={tourne ? 'coin-spin' : ''}>
        <IllustrationCasino image={donnees.pileOuFace.faces[face]} nom={face === 'pile' ? 'Pile' : 'Face'} /></div>
      <span>{tourne ? 'La pièce tourne…' : face === 'pile' ? 'Pile' : 'Face'}</span>
    </div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Ton choix">{(['face', 'pile'] as const).map(f =>
      <button key={f} className={boutonCasino} disabled={tourne} aria-pressed={choix === f} onClick={() => choisir(f)}>{f === 'pile' ? 'Pile' : 'Face'}</button>)}</div>
    <MiseCasino valeur={mise} changer={changer} bloque={tourne} />
    <button className={actionCasino} disabled={tourne} onClick={lancer}>Lancer</button>
    <p>Choisis ton côté. Une victoire rapporte ×{donnees.pileOuFace.gain} ta mise.</p>
  </section>;
}
