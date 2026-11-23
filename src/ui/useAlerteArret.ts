import { useEffect, useRef } from 'react';

export function useAlerteArret(banniere: string | null) {
  const precedente = useRef<string | null>(null);
  const nettoyer = useRef<(() => void) | null>(null);

  useEffect(() => () => nettoyer.current?.(), []);
  useEffect(() => {
    const nouvelArret = precedente.current === null && banniere !== null;
    precedente.current = banniere;
    if (!nouvelArret) return;
    nettoyer.current?.();
    // Chrome bloque la vibration (et journalise une erreur) tant que la personne n'a pas touché la page.
    if (!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches && (navigator.userActivation?.hasBeenActive ?? true)) {
      navigator.vibrate?.([200, 100, 200]);
    }
    if (!document.hidden) return;
    const titre = document.title;
    let alerte = false;
    const intervalle = window.setInterval(() => {
      alerte = !alerte;
      document.title = alerte ? banniere : titre;
    }, 1000);
    const restaurer = () => {
      window.clearInterval(intervalle);
      window.clearTimeout(limite);
      document.removeEventListener('visibilitychange', visibilite);
      document.title = titre;
      nettoyer.current = null;
    };
    const visibilite = () => { if (!document.hidden) restaurer(); };
    const limite = window.setTimeout(restaurer, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', visibilite);
    nettoyer.current = restaurer;
  }, [banniere]);
}
