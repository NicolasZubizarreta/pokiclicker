import { useRef, useState, type ReactNode } from 'react';
import { lireMise } from '../core/casino';
import type { FinBlackjack } from '../core/casino';
import type { ActionsCasino, AffichageCasino } from './store-casino';
import { CarteJeu, MiseCasino, Pictogramme, Pluie, piecesPourGain, usePluie, nomCouleur, type CouleurCarte, type Signaler } from './casino-interface';

const figures: Record<string, string> = { A: 'As', J: 'Valet', Q: 'Dame', K: 'Roi' };
const issues = { blackjack: 'Blackjack', gagne: 'Gagné', egalite: 'Égalité', perdu: 'Perdu', depasse: 'Dépassé', abandon: 'Abandon' } as const;
const tonIssue = (r: keyof typeof issues): 'gain' | 'perte' | 'nul' => r === 'blackjack' || r === 'gagne' ? 'gain' : r === 'egalite' ? 'nul' : 'perte';
type ResultatAction = ReturnType<ActionsCasino['tirerBlackjack']>;

/** `null` : carte cachée du croupier, dessinée face cachée (sa valeur n'est jamais dans l'interface). */
function Carte({ carte }: { carte: string | null }) {
  if (carte === null) return <CarteJeu dos />;
  const [rang, couleur] = carte.split('-') as [string, CouleurCarte];
  return <CarteJeu rang={rang} couleur={couleur} nom={`${figures[rang] ?? rang} de ${nomCouleur(couleur)}`} />;
}
const net = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

type MainAffichee = { cartes: (string | null)[]; valeur: number; mise: number; active: boolean; issue?: { texte: string; ton: 'gain' | 'perte' | 'nul' } };
function Mains({ titre, mains, croupier = false }: { titre: string; mains: MainAffichee[]; croupier?: boolean }) {
  return <div className={croupier ? 'cs-croupier' : 'cs-mains'} data-nb={mains.length}>{mains.map((m, i) =>
    <section key={i} aria-label={mains.length > 1 ? `${titre} ${i + 1}` : titre} aria-current={m.active ? 'true' : undefined}
      className="cs-main" data-actif={m.active}>
      <h3>{mains.length > 1 ? `${titre} ${i + 1}` : titre} · {m.valeur}</h3>
      <ul className="cs-cartes">{m.cartes.map((c, j) => <Carte key={j} carte={c} />)}</ul>
      {!croupier && <p>Mise {m.mise}{m.active ? ' · à jouer' : ''}</p>}
      {m.issue && <p className="cs-issue" data-ton={m.issue.ton}><Pictogramme ton={m.issue.ton} />{m.issue.texte}</p>}
    </section>)}</div>;
}

function TableFinale({ fin }: { fin: FinBlackjack }) {
  const mains = fin.mains.map(m => ({ cartes: m.cartes, valeur: m.valeur, mise: m.mise, active: false,
    issue: { texte: `${issues[m.resultat]} ${net(m.gain - m.mise)}`, ton: tonIssue(m.resultat) } }));
  return <>
    <Mains titre="Croupier Rocket" croupier mains={[{ cartes: fin.croupier, valeur: fin.valeurCroupier, mise: 0, active: false }]} />
    <Mains titre="Ta main" mains={mains} />
    {fin.assurance > 0 && <p className="cs-rappel">Assurance {fin.assurance} jetons · {fin.gainAssurance > 0 ? `payée +${fin.gainAssurance - fin.assurance}` : 'perdue'}</p>}
  </>;
}

