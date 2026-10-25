import { describe, expect, it } from 'vitest';
import donnees from '../../data/regions/kanto/zones.json';
import badges from '../../data/badges.json';
import { chargerMonde } from './monde';
import type { FichierZones, Zone } from './monde';
import type { EtatMonde } from './conditions';
import { chargerPokemon } from './pokemon';
import { kanto } from './regions';

const vide: EtatMonde = { badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [] };
const depart = 'kanto.route-1';
const bourg = 'kanto.bourg-palette';
const foret = 'kanto.foret-de-jade';
const fichierEssai = () => structuredClone(donnees) as FichierZones;
const routeEssai = (fichier: FichierZones) => fichier.zones.find(({ id }) => id === depart) as Zone;

describe('monde Kanto', () => {
  it('charge les 22 zones avec le vrai catalogue de 151 Pokémon', () => {
    const catalogue = chargerPokemon();
    expect(catalogue.liste).toHaveLength(151);
    expect(() => chargerMonde(fichierEssai(), catalogue)).not.toThrow();
    expect(kanto.region).toBe('kanto');
    expect(kanto.depart).toBe(bourg);
    expect(kanto.zones).toHaveLength(22);
    expect(kanto.zones.filter(({ fin }) => fin).map(({ id }) => id)).toEqual(['kanto.ligue-pokemon']);
    expect(kanto.zone(depart).fin).toBeUndefined();
  });

  it('conserve les valeurs de la Route 1 de la V1', () => {
    const route = kanto.zoneDeCombat(depart);
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
    const zone = kanto.zoneDeCombat(foret);
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

  // Valeurs relevées à la main dans legacy/js/regions/kanto.js et ZONE_MULT, indépendantes du script d'extraction.
  it('conserve la Ligue et l’Arène de Céladopole telles que relevées dans la V1', () => {
    const ligue = kanto.zoneDeCombat('kanto.ligue-pokemon');
    expect(ligue.adversaires![8]).toEqual({ pokemon: 18, nom: 'Maître Blue (Roucarnage)', niveau: 92, capture: 0 });
    expect(ligue.boss).toEqual({ pokemon: 9, nom: 'Maître Blue', niveau: 100, capture: 0 });
    expect(ligue.multiplicateurPv).toBe(48.5);
    const celadopole = kanto.zoneDeCombat('kanto.arene-de-celadopole');
    expect(celadopole.boss).toMatchObject({ pokemon: 71, niveau: 39 });
    expect(celadopole.multiplicateurPv).toBe(23.5);
    expect(celadopole.type).toBe('arene');
  });

  it('verrouille le passage et les zones accessibles selon le boss vaincu', () => {
    const etat = { ...vide, bossVaincus: [depart] };
    expect(kanto.liensDepuis(depart)).toEqual([{ vers: foret, si: { type: 'boss', zone: depart } }]);
    expect(kanto.peutPasser(depart, foret, vide)).toEqual({ ok: false, raison: 'Bats le boss de Route 1.' });
    expect(kanto.peutPasser(depart, foret, etat)).toEqual({ ok: true });
    expect(kanto.peutPasser(foret, depart, etat)).toEqual({ ok: false, raison: `Pas de chemin de ${foret} vers ${depart}.` });
    expect(kanto.zonesOuvertes(vide).map((zone) => zone.id)).toEqual([bourg, depart]);
    expect(kanto.zonesOuvertes(etat).map((zone) => zone.id)).toEqual([bourg, depart, foret]);
  });

  it('exige les huit badges après le boss de la Route Victoire pour accéder à la Ligue', () => {
    const ordonnes = [...badges].sort((a, b) => a.ordre - b.ordre);
    const etat: EtatMonde = {
      ...vide, bossVaincus: ['kanto.route-victoire'],
      badges: ordonnes.slice(0, 7).map(({ id }) => id),
    };
    const avant = structuredClone(etat);
    expect(kanto.accesZone('kanto.ligue-pokemon', etat)).toEqual({
      ok: false, raison: 'Il te faut le badge Terre.',
    });
    expect(kanto.accesZone('kanto.ligue-pokemon', {
      ...etat, badges: ordonnes.map(({ id }) => id),
    })).toEqual({ ok: true });
    expect(etat).toEqual(avant);
  });

  it.each(badges)('exige aussi le badge $nom pour accéder à la Ligue', (badge) => {
    expect(kanto.accesZone('kanto.ligue-pokemon', {
      ...vide, bossVaincus: ['kanto.route-victoire'],
      badges: badges.filter(({ id }) => id !== badge.id).map(({ id }) => id),
    })).toEqual({ ok: false, raison: `Il te faut le badge ${badge.nom}.` });
  });

  it('exige encore le boss de la Route Victoire avec les huit badges', () => {
    expect(kanto.accesZone('kanto.ligue-pokemon', {
      ...vide, badges: badges.map(({ id }) => id),
    })).toEqual({ ok: false, raison: 'Bats le boss de Route Victoire.' });
  });

  it('parcourt un cycle et un lien sans condition sans boucler', () => {
    const fichier: FichierZones = {
      version: 1, region: 'kanto', depart, premierCombat: depart, lieux: [],
      carte: { ...kanto.carte, formes: kanto.carte.formes.filter((forme) => forme.zone === depart || forme.zone === foret) },
      zones: [structuredClone(kanto.zoneDeCombat(depart)), structuredClone(kanto.zoneDeCombat(foret))],
    };
    fichier.zones[0]!.liens = [{ vers: foret }];
    fichier.zones[1]!.liens = [{ vers: depart }];
    const monde = chargerMonde(fichier);
    expect(monde.peutPasser(depart, foret, vide)).toEqual({ ok: true });
    expect(monde.zonesOuvertes(vide)).toHaveLength(2);
  });

  const invalides: [string, (fichier: FichierZones) => void, string][] = [
    ['lien inconnu', (f) => { routeEssai(f).liens = [{ vers: 'kanto.route-99' }]; }, 'Zone inconnue : kanto.route-99'],
    ['départ inconnu', (f) => { f.depart = 'absent'; }, 'Zone inconnue : absent'],
    ['zone inaccessible', (f) => { routeEssai(f).liens = [{ vers: depart }]; }, `Zone inaccessible : ${foret}`],
    ['doublon', (f) => { f.zones.push(structuredClone(routeEssai(f))); }, `Identifiant de zone dupliqué : ${depart}`],
    ['absence de sortie', (f) => { routeEssai(f).liens = []; }, `Zone sans sortie : ${depart}`],
    ['Pokémon sauvage inconnu', (f) => { routeEssai(f).sauvages[0]!.pokemon = 999; }, 'Pokémon inconnu : 999'],
    ['boss inconnu', (f) => { routeEssai(f).boss.pokemon = 999; }, 'Pokémon inconnu : 999'],
    ['niveaux inversés', (f) => { routeEssai(f).niveaux = [5, 2]; }, `Niveaux invalides : ${depart}`],
    ['condition inconnue', (f) => {
      Object.assign(routeEssai(f).liens[0]!.si!, { type: 'inconnu' });
    }, 'Condition inconnue : inconnu'],
    ['étapes nulles', (f) => { routeEssai(f).etapes = 0; }, `Étapes invalides : ${depart}`],
    ['étapes fractionnaires', (f) => { routeEssai(f).etapes = 1.5; }, `Étapes invalides : ${depart}`],
    ['sauvages vides', (f) => { routeEssai(f).sauvages = []; }, `Aucun Pokémon sauvage : ${depart}`],
    ['apparition nulle', (f) => { routeEssai(f).sauvages[0]!.apparition = 0; }, `Apparition invalide : ${depart}`],
    ['capture négative', (f) => { routeEssai(f).sauvages[0]!.capture = -1; }, `Capture invalide : ${depart}`],
    ['capture excessive', (f) => { routeEssai(f).boss.capture = 256; }, `Capture invalide : ${depart}`],
    ['rareté inconnue', (f) => { Object.assign(routeEssai(f).sauvages[0]!, { rarete: 'inconnue' }); }, 'Rareté inconnue : inconnue'],
  ];
  it.each(invalides)('rejette un fichier d’essai : %s', (_, modifier, message) => {
    const fichier = fichierEssai();
    modifier(fichier);
    expect(() => chargerMonde(fichier)).toThrow(new Error(message));
  });
});
