import { useState } from 'react';
import { useStore } from 'zustand';
import { storeJeu } from './store';
import { useTelephone } from './useTelephone';
import { IconeRetour } from './icones-menu';
import { cheminSprite } from './precharger';
import { Image } from './Image';
import { formaterDuree } from './duree';
const rangs = (suivant: number) => Array.from({ length: suivant + 1 }, (_, k) => k);

/** Ligue+ : rejouer la Ligue avec plus de PV chez les adversaires ; ne s'ouvre qu'après une première victoire. */
function LiguePlus() {
  const { rang, meilleur, suivant, max } = useStore(storeJeu, s => s.liguePlus);
  const [refus, refuser] = useState('');
  if (suivant < 1) return null;
  const choisir = (r: number) => { const resultat = storeJeu.getState().choisirLiguePlus(r); refuser(resultat.ok ? '' : resultat.raison); };
  return <section className="cadre space-y-4 bg-surface p-4" aria-label="Ligue+">
    <h2 className="font-titre text-lg font-semibold">Ligue+</h2>
    <p>Rejoue la Ligue avec des adversaires plus résistants : chaque rang ajoute des PV. Réussir un rang pour la première fois rapporte des Pokédollars.
      Meilleur rang : {meilleur} sur {max}. Rang choisi : {rang === 0 ? 'Ligue normale' : rang}.</p>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Rang de la Ligue">
      {rangs(suivant).map(r => <button key={r} type="button" className="plaque min-h-11 min-w-11 px-4" aria-pressed={rang === r} onClick={() => choisir(r)}>
        {r === 0 ? 'Ligue normale' : `Rang ${r}`}</button>)}
    </div>
    {refus && <p role="alert">{refus}</p>}
  </section>;
}

export function HallDesFameux({ retour }: { retour(): void }) {
  const hall = useStore(storeJeu, s => s.suivi.hall);
  const telephone = useTelephone();
  return <section className="mx-auto max-w-screen-xl space-y-4 text-base tabular-nums">
    <header className="flex items-center gap-4">
      <button type="button" aria-label="Retour au menu" onClick={retour} className="plaque flex min-h-11 min-w-11 items-center justify-center px-4">{telephone ? <IconeRetour /> : 'Retour au menu'}</button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Hall des Fameux</h1>
    </header>
    <LiguePlus />
    {!hall.length && <p>Aucune victoire à la Ligue pour l'instant.</p>}
    {hall.map((entree, i) => <article key={`${entree.date}-${i}`} className="cadre space-y-4 bg-surface p-4">
      <h2 className="font-titre text-lg font-semibold">Victoire n° {hall.length - i}</h2>
      <p><time dateTime={entree.date}>{new Date(entree.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</time> · {formaterDuree(entree.tempsJeuMs)}</p>
      <ul className="flex flex-wrap gap-4">{entree.equipe.map((p, j) => <li key={j} className="text-center">
        <Image src={cheminSprite(p.numero, p.shiny)} genre="sprite" alt={p.surnom ?? `Pokémon n° ${p.numero}`} className={`mx-auto size-24 ${p.shiny ? 'halo-shiny' : ''}`} />
        {p.surnom && <p>{p.surnom}</p>}<p>Niveau {p.niveau}</p>{p.shiny && <p>Chromatique</p>}
      </li>)}</ul>
    </article>)}
  </section>;
}
