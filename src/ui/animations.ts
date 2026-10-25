import { reglages } from '../core/reglages';

export const SECOUSSE = {
  keyframes: [
    { offset: 0, transform: 'translateX(0)' },
    { offset: 0.25, transform: 'translateX(calc(var(--spacing) * -1.25)) rotate(-5deg)' },
    { offset: 0.75, transform: 'translateX(calc(var(--spacing) * 1.25)) rotate(5deg)' },
    { offset: 1, transform: 'translateX(0)' },
  ],
  options: { duration: reglages.animations.secousseMs, easing: 'ease-in-out' },
};

export const ECLAT = {
  keyframes: [{ opacity: 0 }, { opacity: 0.5 }, { opacity: 0 }],
  options: { duration: reglages.animations.secousseMs, easing: 'ease-in-out' },
};
