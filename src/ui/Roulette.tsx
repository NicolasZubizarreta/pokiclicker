import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { chargerCasino, lireMise } from '../core/casino';
import { couleurRoulette, type CouleurRoulette, type PariRoulette } from '../core/jeux-casino';
import jeux from '../../data/casino-jeux.json';
import roue from '../../data/casino-roue.json';
import type { ActionsCasino } from './store-casino';
import { MiseCasino, mouvementReduit, Pluie, piecesPourGain, usePluie, type Occuper, type Signaler } from './casino-interface';

const duree = chargerCasino().animationJeux.roue;
const ordre = roue.ordre;
const pas = 360 / ordre.length;
type Choix = 'rouge' | 'noir' | 'pair' | 'impair' | 'plein';
const paris: { id: Choix; nom: string; gain: number; couleur?: 'rouge' | 'noir'; large?: boolean }[] = [
  { id: 'rouge', nom: 'Rouge', gain: jeux.roulette.gains.couleur, couleur: 'rouge' }, { id: 'noir', nom: 'Noir', gain: jeux.roulette.gains.couleur, couleur: 'noir' },
  { id: 'pair', nom: 'Pair', gain: jeux.roulette.gains.parite }, { id: 'impair', nom: 'Impair', gain: jeux.roulette.gains.parite },
  { id: 'plein', nom: 'Numéro plein', gain: jeux.roulette.gains.numero, large: true },
];
const nomCouleur = (c: CouleurRoulette) => jeux.roulette.couleurs[c].toLowerCase();
const stylePoche = (i: number) => ({ '--a': `${(i * pas).toFixed(3)}deg` }) as CSSProperties;
type Props = { actions: ActionsCasino; signaler: Signaler; occuper: Occuper; jetons: number; verdict: ReactNode };

