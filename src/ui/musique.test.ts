import { expect, it, vi } from 'vitest';
import { creerMusique } from './musique';

function fabrique() {
  const lecteurs: Record<string, { play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn>;
    currentTime: number; loop: boolean; volume: number; paused: boolean }> = {};
  const creerLecteur = (fichier: string) => {
    const lecteur = { currentTime: 0, loop: false, volume: 1, paused: true,
      play: vi.fn(() => { lecteur.paused = false; return Promise.resolve(); }),
      pause: vi.fn(() => { lecteur.paused = true; }) };
    lecteurs[fichier] = lecteur;
    return lecteur as never;
  };
  return { lecteurs, creerLecteur };
}

it('ne joue rien avant le premier geste', () => {
  const { lecteurs, creerLecteur } = fabrique();
  const musique = creerMusique({ creerLecteur, actifInitial: true, enregistrer: () => {} });
  musique.definirScene('combat');
  expect(Object.keys(lecteurs)).toEqual([]);
  musique.deverrouiller();
  expect(lecteurs['audio/route.ogg']!.play).toHaveBeenCalledTimes(1);
  expect(lecteurs['audio/route.ogg']!.loop).toBe(true);
  expect(lecteurs['audio/route.ogg']!.volume).toBeCloseTo(10 ** (-18 / 20));
});

it('change de piste avec la scène, reprend une boucle et relance la fanfare du début', () => {
  const { lecteurs, creerLecteur } = fabrique();
  const musique = creerMusique({ creerLecteur, actifInitial: true, enregistrer: () => {} });
  musique.deverrouiller();
  musique.definirScene('combat');
  musique.definirScene('hors-combat');
  expect(lecteurs['audio/route.ogg']!.pause).toHaveBeenCalledTimes(1);
  expect(lecteurs['audio/carte.ogg']!.play).toHaveBeenCalledTimes(1);
  musique.definirScene('pantheon');
  lecteurs['audio/victoire.mp3']!.currentTime = 12;
  musique.definirScene('combat');
  musique.definirScene('pantheon');
  expect(lecteurs['audio/victoire.mp3']!.currentTime).toBe(0);
  expect(lecteurs['audio/victoire.mp3']!.play).toHaveBeenCalledTimes(2);
  expect(lecteurs['audio/carte.ogg']!.pause).toHaveBeenCalledTimes(1);
});

it('se coupe depuis Plus, enregistre le choix et se coupe quand l\'onglet est masqué', () => {
  const { lecteurs, creerLecteur } = fabrique();
  const enregistrer = vi.fn();
  const musique = creerMusique({ creerLecteur, actifInitial: true, enregistrer });
  const abonne = vi.fn();
  musique.abonner(abonne);
  musique.deverrouiller();
  musique.definirScene('combat');
  musique.masquer(true);
  expect(lecteurs['audio/route.ogg']!.paused).toBe(true);
  musique.masquer(false);
  expect(lecteurs['audio/route.ogg']!.paused).toBe(false);
  musique.basculer();
  expect(musique.estActive()).toBe(false);
  expect(enregistrer).toHaveBeenCalledWith(false);
  expect(abonne).toHaveBeenCalledTimes(1);
  expect(lecteurs['audio/route.ogg']!.paused).toBe(true);
  musique.basculer();
  expect(lecteurs['audio/route.ogg']!.paused).toBe(false);
});

it('reste silencieuse quand la lecture est refusée', async () => {
  const lecteur = { currentTime: 0, loop: false, volume: 1, paused: true, pause: vi.fn(),
    play: vi.fn(() => Promise.reject(new Error('refusé'))) };
  const musique = creerMusique({ creerLecteur: () => lecteur as never, actifInitial: true, enregistrer: () => {} });
  musique.deverrouiller();
  musique.definirScene('combat');
  await Promise.resolve();
  expect(lecteur.play).toHaveBeenCalled();
});
