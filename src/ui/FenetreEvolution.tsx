import { useEffect, useId, useLayoutEffect, useRef } from 'react';
import { useStore } from 'zustand';
import { spriteAffiche } from './affichage-pokemon';
import { Image } from './Image';
import { SpriteEvolution } from './SpriteEvolution';
import { storeJeu, type StoreJeu } from './store';
import { messagesEvolution, texteModal, type ModalEvolution } from './store-evolution';
import './Plaques.css';
import './FenetreEclosion.css';
import './FenetreEvolution.css';

type StoreFenetre = Pick<StoreJeu, 'getState' | 'getInitialState' | 'subscribe'>;

/** Fenêtre d'évolution : proposition (Confirmer / Plus tard), animation, puis message final. */
export function FenetreEvolution({ store = storeJeu }: { store?: StoreFenetre }) {
  const modal = useStore(store, e => e.modalEvolution);
  return modal && <Evolution key={modal.uid} modal={modal} store={store} />;
}

function Evolution({ modal, store }: { modal: ModalEvolution; store: StoreFenetre }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const action = useRef<HTMLButtonElement>(null);
  const titre = useId();
  const { phase, pokemon } = modal;
  const etat = store.getState();
  useLayoutEffect(() => {
    const fenetre = dialogue.current!;
    const origine = document.activeElement;
    fenetre.showModal();
    return () => { fenetre.close(); if (origine instanceof HTMLElement && origine.isConnected) origine.focus(); };
  }, []);
  useEffect(() => { action.current?.focus(); }, [phase]);
  const sprite = (numero: number) => spriteAffiche({ ...pokemon, numero });
  const intitule = phase === 'proposition' ? texteModal(messagesEvolution.surLePoint, { nom: modal.nom })
    : phase === 'animation' ? texteModal(messagesEvolution.enCours, { nom: modal.nom })
      : texteModal(messagesEvolution.felicitations, { ancien: modal.nomAncien, nouveau: modal.nomNouveau });
  return <dialog ref={dialogue} className="fenetre-eclosion fenetre-evolution" aria-labelledby={titre}
    onCancel={event => {
      event.preventDefault();
      if (phase === 'proposition') etat.reporterEvolution();
      else if (phase === 'fin') etat.fermerEvolution();
    }}>
    <div className="eclosion-corps">
      <h2 id={titre} aria-live="polite">{intitule}</h2>
      <div className="eclosion-scene evolution-scene">
        <span className="eclosion-socle" />
        {phase === 'proposition' && <Image genre="sprite" src={sprite(pokemon.numero)} alt={modal.nom} className={pokemon.shiny ? 'halo-shiny' : ''} />}
        {phase === 'animation' && <SpriteEvolution ancien={sprite(pokemon.numero)} nouveau={sprite(modal.vers)} nom={modal.nomNouveau} actif shiny={pokemon.shiny} />}
        {phase === 'fin' && <Image genre="sprite" src={sprite(modal.vers)} alt={modal.nomNouveau} className={pokemon.shiny ? 'halo-shiny' : ''} />}
      </div>
      {phase === 'proposition' && <div className="evolution-boutons">
        <button ref={action} type="button" className="plaque plaque-action" onClick={() => etat.confirmerEvolution()}>Confirmer</button>
        <button type="button" className="plaque" onClick={() => etat.reporterEvolution()}>Plus tard</button>
      </div>}
      {phase === 'animation' && <button ref={action} type="button" className="plaque" onClick={() => etat.passerAnimationEvolution()}>Passer l'animation</button>}
      {phase === 'fin' && <button ref={action} type="button" className="plaque plaque-action" onClick={() => etat.fermerEvolution()}>Fermer</button>}
    </div>
  </dialog>;
}
