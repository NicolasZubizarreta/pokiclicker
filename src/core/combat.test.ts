import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import references from '../../tests/fixtures/v1-combat.json';
import matrice from '../../tests/fixtures/v1-multiplicateurs.json';
import statsV1 from '../../tests/fixtures/v1-stats.json';
import { avancerCombat, calculerClic, calculerDpsEquipe, cliquer, creerCombat,
  creerEnnemi, creerLimiteurClics, multiplicateurType, viderEvenements } from './combat';
import { creerHorlogeSimulee } from './clock';
import { creerBoucle } from './loop';
import { chargerPokemon } from './pokemon';
import { kanto } from './regions';
import { reglages } from './reglages';

const route = kanto.zone('kanto.route-1');
const equipe = [{ numero: 19, niveau: 5 }];
const catalogue = chargerPokemon();
const constant = () => 0.5;
const suite = (...valeurs: number[]) => {
  let index = 0;
  return () => {
    const valeur = valeurs[index++];
    if (valeur === undefined) throw new Error('Tirage imprévu');
    return valeur;
  };
};

describe('Non-régression stricte de la V1', () => {
  it.each(references)('$nom', (s) => {
    const actifs = [...s.jalons.map((n) => `jalon:${n}`), ...s.badges.map((b) => `badge:${b}`),
      ...s.objets.map((o) => `objet:${o}`), ...s.boosts.map((b) => `boost:${b}`)];
    const dps = calculerDpsEquipe(s.equipe, { numero: s.cible }, actifs);
    expect(dps).toBe(s.dpsV1);
    expect(calculerClic(dps, actifs)).toBe(s.clicV1);
  });
  it('reproduit les 151 × 151 multiplicateurs', () => {
    for (let a = 1; a <= 151; a++) {
      for (let d = 1; d <= 151; d++) {
        expect(multiplicateurType(catalogue.parNumero(a).types, catalogue.parNumero(d).types))
          .toBe(matrice[a - 1]![d - 1]);
      }
    }
  });
  it('traite les types absents et ignore les œufs', () => {
    expect(multiplicateurType(['inconnu'], ['inconnu'])).toBe(1);
    expect(multiplicateurType(['normal'], [])).toBe(1);
    expect(calculerDpsEquipe([{ ...equipe[0]!, oeuf: true }], { numero: 19 })).toBe(0);
  });
  it('conserve les arrondis intermédiaires du clic', () => {
    expect(calculerClic(0, ['objet:protein', 'objet:hardStone'])).toBe(9);
    expect(calculerClic(0, ['objet:protein'])).toBe(7);
  });
});

describe('Ennemis', () => {
  it('calcule les PV de Rattata et du boss de Route 1', () => {
    const zone = { ...route, niveaux: [5, 5] as [number, number],
      sauvages: [{ ...route.sauvages[0]!, pokemon: 19, apparition: 1 }] };
    expect(creerEnnemi(zone, 1, constant).pv).toBe(380);
    const boss = creerEnnemi(route, reglages.combat.etapeBoss, suite());
    expect(boss).toMatchObject({ numero: 19, niveau: 6, pv: 1824, boss: true, shiny: false, capture: route.boss.capture });
    expect(boss.pv).toBe(38 * 6 * 2 * 1 * reglages.combat.pvBoss);
  });
  it('calcule les PV du boss de la Forêt de Jade depuis la référence V1', () => {
    const foret = kanto.zone('kanto.foret-de-jade');
    const pvBase = (statsV1 as Record<string, { pv: number }>)[foret.boss.pokemon]!.pv;
    expect(foret.multiplicateurPv).toBe(1.5);
    expect(creerEnnemi(foret, 10, suite()).pv).toBe(Math.floor(pvBase * foret.boss.niveau * 2 * 1.5) * 4);
  });
  it('multiplie les PV du boss après l’arrondi, comme la V1', () => {
    const zone = { ...route, multiplicateurPv: 1.001 };
    expect(creerEnnemi(zone, 10, suite()).pv).toBe(Math.floor(38 * 6 * 2 * 1.001) * 4);
  });
  it('respecte les cumuls inclusifs et le repli sur le premier', () => {
    const zone = { ...route, sauvages: [
      { ...route.sauvages[0]!, pokemon: 19, apparition: 0.2 },
      { ...route.sauvages[0]!, pokemon: 16, apparition: 0.3 },
    ] };
    for (const [tirage, numero] of [[0, 19], [0.2, 19], [0.20001, 16], [0.5, 16], [0.9, 19]]) {
      expect(creerEnnemi(zone, 1, suite(0.5, tirage!, 0)).numero).toBe(numero);
    }
  });
  it('atteint les bornes des niveaux et respecte le seuil shiny strict', () => {
    const seuil = reglages.combat.chanceShiny;
    const min = creerEnnemi(route, 1, suite(seuil / 2, 0, 0));
    const max = creerEnnemi(route, 1, suite(seuil, 0, 0.999999));
    expect(min).toMatchObject({ niveau: route.niveaux[0], shiny: true });
    expect(max).toMatchObject({ niveau: route.niveaux[1], shiny: false });
  });
});

