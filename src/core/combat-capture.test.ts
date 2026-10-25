import { describe, expect, it } from 'vitest';
import { avancerCombat, basculerAutoAttaque, calculerClic, calculerDpsEquipe, cliquer,
  creerCombat, lancerCapture, motifArret, reprendreCombat, viderEvenements } from './combat';
import { kanto } from './regions';
import { reglages } from './reglages';
import type { ReglagesArret } from './sauvegarde-types';

const route = kanto.zoneDeCombat('kanto.route-1');
const equipe = [{ numero: 19, niveau: 5 }];
const alea = () => 0.5;
const arret: ReglagesArret = {
  actif: true, commun: false, peuCommun: false, rare: false, tresRare: false,
  legendaire: false, shiny: false, nouveau: false,
};
const ennemi = creerCombat(route, equipe, alea).ennemi;
const limiteur = { essayer: () => true };

describe('Auto-attaque et arrêt automatique', () => {
  it('conserve les valeurs par défaut et accepte les options de reprise', () => {
    expect(creerCombat(route, equipe, alea)).toMatchObject({
      autoAttaque: true, interrompu: false, arret: null, pokedex: [],
    });
    const pokedex = Object.freeze([ennemi.numero]);
    expect(reprendreCombat(route, equipe, alea, 2, [], { autoAttaque: false, arret, pokedex }))
      .toMatchObject({ etape: 2, autoAttaque: false, interrompu: false, arret, pokedex });
  });

  it.each([
    ['commun', 'commun'], ['peu-commun', 'peuCommun'], ['rare', 'rare'],
    ['tres-rare', 'tresRare'], ['legendaire', 'legendaire'],
  ] as const)(
    'arrête sur la rareté %s activée', (rarete, cle) => {
      const cible = { ...ennemi, rarete, shiny: false };
      expect(motifArret(cible, false, { ...arret, [cle]: true }, true)).toBe(rarete);
      expect(motifArret(cible, false, arret, true)).toBeNull();
    });

  it('respecte les conditions et la priorité shiny, nouveau, rareté', () => {
    const cible = { ...ennemi, rarete: 'rare' as const, shiny: true };
    const options = { ...arret, rare: true, nouveau: true };
    expect(motifArret(cible, true, options, true)).toBe('shiny');
    expect(motifArret({ ...cible, shiny: false }, true, options, true)).toBe('nouveau');
    expect(motifArret({ ...cible, shiny: false }, true, { ...options, nouveau: false }, true)).toBe('rare');
    expect(motifArret(cible, false, { ...arret, shiny: true }, true)).toBe('shiny');
    expect(motifArret(cible, true, arret, true)).toBeNull();
    expect(motifArret(cible, true, null, true)).toBeNull();
    expect(motifArret(cible, true, { ...options, actif: false }, true)).toBeNull();
    expect(motifArret(cible, true, options, false)).toBeNull();
    expect(motifArret({ ...cible, boss: true }, true, options, true)).toBeNull();
  });

  it('coupe le DPS sans changer les dégâts du clic ni les entrées', () => {
    const etat = Object.freeze(creerCombat(route, equipe, alea, [], { autoAttaque: false }));
    Object.freeze(etat.ennemi);
    expect(avancerCombat(etat, 100).ennemi.pv).toBe(etat.ennemi.pv);
    const clic = calculerClic(calculerDpsEquipe(equipe, etat.ennemi));
    expect(cliquer(etat, limiteur).ennemi.pv).toBe(etat.ennemi.pv - clic);
    const actif = basculerAutoAttaque(etat, true);
    expect(actif.autoAttaque).toBe(true);
    expect(avancerCombat(actif, 1).ennemi.pv).toBeLessThan(etat.ennemi.pv);
    expect(etat.autoAttaque).toBe(false);
  });

  it('arrête dès la création sur un nouveau et consulte le pokédex', () => {
    const options = Object.freeze({ arret: Object.freeze({ ...arret, nouveau: true }) });
    const etat = creerCombat(route, equipe, alea, [], options);
    expect(etat).toMatchObject({ autoAttaque: false, interrompu: true,
      evenements: [{ type: 'arret-auto', motif: 'nouveau' }] });
    expect(creerCombat(route, equipe, alea, [], { ...options, pokedex: [ennemi.numero] }))
      .toMatchObject({ autoAttaque: true, interrompu: false, evenements: [] });
    expect(creerCombat(route, equipe, alea, [], { ...options, autoAttaque: false }))
      .toMatchObject({ autoAttaque: false, interrompu: false, evenements: [] });
  });

  it('reprend à la victoire, attend l’apparition puis arrête une seule fois', () => {
    const initial = creerCombat(route, equipe, alea, [], { arret: { ...arret, nouveau: true } });
    const etat = Object.freeze({ ...viderEvenements(initial), ennemi: Object.freeze({ ...initial.ennemi, pv: 1 }) });
    const victoire = cliquer(etat, limiteur);
    expect(victoire).toMatchObject({ autoAttaque: true, interrompu: false });
    expect(victoire.evenements.map((e) => e.type)).toEqual(['ennemi-vaincu', 'reprise-auto']);
    expect(victoire.attenteMs).toBeGreaterThan(0);
    const attente = avancerCombat(viderEvenements(victoire), victoire.attenteMs - 1);
    expect(attente).toMatchObject({ attenteMs: 1, autoAttaque: true, evenements: [] });
    const apparition = avancerCombat(attente, 1);
    expect(apparition).toMatchObject({ attenteMs: 0, autoAttaque: false, interrompu: true,
      evenements: [{ type: 'arret-auto', motif: 'nouveau' }] });
    expect(avancerCombat(apparition, 100)).toEqual(apparition);
    expect(etat).toMatchObject({ autoAttaque: false, interrompu: true, evenements: [], ennemi: { pv: 1 } });
  });

  it('ne consomme aucun DPS après un arrêt au milieu du pas', () => {
    const initial = creerCombat(route, equipe, alea, [], { arret: { ...arret, nouveau: true } });
    const victoire = cliquer({ ...initial, ennemi: { ...initial.ennemi, pv: 1 } }, limiteur);
    const suivant = avancerCombat(viderEvenements(victoire), victoire.attenteMs + 100);
    expect(suivant.autoAttaque).toBe(false);
    expect(suivant.ennemi.pv).toBe(suivant.ennemi.pvMax);
  });

  it('conserve l’interruption lors des bascules manuelles et reprend à la victoire', () => {
    const initial = creerCombat(route, equipe, alea, [], { arret: { ...arret, nouveau: true } });
    const actif = basculerAutoAttaque(initial, true);
    const inactif = basculerAutoAttaque(actif, false);
    expect(actif.interrompu).toBe(true);
    expect(inactif.interrompu).toBe(true);
    const victoire = cliquer({ ...viderEvenements(inactif), ennemi: { ...inactif.ennemi, pv: 1 } }, limiteur);
    expect(victoire.evenements.map((e) => e.type)).toEqual(['ennemi-vaincu', 'reprise-auto']);
    const manuel = creerCombat(route, equipe, alea, [], { autoAttaque: false });
    const sansReprise = cliquer({ ...manuel, ennemi: { ...manuel.ennemi, pv: 1 } }, limiteur);
    expect(sansReprise.autoAttaque).toBe(false);
    expect(sansReprise.evenements.map((e) => e.type)).toEqual(['ennemi-vaincu']);
  });

  it('ne stoppe jamais un boss et laisse son minuteur expirer sans auto-attaque', () => {
    const options = { arret: { ...arret, nouveau: true, shiny: true } };
    const boss = reprendreCombat(route, equipe, alea, reglages.combat.etapeBoss, [], options);
    expect(boss).toMatchObject({ autoAttaque: true, interrompu: false, evenements: [] });
    const inactif = basculerAutoAttaque(boss, false);
    const avant = avancerCombat(inactif, inactif.minuteurMs! - 1);
    expect(avant.ennemi.pv).toBe(boss.ennemi.pv);
    expect(avant.minuteurMs).toBe(1);
    const apres = avancerCombat(avant, 1);
    expect(apres.ennemi.boss).toBe(false);
    expect(apres.autoAttaque).toBe(false);
    expect(apres.evenements).toEqual([{ type: 'boss-echoue', zoneId: route.id }]);
  });
});

