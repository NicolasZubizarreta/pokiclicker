import { describe, expect, it } from 'vitest';
import donnees from '../../data/pantheon.json';
import fixture from '../../tests/fixtures/v1-pantheon.json';
import { calendrierPantheon, chargerPantheon, issueDuPantheon, tirerConfetti, tirerFeu } from './pantheon';

describe('calendrier du Panthéon', () => {
  for (const entree of fixture.entrees) {
    for (const equipe of fixture.equipes) {
      it(`${equipe.nombre} partenaires, première victoire : ${entree.premiere}`, () => {
        const calendrier = calendrierPantheon(equipe.nombre, entree.premiere, false);
        const debut = entree.minuteurs.reduce((somme, ms) => somme + ms, 0)
          + (entree.premiere ? fixture.sortieDialogueMs.reduce((somme, ms) => somme + ms, 0) : 0);
        expect(calendrier.map(e => e.tMs)).toEqual(calendrier.map(e => e.tMs).sort((a, b) => a - b));
        expect(calendrier.filter(e => e.action.type === 'dialogues').flatMap(e =>
          e.action.type === 'dialogues' ? e.action.lignes : [])).toEqual(entree.dialogues);
        expect(calendrier.filter(e => e.action.type === 'fondu-noir' || e.action.type === 'fondu-retour')
          .map(e => e.tMs)).toEqual([0, entree.minuteurs[0]]);
        expect(calendrier.filter(e => e.action.type === 'chute').map(e => {
          if (e.action.type !== 'chute') throw new Error('Chute attendue');
          return { tMs: e.tMs - debut, x: e.action.x * 1024, y: e.action.y * 1024,
            taille: e.action.taille * 1024, depart: e.action.depart * 1024, index: e.action.index };
        })).toEqual(equipe.chutes.map((chute, index) => ({ tMs: chute.tMs,
          x: chute.attributs.x, y: chute.attributs.y, taille: chute.attributs.width, depart: -300, index })));
        expect(calendrier.filter(e => e.action.type === 'niveau').map(e => {
          if (e.action.type !== 'niveau') throw new Error('Niveau attendu');
          return { tMs: e.tMs - debut, x: e.action.x * 1024, y: e.action.y * 1024 };
        })).toEqual(equipe.niveaux.map(n => ({ tMs: n.tMs, x: n.attributs.x, y: n.attributs.y })));
        expect(calendrier.filter(e => ['titre', 'confettis', 'feux', 'fin'].includes(e.action.type))
          .map(e => e.tMs - debut)).toEqual(Array(4).fill(equipe.finalMs));
        if (entree.premiere) {
          expect(calendrier.find(e => e.action.type === 'entree-chen')?.tMs).toBe(2000);
          expect(calendrier.find(e => e.action.type === 'dialogues')?.tMs).toBe(3600);
          expect(calendrier.find(e => e.action.type === 'masquer-chen')?.tMs).toBe(4600);
        }
      });
    }
  }

  it('ignore le septième partenaire et les socles vides', () => {
    expect(calendrierPantheon(7, false, false)).toEqual(calendrierPantheon(6, false, false));
    expect(calendrierPantheon(0, false, false).some(e => ['chute', 'niveau', 'poser'].includes(e.action.type))).toBe(false);
    for (const n of [-1, 1.5, NaN, Infinity]) {
      expect(() => calendrierPantheon(n, false, false)).toThrow(/Nombre de Pokémon invalide/);
    }
  });

  it.each([true, false])('mouvement réduit, première victoire : %s', premiere => {
    const calendrier = calendrierPantheon(3, premiere, true);
    expect(calendrier.some(e => ['chute', 'confettis', 'feux'].includes(e.action.type))).toBe(false);
    const poses = calendrier.filter(e => e.action.type === 'poser');
    const niveaux = calendrier.filter(e => e.action.type === 'niveau');
    expect(poses).toHaveLength(3);
    expect(niveaux).toHaveLength(3);
    expect(new Set([...poses, ...niveaux].map(e => e.tMs)).size).toBe(1);
    expect(calendrier.find(e => e.action.type === 'titre')?.action).toEqual({ type: 'titre', anime: false });
    if (premiere) expect(calendrier.find(e => e.action.type === 'dialogues')?.action)
      .toEqual({ type: 'dialogues', lignes: donnees.dialogues, instantane: true });
  });
});

