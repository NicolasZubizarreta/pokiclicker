import { describe, expect, it } from 'vitest';
import { avancerCombat, calculerClic, calculerDpsEquipe, cliquer, creerCombat,
  reprendreCombat, suspendreDps } from './combat';
import { kanto } from './regions';
import { reglages } from './reglages';

const route = kanto.zoneDeCombat('kanto.route-1');
const equipe = [{ numero: 19, niveau: 5 }];
const creer = () => creerCombat(route, equipe, () => 0.5);

describe('Pause du DPS pendant une évolution', () => {
  it('initialise la pause à zéro, y compris à la reprise', () => {
    expect(creer().pauseDpsMs).toBe(0);
    expect(reprendreCombat(route, equipe, () => 0.5, 2).pauseDpsMs).toBe(0);
  });

  it('suspend tout le DPS pendant exactement 3000 ms sans modifier l’entrée', () => {
    const initial = creer();
    const copie = { ...initial, ennemi: { ...initial.ennemi } };
    const pause = suspendreDps(initial, 3000);
    expect(pause.pauseDpsMs).toBe(3000);
    const fin = avancerCombat(pause, 3000);
    expect(fin.ennemi.pv).toBe(initial.ennemi.pv);
    expect(fin.pauseDpsMs).toBe(0);
    expect(pause.pauseDpsMs).toBe(3000);
    expect(initial).toEqual(copie);
  });

  it('applique exactement 100 ms de DPS à 3100 ms, en un pas ou plusieurs', () => {
    const pause = suspendreDps(creer(), 3000);
    const attendu = pause.ennemi.pv - calculerDpsEquipe(equipe, pause.ennemi, []) * 100 / 1000;
    const fin = avancerCombat(pause, 3100);
    expect(fin.ennemi.pv).toBe(attendu);
    expect(fin.pauseDpsMs).toBe(0);
    let decoupe = pause;
    for (let i = 0; i < 31; i++) decoupe = avancerCombat(decoupe, 100);
    expect(decoupe.ennemi.pv).toBe(attendu);
    expect(decoupe.pauseDpsMs).toBe(0);
  });

  it('laisse les clics infliger leurs dégâts pendant la pause', () => {
    const pause = suspendreDps(creer(), 3000);
    const fin = cliquer(pause, { essayer: () => true });
    expect(fin.ennemi.pv).toBe(pause.ennemi.pv - calculerClic(calculerDpsEquipe(equipe, pause.ennemi, []), []));
    expect(fin.pauseDpsMs).toBe(3000);
  });

  it('laisse le minuteur du boss avancer et expirer pendant la pause', () => {
    const boss = reprendreCombat(route, equipe, () => 0.5, reglages.combat.etapeBoss);
    const pause = suspendreDps({ ...boss, minuteurMs: 1000 }, 3000);
    const milieu = avancerCombat(pause, 500);
    expect(milieu.minuteurMs).toBe(500);
    expect(milieu.ennemi.pv).toBe(boss.ennemi.pv);
    const fin = avancerCombat(milieu, 500);
    expect(fin.evenements).toContainEqual({ type: 'boss-echoue', zoneId: route.id });
    expect(fin.pauseDpsMs).toBe(2000);
  });

  it('décompte aussi la pause pendant l’attente avant un ennemi', () => {
    const pause = suspendreDps({ ...creer(), attenteMs: 1000 }, 3000);
    const milieu = avancerCombat(pause, 500);
    expect(milieu.attenteMs).toBe(500);
    expect(milieu.pauseDpsMs).toBe(2500);
    const fin = avancerCombat(milieu, 2600);
    expect(fin.ennemi.pv).toBe(pause.ennemi.pv - calculerDpsEquipe(equipe, pause.ennemi, []) * 100 / 1000);
    expect(fin.pauseDpsMs).toBe(0);
  });

  it('remplace la pause restante lors d’une seconde suspension', () => {
    const initial = avancerCombat(suspendreDps(creer(), 3000), 1000);
    const nouvelle = suspendreDps(initial, 3000);
    expect(initial.pauseDpsMs).toBe(2000);
    expect(nouvelle.pauseDpsMs).toBe(3000);
    expect(avancerCombat(nouvelle, 3000).ennemi.pv).toBe(initial.ennemi.pv);
    expect(suspendreDps(nouvelle, 100).pauseDpsMs).toBe(100);
  });
});
