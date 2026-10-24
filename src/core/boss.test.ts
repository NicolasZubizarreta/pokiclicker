import { describe, expect, it, vi } from 'vitest';
import { avancerCombat, calculerDpsEquipe, cliquer, creerCombat, creerEnnemi, reprendreCombat } from './combat';
import { kanto } from './regions';

const route = kanto.zoneDeCombat('kanto.route-1');
const ligue = kanto.zoneDeCombat('kanto.ligue-pokemon');
const constant = () => 0.5;
const clic = { essayer: () => true };

describe('Minuteur des boss', () => {
  it('active le minuteur après l’attente puis échoue à exactement trente secondes', () => {
    const neuf = reprendreCombat(route, [], constant, 9);
    const attente = cliquer({ ...neuf, ennemi: { ...neuf.ennemi, pv: 1 } }, clic);
    expect(attente).toMatchObject({ etape: 10, minuteurMs: null });
    let boss = avancerCombat(attente, attente.attenteMs);
    expect(boss.minuteurMs).toBe(30000);
    boss = avancerCombat(boss, 29900);
    expect(boss).toMatchObject({ etape: 10, minuteurMs: 100 });
    const echec = avancerCombat(boss, 100);
    expect(echec).toMatchObject({ etape: 9, minuteurMs: null, attenteMs: 0, ennemi: { boss: false } });
    expect(echec.evenements.at(-1)).toEqual({ type: 'boss-echoue', zoneId: route.id });
    expect(creerCombat(route, [], constant).minuteurMs).toBeNull();
  });

  it('donne le même échec en trois cents pas ou en un seul', () => {
    const boss = reprendreCombat(route, [], constant, 10);
    let courant = boss;
    for (let i = 0; i < 300; i++) courant = avancerCombat(courant, 100);
    expect(courant).toEqual(avancerCombat(boss, 30000));
    expect(courant.etape).toBe(9);
  });

  it('fige le minuteur pendant l’attente et ignore les clics en attente', () => {
    const neuf = reprendreCombat(route, [], constant, 9);
    const attente = cliquer({ ...neuf, ennemi: { ...neuf.ennemi, pv: 1 } }, clic);
    const essayer = vi.fn(() => true);
    const partiel = avancerCombat(attente, attente.attenteMs - 100);
    expect(partiel.minuteurMs).toBeNull();
    expect(cliquer(partiel, { essayer })).toBe(partiel);
    expect(essayer).not.toHaveBeenCalled();
    const actif = avancerCombat(partiel, 200);
    expect(actif.minuteurMs).toBe(29900);
    expect(cliquer(actif, clic).minuteurMs).toBe(29900);
  });

  it('accorde la victoire dans la dernière tranche (une seule mort par pas, le reliquat est perdu)', () => {
    const equipe = [{ numero: 19, niveau: 50 }];
    const initial = reprendreCombat(route, equipe, constant, 10);
    const boss = { ...initial, minuteurMs: 100,
      ennemi: { ...initial.ennemi, pv: calculerDpsEquipe(equipe, initial.ennemi) * 0.1 } };
    const victoire = avancerCombat(boss, 150);
    expect(victoire).toMatchObject({ etape: 1, minuteurMs: null });
    expect(victoire.evenements.map((e) => e.type)).toEqual(['ennemi-vaincu', 'boss-vaincu']);
    expect(victoire.attenteMs).toBe(avancerCombat(boss, 100).attenteMs);
  });

  it('limite les dégâts au temps disponible puis applique le reliquat au nouvel ennemi', () => {
    const equipe = [{ numero: 19, niveau: 5 }];
    const initial = reprendreCombat(route, equipe, constant, 10);
    const boss = { ...initial, minuteurMs: 100,
      ennemi: { ...initial.ennemi, pv: calculerDpsEquipe(equipe, initial.ennemi) * 0.2 } };
    const echec = avancerCombat(boss, 200);
    expect(echec.evenements).toEqual([{ type: 'boss-echoue', zoneId: route.id }]);
    expect(echec.ennemi.pv).toBe(echec.ennemi.pvMax - calculerDpsEquipe(equipe, echec.ennemi) * 0.1);
  });

  it('reprend avec un boss neuf et trente secondes pleines', () => {
    const reprise = reprendreCombat(route, [], constant, 10);
    expect(reprise).toMatchObject({ minuteurMs: 30000, attenteMs: 0, ennemi: { boss: true } });
    expect(reprise.ennemi.pv).toBe(reprise.ennemi.pvMax);
  });
});

describe('Combats de la Ligue', () => {
  it.each(Array.from({ length: 10 }, (_, i) => i + 1))('choisit le boss de l’étape %i sans aléatoire', (etape) => {
    const rencontre = etape === 10 ? ligue.boss : ligue.adversaires![etape - 1]!;
    const alea = vi.fn(() => { throw new Error('Tirage imprévu'); });
    const ennemi = creerEnnemi(ligue, etape, alea);
    expect(ennemi).toMatchObject({ numero: rencontre.pokemon, niveau: rencontre.niveau,
      boss: true, shiny: false, capture: 0, rarete: null });
    expect(ennemi.pvMax).toBe(creerEnnemi({ ...ligue, boss: rencontre }, 10, alea).pvMax);
    expect(alea).not.toHaveBeenCalled();
    expect(reprendreCombat(ligue, [], alea, etape).minuteurMs).toBe(30000);
  });

  it('revient à l’étape un à l’expiration de l’étape cinq', () => {
    const echec = avancerCombat(reprendreCombat(ligue, [], constant, 5), 30000);
    expect(echec).toMatchObject({ etape: 1, minuteurMs: 30000, attenteMs: 0,
      ennemi: { numero: ligue.adversaires![0]!.pokemon, boss: true } });
    expect(echec.evenements).toEqual([{ type: 'boss-echoue', zoneId: ligue.id }]);
  });

  it.each([3, 10])('résout la victoire à l’étape %i', (etape) => {
    const initial = reprendreCombat(ligue, [], constant, etape);
    const victoire = cliquer({ ...initial, ennemi: { ...initial.ennemi, pv: 1 } }, clic);
    expect(victoire).toMatchObject({ etape: etape === 10 ? 1 : 4, minuteurMs: null });
    expect(victoire.evenements.map((e) => e.type)).toEqual(etape === 10
      ? ['ennemi-vaincu', 'boss-vaincu'] : ['ennemi-vaincu']);
    expect(victoire.ennemi.numero).toBe(ligue.adversaires![etape === 10 ? 0 : 3]!.pokemon);
    expect(avancerCombat(victoire, victoire.attenteMs).minuteurMs).toBe(30000);
  });
});
