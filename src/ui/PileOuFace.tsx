import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { chargerCasino, lireMise, type Face } from '../core/casino';
import type { ActionsCasino } from './store-casino';
import { Illustration, MiseCasino, mouvementReduit, Pluie, piecesPourGain, usePluie, type Occuper, type Signaler } from './casino-interface';

const donnees = chargerCasino();
const nomFace = (f: Face) => f === 'pile' ? 'Pile' : 'Face';
type Props = { actions: ActionsCasino; signaler: Signaler; occuper: Occuper; jetons: number; verdict: ReactNode };

/** La pièce tourne 4 tours en 500 ms (V1), puis se pose sur le côté tiré : Pikachu pour Face, Poké Ball pour Pile. */
export function PileOuFace({ actions, signaler, occuper, jetons, verdict }: Props) {
  const [mise, changer] = useState('1'), [choix, choisir] = useState<Face>('face');
  const [face, afficher] = useState<Face>('face'), [tourne, tourner] = useState(false), [fin, fixer] = useState(0);
  const delai = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const actif = useRef(false);
  const pluie = usePluie();
  useEffect(() => () => clearTimeout(delai.current), []);
  function lancer() {
    if (actif.current) return;
    const resultat = actions.jouerPileOuFace(lireMise(mise), choix);
    if (!resultat.ok) { signaler(resultat.raison, 'alerte'); return; }
    const terminer = () => {
      afficher(resultat.resultat); tourner(false); actif.current = false; occuper(null);
      signaler(`${nomFace(resultat.resultat)}. ${resultat.message}`, resultat.gain > 0 ? 'gain' : 'perte');
      if (resultat.gain > 0) { actions.sonnerCasino(); pluie.lancer(piecesPourGain(resultat.gain, lireMise(mise))); }
    };
    if (mouvementReduit()) { terminer(); return; }
    fixer(1440 + (resultat.resultat === 'pile' ? 180 : 0));
    actif.current = true; tourner(true); occuper(resultat.gain); signaler('La pièce tourne…', 'info');
    delai.current = setTimeout(terminer, donnees.animation.piece);
  }
  const depart = face === 'pile' ? 180 : 0;
  const style = { '--depart': `${depart}deg`, '--fin': `${fin}deg`, animationDuration: `${donnees.animation.piece}ms`,
    transform: tourne ? undefined : `rotateY(${depart}deg)` } as CSSProperties;
  return <div className="cs-jeu">
    <div className="cs-plateau">
      <div className="cs-pluie-zone">
        <div className="cs-piece-scene">
          <div className={tourne ? 'cs-piece coin-spin' : 'cs-piece'} style={style} role="img" aria-label={tourne ? 'Pièce en l’air' : `Pièce sur ${nomFace(face)}`}>
            <div className="cs-face cs-f-face"><Illustration image={donnees.pileOuFace.faces.face} nom="Face" /></div>
            <div className="cs-face cs-f-pile"><Illustration image={donnees.pileOuFace.faces.pile} nom="Pile" /></div>
          </div>
        </div>
        <Pluie zone={pluie.zone} />
      </div>
      {verdict}
    </div>
    <div className="cs-commandes">
      <MiseCasino valeur={mise} changer={changer} bloque={tourne} jetons={jetons} />
      <div className="cs-choix" role="group" aria-label="Ton côté">{(['face', 'pile'] as const).map(f =>
        <button key={f} type="button" className="plaque" disabled={tourne} aria-pressed={choix === f} onClick={() => choisir(f)}>
          {nomFace(f)}<small>{f === 'face' ? 'Pikachu' : 'Poké Ball'}</small></button>)}</div>
      <button type="button" className="plaque plaque-action cs-grand" disabled={tourne} onClick={lancer}>Lancer la pièce</button>
      <p className="cs-rappel">Gain ×{donnees.pileOuFace.gain} si tu trouves le bon côté.</p>
    </div>
  </div>;
}
