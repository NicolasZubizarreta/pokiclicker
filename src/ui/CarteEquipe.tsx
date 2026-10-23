import { chargerPokemon } from '../core/pokemon';
import { Image } from './Image';
import { cheminSprite } from './precharger';
import type { CaseEquipe } from './store';

const catalogue = chargerPokemon();
export function CarteEquipe({ membre }: { membre: CaseEquipe }) {
  const nom = membre ? catalogue.parNumero(membre.pokemon.numero).nom : '';
  return <div aria-label={membre ? `${nom}, niveau ${membre.pokemon.niveau}, ${membre.dps} DPS` : 'Case libre'}
    className={`cadre relative grid h-14 min-w-0 place-items-center overflow-hidden bg-surface lg:h-26 ${membre ? 'lg:grid-cols-[auto_minmax(0,1fr)] lg:pe-4' : ''}`}>
    {membre ? <>
      <Image src={cheminSprite(membre.pokemon.numero)} genre="sprite" alt=""
        className="absolute size-24 max-w-none lg:static lg:row-span-2" />
      <div className="hidden min-w-0 justify-self-start self-end lg:block">
        <strong className="block break-words">{nom}</strong><span>Niv. {membre.pokemon.niveau}</span>
      </div>
      <span className="hidden justify-self-start self-start text-region-accent lg:block">{membre.dps} DPS</span>
    </> : <span>—</span>}
  </div>;
}
