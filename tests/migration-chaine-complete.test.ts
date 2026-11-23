import { describe, expect, it } from 'vitest';
import { creerGestionnaire, creerStockageMemoire } from '../src/core/sauvegarde';
import { creerHorlogeSimulee } from '../src/core/clock';
import { VERSION_ACTUELLE } from '../src/core/sauvegarde-types';
import { sansCle } from '../src/core/sans-cle';
import partieV1 from '../src/core/migrations/__fixtures__/partie-v1.json';
import partieV2 from '../src/core/migrations/__fixtures__/partie-v2.json';
import partieV3 from '../src/core/migrations/__fixtures__/partie-v3.json';
import regionV1 from '../src/core/migrations/__fixtures__/region-v1.json';
import regionV2 from '../src/core/migrations/__fixtures__/region-v2.json';
import regionV4 from '../src/core/migrations/__fixtures__/region-v4.json';
import compteV1 from '../src/core/migrations/__fixtures__/compte-v1.json';
import compteV2 from '../src/core/migrations/__fixtures__/compte-v2.json';

/**
 * Anciennes sauvegardes (versions 1 à 5) lues par le vrai chemin de chargement (stockage → migration → validation) :
 * la version atteinte est l'actuelle et aucune donnée de jeu n'est perdue.
 * Les versions 3 et 5 de région n'ont pas de fixture propre : elles sont dérivées des fixtures voisines (v2 et v4).
 */
type Enveloppe = { version: number; niveau: string; id: string; revision: number; ecritLe: string; donnees: Record<string, unknown> };
const copie = <T,>(valeur: T): T => structuredClone(valeur);
const ecritLeV5 = '2026-11-19T12:00:00.000Z';

function gestionnaire() {
  const stockage = creerStockageMemoire();
  const g = creerGestionnaire({ stockage, horloge: creerHorlogeSimulee(1_760_000_000_000), genererId: () => 'neuf' });
  return { g, stockage };
}

// Une région v5 : mêmes champs que la v4, mais les chronos sont déjà des durées restantes (millisecondes).
const regionV5: Enveloppe = {
  ...copie(regionV4) as unknown as Enveloppe,
  version: 5,
  donnees: { ...copie(regionV4.donnees) as Record<string, unknown>, chronos: { finRepousse: 60_000, finSuperRepousse: 0, finBoostAttaque: 0, finBoostAttaqueSpeciale: 1, rechargeFauchage: 60_000 } },
};
const regionV3: Enveloppe = { ...copie(regionV2) as unknown as Enveloppe, version: 3 };

const regions: [string, Enveloppe][] = [
  ['v1', regionV1 as unknown as Enveloppe], ['v2', regionV2 as unknown as Enveloppe], ['v3', regionV3],
  ['v4', regionV4 as unknown as Enveloppe], ['v5', regionV5],
];

describe('migration complète des régions (versions 1 à 5 → actuelle)', () => {
  it.each(regions)('région %s : version actuelle et aucune donnée de jeu perdue', (_nom, source) => {
    const { g, stockage } = gestionnaire();
    stockage.ecrire('pokiclicker:region:ancienne-partie:kanto', JSON.stringify({ ...source, ecritLe: source.version === 5 ? ecritLeV5 : source.ecritLe }));
    const lue = g.chargerRegion('ancienne-partie', 'kanto');
    expect(lue).not.toBeNull();
    expect(lue!.version).toBe(VERSION_ACTUELLE);
    // Tout ce que le joueur possède : identique champ à champ (la migration n'ajoute que des valeurs par défaut).
    expect(lue!.donnees).toMatchObject(sansCle(sansCle(source.donnees, 'chronos'), 'futur'));
    expect(lue!.donnees).toHaveProperty('statistiques');
  });

  it('région v4 : les chronos absolus deviennent des durées restantes bornées, jamais négatives', () => {
    const { g, stockage } = gestionnaire();
    stockage.ecrire('pokiclicker:region:ancienne-partie:kanto', JSON.stringify(regionV4));
    const chronos = (g.chargerRegion('ancienne-partie', 'kanto')!.donnees as unknown as { chronos: Record<string, number> }).chronos;
    expect(chronos.finRepousse).toBe(60_000);
    expect(chronos.finSuperRepousse).toBe(0);
    for (const valeur of Object.values(chronos)) expect(valeur).toBeGreaterThanOrEqual(0);
  });

  it('une région v1 relue puis réécrite reste identique au bout d\'un second aller-retour (migration idempotente)', () => {
    const { g, stockage } = gestionnaire();
    stockage.ecrire('pokiclicker:region:ancienne-partie:kanto', JSON.stringify(regionV1));
    const premiere = g.chargerRegion('ancienne-partie', 'kanto')!;
    stockage.ecrire('pokiclicker:region:ancienne-partie:kanto', JSON.stringify(premiere));
    expect(g.chargerRegion('ancienne-partie', 'kanto')).toEqual(premiere);
  });
});

