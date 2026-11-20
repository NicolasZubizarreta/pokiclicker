import { useSyncExternalStore } from 'react';
import type { ResumeNettoyage } from './nettoyage';

let resume: ResumeNettoyage | null = null;
const abonnes = new Set<() => void>();
const lire = () => resume;
const abonner = (rappel: () => void) => {
  abonnes.add(rappel);
  return () => { abonnes.delete(rappel); };
};
export function ouvrirModalDaran(suivant: ResumeNettoyage): void {
  resume = suivant;
  abonnes.forEach(rappel => rappel());
}
export function fermerModalDaran(): void {
  resume = null;
  abonnes.forEach(rappel => rappel());
}
export function useModalDaran(): ResumeNettoyage | null {
  return useSyncExternalStore(abonner, lire, () => null);
}
