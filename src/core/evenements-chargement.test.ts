import { describe, expect, it } from 'vitest';
import essai from '../../tests/fixtures/evenements/essai.json';
import { chargerEvenements } from './evenements';
import { evenementsKanto } from './evenements-kanto';
import { kanto } from './regions';
import { reglages } from './reglages';

const fichier = 'tests/fixtures/evenements/essai.json';
const evenement = essai.evenements[0];
function charger(modifications: Record<string, unknown> = {}) {
  return chargerEvenements({ [fichier]: { version: 1, evenements: [{ ...evenement, ...modifications }] } }, kanto);
}

describe('chargement des événements', () => {
  it('refuse un id dupliqué dans un même fichier', () => {
    expect(() => chargerEvenements({ [fichier]: { version: 1, evenements: [evenement, evenement] } }, kanto))
      .toThrow(`Événement invalide (${fichier}, kanto.essai) : Identifiant d'événement dupliqué : kanto.essai`);
  });

  it('refuse la version 2', () => {
    expect(() => chargerEvenements({ [fichier]: { ...essai, version: 2 } }, kanto))
      .toThrow(`Événement invalide (${fichier}, ?) : Version inconnue`);
  });

  it.each([-1, 256, Infinity])('refuse la capture hors bornes %s avec fichier et id', capture => {
    expect(() => charger({ etapes: [{ type: 'combat', pokemon: 143, niveau: 1, capture }] }))
      .toThrow(`Événement invalide (${fichier}, kanto.essai) : Capture invalide`);
  });

  it.each([0, 255])('accepte la borne de capture %s et le niveau maximal', capture => {
    expect(charger({ etapes: [{ type: 'combat', pokemon: 143, niveau: reglages.recompenses.niveauMax, capture }] })
      .liste[0]?.etapes[0]).toMatchObject({ capture, niveau: reglages.recompenses.niveauMax });
  });

  it('charge les six étapes du fichier d’essai sans modifier les entrées', () => {
    const avant = structuredClone(essai);
    const catalogue = chargerEvenements({ [fichier]: essai }, kanto);
    if (!catalogue.liste[0]) throw new Error('Événement d’essai absent');
    expect(catalogue.liste).toEqual(essai.evenements);
    expect(catalogue.parId('kanto.essai')).toEqual(evenement);
    expect(catalogue.liste[0].etapes).toHaveLength(6);
    expect(essai).toEqual(avant);
  });

  it('ne contient aucun événement de production', () => {
    expect(evenementsKanto.liste.map(e => e.id)).toEqual(['kanto.intro']);
  });

  it.each([
    [{ etapes: [] }, 'Étapes attendues'],
    [{ etapes: [{ type: 'combat', pokemon: 143, niveau: 1.5 }] }, 'Entier attendu'],
    [{ etapes: [{ type: 'combat', pokemon: 143, niveau: reglages.recompenses.niveauMax + 1 }] }, 'Niveau supérieur au maximum'],
    [{ declencheur: { type: 'entree-zone', zone: 'kanto.route-99' } }, 'Zone inconnue : kanto.route-99'],
    [{ etapes: [{ type: 'donner', objet: 'bidon', quantite: 1 }] }, 'Objet inconnu : bidon'],
    [{ etapes: [{ type: 'danser' }] }, 'Étape inconnue : danser'],
    [{ declencheur: { type: 'minuit' } }, 'Déclencheur inconnu : minuit'],
    [{ si: { type: 'minuit' } }, 'Condition inconnue : minuit'],
    [{ surprise: true }, 'Champ inconnu'],
    [{ repetable: true }, 'bloquer interdit dans un événement répétable'],
    [{ etapes: [{ type: 'combat', pokemon: 999999, niveau: 1 }] }, 'Pokémon inconnu : 999999'],
    [{ etapes: [{ type: 'deplacer', zone: 'kanto.route-99' }] }, 'Zone inconnue : kanto.route-99'],
    [{ etapes: [{ type: 'bloquer', zone: 'kanto.route-99', sauf: 'flute', raison: 'Stop' }] }, 'Zone inconnue : kanto.route-99'],
    [{ declencheur: { type: 'boss-vaincu', zone: 'kanto.route-99' } }, 'Zone inconnue : kanto.route-99'],
    [{ declencheur: { type: 'objet-utilise', objet: 'bidon' } }, 'Objet inconnu : bidon'],
    [{ etapes: [{ type: 'dialogue', locuteur: 'Chen', texte: 'Salut', extra: true }] }, 'Champ inconnu'],
    [{ declencheur: { type: 'debut-partie', extra: true } }, 'Champ inconnu'],
    [{ si: { non: { type: 'drapeau', id: 'ok', extra: true } } }, 'Champ inconnu'],
    [{ priorite: 0.5 }, 'Entier attendu'],
    [{ etapes: [{ type: 'donner', objet: 'pokeball', quantite: 0 }] }, 'Entier strictement positif attendu'],
    [{ etapes: [{ type: 'donner', objet: 'pokeball', quantite: 1, objetCle: 'flute' }] }, 'Champ inconnu'],
    [{ etapes: [{ type: 'combat', pokemon: 143, niveau: 0 }] }, 'Entier strictement positif attendu'],
  ])('refuse %j avec fichier, id et raison', (modifications, raison) => {
    expect(() => charger(modifications)).toThrow(`Événement invalide (${fichier}, kanto.essai) : ${raison}`);
  });

  it('refuse un identifiant partagé entre deux fichiers', () => {
    expect(() => chargerEvenements({ premier: essai, second: essai }, kanto))
      .toThrow("Événement invalide (second, kanto.essai) : Identifiant d'événement dupliqué : kanto.essai");
  });

  it('accepte tous les déclencheurs, les objets clés et les conditions composées', () => {
    for (const declencheur of [
      { type: 'debut-partie' },
      { type: 'boss-vaincu', zone: 'kanto.route-1' },
      { type: 'objet-utilise', objet: 'pokeball' },
      { type: 'objet-utilise', objet: 'pokeball', zone: 'kanto.route-1' },
    ]) {
      expect(charger({ declencheur, repetable: true, priorite: -1,
        si: { tous: [{ un_parmi: [{ type: 'drapeau', id: 'flute' }] }] },
        etapes: [{ type: 'donner', objetCle: 'flute' }],
      }).liste[0]).toMatchObject({ declencheur, repetable: true, priorite: -1 });
    }
  });

  it('applique les valeurs par défaut et trie par priorité puis id', () => {
    const catalogue = chargerEvenements({ [fichier]: { version: 1, evenements: [
      { ...evenement, id: 'z', priorite: undefined },
      { ...evenement, id: 'b', priorite: 2 },
      { ...evenement, id: 'a', priorite: 2 },
    ].map(({ priorite, ...reste }) => priorite === undefined ? reste : { ...reste, priorite }) } }, kanto);
    expect(catalogue.liste.map(e => [e.id, e.priorite, e.repetable]))
      .toEqual([['a', 2, false], ['b', 2, false], ['z', 0, false]]);
  });
});
