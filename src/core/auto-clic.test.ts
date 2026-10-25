import { describe, expect, it } from 'vitest';
import { clicsAutomatiques, creerLimiteurClics } from './clics';
import { avancerCombat, basculerAutoClic, cliquer, creerCombat, reprendreCombat } from './combat';

describe('auto-clic des Restes', () => {
  it('produit neuf clics en une seconde et conserve le reliquat', () => {
    expect(clicsAutomatiques(0, 1000, 111)).toEqual({ clics: 9, resteMs: 1 });
    expect(clicsAutomatiques(100, 10, 111)).toEqual({ clics: 0, resteMs: 110 });
    expect(clicsAutomatiques(110, 1, 111)).toEqual({ clics: 1, resteMs: 0 });
  });

  it('partage le plafond de douze clics avec les clics manuels', () => {
    let maintenant = 0;
    const limiteur = creerLimiteurClics({ maintenant: () => maintenant });
    const { clics } = clicsAutomatiques(0, 1000, 111);
    for (let i = 0; i < clics; i++) {
      maintenant += 111;
      expect(limiteur.essayer()).toBe(true);
    }
    maintenant = 1000;
    expect([limiteur.essayer(), limiteur.essayer(), limiteur.essayer()]).toEqual([true, true, true]);
    expect(limiteur.essayer()).toBe(false);
  });

  const zone: Parameters<typeof creerCombat>[0] = {
    id: 'test', etapes: 10, sauvages: [{ pokemon: 1, rarete: 'commun', apparition: 100, capture: 50 }],
    nom: 'Test', decor: 'test', niveaux: [1, 1], multiplicateurPv: 1,
    boss: { pokemon: 1, niveau: 1, nom: 'Test', capture: 50 }, liens: [], ancienId: 0,
  };

  it('bascule sans modifier son entrée et reste éteint par défaut', () => {
    const etat = creerCombat(zone, [], () => 0.5);
    expect(etat.autoClic).toBe(false);
    expect(basculerAutoClic(etat, true).autoClic).toBe(true);
    expect(etat.autoClic).toBe(false);
  });

  it('arrête les deux automatismes sur un rare puis restaure leurs réglages à la victoire', () => {
    const initial = reprendreCombat(zone, [], () => 0.5, 1, [], {
      autoAttaque: false, autoClic: true,
      arret: { actif: true, rare: true, commun: false, peuCommun: false, tresRare: false, legendaire: false, shiny: false, nouveau: false },
    });
    const attente = { ...initial, attenteMs: 1, ennemi: { ...initial.ennemi, rarete: 'rare' as const, pv: 1 } };
    const arrete = avancerCombat(attente, 1);
    expect(arrete).toMatchObject({
      autoAttaque: false, autoClic: false, interrompu: true,
      avantArret: { autoAttaque: false, autoClic: true },
    });
    expect(arrete.evenements).toContainEqual({ type: 'arret-auto', motif: 'rare' });
    expect(attente.autoClic).toBe(true);
    const victoire = cliquer(arrete, { essayer: () => true });
    expect(victoire).toMatchObject({ autoAttaque: false, autoClic: true, interrompu: false, avantArret: null });
    expect(victoire.evenements).toContainEqual({ type: 'reprise-auto' });
  });
});
