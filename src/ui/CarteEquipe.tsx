import { BarreXp } from './BarreXp';
import { BoutonRenommer } from './BoutonRenommer';
import { Image } from './Image';
import { IconeShiny } from './IconeShiny';
import { IconeObjet } from './icones';
import { SpriteEvolution } from './SpriteEvolution';
import type { EvolutionAffichee } from './store-evolution';
import { formaterDps } from './nombres';
import { classeSprite, nomAffiche, progressionOeuf, spriteAffiche } from './affichage-pokemon';
import type { CaseEquipe } from './store';

/** `renommer` : affiche le crayon (grand écran, là où le nom est visible) ; il ouvre la fiche avec le champ de surnom. */
export function CarteEquipe({ membre, renommer, evolution, evoluer, animation }: {
  membre: CaseEquipe;
  renommer?(uid: string, declencheur: HTMLButtonElement): void;
  evolution?: { vers: number; pierre: { id: string; nom: string; image: string | null } | null } | null;
  evoluer?(bouton: HTMLButtonElement): void;
  animation?: EvolutionAffichee | null;
}) {
  const nom = membre ? nomAffiche(membre.pokemon) : '';
  const oeuf = membre?.pokemon.oeuf;
  const niveau = oeuf ? progressionOeuf(oeuf) : membre ? `niveau ${membre.pokemon.niveau}` : '';
  const forme = membre && evolution ? { ...membre.pokemon, numero: evolution.vers, surnom: undefined } : null;
  return <div aria-label={membre ? `${nom}, ${niveau}, ${formaterDps(membre.dps)} DPS` : 'Case libre'}
    className={`cadre relative grid h-14 min-w-0 place-items-center overflow-hidden bg-surface lg:h-26 ${membre ? 'lg:grid-cols-[auto_minmax(0,1fr)] lg:pb-1 lg:pe-4' : ''} ${forme ? 'carte-evo cadre-alerte' : ''}`}>
    {membre ? <>
      {animation ? <span className="carte-evo-sprite absolute grid size-24 max-w-none place-items-center lg:static lg:row-span-3 [&_img]:size-24">
        <SpriteEvolution ancien={spriteAffiche({ ...membre.pokemon, numero: animation.ancien })}
          nouveau={spriteAffiche({ ...membre.pokemon, numero: animation.nouveau })} nom={nom} actif shiny={membre.pokemon.shiny} />
      </span> : <Image src={spriteAffiche(membre.pokemon)} genre="sprite" alt=""
        className={`carte-evo-sprite absolute size-24 max-w-none lg:static lg:row-span-3 ${membre.pokemon.shiny && !oeuf ? 'halo-shiny' : ''} ${classeSprite(membre.pokemon)}`} />}
      {!oeuf && <span className="absolute bottom-1 left-0 bg-surface px-1 text-base tabular-nums lg:hidden">{membre.pokemon.niveau}</span>}
      <div className="carte-equipe-identite hidden min-w-0 justify-self-start self-end lg:block">
        <div className="flex min-w-0 items-center gap-1">
          <strong className="block min-w-0 break-words">{nom}{membre.pokemon.shiny && !oeuf && <IconeShiny />}</strong>
          {renommer && !oeuf && <BoutonRenommer nom={nom} ouvrir={bouton => renommer(membre.pokemon.uid, bouton)} />}
        </div><span>{oeuf ? progressionOeuf(oeuf) : `Niv. ${membre.pokemon.niveau}`}</span>
      </div>
      <span className="hidden justify-self-start self-start text-region-accent lg:block">{formaterDps(membre.dps)} DPS</span>
      {!oeuf && <div className="absolute inset-x-0 bottom-0 mx-1 mb-1 lg:static lg:mx-0 lg:mb-0 lg:col-start-2 lg:w-full lg:self-start">
        <BarreXp xp={membre.pokemon.xp} maximum={membre.xpMax} nom={nom} />
      </div>}
      {forme && evolution && <button type="button" className="carte-evo-action min-h-11 min-w-11"
        aria-label={`Faire évoluer ${nom} en ${nomAffiche(forme)}${evolution.pierre ? ` avec la ${evolution.pierre.nom}` : ''}`}
        onClick={event => evoluer?.(event.currentTarget)}>
        <span className="text-2xl" aria-hidden="true">→</span>
        <span className="flex shrink-0 items-center gap-1">
          <Image src={spriteAffiche(forme)} genre="sprite" alt="" className="size-12 max-w-none" />
          {evolution.pierre && <span className="flex bg-surface [&_img]:size-5 [&_svg]:size-5"><IconeObjet image={evolution.pierre.image} nom={evolution.pierre.nom} taille="petite" /></span>}
        </span>
        <span className="carte-evo-nom text-sm">{nomAffiche(forme)}</span>
      </button>}
    </> : <span>—</span>}
  </div>;
}
