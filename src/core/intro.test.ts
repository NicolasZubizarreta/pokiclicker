import { describe, expect, it } from 'vitest';
import { blocage, commandeCourante, declencher, etapeTerminee } from './evenements';
import { evenementsKanto as catalogue } from './evenements-kanto';
import { regionInitiale } from './sauvegarde';
import type { DonneesRegion } from './sauvegarde-types';
import { choisirStarter, creerStarter } from './starter';

const debut = { type: 'debut-partie' } as const;
const textes = [
  'Salutations ! Bienvenue dans le monde merveilleux des Pokémon !',
  "Mon nom est Chen. Les gens m'appellent souvent le Professeur Pokémon.",
  "Ce monde est peuplé de créatures appelées Pokémon. Pour certains, ce sont des animaux domestiques, pour d'autres, des partenaires de combat.",
  'Pour les apprivoiser il ne suffit pas de les regarder... Il faut les capturer ! Tiens, voici 5 Pokéballs pour te lancer.',
  "Quant à moi... J'étudie les Pokémon comme profession. Mais je suis trop vieux maintenant. J'ai besoin de toi pour compléter le Pokédex !",
  "Le monde est vaste. Pour t'aider à te repérer entre les différentes zones, je te confie aussi cette Carte de la Région.",
  "Mais c'est dangereux de partir dans les hautes herbes sans protection ! J'ai ici trois Pokémon rares. Choisis-en un, il t'accompagnera dans ton voyage.",
];
const poses = ['chen-1', 'chen-1', 'chen-2', 'chen-2', 'chen-3', 'chen-3', 'chen-3'];
const blocageIntro = { ok: false, raison: "Va d'abord voir le Prof. Chen au labo." };
const nouvellePartie = () => ({
  ...regionInitiale('kanto', 'kanto.bourg-palette'), drapeaux: ['nouvelle-partie'],
});

function verifier(region: DonneesRegion, index: number) {
  expect(region.inventaire.pokeball ?? 0).toBe(index >= 3 ? 5 : 0);
  expect(region.drapeaux.includes('sac-ouvert')).toBe(index >= 3);
  expect(region.drapeaux.includes('carte-ouverte')).toBe(index >= 5);
  expect(blocage(catalogue, region, 'kanto.route-1')).toEqual(blocageIntro);
}

function acquitter(region: DonneesRegion, index: number) {
  const commande = commandeCourante(catalogue, region);
  expect(commande).toMatchObject({
    type: 'dialogue', evenement: 'kanto.intro', locuteur: 'Prof. Chen',
    texte: textes[index], pose: poses[index],
  });
  if (!commande) throw new Error('Dialogue absent');
  const avant = structuredClone(region);
  const suite = etapeTerminee(catalogue, region, commande);
  expect(region).toEqual(avant);
  expect(etapeTerminee(catalogue, suite, commande)).toBe(suite);
  verifier(suite, Math.min(index + 1, 6));
  return suite;
}

describe('intro de Chen', () => {
  it('joue les sept lignes V1 avec leurs poses, dons et verrous au bon index', () => {
    const initiale = nouvellePartie();
    const avant = structuredClone(initiale);
    let region = declencher(catalogue, initiale, debut);
    expect(initiale).toEqual(avant);
    verifier(region, 0);
    for (let index = 0; index < 7; index++) region = acquitter(region, index);
    expect(commandeCourante(catalogue, region)).toBeNull();
    expect(region.evenementEnCours).toBeUndefined();
    expect(region.evenementsJoues).toEqual(['kanto.intro']);
    expect(region.drapeaux).toContain('nouvelle-partie');
    expect(declencher(catalogue, region, debut)).toBe(region);
    const choisi = choisirStarter(region, creerStarter(4, false, () => 0.5, () => 'starter-4'));
    expect(blocage(catalogue, choisi, 'kanto.route-1')).toEqual({ ok: true });
    expect(blocage(catalogue, region, 'kanto.route-1')).toEqual(blocageIntro);
  });

  it.each([0, 1, 2, 3, 4, 5, 6])('reprend à la ligne %s après JSON sans redonner', index => {
    let region = declencher(catalogue, nouvellePartie(), debut);
    for (let ligne = 0; ligne < index; ligne++) region = acquitter(region, ligne);
    const reprise: DonneesRegion = JSON.parse(JSON.stringify(region));
    expect(commandeCourante(catalogue, reprise)).toEqual(commandeCourante(catalogue, region));
    region = declencher(catalogue, reprise, debut);
    expect(region).toEqual(reprise);
    verifier(region, index);
    for (let ligne = index; ligne < 7; ligne++) region = acquitter(region, ligne);
    const fin: DonneesRegion = JSON.parse(JSON.stringify(region));
    expect(declencher(catalogue, fin, debut)).toBe(fin);
    expect(fin.inventaire.pokeball).toBe(5);
    expect(fin.evenementsJoues).toEqual(['kanto.intro']);
  });

  it('ne déclenche rien sans le marqueur de nouvelle partie', () => {
    const region = regionInitiale('kanto', 'kanto.bourg-palette');
    expect(declencher(catalogue, region, debut)).toBe(region);
    expect(commandeCourante(catalogue, region)).toBeNull();
    expect(region.evenementsJoues).toEqual([]);
    expect(region.inventaire.pokeball ?? 0).toBe(0);
    expect(region.drapeaux).toEqual([]);
    expect(blocage(catalogue, region, 'kanto.route-1')).toEqual({ ok: true });
  });
});
