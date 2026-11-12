import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { reglages } from '../core/reglages';
import { storeJeu, type StoreJeu } from './store';
import type { EclosionAffichee } from './store-pension';
import { IconeShiny } from './IconeShiny';
import { RepereMarque } from './RepereMarque';
import './Plaques.css';
import './FenetreEclosion.css';

export function FenetreEclosion({ store = storeJeu }: { store?: Pick<StoreJeu, 'getState' | 'getInitialState' | 'subscribe'> }) {
  const eclosion = useStore(store, e => e.eclosion);
  return eclosion && <Naissance key={eclosion.uid} eclosion={eclosion} fermer={() => store.getState().fermerEclosion()} />;
}

function Naissance({ eclosion: e, fermer }: { eclosion: EclosionAffichee; fermer(): void }) {
  const [etape, changer] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'revele' : 'secousse');
  const dialogue = useRef<HTMLDialogElement>(null);
  const action = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const revele = etape === 'revele';
  useLayoutEffect(() => {
    const fenetre = dialogue.current!;
    const origine = document.activeElement;
    fenetre.showModal();
    return () => { fenetre.close(); if (origine instanceof HTMLElement && origine.isConnected) origine.focus(); };
  }, []);
  useEffect(() => {
    action.current?.focus();
    action.current?.scrollIntoView?.({ block: 'nearest' });
  }, [revele]);
  useEffect(() => {
    if (revele) return;
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    const reduire = () => { if (media?.matches) changer('revele'); };
    media?.addEventListener('change', reduire);
    const delais = [setTimeout(() => changer('fissure'), 1800), setTimeout(() => changer('eclair'), 2700), setTimeout(() => changer('revele'), 3000)];
    return () => { delais.forEach(clearTimeout); media?.removeEventListener('change', reduire); };
  }, [revele]);
  return <dialog ref={dialogue} className="fenetre-eclosion" aria-labelledby={titre}
    onCancel={event => { event.preventDefault(); if (revele) fermer(); else changer('revele'); }}>
    <div className="eclosion-corps">
      <h2 id={titre} aria-live="polite">{revele ? `${e.nom} est né !` : 'Ton œuf bouge…'}</h2>
      <div className="eclosion-scene" data-etape={etape} aria-hidden="true">
        <span className="eclosion-socle" />
        <img className="eclosion-oeuf" src="img/objets/lucky-egg.png" width="180" height="180" alt="" />
        <svg className="eclosion-fissures" viewBox="0 0 30 30"><path d="m15 3-2 5 3 3-4 4 3 4-2 5m3-13 5 1m-9 3-4-1" /></svg>
        <img className="eclosion-pokemon" src={`img/sprites/${e.shiny ? 'pokemon-shiny' : 'pokemon'}/${e.numero}.png`} width="192" height="192" alt="" />
        <span className="eclosion-eclair" />
        <div className="eclosion-eclats">{Array.from({ length: 5 }, (_, i) => <i key={i} />)}</div>
      </div>
      {revele && <div className="eclosion-resultat">
        <div className="eclosion-pastilles"><span>Niveau {e.niveau}</span><span>{e.sexe === 'male' ? 'Mâle' : e.sexe === 'femelle' ? 'Femelle' : 'Sans sexe'}</span><span>Bonheur {e.bonheur}</span>{e.shiny && <span><IconeShiny /> Chromatique !</span>}</div>
        <div className="eclosion-marque"><RepereMarque /><div><p><strong>Marque d'éclosion · +{e.marquePourcent} % de dégâts</strong></p><p>{e.nom} garde cette marque pour toujours. Un Pokémon ne la reçoit qu'une fois.</p></div></div>
        <div className="eclosion-pastilles"><span>Espèces écloses {e.especesEcloses}/{reglages.pension.especesTirees}</span><span>{e.nouvelleEspece ? <><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 12 5 5L20 6" /></svg> Nouvelle espèce</> : 'Déjà dans ta collection'}</span></div>
        {e.paliersGagnes.map(p => <div className="eclosion-palier" key={p.id}><p><strong><span aria-hidden="true">◆ </span>Succès obtenu : {p.seuil} espèces écloses</strong></p><p>+{p.diamants} diamants reçus.</p></div>)}
      </div>}
      <button ref={action} type="button" className={`plaque${revele ? ' plaque-action' : ''}`} onClick={() => revele ? fermer() : changer('revele')}>{revele ? 'Continuer' : "Passer l'animation"}</button>
    </div>
  </dialog>;
}
