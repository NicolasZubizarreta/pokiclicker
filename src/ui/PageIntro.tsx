import { useEffect, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { reglages } from '../core/reglages';
import { ChoixStarter } from './ChoixStarter';
import { DialogueIntro } from './DialogueIntro';
import { EcranTitre } from './EcranTitre';
import { ScenesBourgPalette } from './ScenesBourgPalette';
import { storeJeu, type StoreJeu } from './store';

const mouvementReduit = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Introduction d’une partie neuve : écran titre, visite de Bourg Palette, entrée au labo, dialogue de Chen, choix du starter.
 * Reste affichée jusqu’à la sortie du labo (`quandTerminee`).
 */
export function PageIntro({ store = storeJeu, quandTerminee }: { store?: StoreJeu; quandTerminee: () => void }) {
  const intro = useStore(store, etat => etat.intro);
  const accesPension = useStore(store, etat => etat.pension.acces);
  const evenement = useStore(store, etat => etat.evenement);
  const terminerEtape = useStore(store, etat => etat.terminerEtape);
  const [reduit] = useState(mouvementReduit);
  const reprise = intro.premiereLigneVue || intro.choixStarter;
  const [titre, fixerTitre] = useState(!reprise);
  const [visible, rendreVisible] = useState(reprise);
  const [dialogueOuvert, ouvrirDialogue] = useState(reprise);
  const [enLabo, noterLabo] = useState(reprise);
  const [choixPret, preparerChoix] = useState(false);
  const [erreur, signaler] = useState<string | null>(null);
  const minuteurs = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => () => minuteurs.current.forEach(id => clearTimeout(id)), []);
  useEffect(() => {
    if (!intro.choixStarter || choixPret) return;
    const minuteur = setTimeout(() => preparerChoix(true), reduit ? 0 : reglages.intro.choixDelaiMs);
    return () => clearTimeout(minuteur);
  }, [intro.choixStarter, choixPret, reduit]);

  const parlant = dialogueOuvert && (intro.enCours || intro.choixStarter);

  if (titre) return <div className="fixed inset-0 z-30 overflow-auto bg-fond">
    <EcranTitre quandJouer={() => {
      fixerTitre(false);
      if (reduit) rendreVisible(true);
      else minuteurs.current.push(setTimeout(() => rendreVisible(true), 0));
    }} />
  </div>;

  return <div className={`scene-intro relative ${visible ? 'opacity-100' : 'opacity-0'} motion-safe:intro-interface-fondu`}>
    <ScenesBourgPalette
      accesPension={accesPension}
      sceneInitiale={reprise ? 'kanto.labo' : 'kanto.chez-maman'}
      laboAVisiter={intro.enCours} sortieLaboClignote={!intro.enCours && !intro.choixStarter}
      bloquee={parlant || (intro.enCours && enLabo)} quandScene={id => noterLabo(id === 'kanto.labo')}
      quandLabo={() => {
        if (!intro.enCours) return;
        minuteurs.current.push(setTimeout(() => ouvrirDialogue(true), reduit ? 0 : reglages.intro.laboDelaiMs));
      }}
      quandSortieLabo={quandTerminee} />
    {parlant && <div className="absolute inset-x-0 bottom-0 z-10 grid">
      <DialogueIntro commande={evenement} sacOuvert={intro.sacOuvert} carteOuverte={intro.carteOuverte}
        terminerEtape={terminerEtape} />
      {intro.choixStarter && choixPret && <ChoixStarter starters={intro.starters}
        choisir={numero => signaler(store.getState().choisirStarter(numero))} />}
    </div>}
    {erreur && <p role="alert" className="cadre bg-surface p-2">{erreur}</p>}
  </div>;
}
