import { describe, expect, it, vi } from 'vitest';
import { appliquerCapture, chanceCapture, pitieCapture, retirerBalle, verifierLancer } from './capture';
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
    const attendue = ((120 / 255) * ((3 * 100 - 2 * 50) / (3 * 100)) * x) / (1 + 30 / 100);
    expect(chanceCapture(ennemi, cle, [])).toBe(attendue);
    expect(chanceCapture(ennemi, cle, ['badge:marais'])).toBe(attendue * 1.3);
  });
  it('la pitié multiplie la chance par 1 + pitié × échecs, selon la catégorie de taux et la balle', () => {
    for (const [taux, cle, pitie] of [[255, 'pokeball', .085], [120, 'pokeball', .09], [45, 'superball', .16],
      [25, 'hyperball', .42], [3, 'hyperball', .31], [3, 'masterball', 0]] as const) {
      const sauvage = { capture: taux, pv: 50, pvMax: 100, niveau: 20 };
      const base = chanceCapture(sauvage, cle, []);
      expect(pitieCapture(taux, cle)).toBe(pitie);
      expect(chanceCapture({ ...sauvage, echecs: 0 }, cle, [])).toBe(base);
      if (cle !== 'masterball') expect(chanceCapture({ ...sauvage, echecs: 3 }, cle, [])).toBeCloseTo(base * (1 + 3 * pitie), 12);
    }
    expect(chanceCapture({ capture: 3, pv: 50, pvMax: 100, niveau: 20, echecs: 9 }, 'masterball', [])).toBe(1);
  });
  it('limites des catégories de taux de capture', () => {
    expect([150, 149, 100, 99, 40, 39, 10, 9, 3].map((taux) => pitieCapture(taux, 'pokeball')))
      .toEqual([.085, .09, .09, .18, .18, .23, .23, .15, .15]);
  });
  it('nombre de balles suffisant dans 90 % des cas : cibles de Nicolas (10/11)', () => {
    // Balles nécessaires pour capturer avec 90 % de chance, la pitié montant à chaque échec.
    const p90 = (capture: number, niveau: number, pv: number, cle: string) => {
      let echec = 1;
      for (let n = 1; n <= 500; n += 1) {
        echec *= 1 - Math.min(1, chanceCapture({ capture, pv, pvMax: 1000, niveau, echecs: n - 1 }, cle, []));
        if (1 - echec >= .9) return n;
      }
      return 500;
    };
    const pvs = [1000, 500, 50, 1];
    const cibles: [number, number, string, number[]][] = [
      [255, 5, 'pokeball', [5, 3, 1, 1]], [255, 40, 'pokeball', [7, 4, 2, 2]], [190, 10, 'pokeball', [7, 4, 2, 2]],
      [190, 35, 'pokeball', [9, 5, 3, 3]], [120, 20, 'pokeball', [11, 6, 5, 4]], [120, 50, 'pokeball', [15, 10, 8, 7]],
      [45, 15, 'pokeball', [19, 10, 7, 7]], [45, 50, 'pokeball', [24, 14, 10, 10]], [25, 35, 'pokeball', [30, 17, 12, 12]],
      [25, 45, 'pokeball', [31, 19, 13, 13]], [3, 50, 'pokeball', [110, 72, 56, 54]], [3, 65, 'pokeball', [117, 75, 60, 58]],
      [255, 5, 'hyperball', [1, 1, 1, 1]], [255, 40, 'hyperball', [1, 1, 1, 1]], [190, 10, 'hyperball', [1, 1, 1, 1]],
      [190, 35, 'hyperball', [2, 1, 1, 1]], [120, 20, 'hyperball', [5, 3, 3, 2]], [120, 50, 'hyperball', [6, 4, 3, 3]],
      [45, 15, 'hyperball', [7, 3, 2, 2]], [45, 50, 'hyperball', [10, 5, 4, 4]], [25, 35, 'hyperball', [10, 6, 4, 4]],
      [25, 45, 'hyperball', [13, 7, 4, 4]], [3, 50, 'hyperball', [44, 25, 17, 17]], [3, 65, 'hyperball', [47, 27, 19, 18]],
    ];
    let proches = 0;
    const ecarts: string[] = [];
    cibles.forEach(([capture, niveau, cle, attendu], ligne) => attendu.forEach((cible, colonne) => {
      const obtenu = p90(capture, niveau, pvs[colonne]!, cle);
      if (Math.abs(obtenu - cible) <= Math.max(1, cible * .15)) proches += 1;
      else ecarts.push(`ligne ${ligne + 1} colonne ${colonne + 1} : ${obtenu} au lieu de ${cible}`);
    }));
    // Écarts connus et acceptés par Nicolas : lignes 6, 7 (colonne 3 : 9 au lieu de 7), 9, 10, 17, 18, 22, 23, 24.
    expect(ecarts.filter((texte) => !/^ligne (6|7|9|10|17|18|22|23|24) /.test(texte))).toEqual([]);
    expect(proches).toBeGreaterThanOrEqual(80);
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

describe('argent de la capture (ticket AB)', () => {
  it('applique la règle V1 de la capture (×2) puis le multiplicateur global une seule fois', () => {
    const sansMultiplicateur = { ...reglages.recompenses, or: { ...reglages.recompenses.or, multiplicateur: 1 } };
    const base = calculerOr(prise, [], sansMultiplicateur);
    const resultat = appliquerCapture(region(), prise, [], () => 0.9, () => 'capture-1');
    expect(resultat.region.argent - 100).toBe(base * 2 * reglages.recompenses.or.multiplicateur);
    expect(reglages.recompenses.or.capture).toBe(2);
  });
});
