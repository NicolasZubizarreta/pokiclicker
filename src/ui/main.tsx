import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { nettoyerCachesImages } from '../pwa/nettoyer-caches';
import { brancherSons } from './sons';
import { musique } from './musique';
import { storeJeu } from './store';
import { chargerRegion } from './composition-root';
import { ContexteRegion } from './ContexteRegion';
import '../styles/index.css';

// Le contexte audio et la musique ne démarrent qu'au premier geste réel du joueur (règle des navigateurs).
const sons = brancherSons(storeJeu);
const premierGeste = () => {
  window.removeEventListener('pointerdown', premierGeste, true);
  window.removeEventListener('keydown', premierGeste, true);
  void sons.deverrouiller();
  musique.deverrouiller();
};
document.addEventListener('visibilitychange', () => musique.masquer(document.hidden));
window.addEventListener('pointerdown', premierGeste, true);
window.addEventListener('keydown', premierGeste, true);

void nettoyerCachesImages(__CACHE_IMAGES__).catch(() => undefined);

const racine = document.getElementById('racine');

if (!racine) {
  throw new Error('Le conteneur du jeu est introuvable.');
}

chargerRegion('kanto')
  .then(region => {
    createRoot(racine).render(
      <StrictMode>
        <ContexteRegion.Provider value={region}>
          <App />
        </ContexteRegion.Provider>
      </StrictMode>,
    );
  })
  .catch(() => {
    racine.textContent = 'Impossible de charger la région.';
  });
