import donnees from '../../data/pantheon.json';
import { tirerConfetti, tirerFeu } from '../core/pantheon';

type Horloge = {
  setInterval(action: () => void, ms: number): number;
  clearInterval(id: number): void;
  setTimeout(action: () => void, ms: number): number;
  clearTimeout(id: number): void;
};

const palette = [
  '--color-primaire-400', '--color-secondaire-400', '--color-accent-400',
  '--color-succes-base', '--color-erreur-base',
];

/** Calque autonome : démarrer au final du Panthéon, arrêter à sa sortie. */
export function creerConfettis(hote: HTMLElement, options: {
  alea?: () => number;
  horloge?: Horloge;
  mouvementReduit?: () => boolean;
} = {}) {
  const alea = options.alea ?? Math.random;
  const horloge = options.horloge ?? window;
  const mouvementReduit = options.mouvementReduit
    ?? (() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  let calque: HTMLDivElement | null = null;
  const intervalles: number[] = [];
  const particules = new Map<HTMLElement, { retrait: number; animations: Animation[] }>();

  function retirer(particule: HTMLElement) {
    const suivi = particules.get(particule);
    if (!suivi) return;
    horloge.clearTimeout(suivi.retrait);
    suivi.animations.forEach((animation) => animation.cancel());
    particule.remove();
    particules.delete(particule);
  }

  function arreter() {
    intervalles.forEach((id) => horloge.clearInterval(id));
    intervalles.length = 0;
    for (const particule of particules.keys()) retirer(particule);
    calque?.remove();
    calque = null;
  }

  function emettre(type: 'confetti' | 'feu') {
    if (mouvementReduit()) {
      arreter();
      return;
    }
    if (!calque) return;
    const tirage = type === 'confetti' ? tirerConfetti(alea) : tirerFeu(alea);
    const particule = hote.ownerDocument.createElement('div');
    particule.dataset.particule = type;
    particule.style.position = 'absolute';
    particule.style.left = `${tirage.x * 100}%`;
    particule.style.setProperty('--couleur', `var(${palette[Math.min(palette.length - 1,
      Math.floor(tirage.couleur * palette.length))]})`);
    calque.append(particule);
    const animations: Animation[] = [];
    if ('rotationDepart' in tirage) {
      particule.style.top = 'calc(var(--spacing) * -2.5)';
      particule.style.width = 'calc(var(--spacing) * 2)';
      particule.style.height = 'calc(var(--spacing) * 2)';
      const morceau = hote.ownerDocument.createElement('div');
      morceau.style.width = '100%';
      morceau.style.height = '100%';
      morceau.style.backgroundColor = 'var(--couleur)';
      morceau.style.borderRadius = 'var(--radius-sm)';
      particule.append(morceau);
      animations.push(particule.animate([
        { transform: 'translateY(0)' },
        { transform: `translateY(${calque.clientHeight * 1.1}px)` },
      ], { duration: tirage.dureeChuteMs, easing: 'linear', fill: 'forwards' }));
      animations.push(morceau.animate([
        { transform: `rotate(${tirage.rotationDepart}deg)` },
        { transform: `rotate(${tirage.rotationFin}deg)` },
      ], { duration: tirage.dureeRotationMs, easing: 'linear', fill: 'forwards' }));
    } else {
      particule.style.top = `${tirage.y * 100}%`;
      particule.style.width = 'calc(var(--spacing) * 2.5)';
      particule.style.height = 'calc(var(--spacing) * 2.5)';
      particule.style.borderRadius = 'var(--radius-plein)';
      particule.style.border = 'calc(var(--spacing) / 2) solid var(--couleur)';
      // Halo net conforme à la charte, sans flou ni animation de bordure.
      particule.style.boxShadow = '0 0 0 calc(var(--spacing) / 4) var(--couleur)';
      animations.push(particule.animate([
        { transform: 'scale(1)', opacity: 1 },
        { transform: `scale(${tirage.echelle})`, opacity: 0 },
      ], { duration: tirage.vieMs, easing: 'ease-out', fill: 'forwards' }));
    }
    particules.set(particule, {
      animations,
      retrait: horloge.setTimeout(() => retirer(particule), tirage.vieMs),
    });
  }

  function demarrer() {
    if (mouvementReduit()) {
      arreter();
      return;
    }
    if (calque) return;
    calque = hote.ownerDocument.createElement('div');
    calque.setAttribute('aria-hidden', 'true');
    calque.style.position = 'absolute';
    calque.style.inset = '0';
    calque.style.overflow = 'hidden';
    calque.style.pointerEvents = 'none';
    hote.append(calque);
    intervalles.push(
      horloge.setInterval(() => emettre('confetti'), donnees.effets.confettiPeriodeMs),
      horloge.setInterval(() => emettre('feu'), donnees.effets.feuPeriodeMs),
    );
  }

  return { demarrer, arreter };
}
