import { BarreXp } from './BarreXp';
import { Image } from './Image';
import { IconeShiny } from './IconeShiny';
import { formaterDps } from './nombres';
import { classeSprite, nomAffiche, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import type { CaseEquipe } from './store';

export function CarteEquipe({ membre }: { membre: CaseEquipe }) {
  const nom = membre ? nomAffiche(membre.pokemon) : '';
  const oeuf = membre?.pokemon.oeuf;
  const niveau = oeuf ? progressionOeuf(oeuf) : membre ? `niveau ${membre.pokemon.niveau}` : '';
  return <div aria-label={membre ? `${nom}, ${niveau}, ${formaterDps(membre.dps)} DPS` : 'Case libre'}
    className={`cadre relative grid h-14 min-w-0 place-items-center overflow-hidden bg-surface lg:h-26 ${membre ? 'lg:grid-cols-[auto_minmax(0,1fr)] lg:pe-4' : ''}`}>
    {membre ? <>
      <Image src={spriteAffiche(membre.pokemon)} genre="sprite" alt=""
        className={`absolute size-24 max-w-none lg:static lg:row-span-3 ${membre.pokemon.shiny && !oeuf ? 'halo-shiny' : ''} ${classeSprite(membre.pokemon)}`} />
      {!oeuf && <span className="absolute bottom-1 left-0 bg-surface px-1 text-base tabular-nums lg:hidden">{membre.pokemon.niveau}</span>}
      <div className="hidden min-w-0 justify-self-start self-end lg:block">
        <strong className="block break-words">{nom}{membre.pokemon.shiny && !oeuf && <IconeShiny />}</strong><span>{oeuf ? progressionOeuf(oeuf) : `Niv. ${membre.pokemon.niveau}`}</span>
      </div>
      <span className="hidden justify-self-start self-start text-region-accent lg:block">{formaterDps(membre.dps)} DPS</span>
      {!oeuf && <div className="absolute inset-x-0 bottom-0 lg:static lg:col-start-2 lg:w-full lg:self-start">
        <BarreXp xp={membre.pokemon.xp} maximum={membre.xpMax} nom={nom} />
      </div>}
    </> : <span>—</span>}
  </div>;
}
