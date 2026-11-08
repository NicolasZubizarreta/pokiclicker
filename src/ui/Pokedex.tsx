import { useStore } from 'zustand';
import { useState } from 'react';
import { chargerPokemon, nomType } from '../core/pokemon';
import { statsDeCombat } from '../core/stats';
import { reglages } from '../core/reglages';
import { Diplome } from './Diplome';
import './DexPC.css';
import { etatPokedex, pokedexDeKanto, vusDeKanto } from '../core/pokedex';
import { Image } from './Image';
import { cheminSprite } from './precharger';
import { storeJeu } from './store';
import { formaterProchainPalier } from './store-progression';
import { IconeCadenas, PastilleCapture } from './icones';

const catalogue = chargerPokemon();

export function Pokedex({ retour }: { retour(): void }) {
  const pokedex = useStore(storeJeu, e => e.pokedex);
  const vus = vusDeKanto(useStore(storeJeu, e => e.vus), catalogue);
  const { prochain, paliers } = useStore(storeJeu, e => e.progression);
  const { captures, nombre, total } = pokedexDeKanto(pokedex, catalogue);
  const diplome = useStore(storeJeu, e => e.fin.diplome);
  const [diplomeOuvert, ouvrirDiplome] = useState(false);
  const [selection, choisir] = useState<number | null>(null);
  const [saisie, saisir] = useState('');
  const [filtre, filtrer] = useState('Tous');
  const normaliser = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').trim();
  const recherche = normaliser(saisie);
  const numeroRecherche = /^(?:#|n°|n)?\s*(\d+)$/.exec(recherche);
  const numeros = Array.from({ length: total }, (_, i) => i + 1).filter(n =>
    !(filtre === 'Capturés' && !captures.has(n) || filtre === 'À trouver' && captures.has(n)) &&
    (!recherche || (numeroRecherche ? n === Number(numeroRecherche[1]) : etatPokedex(n, captures, vus) !== 'inconnu' && normaliser(catalogue.parNumero(n).nom).includes(recherche))));

  return <section className="dex-pc text-base">
    <header className="space-y-2">
      <button type="button" onClick={retour}
        className="min-h-11 bg-surface-2 px-4 py-2 hover:bg-selection">Retour au menu</button>
      <h1 tabIndex={-1} className="font-titre text-2xl font-semibold">Pokédex</h1>
      <p className="text-region-accent">{`${nombre} / ${total}`}</p>
    </header>
    <div className="dex-outils"><label>Nom ou numéro <kbd>/</kbd><input type="search" value={saisie} onChange={e => saisir(e.target.value)} className="cadre min-h-11 bg-surface px-3" /></label>
      <div role="group" aria-label="Filtrer le Pokédex">{['Tous', 'Capturés', 'À trouver'].map(f => <button key={f} type="button" aria-pressed={filtre === f} onClick={() => filtrer(f)} className="plaque min-h-11 px-3">{f}</button>)}</div></div>
    <div className="dex-corps">
    <aside aria-label="Détail du Pokémon" tabIndex={0} className="dex-panneau cadre bg-surface p-4">
    {selection === null ? <><h2 className="font-titre text-xl font-bold">Paliers</h2>
    <progress aria-label="Espèces capturées" value={nombre} max={total} className="w-full" />
    <p data-prochain-palier>{formaterProchainPalier(prochain)}</p>
    <section aria-label="Paliers du Pokédex"><dl className="space-y-2">
      {paliers.map(palier => <div key={palier.palier}>
        <dt className="inline"><span aria-hidden="true">{palier.recu ? '✓' : <IconeCadenas />}</span>{' '}
        {`${palier.palier} — ${palier.titre} — ${palier.description}`}</dt><dd className="inline"> · <span>{palier.recu ? 'reçu' : 'à venir'}</span></dd>
      </div>)}
    </dl></section>
    {diplome && <button type="button" className="plaque min-h-11" onClick={() => ouvrirDiplome(true)}>Voir le diplôme</button>}
    </> : <Fiche numero={selection} etat={etatPokedex(selection, captures, vus)} fermer={() => choisir(null)} />}
    </aside>
    <div className="dex-liste cadre">{numeros.length === 0 && (recherche ? <div role="status"><p>Aucune espèce capturée ou vue ne correspond à « {saisie} ».</p><p className="text-texte-doux">Les espèces jamais croisées restent cachées : cherche-les par leur numéro.</p></div> : <p role="status">Aucune espèce ne correspond.</p>)}
    <ol className="dex-grille grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-10">
      {numeros.map(numero => {
        const etat = etatPokedex(numero, captures, vus);
        const capture = etat === 'capture';
        const nom = etat !== 'inconnu' ? catalogue.parNumero(numero).nom : '???';
        return <li key={numero}><button type="button" onClick={() => choisir(numero)} aria-pressed={selection === numero} aria-label={capture ? `${nom}, numéro ${numero}, déjà capturé` : etat === 'vu' ? `${nom}, numéro ${numero}, vu, pas encore capturé` : `Pokémon inconnu, numéro ${numero}`} className={`dex-case flex min-h-11 w-full min-w-0 flex-col items-center gap-2 ${capture ? 'bg-surface' : 'bg-surface-2'} p-1 text-center`}>
          <span>N° {numero}</span>
          <Image src={cheminSprite(numero)} genre="sprite" alt={etat !== 'inconnu' ? nom : 'Pokémon inconnu'}
            className={`size-24 object-contain max-h-full max-w-full ${capture ? '' : etat === 'vu' ? 'grayscale opacity-60' : 'brightness-0'}`} />
          <span className="w-full break-words">{nom}{capture && <PastilleCapture />}</span>
          {etat === 'vu' && <span className="text-sm text-texte-doux">Vu</span>}
        </button></li>;
      })}
    </ol></div></div>
    {diplomeOuvert && diplome && <Diplome diplome={diplome} fermer={() => ouvrirDiplome(false)} />}
  </section>;
}

function Fiche({ numero, etat, fermer }: { numero: number; etat: ReturnType<typeof etatPokedex>; fermer(): void }) {
  const capture = etat === 'capture';
  const equipe = useStore(storeJeu, e => e.equipe);
  const pc = useStore(storeJeu, e => e.pc);
  const espece = catalogue.parNumero(numero);
  return <><header className="flex items-center justify-between gap-2"><h2 className="font-titre text-xl font-bold">{etat !== 'inconnu' ? espece.nom : '???'} · N° {numero}</h2><button type="button" aria-label="Revenir aux paliers" onClick={fermer} className="flex min-h-11 min-w-11 items-center justify-center">×</button></header>
    <div className="dex-sprite"><Image genre="sprite" src={cheminSprite(numero)} alt={etat !== 'inconnu' ? espece.nom : 'Pokémon inconnu'} className={`object-contain max-h-full max-w-full ${capture ? '' : etat === 'vu' ? 'grayscale opacity-60' : 'brightness-0 opacity-50'}`} /></div>
    {capture ? <><div className="flex flex-wrap gap-2">{espece.types.map(t => <span key={t} className={`pastille-type pastille-type-${t} px-2`}>{nomType(t)}</span>)}<span>Déjà capturé</span></div>
      <p>{equipe.some(c => c?.pokemon.numero === numero) ? 'Dans ton équipe' : pc.some(p => p.numero === numero) ? 'Rangé dans ton PC' : 'Enregistré au Pokédex'}</p>
      <dl aria-label="Dégâts de base"><dt>Dégâts de base</dt><dd>{statsDeCombat(espece).puissance}</dd></dl>
      <p>DPS = dégâts de base × niveau ÷ {reglages.degats.diviseurNiveau}, avant les bonus.</p></> : etat === 'vu' ? <><p className="text-texte-doux">Vu, pas encore capturé</p><p role="status">Capture ce Pokémon pour découvrir ses types et ses dégâts de base.</p></> : <p role="status">Capture ce Pokémon pour découvrir son nom, ses types et ses dégâts de base.</p>}
  </>;
}
