import { useEffect, useRef, useState } from 'react';
import { chargerCasino, lireMise } from '../core/casino';
import type { ActionsCasino } from './store-casino';
import { actionCasino, IllustrationCasino, MiseCasino, mouvementReduit } from './casino-interface';

const donnees = chargerCasino();
export function MachineASous({ actions, signaler, occuper }: { actions: ActionsCasino; signaler(m: string): void; occuper(b: boolean): void }) {
  const [mise, changer] = useState('1');
  const [symboles, afficher] = useState(['7', 'Pikachu', 'Baie']);
  const [tourne, tourner] = useState([false, false, false]);
  const nettoyage = useRef<() => void>(() => {});
  const actif = useRef(false);
  useEffect(() => () => nettoyage.current(), []);
  function lancer() {
    if (actif.current) return;
    const resultat = actions.jouerMachine(lireMise(mise));
    if (!resultat.ok) { signaler(resultat.raison); return; }
    if (mouvementReduit()) { afficher([...resultat.symboles]); signaler(resultat.message); return; }
    actif.current = true; occuper(true); tourner([true, true, true]); signaler('Les rouleaux tournent…');
    const intervalles = donnees.animation.rouleaux.map((_, i) => setInterval(() => {
      afficher(avant => avant.map((s, j) => j === i ? donnees.symboles[Math.floor(Math.random() * donnees.symboles.length)]!.id : s));
    }, donnees.animation.defilement));
    const delais = donnees.animation.rouleaux.map((ms, i) => setTimeout(() => {
      clearInterval(intervalles[i]);
      afficher(avant => avant.map((s, j) => j === i ? resultat.symboles[i]! : s));
      tourner(avant => avant.map((b, j) => j === i ? false : b));
      if (i === donnees.animation.rouleaux.length - 1) { actif.current = false; occuper(false); signaler(resultat.message); }
    }, ms));
    nettoyage.current = () => { intervalles.forEach(clearInterval); delais.forEach(clearTimeout); };
  }
  return <section className="grid gap-4" aria-label="Machine à sous">
    <h2 className="font-titre text-2xl">Machine à sous</h2>
    <div className="grid grid-cols-3 gap-2" aria-label="Rouleaux">{symboles.map((id, i) => {
      const symbole = donnees.symboles.find(s => s.id === id)!;
      return <div key={i} data-tourne={tourne[i]} className="grid min-w-0 justify-items-center gap-2 border-2 border-bordure bg-fond p-2">
        <IllustrationCasino image={symbole.image} nom={symbole.nom} /><span>{symbole.nom}</span></div>;
    })}</div>
    <MiseCasino valeur={mise} changer={changer} bloque={tourne.some(Boolean)} />
    <button className={actionCasino} disabled={tourne.some(Boolean)} onClick={lancer}>Lancer</button>
    <details><summary>Gains de la machine</summary><ul>{donnees.symboles.map(s => <li key={s.id}>Trois {s.nom} : ×{s.gain}</li>)}
      <li>Deux Baies : ×{donnees.deuxBaies.gain}</li></ul><p>La mise est débitée avant chaque lancer.</p></details>
  </section>;
}
