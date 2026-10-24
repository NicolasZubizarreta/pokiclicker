import { useRegisterSW } from 'virtual:pwa-register/react';
import { storeJeu } from './store';

export function MiseAJour() {
  const { needRefresh: [actualiser, choisirActualiser], offlineReady: [horsLigne, choisirHorsLigne],
    updateServiceWorker } = useRegisterSW();
  if (!actualiser && !horsLigne) return null;
  const masquer = () => { choisirActualiser(false); choisirHorsLigne(false); };
  const bouton = 'min-h-11 border border-bordure bg-surface-2 px-4 text-texte';
  return <aside role="status" aria-live="polite" className="cadre mb-4 bg-surface p-4">
    <p>{actualiser ? "Une mise à jour est prête. Recharge pour l'utiliser." : 'Le jeu est prêt hors connexion.'}</p>
    <div className="mt-2 flex flex-wrap gap-2">
      {actualiser && <button className={bouton} onClick={() => {
        storeJeu.getState().fermer();
        void updateServiceWorker(true);
      }}>Recharger</button>}
      <button className={bouton} onClick={masquer}>{actualiser ? 'Plus tard' : 'Fermer'}</button>
    </div>
  </aside>;
}