describe('Capture dans le combat', () => {
  it('initialise la capture et refuse les lancers indisponibles sans modifier les entrées', () => {
    const etat = Object.freeze(creerCombat(route, [], alea));
    Object.freeze(etat.ennemi);
    expect(etat).toMatchObject({ capture: null, attenteCapture: false });
    const lancer = lancerCapture(etat, 0.7);
    expect(lancer.capture).toEqual({ chance: 0.7, restantMs: reglages.capture.animationMs });
    expect(etat.capture).toBeNull();
    expect(lancerCapture(lancer, 1)).toBe(lancer);
    const attente = { ...etat, attenteMs: 1 };
    expect(lancerCapture(attente, 1)).toBe(attente);
    const impossible = { ...etat, ennemi: { ...etat.ennemi, capture: 0 } };
    expect(lancerCapture(impossible, 1)).toBe(impossible);
  });

  it('réussit à 1000 ms exactement, reprend et attend la réapparition', () => {
    const initial = creerCombat(route, [], alea, [], { arret: { ...arret, nouveau: true } });
    const etat = lancerCapture(viderEvenements(initial), 1);
    Object.freeze(etat.capture);
    const avant = avancerCombat(etat, 999);
    expect(avant.capture).toEqual({ chance: 1, restantMs: 1 });
    expect(avant.evenements).toEqual([]);
    const apres = avancerCombat(avant, 1);
    const { numero, niveau, shiny, boss, rarete } = initial.ennemi;
    expect(apres.evenements).toEqual([
      { type: 'capture-reussie', numero, niveau, shiny, boss, rarete }, { type: 'reprise-auto' },
    ]);
    expect(apres).toMatchObject({ capture: null, attenteCapture: true, etape: 2,
      attenteMs: reglages.capture.reapparitionMs, autoAttaque: true, interrompu: false });
    expect(etat.capture?.restantMs).toBe(1000);
    expect(lancerCapture(apres, 1)).toBe(apres);
    const attente = avancerCombat(viderEvenements(apres), apres.attenteMs - 1);
    expect(attente.attenteCapture).toBe(true);
    const apparition = avancerCombat(attente, 1);
    expect(apparition).toMatchObject({ attenteCapture: false, attenteMs: 0, autoAttaque: false });
    expect(apparition.evenements).toEqual([{ type: 'arret-auto', motif: 'nouveau' }]);
  });

  it('échoue au seuil strict et autorise un nouveau lancer', () => {
    const etat = lancerCapture(creerCombat(route, [], alea, [], { autoAttaque: false }), 0.5);
    const apres = avancerCombat(etat, 1000);
    expect(apres).toMatchObject({ capture: null, attenteCapture: false, etape: etat.etape,
      autoAttaque: false, attenteMs: 0, ennemi: etat.ennemi, evenements: [{ type: 'capture-echouee' }] });
    expect(lancerCapture(apres, 1).capture).not.toBeNull();
  });

  it('consomme le reste du pas dans l’attente après une réussite', () => {
    const etat = lancerCapture(creerCombat(route, [], alea), 2);
    const apres = avancerCombat(etat, 1500);
    expect(apres).toMatchObject({ capture: null, attenteCapture: true, etape: 2,
      attenteMs: reglages.capture.reapparitionMs - 500 });
    expect(apres.evenements.map((e) => e.type)).toEqual(['capture-reussie']);
    expect(apres.ennemi.pv).toBe(apres.ennemi.pvMax);
  });

  it('garde le DPS et les clics pendant l’animation et traite le temps après un échec', () => {
    const initial = creerCombat(route, equipe, alea);
    const etat = lancerCapture({ ...initial, ennemi: { ...initial.ennemi, pv: 100000 } }, 0);
    const dps = calculerDpsEquipe(equipe, etat.ennemi);
    const avant = avancerCombat(etat, 999);
    expect(avant.ennemi.pv).toBeCloseTo(etat.ennemi.pv - dps * 0.999);
    expect(cliquer(avant, limiteur).ennemi.pv).toBeCloseTo(avant.ennemi.pv - calculerClic(dps));
    const apres = avancerCombat(etat, 1500);
    expect(apres.ennemi.pv).toBeCloseTo(etat.ennemi.pv - dps * 1.5);
    expect(apres.evenements).toEqual([{ type: 'capture-echouee' }]);
  });

  it.each(['dps', 'clic', 'échéance'] as const)('annule sans tirage ni événement de capture à la mort (%s)', (cause) => {
    let tirages = 0;
    const initial = creerCombat(route, equipe, () => { tirages++; return 0.5; });
    const sansCapture = { ...initial, ennemi: { ...initial.ennemi, pv: 1 } };
    const etat = lancerCapture(sansCapture, 1);
    const avancer = cause === 'clic'
      ? (e: typeof etat) => cliquer(e, limiteur)
      : (e: typeof etat) => avancerCombat(e, cause === 'échéance' ? 1000 : 999);
    tirages = 0;
    const reference = avancer(sansCapture);
    const tiragesReference = tirages;
    tirages = 0;
    const apres = avancer(etat);
    expect(tirages).toBe(tiragesReference);
    expect(apres).toEqual(reference);
    expect(apres).toMatchObject({ capture: null, attenteCapture: false });
    expect(apres.evenements.map((e) => e.type)).toEqual(['ennemi-vaincu']);
  });
});
