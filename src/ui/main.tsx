import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { brancherSons } from './sons';
import { storeJeu } from './store';
import '../styles/index.css';

// Le contexte audio n'est créé qu'au premier geste réel du joueur (règle des navigateurs).
const sons = brancherSons(storeJeu);
const premierGeste = () => {
  window.removeEventListener('pointerdown', premierGeste, true);
  window.removeEventListener('keydown', premierGeste, true);
  void sons.deverrouiller();
};
window.addEventListener('pointerdown', premierGeste, true);
window.addEventListener('keydown', premierGeste, true);

const racine = document.getElementById('racine');

if (!racine) {
  throw new Error('Le conteneur du jeu est introuvable.');
}

createRoot(racine).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
