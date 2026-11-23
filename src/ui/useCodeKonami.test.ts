// @vitest-environment jsdom
import { expect, it } from 'vitest';
import { avancerCode } from './useCodeKonami';
import { creerStoreJeu } from './store';
import { creerHorlogeSimulee } from '../core/clock';
import { creerStockageMemoire } from '../core/sauvegarde';

const touches = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'B', 'A'];
const avancer = (suite: string[], position = 0) => suite.reduce(avancerCode, position);

it('reconnaît les lettres dans les deux casses', () => {
  expect(avancer(touches)).toBe(10);
  expect(avancer(touches.map(t => t.length === 1 ? t.toLowerCase() : t))).toBe(10);
});
it('annule une erreur et retrouve un nouveau départ, même chevauché', () => {
  expect(avancer([...touches.slice(0, 5), 'x', ...touches.slice(5)])).toBe(0);
  expect(avancer(['ArrowUp', 'x', ...touches])).toBe(10);
  expect(avancer(['ArrowUp', ...touches])).toBe(10);
});
it('ne déclenche qu’une fois et conserve le drapeau après rechargement', () => {
  const stockage = creerStockageMemoire();
  const options = { stockage, horloge: creerHorlogeSimulee(), alea: () => 0.1, genererId: () => 'konami-test' };
  const store = creerStoreJeu(options);
  store.getState().demarrer();
  try {
    expect(store.getState().erreur).toBeNull();
    const argent = store.getState().argent;
    expect(store.getState().noterCodeKonami()).toBe(true);
    expect(store.getState().annonce).toBe('Code secret !');
    expect(store.getState().argent).toBe(argent);
    expect(store.getState().noterCodeKonami()).toBe(false);
  } finally { store.getState().arreter(); }
  const recharge = creerStoreJeu(options);
  recharge.getState().demarrer();
  try { expect(recharge.getState().noterCodeKonami()).toBe(false); }
  finally { recharge.getState().arreter(); }
});
