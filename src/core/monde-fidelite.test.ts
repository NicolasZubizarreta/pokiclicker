import { describe, expect, it } from 'vitest';
import donnees from '../../data/regions/kanto/zones.json';
import fixture from '../../tests/fixtures/v1-zones.json';
import { kanto } from './regions';
import { chargerMonde } from './monde';
import type { FichierZones, Rarete, Zone } from './monde';
import { chargerPokemon } from './pokemon';
import type { EtatMonde } from './conditions';

const vide: EtatMonde = { badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [] };
const ids = [
  'bourg-palette', 'route-1', 'foret-de-jade', 'arene-d-argenta', 'mont-selenite',
  'arene-d-azuria', 'pont-pepite', 'arene-de-carmin', 'cave-taupiqueur', 'tunnel-rocheux',
  'tour-pokemon', 'arene-de-celadopole', 'centrale', 'arene-de-parmanie', 'sylphe-sarl',
  'arene-de-safrania', 'iles-ecume', 'arene-de-cramois-ile', 'arene-de-jadielle',
  'caverne-azuree', 'route-victoire', 'ligue-pokemon',
].map((id) => `kanto.${id}`);
const bourg = 'kanto.bourg-palette';
const route = 'kanto.route-1';
const ligue = 'kanto.ligue-pokemon';
const multiplicateurs = new Map(fixture.multiplicateurs as [number, number][]);
const raretes: Record<string, Rarete> = {
  Commun: 'commun', 'Peu Commun': 'peu-commun', Rare: 'rare',
  'Très Rare': 'tres-rare', Légendaire: 'legendaire',
};
const rencontre = (v1: { id: number; name: string; level: number; catchRate: number }) => ({
  pokemon: v1.id, nom: v1.name, niveau: v1.level, capture: v1.catchRate,
});
const fichierEssai = () => structuredClone(donnees) as FichierZones;
const combatEssai = (fichier: FichierZones, id: string) => fichier.zones.find((zone) => zone.id === id) as Zone;

