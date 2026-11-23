import { expect, it } from 'vitest';
import { avancerMannequin, creerMannequin, frapperMannequin, resultatMannequin } from './mannequin';
import { calculerDpsEquipe } from './combat';
import { calculerDps } from './stats';

it('mesure les dégâts et les clics sur le temps écoulé, sans dépasser la durée', () => {
  const debut = creerMannequin(30000);
  expect(resultatMannequin(debut).dpsTotal).toBe(0);
  const frappe = frapperMannequin(debut, 30);
  const milieu = avancerMannequin(frappe, 10000, 20);
  expect(resultatMannequin(milieu)).toEqual({ dpsEquipe: 20, dpsClic: 3, dpsTotal: 23, clicsParSeconde: .1 });
  const fin = avancerMannequin(milieu, 40000, 20);
  expect(fin.restantMs).toBe(0);
  expect(fin.degatsEquipe).toBe(600);
  expect(frapperMannequin(fin, 100)).toBe(fin);
  expect(debut.degatsClic).toBe(0);
});

it('calcule le DPS neutre sans avantage de type et ignore les œufs', () => {
  const membre = { numero: 6, niveau: 20 };
  expect(calculerDpsEquipe([membre, { ...membre, oeuf: true }], { types: [] }))
    .toBe(calculerDps({ ...membre, multiplicateurType: 1 }));
});
