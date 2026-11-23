import { useStore } from 'zustand';
import { JEUX_SUIVIS } from '../core/suivi';
import { storeJeu, type StoreJeu } from './store';
import { formaterNombre } from './nombres';

const noms = { machine: 'Machine à sous', roulette: 'Roulette', plusOuMoins: 'Plus ou moins', pileOuFace: 'Pile ou face', gratter: 'Carte à gratter', blackjack: 'Blackjack' };
export function ScoresCasino({ store = storeJeu }: { store?: StoreJeu }) {
  const suivi = useStore(store, s => s.suivi);
  const joues = JEUX_SUIVIS.filter(jeu => (suivi.casino[jeu]?.parties ?? 0) > 0);
  return <details className="cadre bg-surface p-4 text-base tabular-nums">
    <summary className="min-h-11 cursor-pointer font-titre font-semibold">Meilleurs scores</summary>
    {!joues.length && <p>Aucune partie jouée pour l'instant.</p>}
    <div className="grid gap-4 lg:grid-cols-3">{joues.map(jeu => {
      const stats = suivi.casino[jeu]!;
      return <section key={jeu}><h2 className="font-titre text-lg">{noms[jeu]}</h2><dl>
        <dt>Parties</dt><dd>{formaterNombre(stats.parties)}</dd>
        <dt>Meilleur gain en jetons</dt><dd>{formaterNombre(stats.meilleurGain)}</dd>
        <dt>Meilleure série de gains</dt><dd>{formaterNombre(stats.meilleureSerie)}</dd>
        <dt>Série en cours</dt><dd>{formaterNombre(stats.serieActuelle)}</dd>
      </dl></section>;
    })}</div>
    <p className="mt-4">Jetons gagnés : {formaterNombre(suivi.jetons.gagnes)} · Jetons perdus : {formaterNombre(suivi.jetons.perdus)}</p>
  </details>;
}
