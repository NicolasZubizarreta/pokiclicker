import { useEffect, useRef, useState, type ReactNode } from 'react';
import { chargerCasino, lireMise } from '../core/casino';
import type { ActionsCasino } from './store-casino';
import { Illustration, MiseCasino, mouvementReduit, Pluie, piecesPourGain, usePluie, type Occuper, type Signaler } from './casino-interface';

const donnees = chargerCasino();
type Props = { actions: ActionsCasino; signaler: Signaler; occuper: Occuper; jetons: number; verdict: ReactNode };

/** Rouleaux de la V1 : un symbole au hasard toutes les 80 ms, arrêt à 700 / 950 / 1200 ms, puis une petite retombée de 350 ms. */
export function MachineASous({ actions, signaler, occuper, jetons, verdict }: Props) {
  const [mise, changer] = useState('1');
  const [symboles, afficher] = useState(['7', 'Pikachu', 'Baie']);
  const [tourne, tourner] = useState([false, false, false]);
  const [arret, arreter] = useState([false, false, false]);
  const [gagnant, gagner] = useState(false);
  const nettoyage = useRef<() => void>(() => {});
  const actif = useRef(false);
  const pluie = usePluie();
  useEffect(() => () => nettoyage.current(), []);
  function lancer() {
    if (actif.current) return;
    const resultat = actions.jouerMachine(lireMise(mise));
    if (!resultat.ok) { signaler(resultat.raison, 'alerte'); return; }
    const verdictFinal = () => {
      signaler(resultat.message, resultat.gain > 0 ? 'gain' : 'perte');
      gagner(resultat.gain > 0);
      if (resultat.gain > 0) { actions.sonnerCasino(); pluie.lancer(piecesPourGain(resultat.gain, lireMise(mise))); }
    };
    gagner(false);
    if (mouvementReduit()) { afficher([...resultat.symboles]); verdictFinal(); return; }
    actif.current = true; occuper(resultat.gain); tourner([true, true, true]); signaler('Les rouleaux tournent…', 'info');
    const intervalles = donnees.animation.rouleaux.map((_, i) => setInterval(() => {
      afficher(avant => avant.map((s, j) => j === i ? donnees.symboles[Math.floor(Math.random() * donnees.symboles.length)]!.id : s));
    }, donnees.animation.defilement));
    const delais = donnees.animation.rouleaux.map((ms, i) => setTimeout(() => {
      clearInterval(intervalles[i]);
      afficher(avant => avant.map((s, j) => j === i ? resultat.symboles[i]! : s));
      tourner(avant => avant.map((b, j) => j === i ? false : b));
      arreter(avant => avant.map((b, j) => j === i ? true : b));
      delais.push(setTimeout(() => arreter(avant => avant.map((b, j) => j === i ? false : b)), donnees.animationJeux.rouleauxArret));
      if (i === donnees.animation.rouleaux.length - 1) { actif.current = false; occuper(null); verdictFinal(); }
    }, ms));
    const precedent = nettoyage.current;
    nettoyage.current = () => { precedent(); intervalles.forEach(clearInterval); delais.forEach(clearTimeout); };
  }
  const enCours = tourne.some(Boolean);
  return <div className="cs-jeu">
    <div className="cs-plateau">
      <div className="cs-pluie-zone">
        <div className="cs-reels" aria-label="Rouleaux">{symboles.map((id, i) => {
          const symbole = donnees.symboles.find(s => s.id === id)!;
          return <div key={i} className="cs-rouleau" data-tourne={tourne[i]} data-arret={arret[i]} data-gagnant={gagnant && !enCours}>
            <div className="cs-cell"><Illustration image={symbole.image} nom={symbole.nom} /></div>
            <span className="cs-sr">{symbole.nom}</span>
          </div>;
        })}</div>
        <Pluie zone={pluie.zone} />
      </div>
      {verdict}
    </div>
    <div className="cs-commandes">
      <MiseCasino valeur={mise} changer={changer} bloque={enCours} jetons={jetons} />
      <button type="button" className="plaque plaque-action cs-grand" disabled={enCours} onClick={lancer}>Lancer</button>
      <details className="cs-gains"><summary>Gains de la machine</summary>
        <ul>{donnees.symboles.map(s => <li key={s.id}><Illustration image={s.image} nom={s.nom} /><span>Trois {s.nom}</span><span className="cs-mult">×{s.gain}</span></li>)}
          <li><Illustration image="objets/cheri-berry.png" nom="Baie" /><span>Deux Baies</span><span className="cs-mult">×{donnees.deuxBaies.gain}</span></li></ul>
        <p className="cs-rappel">La mise est débitée avant chaque lancer.</p></details>
    </div>
  </div>;
}
