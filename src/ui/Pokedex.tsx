import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { pokedexDeKanto } from '../core/pokedex';
import { Image } from './Image';
import { cheminSprite } from './precharger';
import { storeJeu } from './store';
import { formaterProchainPalier } from './store-progression';
import { IconeCadenas } from './icones';

const catalogue = chargerPokemon();

export function Pokedex({ retour }: { retour(): void }) {
  const pokedex = useStore(storeJeu, e => e.pokedex);
  const { prochain, paliers } = useStore(storeJeu, e => e.progression);
  const { captures, nombre, total } = pokedexDeKanto(pokedex, catalogue);

  return <section className="mx-auto max-w-screen-xl space-y-4 text-base">
    <header className="space-y-2">
      <button type="button" onClick={retour}
        className="min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection">Retour</button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Pokédex</h1>
      <p className="text-region-accent">{`${nombre} / ${total}`}</p>
    </header>
    <p data-prochain-palier>{formaterProchainPalier(prochain)}</p>
    <section aria-label="Paliers du Pokédex"><dl className="space-y-2">
      {paliers.map(palier => <div key={palier.palier}>
        <dt className="inline"><span aria-hidden="true">{palier.recu ? '✓' : <IconeCadenas />}</span>{' '}
        {`${palier.palier} — ${palier.titre} — ${palier.description}`}</dt><dd className="inline"> · <span>{palier.recu ? 'reçu' : 'à venir'}</span></dd>
      </div>)}
    </dl></section>
    <ol className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
      {Array.from({ length: total }, (_, index) => {
        const numero = index + 1;
        const capture = captures.has(numero);
        const nom = capture ? catalogue.parNumero(numero).nom : '???';
        return <li key={numero} className="cadre flex min-w-0 flex-col items-center gap-2 bg-surface p-1 text-center">
          <span>N° {numero}</span>
          <Image src={cheminSprite(numero)} genre="sprite" alt={capture ? nom : 'Pokémon inconnu'}
            className={`size-16 max-w-full ${capture ? '' : 'brightness-0'}`} />
          <span className="w-full break-words">{nom}</span>
        </li>;
      })}
    </ol>
  </section>;
}
