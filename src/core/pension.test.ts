import { describe, expect, it, vi } from 'vitest';
import { accesPension, chancePonte, pondre, tirerOeuf } from './pension';
import { kanto } from './regions';
import { reglages } from './reglages';
import { etatMondeDe, regionInitiale, validerPokemonPossede } from './sauvegarde';
import type { PokemonPossede } from './sauvegarde-types';
import { acheterEmplacementOeuf, avancerOeuf, deposerParent, prendreOeuf, prixEmplacementOeuf, retirerParent } from './pension';
import { appliquerVictoire } from './recompenses';

const parent = (numero: number, sexe: PokemonPossede['sexe']): PokemonPossede => ({
  uid: `parent-${numero}`, numero, sexe, niveau: 50, xp: 12, bonheur: 200,
  shiny: false, favori: true, calcium: 10, pierreEternelle: true,
});
function preparer() {
  const region = regionInitiale('kanto', 'kanto.bourg-palette');
  region.bossVaincus = ['kanto.tour-pokemon'];
  region.pension.parents = [parent(26, 'male'), parent(25, 'femelle')];
  return region;
}

const creerOeuf = (): PokemonPossede => ({
  ...parent(25, 'femelle'), uid: 'oeuf', niveau: 1, xp: 0, bonheur: 0,
  shiny: true, oeuf: { pasRestants: 25, pasMax: 25 },
});

describe('mouvements et éclosion', () => {
  it('garde les refus dernier puis actif de l’équipe et la limite de parents', () => {
    const region = preparer();
    region.pension.parents = [];
    const pokemon = parent(25, 'male');
    region.equipe = [pokemon];
    expect(deposerParent(region, pokemon.uid)).toEqual({ ok: false,
      raison: "C'est ton dernier Pokémon : garde-le dans l'équipe." });
    region.equipe.push(creerOeuf());
    expect(deposerParent(region, pokemon.uid)).toEqual({ ok: false,
      raison: "Il faut au moins 1 Pokémon actif dans l'équipe." });
    region.pension.parents = [parent(1, 'male'), parent(4, 'male')];
    expect(deposerParent(region, 'oeuf')).toEqual({ ok: false, raison: 'La pension est pleine.' });
  });

  it.each(['equipe', 'pc'] as const)('dépose depuis %s sans muter et autorise un œuf parent', (source) => {
    const region = preparer();
    region.pension.parents = [];
    region.equipe = [parent(1, 'male')];
    const oeuf = creerOeuf();
    region[source].push(oeuf);
    const avant = structuredClone(region);
    const resultat = deposerParent(region, oeuf.uid);
    expect(resultat.ok).toBe(true);
    if (!resultat.ok) throw new Error(resultat.raison);
    expect(resultat.region.pension.parents).toEqual([oeuf]);
    expect(resultat.region[source]).not.toContainEqual(oeuf);
    expect(region).toEqual(avant);
  });

  it('refuse les identifiants absents pour les trois mouvements', () => {
    const region = preparer();
    region.pension.parents = [];
    for (const action of [deposerParent, retirerParent, prendreOeuf]) {
      expect(action(region, 'absent')).toEqual({ ok: false, raison: 'Ce Pokémon est introuvable.' });
    }
  });

  it('refuse un achat sans argent ou au maximum sans modifier l’entrée', () => {
    const region = preparer();
    region.argent = 4999;
    const avant = structuredClone(region);
    expect(acheterEmplacementOeuf(region)).toEqual({ ok: false, raison: "Pas assez d'argent." });
    expect(region).toEqual(avant);
    region.pension.emplacementsOeuf = 5;
    expect(prixEmplacementOeuf(region)).toBeNull();
    expect(acheterEmplacementOeuf(region).ok).toBe(false);
  });

  it('avance sans muter et retire la propriété oeuf à zéro', () => {
    const oeuf = creerOeuf();
    const avant = structuredClone(oeuf);
    expect(avancerOeuf(oeuf).oeuf?.pasRestants).toBe(24);
    expect(oeuf).toEqual(avant);
    const eclos = avancerOeuf({ ...oeuf, oeuf: { pasRestants: 1, pasMax: 25 } });
    expect(eclos).not.toHaveProperty('oeuf');
    expect(eclos).toMatchObject({ niveau: 1, xp: 0, bonheur: 125, shiny: true });
    expect(avancerOeuf(eclos)).toBe(eclos);
  });

  it('annonce chaque éclosion une fois et laisse PC, pension et parents immobiles', () => {
    let region = preparer();
    region.equipe = [creerOeuf(), { ...creerOeuf(), uid: 'second' }];
    region.pc = [{ ...creerOeuf(), uid: 'pc' }];
    region.pension.oeufs = [{ ...creerOeuf(), uid: 'pension' }];
    region.pension.parents = [{ ...creerOeuf(), uid: 'parent' }];
    const avant = structuredClone(region);
    for (let n = 1; n <= 25; n++) {
      const resultat = appliquerVictoire(region, { numero: 1, niveau: 1, shiny: false, boss: false, rarete: null });
      expect(resultat.eclosions).toEqual(n === 25 ? [{ uid: 'oeuf', numero: 25 }, { uid: 'second', numero: 25 }] : []);
      expect(resultat.region.equipe[0]!.oeuf?.pasRestants).toBe(n === 25 ? undefined : 25 - n);
      region = resultat.region;
    }
    expect(region.pc).toEqual(avant.pc);
    expect(region.pension).toEqual(avant.pension);
    expect(region.equipe[0]).toMatchObject({ niveau: 1, xp: 0, bonheur: 125, shiny: true });
    expect(region.equipe[0]).not.toHaveProperty('oeuf');
    expect(appliquerVictoire(region, { numero: 1, niveau: 1, shiny: false, boss: false, rarete: null }).eclosions).toEqual([]);
  });
});

