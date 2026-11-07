import { useEffect, useRef } from 'react';
import { IconeAlerte } from './icones-compte';
import './ZoneCompte.css';

export function DialogueDeconnexion({ etat, quandConfirmer, quandAnnuler, quandReessayer, quandRester }: {
  etat: 'confirmer' | 'confirmer-attente' | 'chargement' | 'echec';
  quandConfirmer(): void; quandAnnuler(): void; quandReessayer(): void; quandRester(): void;
}) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const titre = useRef<HTMLHeadingElement>(null);
  const confirmation = etat === 'confirmer' || etat === 'confirmer-attente';
  useEffect(() => {
    const precedent = document.activeElement;
    const fenetre = dialogue.current!;
    fenetre.showModal();
    titre.current?.focus();
    return () => { fenetre.close(); if (precedent instanceof HTMLElement) precedent.focus(); };
  }, [etat]);
  return <dialog ref={dialogue} data-theme="dark" className={confirmation ? 'cadre zc-dialogue font-texte' : 'zc-attente-plein font-texte'}
    role={confirmation ? 'dialog' : 'alertdialog'} aria-modal="true"
    aria-label={confirmation ? 'Se déconnecter ?' : etat === 'chargement' ? 'Sauvegarde en cours' : 'Échec de la sauvegarde'}
    onCancel={e => { e.preventDefault(); if (confirmation) quandAnnuler(); }}
    onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); if (confirmation) quandAnnuler(); } }}>
    {confirmation ? <>
      <h2 ref={titre} tabIndex={-1} className="font-titre text-xl font-bold">Se déconnecter ?</h2>
      <p>{etat === 'confirmer' ? 'Ta partie est à jour. Tu pourras te reconnecter quand tu veux.' : "Ta dernière progression n'est pas encore envoyée en ligne. Elle sera sauvegardée avant la déconnexion."}</p>
      <button type="button" className="plaque plaque-action min-h-12" onClick={quandConfirmer}>{etat === 'confirmer' ? 'Se déconnecter' : 'Sauvegarder et se déconnecter'}</button>
      <button type="button" className="plaque min-h-12" onClick={quandAnnuler}>{etat === 'confirmer' ? 'Annuler' : 'Rester connecté'}</button>
    </> : <>
      {etat === 'chargement' ? <span className="zc-rond-charge" aria-hidden="true" /> : <IconeAlerte />}
      <h1 ref={titre} tabIndex={-1} className="font-titre text-2xl font-bold">{etat === 'chargement' ? 'Sauvegarde en cours…' : "La sauvegarde n'a pas abouti"}</h1>
      {etat === 'chargement' ? <>
        <p>Ne ferme pas la page et ne quitte pas l'application. Tu seras déconnecté dès que ta partie sera sauvegardée.</p>
        <div className="zc-barre-ind" aria-hidden="true"><i /></div>
      </> : <>
        <p>Ta progression n'a pas été envoyée en ligne. Vérifie ta connexion, puis réessaie. Tant que ce n'est pas fait, tu restes connecté et ta partie reste sur cet appareil.</p>
        <div className="flex flex-col gap-4 w-full">
          <button type="button" className="plaque plaque-action min-h-12" onClick={quandReessayer}>Réessayer</button>
          <button type="button" className="plaque min-h-12" onClick={quandRester}>Rester connecté</button>
        </div>
      </>}
    </>}
  </dialog>;
}
