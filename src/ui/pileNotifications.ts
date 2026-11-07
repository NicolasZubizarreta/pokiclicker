import { createStore } from 'zustand/vanilla';
import { reglages } from '../core/reglages';

export type Notification = { id: number; texte: string };

/** Pile des notifications visibles : les plus anciennes sortent au-delà de `notificationsMax`, chacune disparaît seule. */
export const storeNotifications = createStore<{ liste: Notification[] }>(() => ({ liste: [] }));

let compteur = 0;

export function notifier(texte: string | null | undefined): void {
  if (!texte) return;
  const id = ++compteur;
  storeNotifications.setState(({ liste }) => ({ liste: [...liste, { id, texte }].slice(-reglages.interface.notificationsMax) }));
  setTimeout(() => storeNotifications.setState(({ liste }) => ({ liste: liste.filter(n => n.id !== id) })), reglages.interface.annonceMs);
}

export function viderNotifications(): void {
  storeNotifications.setState({ liste: [] });
}
