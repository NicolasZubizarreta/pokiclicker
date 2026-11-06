import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';
import type { TypeObjetEquipe } from '../core/objets-equipe';

export type ObjetAChoisir = { type: TypeObjetEquipe | 'pierre' | 'stase' | 'jeton'; cle: string; nom: string };
export type EtatSac = { ouvert: boolean; objet: ObjetAChoisir | null };
export const storeSac = createStore<EtatSac>(() => ({ ouvert: false, objet: null }));
export function ouvrirSac() { storeSac.setState({ ouvert: true }); }
export function fermerSac() { storeSac.setState({ ouvert: false }); }
export function choisirObjet(objet: ObjetAChoisir) { storeSac.setState({ ouvert: false, objet }); }
export function terminerChoix() { storeSac.setState({ objet: null }); }
export function annulerChoix() { storeSac.setState({ objet: null, ouvert: true }); }
export function reinitialiserSac() { storeSac.setState({ ouvert: false, objet: null }); }
export function useSacContexte<T>(selecteur: (etat: EtatSac) => T): T { return useStore(storeSac, selecteur); }
