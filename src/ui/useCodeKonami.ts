import { useEffect, useState } from 'react';
import type { StoreJeu } from './store';
import { useTelephone } from './useTelephone';
import { dansChampSaisie } from './champSaisie';

const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

export function avancerCode(position: number, touche: string): number {
  const suite = [...code.slice(0, position), touche.length === 1 ? touche.toLowerCase() : touche];
  for (let longueur = Math.min(code.length, suite.length); longueur > 0; longueur--) {
    if (code.slice(0, longueur).every((t, i) => t === suite[suite.length - longueur + i])) return longueur;
  }
  return 0;
}

export function useCodeKonami(store: StoreJeu) {
  const telephone = useTelephone();
  const [pluie, montrer] = useState(false);
  useEffect(() => {
    if (telephone) return;
    let position = 0;
    const clavier = (event: KeyboardEvent) => {
      const etat = store.getState();
      if (event.defaultPrevented || event.repeat || event.ctrlKey || event.altKey || event.metaKey
        || dansChampSaisie(event.target) || document.querySelector('dialog[open]')
        || !etat.zone || !etat.ennemi || etat.intro.enCours || etat.intro.choixStarter
        || etat.fin.credits || etat.pantheon?.ouvert || (etat.evenement?.type === 'dialogue' && etat.evenement.scene)) {
        position = 0;
        return;
      }
      const avant = position;
      position = avancerCode(position, event.key);
      // Les deux dernières touches (B, A) sont aussi des raccourcis du combat (choix de balle, attaque auto) :
      // tant qu'elles prolongent le code, elles ne doivent rien déclencher d'autre.
      if (position > avant && avant >= code.length - 2) event.stopPropagation();
      if (position === code.length) {
        position = 0;
        if (etat.noterCodeKonami()) montrer(true);
      }
    };
    // Phase de capture : avant les raccourcis, qui ouvrent le choix de balle (touche B) et feraient repartir le code à zéro.
    document.addEventListener('keydown', clavier, true);
    return () => document.removeEventListener('keydown', clavier, true);
  }, [store, telephone]);
  useEffect(() => {
    if (!pluie) return;
    const minuterie = setTimeout(() => montrer(false), 2700);
    return () => clearTimeout(minuterie);
  }, [pluie]);
  return pluie;
}
