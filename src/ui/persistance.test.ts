import { expect, it, vi } from 'vitest';
import { creerHorlogeSimulee } from '../core/clock';
import { compteInitial, creerGestionnaire, creerStockageMemoire } from '../core/sauvegarde';
import { creerPartieNommee, ouvrirPartie } from './persistance';
import { departNouvellePartie } from './store';

function ouvrir(stockage = creerStockageMemoire()) {
  const options = { stockage, horloge: creerHorlogeSimulee(), genererId: () => 'test' };
  return { stockage, p: ouvrirPartie(options, { equipe: [], drapeaux: [] }), g: creerGestionnaire(options) };
}
const temps = (g: ReturnType<typeof ouvrir>['g']) => g.chargerPartie('test')!.donnees.statistiques.tempsJeuMs;
it('conserve le nouveau nom lors de la sauvegarde de la partie ouverte', () => {
  const { p, g } = ouvrir();
  g.renommerPartie('test', 'Nouveau');
  p.enregistrer({ ...p.region, argent: p.region.argent + 1 }, p.pokedex);
  expect(g.chargerPartie('test')!.donnees.nom).toBe('Nouveau');
});

it('accorde les premiers pas, garde les skins et relit le compte courant', () => {
  const { p, g } = ouvrir();
  expect(p.compte()).toEqual(compteInitial());
  const compte = { ...compteInitial(), diamants: 3, skins: ['bleu'], preferences: { sonActive: false } };
  g.ecrireCompte(compte);
  expect(p.compte()).toEqual(compte);
  p.enregistrer(p.region, [1]);
  const attendu = { ...compte, diamants: 8, succes: ['premiers-pas'] };
  expect(g.chargerCompte()!.donnees).toEqual(attendu);
  expect(p.compte()).toEqual(attendu);
  const revisionCompte = g.chargerCompte()!.revision;
  p.enregistrer({ ...p.region, argent: p.region.argent + 1 }, [1]);
  expect(g.chargerCompte()!.revision).toBe(revisionCompte);
});

it('ne crédite pas à nouveau les premiers pas sur une seconde partie du compte', () => {
  const { p, g, stockage } = ouvrir();
  p.enregistrer(p.region, [1]);
  const options = { stockage, horloge: creerHorlogeSimulee(), genererId: () => 'seconde' };
  creerPartieNommee(options, 'Seconde partie', { equipe: [], drapeaux: [] });
  const seconde = ouvrirPartie(options);
  seconde.enregistrer(seconde.region, [4]);
  expect(g.chargerCompte()!.donnees.diamants).toBe(5);
  expect(seconde.compte().succes).toEqual(['premiers-pas']);
});

it('n’écrit rien au premier enregistrement sans changement', () => {
  const { p, stockage } = ouvrir();
  const ecrire = vi.spyOn(stockage, 'ecrire');
  p.enregistrer(p.region, p.pokedex);
  expect(ecrire).not.toHaveBeenCalled();
  ecrire.mockRestore();
});

it('garde la partie sauvegardée et permet les écritures suivantes si le compte échoue', () => {
  const { p, g, stockage } = ouvrir();
  const ecriture = stockage.ecrire.bind(stockage);
  const espion = vi.spyOn(stockage, 'ecrire').mockImplementation((cle, valeur) => {
    if (cle === 'pokiclicker:compte:local') throw new Error('Quota du compte dépassé');
    ecriture(cle, valeur);
  });
  try {
    expect(() => p.enregistrer(p.region, [1])).not.toThrow();
    expect(g.chargerPartie('test')!.donnees.pokedexNational).toEqual([1]);
    expect(g.chargerCompte()).toBeNull();
    espion.mockRestore();
    p.enregistrer({ ...p.region, argent: p.region.argent + 1 }, [1]);
    expect(p.compte().diamants).toBe(5);
    expect(g.chargerRegion('test', 'kanto')!.donnees.argent).toBe(p.region.argent + 1);
  } finally {
    espion.mockRestore();
  }
});

it('crée une partie nommée avec son équipe puis ouvre la courante même plus ancienne', () => {
  let sequence = 0;
  const options = { stockage: creerStockageMemoire(), horloge: creerHorlogeSimulee(), genererId: () => `p-${++sequence}` };
  const g = creerGestionnaire(options);
  const depart = departNouvellePartie();
  const id = creerPartieNommee(options, 'Aventure', depart);
  expect(g.partieCourante()).toBe(id);
  expect(g.chargerRegion(id, 'kanto')!.donnees.equipe).toEqual(depart.equipe);
  expect(depart.equipe.length).toBeGreaterThan(0);
  options.horloge.avancer(1000);
  g.creerPartie('Plus récente');
  expect(ouvrirPartie(options).nom).toBe('Aventure');
});

it('garde le temps de jeu avec chaque vraie écriture et le reprend à la réouverture', () => {
  const premiere = ouvrir();
  expect(temps(premiere.g)).toBeUndefined();
  premiere.p.enregistrer({ ...premiere.p.region, argent: premiere.p.region.argent + 1 }, [], 5_432.9);
  expect(temps(premiere.g)).toBe(5_432);
  const seconde = ouvrir(premiere.stockage);
  seconde.p.enregistrer({ ...seconde.p.region, argent: seconde.p.region.argent + 1 }, [], 2_000);
  expect(temps(seconde.g)).toBe(7_432);
});

it("n'écrit rien quand seul le temps a changé", () => {
  const { p, g } = ouvrir();
  const region = { ...p.region, argent: p.region.argent + 1 };
  p.enregistrer(region, [], 1_000);
  const revision = g.chargerPartie('test')!.revision;
  p.enregistrer(region, [], 9_000);
  expect(g.chargerPartie('test')!.revision).toBe(revision);
  expect(temps(g)).toBe(1_000);
});
