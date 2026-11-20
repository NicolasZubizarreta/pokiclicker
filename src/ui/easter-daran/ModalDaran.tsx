import { useId, useLayoutEffect, useRef } from 'react';
import { Confettis } from './Confettis';
import { fermerModalDaran, useModalDaran } from './etat-modal';
import './ModalDaran.css';

export function ModalDaran() {
  const resume = useModalDaran();
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useId();
  const ouvert = resume !== null;
  useLayoutEffect(() => {
    if (!ouvert) return;
    const declencheur = document.activeElement;
    dialogue.current?.showModal();
    return () => {
      if (declencheur instanceof HTMLElement && declencheur !== document.body && declencheur.isConnected) declencheur.focus();
    };
  }, [ouvert]);
  if (!resume) return null;
  const nombre = (valeur: number) => valeur.toLocaleString('fr-FR');
  const clore = () => dialogue.current?.close();
  return <dialog ref={dialogue} aria-labelledby={titre} className="daran-modal bg-surface text-base text-texte" onClose={fermerModalDaran} onCancel={e => { e.preventDefault(); clore(); }}>
    <Confettis />
    <div className="daran-contenu grid gap-6 p-6 sm:p-8">
      <header className="grid gap-2">
        <p className="font-titre text-xl text-region-accent">22 ans aujourd'hui</p>
        <h2 id={titre} className="font-titre text-3xl">Joyeux anniversaire Daran !</h2>
      </header>
      <div className="grid gap-3">
        <p>Pour tes 22 ans, et pour te remercier d'avoir autant joué aux tests, on fait un grand nettoyage sur tes parties.</p>
        <p>Tu peux dire adieu à tes montagnes de ressources : tout est redevenu normal.</p>
      </div>
      <ul className="grid gap-3 bg-fond p-4">
        <li>Pokédollars : {nombre(resume.argent)} ₽ → 0 ₽</li>
        <li>Jetons de casino : {nombre(resume.jetons)} → 0</li>
        <li>Sac vidé : {nombre(resume.objetsVides)} {resume.objetsVides > 1 ? 'sortes d’objets retirées' : 'sorte d’objet retirée'}. Tes accessoires et objets clés sont gardés.</li>
        <li>Niveau maximum : 100{resume.pokemonNiveauRamene > 0 && <> — {nombre(resume.pokemonNiveauRamene)} Pokémon ramenés au niveau 100</>}</li>
        <li>Calcium maximum : 10{resume.pokemonCalciumRamene > 0 && <> — {nombre(resume.pokemonCalciumRamene)} Pokémon ramenés à 10</>}</li>
        <li>Bonheur maximum : 255{resume.pokemonBonheurRamene > 0 && <> — {nombre(resume.pokemonBonheurRamene)} Pokémon ramenés à 255</>}</li>
      </ul>
      <p className="text-texte-doux">Pokédex, chromatiques, éclosions, badges et progression ne bougent pas.</p>
      <button type="button" className="cadre min-h-11 justify-self-end bg-action p-3 text-action-texte" onClick={clore}>Fermer</button>
    </div>
  </dialog>;
}
