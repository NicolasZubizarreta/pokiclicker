import type { ComponentProps } from 'react';
import type { CarteEquipe } from './CarteEquipe';
import { Image } from './Image';
import { BarreXp } from './BarreXp';
import { SpriteEvolution } from './SpriteEvolution';
import { IconeShiny } from './IconeShiny';
import { classeSprite, nomAffiche, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import { formaterDps } from './nombres';

type Props = Pick<ComponentProps<typeof CarteEquipe>, 'membre' | 'evolution' | 'animation'> & { ouvrirFiche(bouton: HTMLButtonElement): void };
export function RangEquipe({ membre, evolution, animation, ouvrirFiche }: Props) {
  if (!membre) return <div aria-label="Case libre" className="cadre min-h-14 grid place-items-center">—</div>;
  const { pokemon, dps, xpMax } = membre;
  const nom = nomAffiche(pokemon);
  return <button type="button" aria-label={`Ouvrir la fiche de ${nom}`} onClick={event => ouvrirFiche(event.currentTarget)}
    className={`rang-equipe cadre min-h-14 flex items-center gap-2 bg-surface p-2 text-left ${evolution ? 'pret-evoluer' : ''}`}>
    <span className="size-14 shrink-0 grid place-items-center [&_img]:max-h-full [&_img]:max-w-full [&_span]:max-h-full [&_span]:max-w-full">
      {animation ? <SpriteEvolution ancien={spriteAffiche({ ...pokemon, numero: animation.ancien })} nouveau={spriteAffiche({ ...pokemon, numero: animation.nouveau })} nom={nom} actif shiny={pokemon.shiny} />
        : <Image src={spriteAffiche(pokemon)} genre="sprite" alt="" className={`size-14 object-contain max-h-full max-w-full ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />}
    </span>
    <span className="min-w-0 flex-1">
      <span className="flex flex-wrap justify-between gap-x-2"><strong>{nom}{pokemon.shiny && !pokemon.oeuf && <IconeShiny />}</strong><span>{pokemon.oeuf ? progressionOeuf(pokemon.oeuf) : `Niv. ${pokemon.niveau}`}</span></span>
      <span className="flex items-center justify-between gap-2"><span className="text-region-accent">{formaterDps(dps)} DPS</span>
        {!pokemon.oeuf && (evolution ? <span>Prêt à évoluer</span> : xpMax === 0 ? <span>XP max</span> : <span className="min-w-0 flex-1"><BarreXp xp={pokemon.xp} maximum={xpMax} nom={nom} /></span>)}
      </span>
    </span>
  </button>;
}
