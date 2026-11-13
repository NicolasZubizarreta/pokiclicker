import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import { tutoriel, tutoriels } from '../../core/tutoriels';
import { storeJeu } from '../store';

/** « debut » : éliminations au début de l'étape, gardées ici pour qu'un changement de page ne les remette pas à zéro. */
export type TutoActif = { id: string; etape: number; rejeu: boolean; debut: number };
export const storeTuto = createStore<{ actif: TutoActif | null }>(() => ({ actif: null }));
const eliminations = () => storeJeu.getState().eliminations;
export function lancerTuto(id: string, rejeu = false): void {
  if (tutoriels.some(t => t.id === id)) storeTuto.setState({ actif: { id, etape: 0, rejeu, debut: eliminations() } });
}
export function etapeSuivanteTuto(): boolean {
  const actif = storeTuto.getState().actif;
  if (!actif) return false;
  const fini = actif.etape + 1 >= tutoriel(actif.id).etapes.length;
  storeTuto.setState({ actif: fini ? null : { ...actif, etape: actif.etape + 1, debut: eliminations() } });
  return fini;
}
export function fermerTuto(): void { storeTuto.setState({ actif: null }); }
export function useTuto(): TutoActif | null { return useStore(storeTuto, etat => etat.actif); }
