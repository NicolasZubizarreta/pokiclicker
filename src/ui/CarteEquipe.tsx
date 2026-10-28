import { BarreXp } from './BarreXp';
import { BoutonRenommer } from './BoutonRenommer';
import { Image } from './Image';
import { IconeShiny } from './IconeShiny';
import { formaterDps } from './nombres';
import { classeSprite, nomAffiche, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import type { CaseEquipe } from './store';

/** `renommer` : affiche le crayon (grand écran, là où le nom est visible) ; il ouvre la fiche avec le champ de surnom. */
export function CarteEquipe({ membre, renommer }: { membre: CaseEquipe; renommer?(uid: string, declencheur: HTMLButtonElement): void }) {
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
        <div className="flex min-w-0 items-center gap-1">
          <strong className="block min-w-0 break-words">{nom}{membre.pokemon.shiny && !oeuf && <IconeShiny />}</strong>
          {renommer && !oeuf && <BoutonRenommer nom={nom} ouvrir={bouton => renommer(membre.pokemon.uid, bouton)} />}
        </div><span>{oeuf ? progressionOeuf(oeuf) : `Niv. ${membre.pokemon.niveau}`}</span>
      </div>
      <span className="hidden justify-self-start self-start text-region-accent lg:block">{formaterDps(membre.dps)} DPS</span>
      {!oeuf && <div className="absolute inset-x-0 bottom-0 lg:static lg:col-start-2 lg:w-full lg:self-start">
        <BarreXp xp={membre.pokemon.xp} maximum={membre.xpMax} nom={nom} />
      </div>}
    </> : <span>—</span>}
  </div>;
}