// v4 et v5 : la partie v3 avec la liste des Pokémon vus que la marche 3 → 4 a introduite (Pokédex + PC global, sans l'œuf).
const partieV4: Enveloppe = { ...copie(partieV3) as unknown as Enveloppe, version: 4 };
partieV4.donnees = { ...partieV4.donnees, vus: [1, 25, 16] };
const parties: [string, Enveloppe][] = [
  ['v1', partieV1 as unknown as Enveloppe], ['v2', partieV2 as unknown as Enveloppe], ['v3', partieV3 as unknown as Enveloppe],
  ['v4', partieV4], ['v5', { ...copie(partieV4), version: 5 }],
];

describe('migration complète des parties (versions 1 à 5 → actuelle ; la version 0 n\'est plus migrable, voir migrations.test.ts)', () => {
  it.each(parties)('partie %s : version actuelle, nom, PC global, Pokédex et drapeaux conservés', (_nom, source) => {
    const { g, stockage } = gestionnaire();
    stockage.ecrire('pokiclicker:partie:ancienne-partie', JSON.stringify(source));
    const lue = g.chargerPartie('ancienne-partie');
    expect(lue).not.toBeNull();
    expect(lue!.version).toBe(VERSION_ACTUELLE);
    const donnees = lue!.donnees as unknown as Record<string, unknown>;
    expect(donnees.regionCourante).toBe('kanto');
    expect(donnees.regionsDebloquees).toEqual(['kanto', 'johto']);
    expect(donnees.drapeaux).toEqual(['chen-rencontre']);
    expect(donnees.nom).toBe('Aventure conservée');
    const pokedex = donnees.pokedexNational as number[];
    for (const numero of [1, 25]) expect(pokedex).toContain(numero);
    const uids = (donnees.pcGlobal as { uid: string }[]).map(p => p.uid);
    expect(uids).toContain('pikachu');
    // Vus = Pokédex + PC global, sans les œufs.
    const src = source.donnees as { pokedexNational: number[]; pcGlobal: { numero: number; oeuf?: unknown }[] };
    const attendus = new Set([...src.pokedexNational, ...src.pcGlobal.filter(p => !p.oeuf).map(p => p.numero)]);
    expect([...(donnees.vus as number[])].sort((a, b) => a - b)).toEqual([...attendus].sort((a, b) => a - b));
  });
});

describe('migration des comptes (versions 1 et 2 → actuelle)', () => {
  it.each([['v1', compteV1], ['v2', compteV2]])('compte %s : version actuelle, diamants, succès et skins conservés', (_nom, source) => {
    const { g, stockage } = gestionnaire();
    stockage.ecrire('pokiclicker:compte:local', JSON.stringify(source));
    const lu = g.chargerCompte();
    expect(lu).not.toBeNull();
    expect(lu!.version).toBe(VERSION_ACTUELLE);
    const attendu = source.donnees as Record<string, unknown>;
    expect(lu!.donnees).toMatchObject({ diamants: attendu.diamants ?? 0 });
    for (const cle of ['succes', 'skins']) if (cle in attendu) expect(lu!.donnees).toMatchObject({ [cle]: attendu[cle] });
  });
});