type Props = { actions: ActionsCasino; main: AffichageCasino['blackjackEnCours']; signaler: Signaler; jetons: number; verdict: ReactNode };
export function TableBlackjack({ actions, main, signaler, jetons, verdict }: Props) {
  const [mise, changer] = useState('1');
  const [fin, garder] = useState<FinBlackjack | null>(null);
  const miseJouee = useRef(1);
  const pluie = usePluie();
  function jouer(action: () => ResultatAction, nouvelle = false) {
    const resultat = action();
    if (!resultat.ok) { signaler(resultat.raison, 'alerte'); return; }
    if (nouvelle) miseJouee.current = lireMise(mise);
    if (resultat.fin) {
      garder(resultat.fin);
      if (resultat.fin.gain > resultat.fin.engage) { actions.sonnerCasino(); pluie.lancer(piecesPourGain(resultat.fin.gain, miseJouee.current)); }
    } else garder(null);
    signaler(resultat.message, resultat.fin ? (resultat.fin.gain > resultat.fin.engage ? 'gain' : resultat.fin.gain < resultat.fin.engage ? 'perte' : 'info') : 'info');
  }
  const permis = main?.actions;
  const bouton = (nom: string, ouvert: boolean | undefined, action: () => ResultatAction, principal = false, large = false) =>
    <button type="button" className={`plaque${principal ? ' plaque-action' : ''}${large ? ' cs-large' : ''}`} disabled={!ouvert} onClick={() => jouer(action)}>{nom}</button>;
  const indisponibles = main ? ([['Tirer', permis?.tirer], ['Rester', permis?.rester], ['Doubler', permis?.doubler], ['Séparer', permis?.separer], ['Abandonner', permis?.abandonner]] as const)
    .filter(([, ok]) => !ok).map(([nom]) => nom) : [];
  return <div className="cs-jeu">
    <div className="cs-plateau cs-tapis">
      <div className="cs-pluie-zone cs-table">
        {main ? <>
          <Mains titre="Croupier Rocket" croupier mains={[{ cartes: main.cachee ? [...main.croupier, null] : main.croupier,
            valeur: main.valeurCroupier, mise: 0, active: false }]} />
          {verdict}
          <Mains titre="Ta main" mains={main.mains.map((m, i) => ({ cartes: m.cartes, valeur: m.valeur, mise: m.mise,
            active: main.phase === 'jeu' && i === main.active && m.statut === 'en-cours',
            issue: m.statut === 'depasse' ? { texte: 'Dépassé', ton: 'perte' as const } : m.statut === 'reste' ? { texte: 'Reste', ton: 'nul' as const } : undefined }))} />
          <p className="cs-rappel">Main en cours · {main.engage} jetons engagés. Elle sera conservée si tu quittes le casino.</p>
        </> : <>
          {fin ? <TableFinale fin={fin} /> : <p>Approche-toi de 21 sans dépasser.</p>}
          {verdict}
        </>}
        <Pluie zone={pluie.zone} />
      </div>
    </div>
    <div className="cs-commandes">
      {!main && <>
        <MiseCasino valeur={mise} changer={changer} jetons={jetons} />
        <button type="button" className="plaque plaque-action cs-grand" onClick={() => jouer(() => actions.distribuerBlackjack(lireMise(mise)), true)}>Distribuer</button>
      </>}
      {main && <div className="cs-actions-bj">
        {main.phase === 'assurance' ? <>
          {bouton('Assurance', permis?.assurer, actions.assurerBlackjack, true)}
          {bouton('Sans assurance', permis?.refuserAssurance, actions.refuserAssuranceBlackjack)}
        </> : <>
          {bouton('Tirer', permis?.tirer, actions.tirerBlackjack, true)}
          {bouton('Rester', permis?.rester, actions.resterBlackjack)}
          {bouton('Doubler', permis?.doubler, actions.doublerBlackjack)}
          {bouton('Séparer', permis?.separer, actions.separerBlackjack)}
          {bouton('Abandonner', permis?.abandonner, actions.abandonnerBlackjack, false, true)}
        </>}
      </div>}
      {main?.phase === 'jeu' && indisponibles.length > 0 && <p className="cs-rappel">Pas possible avec cette main : {indisponibles.join(', ')}.</p>}
      <details className="cs-gains"><summary>Règles du blackjack</summary>
        <p className="cs-rappel">Sabot de 6 paquets. Le croupier tire jusqu’à 17 et reste sur tous les 17. Victoire ×2, égalité : mise rendue. Blackjack naturel ×2,5, arrondi à l’entier inférieur.
          Doubler : une seule carte. Séparer : jusqu’à 4 mains, un seul tirage par As. Assurance (demi-mise, ×2) quand le croupier montre un As. Abandon : moitié de la mise rendue, arrondie vers le bas.</p>
      </details>
    </div>
  </div>;
}
