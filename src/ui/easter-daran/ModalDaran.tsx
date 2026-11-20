import { useId, useLayoutEffect, useRef } from 'react';
import { Confettis } from './Confettis';
import { fermerModalDaran, useModalDaran } from './etat-modal';
import { VALEUR_ANNIVERSAIRE } from './nettoyage';
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
  return <dialog ref={dialogue} aria-labelledby={titre} className="daran-modal text-base text-texte" onClose={fermerModalDaran} onCancel={e => { e.preventDefault(); clore(); }}>
    <Confettis />
    <div className="daran-contenu bg-surface">
      <div className="daran-bande" />
      <div className="grid gap-6 p-6 md:p-8">
      <header className="flex items-center gap-4">
        <span className="daran-age font-titre" aria-hidden="true">22</span>
        <div className="grid gap-1">
          <p className="font-titre text-xl text-region-accent">22 ans aujourd'hui</p>
          <h2 id={titre} className="daran-titre font-titre text-2xl md:text-4xl">Joyeux anniversaire Daran !</h2>
        </div>
      </header>
      <div className="grid gap-3">
        <p>Pour tes 22 ans, et pour te remercier d'avoir autant joué aux tests, on fait un grand nettoyage sur tes parties.</p>
        <p>Tes montagnes de ressources ont fondu : tout est ramené à {VALEUR_ANNIVERSAIRE}, comme tes {VALEUR_ANNIVERSAIRE} ans.</p>
      </div>
      <ul className="daran-liste grid gap-3 bg-fond p-4">
        <li>Pokédollars : {nombre(resume.argent)} ₽ → {VALEUR_ANNIVERSAIRE} ₽</li>
        <li>Jetons de casino : {nombre(resume.jetons)} → {VALEUR_ANNIVERSAIRE}</li>
        <li>Sac : {nombre(resume.objetsRamenes)} {resume.objetsRamenes > 1 ? 'sortes d’objets ramenées' : 'sorte d’objet ramenée'} à {VALEUR_ANNIVERSAIRE} chacune. Tes accessoires et objets clés sont gardés.</li>
        <li>Niveau maximum : 100{resume.pokemonNiveauRamene > 0 && <> — {nombre(resume.pokemonNiveauRamene)} Pokémon ramenés au niveau 100</>}</li>
        <li>Calcium maximum : 10{resume.pokemonCalciumRamene > 0 && <> — {nombre(resume.pokemonCalciumRamene)} Pokémon ramenés à 10</>}</li>
        <li>Bonheur maximum : 255{resume.pokemonBonheurRamene > 0 && <> — {nombre(resume.pokemonBonheurRamene)} Pokémon ramenés à 255</>}</li>
      </ul>
      <p className="text-texte-doux">Pokédex, chromatiques, éclosions, badges et progression ne bougent pas.</p>
      <div className="daran-pied"><button type="button" className="cadre min-h-11 bg-action p-3 text-action-texte" onClick={clore}>Fermer</button></div>
      </div>
    </div>
  </dialog>;
}
