import { describe, expect, it } from 'vitest';
import donnees from '../../data/regions/kanto/zones.json';
import { chargerMonde } from './monde';
import type { FichierZones } from './monde';
import type { EtatMonde } from './conditions';
import { chargerPokemon } from './pokemon';
import { kanto } from './regions';

const vide: EtatMonde = { badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [] };
const depart = 'kanto.route-1';
const foret = 'kanto.foret-de-jade';
const fichierEssai = () => structuredClone(donnees) as FichierZones;

describe('monde Kanto', () => {
  it('charge les deux zones avec le vrai catalogue de 151 Pokémon', () => {
    const catalogue = chargerPokemon();
    expect(catalogue.liste).toHaveLength(151);
    expect(() => chargerMonde(fichierEssai(), catalogue)).not.toThrow();
    expect(kanto.region).toBe('kanto');
    expect(kanto.depart).toBe(depart);
    expect(kanto.zones).toHaveLength(2);
    expect(kanto.zone(foret).fin).toBe(true);
    expect(kanto.zone(depart).fin).toBeUndefined();
  });

  it('conserve les valeurs de la Route 1 de la V1', () => {
    const route = kanto.zone(depart);
    expect(route.nom).toBe('Route 1');
    expect(route.ancienId).toBe(1);
    expect(route.etapes).toBe(10);
    expect(route.niveaux).toEqual([2, 5]);
    expect(route.multiplicateurPv).toBe(1);
    expect(route.boss).toEqual({ pokemon: 19, nom: 'Rattata (Géant)', niveau: 6, capture: 0 });
    expect(route.sauvages).toEqual([
      { pokemon: 19, rarete: 'commun', apparition: 0.3, capture: 255 },
      { pokemon: 16, rarete: 'commun', apparition: 0.3, capture: 255 },
      { pokemon: 21, rarete: 'commun', apparition: 0.2, capture: 255 },
      { pokemon: 20, rarete: 'peu-commun', apparition: 0.1, capture: 127 },
      { pokemon: 17, rarete: 'peu-commun', apparition: 0.05, capture: 120 },
      { pokemon: 1, rarete: 'tres-rare', apparition: 0.05, capture: 45 },
    ]);
  });

  it('conserve les valeurs de la Forêt de Jade de la V1', () => {
    const zone = kanto.zone(foret);
    expect(zone.nom).toBe('Forêt de Jade');
    expect(zone.ancienId).toBe(2);
    expect(zone.etapes).toBe(10);
    expect(zone.niveaux).toEqual([5, 8]);
    expect(zone.multiplicateurPv).toBe(1.5);
    expect(zone.boss).toEqual({ pokemon: 12, nom: 'Papilusion', niveau: 10, capture: 0 });
    expect(zone.sauvages.map(({ pokemon, apparition, capture }) => [pokemon, apparition, capture])).toEqual([
      [10, 0.25, 255], [13, 0.25, 255], [11, 0.15, 120], [14, 0.15, 120], [25, 0.15, 190], [4, 0.05, 45],
    ]);
  });

  it('verrouille le passage et les zones accessibles selon le boss vaincu', () => {
    const etat = { ...vide, bossVaincus: [depart] };
    expect(kanto.liensDepuis(depart)).toEqual([{ vers: foret, si: { type: 'boss', zone: depart } }]);
    expect(kanto.peutPasser(depart, foret, vide)).toEqual({ ok: false, raison: 'Bats le boss de Route 1.' });
    expect(kanto.peutPasser(depart, foret, etat)).toEqual({ ok: true });
    expect(kanto.peutPasser(foret, depart, etat)).toEqual({ ok: false, raison: `Pas de chemin de ${foret} vers ${depart}.` });
    expect(kanto.zonesOuvertes(vide).map((zone) => zone.id)).toEqual([depart]);
    expect(kanto.zonesOuvertes(etat).map((zone) => zone.id)).toEqual([depart, foret]);
  });

  it('parcourt un cycle et un lien sans condition sans boucler', () => {
    const fichier = fichierEssai();
    fichier.zones[0]!.liens = [{ vers: foret }];
    fichier.zones[1]!.liens = [{ vers: depart }];
    const monde = chargerMonde(fichier);
    expect(monde.peutPasser(depart, foret, vide)).toEqual({ ok: true });
    expect(monde.zonesOuvertes(vide)).toHaveLength(2);
  });

  const invalides: [string, (fichier: FichierZones) => void, string][] = [
    ['lien inconnu', (f) => { f.zones[0]!.liens = [{ vers: 'kanto.route-99' }]; }, 'Zone inconnue : kanto.route-99'],
    ['départ inconnu', (f) => { f.depart = 'absent'; }, 'Zone inconnue : absent'],
    ['zone inaccessible', (f) => { f.zones[0]!.liens = [{ vers: depart }]; }, `Zone inaccessible : ${foret}`],
    ['doublon', (f) => { f.zones.push(structuredClone(f.zones[0]!)); }, `Identifiant de zone dupliqué : ${depart}`],
    ['absence de sortie', (f) => { delete f.zones[1]!.fin; }, `Zone sans sortie : ${foret}`],
    ['Pokémon sauvage inconnu', (f) => { f.zones[0]!.sauvages[0]!.pokemon = 999; }, 'Pokémon inconnu : 999'],
    ['boss inconnu', (f) => { f.zones[0]!.boss.pokemon = 999; }, 'Pokémon inconnu : 999'],
    ['niveaux inversés', (f) => { f.zones[0]!.niveaux = [5, 2]; }, `Niveaux invalides : ${depart}`],
    ['condition inconnue', (f) => {
      Object.assign(f.zones[0]!.liens[0]!.si!, { type: 'inconnu' });
    }, 'Condition inconnue : inconnu'],
    ['étapes nulles', (f) => { f.zones[0]!.etapes = 0; }, `Étapes invalides : ${depart}`],
    ['étapes fractionnaires', (f) => { f.zones[0]!.etapes = 1.5; }, `Étapes invalides : ${depart}`],
    ['sauvages vides', (f) => { f.zones[0]!.sauvages = []; }, `Aucun Pokémon sauvage : ${depart}`],
    ['apparition nulle', (f) => { f.zones[0]!.sauvages[0]!.apparition = 0; }, `Apparition invalide : ${depart}`],
    ['capture négative', (f) => { f.zones[0]!.sauvages[0]!.capture = -1; }, `Capture invalide : ${depart}`],
    ['capture excessive', (f) => { f.zones[0]!.boss.capture = 256; }, `Capture invalide : ${depart}`],
    ['rareté inconnue', (f) => { Object.assign(f.zones[0]!.sauvages[0]!, { rarete: 'inconnue' }); }, 'Rareté inconnue : inconnue'],
  ];
  it.each(invalides)('rejette un fichier d’essai : %s', (_, modifier, message) => {
    const fichier = fichierEssai();
    modifier(fichier);
    expect(() => chargerMonde(fichier)).toThrow(new Error(message));
  });
});
