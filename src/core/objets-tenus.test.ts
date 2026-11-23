import { describe, expect, it } from 'vitest';
import { detailDps, relacherLot, relacherPokemon } from './equipe';
import { poserStase } from './objets-equipe';
import { chargerObjetsTenus, cleStock, donnerObjetTenu, facteurObjetTenu, objetsCompatibles, OBJETS_TENUS, PRIX_OBJET_TENU, retirerObjetTenu } from './objets-tenus';
import { chargerPokemon, nomType } from './pokemon';
import { validerPokemonPossede } from './sauvegarde-validation';
import type { DonneesRegion, PokemonPossede } from './sauvegarde-types';
import { calculerDps } from './stats';

const pokemon = (changements: Partial<PokemonPossede> = {}): PokemonPossede => ({
  uid: 'cible', numero: 1, niveau: 10, xp: 0, shiny: false, bonheur: 0, pierreEternelle: false, calcium: 0,
  sexe: 'sansSexe', favori: false, ...changements,
});
const region = (cible = pokemon(), argent = 50_000, inventaire: Record<string, number> = {}): DonneesRegion => ({
  equipe: [cible, pokemon({ uid: 'autre' })], pc: [pokemon({ uid: 'pc', numero: 6 })], argent, inventaire,
}) as unknown as DonneesRegion;

describe('objets tenus : données', () => {
  it('couvre les 18 types, un objet par type', () => {
    const types = OBJETS_TENUS.map(o => o.type);
    expect(new Set(types).size).toBe(18);
    expect(() => types.forEach(nomType)).not.toThrow();
    expect(PRIX_OBJET_TENU).toBe(20_000);
  });
  it('refuse un fichier invalide', () => {
    expect(() => chargerObjetsTenus({ version: 1, prix: -1, bonus: 0.05, objets: [] })).toThrow();
    expect(() => chargerObjetsTenus({ version: 1, prix: 1, bonus: 0.05, objets: [{ id: 'a', nom: 'A', type: 'fire' }, { id: 'a', nom: 'B', type: 'water' }] })).toThrow();
  });
});

describe('objets tenus : effet', () => {
  it('ne s’applique qu’au type du Pokémon (Bulbizarre : plante/poison)', () => {
    expect(facteurObjetTenu('graine-miracle', ['grass', 'poison'])).toBe(1.05);
    expect(facteurObjetTenu('pic-venin', ['grass', 'poison'])).toBe(1.05);
    expect(facteurObjetTenu('charbon', ['grass', 'poison'])).toBe(1);
    expect(facteurObjetTenu('inconnu', ['grass'])).toBe(1);
    expect(facteurObjetTenu(undefined, ['grass'])).toBe(1);
  });
  it('multiplie le DPS et le détail, sans bonus sur un autre type', () => {
    const base = calculerDps({ numero: 1, niveau: 10 });
    expect(calculerDps({ numero: 1, niveau: 10, objetTenu: 'graine-miracle' })).toBeCloseTo(base * 1.05);
    expect(calculerDps({ numero: 1, niveau: 10, objetTenu: 'charbon' })).toBeCloseTo(base);
    expect(detailDps(pokemon({ objetTenu: 'graine-miracle' }), 1).objetTenu).toBe(1.05);
    expect(detailDps(pokemon(), 1).objetTenu).toBe(1);
  });
  it('liste les objets compatibles avec les types de l’espèce', () => {
    const types = chargerPokemon().parNumero(6).types;
    expect(objetsCompatibles(types).map(o => o.id).sort()).toEqual(['bec-pointu', 'charbon']);
  });
});

describe('objets tenus : donner et retirer', () => {
  it('achète l’objet quand le stock est vide', () => {
    const r = donnerObjetTenu(region(), 'cible', 'graine-miracle');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.region.argent).toBe(30_000);
    expect(r.region.equipe[0]?.objetTenu).toBe('graine-miracle');
    expect(r.region.equipe[1]?.objetTenu).toBeUndefined();
  });
  it('utilise le stock sans payer', () => {
    const r = donnerObjetTenu(region(pokemon(), 5, { [cleStock('aimant')]: 0, [cleStock('pic-venin')]: 2 }), 'cible', 'pic-venin');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.region.argent).toBe(5);
    expect(r.region.inventaire[cleStock('pic-venin')]).toBe(1);
  });
  it.each([
    ['type incompatible', region(), 'charbon', 'Pokémon incompatible !'],
    ['objet inconnu', region(), 'rien', 'Objet inconnu !'],
    ['pas assez d’argent', region(pokemon(), 19_999), 'pic-venin', 'Pas assez d’argent !'],
    ['déjà un objet', region(pokemon({ objetTenu: 'pic-venin' })), 'graine-miracle', 'Retire d’abord l’objet tenu !'],
    ['Pierre Stase', region(pokemon({ pierreEternelle: true })), 'pic-venin', 'La Pierre Stase est déjà tenue !'],
    ['œuf', region(pokemon({ oeuf: { pasRestants: 1, pasMax: 2 } })), 'pic-venin', 'Pokémon invalide !'],
  ])('refuse : %s', (_nom, entree, id, raison) => {
    const r = donnerObjetTenu(entree, 'cible', id);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.raison).toBe(raison);
  });
  it('rend l’objet à l’inventaire en le retirant', () => {
    const donne = donnerObjetTenu(region(), 'cible', 'pic-venin');
    if (!donne.ok) throw new Error('attendu');
    const r = retirerObjetTenu(donne.region, 'cible');
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.region.equipe[0]?.objetTenu).toBeUndefined();
    expect('objetTenu' in (r.region.equipe[0] ?? {})).toBe(false);
    expect(r.region.inventaire[cleStock('pic-venin')]).toBe(1);
    expect(retirerObjetTenu(r.region, 'cible').ok).toBe(false);
  });
  it('la Pierre Stase ne se pose pas sur un Pokémon qui tient un objet', () => {
    const entree = region(pokemon({ objetTenu: 'pic-venin' }), 0, { everstone: 1 });
    const r = poserStase(entree, 'cible');
    expect(r.ok).toBe(false);
  });
});

describe('objets tenus : relâcher et sauvegarde', () => {
  it('relâcher rend l’objet tenu', () => {
    const entree = region(pokemon({ objetTenu: 'pic-venin' }));
    const r = relacherPokemon(entree, 'cible');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.region.inventaire[cleStock('pic-venin')]).toBe(1);
    const lot = relacherLot({ ...entree, pc: [pokemon({ uid: 'a', objetTenu: 'charbon' }), pokemon({ uid: 'b', objetTenu: 'charbon' })] }, ['a', 'b']);
    expect(lot.ok).toBe(true);
    if (lot.ok) expect(lot.region.inventaire[cleStock('charbon')]).toBe(2);
  });
  it('la validation garde un objet valide et retire une valeur illisible', () => {
    const bon = { ...pokemon({ objetTenu: 'pic-venin' }) };
    validerPokemonPossede(bon);
    expect(bon.objetTenu).toBe('pic-venin');
    const mauvais = { ...pokemon(), objetTenu: 12 } as unknown as PokemonPossede;
    validerPokemonPossede(mauvais);
    expect('objetTenu' in mauvais).toBe(false);
    const sur = { ...pokemon({ objetTenu: 'a:b' }) };
    validerPokemonPossede(sur);
    expect(sur.objetTenu).toBeUndefined();
  });
});
