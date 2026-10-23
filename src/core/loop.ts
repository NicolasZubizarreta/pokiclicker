import type { Horloge } from './clock';
import { reglages } from './reglages';

// Aucun minuteur ici : l'interface appelle tick à sa propre cadence.
export function creerBoucle<E>(options: {
  horloge: Horloge;
  etat: E;
  avancer: (etat: E, pasMs: number) => E;
  config?: typeof reglages.boucle;
}) {
  const { horloge, avancer } = options;
  const { pasMs, rattrapageMaxMs, notificationMinMs } = options.config ?? reglages.boucle;
  if (![pasMs, rattrapageMaxMs, notificationMinMs].every(Number.isFinite)
    || pasMs <= 0 || rattrapageMaxMs < 0 || notificationMinMs < 0) {
    throw new Error('Réglages de boucle invalides : durées finies, pas positif et délais positifs ou nuls requis.');
  }

  let etatCourant = options.etat;
  let dernierTickMs = horloge.maintenant();
  let reliquatMs = 0;
  let derniereNotificationMs: number | undefined;
  let notificationEnAttente = false;
  const abonnes = new Set<(etat: E) => void>();

  return {
    etat: () => etatCourant,
    tick() {
      const maintenantMs = horloge.maintenant();
      const ecouleMs = Math.max(0, maintenantMs - dernierTickMs);
      dernierTickMs = maintenantMs;
      const totalMs = reliquatMs + ecouleMs;
      const perduMs = Math.max(0, totalMs - rattrapageMaxMs);
      const retenuMs = Math.min(totalMs, rattrapageMaxMs);
      const pas = Math.floor(retenuMs / pasMs);
      reliquatMs = retenuMs - pas * pasMs;
      for (let i = 0; i < pas; i++) {
        etatCourant = avancer(etatCourant, pasMs);
      }

      notificationEnAttente ||= pas > 0;
      if (notificationEnAttente && abonnes.size > 0
        && (derniereNotificationMs === undefined
          || maintenantMs - derniereNotificationMs >= notificationMinMs)) {
        notificationEnAttente = false;
        derniereNotificationMs = maintenantMs;
        abonnes.forEach((fn) => fn(etatCourant));
      }
      return { pas, perduMs };
    },
    abonner(fn: (etat: E) => void): () => void {
      abonnes.add(fn);
      return () => { abonnes.delete(fn); };
    },
  };
}