/** Roue européenne : la bille fait 4 tours en 3,2 s et se pose sur la case tirée par le cœur (le tirage est fait avant l'animation). */
export function Roulette({ actions, signaler, occuper, jetons, verdict }: Props) {
  const [mise, changer] = useState('1'), [choix, choisir] = useState<Choix>('rouge'), [numero, saisirNumero] = useState('17');
  const [sortie, afficher] = useState<{ numero: number; couleur: CouleurRoulette } | null>(null), [tourne, tourner] = useState(false);
  const piste = useRef<HTMLDivElement>(null), bille = useRef<HTMLSpanElement>(null);
  const delai = useRef<ReturnType<typeof setTimeout> | undefined>(undefined), animations = useRef<Animation[]>([]);
  const actif = useRef(false);
  const pluie = usePluie();
  useEffect(() => () => { clearTimeout(delai.current); animations.current.forEach(a => a.cancel()); }, []);
  const numeroLu = /^\d{1,2}$/.test(numero.trim()) ? Number(numero) : NaN;
  const poser = (n: number) => saisirNumero(String(Math.min(jeux.roulette.cases - 1, Math.max(0, n))));
  function lancer() {
    if (actif.current) return;
    if (choix === 'plein' && !(numeroLu >= 0 && numeroLu < jeux.roulette.cases)) { signaler(`Choisis un numéro de 0 à ${jeux.roulette.cases - 1}.`, 'alerte'); return; }
    const pari: PariRoulette = choix === 'plein' ? { type: 'numero', numero: numeroLu }
      : choix === 'rouge' || choix === 'noir' ? { type: 'couleur', couleur: choix } : { type: 'parite', parite: choix };
    const resultat = actions.jouerRoulette(lireMise(mise), pari);
    if (!resultat.ok) { signaler(resultat.raison, 'alerte'); return; }
    const angle = ordre.indexOf(resultat.numero) * pas;
    const terminer = () => {
      afficher({ numero: resultat.numero, couleur: resultat.couleur }); tourner(false); actif.current = false; occuper(null);
      if (piste.current) piste.current.style.transform = `rotate(${angle}deg)`;
      signaler(resultat.message, resultat.gain > 0 ? 'gain' : 'perte');
      if (resultat.gain > 0) { actions.sonnerCasino(); pluie.lancer(piecesPourGain(resultat.gain, lireMise(mise))); }
    };
    if (mouvementReduit() || typeof piste.current?.animate !== 'function') { terminer(); return; }
    actif.current = true; tourner(true); occuper(resultat.gain); signaler('La bille tourne…', 'info');
    const options = { duration: duree, easing: 'cubic-bezier(0.15, 0.6, 0.2, 1)', fill: 'forwards' as const };
    animations.current = [
      piste.current.animate([{ transform: `rotate(${angle}deg)` }, { transform: `rotate(${angle - 1440}deg)` }], options),
      ...(bille.current ? [bille.current.animate([{ transform: 'translateY(calc(var(--r) * -1.15))' }, { transform: 'translateY(calc(var(--r) * -1))' }], options)] : []),
    ];
    delai.current = setTimeout(() => { animations.current.forEach(a => a.cancel()); animations.current = []; terminer(); }, duree);
  }
  const stylePiste: CSSProperties = { transform: `rotate(${sortie ? ordre.indexOf(sortie.numero) * pas : 0}deg)` };
  return <div className="cs-jeu">
    <div className="cs-plateau cs-tapis">
      <div className="cs-pluie-zone">
        <div className="cs-roue" role="img" aria-label={`Roue de roulette à ${jeux.roulette.cases} cases${sortie ? ` : dernier numéro ${sortie.numero}, ${nomCouleur(sortie.couleur)}` : ''}`}>
          {ordre.map((n, i) => <i key={n} className="cs-poche" data-c={couleurRoulette(n)} data-gagnant={!tourne && sortie?.numero === n}
            style={stylePoche(i)} />)}
          <div className="cs-piste" ref={piste} style={stylePiste}><span className="cs-bille" ref={bille} /></div>
          <div className="cs-centre" data-c={sortie?.couleur ?? 'vert'}><b>{sortie ? sortie.numero : '·'}</b></div>
        </div>
        <Pluie zone={pluie.zone} />
      </div>
      {verdict}
    </div>
    <div className="cs-commandes">
      <MiseCasino valeur={mise} changer={changer} bloque={tourne} jetons={jetons} />
      <div className="cs-paris" role="group" aria-label="Ta mise sur la table">{paris.map(p =>
        <button key={p.id} type="button" className={`plaque${p.large ? ' cs-large' : ''}`} disabled={tourne} aria-pressed={choix === p.id} onClick={() => choisir(p.id)}>
          {p.couleur && <span className="cs-puce" data-c={p.couleur} aria-hidden="true" />}{p.nom}<small>×{p.gain}</small></button>)}</div>
      {choix === 'plein' && <div className="cs-numero"><label htmlFor="cs-num-plein">Ton numéro</label>
        <div className="cs-pas">
          <button type="button" className="plaque" disabled={tourne} aria-label="Numéro précédent" onClick={() => poser((Number.isNaN(numeroLu) ? 0 : numeroLu) - 1)}>−</button>
          <input id="cs-num-plein" className="cs-champ" inputMode="numeric" pattern="[0-9]*" autoComplete="off" value={numero} disabled={tourne} onChange={e => saisirNumero(e.target.value)} />
          <button type="button" className="plaque" disabled={tourne} aria-label="Numéro suivant" onClick={() => poser((Number.isNaN(numeroLu) ? 0 : numeroLu) + 1)}>+</button>
        </div></div>}
      <button type="button" className="plaque plaque-action cs-grand" disabled={tourne} onClick={lancer}>Lancer la bille</button>
      <details className="cs-gains"><summary>Gains de la roulette</summary><ul>
        <li><span className="cs-puce" data-c="rouge" aria-hidden="true" /><span className="cs-puce" data-c="noir" aria-hidden="true" /><span>Rouge ou noir</span><span className="cs-mult">×{jeux.roulette.gains.couleur}</span></li>
        <li><span>Pair ou impair</span><span className="cs-mult">×{jeux.roulette.gains.parite}</span></li>
        <li><span>Numéro plein (0 à {jeux.roulette.cases - 1})</span><span className="cs-mult">×{jeux.roulette.gains.numero}</span></li>
        <li><span className="cs-puce" data-c="vert" aria-hidden="true" /><span>Le 0 perd les mises simples</span></li></ul></details>
    </div>
  </div>;
}
