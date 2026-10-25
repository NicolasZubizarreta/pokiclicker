import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { trierPc } from '../src/core/pc';
import type { PokemonPossede } from '../src/core/sauvegarde-types';

const source = readFileSync(new URL('../legacy/js/ui/render.js', import.meta.url), 'utf8');
const sortPC = source.match(/^function sortPC\(method\) \{[\s\S]*?^\}/m)?.[0];
if (!sortPC) throw new Error('Fonction sortPC V1 introuvable');

type PokemonTest = PokemonPossede & { nom: string };
const especes: [number, string, number][] = [
  [25, 'Pikachu', 12], [29, 'Nidoran♀', 8], [122, 'M. Mime', 20],
  [35, 'Mélofée', 12], [25, 'Pikachu', 30], [32, 'Nidoran♂', 8],
  [133, 'Évoli', 20], [1, 'Bulbizarre', 5], [100, 'Voltorbe', 12],
  [101, 'Électrode', 20], [25, 'Pikachu', 12], [35, 'Mélofée', 20],
  [4, 'Salamèche', 5], [7, 'Carapuce', 5], [39, 'Rondoudou', 12],
  [29, 'Nidoran♀', 8], [32, 'Nidoran♂', 20], [122, 'M. Mime', 8],
  [133, 'Évoli', 5], [63, 'Abra', 12], [54, 'Psykokwak', 20],
  [52, 'Miaouss', 8], [37, 'Goupix', 12], [58, 'Caninos', 20],
  [25, 'Pikachu', 5], [1, 'Bulbizarre', 20], [35, 'Mélofée', 12],
  [122, 'M. Mime', 20], [133, 'Évoli', 20], [150, 'Mewtwo', 30],
];
const pc: PokemonTest[] = especes.map(([numero, nom, niveau], index) => ({
  uid: `pc-${index + 1}`, numero, nom, niveau,
  xp: 0, bonheur: 0, pierreEternelle: false, calcium: 0, sexe: 'sansSexe',
  favori: [0, 4, 15, 27].includes(index),
  shiny: [0, 4, 10].includes(index),
  ...(index === 18 ? { surnom: 'Éclair' } : index === 24 ? { surnom: 'Mélofée' } : {}),
}));
const nomDe = (pokemon: PokemonTest) => pokemon.surnom ?? pokemon.nom;
const uids = (pokemons: readonly { uid: string }[]) => pokemons.map(pokemon => pokemon.uid);

function ordreV1(method: string): string[] {
  const state = {
    pc: pc.map(pokemon => ({
      id: pokemon.numero, name: nomDe(pokemon), level: pokemon.niveau,
      isFavorite: pokemon.favori, uid: pokemon.uid,
    })),
    pcPage: 3,
  };
  runInNewContext(`${sortPC}\nsortPC(method);`, { state, method, renderPC: () => {} });
  return uids(state.pc);
}

describe('tris du PC fidèles à la V1', () => {
  // localeCompare / Intl.Collator dépendent d'ICU ; le jeu n'a pas de caractère exotique.
  it.each([
    ['numero', 'id'], ['nom', 'name'], ['niveau', 'level'], ['favori', 'favorite'],
  ] as const)('%s reproduit la V1, y compris les égalités, et reste déterministe', (tri, method) => {
    const attendu = ordreV1(method);
    expect(uids(trierPc(pc, tri, nomDe))).toEqual(attendu);
    expect(uids(trierPc(pc, tri, nomDe))).toEqual(attendu);
    expect(ordreV1(method)).toEqual(attendu);
  });

  it('shiny place les shiny en premier, puis le numéro croissant et le niveau décroissant', () => {
    const attendu = [
      'pc-5', 'pc-1', 'pc-11', 'pc-26', 'pc-8', 'pc-13', 'pc-14', 'pc-25',
      'pc-2', 'pc-16', 'pc-17', 'pc-6', 'pc-12', 'pc-4', 'pc-27', 'pc-23',
      'pc-15', 'pc-22', 'pc-21', 'pc-24', 'pc-20', 'pc-9', 'pc-10',
      'pc-3', 'pc-28', 'pc-18', 'pc-7', 'pc-29', 'pc-19', 'pc-30',
    ];
    expect(uids(trierPc(pc, 'shiny', nomDe))).toEqual(attendu);
    expect(uids(trierPc(pc, 'shiny', nomDe))).toEqual(attendu);
  });
});
