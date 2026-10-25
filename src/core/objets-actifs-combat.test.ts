import { afterEach, describe, expect, it, vi } from 'vitest';
import { avancerCombat, calculerClic, cliquer, creerCombat, faucher, invoquerBoss, lancerCapture } from './combat';
import { creerEnnemi } from './ennemis';
import type { Zone } from './monde';
import { reglages } from './reglages';

const zone = {
  id: 'test', nom: 'Test', decor: 'test', liens: [], ancienId: 0,
  etapes: 10, niveaux: [1, 1], multiplicateurPv: 1,
  sauvages: [
    { pokemon: 19, apparition: 0.7, rarete: 'commun', capture: 1 },
    { pokemon: 16, apparition: 0.2, rarete: 'peu-commun', capture: 1 },
    { pokemon: 25, apparition: 0.1, rarete: 'rare', capture: 1 },
  ],
  boss: { pokemon: 20, niveau: 5, capture: 1 },
} as unknown as Zone;
const alea = () => 0.99;
const creer = (actifs: readonly string[] = []) => creerCombat(zone, [], alea, actifs);

afterEach(() => vi.restoreAllMocks());

describe('objets actifs dans le combat', () => {
  it('filtre les communs et donne priorité à la Superepousse', () => {
    for (let r = 0; r <= 100; r++) {
      const tirer = (actifs: string[]) => {
        let appel = 0;
        return creerEnnemi(zone, 1, () => ++appel === 2 ? r / 100 : 0.99,
          reglages.combat, actifs);
      };
      expect(tirer(['repousse:commun']).rarete).not.toBe('commun');
      expect(tirer(['repousse:commun', 'repousse:peu-commun']).rarete).toBe('rare');
    }
  });

  it('garde la liste entière quand toutes les raretés sont exclues', () => {
    const communs = { ...zone, sauvages: zone.sauvages.map(s => ({ ...s, rarete: 'commun' as const })) };
    for (const cle of ['repousse:commun', 'repousse:peu-commun']) {
      expect(creerEnnemi(communs, 1, alea, reglages.combat, [cle]))
        .toEqual(creerEnnemi(communs, 1, alea));
    }
  });

  it('applique la Repousse à la création et après une victoire', () => {
    const initial = creer(['repousse:peu-commun']);
    expect(initial.ennemi.rarete).toBe('rare');
    const suivant = cliquer({ ...initial, ennemi: { ...initial.ennemi, pv: 1 } }, { essayer: () => true });
    expect(suivant.etape).toBe(2);
    expect(suivant.ennemi.rarete).toBe('rare');
  });

  it('garde un ennemi à 1 PV après un clic qui l’aurait tué et permet sa capture', () => {
    const clic = calculerClic(0);
    const initial = creer();
    expect(cliquer({ ...initial, ennemi: { ...initial.ennemi, pv: clic + 50 } },
      { essayer: () => true }).ennemi.pv).toBe(50);
    const etat = { ...initial, ennemi: { ...initial.ennemi, pv: clic } };
    const marque = faucher(etat);
    const frappe = cliquer(marque, { essayer: () => true });
    expect(frappe.ennemi.pv).toBe(1);
    expect(cliquer(frappe, { essayer: () => true }).ennemi.pv).toBe(1);
    expect(frappe.evenements).toEqual([]);
    expect(etat.ennemi.pv).toBe(clic);
    expect(etat.ennemi.fauche).toBeUndefined();
    const capture = avancerCombat(lancerCapture(frappe, 1), reglages.capture.animationMs);
    expect(capture.evenements.some(e => e.type === 'capture-reussie')).toBe(true);
    expect(capture.ennemi.fauche).toBeUndefined();
  });

  it('refuse le fauchage sur un boss ou pendant l’attente', () => {
    const boss = invoquerBoss(creer());
    expect(faucher(boss)).toBe(boss);
    const attente = { ...creer(), attenteMs: 100 };
    expect(faucher(attente)).toBe(attente);
  });

  it('invoque le boss avec 30 s, conserve la pause DPS et efface capture et attente', () => {
    const initial = { ...creer(), pauseDpsMs: 123, attenteMs: 100,
      attenteCapture: true, capture: { chance: 1, restantMs: 100 } };
    const boss = invoquerBoss(initial);
    expect(boss.etape).toBe(reglages.combat.etapeBoss);
    expect(boss.ennemi.boss).toBe(true);
    expect(boss.minuteurMs).toBe(30000);
    expect(boss.pauseDpsMs).toBe(123);
    expect(boss.attenteMs).toBe(0);
    expect(boss.attenteCapture).toBe(false);
    expect(boss.capture).toBeNull();
    expect(initial.attenteMs).toBe(100);
  });
});