describe('données du Panthéon', () => {
  it('valide sans modifier ni partager les données', () => {
    const original = structuredClone(donnees);
    const resultat = chargerPantheon(donnees);
    expect(resultat).toEqual(original);
    resultat.socles[0]!.x = 0;
    resultat.dialogues[0] = 'modifié';
    expect(donnees).toEqual(original);
  });

  it.each([
    null, {}, { ...donnees, version: 2 }, { ...donnees, socles: [] },
    { ...donnees, socles: [null, ...donnees.socles.slice(1)] },
    { ...donnees, socles: [{ x: NaN, y: 0 }, ...donnees.socles.slice(1)] },
    { ...donnees, geometrie: null }, { ...donnees, geometrie: { ...donnees.geometrie, departChute: 1 } },
    { ...donnees, geometrie: { ...donnees.geometrie, departChute: '-0.3' } },
    { ...donnees, delais: { ...donnees.delais, niveauMs: -1 } },
    { ...donnees, effets: { ...donnees.effets, confettiVieMs: 4001 } },
    { ...donnees, effets: { ...donnees.effets, confettiDureeMinMs: 5000 } },
    { ...donnees, dialogues: [''] }, { ...donnees, titre: '' }, { ...donnees, boutonSortie: null },
  ])('rejette les données invalides en français : %#', fichier => {
    expect(() => chargerPantheon(fichier)).toThrow(/^Panthéon invalide : /);
  });
});

describe('effets déterministes', () => {
  for (const effet of fixture.effets) {
    it(`respecte les durées V1 avec aléa ${effet.alea}`, () => {
      const alea = () => effet.alea;
      const confetti = tirerConfetti(alea);
      const feu = tirerFeu(alea);
      expect(confetti).toEqual(tirerConfetti(alea));
      expect(feu).toEqual(tirerFeu(alea));
      expect(confetti.vieMs).toBe(effet.viesMs[0]);
      expect(feu.vieMs).toBe(effet.viesMs[1]);
      expect(confetti.dureeChuteMs).toBe((2 + effet.alea * 2) * 1000);
      expect(confetti.dureeRotationMs).toBe(confetti.dureeChuteMs);
      expect(confetti.x).toBe(effet.alea);
      expect(feu.x).toBeCloseTo(0.1 + effet.alea * 0.8);
      expect(feu.y).toBeCloseTo(0.1 + effet.alea * 0.6);
      expect(feu.echelle).toBe(10 + effet.alea * 15);
      expect(Math.max(confetti.vieMs, feu.vieMs, confetti.dureeChuteMs, confetti.dureeRotationMs)).toBeLessThanOrEqual(4000);
    });
  }
  it('consomme des tirages distincts dans l’ordre V1', () => {
    const valeurs = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6];
    let i = 0;
    expect(tirerConfetti(() => valeurs[i++]!)).toEqual({ x: 0.1, couleur: 0.2,
      rotationDepart: 108, dureeChuteMs: 2800, dureeRotationMs: 3000, rotationFin: 432, vieMs: 4000 });
    expect(i).toBe(6);
    i = 0;
    expect(tirerFeu(() => valeurs[i++]!)).toEqual({ x: 0.1 + 0.1 * 0.8, y: 0.1 + 0.2 * 0.6,
      couleur: 0.3, echelle: 16, vieMs: 1000 });
    expect(i).toBe(4);
  });
});

it.each([
  [1, false, 'bourg-palette', true], [2, false, 'bourg-palette', false],
  [1, true, 'defi-chen', false], [2, true, 'defi-chen', false],
] as const)('sortie : %s victoire(s), défi %s', (ligueGagnee, defiEnAttente, issue, annonceJohto) => {
  const entree = Object.freeze({ ligueGagnee, defiEnAttente });
  expect(issueDuPantheon(entree)).toEqual({ issue, annonceJohto });
});
