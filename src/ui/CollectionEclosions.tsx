import { useState } from 'react';
import { useStore } from 'zustand';
import { chargerPokemon } from '../core/pokemon';
import { reglages } from '../core/reglages';
import { paliersDeMesure, registreSucces } from '../core/succes';
import { IconeDiamant } from './compte/icones-compte';
import { storeJeu, type StoreJeu } from './store';

const catalogue = chargerPokemon();
export function CollectionEclosions({ store = storeJeu }: { store?: StoreJeu }) {
  const ecloses = useStore(store, e => e.pension.especesEcloses);
  const compte = useStore(store, e => e.compte);
  const [filtre, filtrer] = useState('Toutes');
  const n = ecloses.length, total = reglages.pension.especesTirees;
  const paliers = paliersDeMesure(registreSucces, 'eclosions', { pokedex: 0, badges: 0, eliminations: 0, eclosions: n }, compte);
  const prochain = paliers.find(p => !p.atteint && !p.obtenu);
  const transformation = { transform: `scaleX(${prochain ? n / prochain.seuil : 1})` };
  return <section className="cadre pension-collection" aria-label="Collection d’éclosions">
    <header className="pension-entete"><div><h2>Collection d’éclosions</h2><p>Chaque espèce éclose compte une fois, pour toujours.</p></div><p><strong className="pension-total">{n}/{total}</strong> espèces écloses</p></header>
    {prochain ? <><p>Encore {prochain.seuil - n} espèces pour « {prochain.seuil} espèces écloses » : +{prochain.diamants} diamants</p>
      <div role="progressbar" aria-label="Prochain palier d’éclosions" aria-valuenow={n} aria-valuemin={0} aria-valuemax={prochain.seuil} className="pension-progression"><span style={transformation} /></div></> : <p>Collection complète.</p>}
    <ul className="pension-paliers">{paliers.map(p => {
      const obtenu = p.obtenu || p.atteint, suivant = p.id === prochain?.id;
      return <li key={p.id} className={`cadre pension-palier ${obtenu ? 'pension-compatible' : suivant ? 'pension-intermediaire' : ''}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d={obtenu ? 'm5 12 5 5 9-10' : suivant ? 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8' : 'M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4'} /></svg>
        <h3>{p.nom}</h3><p>{p.seuil} espèces écloses</p><p>{obtenu ? 'Obtenu' : suivant ? `Prochain · encore ${p.seuil - n}` : 'Verrouillé'}</p><span className="pension-gain" aria-label={`+${p.diamants} diamants`}>+{p.diamants} <IconeDiamant /></span>
      </li>;
    })}</ul>
    <div className="pension-filtres">{(['Toutes', 'Écloses', 'À trouver'] as const).map(f => <button className="plaque" key={f} aria-pressed={filtre === f} onClick={() => filtrer(f)}>{f} ({f === 'Toutes' ? total : f === 'Écloses' ? n : total - n})</button>)}</div>
    <ul className="pension-grille">{Array.from({ length: total }, (_, i) => i + 1).filter(numero => filtre === 'Toutes' || (filtre === 'Écloses') === ecloses.includes(numero)).map(numero => {
      const eclos = ecloses.includes(numero), identifiant = `N° ${String(numero).padStart(3, '0')}`;
      const nom = eclos ? catalogue.parNumero(numero).nom : '?';
      return <li key={numero} className={`cadre pension-espece ${eclos ? 'pension-eclose' : ''}`} aria-label={eclos ? `${nom}, éclos` : `${identifiant}, pas encore éclos`}>
        <img src={`img/sprites/pokemon/${numero}.png`} alt="" width={96} height={96} className={eclos ? '' : 'brightness-0 opacity-45'} /><span>{identifiant}</span><strong>{nom}</strong>
      </li>;
    })}</ul>
  </section>;
}
