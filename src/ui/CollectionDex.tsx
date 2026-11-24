import { useStore } from 'zustand';
import { compterLignees } from '../core/lignees';
import { storeJeu } from './store';
import { lignesRencontres } from './rencontres';

export function LigneesDex({ pokedex }: { pokedex: readonly number[] }) {
  const { completes, total, paliers } = compterLignees(pokedex);
  return <section aria-label="Lignées complètes" className="cadre space-y-2 bg-surface p-3 tabular-nums">
    <p>Lignées complètes : {completes} sur {total}</p>
    <div className="flex flex-wrap gap-2">{paliers.map(({ seuil, libelle, atteint }) => <span key={seuil}
      className={`cadre px-3 py-2 ${atteint ? 'bg-selection text-region-accent' : 'text-texte-doux'}`}>
      {libelle}<span className="sr-only">{atteint ? ' : atteint' : ' : pas encore atteint'}</span>
    </span>)}</div>
  </section>;
}

export function RencontresDex({ numero }: { numero: number }) {
  const entree = useStore(storeJeu, e => e.suivi.rencontres[String(numero)]);
  const shiny = useStore(storeJeu, e => e.especesShiny.includes(numero));
  const lignes = lignesRencontres(entree);
  return <section aria-label="Rencontres" className="space-y-2">
    <p className="font-titre font-bold">Rencontres</p>
    {lignes.length ? <dl className="space-y-1 tabular-nums">{lignes.map(({ libelle, valeur }) => <div key={libelle} className="flex justify-between gap-3">
      <dt>{libelle} :</dt><dd>{valeur}</dd>
    </div>)}</dl> : <p>Aucune rencontre notée pour l'instant.</p>}
    {shiny && <dl><dt>Chromatique</dt><dd>Chromatique capturé</dd></dl>}
  </section>;
}
