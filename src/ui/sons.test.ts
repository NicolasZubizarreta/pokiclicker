import { expect, it, vi } from 'vitest';
import { brancherSons, creerSons, frequenceNote } from './sons';

function fauxContexte() {
  const parametre = () => ({ setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() });
  const oscillateurs: ReturnType<typeof oscillateur>[] = [];
  const gains: ReturnType<typeof gain>[] = [];
  const oscillateur = () => ({ type: '', frequency: parametre(), connect: vi.fn(), start: vi.fn(), stop: vi.fn() });
  const gain = () => ({ gain: parametre(), connect: vi.fn() });
  const contexte = {
    currentTime: 10, state: 'running', destination: {},
    createOscillator: vi.fn(() => { const noeud = oscillateur(); oscillateurs.push(noeud); return noeud; }),
    createGain: vi.fn(() => { const noeud = gain(); gains.push(noeud); return noeud; }),
    resume: vi.fn(() => Promise.resolve()), close: vi.fn(() => Promise.resolve()),
  };
  return { contexte, oscillateurs, gains, creerContexte: vi.fn(() => contexte as unknown as AudioContext) };
}

it('convertit les notes MIDI sans dépendance', () => {
  expect(frequenceNote('A4')).toBe(440);
  expect(frequenceNote('C2')).toBeCloseTo(65.4064);
  expect(() => frequenceNote('invalide')).toThrow();
});

it('attend le déverrouillage et joue catch avec les fréquences et l’enveloppe prévues', async () => {
  const faux = fauxContexte();
  const sons = creerSons({ creerContexte: faux.creerContexte, estActif: () => true });
  sons.jouer('catch');
  expect(faux.creerContexte).not.toHaveBeenCalled();
  expect(faux.contexte.createGain).not.toHaveBeenCalled();
  await sons.deverrouiller();
  await sons.deverrouiller();
  expect(faux.creerContexte).toHaveBeenCalledTimes(1);
  sons.jouer('catch');
  expect(faux.oscillateurs).toHaveLength(3);
  [261.63, 329.63, 392].forEach((frequence, index) => {
    const oscillateur = faux.oscillateurs[index]!;
    expect(oscillateur.type).toBe('triangle');
    expect(oscillateur.frequency.setValueAtTime.mock.calls[0]![0]).toBeCloseTo(frequence, 2);
    expect(oscillateur.start).toHaveBeenCalledWith(10);
    expect(oscillateur.stop).toHaveBeenCalledWith(11.125);
    expect(oscillateur.connect).toHaveBeenCalledWith(faux.gains[index + 1]);
  });
  expect(faux.gains[0]!.gain.setValueAtTime).toHaveBeenCalledWith(10 ** (-12 / 20), 10);
  expect(faux.gains[0]!.connect).toHaveBeenCalledWith(faux.contexte.destination);
  expect(faux.gains[1]!.connect).toHaveBeenCalledWith(faux.gains[0]);
  expect(faux.gains[1]!.gain.setValueAtTime).toHaveBeenCalledWith(0, 10);
  expect(faux.gains[1]!.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 10.005);
  expect(faux.gains[1]!.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(0.3, 10.105);
  expect(faux.gains[1]!.gain.setValueAtTime).toHaveBeenCalledWith(0.3, 10.125);
  expect(faux.gains[1]!.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, 11.125);
  await sons.fermer();
  expect(faux.contexte.close).toHaveBeenCalledTimes(1);
  sons.jouer('catch');
  await sons.deverrouiller();
  expect(faux.oscillateurs).toHaveLength(3);
  expect(faux.creerContexte).toHaveBeenCalledTimes(1);
});

it('reste muet si coupé ou suspendu et reprend au prochain geste', async () => {
  const faux = fauxContexte();
  let actif = false;
  const sons = creerSons({ creerContexte: faux.creerContexte, estActif: () => actif });
  await sons.deverrouiller();
  sons.jouer('hit');
  actif = true;
  faux.contexte.state = 'suspended';
  sons.jouer('hit');
  expect(faux.contexte.createOscillator).not.toHaveBeenCalled();
  await sons.deverrouiller();
  expect(faux.contexte.resume).toHaveBeenCalledTimes(1);
  faux.contexte.state = 'running';
  sons.jouer('hit');
  expect(faux.oscillateurs[0]!.stop).toHaveBeenCalledWith(11.0625);
});

it('tolère un contexte absent, une création ou une reprise refusée', async () => {
  const faux = fauxContexte();
  faux.contexte.state = 'suspended';
  faux.contexte.resume.mockRejectedValue(new Error('refus'));
  for (const creerContexte of [() => undefined, () => { throw new Error('absent'); }, faux.creerContexte]) {
    const sons = creerSons({ creerContexte, estActif: () => true });
    await expect(sons.deverrouiller()).resolves.toBeUndefined();
    expect(() => sons.jouer('pc')).not.toThrow();
    await sons.fermer();
  }
  vi.stubGlobal('AudioContext', undefined);
  try {
    const sons = creerSons({ estActif: () => true });
    await expect(sons.deverrouiller()).resolves.toBeUndefined();
    expect(() => sons.jouer('up')).not.toThrow();
    await sons.fermer();
  } finally { vi.unstubAllGlobals(); }
});

it('branche les événements et lit la préférence actuelle, puis se désabonne', async () => {
  const faux = fauxContexte();
  vi.stubGlobal('AudioContext', function () { return faux.contexte; });
  let actif = true;
  const desabonner = vi.fn();
  const store = {
    getState: () => ({ sonActive: actif }),
    abonnerSons: vi.fn<(abonne: (ton: 'hit') => void) => () => void>(() => desabonner),
  };
  try {
    const sons = brancherSons(store);
    expect(store.abonnerSons).toHaveBeenCalledTimes(1);
    await sons.deverrouiller();
    const jouer = store.abonnerSons.mock.calls[0]![0];
    jouer('hit');
    expect(faux.oscillateurs).toHaveLength(1);
    actif = false;
    jouer('hit');
    expect(faux.oscillateurs).toHaveLength(1);
    await sons.fermer();
    expect(desabonner).toHaveBeenCalledTimes(1);
    expect(faux.contexte.close).toHaveBeenCalledTimes(1);
  } finally { vi.unstubAllGlobals(); }
});
