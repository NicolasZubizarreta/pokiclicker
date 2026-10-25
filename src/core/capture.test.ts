import { describe, expect, it, vi } from 'vitest';
import { appliquerCapture, chanceCapture, retirerBalle, verifierLancer } from './capture';
import { reglages } from './reglages';
import { calculerOr, type Victoire } from './recompenses';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';

const ennemi = { capture: 120, pv: 50, pvMax: 100, niveau: 30 };
const prise: Victoire = { numero: 19, niveau: 30, shiny: false, boss: false, rarete: 'commun' };
const membre: PokemonPossede = {
  uid: 'ancien', numero: 1, niveau: 5, xp: 12, shiny: false, bonheur: 7,
  calcium: 1, pierreEternelle: true, favori: true, sexe: 'male',
};
function region(taille = 5): DonneesRegion {
  return {
    ...structuredClone(reglages.depart.region), regionId: 'kanto', zoneId: 'kanto.route-1',
    etape: 3, equipe: Array.from({ length: taille }, (_, i) => ({ ...membre, uid: `ancien-${i}` })),
    badges: [], bossVaincus: [], objetsCles: [], quetes: [], drapeaux: [], evenementsJoues: [],
    argent: 100, inventaire: { pokeball: 2, bonbon: 3 }, ligueGagnee: 0,
  };
}

describe('chance de capture', () => {
  it.each([['pokeball', 1], ['superball', 2], ['hyperball', 4]] as const)('%s conserve l’ordre de la formule V1', (cle, x) => {
    const attendue = ((120 / 255) * ((3 * 100 - 2 * 50) / (3 * 100)) * x) / (1 + 30 / 25);
    expect(chanceCapture(ennemi, cle, [])).toBe(attendue);
    expect(chanceCapture(ennemi, cle, ['badge:marais'])).toBe(attendue * 1.3);
  });
  it('Master est certaine sauf capture impossible ; les chances brutes ne sont pas bornées', () => {
    expect(chanceCapture(ennemi, 'masterball', ['badge:marais'])).toBe(1);
    expect(chanceCapture({ ...ennemi, capture: 0 }, 'masterball', [])).toBe(0);
    expect(chanceCapture({ ...ennemi, pv: 0 }, 'masterball', [])).toBe(0);
    expect(chanceCapture({ capture: 255, pv: 1, pvMax: 100, niveau: 2 }, 'hyperball', [])).toBeGreaterThan(1);
    expect(chanceCapture(ennemi, 'inconnue', [])).toBe(0);
  });
});

describe('lancer et stock', () => {
  const etat = { ennemi, attenteMs: 0, captureEnCours: false };
  it('autorise seulement un ennemi vivant et disponible avec une balle possédée', () => {
    expect(verifierLancer(etat, { pokeball: 1 }, 'pokeball')).toEqual({ ok: true });
    expect(verifierLancer({ ...etat, ennemi: null }, {}, 'pokeball')).toEqual({ ok: false, raison: 'Aucun Pokémon à capturer.' });
    expect(verifierLancer({ ...etat, attenteMs: 1 }, {}, 'pokeball')).toEqual({ ok: false, raison: 'Aucun Pokémon à capturer.' });
    expect(verifierLancer({ ...etat, ennemi: { ...ennemi, pv: 0 } }, {}, 'pokeball').ok).toBe(false);
    expect(verifierLancer({ ...etat, ennemi: { ...ennemi, capture: 0 } }, { masterball: 1 }, 'masterball')).toEqual({ ok: false, raison: reglages.capture.raisonImpossible });
    expect(verifierLancer({ ...etat, captureEnCours: true }, { pokeball: 1 }, 'pokeball')).toEqual({ ok: false, raison: 'Une capture est déjà en cours.' });
    expect(verifierLancer(etat, { superball: 1 }, 'pokeball')).toEqual({ ok: false, raison: "Tu n'as plus de Pokéball." });
    expect(verifierLancer(etat, {}, 'pokeball')).toEqual({ ok: false, raison: "Tu n'as aucune balle." });
    expect(verifierLancer(etat, { inconnue: 1 }, 'inconnue').ok).toBe(false);
  });
  it('retire une seule balle sans modifier le stock ni passer sous zéro', () => {
    const stock = Object.freeze({ pokeball: 2, superball: 0, bonbon: 3 });
    expect(retirerBalle(stock, 'pokeball')).toEqual({ pokeball: 1, superball: 0, bonbon: 3 });
    expect(retirerBalle(stock, 'superball')).toEqual(stock);
    expect(retirerBalle(stock, 'absente')).toEqual(stock);
    expect(retirerBalle(stock, 'bonbon')).toEqual(stock);
    expect(stock.pokeball).toBe(2);
  });
});

describe('capture réussie', () => {
  it.each([5, 6])('place la prise avec %i membres sans toucher aux entrées ni aux statistiques', (taille) => {
    const avant = region(taille);
    const copie = structuredClone(avant);
    const copiePrise = { ...prise };
    const alea = vi.fn(() => 0.9);
    const genererId = vi.fn(() => 'capture-1');
    const resultat = appliquerCapture(avant, prise, [], alea, genererId);
    const destination = taille === 5 ? 'equipe' : 'pc';
    expect(resultat.destination).toBe(destination);
    expect(resultat.region[destination].at(-1)).toEqual({
      uid: 'capture-1', numero: 19, niveau: 30, shiny: false, sexe: 'femelle',
      xp: 0, bonheur: 0, calcium: 0, pierreEternelle: false, favori: false,
    });
    expect(resultat.region.equipe).toHaveLength(6);
    expect(resultat.region.equipe.slice(0, taille)).toEqual(avant.equipe);
    expect(resultat.region.argent).toBe(100 + calculerOr(prise) * 2);
    expect(resultat.region.statistiques).toEqual(avant.statistiques);
    expect(resultat.region.inventaire).toEqual(avant.inventaire);
    expect(resultat.bonbons).toBe(0);
    expect(avant).toEqual(copie);
    expect(prise).toEqual(copiePrise);
    expect(alea).toHaveBeenCalledTimes(1);
    expect(genererId).toHaveBeenCalledTimes(1);
  });
  it('applique les bonus d’or, le facteur chromatique et les cinq bonbons sans XP', () => {
    const avant = region();
    const copie = structuredClone(avant);
    const shiny = { ...prise, shiny: true };
    const actifs = ['badge:prisme', 'objet:amuletCoin'];
    const resultat = appliquerCapture(avant, shiny, actifs, () => 0, () => 'shiny');
    expect(resultat.region.argent).toBe(100 + calculerOr(prise, actifs) * 2 * 5);
    expect(resultat.bonbons).toBe(5);
    expect(resultat.region.inventaire.bonbon).toBe(8);
    expect(resultat.region.equipe.slice(0, 5)).toEqual(avant.equipe);
    expect(resultat.region.statistiques).toEqual(avant.statistiques);
    expect(avant).toEqual(copie);
  });
  it.each([[81, 'sansSexe'], [32, 'male'], [29, 'femelle']] as const)('respecte le sexe fixe de %i sans consommer d’aléa', (numero, sexe) => {
    const alea = vi.fn(() => 0.5);
    const resultat = appliquerCapture(region(), { ...prise, numero }, [], alea, () => 'fixe');
    expect(resultat.region.equipe.at(-1)?.sexe).toBe(sexe);
    expect(alea).not.toHaveBeenCalled();
  });
});