describe('pension', () => {
  it('évalue la condition du lieu et nomme la Tour Pokémon', () => {
    const region = preparer();
    expect(accesPension(kanto, etatMondeDe(region))).toEqual({ ouvert: true });
    region.bossVaincus = ['kanto.route-1'];
    expect(accesPension(kanto, etatMondeDe(region))).toEqual({
      ouvert: false, raison: 'Bats le boss de Tour Pokémon.',
    });
    const lieu = { ...kanto.lieu('pension'), si: { type: 'drapeau' as const, id: 'essai' } };
    expect(accesPension({ ...kanto, lieu: () => lieu }, { ...etatMondeDe(region), drapeaux: ['essai'] }))
      .toEqual({ ouvert: true });
    expect(accesPension({ ...kanto, lieu: () => ({ ...lieu, si: undefined }) }, etatMondeDe(region)))
      .toEqual({ ouvert: true });
  });

  it('crée un œuf valide sans modifier la région ni ses parents', () => {
    const region = preparer();
    const avant = structuredClone(region);
    const valeurs = [0, 0.124, 0.6];
    const alea = vi.fn(() => valeurs.shift()!);
    const genererId = vi.fn(() => 'nouvel-oeuf');
    const apres = pondre(region, alea, genererId);
    expect(region).toEqual(avant);
    expect(apres).not.toBe(region);
    expect(apres.pension.parents).toBe(region.pension.parents);
    expect(apres.pension.oeufs).toEqual([{
      uid: 'nouvel-oeuf', numero: 25, niveau: 1, xp: 0, bonheur: 0, calcium: 0,
      shiny: true, sexe: 'femelle', favori: false, pierreEternelle: false,
      oeuf: { pasRestants: 25, pasMax: 25 },
    }]);
    expect(() => validerPokemonPossede(apres.pension.oeufs[0])).not.toThrow();
    expect(alea).toHaveBeenCalledTimes(3);
    expect(genererId).toHaveBeenCalledTimes(1);
  });

  it('ne tire rien pour une paire incompatible ou incomplète', () => {
    const region = preparer();
    const alea = vi.fn(() => 0);
    const genererId = vi.fn(() => 'oeuf');
    for (const parents of [[], [parent(1, 'femelle')], [parent(1, 'femelle'), parent(4, 'male')]]) {
      region.pension.parents = parents;
      expect(chancePonte(parents)).toBe(0);
      expect(tirerOeuf(parents, alea)).toBeNull();
      expect(pondre(region, alea, genererId)).toBe(region);
    }
    expect(alea).not.toHaveBeenCalled();
    expect(genererId).not.toHaveBeenCalled();
  });

  it('respecte les seuils stricts de ponte et de shiny', () => {
    const parents = preparer().pension.parents;
    const alea = vi.fn(() => reglages.pension.chances.memeEspece);
    expect(tirerOeuf(parents, alea)).toBeNull();
    expect(alea).toHaveBeenCalledTimes(1);
    const valeurs = [0, 0.125];
    expect(tirerOeuf(parents, () => valeurs.shift()!)).toEqual({ numero: 25, shiny: false });
  });

  it.each([0, 1])('choisit la mère quel que soit son emplacement (%i)', (index) => {
    const parents = [parent(1, 'male'), parent(43, 'femelle')];
    if (index === 0) parents.reverse();
    expect(tirerOeuf(parents, () => 0)).toEqual({ numero: 43, shiny: true });
  });

  it.each([0, 1])('Métamorph prend la forme de base de l’autre parent (%i)', (index) => {
    const parents = [parent(132, 'sansSexe'), parent(82, 'sansSexe')];
    if (index === 0) parents.reverse();
    expect(tirerOeuf(parents, () => 0)).toEqual({ numero: 81, shiny: true });
  });

  it.each([0, 150 / 151])('Métamorph ×2 tire une espèce puis sa forme de base (%f)', (valeur) => {
    const valeurs = [0, valeur, 0.125];
    const alea = vi.fn(() => valeurs.shift()!);
    expect(tirerOeuf([parent(132, 'sansSexe'), parent(132, 'sansSexe')], alea))
      .toEqual({ numero: valeur === 0 ? 1 : 151, shiny: false });
    expect(alea).toHaveBeenCalledTimes(3);
  });
});
