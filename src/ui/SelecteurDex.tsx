import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { etatPokedex, pokedexDeKanto } from '../core/pokedex';
import { storeJeu } from './store';
import { IconeShiny } from './IconeShiny';
import { RepereMarque } from './RepereMarque';

export type CleDex = 'pokedex' | 'shiny' | 'oeuf' | 'oeufShiny';
const libelles: Record<CleDex, string> = { pokedex: 'Pokédex', shiny: 'Shiny', oeuf: 'Œuf', oeufShiny: 'Œuf shiny' };
const catalogue = chargerPokemon();
export function useListesDex() {
  const pokedex = useStore(storeJeu, e => e.pokedex);
  const shiny = useStore(storeJeu, e => e.especesShiny);
  const oeuf = useStore(storeJeu, e => e.pension.especesEcloses);
  const oeufShiny = useStore(storeJeu, e => e.pension.especesEclosesShiny);
  return { pokedex: pokedexDeKanto(pokedex, catalogue), shiny: pokedexDeKanto(shiny, catalogue),
    oeuf: pokedexDeKanto(oeuf, catalogue), oeufShiny: pokedexDeKanto(oeufShiny, catalogue) };
}
export function BoutonsDex({ listes, dex, choisir }: { listes: ReturnType<typeof useListesDex>; dex: CleDex; choisir(dex: CleDex): void }) {
  return <div role="group" aria-label="Choisir le dex" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
    {(Object.keys(libelles) as CleDex[]).map(cle => <button key={cle} type="button" aria-pressed={dex === cle}
      onClick={() => choisir(cle)} className="plaque min-h-11 px-3 aria-pressed:bg-selection">
      {libelles[cle]} {listes[cle].nombre} / {listes[cle].total}
    </button>)}
  </div>;
}
export function FiltreDex({ dex, filtre, filtrer, feminin = false }: { dex: CleDex; filtre: string; filtrer(filtre: string): void; feminin?: boolean }) {
  return <label>Afficher<div><select value={filtre} onChange={e => filtrer(e.target.value)}
    className="min-h-12 w-full border border-bordure bg-fond px-3 font-bold text-texte">
    <option value="tous">{feminin ? 'Toutes' : 'Tous'}</option>
    <option value="obtenus">{dex === 'pokedex' ? feminin ? 'Capturées' : 'Capturés' : feminin ? 'Obtenues' : 'Obtenus'}</option>
    <option value="manquants">À trouver</option>
  </select></div></label>;
}
export function etatDansDex(numero: number, obtenus: ReadonlySet<number>, captures: ReadonlySet<number>, vus: ReadonlySet<number>) {
  return obtenus.has(numero) ? 'capture' : etatPokedex(numero, captures, vus) === 'inconnu' ? 'inconnu' : 'vu';
}
export function TagsDex({ shiny, eclos }: { shiny: boolean; eclos: boolean }) {
  return <span className="absolute right-1 top-1 flex items-center gap-1">
    {shiny && <IconeShiny decoratif={false} />}{eclos && <RepereMarque />}
  </span>;
}
export function libelleCaseDex(nom: string, numero: number, etat: ReturnType<typeof etatDansDex>, dex: CleDex, shiny: boolean, eclos: boolean) {
  const action = dex === 'pokedex' ? 'capturé' : 'obtenu';
  return (etat === 'capture' ? `${nom}, numéro ${numero}, déjà ${action}` : etat === 'vu' ? `${nom}, numéro ${numero}, vu, pas encore ${action}` : `Pokémon inconnu, numéro ${numero}`)
    + (shiny ? ', chromatique' : '') + (eclos ? ', éclos' : '');
}
