import { expect, it } from 'vitest';
import { creerHorlogeSimulee } from './clock';
import { creerLimiteurClics } from './clics';

it('compte les clics acceptés et retire ceux sortis de la fenêtre, même sans nouveau clic', () => {
  const horloge = creerHorlogeSimulee();
  const limiteur = creerLimiteurClics(horloge, { fenetreClicsMs: 1000, clicsMaxParSeconde: 2 });
  expect(limiteur.cadence()).toBe(0);
  expect(limiteur.essayer()).toBe(true);
  horloge.avancer(200);
  expect(limiteur.essayer()).toBe(true);
  expect(limiteur.essayer()).toBe(false);
  expect(limiteur.cadence()).toBe(2);
  horloge.avancer(800);
  expect(limiteur.cadence()).toBe(1);
  horloge.avancer(200);
  expect(limiteur.cadence()).toBe(0);
  expect(limiteur.essayer()).toBe(true);
});
