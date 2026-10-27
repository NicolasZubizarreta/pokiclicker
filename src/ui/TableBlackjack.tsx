import { useState } from 'react';
import { lireMise, valeurMain } from '../core/casino';
import type { ActionsCasino, AffichageCasino } from './store-casino';
import { actionCasino, boutonCasino, MiseCasino } from './casino-interface';

const couleurs: Record<string, string> = { S: 'pique', H: 'cœur', D: 'carreau', C: 'trèfle' };
const figures: Record<string, string> = { A: 'As', J: 'Valet', Q: 'Dame', K: 'Roi' };
function Main({ nom, cartes }: { nom: string; cartes: string[] }) {
  return <section className="grid gap-2 bg-selection p-4"><h3>{nom} · {valeurMain(cartes)}</h3>
    <ul className="flex flex-wrap gap-2">{cartes.map(carte => {
      const [rang, couleur] = carte.split('-');
      return <li key={carte} className="border-2 border-bordure bg-surface p-2">{figures[rang!] ?? rang} de {couleurs[couleur!]}</li>;
    })}</ul></section>;
}
export function TableBlackjack({ actions, main, signaler }: { actions: ActionsCasino; main: AffichageCasino['blackjackEnCours']; signaler(m: string): void }) {
  const [mise, changer] = useState('1');
  const [derniere, garder] = useState<{ joueur: string[]; croupier: string[] } | null>(null);
  const visible = main ?? derniere;
  function jouer(action: () => ReturnType<ActionsCasino['tirerBlackjack']>) {
    const resultat = action();
    if (resultat.ok) garder(resultat);
    signaler(resultat.ok ? resultat.message.replace('Bust', 'Dépassé') : resultat.raison);
  }
  return <section className="grid gap-4" aria-label="Blackjack">
    <h2 className="font-titre text-2xl">Blackjack</h2>
    {visible ? <><Main nom="Croupier Rocket" cartes={visible.croupier} /><Main nom="Ta main" cartes={visible.joueur} /></> : <p>Approche-toi de 21 sans dépasser.</p>}
    {main && <p>Main en cours · {main.mise} jetons engagés. Elle sera conservée si tu quittes le casino.</p>}
    <MiseCasino valeur={mise} changer={changer} bloque={!!main} />
    <div className="flex flex-wrap gap-2">
      <button className={main ? boutonCasino : actionCasino} disabled={!!main} onClick={() => jouer(() => actions.distribuerBlackjack(lireMise(mise)))}>Distribuer</button>
      <button className={main ? actionCasino : boutonCasino} disabled={!main} onClick={() => jouer(actions.tirerBlackjack)}>Tirer</button>
      <button className={boutonCasino} disabled={!main} onClick={() => jouer(actions.resterBlackjack)}>Rester</button>
    </div>
    <p>Le croupier tire sous 17. Victoire ×2, égalité : mise rendue. Blackjack naturel ×2,5, arrondi à l’entier inférieur.</p>
  </section>;
}
