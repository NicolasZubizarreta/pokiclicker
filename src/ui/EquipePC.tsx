import type { ComponentProps, CSSProperties } from 'react';
import { Image } from './Image';
import { SpriteEvolution } from './SpriteEvolution';
import { IconeSexe } from './IconeSexe';
import { IconeShiny } from './IconeShiny';
import { BarreXp } from './BarreXp';
import { classeSprite, nomAffiche, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import { chargerPokemon, nomType } from '../core/pokemon';
import { formaterDps } from './nombres';
import piedsSprites from './pieds-sprites.json';
import './EquipePC.css';

type Pokemon = Parameters<typeof nomAffiche>[0];
export function EquipePC({ pokemon, dps, xpMax, pret, animation }: {
  pokemon: Pokemon; dps: number; xpMax: number; pret: boolean;
  animation?: ComponentProps<typeof SpriteEvolution>;
}) {
  const nom = nomAffiche(pokemon);
  return <>
    <span className="portrait" style={{ '--pieds': `${(piedsSprites[pokemon.numero - 1] ?? 0) / 96 * 100}%` } as CSSProperties}>
      <span className="socle bg-region-socle" aria-hidden="true" />
      {animation ? <SpriteEvolution {...animation} /> : <Image genre="sprite" src={spriteAffiche(pokemon)} alt=""
        className={`object-contain max-h-full max-w-full ${pokemon.shiny && !pokemon.oeuf ? 'halo-shiny' : ''} ${classeSprite(pokemon)}`} />}
    </span>
    <span className="corps">
      <strong className="flex items-center justify-center gap-2 break-words">{nom}
        {!pokemon.oeuf && (pokemon.sexe === 'male' || pokemon.sexe === 'femelle') && <IconeSexe sexe={pokemon.sexe} />}
        {pokemon.favori && <span aria-label="Favori">★</span>}{pokemon.shiny && !pokemon.oeuf && <IconeShiny />}
      </strong>
      <span className="text-region-accent">{formaterDps(dps)} DPS</span>
      {pokemon.oeuf ? <span>{progressionOeuf(pokemon.oeuf)}</span> : <>
        <span>Niv. {pokemon.niveau}{xpMax === 0 ? ' · XP max' : ''}</span>
        {xpMax > 0 && <BarreXp xp={pokemon.xp} maximum={xpMax} nom={nom} />}
        <span className="flex flex-wrap justify-center gap-1">
          {chargerPokemon().parNumero(pokemon.numero)?.types.map(type => <span key={type} className={`pastille-type pastille-type-${type}`}>{nomType(type)}</span>)}
          {pret && <span className="alerte bg-alerte-fond text-alerte-texte">Prêt à évoluer</span>}
        </span>
      </>}
    </span>
  </>;
}
