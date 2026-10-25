import { describe, expect, it } from 'vitest';
import { avancerCombat, basculerAutoAttaque, calculerClic, calculerDpsEquipe, cliquer,
  creerCombat, motifArret, reprendreCombat, viderEvenements } from './combat';
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
