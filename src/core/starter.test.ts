import { describe, expect, it, vi } from 'vitest';
import { chargerEvenements, commandeCourante, type CatalogueEvenements, type Etape } from './evenements';
import { kanto } from './regions';
import type { DonneesRegion } from './sauvegarde-types';
import { choisirStarter, creerStarter, tirerStarters } from './starter';

describe('starters', () => {
  it('tire une fois le shiny de chacun des trois starters avec la chance injectée', () => {
    const alea = vi.fn().mockReturnValueOnce(0.001).mockReturnValueOnce(0.5).mockReturnValueOnce(0.001);
    expect(tirerStarters(alea, 1 / 256)).toStrictEqual({ 1: true, 4: false, 7: true });
    expect(alea).toHaveBeenCalledTimes(3);
    expect(tirerStarters(() => 0.5, 0.5)).toStrictEqual({ 1: false, 4: false, 7: false });
  });

  it('crée un Pokémon au niveau 5 avec un uid frais et les valeurs initiales', () => {
    const genererId = vi.fn().mockReturnValueOnce('starter-1').mockReturnValueOnce('starter-2');
    expect(creerStarter(1, true, () => 0.001, genererId)).toStrictEqual({
      uid: 'starter-1', numero: 1, niveau: 5, xp: 0, shiny: true,
      bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'male', favori: false,
    });
    expect(creerStarter(4, false, () => 0.5, genererId)).toMatchObject({
      uid: 'starter-2', numero: 4, shiny: false, sexe: 'femelle',
    });
    expect(genererId).toHaveBeenCalledTimes(2);
  });

  it('choisit le starter sans modifier la région ni le Pokémon et sans doubler le drapeau', () => {
    const pokemon = creerStarter(7, false, () => 0.5, () => 'starter-7');
    const region = {
      equipe: [], starterId: null, drapeaux: ['nouvelle-partie'],
      inventaire: { pokeball: 5 },
    } as unknown as DonneesRegion;
    Object.freeze(region.equipe);
    Object.freeze(region.drapeaux);
    Object.freeze(region.inventaire);
    Object.freeze(region);
    Object.freeze(pokemon);
    const resultat = choisirStarter(region, pokemon);
    expect(resultat).toStrictEqual({
      ...region, equipe: [pokemon], starterId: 7,
      drapeaux: ['nouvelle-partie', 'starter-choisi'],
    });
    expect(region.equipe).toStrictEqual([]);
    expect(region.starterId).toBeNull();
    expect(region.drapeaux).toStrictEqual(['nouvelle-partie']);
    expect(choisirStarter(resultat, pokemon)).toStrictEqual(resultat);
  });
});

describe('pose du dialogue', () => {
  it.each(['chen-1', '', 'chen:1', 2, null])('valide la pose comme identifiant : %j', pose => {
    const charger = () => chargerEvenements({ essai: { version: 1, evenements: [{
      id: 'essai', declencheur: { type: 'debut-partie' },
      etapes: [{ type: 'dialogue', locuteur: 'Chen', texte: 'Bonjour', pose }],
    }] } }, kanto);
    if (pose === 'chen-1') expect(charger().liste[0]?.etapes[0]).toStrictEqual({
      type: 'dialogue', locuteur: 'Chen', texte: 'Bonjour', pose,
    });
    else expect(charger).toThrow();
  });

  function commande(etape: Etape) {
    const catalogue = { liste: [{ id: 'kanto.intro', etapes: [etape] }] } as CatalogueEvenements;
    const region = { evenementEnCours: { id: 'kanto.intro', etape: 0 } } as DonneesRegion;
    return commandeCourante(catalogue, region);
  }

  it('recopie la pose dans la commande', () => {
    expect(commande({ type: 'dialogue', locuteur: 'Chen', texte: 'Bonjour', pose: 'chen-1' }))
      .toStrictEqual({ type: 'dialogue', locuteur: 'Chen', texte: 'Bonjour', pose: 'chen-1', evenement: 'kanto.intro', etape: 0 });
  });

  it('garde exactement la commande précédente quand la pose est absente', () => {
    expect(commande({ type: 'dialogue', locuteur: 'Chen', texte: 'Bonjour' }))
      .toStrictEqual({ type: 'dialogue', locuteur: 'Chen', texte: 'Bonjour', evenement: 'kanto.intro', etape: 0 });
  });
});
