import { useSyncExternalStore } from 'react';

const requete = '(max-width: 1023px)';
const snapshot = () => typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  ? window.matchMedia(requete).matches : false;
const snapshotServeur = () => false;
const abonner = (notifier: () => void) => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {};
  const media = window.matchMedia(requete);
  media.addEventListener?.('change', notifier);
  return () => media.removeEventListener?.('change', notifier);
};

export function useTelephone(): boolean {
  return useSyncExternalStore(abonner, snapshot, snapshotServeur);
}
