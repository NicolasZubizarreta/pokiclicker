import { useEffect, useRef, useState, type ReactNode } from 'react';
import { chargerCasino, lireMise } from '../core/casino';
import jeux from '../../data/casino-jeux.json';
import type { ActionsCasino } from './store-casino';
import { Illustration, MiseCasino, mouvementReduit, Pluie, piecesPourGain, usePluie, type Occuper, type Signaler } from './casino-interface';

const delaiGrattage = chargerCasino().animationJeux.grattage;
const regle = jeux.gratter;
const symbole = (id: string) => regle.symboles.find(s => s.id === id)!;
type Ticket = { symboles: string[]; gain: number; mise: number; message: string; gagnant: string | null };
type Props = { actions: ActionsCasino; signaler: Signaler; occuper: Occuper; jetons: number; verdict: ReactNode };

/**
 * Le coup est joué à l'achat (jetons débités puis crédités par le cœur) ; les six cases se grattent ensuite une à une ou d'un coup,
 * et le gain n'apparaît dans le compteur qu'à la dernière case. Un rechargement en cours de ticket garde les jetons mais perd la révélation.
 */
export function CarteAGratter({ actions, signaler, occuper, jetons, verdict }: Props) {
  const [mise, changer] = useState('1');
  const [ticket, garder] = useState<Ticket | null>(null);
  const [gratte, grater] = useState<boolean[]>(() => Array(regle.cases).fill(false));
  const delais = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pluie = usePluie();
  const fini = ticket !== null && gratte.every(Boolean);
  const termine = useRef<Ticket | null>(null);
  useEffect(() => () => delais.current.forEach(clearTimeout), []);
  useEffect(() => {
    if (!ticket || !fini || termine.current === ticket) return;
    termine.current = ticket;
    occuper(null);
    signaler(ticket.message, ticket.gain > 0 ? 'gain' : 'perte');
    if (ticket.gain > 0) { actions.sonnerCasino(); pluie.lancer(piecesPourGain(ticket.gain, ticket.mise)); }
  }, [ticket, fini, occuper, signaler, actions, pluie]);
  function acheter() {
    if (ticket && !fini) return;
    const resultat = actions.gratter(lireMise(mise));
    if (!resultat.ok) { signaler(resultat.raison, 'alerte'); return; }
    garder({ symboles: resultat.symboles, gain: resultat.gain, mise: lireMise(mise), message: resultat.message, gagnant: resultat.combinaison?.symbole ?? null });
    grater(Array(regle.cases).fill(false));
    occuper(resultat.gain); signaler('Gratte les 6 cases.', 'info');
  }
  const decouvrir = (i: number) => grater(avant => avant.map((b, j) => j === i ? true : b));
  function toutGratter() {
    gratte.forEach((deja, i) => {
      if (deja) return;
      if (mouvementReduit()) decouvrir(i);
      else delais.current.push(setTimeout(() => decouvrir(i), i * delaiGrattage));
    });
  }
  return <div className="cs-jeu">
    <div className="cs-plateau">
      <div className="cs-pluie-zone">
        <div className="cs-ticket">
          <div className="cs-ticket-tete"><b>Carte à gratter</b><span>{regle.minimumIdentiques} symboles identiques ou plus : tu gagnes</span></div>
          <div className="cs-cases">{Array.from({ length: regle.cases }, (_, i) => {
            const id = ticket?.symboles[i], s = id ? symbole(id) : null;
            return <button key={i} type="button" className="cs-case" disabled={!ticket || gratte[i]} data-etat={gratte[i] ? 'gratte' : 'couvert'}
              data-gagnant={fini && !!id && id === ticket?.gagnant}
              aria-label={gratte[i] && s ? `Case ${i + 1} : ${s.nom}` : `Case ${i + 1}, à gratter`} onClick={() => decouvrir(i)}>
              <span className="cs-dessous" aria-hidden="true">{s && <Illustration image={s.image} nom={s.nom} />}</span>
              <span className="cs-couvercle cs-hachure" aria-hidden="true"><b>Gratte</b></span>
            </button>;
          })}</div>
        </div>
        <Pluie zone={pluie.zone} />
      </div>
      {verdict}
    </div>
    <div className="cs-commandes">
      <MiseCasino valeur={mise} changer={changer} bloque={!!ticket && !fini} jetons={jetons} />
      <button type="button" className="plaque plaque-action cs-grand" disabled={!!ticket && !fini} onClick={acheter}>Acheter une carte</button>
      <button type="button" className="plaque" disabled={!ticket || fini} onClick={toutGratter}>Tout gratter</button>
      <div className="cs-gains cs-gains-ouvert"><h3>Tableau des gains</h3>
        <ul>{regle.symboles.map(s => <li key={s.id}><Illustration image={s.image} nom={s.nom} /><span>{s.nom}</span>
          <span className="cs-mult">{s.gains.map((g, k) => `${regle.minimumIdentiques + k}→×${g}`).join(' · ')}</span></li>)}</ul></div>
    </div>
  </div>;
}