describe('fidélité des zones de Kanto à la V1', () => {
  it.each(fixture.zones)('conserve les valeurs et l’ordre des rencontres de $name (zone $id)', (v1) => {
    const id = ids[v1.id]!;
    const zone = kanto.zone(id);
    expect(zone.id).toBe(id);
    expect(zone.nom).toBe(v1.name);
    expect(zone.ancienId).toBe(v1.id);
    if (v1.id === 0) {
      expect(zone.sansCombat).toBe(true);
      for (const champ of ['type', 'niveaux', 'etapes', 'multiplicateurPv', 'sauvages', 'boss', 'adversaires']) {
        expect(zone).not.toHaveProperty(champ);
      }
      return;
    }
    const combat = kanto.zoneDeCombat(id);
    expect(combat.niveaux).toEqual([v1.minLevel, v1.maxLevel]);
    expect(combat.etapes).toBe(10);
    expect(combat.multiplicateurPv).toBe(multiplicateurs.get(v1.id));
    expect(combat.boss).toEqual(rencontre(v1.boss));
    if (v1.id !== 21) {
      expect(combat.sauvages).toEqual(v1.pokemons.map((pokemon) => {
        if (!('spawnRate' in pokemon)) throw new Error('Apparition absente de la rencontre V1');
        return {
          pokemon: pokemon.id, rarete: raretes[pokemon.rarity],
          apparition: pokemon.spawnRate, capture: pokemon.catchRate,
        };
      }));
    }
  });

  it('conserve les neuf adversaires de la Ligue dans l’ordre et le boss Maître Blue', () => {
    const zone = kanto.zoneDeCombat(ligue);
    const v1 = fixture.zones.find(({ id }) => id === 21)!;
    expect(zone.type).toBe('ligue');
    expect(zone.fin).toBe(true);
    expect(zone.sauvages).toEqual([]);
    expect(zone.adversaires).toHaveLength(9);
    expect(zone.adversaires).toEqual(v1.pokemons.map((pokemon) => {
      if (!('level' in pokemon)) throw new Error('Niveau absent de l’adversaire V1');
      return rencontre(pokemon);
    }));
    expect(zone.etapes - 1).toBe(zone.adversaires!.length);
    expect(zone.boss).toEqual(rencontre(v1.boss));
    expect(zone.boss.nom).toBe('Maître Blue');
  });

  it('réserve le type arène aux huit zones des badges de la V1', () => {
    const arenes = kanto.zones.filter((zone) => !zone.sansCombat && kanto.zoneDeCombat(zone.id).type === 'arene');
    expect(arenes).toHaveLength(8);
    expect(new Set(arenes.map(({ ancienId }) => ancienId))).toEqual(new Set(fixture.badges.map(({ zoneIdx }) => zoneIdx)));
    for (const zone of kanto.zones) {
      if (!zone.sansCombat && zone.id !== ligue && !arenes.includes(zone)) {
        expect(kanto.zoneDeCombat(zone.id)).not.toHaveProperty('type');
      }
    }
  });

  it('référence le catalogue de 151 Pokémon avec des raretés et captures valides pour toutes les rencontres', () => {
    const catalogue = chargerPokemon();
    expect(catalogue.liste).toHaveLength(151);
    for (const zone of kanto.zones) {
      if (zone.sansCombat) continue;
      const combat = kanto.zoneDeCombat(zone.id);
      for (const sauvage of combat.sauvages) expect(Object.values(raretes)).toContain(sauvage.rarete);
      for (const pokemon of [...combat.sauvages, ...(combat.adversaires ?? []), combat.boss]) {
        expect(() => catalogue.parNumero(pokemon.pokemon)).not.toThrow();
        expect(pokemon.capture).toBeGreaterThanOrEqual(0);
        expect(pokemon.capture).toBeLessThanOrEqual(255);
      }
    }
  });

  it('forme un chemin de 22 zones sans retour, de Bourg Palette à la Ligue', () => {
    expect(kanto.zones.map(({ id }) => id)).toEqual(ids);
    ids.forEach((id, index) => {
      const suivant = ids[index + 1];
      expect(kanto.liensDepuis(id)).toEqual(suivant
        ? [index === 0 ? { vers: suivant } : { vers: suivant, si: { type: 'boss', zone: id } }]
        : []);
      if (index > 0) expect(kanto.peutPasser(id, ids[index - 1]!, vide).ok).toBe(false);
    });
  });

  it('ouvre exactement une zone par boss vaincu jusqu’aux 22 zones', () => {
    const etat = structuredClone(vide);
    expect(kanto.zonesOuvertes(etat).map(({ id }) => id)).toEqual([bourg, route]);
    for (let index = 1; index < ids.length - 1; index++) {
      etat.bossVaincus.push(ids[index]!);
      expect(kanto.zonesOuvertes(etat).map(({ id }) => id)).toEqual(ids.slice(0, index + 2));
    }
    expect(kanto.zonesOuvertes(etat)).toHaveLength(22);
  });

  it('explique les sauts interdits et autorise le lien suivant après la victoire sur le boss', () => {
    const saut = kanto.peutPasser(route, 'kanto.arene-d-argenta', vide);
    expect(saut.ok).toBe(false);
    expect(saut.raison?.trim()).toBeTruthy();
    const suivant = ids[2]!;
    const bloque = kanto.peutPasser(route, suivant, vide);
    expect(bloque.ok).toBe(false);
    expect(bloque.raison?.trim()).toBeTruthy();
    expect(kanto.peutPasser(route, suivant, { ...vide, bossVaincus: [route] })).toEqual({ ok: true });
  });

  it('distingue le départ à Bourg Palette du premier combat sur la Route 1', () => {
    expect(kanto.depart).toBe(bourg);
    expect(kanto.premierCombat).toBe(route);
    expect(() => kanto.zoneDeCombat(bourg)).toThrow(new Error(`Zone sans combat : ${bourg}`));
  });

  it('conserve les sept lieux spéciaux dans l’ordre de la V1 et leur zone de départ', () => {
    expect(kanto.lieux).toHaveLength(7);
    expect(kanto.lieux.map(({ lieu }) => lieu)).toEqual([
      'pension', 'labo', 'chez-blue', 'chez-maman', 'pantheon', 'centre-commercial', 'casino',
    ]);
    kanto.lieux.forEach((lieu, index) => {
      expect(lieu.nom).toBe(fixture.speciaux[index]!.name);
      expect(lieu.ancienId).toBe(fixture.speciaux[index]!.id);
      expect(kanto.lieu(lieu.lieu)).toEqual(lieu);
      expect(() => kanto.zone(lieu.depuis)).not.toThrow();
    });
    expect(() => kanto.lieu('absent')).toThrow(new Error('Lieu inconnu : absent'));
  });

  const invalides: [string, (fichier: FichierZones) => void, string][] = [
    ['lieu dupliqué', (f) => {
      f.lieux.push(structuredClone(f.lieux.find(({ lieu }) => lieu === 'labo')!));
    }, 'Lieu dupliqué : labo'],
    ['lieu depuis une zone inconnue', (f) => { f.lieux[0]!.depuis = 'absente'; }, 'Zone inconnue : absente'],
    ['premier combat à Bourg Palette', (f) => { f.premierCombat = bourg; }, `Zone sans combat : ${bourg}`],
    ['boss sur une zone sans combat', (f) => {
      Object.assign(f.zones.find(({ id }) => id === bourg)!, { boss: structuredClone(kanto.zoneDeCombat(route).boss) });
    }, `Zone sans combat invalide : ${bourg}`],
    ['type de zone inconnu', (f) => {
      Object.assign(combatEssai(f, route), { type: 'inconnu' });
    }, 'Type de zone inconnu : inconnu'],
    ['Ligue avec huit adversaires', (f) => { combatEssai(f, ligue).adversaires!.pop(); }, `Adversaires de la Ligue invalides : ${ligue}`],
    ['Ligue avec des sauvages', (f) => {
      combatEssai(f, ligue).sauvages = structuredClone(combatEssai(f, route).sauvages);
    }, `Sauvages interdits dans la Ligue : ${ligue}`],
    ['adversaires sur la Route 1', (f) => {
      combatEssai(f, route).adversaires = structuredClone(kanto.zoneDeCombat(ligue).adversaires!);
    }, `Adversaires de la Ligue invalides : ${route}`],
  ];
  it.each(invalides)('rejette un fichier invalide : %s', (_, modifier, message) => {
    const fichier = fichierEssai();
    modifier(fichier);
    expect(() => chargerMonde(fichier)).toThrow(new Error(message));
  });
});
