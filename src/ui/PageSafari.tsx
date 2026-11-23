import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useStore } from 'zustand';
import { ESPECES_SAFARI, messageBilanSafari, VISITE_SAFARI, type FinSafari, type Humeur } from '../core/safari';
import { chargerPokemon } from '../core/pokemon';
import type { PokemonPossede } from '../core/sauvegarde';
import { spriteAffiche } from './affichage-pokemon';
import { IconeShiny } from './IconeShiny';
import { Image } from './Image';
import { formaterNombre as nombre } from './nombres';
import piedsSprites from './pieds-sprites.json';
import { storeJeu, type StoreJeu } from './store';
import type { ResultatActionSafari } from './store-safari';
import './PageSafari.css';

const catalogue = chargerPokemon();
const humeurs: Record<Humeur, string> = {
  neutre: 'Il te surveille.',
  appat: 'Il mange l’appât : plus dur à capturer, mais il reste plus longtemps.',
  colere: 'Il est en colère : plus facile à capturer, mais il peut s’enfuir.',
};
const sprite = (numero: number, shiny = false): PokemonPossede => ({ uid: 'safari', numero, niveau: 1, shiny, sexe: 'male', xp: 0, bonheur: 0, calcium: 0, pierreEternelle: false, favori: false });
const videSprite = (numero: number) => ({ '--vide': (piedsSprites[numero - 1] ?? 0) / 96 }) as CSSProperties;

export function PageSafari({ retour, store = storeJeu }: { retour(): void; store?: StoreJeu }) {
  const safari = useStore(store, e => e.safari);
  const argent = useStore(store, e => e.argent);
  const [message, signaler] = useState('Paie l’entrée pour commencer une visite.');
  const [bilan, noterBilan] = useState<FinSafari | null>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titre.current?.focus(); }, []);
  const visite = safari.visite;
  const rencontre = visite?.rencontre ?? null;
  function agir(action: () => ResultatActionSafari) {
    const resultat = action();
    if (!resultat.ok) { signaler(resultat.raison); return; }
    signaler(resultat.message);
    noterBilan(resultat.fin);
  }
  const actions = store.getState();
  const manque = safari.prix - argent;
  return <section className="page-safari">
    <header className="safari-entete"><div><p>Parmanie · Kanto</p><h1 ref={titre} tabIndex={-1}>Parc Safari</h1></div>
      <button className="plaque" onClick={retour}>Retour</button></header>
    {!safari.acces.ouvert ? <p role="status" className="cadre safari-statut">{safari.acces.raison}</p> : <>
      {visite ? <>
        <dl className="safari-compteurs cadre" aria-label="Ta visite">
          <div><dt>Pas</dt><dd>{visite.pas} / {VISITE_SAFARI.pas}</dd></div>
          <div><dt>Safari Balls</dt><dd>{visite.balles} / {VISITE_SAFARI.balles}</dd></div>
          <div><dt>Capturés</dt><dd>{visite.captures}</dd></div>
        </dl>
        <div className="safari-scene cadre">
          {rencontre ? <>
            <div className="safari-acteur" style={videSprite(rencontre.numero)}>
              <Image src={spriteAffiche(sprite(rencontre.numero, rencontre.shiny))} genre="sprite" alt="" className={rencontre.shiny ? 'halo-shiny' : ''} /></div>
            <h2>{rencontre.nom} {rencontre.shiny && <IconeShiny decoratif={false} />}</h2>
            <p className="safari-detail">Niveau {rencontre.niveau}</p>
            <p>{humeurs[rencontre.humeur]}</p>
            <div className="safari-actions">
              <button className="plaque safari-principal" disabled={visite.balles === 0} onClick={() => agir(actions.lancerBalleSafari)}>Lancer une Safari Ball</button>
              <button className="plaque" onClick={() => agir(actions.jeterAppatSafari)}>Jeter un appât</button>
              <button className="plaque" onClick={() => agir(actions.jeterRocheSafari)}>Jeter une roche</button>
            </div></> : <>
            <h2>Les herbes hautes</h2>
            <p>Chaque pas peut faire surgir un Pokémon.</p>
            <div className="safari-actions">
              <button className="plaque safari-principal" disabled={visite.pas === 0} onClick={() => agir(actions.avancerSafari)}>Avancer dans les herbes</button>
            </div></>}
          <button className="plaque safari-sortie" onClick={() => agir(actions.quitterSafari)}>Quitter le parc</button>
        </div>
      </> : <div className="safari-scene cadre">
        <h2>Entrée du parc</h2>
        <p>{nombre(safari.prix)}{' ₽'} pour {VISITE_SAFARI.pas} pas et {VISITE_SAFARI.balles} Safari Balls. Les Pokémon du parc se capturent seulement avec ces balles ; l’entrée n’est pas remboursée.</p>
        <p className="safari-detail">Ton argent : {nombre(argent)}{' ₽'}</p>
        <div className="safari-actions">
          <button className="plaque safari-principal" disabled={manque > 0} onClick={() => agir(actions.entrerAuSafari)}>Payer l’entrée · {nombre(safari.prix)}{' ₽'}</button>
        </div>
        {manque > 0 && <p className="safari-detail">Il te manque {nombre(manque)}{' ₽'}.</p>}
      </div>}
      {bilan && !visite && <p className="cadre safari-bilan">{messageBilanSafari(bilan)}</p>}
      <p role="status" className="cadre safari-statut">{message}</p>
      <section aria-label="Pokémon du parc" className="safari-especes"><h2>Pokémon du parc</h2>
        <ul>{ESPECES_SAFARI.map(numero => <li key={numero} className="cadre"><Image src={spriteAffiche(sprite(numero))} genre="sprite" alt="" /><span>{catalogue.parNumero(numero).nom}</span></li>)}</ul></section>
    </>}
  </section>;
}
