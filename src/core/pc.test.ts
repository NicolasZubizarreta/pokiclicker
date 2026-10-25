import { describe, expect, it } from 'vitest';
import { accesPc, filtrerPc, normaliserRecherche, trierPc } from './pc';
import type { TriPc } from './pc';
import type { EtatMonde } from './conditions';
import { kanto } from './regions';
import { reglages } from './reglages';
import type { PokemonPossede } from './sauvegarde-types';

const pokemon = (uid: string, numero: number, niveau: number, nom: string, favori = false, shiny = false) =>
  Object.freeze({ uid, numero, niveau, nom, favori, shiny, xp: 0, bonheur: 0,
    pierreEternelle: false, calcium: 0, sexe: 'sansSexe' as const });
const pc = Object.freeze([
  pokemon('a', 25, 5, 'Pikachu'),
  pokemon('b', 35, 10, 'Mélofée', true),
  pokemon('c', 25, 10, 'Pikachu', false, true),
  pokemon('d', 25, 10, 'Pikachu', true, true),
  pokemon('e', 101, 5, 'Électrode'),
  pokemon('f', 125, 10, 'Élektek', false, true),
  pokemon('g', 25, 5, 'Pikachu', true),
]);
const nomDe = (p: typeof pc[number]) => p.nom;
const uids = (liste: readonly PokemonPossede[]) => liste.map(p => p.uid);

describe('trierPc', () => {
  it.each<[TriPc, string[]]>([
    ['numero', ['c', 'd', 'a', 'g', 'b', 'e', 'f']],
    ['nom', ['e', 'f', 'b', 'c', 'd', 'a', 'g']],
    ['niveau', ['c', 'd', 'b', 'f', 'a', 'g', 'e']],
    ['favori', ['d', 'g', 'b', 'a', 'c', 'e', 'f']],
    ['shiny', ['c', 'd', 'f', 'a', 'g', 'b', 'e']],
  ])('%s : critères secondaires, stabilité et absence de mutation', (tri, attendu) => {
    const resultat = trierPc(pc, tri, nomDe);
    expect(uids(resultat)).toEqual(attendu);
    expect(resultat).not.toBe(pc);
    expect(uids(pc)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g']);
    expect(uids(trierPc(pc, tri, nomDe))).toEqual(attendu);
  });
  it('trie sur le nom fourni par l’appelant', () => {
    expect(uids(trierPc(pc, 'nom', p => p.uid === 'e' ? 'Ami' : p.nom))[0]).toBe('e');
  });
});

describe('filtrerPc', () => {
  it('normalise accents, casse et espaces', () => {
    expect(normaliserRecherche('  MÉLO  ')).toBe('melo');
  });
  it.each([
    ['élec', ['e']], ['MÉLO', ['b']],
    ['25', ['a', 'c', 'd', 'g']], ['#25', ['a', 'c', 'd', 'g']],
    ['n° 25', ['a', 'c', 'd', 'g']], [' # 25 ', ['a', 'c', 'd', 'g']],
    ['', ['a', 'b', 'c', 'd', 'e', 'f', 'g']],
    ['   ', ['a', 'b', 'c', 'd', 'e', 'f', 'g']], ['absent', []],
  ])('%s : résultat dans l’ordre d’entrée', (texte, attendu) => {
    expect(uids(filtrerPc(pc, texte, nomDe))).toEqual(attendu);
  });
  it('cherche le surnom et l’espèce même quand le Pokémon est renommé', () => {
    const nom = (p: typeof pc[number]) => p.uid === 'e' ? 'Boule' : p.nom;
    expect(uids(filtrerPc(pc, 'boule', nom, nomDe))).toEqual(['e']);
    expect(uids(filtrerPc(pc, 'élec', nom, nomDe))).toEqual(['e']);
  });
});

describe('accesPc', () => {
  const vide: EtatMonde = { badges: [], bossVaincus: [], objets: [], quetes: [], drapeaux: [] };

  it('refuse avec la raison tant que l’Arène d’Argenta est fermée', () => {
    const raison = { ok: false, raison: reglages.pc.raison };
    expect(accesPc(kanto, vide)).toEqual(raison);
    expect(accesPc(kanto, { ...vide, bossVaincus: ['kanto.route-1'] })).toEqual(raison);
  });

  it('ouvre dès que l’Arène d’Argenta est ouverte', () => {
    expect(kanto.zone(reglages.pc.zone)).toBeTruthy();
    expect(accesPc(kanto, { ...vide, bossVaincus: ['kanto.route-1', 'kanto.foret-de-jade'] })).toEqual({ ok: true });
  });
});
