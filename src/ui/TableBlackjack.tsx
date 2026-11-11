import { useState } from 'react';
import { lireMise } from '../core/casino';
import type { FinBlackjack } from '../core/casino';
import type { ActionsCasino, AffichageCasino } from './store-casino';
import { actionCasino, boutonCasino, MiseCasino } from './casino-interface';

const couleurs: Record<string, string> = { S: 'pique', H: 'cœur', D: 'carreau', C: 'trèfle' };
const symboles: Record<string, string> = { S: '♠', H: '♥', D: '♦', C: '♣' };
const figures: Record<string, string> = { A: 'As', J: 'Valet', Q: 'Dame', K: 'Roi' };
const issues = { blackjack: 'Blackjack', gagne: 'Gagné', egalite: 'Égalité', perdu: 'Perdu', depasse: 'Dépassé', abandon: 'Abandon' };
type ResultatAction = ReturnType<ActionsCasino['tirerBlackjack']>;

/** `null` : carte cachée du croupier, dessinée face cachée (sa valeur n'est jamais dans l'interface). */
function Carte({ carte }: { carte: string | null }) {
  const base = 'grid h-16 w-12 place-content-center rounded-sm border-2 border-bordure text-center font-titre text-lg leading-tight';
  if (carte === null) return <li><div role="img" aria-label="Carte cachée" className={`${base} bg-selection`}><span aria-hidden>?</span></div></li>;
  const [rang, couleur] = carte.split('-') as [string, string];
  return <li><div role="img" aria-label={`${figures[rang] ?? rang} de ${couleurs[couleur]}`}
    className={`${base} bg-surface ${couleur === 'H' || couleur === 'D' ? 'text-erreur-base' : ''}`}>
    <span aria-hidden>{rang}</span><span aria-hidden>{symboles[couleur]}</span></div></li>;
}
const net = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n)}`;

type MainAffichee = { cartes: (string | null)[]; valeur: number; mise: number; active: boolean; issue?: string };
function Mains({ titre, mains }: { titre: string; mains: MainAffichee[] }) {
  return <div className={`grid gap-2 ${mains.length > 1 ? 'grid-cols-2 lg:grid-cols-4' : ''}`}>{mains.map((m, i) =>
    <section key={i} aria-label={mains.length > 1 ? `${titre} ${i + 1}` : titre} aria-current={m.active ? 'true' : undefined}
      className={`grid content-start gap-2 border-2 p-3 ${m.active ? 'border-region-accent bg-selection' : 'border-bordure bg-surface-2'}`}>
      <h3>{mains.length > 1 ? `${titre} ${i + 1}` : titre} · {m.valeur}</h3>
      <ul className="flex flex-wrap gap-2">{m.cartes.map((c, j) => <Carte key={j} carte={c} />)}</ul>
      <p>Mise {m.mise}{m.active ? ' · à jouer' : ''}{m.issue ? ` · ${m.issue}` : ''}</p>
    </section>)}</div>;
}

function TableFinale({ fin }: { fin: FinBlackjack }) {
  const mains = fin.mains.map(m => ({ cartes: m.cartes, valeur: m.valeur, mise: m.mise, active: false,
    issue: `${issues[m.resultat]} ${net(m.gain - m.mise)}` }));
  return <>
    <Mains titre="Croupier Rocket" mains={[{ cartes: fin.croupier, valeur: fin.valeurCroupier, mise: 0, active: false }]} />
    <Mains titre="Ta main" mains={mains} />
    {fin.assurance > 0 && <p>Assurance {fin.assurance} jetons · {fin.gainAssurance > 0 ? `payée +${fin.gainAssurance - fin.assurance}` : 'perdue'}</p>}
  </>;
}

export function TableBlackjack({ actions, main, signaler }: { actions: ActionsCasino; main: AffichageCasino['blackjackEnCours']; signaler(m: string): void }) {
  const [mise, changer] = useState('1');
  const [fin, garder] = useState<FinBlackjack | null>(null);
  function jouer(action: () => ResultatAction) {
    const resultat = action();
    if (resultat.ok) garder(resultat.fin);
    signaler(resultat.ok ? resultat.message : resultat.raison);
  }
  const permis = main?.actions;
  const bouton = (nom: string, ouvert: boolean | undefined, action: () => ResultatAction, principal = false) =>
    <button className={principal ? actionCasino : boutonCasino} disabled={!ouvert} onClick={() => jouer(action)}>{nom}</button>;
  return <section className="grid gap-4" aria-label="Blackjack">
    <h2 className="font-titre text-2xl">Blackjack</h2>
    {main ? <>
      <Mains titre="Croupier Rocket" mains={[{ cartes: main.cachee ? [...main.croupier, null] : main.croupier,
        valeur: main.valeurCroupier, mise: 0, active: false }]} />
      <Mains titre="Ta main" mains={main.mains.map((m, i) => ({ cartes: m.cartes, valeur: m.valeur, mise: m.mise,
        active: main.phase === 'jeu' && i === main.active && m.statut === 'en-cours',
        issue: m.statut === 'depasse' ? 'Dépassé' : m.statut === 'reste' ? 'Reste' : undefined }))} />
      <p>Main en cours · {main.engage} jetons engagés. Elle sera conservée si tu quittes le casino.</p>
    </> : fin ? <TableFinale fin={fin} /> : <p>Approche-toi de 21 sans dépasser.</p>}
    {!main && <MiseCasino valeur={mise} changer={changer} bloque={false} />}
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <button className={main ? boutonCasino : actionCasino} disabled={!!main} onClick={() => jouer(() => actions.distribuerBlackjack(lireMise(mise)))}>Distribuer</button>
      {main?.phase === 'assurance' ? <>
        {bouton('Assurance', permis?.assurer, actions.assurerBlackjack, true)}
        {bouton('Sans assurance', permis?.refuserAssurance, actions.refuserAssuranceBlackjack)}
      </> : <>
        {bouton('Tirer', permis?.tirer, actions.tirerBlackjack, !!main)}
        {bouton('Rester', permis?.rester, actions.resterBlackjack)}
        {bouton('Doubler', permis?.doubler, actions.doublerBlackjack)}
        {bouton('Séparer', permis?.separer, actions.separerBlackjack)}
        {bouton('Abandonner', permis?.abandonner, actions.abandonnerBlackjack)}
      </>}
    </div>
    <p>Sabot de 6 paquets. Le croupier tire jusqu’à 17 et reste sur tous les 17. Victoire ×2, égalité : mise rendue. Blackjack naturel ×2,5, arrondi à l’entier inférieur.
      Doubler : une seule carte. Séparer : jusqu’à 4 mains, un seul tirage par As. Assurance (demi-mise, ×2) quand le croupier montre un As. Abandon : moitié de la mise rendue, arrondie vers le bas.</p>
  </section>;
}
