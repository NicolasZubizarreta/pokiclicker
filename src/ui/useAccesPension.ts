import { useEffect, useId, useRef, useState } from 'react';
import { useStore } from 'zustand';
import { reglages } from '../core/reglages';
import { storeJeu } from './store';

export function useAccesPension() {
  const acces = useStore(storeJeu, e => e.pension.acces);
  const description = useId();
  const [message, annoncer] = useState<string | null>(null);
  const minuterie = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(minuterie.current), []);
  const raison = acces.raison ?? 'Bientôt disponible.';
  function expliquer() {
    clearTimeout(minuterie.current);
    annoncer(raison);
    minuterie.current = setTimeout(() => annoncer(null), reglages.interface.annonceMs);
  }
  return { ouverte: acces.ouvert, raison, description, message, expliquer };
}
