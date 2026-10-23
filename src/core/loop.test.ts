import { describe, expect, it } from 'vitest';
import { creerHorlogeSimulee } from './clock';
import { creerBoucle } from './loop';

function creerCompteur(config?: { pasMs: number; rattrapageMaxMs: number; notificationMinMs: number }) {
  const horloge = creerHorlogeSimulee();
  const boucle = creerBoucle({
    horloge,
    etat: 0,
    avancer: (etat, pasMs) => etat + pasMs,
    config,
  });
  return { horloge, boucle };
}

describe('boucle au temps écoulé', () => {
  it('produit le même état en un rattrapage ou en cinquante ticks', () => {
    const long = creerCompteur();
    const court = creerCompteur();
    long.horloge.avancer(5000);
    expect(long.boucle.tick()).toEqual({ pas: 50, perduMs: 0 });
    for (let i = 0; i < 50; i++) {
      court.horloge.avancer(100);
      expect(court.boucle.tick()).toEqual({ pas: 1, perduMs: 0 });
    }
    expect(long.boucle.etat()).toBe(5000);
    expect(court.boucle.etat()).toBe(long.boucle.etat());
  });

  it('conserve les reliquats entre les ticks de soixante millisecondes', () => {
    const { horloge, boucle } = creerCompteur();
    let totalPas = 0;
    for (const attendu of [0, 1, 1, 2, 3]) {
      horloge.avancer(60);
      totalPas += boucle.tick().pas;
      expect(totalPas).toBe(attendu);
      expect(boucle.etat()).toBe(attendu * 100);
    }
  });

  it.each([
    [600000, 6000, 0],
    [7200000, 36000, 3600000],
  ])('rattrape une suspension de %i ms dans la limite prévue', (duree, pas, perduMs) => {
    const { horloge, boucle } = creerCompteur();
    horloge.avancer(duree);
    expect(boucle.tick()).toEqual({ pas, perduMs });
    expect(boucle.etat()).toBe(pas * 100);
    expect(boucle.tick()).toEqual({ pas: 0, perduMs: 0 });
  });

  it('plafonne aussi le reliquat et perd définitivement le dépassement', () => {
    const { horloge, boucle } = creerCompteur();
    horloge.avancer(60);
    boucle.tick();
    horloge.avancer(7200000);
    expect(boucle.tick()).toEqual({ pas: 36000, perduMs: 3600060 });
    horloge.avancer(40);
    expect(boucle.tick()).toEqual({ pas: 0, perduMs: 0 });
  });

  it('limite les notifications à dix sur une seconde et permet le désabonnement', () => {
    const { horloge, boucle } = creerCompteur();
    const recus: number[] = [];
    const desabonner = boucle.abonner((etat) => { recus.push(etat); });
    for (let i = 0; i < 50; i++) {
      horloge.avancer(20);
      boucle.tick();
    }
    expect(recus).toHaveLength(10);
    expect(boucle.etat()).toBe(1000);
    boucle.tick();
    expect(recus.at(-1)).toBe(boucle.etat());
    desabonner();
    horloge.avancer(100);
    boucle.tick();
    expect(recus).toHaveLength(10);
  });

  it('émet la première notification immédiatement puis livre le dernier état en attente sans nouveau pas', () => {
    const { horloge, boucle } = creerCompteur({
      pasMs: 100, rattrapageMaxMs: 3600000, notificationMinMs: 150,
    });
    const recus: number[] = [];
    boucle.abonner((etat) => { recus.push(etat); });
    horloge.avancer(100);
    boucle.tick();
    expect(recus).toEqual([100]);
    horloge.avancer(100);
    boucle.tick();
    horloge.avancer(25);
    boucle.tick();
    expect(recus).toEqual([100]);
    horloge.avancer(25);
    expect(boucle.tick()).toEqual({ pas: 0, perduMs: 0 });
    expect(recus).toEqual([100, 200]);
    expect(recus.at(-1)).toBe(boucle.etat());
  });

  it('traite un recul de l’horloge comme une durée nulle', () => {
    const { horloge, boucle } = creerCompteur();
    horloge.avancer(-100);
    expect(boucle.tick()).toEqual({ pas: 0, perduMs: 0 });
    expect(boucle.etat()).toBe(0);
    horloge.avancer(100);
    expect(boucle.tick()).toEqual({ pas: 1, perduMs: 0 });
  });

  it('applique chaque pas personnalisé dans l’ordre', () => {
    const horloge = creerHorlogeSimulee(1000);
    const boucle = creerBoucle({
      horloge, etat: '',
      avancer: (etat, pasMs) => `${etat}${pasMs};`,
      config: { pasMs: 50, rattrapageMaxMs: 1000, notificationMinMs: 100 },
    });
    horloge.avancer(125);
    expect(boucle.tick()).toEqual({ pas: 2, perduMs: 0 });
    expect(boucle.etat()).toBe('50;50;');
    horloge.avancer(25);
    expect(boucle.tick()).toEqual({ pas: 1, perduMs: 0 });
  });

  it.each([
    [0, 1000, 100],
    [50, -1, 100],
    [50, 1000, -1],
    [50, Infinity, 100],
  ])('rejette les réglages invalides (%s, %s, %s)', (pasMs, rattrapageMaxMs, notificationMinMs) => {
    expect(() => creerCompteur({ pasMs, rattrapageMaxMs, notificationMinMs }))
      .toThrow('Réglages de boucle invalides');
  });
});