describe('Limiteur de clics', () => {
  it('accepte 12 clics sur 30 puis libère la fenêtre à exactement une seconde', () => {
    const horloge = creerHorlogeSimulee();
    const limiteur = creerLimiteurClics(horloge);
    expect(Array.from({ length: 30 }, () => limiteur.essayer()).filter(Boolean)).toHaveLength(12);
    horloge.avancer(999);
    expect(limiteur.essayer()).toBe(false);
    horloge.avancer(1);
    expect(limiteur.essayer()).toBe(true);
  });
  it('accepte sept clics espacés de 140 ms', () => {
    const horloge = creerHorlogeSimulee();
    const limiteur = creerLimiteurClics(horloge);
    for (let i = 0; i < 7; i++) {
      expect(limiteur.essayer()).toBe(true);
      horloge.avancer(140);
    }
  });
  it('fait glisser la fenêtre et ne compte pas les refus', () => {
    const horloge = creerHorlogeSimulee();
    const limiteur = creerLimiteurClics(horloge, { clicsMaxParSeconde: 2, fenetreClicsMs: 1000 });
    expect(limiteur.essayer()).toBe(true);
    horloge.avancer(500);
    expect(limiteur.essayer()).toBe(true);
    expect(limiteur.essayer()).toBe(false);
    horloge.avancer(500);
    expect(limiteur.essayer()).toBe(true);
    expect(limiteur.essayer()).toBe(false);
  });
});

describe('Résolution du combat', () => {
  it('inflige exactement dix secondes de DPS en cent pas sans clic via la boucle', () => {
    const initial = creerCombat(route, [{ numero: 19, niveau: 50 }], constant);
    const etat = { ...initial, ennemi: { ...initial.ennemi, numero: 19, pv: 10000, pvMax: 10000 } };
    const horloge = creerHorlogeSimulee();
    const boucle = creerBoucle({ etat, horloge, avancer: avancerCombat });
    for (let i = 0; i < 100; i++) { horloge.avancer(100); boucle.tick(); }
    expect(boucle.etat().ennemi.pv).toBe(10000 - 10 * 630);
    expect(etat.ennemi.pv).toBe(10000);
  });
  it('plafonne les dégâts à la mort et ne transfère pas le surplus', () => {
    const initial = creerCombat(route, equipe, constant);
    Object.freeze(initial.ennemi);
    Object.freeze(initial.evenements);
    Object.freeze(initial);
    const suivant = avancerCombat(initial, 1000000);
    expect(suivant.etape).toBe(2);
    expect(suivant.evenements).toEqual([{ type: 'ennemi-vaincu', numero: initial.ennemi.numero,
      niveau: initial.ennemi.niveau, shiny: initial.ennemi.shiny, boss: false }]);
    expect(suivant.ennemi.pv).toBe(suivant.ennemi.pvMax);
    expect(avancerCombat(suivant, 0).evenements).toHaveLength(1);
  });
  it('passe de l’étape neuf au boss puis revient à un', () => {
    const initial = creerCombat(route, equipe, constant);
    const neuf = { ...initial, etape: 9, ennemi: { ...initial.ennemi, pv: 1 } };
    const boss = cliquer(neuf, { essayer: () => true });
    expect(boss.etape).toBe(10);
    expect(boss.ennemi.boss).toBe(true);
    const apres = avancerCombat(boss, 1000000);
    expect(apres.etape).toBe(1);
    expect(apres.ennemi.boss).toBe(false);
    expect(apres.evenements.filter((e) => e.type === 'ennemi-vaincu')).toHaveLength(2);
    expect(apres.evenements.at(-1)).toEqual({ type: 'boss-vaincu', zoneId: route.id });
    expect(viderEvenements(apres).evenements).toEqual([]);
    expect(apres.evenements).toHaveLength(3);
  });
  it('limite les dégâts de trente clics à douze clics', () => {
    const initial = creerCombat(route, [], constant);
    const limiteur = creerLimiteurClics(creerHorlogeSimulee());
    let courant = initial;
    for (let i = 0; i < 30; i++) courant = cliquer(courant, limiteur);
    expect(courant.ennemi.pv).toBe(initial.ennemi.pv - 12 * 5);
    expect(cliquer(courant, limiteur)).toBe(courant);
  });
  it('résout un ennemi déjà à zéro sans le frapper à nouveau', () => {
    const initial = creerCombat(route, [], constant);
    const mort = { ...initial, ennemi: { ...initial.ennemi, pv: 0 } };
    const suivant = avancerCombat(mort, 100);
    expect(suivant.etape).toBe(2);
    expect(suivant.evenements).toHaveLength(1);
    expect(mort.ennemi.pv).toBe(0);
  });
  it('ne contient aucun accès direct à l’aléatoire, au temps ou aux minuteurs', () => {
    for (const fichier of ['combat.ts', 'clics.ts', 'ennemis.ts']) {
      const source = readFileSync(new URL(fichier, import.meta.url), 'utf8');
      expect(source).not.toMatch(/Math\s*\.\s*random|Date\s*\.\s*now|\bsetTimeout\b/);
    }
  });
});
