import { useStore } from 'zustand';
import { storeJeu } from './store';
import { useTelephone } from './useTelephone';
import { IconeRetour } from './icones-menu';
import { cheminSprite } from './precharger';
import { Image } from './Image';
import { formaterDuree } from './duree';
export function HallDesFameux({ retour }: { retour(): void }) {
  const hall = useStore(storeJeu, s => s.suivi.hall);
  const telephone = useTelephone();
  return <section className="mx-auto max-w-screen-xl space-y-4 text-base tabular-nums">
    <header className="flex items-center gap-4">
      <button type="button" aria-label="Retour au menu" onClick={retour} className="plaque flex min-h-11 min-w-11 items-center justify-center px-4">{telephone ? <IconeRetour /> : 'Retour au menu'}</button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Hall des Fameux</h1>
    </header>
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
